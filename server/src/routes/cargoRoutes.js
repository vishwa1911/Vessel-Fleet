const express = require('express');
const { body } = require('express-validator');
const {
  getCargoShipments,
  getCargoById,
  createCargoShipment,
  updateCargoShipment,
  deleteCargoShipment,
} = require('../controllers/cargoController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getCargoShipments);
router.get('/:id', getCargoById);

router.post(
  '/',
  authorize('Admin', 'Cargo Manager'),
  [
    body('shipmentNo').trim().notEmpty().withMessage('Shipment number is required'),
    body('cargoType').trim().notEmpty().withMessage('Cargo type is required'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('weightTons').isNumeric().withMessage('Weight in tons must be a number'),
    body('origin').trim().notEmpty().withMessage('Origin is required'),
    body('destination').trim().notEmpty().withMessage('Destination is required'),
    body('estimatedDelivery').isISO8601().withMessage('Valid estimated delivery date is required'),
  ],
  validate,
  createCargoShipment
);

router.put('/:id', authorize('Admin', 'Cargo Manager'), updateCargoShipment);
router.delete('/:id', authorize('Admin', 'Cargo Manager'), deleteCargoShipment);

module.exports = router;
