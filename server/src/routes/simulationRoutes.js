const express = require('express');
const {
  startSimulation,
  stopSimulation,
  getSimulationStatus,
  stepSimulation,
  resetDemoData,
} = require('../controllers/simulationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(protect);

router.get('/status', getSimulationStatus);
router.post('/start', authorize('Admin'), startSimulation);
router.post('/stop', authorize('Admin'), stopSimulation);
router.post('/step', authorize('Admin'), stepSimulation);

module.exports = {
  simulationRouter: router,
  resetDemoData,
};
