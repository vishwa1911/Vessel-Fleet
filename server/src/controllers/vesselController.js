const Vessel = require('../models/Vessel');
const Voyage = require('../models/Voyage');
const FuelRecord = require('../models/FuelRecord');
const MaintenanceTask = require('../models/MaintenanceTask');
const CargoShipment = require('../models/CargoShipment');
const { calculateVesselRiskScore } = require('../services/maintenanceRiskService');
const { evaluateAllAlerts } = require('../services/alertRulesEngine');

// GET /api/vessels
const getVessels = async (req, res, next) => {
  try {
    const {
      search,
      status,
      type,
      flag,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { imoNumber: { $regex: search, $options: 'i' } },
        { flag: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (type && type !== 'All') {
      query.type = type;
    }

    if (flag && flag !== 'All') {
      query.flag = flag;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = sortBy;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [vessels, total] = await Promise.all([
      Vessel.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(take),
      Vessel.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: vessels,
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

// GET /api/vessels/:id
const getVesselById = async (req, res, next) => {
  try {
    const vessel = await Vessel.findById(req.params.id);
    if (!vessel) {
      return res.status(404).json({
        success: false,
        message: 'Vessel not found',
        errors: ['Vessel ID does not exist'],
      });
    }

    // Fetch related records in parallel for the vessel detail tabs
    const [voyages, fuelRecords, maintenanceTasks, cargoShipments, riskScore] =
      await Promise.all([
        Voyage.find({ vessel: vessel._id }).sort({ departureDate: -1 }).limit(10),
        FuelRecord.find({ vessel: vessel._id }).sort({ date: -1 }).limit(10),
        MaintenanceTask.find({ vessel: vessel._id }).sort({ scheduledDate: -1 }),
        CargoShipment.find({ vessel: vessel._id }).sort({ createdAt: -1 }).limit(10),
        calculateVesselRiskScore(vessel._id).catch(() => null),
      ]);

    // Current active voyage if any
    const activeVoyage = voyages.find((v) => v.status === 'In Progress');

    res.status(200).json({
      success: true,
      data: {
        ...vessel.toObject(),
        activeVoyage: activeVoyage || null,
        voyages,
        fuelRecords,
        maintenanceTasks,
        cargoShipments,
        riskScore,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/vessels
const createVessel = async (req, res, next) => {
  try {
    const { name, imoNumber, type, flag, capacityDwt, status, specs, engineRunningHours, lastKnownPosition } = req.body;

    const existing = await Vessel.findOne({
      $or: [{ imoNumber }, { name }],
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A vessel with this name or IMO number already exists.',
        errors: ['Duplicate vessel identifier'],
      });
    }

    const vessel = await Vessel.create({
      name,
      imoNumber,
      type,
      flag,
      capacityDwt,
      status: status || 'Active',
      specs,
      engineRunningHours: engineRunningHours || 0,
      lastKnownPosition: lastKnownPosition || {
        lat: 1.29027,
        lng: 103.851959,
        speedKnots: 0,
        heading: 0,
        source: 'demo-simulated',
      },
    });

    // Run rules engine in background to check availability
    evaluateAllAlerts().catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Vessel registered successfully',
      data: vessel,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/vessels/:id
const updateVessel = async (req, res, next) => {
  try {
    const vessel = await Vessel.findById(req.params.id);
    if (!vessel) {
      return res.status(404).json({
        success: false,
        message: 'Vessel not found',
        errors: ['Vessel ID does not exist'],
      });
    }

    // Role restriction: Fleet Operator can only update status
    if (req.user.role === 'Fleet Operator') {
      if (req.body.status) {
        vessel.status = req.body.status;
      }
      if (req.body.lastKnownPosition) {
        vessel.lastKnownPosition = {
          ...vessel.lastKnownPosition.toObject(),
          ...req.body.lastKnownPosition,
          updatedAt: new Date(),
        };
      }
      await vessel.save();
      evaluateAllAlerts().catch(console.error);
      return res.status(200).json({
        success: true,
        message: 'Vessel status updated successfully',
        data: vessel,
      });
    }

    // Admin can update all fields
    const updated = await Vessel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    evaluateAllAlerts().catch(console.error);

    res.status(200).json({
      success: true,
      message: 'Vessel updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/vessels/:id
const deleteVessel = async (req, res, next) => {
  try {
    const vessel = await Vessel.findById(req.params.id);
    if (!vessel) {
      return res.status(404).json({
        success: false,
        message: 'Vessel not found',
        errors: ['Vessel ID does not exist'],
      });
    }

    // Check if vessel has active voyage
    const activeVoyage = await Voyage.findOne({
      vessel: vessel._id,
      status: { $in: ['In Progress', 'Planned'] },
    });

    if (activeVoyage) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete vessel with active or planned voyage: ${activeVoyage.voyageNo}`,
        errors: ['Vessel has dependent voyages'],
      });
    }

    await Vessel.findByIdAndDelete(req.params.id);
    evaluateAllAlerts().catch(console.error);

    res.status(200).json({
      success: true,
      message: 'Vessel deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/vessels/:id/risk-score
const getVesselRiskScore = async (req, res, next) => {
  try {
    const risk = await calculateVesselRiskScore(req.params.id);
    res.status(200).json({
      success: true,
      data: risk,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVessels,
  getVesselById,
  createVessel,
  updateVessel,
  deleteVessel,
  getVesselRiskScore,
};
