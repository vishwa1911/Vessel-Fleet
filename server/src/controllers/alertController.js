const Alert = require('../models/Alert');
const { evaluateAllAlerts } = require('../services/alertRulesEngine');

// GET /api/alerts
const getAlerts = async (req, res, next) => {
  try {
    const {
      status,
      severity,
      type,
      vessel,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (severity && severity !== 'All') {
      query.severity = severity;
    }

    if (type && type !== 'All') {
      query.type = type;
    }

    if (vessel) {
      query.vessel = vessel;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [alerts, total, openCount] = await Promise.all([
      Alert.find(query)
        .populate('vessel', 'name imoNumber type')
        .populate('voyage', 'voyageNo origin destination status')
        .populate('cargo', 'shipmentNo cargoType status')
        .populate('resolvedBy', 'name email')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(take),
      Alert.countDocuments(query),
      Alert.countDocuments({ status: 'Open' }),
    ]);

    res.status(200).json({
      success: true,
      data: alerts,
      openCount,
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

// GET /api/alerts/unread-count
const getUnreadAlertsCount = async (req, res, next) => {
  try {
    const count = await Alert.countDocuments({ status: 'Open' });
    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/alerts/evaluate
const evaluateAlertsManual = async (req, res, next) => {
  try {
    const result = await evaluateAllAlerts();
    res.status(200).json({
      success: true,
      message: `Alert rules evaluated: ${result.newAlertsCount} new alert(s) identified`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/alerts/:id/acknowledge
const acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
        errors: ['Alert ID does not exist'],
      });
    }

    alert.status = 'Acknowledged';
    await alert.save();

    res.status(200).json({
      success: true,
      message: 'Alert acknowledged',
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/alerts/:id/resolve
const resolveAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
        errors: ['Alert ID does not exist'],
      });
    }

    alert.status = 'Resolved';
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.user._id;
    await alert.save();

    res.status(200).json({
      success: true,
      message: 'Alert marked as resolved',
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlerts,
  getUnreadAlertsCount,
  evaluateAlertsManual,
  acknowledgeAlert,
  resolveAlert,
};
