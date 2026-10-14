const express = require('express');
const { body } = require('express-validator');
const {
  getFuelRecords,
  getFuelAnalytics,
  createFuelRecord,
  deleteFuelRecord,
} = require('../controllers/fuelController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getFuelRecords);
router.get('/analytics', getFuelAnalytics);

router.post(
  '/',
  authorize('Admin', 'Marine Engineer'),
  [
    body('vessel').notEmpty().withMessage('Vessel is required'),
    body('quantityTons').isFloat({ min: 0.1 }).withMessage('Quantity in tons must be greater than 0'),
    body('fuelType').isIn(['VLSFO', 'LSMGO', 'HFO', 'MGO', 'LNG']).withMessage('Valid fuel type is required'),
  ],
  validate,
  createFuelRecord
);

router.delete('/:id', authorize('Admin', 'Marine Engineer'), deleteFuelRecord);

module.exports = router;
