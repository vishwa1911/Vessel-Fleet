const mongoose = require('mongoose');

const fuelRecordSchema = new mongoose.Schema(
  {
    vessel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vessel',
      required: [true, 'Vessel is required'],
      index: true,
    },
    voyage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voyage',
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    fuelType: {
      type: String,
      enum: ['VLSFO', 'LSMGO', 'HFO', 'MGO', 'LNG'],
      default: 'VLSFO',
    },
    quantityTons: {
      type: Number,
      required: [true, 'Quantity in metric tons is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    pricePerTon: {
      type: Number,
      required: [true, 'Price per ton is required'],
      min: [0, 'Price cannot be negative'],
    },
    distanceNm: {
      type: Number,
      default: 0,
      min: [0, 'Distance cannot be negative'],
    },
    source: {
      type: String,
      enum: ['measured', 'estimated', 'simulated'],
      default: 'simulated',
    },
    totalCost: {
      type: Number,
    },
    tonsPerDay: {
      type: Number,
      default: 0,
    },
    tonsPerNm: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

fuelRecordSchema.pre('save', function (next) {
  if (this.quantityTons != null && this.pricePerTon != null) {
    this.totalCost = Number((this.quantityTons * this.pricePerTon).toFixed(2));
  }
  if (this.distanceNm && this.distanceNm > 0 && this.quantityTons != null) {
    this.tonsPerNm = Number((this.quantityTons / this.distanceNm).toFixed(4));
  } else {
    this.tonsPerNm = 0;
  }
  if (!this.tonsPerDay || this.tonsPerDay === 0) {
    // If not set explicitly, default tons/day assuming standard steaming consumption
    this.tonsPerDay = Number(this.quantityTons.toFixed(2));
  }
  next();
});

module.exports = mongoose.model('FuelRecord', fuelRecordSchema);
