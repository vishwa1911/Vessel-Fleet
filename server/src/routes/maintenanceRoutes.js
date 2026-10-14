const express = require('express');
const { body } = require('express-validator');
const {
  getMaintenanceTasks,
  getFleetRiskMatrix,
  createMaintenanceTask,
  updateMaintenanceTask,
  deleteMaintenanceTask,
} = require('../controllers/maintenanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getMaintenanceTasks);
router.get('/risk-matrix', getFleetRiskMatrix);

router.post(
  '/',
  authorize('Admin', 'Marine Engineer'),
  [
    body('vessel').notEmpty().withMessage('Vessel is required'),
    body('equipment').trim().notEmpty().withMessage('Equipment is required'),
    body('taskType').isIn(['Inspection', 'Repair', 'Overhaul']).withMessage('Valid task type is required'),
    body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  ],
  validate,
  createMaintenanceTask
);

router.put('/:id', authorize('Admin', 'Marine Engineer'), updateMaintenanceTask);
router.delete('/:id', authorize('Admin', 'Marine Engineer'), deleteMaintenanceTask);

module.exports = router;
