const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const vesselRoutes = require('./routes/vesselRoutes');
const voyageRoutes = require('./routes/voyageRoutes');
const fuelRoutes = require('./routes/fuelRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const cargoRoutes = require('./routes/cargoRoutes');
const alertRoutes = require('./routes/alertRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const userRoutes = require('./routes/userRoutes');
const { simulationRouter, resetDemoData } = require('./routes/simulationRoutes');
const { protect } = require('./middleware/auth');
const { authorize } = require('./middleware/rbac');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Leaflet tiles & inline React in dev
    crossOriginEmbedderPolicy: false,
  })
);

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching whitelist
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev to avoid CORS friction
      }
    },
    credentials: true,
  })
);

// Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'VesselFleet Maritime Intelligence API',
    version: '1.0.0',
    simulation: 'Enabled (Demo Only)',
  });
});

// API Documentation / Endpoint Index
app.get('/api/docs', (req, res) => {
  res.status(200).json({
    title: 'Smart Maritime Fleet Management API Documentation',
    version: '1.0.0',
    description: 'RESTful API for fleet monitoring, voyage scheduling, fuel analytics, rule-based maintenance risk, and cargo tracking.',
    authScheme: 'Bearer JWT token via Authorization header',
    endpoints: {
      auth: {
        'POST /api/auth/login': 'Authenticate user with email and password',
        'POST /api/auth/register': 'Register account (Admin or initial bootstrap)',
        'GET /api/auth/me': 'Get current authenticated user profile',
        'POST /api/auth/logout': 'Clear user session',
      },
      dashboard: {
        'GET /api/dashboard/summary': 'Fleet KPIs, cargo breakdown, upcoming voyages, open alerts',
        'GET /api/dashboard/charts': 'Fleet utilization, planned vs actual variance, fuel trendline, operating costs',
      },
      vessels: {
        'GET /api/vessels': 'Filterable, searchable, paginated vessel registry',
        'GET /api/vessels/:id': 'Comprehensive vessel detail with specs, position, voyage history, fuel, tasks',
        'GET /api/vessels/:id/risk-score': 'Deterministic rule-based risk score (0-100) with factor explanation',
        'POST /api/vessels': 'Create vessel (Admin)',
        'PUT /api/vessels/:id': 'Update vessel details or status (Admin / Fleet Operator)',
        'DELETE /api/vessels/:id': 'Delete vessel (Admin)',
      },
      voyages: {
        'GET /api/voyages': 'Filterable voyage schedules with progress tracking',
        'GET /api/voyages/:id': 'Voyage route waypoints, actual vs planned metrics, deviation distance',
        'POST /api/voyages': 'Create voyage with vessel conflict & double-booking prevention',
        'PUT /api/voyages/:id': 'Update voyage waypoints, progress, delay hours',
        'DELETE /api/voyages/:id': 'Remove planned/cancelled voyage',
      },
      fuel: {
        'GET /api/fuel': 'Bunker fuel logs with Tons/Day and Tons/NM',
        'GET /api/fuel/analytics': 'Fuel consumption trends, cost aggregation, rule-based efficiency recommendations',
        'POST /api/fuel': 'Record bunkering/steaming fuel consumption (Admin / Marine Engineer)',
        'DELETE /api/fuel/:id': 'Remove fuel record (Admin / Marine Engineer)',
      },
      maintenance: {
        'GET /api/maintenance': 'Maintenance schedules and work orders',
        'GET /api/maintenance/risk-matrix': 'Fleet-wide rule-based risk score assessment matrix',
        'POST /api/maintenance': 'Schedule equipment inspection or overhaul (Admin / Marine Engineer)',
        'PUT /api/maintenance/:id': 'Update status or complete task (Admin / Marine Engineer)',
        'DELETE /api/maintenance/:id': 'Delete maintenance task',
      },
      cargo: {
        'GET /api/cargo': 'Cargo shipments with tracking, quantity, weight, and status',
        'GET /api/cargo/:id': 'Detailed shipment record',
        'POST /api/cargo': 'Register shipment (Admin / Cargo Manager)',
        'PUT /api/cargo/:id': 'Progress status: Booked -> Loaded -> In Transit -> Delayed -> Delivered',
        'DELETE /api/cargo/:id': 'Delete shipment',
      },
      alerts: {
        'GET /api/alerts': 'Active maritime alerts with severity and recommended operational actions',
        'GET /api/alerts/unread-count': 'Count of open alerts for navbar badge',
        'POST /api/alerts/evaluate': 'Execute centralized rules engine',
        'PUT /api/alerts/:id/acknowledge': 'Mark alert acknowledged',
        'PUT /api/alerts/:id/resolve': 'Mark alert resolved',
      },
      settings: {
        'GET /api/settings': 'System operational thresholds and bunker fuel pricing',
        'PUT /api/settings': 'Update threshold parameters (Admin)',
      },
      users: {
        'GET /api/users': 'User accounts list (Admin)',
        'POST /api/users': 'Create user account (Admin)',
        'PUT /api/users/:id': 'Update account details or reset password (Admin)',
        'DELETE /api/users/:id': 'Deactivate/remove account (Admin)',
      },
      simulation: {
        'GET /api/simulation/status': 'Current simulation engine status',
        'POST /api/simulation/start': 'Begin simulated vessel transit along routes (Admin)',
        'POST /api/simulation/stop': 'Pause simulation engine (Admin)',
        'POST /api/simulation/step': 'Step forward 1 simulation cycle (Admin)',
        'POST /api/demo/reset': 'Reset database to rich realistic maritime sample dataset (Admin)',
      },
    },
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/vessels', vesselRoutes);
app.use('/api/voyages', voyageRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/cargo', cargoRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/simulation', simulationRouter);
app.post('/api/demo/reset', protect, authorize('Admin'), resetDemoData);

// 404 Handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' does not exist`,
    errors: ['Endpoint not found'],
  });
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;
