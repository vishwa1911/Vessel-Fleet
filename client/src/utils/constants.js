export const ROLES = {
  ADMIN: 'Admin',
  OPERATOR: 'Fleet Operator',
  ENGINEER: 'Marine Engineer',
  CARGO_MANAGER: 'Cargo Manager',
};

export const VESSEL_TYPES = [
  'Container Ship',
  'Bulk Carrier',
  'Oil Tanker',
  'LNG Carrier',
  'Ro-Ro',
  'Chemical Tanker',
  'General Cargo',
];

export const VESSEL_STATUSES = [
  'Active',
  'In Port',
  'Under Maintenance',
  'Idle',
];

export const VOYAGE_STATUSES = [
  'Planned',
  'In Progress',
  'Completed',
  'Delayed',
  'Cancelled',
];

export const CARGO_STATUSES = [
  'Booked',
  'Loaded',
  'In Transit',
  'Delayed',
  'Delivered',
];

export const MAINTENANCE_TYPES = ['Inspection', 'Repair', 'Overhaul'];
export const MAINTENANCE_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const MAINTENANCE_STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Overdue'];

export const FUEL_TYPES = ['VLSFO', 'LSMGO', 'HFO', 'MGO', 'LNG'];

export const ALERT_TYPES = [
  'DelayedArrival',
  'HighFuel',
  'OverdueMaintenance',
  'LowAvailability',
  'CargoRisk',
  'RouteDeviation',
];

export const ALERT_SEVERITIES = ['Info', 'Warning', 'High', 'Critical'];
