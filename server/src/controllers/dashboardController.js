const Vessel = require('../models/Vessel');
const Voyage = require('../models/Voyage');
const FuelRecord = require('../models/FuelRecord');
const MaintenanceTask = require('../models/MaintenanceTask');
const CargoShipment = require('../models/CargoShipment');
const Alert = require('../models/Alert');
const Settings = require('../models/Settings');

// GET /api/dashboard/summary
const getDashboardSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const fuelMatch = {};
    if (startDate || endDate) {
      fuelMatch.date = {};
      if (startDate) fuelMatch.date.$gte = new Date(startDate);
      if (endDate) fuelMatch.date.$lte = new Date(endDate);
    }

    const [
      vesselCounts,
      voyageCounts,
      fuelSummary,
      cargoCounts,
      upcomingArrivals,
      upcomingDepartures,
      latestAlerts,
      maintenanceCostAgg,
      fleetLocations,
    ] = await Promise.all([
      // 1. Vessel breakdown via aggregation
      Vessel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // 2. Voyage status breakdown via aggregation
      Voyage.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // 3. Fuel aggregation for period
      FuelRecord.aggregate([
        { $match: fuelMatch },
        {
          $group: {
            _id: null,
            totalFuelTons: { $sum: '$quantityTons' },
            totalFuelCost: { $sum: '$totalCost' },
            totalDistanceNm: { $sum: '$distanceNm' },
          },
        },
      ]),

      // 4. Cargo status aggregation
      CargoShipment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalWeightTons: { $sum: '$weightTons' },
          },
        },
      ]),

      // 5. Upcoming arrivals (In Progress or Delayed, sorted by estimated arrival)
      Voyage.find({ status: { $in: ['In Progress', 'Delayed'] } })
        .populate('vessel', 'name type')
        .sort({ estimatedArrival: 1 })
        .limit(5)
        .select('voyageNo vessel origin destination estimatedArrival status progressPercent delayHours'),

      // 6. Upcoming departures (Planned voyages, sorted by departureDate)
      Voyage.find({ status: 'Planned' })
        .populate('vessel', 'name type')
        .sort({ departureDate: 1 })
        .limit(5)
        .select('voyageNo vessel origin destination departureDate status'),

      // 7. Latest open alerts
      Alert.find({ status: { $in: ['Open', 'Acknowledged'] } })
        .populate('vessel', 'name type')
        .populate('voyage', 'voyageNo')
        .sort({ createdAt: -1 })
        .limit(6),

      // 8. Maintenance cost aggregation
      MaintenanceTask.aggregate([
        {
          $group: {
            _id: '$status',
            totalCost: { $sum: '$estimatedCost' },
            count: { $sum: 1 },
          },
        },
      ]),

      // 9. Fleet current locations for map
      Vessel.find()
        .select('name imoNumber type flag status capacityDwt engineRunningHours lastKnownPosition')
        .lean(),
    ]);

    // Parse vessel status map
    let totalVessels = 0;
    let activeVessels = 0;
    let underMaintenanceVessels = 0;
    let inPortVessels = 0;
    let idleVessels = 0;

    vesselCounts.forEach((item) => {
      totalVessels += item.count;
      if (item._id === 'Active') activeVessels = item.count;
      if (item._id === 'Under Maintenance') underMaintenanceVessels = item.count;
      if (item._id === 'In Port') inPortVessels = item.count;
      if (item._id === 'Idle') idleVessels = item.count;
    });

    const fleetAvailabilityPercent =
      totalVessels > 0 ? Number(((activeVessels / totalVessels) * 100).toFixed(1)) : 0;

    // Parse voyage status map
    let totalVoyages = 0;
    let activeVoyages = 0;
    let delayedVoyages = 0;
    let plannedVoyages = 0;
    let completedVoyages = 0;

    voyageCounts.forEach((item) => {
      totalVoyages += item.count;
      if (item._id === 'In Progress') activeVoyages = item.count;
      if (item._id === 'Delayed') delayedVoyages = item.count;
      if (item._id === 'Planned') plannedVoyages = item.count;
      if (item._id === 'Completed') completedVoyages = item.count;
    });

    // Fuel metrics
    const fuel = fuelSummary[0] || { totalFuelTons: 0, totalFuelCost: 0, totalDistanceNm: 0 };

    // Total maintenance cost
    const totalMaintenanceCost = maintenanceCostAgg.reduce(
      (sum, item) => sum + (item.totalCost || 0),
      0
    );

    // Overdue maintenance count
    const overdueMaintenanceTasks =
      maintenanceCostAgg.find((item) => item._id === 'Overdue')?.count || 0;

    // Total Cargo
    const totalShipments = cargoCounts.reduce((sum, item) => sum + item.count, 0);

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          totalVessels,
          activeVessels,
          vesselsUnderMaintenance: underMaintenanceVessels,
          inPortVessels,
          idleVessels,
          fleetAvailabilityPercent,
          totalVoyages,
          activeVoyages,
          delayedVoyages,
          plannedVoyages,
          completedVoyages,
          totalFuelTons: Number(fuel.totalFuelTons.toFixed(1)),
          totalFuelCost: Number(fuel.totalFuelCost.toFixed(2)),
          totalMaintenanceCost: Number(totalMaintenanceCost.toFixed(2)),
          totalOperatingCost: Number((fuel.totalFuelCost + totalMaintenanceCost).toFixed(2)),
          overdueMaintenanceTasks,
          totalShipments,
        },
        cargoBreakdown: cargoCounts.map((item) => ({
          status: item._id,
          count: item.count,
          weightTons: item.totalWeightTons,
        })),
        upcomingArrivals,
        upcomingDepartures,
        latestAlerts,
        fleetLocations,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/charts
