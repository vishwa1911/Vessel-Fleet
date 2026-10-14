const Settings = require('../models/Settings');
const { evaluateAllAlerts } = require('../services/alertRulesEngine');

// GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }

    settings.updatedBy = req.user._id;
    await settings.save();

    // Re-evaluate alert rules with updated thresholds
    evaluateAllAlerts().catch(console.error);

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
