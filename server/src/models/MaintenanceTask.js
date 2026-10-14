const mongoose = require('mongoose');

const maintenanceTaskSchema = new mongoose.Schema(
  {
    vessel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vessel',
      required: [true, 'Vessel is required'],
      index: true,
    },
    equipment: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
    },
    taskType: {
      type: String,
      enum: ['Inspection', 'Repair', 'Overhaul'],
      required: [true, 'Task type is required'],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true,
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
      index: true,
    },
    completedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Overdue'],
      default: 'Scheduled',
      index: true,
    },
    runningHoursThreshold: {
      type: Number,
      default: 5000,
      min: 0,
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Check if overdue on save or query
maintenanceTaskSchema.pre('save', function (next) {
  if (
    this.status !== 'Completed' &&
    this.scheduledDate &&
    new Date(this.scheduledDate) < new Date()
  ) {
    this.status = 'Overdue';
  }
  next();
});

module.exports = mongoose.model('MaintenanceTask', maintenanceTaskSchema);
