const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'DelayedArrival',
        'HighFuel',
        'OverdueMaintenance',
        'LowAvailability',
        'CargoRisk',
        'RouteDeviation',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['Info', 'Warning', 'High', 'Critical'],
      required: true,
      index: true,
    },
    vessel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vessel',
      index: true,
    },
    voyage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voyage',
      index: true,
    },
    cargo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CargoShipment',
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Alert reason is required'],
    },
    recommendedAction: {
      type: String,
      required: [true, 'Recommended action is required'],
    },
    status: {
      type: String,
      enum: ['Open', 'Acknowledged', 'Resolved'],
      default: 'Open',
      index: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ type: 1, vessel: 1, status: 1 });
alertSchema.index({ type: 1, voyage: 1, status: 1 });
alertSchema.index({ type: 1, cargo: 1, status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
