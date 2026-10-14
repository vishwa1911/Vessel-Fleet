const CargoShipment = require('../models/CargoShipment');
const Voyage = require('../models/Voyage');
const Vessel = require('../models/Vessel');
const { evaluateAllAlerts } = require('../services/alertRulesEngine');

const VALID_TRANSITIONS = {
  Booked: ['Loaded', 'Cancelled'],
  Loaded: ['In Transit', 'Booked'],
  'In Transit': ['Delayed', 'Delivered'],
  Delayed: ['In Transit', 'Delivered'],
  Delivered: [],
  Cancelled: [],
};

// GET /api/cargo
const getCargoShipments = async (req, res, next) => {
  try {
    const {
      search,
      status,
      cargoType,
      vessel,
      voyage,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { shipmentNo: { $regex: search, $options: 'i' } },
        { cargoType: { $regex: search, $options: 'i' } },
        { origin: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'All') query.status = status;
    if (cargoType && cargoType !== 'All') query.cargoType = cargoType;
    if (vessel) query.vessel = vessel;
    if (voyage) query.voyage = voyage;

    const sortOrder = order === 'asc' ? 1 : -1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [shipments, total] = await Promise.all([
      CargoShipment.find(query)
        .populate('vessel', 'name imoNumber type')
        .populate('voyage', 'voyageNo status departureDate estimatedArrival delayHours')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(take),
      CargoShipment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: shipments,
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

// GET /api/cargo/:id
const getCargoById = async (req, res, next) => {
  try {
    const shipment = await CargoShipment.findById(req.params.id)
      .populate('vessel')
      .populate('voyage');

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Cargo shipment not found',
        errors: ['Shipment ID does not exist'],
      });
    }

    res.status(200).json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cargo
const createCargoShipment = async (req, res, next) => {
  try {
    const {
      shipmentNo,
      cargoType,
      quantity,
      unit,
      weightTons,
      origin,
      destination,
      vessel,
      voyage,
      status,
      estimatedDelivery,
    } = req.body;

    const existing = await CargoShipment.findOne({ shipmentNo });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Shipment with tracking number '${shipmentNo}' already exists.`,
        errors: ['Duplicate shipment number'],
      });
    }

    const shipment = await CargoShipment.create({
      shipmentNo,
      cargoType,
      quantity: Number(quantity),
      unit: unit || 'TEU',
      weightTons: Number(weightTons),
      origin,
      destination,
      vessel: vessel || null,
      voyage: voyage || null,
      status: status || 'Booked',
      estimatedDelivery: new Date(estimatedDelivery),
    });

    const populated = await CargoShipment.findById(shipment._id)
      .populate('vessel', 'name imoNumber type')
      .populate('voyage', 'voyageNo status');

    evaluateAllAlerts().catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Cargo shipment registered successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/cargo/:id
const updateCargoShipment = async (req, res, next) => {
  try {
    const shipment = await CargoShipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Cargo shipment not found',
        errors: ['Shipment ID does not exist'],
      });
    }

    // Validate status transition if status is being updated
    if (req.body.status && req.body.status !== shipment.status) {
      const allowedNext = VALID_TRANSITIONS[shipment.status] || [];
      if (!allowedNext.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid cargo status transition from '${shipment.status}' to '${req.body.status}'. Allowed transitions: [${allowedNext.join(', ')}]`,
          errors: ['Invalid status transition'],
        });
      }

      if (req.body.status === 'Delivered' && !req.body.actualDelivery) {
        req.body.actualDelivery = new Date();
      }
    }

    const updated = await CargoShipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('vessel', 'name imoNumber type')
      .populate('voyage', 'voyageNo status delayHours');

    evaluateAllAlerts().catch(console.error);

    res.status(200).json({
      success: true,
      message: 'Cargo shipment updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cargo/:id
const deleteCargoShipment = async (req, res, next) => {
  try {
    const shipment = await CargoShipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Cargo shipment not found',
        errors: ['Shipment ID does not exist'],
      });
    }

    if (shipment.status === 'In Transit') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete shipment currently In Transit. Reassign or cancel first.',
        errors: ['Active shipment in transit'],
      });
    }

    await CargoShipment.findByIdAndDelete(req.params.id);
    evaluateAllAlerts().catch(console.error);

    res.status(200).json({
      success: true,
      message: 'Cargo shipment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCargoShipments,
  getCargoById,
  createCargoShipment,
  updateCargoShipment,
  deleteCargoShipment,
};
