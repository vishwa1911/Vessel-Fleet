const mongoose = require('mongoose');

const positionReportSchema = new mongoose.Schema(
  {
    vessel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vessel',
      required: true,
      index: true,
    },
    voyage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voyage',
      index: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    speedKnots: {
      type: Number,
      default: 0,
    },
    heading: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    source: {
      type: String,
      enum: ['demo-simulated', 'manual'],
      default: 'demo-simulated',
    },
  },
  {
    timestamps: true,
  }
);

positionReportSchema.index({ vessel: 1, timestamp: -1 });

module.exports = mongoose.model('PositionReport', positionReportSchema);
