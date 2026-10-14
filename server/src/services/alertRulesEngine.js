const Alert = require('../models/Alert');
const Vessel = require('../models/Vessel');
const Voyage = require('../models/Voyage');
const FuelRecord = require('../models/FuelRecord');
const MaintenanceTask = require('../models/MaintenanceTask');
const CargoShipment = require('../models/CargoShipment');
const Settings = require('../models/Settings');
const { distanceToPolylineNm } = require('../utils/distanceCalc');

/**
 * Helper to create an alert if an unresolved one does not already exist.
 */
async function createAlertIfNotExists({ type, severity, vessel, voyage, cargo, reason, recommendedAction }) {
  const query = {
    type,
    status: { $in: ['Open', 'Acknowledged'] },
  };
  if (vessel) query.vessel = vessel;
  if (voyage) query.voyage = voyage;
  if (cargo) query.cargo = cargo;

  const existing = await Alert.findOne(query);
  if (!existing) {
    return await Alert.create({
      type,
      severity,
      vessel,
      voyage,
      cargo,
      reason,
      recommendedAction,
      status: 'Open',
    });
  }
  return null;
}

/**
 * Runs the central alert rules evaluation against the current database state.
 */
async function evaluateAllAlerts() {
  const settings = await Settings.getSettings();
  const createdAlerts = [];

  // 1. Check Delayed Voyages
  const activeVoyages = await Voyage.find({
    status: { $in: ['In Progress', 'Delayed', 'Planned'] },
  }).populate('vessel');

  for (const voyage of activeVoyages) {
    const isDelayedStatus = voyage.status === 'Delayed';
    const hasDelayHours = (voyage.delayHours || 0) >= settings.delayThresholdHours;
    const pastEta =
      voyage.estimatedArrival &&
      new Date(voyage.estimatedArrival) < new Date() &&
      voyage.status !== 'Completed';

    if (isDelayedStatus || hasDelayHours || pastEta) {
      const delayHrs = voyage.delayHours || (pastEta ? Math.round((new Date() - new Date(voyage.estimatedArrival)) / 3600000) : settings.delayThresholdHours);
      const alert = await createAlertIfNotExists({
        type: 'DelayedArrival',
        severity: delayHrs > 24 ? 'Critical' : 'High',
        vessel: voyage.vessel?._id || voyage.vessel,
        voyage: voyage._id,
        reason: `Voyage ${voyage.voyageNo} is delayed by approximately ${delayHrs} hours past planned ETA schedule.`,
        recommendedAction: 'Adjust transit speed, notify terminal port authority of revised ETA window, and alert downstream logistics.',
      });
      if (alert) createdAlerts.push(alert);
    }
  }

  // 2. Check Overdue Maintenance Tasks
  const overdueTasks = await MaintenanceTask.find({
    status: { $in: ['Overdue', 'Scheduled', 'In Progress'] },
    scheduledDate: { $lt: new Date() },
  }).populate('vessel');

  for (const task of overdueTasks) {
    // Ensure task status marked overdue
    if (task.status !== 'Overdue') {
      task.status = 'Overdue';
      await task.save();
    }
    const daysOverdue = Math.max(1, Math.round((new Date() - new Date(task.scheduledDate)) / (1000 * 3600 * 24)));
    const alert = await createAlertIfNotExists({
      type: 'OverdueMaintenance',
      severity: task.priority === 'Critical' || daysOverdue > 14 ? 'Critical' : 'High',
      vessel: task.vessel?._id || task.vessel,
      reason: `Maintenance task '${task.equipment}' (${task.taskType}) is overdue by ${daysOverdue} day(s).`,
      recommendedAction: 'Assign marine engineering team to complete inspection or schedule shore-side technical assistance at next port of call.',
    });
    if (alert) createdAlerts.push(alert);
  }

  // 3. Check High Fuel Consumption
  // Compare recent fuel records against planned consumption or baseline
  const recentFuelRecords = await FuelRecord.find({})
    .sort({ date: -1 })
    .limit(30)
    .populate('vessel')
    .populate('voyage');

  for (const record of recentFuelRecords) {
    if (record.voyage && record.voyage.plannedFuelTons > 0) {
      const planned = record.voyage.plannedFuelTons;
      const actual = record.quantityTons;
      const overusePercent = ((actual - planned) / planned) * 100;

      if (overusePercent >= settings.fuelOverusePercent) {
        const alert = await createAlertIfNotExists({
          type: 'HighFuel',
          severity: overusePercent > 30 ? 'High' : 'Warning',
          vessel: record.vessel?._id || record.vessel,
          voyage: record.voyage._id,
          reason: `Fuel consumption of ${actual.toFixed(1)} MT exceeds planned allocation (${planned.toFixed(1)} MT) by ${overusePercent.toFixed(1)}%.`,
          recommendedAction: 'Verify vessel speed/trim optimization, check hull fouling status, and consider eco-speed steaming profile.',
        });
        if (alert) createdAlerts.push(alert);
      }
    }
  }

  // 4. Check Low Fleet Availability
  const totalVessels = await Vessel.countDocuments();
  if (totalVessels > 0) {
    const activeVessels = await Vessel.countDocuments({ status: 'Active' });
    const availabilityPercent = (activeVessels / totalVessels) * 100;

    if (availabilityPercent < settings.minFleetAvailabilityPercent) {
      const alert = await createAlertIfNotExists({
        type: 'LowAvailability',
        severity: availabilityPercent < 50 ? 'Critical' : 'Warning',
        reason: `Fleet availability is at ${availabilityPercent.toFixed(1)}% (${activeVessels}/${totalVessels} vessels active), below ${settings.minFleetAvailabilityPercent}% target.`,
        recommendedAction: 'Expedite ongoing drydock/port turnaround and review maintenance schedules to restore operational capacity.',
      });
      if (alert) createdAlerts.push(alert);
    }
  }

  // 5. Check Cargo Delivery Risk
  const activeCargo = await CargoShipment.find({
    status: { $in: ['Loaded', 'In Transit'] },
    voyage: { $exists: true, $ne: null },
  }).populate('voyage').populate('vessel');

  for (const cargo of activeCargo) {
    if (cargo.voyage && (cargo.voyage.status === 'Delayed' || (cargo.voyage.delayHours || 0) > 0)) {
      if (cargo.status !== 'Delayed') {
        cargo.status = 'Delayed';
        await cargo.save();
      }
      const alert = await createAlertIfNotExists({
        type: 'CargoRisk',
        severity: 'Warning',
        vessel: cargo.vessel?._id || cargo.vessel,
        voyage: cargo.voyage._id,
        cargo: cargo._id,
        reason: `Shipment ${cargo.shipmentNo} (${cargo.cargoType}) transit delayed due to delay on Voyage ${cargo.voyage.voyageNo}.`,
        recommendedAction: 'Inform cargo consignee of schedule delay, update port handling slots, and review priority discharge order.',
      });
      if (alert) createdAlerts.push(alert);
    }
  }

  // 6. Check Route Deviation
  for (const voyage of activeVoyages) {
    if (voyage.status === 'In Progress' && voyage.vessel) {
      const vessel = voyage.vessel;
      if (vessel.lastKnownPosition && vessel.lastKnownPosition.lat != null) {
        const polyline = [
          voyage.origin,
          ...(voyage.waypoints || []),
          voyage.destination,
        ].filter((p) => p && p.lat != null && p.lng != null);

        if (polyline.length >= 2) {
          const deviationNm = distanceToPolylineNm(vessel.lastKnownPosition, polyline);
          if (deviationNm >= settings.routeDeviationNm) {
            const alert = await createAlertIfNotExists({
              type: 'RouteDeviation',
              severity: deviationNm > settings.routeDeviationNm * 2 ? 'High' : 'Warning',
              vessel: vessel._id,
              voyage: voyage._id,
              reason: `Vessel ${vessel.name} is ${deviationNm.toFixed(1)} NM off planned route corridor (threshold: ${settings.routeDeviationNm} NM).`,
              recommendedAction: 'Establish bridge communications to verify navigational plan, weather avoidance maneuvers, or uncharted hazard.',
            });
            if (alert) createdAlerts.push(alert);
          }
        }
      }
    }
  }

  return {
    evaluatedAt: new Date(),
    newAlertsCount: createdAlerts.length,
    alerts: createdAlerts,
  };
}

module.exports = {
  evaluateAllAlerts,
  createAlertIfNotExists,
};
