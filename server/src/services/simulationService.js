const Vessel = require('../models/Vessel');
const Voyage = require('../models/Voyage');
const PositionReport = require('../models/PositionReport');
const FuelRecord = require('../models/FuelRecord');
const Settings = require('../models/Settings');
const { calculateHeading, haversineDistanceNm } = require('../utils/distanceCalc');
const { evaluateAllAlerts } = require('./alertRulesEngine');

class SimulationService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.intervalMs = 5000; // 5 seconds per tick
    this.tickCount = 0;
    this.lastTick = null;
    this.updatedVesselsCount = 0;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      tickCount: this.tickCount,
      lastTick: this.lastTick,
      updatedVesselsCount: this.updatedVesselsCount,
      mode: 'DEMO / SIMULATED MARITIME ENGINE',
    };
  }

  start(intervalMs = 5000) {
    if (this.isRunning) return this.getStatus();
    this.intervalMs = intervalMs;
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.step().catch((err) => {
        console.error('[Simulation Error]:', err.message);
      });
    }, this.intervalMs);
    console.log(`[Simulation] Engine started with interval ${this.intervalMs}ms`);
    return this.getStatus();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[Simulation] Engine stopped');
    return this.getStatus();
  }

  /**
   * Performs one discrete simulation progression tick
   */
  async step() {
    this.tickCount++;
    this.lastTick = new Date();

    const activeVoyages = await Voyage.find({ status: 'In Progress' }).populate('vessel');
    const settings = await Settings.getSettings();
    let movedCount = 0;

    for (const voyage of activeVoyages) {
      if (!voyage.vessel) continue;

      const polyline = [
        voyage.origin,
        ...(voyage.waypoints || []),
        voyage.destination,
      ].filter((p) => p && p.lat != null && p.lng != null);

      if (polyline.length < 2) continue;

      // Advance progress percent by 2% per tick (or wraps around for continuous demo)
      let nextProgress = (voyage.progressPercent || 0) + 2.5;

      if (nextProgress >= 100) {
        // Complete voyage or reset to demonstration loop
        nextProgress = 100;
        voyage.progressPercent = 100;
        voyage.status = 'Completed';
        voyage.actualArrival = new Date();
        await voyage.save();

        // Update vessel status to In Port
        await Vessel.findByIdAndUpdate(voyage.vessel._id, {
          status: 'In Port',
          'lastKnownPosition.lat': voyage.destination.lat,
          'lastKnownPosition.lng': voyage.destination.lng,
          'lastKnownPosition.speedKnots': 0,
          'lastKnownPosition.updatedAt': new Date(),
          'lastKnownPosition.source': 'demo-simulated',
        });
        movedCount++;
        continue;
      }

      // Interpolate position along polyline according to fraction
      const fraction = nextProgress / 100;
      const targetPosition = interpolatePolyline(polyline, fraction);

      // Determine heading towards target or next point
      const prevLat = voyage.vessel.lastKnownPosition?.lat || polyline[0].lat;
      const prevLng = voyage.vessel.lastKnownPosition?.lng || polyline[0].lng;
      const heading = calculateHeading(prevLat, prevLng, targetPosition.lat, targetPosition.lng);
      const simulatedSpeed = Number((16 + Math.sin(this.tickCount) * 2.5).toFixed(1));

      voyage.progressPercent = Number(nextProgress.toFixed(1));
      await voyage.save();

      // Update Vessel position and engine hours
      await Vessel.findByIdAndUpdate(voyage.vessel._id, {
        $inc: { engineRunningHours: 0.5 },
        $set: {
          'lastKnownPosition.lat': Number(targetPosition.lat.toFixed(5)),
          'lastKnownPosition.lng': Number(targetPosition.lng.toFixed(5)),
          'lastKnownPosition.speedKnots': simulatedSpeed,
          'lastKnownPosition.heading': heading,
          'lastKnownPosition.updatedAt': new Date(),
          'lastKnownPosition.source': 'demo-simulated',
        },
      });

      // Append PositionReport history
      await PositionReport.create({
        vessel: voyage.vessel._id,
        voyage: voyage._id,
        lat: Number(targetPosition.lat.toFixed(5)),
        lng: Number(targetPosition.lng.toFixed(5)),
        speedKnots: simulatedSpeed,
        heading,
        timestamp: new Date(),
        source: 'demo-simulated',
      });

      // Log simulated fuel consumption increment periodically (every 4 ticks = ~20s)
      if (this.tickCount % 4 === 0) {
        const fuelQty = Number((1.2 + Math.random() * 0.4).toFixed(2));
        const distanceStep = Number((simulatedSpeed * (this.intervalMs / 3600000)).toFixed(2));
        await FuelRecord.create({
          vessel: voyage.vessel._id,
          voyage: voyage._id,
          date: new Date(),
          fuelType: 'VLSFO',
          quantityTons: fuelQty,
          pricePerTon: settings.fuelPricePerTon || 650,
          distanceNm: Math.max(distanceStep, 5),
          source: 'simulated',
        });
      }

      movedCount++;
    }

    this.updatedVesselsCount = movedCount;

    // Run rules engine after movement
    await evaluateAllAlerts();

    return {
      success: true,
      tick: this.tickCount,
      vesselsMoved: movedCount,
      timestamp: this.lastTick,
    };
  }
}

/**
 * Interpolates coordinates along a polyline by total cumulative distance fraction (0 to 1)
 */
function interpolatePolyline(points, fraction) {
  if (fraction <= 0) return points[0];
  if (fraction >= 1) return points[points.length - 1];

  // Calculate segment lengths
  const segmentLengths = [];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = haversineDistanceNm(
      points[i].lat,
      points[i].lng,
      points[i + 1].lat,
      points[i + 1].lng
    );
    segmentLengths.push(len);
    totalLength += len;
  }

  if (totalLength === 0) return points[0];

  const targetDist = fraction * totalLength;
  let accumulated = 0;

  for (let i = 0; i < segmentLengths.length; i++) {
    const segLen = segmentLengths[i];
    if (accumulated + segLen >= targetDist) {
      const segFraction = (targetDist - accumulated) / (segLen || 1);
      const p1 = points[i];
      const p2 = points[i + 1];
      return {
        lat: p1.lat + (p2.lat - p1.lat) * segFraction,
        lng: p1.lng + (p2.lng - p1.lng) * segFraction,
      };
    }
    accumulated += segLen;
  }

  return points[points.length - 1];
}

const simulationService = new SimulationService();

module.exports = simulationService;
