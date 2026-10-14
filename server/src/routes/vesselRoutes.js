const express = require('express');
const { body } = require('express-validator');
const {
  getVessels,
  getVesselById,
  createVessel,
  updateVessel,
  deleteVessel,
  getVesselRiskScore,
} = require('../controllers/vesselController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getVessels);
router.get('/:id', getVesselById);
router.get('/:id/risk-score', getVesselRiskScore);

router.post(
  '/',
  authorize('Admin'),
  [
    body('name').trim().notEmpty().withMessage('Vessel name is required'),
    body('imoNumber').matches(/^\d{7}$/).withMessage('IMO number must be exactly 7 digits'),
    body('type').notEmpty().withMessage('Vessel type is required'),
    body('flag').notEmpty().withMessage('Flag state is required'),
    body('capacityDwt').isNumeric().withMessage('Capacity DWT must be a number'),
  ],
  validate,
  createVessel
);

router.put('/:id', authorize('Admin', 'Fleet Operator'), updateVessel);
router.delete('/:id', authorize('Admin'), deleteVessel);

module.exports = router;
