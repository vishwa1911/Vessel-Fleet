const simulationService = require('../services/simulationService');
const { seedDatabase } = require('../seed/seedData');

// POST /api/simulation/start
const startSimulation = async (req, res, next) => {
  try {
    const { intervalMs = 5000 } = req.body;
    const status = simulationService.start(intervalMs);
    res.status(200).json({
      success: true,
      message: 'Simulation engine started. Vessels will progress along routes.',
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/simulation/stop
const stopSimulation = async (req, res, next) => {
  try {
    const status = simulationService.stop();
    res.status(200).json({
      success: true,
      message: 'Simulation engine paused.',
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/simulation/status
const getSimulationStatus = async (req, res, next) => {
  try {
    const status = simulationService.getStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/simulation/step
const stepSimulation = async (req, res, next) => {
  try {
    const result = await simulationService.step();
    res.status(200).json({
      success: true,
      message: 'Simulation stepped forward 1 cycle',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/demo/reset
const resetDemoData = async (req, res, next) => {
  try {
    // Stop simulation first if running
    simulationService.stop();

    const result = await seedDatabase();
    res.status(200).json({
      success: true,
      message: 'Demo dataset reset successfully. Database restored with realistic maritime fleet data.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startSimulation,
  stopSimulation,
  getSimulationStatus,
  stepSimulation,
  resetDemoData,
};
