const mongoose = require('mongoose');
const defaultSettings = require('../config/defaultSettings');

const settingsSchema = new mongoose.Schema(
  {
    fuelPricePerTon: {
      type: Number,
      default: defaultSettings.fuelPricePerTon,
      min: 0,
    },
    fuelOverusePercent: {
      type: Number,
      default: defaultSettings.fuelOverusePercent,
      min: 0,
    },
    delayThresholdHours: {
      type: Number,
      default: defaultSettings.delayThresholdHours,
      min: 0,
    },
    routeDeviationNm: {
      type: Number,
      default: defaultSettings.routeDeviationNm,
      min: 0,
    },
    minFleetAvailabilityPercent: {
      type: Number,
      default: defaultSettings.minFleetAvailabilityPercent,
      min: 0,
      max: 100,
    },
    maintenanceHoursWarningPercent: {
      type: Number,
      default: defaultSettings.maintenanceHoursWarningPercent,
      min: 0,
      max: 100,
    },
    maintenanceDueSoonDays: {
      type: Number,
      default: defaultSettings.maintenanceDueSoonDays,
      min: 0,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Helper to fetch singleton or create default
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