const getDashboardCharts = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    const [
      fleetUtilizationAgg,
      plannedVsActualAgg,
      fuelTrendAgg,
      costBreakdownAgg,
    ] = await Promise.all([
      // 1. Fleet Utilization by Vessel Type
      Vessel.aggregate([
        {
          $group: {
            _id: '$type',
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] },
            },
            maintenance: {
              $sum: { $cond: [{ $eq: ['$status', 'Under Maintenance'] }, 1, 0] },
            },
            inPort: {
              $sum: { $cond: [{ $eq: ['$status', 'In Port'] }, 1, 0] },
            },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // 2. Planned vs Actual Voyages (Completed or In Progress)
      Voyage.aggregate([
        {
          $match: {
            status: { $in: ['Completed', 'In Progress', 'Delayed'] },
          },
        },
        { $limit: 10 },
        {
          $project: {
            voyageNo: 1,
            plannedDistanceNm: 1,
            plannedFuelTons: 1,
            progressPercent: 1,
            delayHours: 1,
            status: 1,
          },
        },
      ]),

      // 3. Fuel Consumption Trend over time (grouped by day or month)
      FuelRecord.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            fuelTons: { $sum: '$quantityTons' },
            fuelCost: { $sum: '$totalCost' },
            distanceNm: { $sum: '$distanceNm' },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),

      // 4. Operational Cost Breakdown (Fuel vs Maintenance)
      Promise.all([
        FuelRecord.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, totalFuelCost: { $sum: '$totalCost' } } },
        ]),
        MaintenanceTask.aggregate([
          { $group: { _id: '$taskType', totalCost: { $sum: '$estimatedCost' } } },
        ]),
      ]),
    ]);

    const fuelTotalCost = costBreakdownAgg[0][0]?.totalFuelCost || 0;
    const maintenanceByType = costBreakdownAgg[1] || [];

    const costBreakdownData = [
      { name: 'Bunker Fuel', value: Number(fuelTotalCost.toFixed(2)), color: '#0284c7' },
      ...maintenanceByType.map((m, idx) => ({
        name: `Maint: ${m._id}`,
        value: Number((m.totalCost || 0).toFixed(2)),
        color: ['#0d9488', '#f59e0b', '#ef4444'][idx % 3],
      })),
    ];

    res.status(200).json({
      success: true,
      data: {
        fleetUtilization: fleetUtilizationAgg.map((item) => ({
          type: item._id,
          total: item.total,
          active: item.active,
          maintenance: item.maintenance,
          inPort: item.inPort,
          utilizationPercent: item.total > 0 ? Number(((item.active / item.total) * 100).toFixed(1)) : 0,
        })),
        plannedVsActual: plannedVsActualAgg.map((v) => ({
          voyageNo: v.voyageNo,
          plannedFuel: v.plannedFuelTons || 0,
          actualFuelEstimated: Number(((v.plannedFuelTons || 0) * (1 + (v.delayHours > 0 ? 0.15 : 0))).toFixed(1)),
          plannedDistance: v.plannedDistanceNm || 0,
          delayHours: v.delayHours || 0,
          status: v.status,
        })),
        fuelTrend: fuelTrendAgg.map((f) => ({
          date: f._id,
          fuelTons: Number(f.fuelTons.toFixed(1)),
          fuelCost: Number(f.fuelCost.toFixed(2)),
        })),
        operationalCostBreakdown: costBreakdownData,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getDashboardCharts,
};
