const mongoose = require('mongoose');

const vesselSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vessel name is required'],
      trim: true,
      unique: true,
    },
    imoNumber: {
      type: String,
      required: [true, 'IMO number is required'],
      unique: true,
      trim: true,
      match: [/^\d{7}$/, 'IMO number must be exactly 7 digits'],
    },
    type: {
      type: String,
      required: [true, 'Vessel type is required'],
      enum: [
        'Container Ship',
        'Bulk Carrier',
        'Oil Tanker',
        'LNG Carrier',
        'Ro-Ro',
        'Chemical Tanker',
        'General Cargo',
      ],
      default: 'Container Ship',
    },
    flag: {
      type: String,
      required: [true, 'Flag state is required'],
      trim: true,
    },
    capacityDwt: {
      type: Number,
      required: [true, 'Deadweight capacity (DWT) is required'],
      min: [0, 'Capacity cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Active', 'In Port', 'Under Maintenance', 'Idle'],
      default: 'Active',
      index: true,
    },
    specs: {
      lengthM: { type: Number, default: 200 },
      beamM: { type: Number, default: 32 },
      engineType: { type: String, default: 'Two-stroke Diesel' },
      enginePowerKw: { type: Number, default: 25000 },
      builtYear: { type: Number, default: 2018 },
    },
    engineRunningHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastKnownPosition: {
      lat: { type: Number, default: 1.29027 }, // Default near Singapore
      lng: { type: Number, default: 103.851959 },
      speedKnots: { type: Number, default: 0 },
      heading: { type: Number, default: 0 },
      updatedAt: { type: Date, default: Date.now },
      source: {
        type: String,
        enum: ['demo-simulated', 'manual'],
        default: 'demo-simulated',
      },
    },
  },
  {
    timestamps: true,
  }
);

vesselSchema.index({ name: 'text', imoNumber: 'text', flag: 'text' });

module.exports = mongoose.model('Vessel', vesselSchema);
