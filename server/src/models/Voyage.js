const mongoose = require('mongoose');

const waypointSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const voyageSchema = new mongoose.Schema(
  {
    voyageNo: {
      type: String,
      required: [true, 'Voyage number is required'],
      unique: true,
      trim: true,
    },
    vessel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vessel',
      required: [true, 'Vessel is required'],
      index: true,
    },
    origin: {
      name: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    destination: {
      name: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    waypoints: [waypointSchema],
    departureDate: {
      type: Date,
      required: [true, 'Departure date is required'],
    },
    estimatedArrival: {
      type: Date,
      required: [true, 'Estimated arrival date is required'],
    },
    actualArrival: {
      type: Date,
    },
    plannedDistanceNm: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Planned', 'In Progress', 'Completed', 'Delayed', 'Cancelled'],
      default: 'Planned',
      index: true,
    },
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    plannedFuelTons: {
      type: Number,
      default: 0,
    },
    delayHours: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

voyageSchema.index({ status: 1, departureDate: -1 });

module.exports = mongoose.model('Voyage', voyageSchema);
