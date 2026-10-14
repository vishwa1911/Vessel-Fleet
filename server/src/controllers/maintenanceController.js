const MaintenanceTask = require('../models/MaintenanceTask');
const Vessel = require('../models/Vessel');
const { calculateVesselRiskScore } = require('../services/maintenanceRiskService');
const { evaluateAllAlerts } = require('../services/alertRulesEngine');

// GET /api/maintenance
const getMaintenanceTasks = async (req, res, next) => {
  try {
    const {
      vessel,
      status,
      priority,
      taskType,
      search,
      page = 1,
      limit = 10,
      sortBy = 'scheduledDate',
      order = 'asc',
    } = req.query;

    const query = {};

    if (vessel) query.vessel = vessel;
    if (status && status !== 'All') query.status = status;
    if (priority && priority !== 'All') query.priority = priority;
    if (taskType && taskType !== 'All') query.taskType = taskType;

    if (search) {
      query.equipment = { $regex: search, $options: 'i' };
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [tasks, total] = await Promise.all([
      MaintenanceTask.find(query)
        .populate('vessel', 'name imoNumber type engineRunningHours status')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(take),
      MaintenanceTask.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: tasks,
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

// GET /api/maintenance/risk-matrix
const getFleetRiskMatrix = async (req, res, next) => {
  try {
    const vessels = await Vessel.find().select('name imoNumber type status engineRunningHours');
    const riskScores = await Promise.all(
      vessels.map(async (v) => {
        try {
          return await calculateVesselRiskScore(v._id);
        } catch {
          return {
            vesselId: v._id,
            vesselName: v.name,
            score: 10,
            category: 'Low',
            badgeColor: 'emerald',
            factors: [],
            whyExplanation: 'Normal operations',
          };
        }
      })
    );

    // Sort highest risk first
    riskScores.sort((a, b) => b.score - a.score);

    res.status(200).json({
      success: true,
      data: riskScores,
      methodology: 'Deterministic rule-based risk evaluation (Non-ML)',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/maintenance
const createMaintenanceTask = async (req, res, next) => {
  try {
    const {
      vessel,
      equipment,
      taskType,
      priority,
      scheduledDate,
      runningHoursThreshold,
      estimatedCost,
      notes,
    } = req.body;

    const task = await MaintenanceTask.create({
      vessel,
      equipment,
      taskType,
      priority: priority || 'Medium',
      scheduledDate: new Date(scheduledDate),
      runningHoursThreshold: runningHoursThreshold || 5000,
      estimatedCost: estimatedCost || 0,
      notes: notes || '',
    });

    const populated = await MaintenanceTask.findById(task._id).populate(
      'vessel',
      'name imoNumber type engineRunningHours'
    );

    evaluateAllAlerts().catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Maintenance task scheduled successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/maintenance/:id
const updateMaintenanceTask = async (req, res, next) => {
  try {
    const task = await MaintenanceTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance task not found',
        errors: ['Task ID does not exist'],
      });
    }

    if (req.body.status === 'Completed' && !req.body.completedDate) {
      req.body.completedDate = new Date();
    }

    const updated = await MaintenanceTask.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('vessel', 'name imoNumber type engineRunningHours');

    evaluateAllAlerts().catch(console.error);

    res.status(200).json({
      success: true,
      message: 'Maintenance task updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/maintenance/:id
const deleteMaintenanceTask = async (req, res, next) => {
  try {
    const task = await MaintenanceTask.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance task not found',
        errors: ['Task ID does not exist'],
      });
    }

    evaluateAllAlerts().catch(console.error);

    res.status(200).json({
      success: true,
      message: 'Maintenance task removed',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaintenanceTasks,
  getFleetRiskMatrix,
  createMaintenanceTask,
  updateMaintenanceTask,
  deleteMaintenanceTask,
};
