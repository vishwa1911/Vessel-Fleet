const MaintenanceTask = require('../models/MaintenanceTask');
const Vessel = require('../models/Vessel');
const Settings = require('../models/Settings');

/**
 * Calculates a transparent rule-based maintenance risk score (0-100) for a vessel.
 * NOT an ML model: uses deterministic operational business rules.
 */
async function calculateVesselRiskScore(vesselId) {
  const vessel = await Vessel.findById(vesselId);
  if (!vessel) throw new Error('Vessel not found');

  const settings = await Settings.getSettings();

  // Find all maintenance tasks for this vessel
  const tasks = await MaintenanceTask.find({ vessel: vesselId }).sort({ scheduledDate: -1 });

  let score = 10; // Baseline operational wear
  const factors = [];
  const whyReasons = [];

  // Factor 1: Overdue tasks
  const overdueTasks = tasks.filter(
    (t) => t.status === 'Overdue' || (t.status !== 'Completed' && new Date(t.scheduledDate) < new Date())
  );
  if (overdueTasks.length > 0) {
    const overduePoints = Math.min(overdueTasks.length * 25, 50);
    score += overduePoints;
    factors.push({
      rule: 'Overdue Maintenance Tasks',
      weight: overduePoints,
      detail: `${overdueTasks.length} task(s) currently overdue`,
      criticality: 'High',
    });
    whyReasons.push(`${overdueTasks.length} overdue task(s): ${overdueTasks.map((t) => t.equipment).join(', ')}`);
  }

  // Factor 2: High or Critical Priority Open Tasks
  const highPriorityTasks = tasks.filter(
    (t) => (t.priority === 'Critical' || t.priority === 'High') && t.status !== 'Completed'
  );
  if (highPriorityTasks.length > 0) {
    const priorityPoints = Math.min(highPriorityTasks.length * 15, 30);
    score += priorityPoints;
    factors.push({
      rule: 'Critical/High Priority Open Tasks',
      weight: priorityPoints,
      detail: `${highPriorityTasks.length} high/critical priority item(s) pending`,
      criticality: 'High',
    });
    whyReasons.push(`${highPriorityTasks.length} critical/high priority task(s) pending resolution`);
  }

  // Factor 3: Engine Running Hours vs Threshold
  // Default threshold: 5000 hours if not defined
  const activeTasks = tasks.filter((t) => t.status !== 'Completed');
  const runningHoursThreshold =
    activeTasks.length > 0 && activeTasks[0].runningHoursThreshold
      ? activeTasks[0].runningHoursThreshold
      : 5000;

  const hoursRatio = vessel.engineRunningHours ? vessel.engineRunningHours / runningHoursThreshold : 0;
  const warningRatio = (settings.maintenanceHoursWarningPercent || 90) / 100;

  if (hoursRatio >= 1.0) {
    score += 30;
    factors.push({
      rule: 'Engine Running Hours Exceeded Threshold',
      weight: 30,
      detail: `${vessel.engineRunningHours} hrs recorded vs ${runningHoursThreshold} hrs service threshold (${(hoursRatio * 100).toFixed(0)}%)`,
      criticality: 'Critical',
    });
    whyReasons.push(`Engine operating hours (${vessel.engineRunningHours}h) exceed service limit (${runningHoursThreshold}h)`);
  } else if (hoursRatio >= warningRatio) {
    score += 15;
    factors.push({
      rule: 'Engine Running Hours Near Threshold',
      weight: 15,
      detail: `${vessel.engineRunningHours} hrs recorded (${(hoursRatio * 100).toFixed(0)}% of ${runningHoursThreshold} hrs threshold)`,
      criticality: 'Medium',
    });
    whyReasons.push(`Engine hours at ${(hoursRatio * 100).toFixed(0)}% of maintenance threshold`);
  }

  // Factor 4: Days Since Last Completed Inspection/Service
  const completedInspections = tasks.filter(
    (t) => t.status === 'Completed' && t.completedDate
  );
  let daysSinceLast = 999;
  if (completedInspections.length > 0) {
    const latestCompleted = completedInspections.reduce((latest, current) =>
      new Date(current.completedDate) > new Date(latest.completedDate) ? current : latest
    );
    daysSinceLast = Math.floor(
      (new Date() - new Date(latestCompleted.completedDate)) / (1000 * 60 * 60 * 24)
    );
  }

  if (daysSinceLast > 180) {
    score += 20;
    factors.push({
      rule: 'Prolonged Interval Since Last Completed Service',
      weight: 20,
      detail: `${daysSinceLast > 365 ? '>1 year' : daysSinceLast + ' days'} since last logged maintenance completion`,
      criticality: 'Medium',
    });
    whyReasons.push(`More than 180 days (${daysSinceLast} days) elapsed since last completed overhaul/inspection`);
  } else if (daysSinceLast > 90) {
    score += 10;
    factors.push({
      rule: 'Quarterly Service Due',
      weight: 10,
      detail: `${daysSinceLast} days since last completed maintenance`,
      criticality: 'Low',
    });
  }

  // Clamp score between 0 and 100
  const finalScore = Math.min(Math.max(score, 0), 100);

  let riskCategory = 'Low';
  let badgeColor = 'emerald';
  if (finalScore >= 75) {
    riskCategory = 'Critical';
    badgeColor = 'rose';
  } else if (finalScore >= 50) {
    riskCategory = 'High';
    badgeColor = 'amber';
  } else if (finalScore >= 30) {
    riskCategory = 'Medium';
    badgeColor = 'sky';
  }

  const whyExplanation =
    whyReasons.length > 0
      ? `Vessel requires attention due to: ${whyReasons.join('; ')}.`
      : 'Vessel operating parameters and maintenance schedules are within normal safe tolerances.';

  return {
    vesselId: vessel._id,
    vesselName: vessel.name,
    vesselType: vessel.type,
    score: finalScore,
    category: riskCategory,
    badgeColor,
    isMLModel: false,
    methodology: 'Rule-based deterministic scoring engine',
    factors,
    whyExplanation,
    calculatedAt: new Date(),
  };
}

module.exports = {
  calculateVesselRiskScore,
};
