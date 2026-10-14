const mongoose = require('mongoose');

const cargoShipmentSchema = new mongoose.Schema(
  {
    shipmentNo: {
      type: String,
      required: [true, 'Shipment number is required'],
      unique: true,
      trim: true,
    },
    cargoType: {
      type: String,
      required: [true, 'Cargo type is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unit: {
      type: String,
      required: [true, 'Unit of measurement is required'],
      enum: ['TEU', 'Metric Tons', 'Barrels', 'Units', 'CBM'],
      default: 'TEU',
    },
    weightTons: {
      type: Number,
      required: [true, 'Weight in metric tons is required'],
      min: [0, 'Weight cannot be negative'],
    },
    origin: {
      type: String,
      required: [true, 'Origin port is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination port is required'],
      trim: true,
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
    status: {
      type: String,
      enum: ['Booked', 'Loaded', 'In Transit', 'Delayed', 'Delivered'],
      default: 'Booked',
      index: true,
    },
    estimatedDelivery: {
      type: Date,
      required: [true, 'Estimated delivery date is required'],
    },
    actualDelivery: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

cargoShipmentSchema.index({ status: 1, shipmentNo: 1 });

module.exports = mongoose.model('CargoShipment', cargoShipmentSchema);
