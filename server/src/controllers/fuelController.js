const FuelRecord = require('../models/FuelRecord');
const Vessel = require('../models/Vessel');
const Voyage = require('../models/Voyage');
const Settings = require('../models/Settings');
const { evaluateAllAlerts } = require('../services/alertRulesEngine');

// GET /api/fuel
const getFuelRecords = async (req, res, next) => {
  try {
    const {
      vessel,
      voyage,
      fuelType,
      source,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'date',
      order = 'desc',
    } = req.query;

    const query = {};

    if (vessel) query.vessel = vessel;
    if (voyage) query.voyage = voyage;
    if (fuelType && fuelType !== 'All') query.fuelType = fuelType;
    if (source && source !== 'All') query.source = source;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [records, total] = await Promise.all([
      FuelRecord.find(query)
        .populate('vessel', 'name imoNumber type')
        .populate('voyage', 'voyageNo status plannedFuelTons')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(take),
      FuelRecord.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/fuel/analytics
const getFuelAnalytics = async (req, res, next) => {
  try {
    const { vessel, startDate, endDate } = req.query;
    const match = {};

    if (vessel) {
      match.vessel = new (require('mongoose').Types.ObjectId)(vessel);
    }

    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const settings = await Settings.getSettings();

    // Aggregations: totals, by month/day, by fuel type
    const [summaryAgg, trendAgg, fuelTypeAgg] = await Promise.all([
      FuelRecord.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalQuantityTons: { $sum: '$quantityTons' },
            totalCost: { $sum: '$totalCost' },
            totalDistanceNm: { $sum: '$distanceNm' },
            avgPricePerTon: { $avg: '$pricePerTon' },
            recordCount: { $sum: 1 },
          },
        },
      ]),
      FuelRecord.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            dailyTons: { $sum: '$quantityTons' },
            dailyCost: { $sum: '$totalCost' },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      FuelRecord.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$fuelType',
            totalTons: { $sum: '$quantityTons' },
            totalCost: { $sum: '$totalCost' },
          },
        },
      ]),
    ]);

    const summary = summaryAgg[0] || {
      totalQuantityTons: 0,
      totalCost: 0,
      totalDistanceNm: 0,
      avgPricePerTon: settings.fuelPricePerTon,
      recordCount: 0,
    };

    const avgTonsPerNm =
      summary.totalDistanceNm > 0
        ? Number((summary.totalQuantityTons / summary.totalDistanceNm).toFixed(4))
        : 0;

    // Rule-based Optimization Suggestions
    const recommendations = [];
    if (avgTonsPerNm > 0.04) {
      recommendations.push({
        title: 'High Steaming Consumption Detected',
        suggestion: 'Consider reducing service cruising speed by 1.5 - 2.0 knots. Quadratic power-speed relationship can yield 12-18% bunker fuel savings.',
        impact: 'High',
      });
    }
    if (summary.totalQuantityTons > 500) {
      recommendations.push({
        title: 'Hull Fouling & Biofouling Assessment',
        suggestion: 'Schedule an underwater hull inspection and propeller polishing at next bunkering stop to reduce hydrodynamic drag.',
        impact: 'Medium',
      });
    }
    recommendations.push({
      title: 'Weather Routing & Trim Optimization',
      suggestion: 'Utilize dynamic sea state currents and optimize ballast distribution to maintain minimum trim drag.',
      impact: 'Medium',
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          ...summary,
          avgTonsPerNm,
          configuredPricePerTon: settings.fuelPricePerTon,
        },
        trend: trendAgg.map((item) => ({
          date: item._id,
          tons: Number(item.dailyTons.toFixed(2)),
          cost: Number(item.dailyCost.toFixed(2)),
        })),
        fuelTypeBreakdown: fuelTypeAgg.map((item) => ({
          fuelType: item._id,
          totalTons: Number(item.totalTons.toFixed(2)),
          totalCost: Number(item.totalCost.toFixed(2)),
        })),
        recommendations,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/fuel
const createFuelRecord = async (req, res, next) => {
  try {
    const { vessel, voyage, date, fuelType, quantityTons, pricePerTon, distanceNm, source } = req.body;

    const settings = await Settings.getSettings();
    const effectivePrice = pricePerTon || settings.fuelPricePerTon;

    const record = await FuelRecord.create({
      vessel,
      voyage,
      date: date || new Date(),
      fuelType: fuelType || 'VLSFO',
      quantityTons: Number(quantityTons),
      pricePerTon: Number(effectivePrice),
      distanceNm: Number(distanceNm || 0),
      source: source || 'measured',
    });

    const populated = await FuelRecord.findById(record._id)
      .populate('vessel', 'name imoNumber type')
      .populate('voyage', 'voyageNo status plannedFuelTons');

    evaluateAllAlerts().catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Fuel consumption record added',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/fuel/:id
const deleteFuelRecord = async (req, res, next) => {
  try {
    const record = await FuelRecord.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Fuel record not found',
        errors: ['Fuel record ID does not exist'],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Fuel record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFuelRecords,
  getFuelAnalytics,
  createFuelRecord,
  deleteFuelRecord,
};
