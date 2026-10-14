module.exports = {
  fuelPricePerTon: 650, // USD per metric ton (e.g. VLSFO standard)
  fuelOverusePercent: 15, // % above baseline triggering HighFuel alert
  delayThresholdHours: 12, // Hours of delay triggering DelayedArrival alert
  routeDeviationNm: 50, // Nautical miles off planned route triggering RouteDeviation alert
  minFleetAvailabilityPercent: 75, // Threshold triggering LowAvailability alert
  maintenanceHoursWarningPercent: 90, // % of running hours threshold triggering early warning
  maintenanceDueSoonDays: 7, // Days before scheduled date to flag due soon
};
