const express = require('express');
const { body } = require('express-validator');
const {
  getVoyages,
  getVoyageById,
  createVoyage,
  updateVoyage,
  deleteVoyage,
} = require('../controllers/voyageController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getVoyages);
router.get('/:id', getVoyageById);

router.post(
  '/',
  authorize('Admin', 'Fleet Operator'),
  [
    body('voyageNo').trim().notEmpty().withMessage('Voyage number is required'),
    body('vessel').notEmpty().withMessage('Vessel reference is required'),
    body('origin.name').notEmpty().withMessage('Origin port name is required'),
    body('origin.lat').isNumeric().withMessage('Origin latitude is required'),
    body('origin.lng').isNumeric().withMessage('Origin longitude is required'),
    body('destination.name').notEmpty().withMessage('Destination port name is required'),
    body('destination.lat').isNumeric().withMessage('Destination latitude is required'),
    body('destination.lng').isNumeric().withMessage('Destination longitude is required'),
    body('departureDate').isISO8601().withMessage('Valid departure date is required'),
    body('estimatedArrival').isISO8601().withMessage('Valid estimated arrival date is required'),
  ],
  validate,
  createVoyage
);

router.put('/:id', authorize('Admin', 'Fleet Operator'), updateVoyage);
router.delete('/:id', authorize('Admin', 'Fleet Operator'), deleteVoyage);

module.exports = router;
