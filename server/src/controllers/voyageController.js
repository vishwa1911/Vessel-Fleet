const Voyage = require('../models/Voyage');
const Vessel = require('../models/Vessel');
const PositionReport = require('../models/PositionReport');
const FuelRecord = require('../models/FuelRecord');
const CargoShipment = require('../models/CargoShipment');
const { calculateRouteDistanceNm, distanceToPolylineNm } = require('../utils/distanceCalc');
const { evaluateAllAlerts } = require('../services/alertRulesEngine');

// GET /api/voyages
const getVoyages = async (req, res, next) => {
  try {
    const {
      search,
      status,
      vessel,
      page = 1,
      limit = 10,
      sortBy = 'departureDate',
      order = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { voyageNo: { $regex: search, $options: 'i' } },
        { 'origin.name': { $regex: search, $options: 'i' } },
        { 'destination.name': { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (vessel) {
      query.vessel = vessel;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [voyages, total] = await Promise.all([
      Voyage.find(query)
        .populate('vessel', 'name imoNumber type flag status lastKnownPosition')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(take),
      Voyage.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: voyages,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/voyages/:id
const getVoyageById = async (req, res, next) => {
  try {
    const voyage = await Voyage.findById(req.params.id).populate('vessel');
    if (!voyage) {
      return res.status(404).json({
        success: false,
        message: 'Voyage not found',
        errors: ['Voyage ID does not exist'],
      });
    }

    // Fetch related positions, fuel records, cargo
    const [positions, fuelRecords, cargoShipments] = await Promise.all([
      PositionReport.find({ voyage: voyage._id }).sort({ timestamp: -1 }).limit(100),
      FuelRecord.find({ voyage: voyage._id }),
      CargoShipment.find({ voyage: voyage._id }),
    ]);

    // Planned vs Actual Metrics
    const totalActualFuel = fuelRecords.reduce((sum, r) => sum + (r.quantityTons || 0), 0);
    const totalActualCost = fuelRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);

    // Calculate route deviation of current vessel position if in progress
    let deviationNm = 0;
    if (voyage.status === 'In Progress' && voyage.vessel?.lastKnownPosition) {
      const polyline = [
        voyage.origin,
        ...(voyage.waypoints || []),
        voyage.destination,
      ].filter((p) => p && p.lat != null && p.lng != null);
      deviationNm = distanceToPolylineNm(voyage.vessel.lastKnownPosition, polyline);
    }

    res.status(200).json({
      success: true,
      data: {
        ...voyage.toObject(),
        positions,
        fuelRecords,
        cargoShipments,
        actualMetrics: {
          totalActualFuel: Number(totalActualFuel.toFixed(2)),
          totalActualCost: Number(totalActualCost.toFixed(2)),
          varianceFuelTons: Number((totalActualFuel - (voyage.plannedFuelTons || 0)).toFixed(2)),
          currentDeviationNm: deviationNm,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/voyages
const createVoyage = async (req, res, next) => {
  try {
    const {
      voyageNo,
      vessel: vesselId,
      origin,
      destination,
      waypoints = [],
      departureDate,
      estimatedArrival,
      plannedDistanceNm,
      plannedFuelTons,
      status,
    } = req.body;

    // Check duplicate voyageNo
    const existingVoyage = await Voyage.findOne({ voyageNo });
    if (existingVoyage) {
      return res.status(409).json({
        success: false,
        message: `Voyage with number '${voyageNo}' already exists.`,
        errors: ['Duplicate voyage number'],
      });
    }

    // Prevent double booking vessel for overlapping voyages
    const depDate = new Date(departureDate);
    const arrDate = new Date(estimatedArrival);

    if (depDate >= arrDate) {
      return res.status(400).json({
        success: false,
        message: 'Departure date must be earlier than estimated arrival date.',
        errors: ['Invalid dates'],
      });
    }

    const overlapVoyage = await Voyage.findOne({
      vessel: vesselId,
      status: { $in: ['Planned', 'In Progress'] },
      $or: [
        {
          departureDate: { $lte: arrDate },
          estimatedArrival: { $gte: depDate },
        },
      ],
    });

    if (overlapVoyage) {
      return res.status(409).json({
        success: false,
        message: `Vessel is already booked for Voyage ${overlapVoyage.voyageNo} during this timeframe (${overlapVoyage.departureDate.toISOString().split('T')[0]} to ${overlapVoyage.estimatedArrival.toISOString().split('T')[0]}).`,
        errors: ['Vessel scheduling conflict (double-booking prevented)'],
      });
    }

    // Calculate planned distance if not provided
    const computedDistanceNm = plannedDistanceNm || calculateRouteDistanceNm(origin, waypoints, destination);

    const voyage = await Voyage.create({
      voyageNo,
      vessel: vesselId,
      origin,
      destination,
      waypoints,
      departureDate: depDate,
      estimatedArrival: arrDate,
      plannedDistanceNm: computedDistanceNm,
      plannedFuelTons: plannedFuelTons || Math.round(computedDistanceNm * 0.035),
      status: status || 'Planned',
      progressPercent: status === 'In Progress' ? 5 : 0,
    });

    // Update vessel status to Active if voyage is In Progress
    if (status === 'In Progress') {
      await Vessel.findByIdAndUpdate(vesselId, { status: 'Active' });
    }

    evaluateAllAlerts().catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Voyage created successfully',
      data: voyage,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/voyages/:id
const updateVoyage = async (req, res, next) => {
  try {
    const voyage = await Voyage.findById(req.params.id);
    if (!voyage) {
      return res.status(404).json({
        success: false,
        message: 'Voyage not found',
        errors: ['Voyage ID does not exist'],
      });
    }

    // Check overlap if vessel or dates are being modified
    if (
      (req.body.vessel && req.body.vessel !== String(voyage.vessel)) ||
      req.body.departureDate ||
      req.body.estimatedArrival
    ) {
      const vesselId = req.body.vessel || voyage.vessel;
      const depDate = new Date(req.body.departureDate || voyage.departureDate);
      const arrDate = new Date(req.body.estimatedArrival || voyage.estimatedArrival);

      const overlap = await Voyage.findOne({
        _id: { $ne: voyage._id },
        vessel: vesselId,
        status: { $in: ['Planned', 'In Progress'] },
        $or: [
          {
            departureDate: { $lte: arrDate },
            estimatedArrival: { $gte: depDate },
          },
        ],
      });

      if (overlap) {
        return res.status(409).json({
          success: false,
          message: `Vessel has an overlapping booking for Voyage ${overlap.voyageNo}.`,
          errors: ['Vessel scheduling conflict'],
        });
      }
    }

    // Recalculate route distance if coordinates updated
    if (req.body.origin || req.body.destination || req.body.waypoints) {
      const origin = req.body.origin || voyage.origin;
      const destination = req.body.destination || voyage.destination;
      const waypoints = req.body.waypoints || voyage.waypoints;
      req.body.plannedDistanceNm = calculateRouteDistanceNm(origin, waypoints, destination);
    }

    // Handle status transitions
    if (req.body.status === 'Completed' && !req.body.actualArrival) {
      req.body.actualArrival = new Date();
      req.body.progressPercent = 100;
    }

    const updated = await Voyage.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('vessel');

    evaluateAllAlerts().catch(console.error);

    res.status(200).json({
      success: true,
      message: 'Voyage updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/voyages/:id
const deleteVoyage = async (req, res, next) => {
  try {
    const voyage = await Voyage.findById(req.params.id);
    if (!voyage) {
      return res.status(404).json({
        success: false,
        message: 'Voyage not found',
        errors: ['Voyage ID does not exist'],
      });
    }

    if (voyage.status === 'In Progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a voyage that is currently In Progress. Update status or cancel first.',
        errors: ['Voyage in progress'],
      });
    }

    await Voyage.findByIdAndDelete(req.params.id);
    evaluateAllAlerts().catch(console.error);

    res.status(200).json({
      success: true,
      message: 'Voyage deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVoyages,
  getVoyageById,
  createVoyage,
  updateVoyage,
  deleteVoyage,
};
