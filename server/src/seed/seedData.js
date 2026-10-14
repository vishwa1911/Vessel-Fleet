const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Vessel = require('../models/Vessel');
const Voyage = require('../models/Voyage');
const PositionReport = require('../models/PositionReport');
const FuelRecord = require('../models/FuelRecord');
const MaintenanceTask = require('../models/MaintenanceTask');
const CargoShipment = require('../models/CargoShipment');
const Alert = require('../models/Alert');
const Settings = require('../models/Settings');
const defaultSettings = require('../config/defaultSettings');
const { calculateRouteDistanceNm } = require('../utils/distanceCalc');
const { evaluateAllAlerts } = require('../services/alertRulesEngine');

// Standard Major Maritime Waypoints / Sea Corridors (Demo Coordinates)
const PORTS = {
  SINGAPORE: { name: 'Port of Singapore', lat: 1.29027, lng: 103.851959 },
  ROTTERDAM: { name: 'Port of Rotterdam', lat: 51.9244, lng: 4.4777 },
  CHENNAI: { name: 'Chennai Port', lat: 13.0827, lng: 80.2707 },
  COLOMBO: { name: 'Port of Colombo', lat: 6.9271, lng: 79.8612 },
  DUBAI: { name: 'Jebel Ali Port (Dubai)', lat: 25.0084, lng: 55.0617 },
  ANTWERP: { name: 'Port of Antwerp', lat: 51.2194, lng: 4.4025 },
  SHANGHAI: { name: 'Port of Shanghai', lat: 31.2304, lng: 121.4737 },
  MUMBAI: { name: 'Jawaharlal Nehru Port (Mumbai)', lat: 18.9499, lng: 72.9515 },
  HONG_KONG: { name: 'Port of Hong Kong', lat: 22.3193, lng: 114.1694 },
  SUEZ: { name: 'Suez Canal Southern Entry', lat: 29.9737, lng: 32.5599 },
  MALACCA: { name: 'Strait of Malacca', lat: 2.2, lng: 102.2 },
  BAB_EL_MANDEB: { name: 'Bab-el-Mandeb Strait', lat: 12.5833, lng: 43.3333 },
  GIBRALTAR: { name: 'Strait of Gibraltar', lat: 35.9667, lng: -5.6 },
};

async function seedDatabase() {
  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Vessel.deleteMany({}),
    Voyage.deleteMany({}),
    PositionReport.deleteMany({}),
    FuelRecord.deleteMany({}),
    MaintenanceTask.deleteMany({}),
    CargoShipment.deleteMany({}),
    Alert.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  // 1. Seed Settings
  console.log('[Seed] Initializing default settings...');
  const settings = await Settings.create({
    ...defaultSettings,
  });

  // 2. Seed Users for each role
  console.log('[Seed] Creating demo user accounts for all roles...');
  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('Password123!', salt);

  const users = await User.create([
    {
      name: 'Captain Marcus Vance',
      email: 'admin@vesselfleet.com',
      passwordHash: commonPasswordHash,
      role: 'Admin',
      isActive: true,
    },
    {
      name: 'Elena Rostova',
      email: 'operator@vesselfleet.com',
      passwordHash: commonPasswordHash,
      role: 'Fleet Operator',
      isActive: true,
    },
    {
      name: 'Chief Engineer Chen Wei',
      email: 'engineer@vesselfleet.com',
      passwordHash: commonPasswordHash,
      role: 'Marine Engineer',
      isActive: true,
    },
    {
      name: 'Sarah Jenkins',
      email: 'cargo@vesselfleet.com',
      passwordHash: commonPasswordHash,
      role: 'Cargo Manager',
      isActive: true,
    },
  ]);

  // 3. Seed 12 Realistic Vessels
  console.log('[Seed] Seeding 12 maritime vessels...');
  const vesselData = [
    {
      name: 'Pacific Horizon',
      imoNumber: '9425611',
      type: 'Container Ship',
      flag: 'Singapore',
      capacityDwt: 145000,
      status: 'Active',
      specs: { lengthM: 366, beamM: 51, engineType: 'MAN B&W 11S90ME-C9.2', enginePowerKw: 68640, builtYear: 2019 },
      engineRunningHours: 14200,
      lastKnownPosition: { lat: 10.45, lng: 85.3, speedKnots: 19.4, heading: 275, source: 'demo-simulated' },
    },
    {
      name: 'Nordic Pioneer',
      imoNumber: '9784328',
      type: 'Bulk Carrier',
      flag: 'Marshall Islands',
      capacityDwt: 82000,
      status: 'Active',
      specs: { lengthM: 229, beamM: 32, engineType: 'Wartsila 6S50ME-C8', enginePowerKw: 9960, builtYear: 2021 },
      engineRunningHours: 8900,
      lastKnownPosition: { lat: 15.2, lng: 65.4, speedKnots: 13.8, heading: 310, source: 'demo-simulated' },
    },
    {
      name: 'Oceanic Titan',
      imoNumber: '9653199',
      type: 'Oil Tanker',
      flag: 'Liberia',
      capacityDwt: 318000,
      status: 'Active',
      specs: { lengthM: 333, beamM: 60, engineType: 'Hyundai-MAN B&W 7G80ME', enginePowerKw: 28350, builtYear: 2017 },
      engineRunningHours: 19400,
      lastKnownPosition: { lat: 24.1, lng: 58.7, speedKnots: 14.5, heading: 145, source: 'demo-simulated' },
    },
    {
      name: 'Starlight Aurora',
      imoNumber: '9832104',
      type: 'LNG Carrier',
      flag: 'Panama',
      capacityDwt: 95000,
      status: 'Active',
      specs: { lengthM: 299, beamM: 46, engineType: 'WinGD X-DF Dual-Fuel', enginePowerKw: 34000, builtYear: 2022 },
      engineRunningHours: 6200,
      lastKnownPosition: { lat: 12.8, lng: 104.2, speedKnots: 18.2, heading: 40, source: 'demo-simulated' },
    },
    {
      name: 'Baltic Merchant',
      imoNumber: '9512038',
      type: 'General Cargo',
      flag: 'Cyprus',
      capacityDwt: 38000,
      status: 'In Port',
      specs: { lengthM: 180, beamM: 28, engineType: 'Caterpillar MaK 8M43C', enginePowerKw: 8000, builtYear: 2015 },
      engineRunningHours: 24500,
      lastKnownPosition: { lat: PORTS.ROTTERDAM.lat, lng: PORTS.ROTTERDAM.lng, speedKnots: 0, heading: 0, source: 'manual' },
    },
    {
      name: 'Coral Explorer',
      imoNumber: '9689407',
      type: 'Chemical Tanker',
      flag: 'Singapore',
      capacityDwt: 49999,
      status: 'Active',
      specs: { lengthM: 183, beamM: 32, engineType: 'MAN 6S50ME-B9', enginePowerKw: 8200, builtYear: 2020 },
      engineRunningHours: 11200,
      lastKnownPosition: { lat: 11.2, lng: 92.8, speedKnots: 14.0, heading: 260, source: 'demo-simulated' },
    },
    {
      name: 'Aegean Mariner',
      imoNumber: '9398826',
      type: 'Container Ship',
      flag: 'Malta',
      capacityDwt: 110000,
      status: 'Under Maintenance',
      specs: { lengthM: 335, beamM: 45, engineType: 'Sulzer 12RTA96C', enginePowerKw: 65000, builtYear: 2014 },
      engineRunningHours: 32000,
      lastKnownPosition: { lat: PORTS.DUBAI.lat, lng: PORTS.DUBAI.lng, speedKnots: 0, heading: 0, source: 'manual' },
    },
    {
      name: 'Atlas Voyager',
      imoNumber: '9743912',
      type: 'Bulk Carrier',
      flag: 'Panama',
      capacityDwt: 64000,
      status: 'Active',
      specs: { lengthM: 199, beamM: 32, engineType: 'Mitsui-MAN B&W 6S50ME', enginePowerKw: 7500, builtYear: 2018 },
      engineRunningHours: 17800,
      lastKnownPosition: { lat: 7.8, lng: 77.2, speedKnots: 12.5, heading: 115, source: 'demo-simulated' },
    },
    {
      name: 'Equatorial Star',
      imoNumber: '9865147',
      type: 'Ro-Ro',
      flag: 'Bahamas',
      capacityDwt: 22000,
      status: 'In Port',
      specs: { lengthM: 200, beamM: 32, engineType: 'Wartsila 8L46F', enginePowerKw: 19200, builtYear: 2021 },
      engineRunningHours: 7400,
      lastKnownPosition: { lat: PORTS.CHENNAI.lat, lng: PORTS.CHENNAI.lng, speedKnots: 0, heading: 0, source: 'manual' },
    },
    {
      name: 'Caspian Leader',
      imoNumber: '9604823',
      type: 'Oil Tanker',
      flag: 'Liberia',
      capacityDwt: 158000,
      status: 'Active',
      specs: { lengthM: 274, beamM: 48, engineType: 'Hyundai-MAN 6G70ME', enginePowerKw: 16800, builtYear: 2016 },
      engineRunningHours: 21100,
      lastKnownPosition: { lat: 17.5, lng: 57.8, speedKnots: 15.1, heading: 210, source: 'demo-simulated' },
    },
    {
      name: 'Solaris Wave',
      imoNumber: '9912450',
      type: 'Container Ship',
      flag: 'Singapore',
      capacityDwt: 160000,
      status: 'Active',
      specs: { lengthM: 366, beamM: 51, engineType: 'WinGD 10X92', enginePowerKw: 72000, builtYear: 2023 },
      engineRunningHours: 3500,
      lastKnownPosition: { lat: 5.6, lng: 97.4, speedKnots: 20.2, heading: 305, source: 'demo-simulated' },
    },
    {
      name: 'Meridian Trader',
      imoNumber: '9488319',
      type: 'General Cargo',
      flag: 'Panama',
      capacityDwt: 45000,
      status: 'Idle',
      specs: { lengthM: 190, beamM: 30, engineType: 'MAN 6S46MC-C', enginePowerKw: 7860, builtYear: 2013 },
      engineRunningHours: 28900,
      lastKnownPosition: { lat: PORTS.COLOMBO.lat, lng: PORTS.COLOMBO.lng, speedKnots: 0, heading: 0, source: 'manual' },
    },
  ];

  const vessels = await Vessel.create(vesselData);
  const vesselMap = {};
  vessels.forEach((v) => {
    vesselMap[v.name] = v;
  });

  // 4. Seed 20 Realistic Voyages
  console.log('[Seed] Seeding 20 maritime voyages...');
  const now = new Date();
  const day = 24 * 3600 * 1000;

  const voyageDefinitions = [
    {
      voyageNo: 'VOY-2026-001',
      vessel: vesselMap['Pacific Horizon']._id,
      origin: PORTS.SINGAPORE,
      destination: PORTS.ROTTERDAM,
      waypoints: [PORTS.MALACCA, PORTS.COLOMBO, PORTS.BAB_EL_MANDEB, PORTS.SUEZ, PORTS.GIBRALTAR],
      departureDate: new Date(now.getTime() - 12 * day),
      estimatedArrival: new Date(now.getTime() + 8 * day),
      status: 'In Progress',
      progressPercent: 62,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-002',
      vessel: vesselMap['Nordic Pioneer']._id,
      origin: PORTS.MUMBAI,
      destination: PORTS.DUBAI,
      waypoints: [{ lat: 21.0, lng: 64.0, name: 'Arabian Sea Crossing' }],
      departureDate: new Date(now.getTime() - 2 * day),
      estimatedArrival: new Date(now.getTime() + 1 * day),
      status: 'In Progress',
      progressPercent: 70,
      delayHours: 4,
    },
    {
      voyageNo: 'VOY-2026-003',
      vessel: vesselMap['Oceanic Titan']._id,
      origin: PORTS.DUBAI,
      destination: PORTS.SINGAPORE,
      waypoints: [{ lat: 18.0, lng: 65.0, name: 'North Arabian Sea' }, PORTS.COLOMBO, PORTS.MALACCA],
      departureDate: new Date(now.getTime() - 4 * day),
      estimatedArrival: new Date(now.getTime() + 6 * day),
      status: 'In Progress',
      progressPercent: 42,
      delayHours: 16, // Delayed!
    },
    {
      voyageNo: 'VOY-2026-004',
      vessel: vesselMap['Starlight Aurora']._id,
      origin: PORTS.SINGAPORE,
      destination: PORTS.SHANGHAI,
      waypoints: [{ lat: 12.0, lng: 112.0, name: 'South China Sea Corridor' }, PORTS.HONG_KONG],
      departureDate: new Date(now.getTime() - 3 * day),
      estimatedArrival: new Date(now.getTime() + 2 * day),
      status: 'In Progress',
      progressPercent: 55,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-005',
      vessel: vesselMap['Coral Explorer']._id,
      origin: PORTS.SINGAPORE,
      destination: PORTS.CHENNAI,
      waypoints: [PORTS.MALACCA, { lat: 8.5, lng: 90.0, name: 'Bay of Bengal Deepwater' }],
      departureDate: new Date(now.getTime() - 3 * day),
      estimatedArrival: new Date(now.getTime() + 1 * day),
      status: 'In Progress',
      progressPercent: 78,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-006',
      vessel: vesselMap['Atlas Voyager']._id,
      origin: PORTS.COLOMBO,
      destination: PORTS.CHENNAI,
      waypoints: [{ lat: 9.0, lng: 80.5, name: 'Palk Strait Route' }],
      departureDate: new Date(now.getTime() - 1 * day),
      estimatedArrival: new Date(now.getTime() + 1 * day),
      status: 'In Progress',
      progressPercent: 48,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-007',
      vessel: vesselMap['Caspian Leader']._id,
      origin: PORTS.DUBAI,
      destination: PORTS.MUMBAI,
      waypoints: [{ lat: 22.5, lng: 62.0, name: 'Gulf of Oman' }],
      departureDate: new Date(now.getTime() - 2 * day),
      estimatedArrival: new Date(now.getTime() - 4 * 3600 * 1000), // ETA in past!
      status: 'Delayed',
      progressPercent: 88,
      delayHours: 18,
    },
    {
      voyageNo: 'VOY-2026-008',
      vessel: vesselMap['Solaris Wave']._id,
      origin: PORTS.SHANGHAI,
      destination: PORTS.ROTTERDAM,
      waypoints: [PORTS.HONG_KONG, PORTS.SINGAPORE, PORTS.COLOMBO, PORTS.SUEZ, PORTS.GIBRALTAR],
      departureDate: new Date(now.getTime() - 6 * day),
      estimatedArrival: new Date(now.getTime() + 18 * day),
      status: 'In Progress',
      progressPercent: 28,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-009',
      vessel: vesselMap['Baltic Merchant']._id,
      origin: PORTS.ANTWERP,
      destination: PORTS.ROTTERDAM,
      waypoints: [],
      departureDate: new Date(now.getTime() - 15 * day),
      estimatedArrival: new Date(now.getTime() - 13 * day),
      actualArrival: new Date(now.getTime() - 13 * day),
      status: 'Completed',
      progressPercent: 100,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-010',
      vessel: vesselMap['Equatorial Star']._id,
      origin: PORTS.SINGAPORE,
      destination: PORTS.CHENNAI,
      waypoints: [PORTS.MALACCA],
      departureDate: new Date(now.getTime() - 8 * day),
      estimatedArrival: new Date(now.getTime() - 3 * day),
      actualArrival: new Date(now.getTime() - 3 * day),
      status: 'Completed',
      progressPercent: 100,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-011',
      vessel: vesselMap['Meridian Trader']._id,
      origin: PORTS.CHENNAI,
      destination: PORTS.COLOMBO,
      waypoints: [],
      departureDate: new Date(now.getTime() - 10 * day),
      estimatedArrival: new Date(now.getTime() - 7 * day),
      actualArrival: new Date(now.getTime() - 7 * day),
      status: 'Completed',
      progressPercent: 100,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-012',
      vessel: vesselMap['Nordic Pioneer']._id,
      origin: PORTS.DUBAI,
      destination: PORTS.ROTTERDAM,
      waypoints: [PORTS.BAB_EL_MANDEB, PORTS.SUEZ, PORTS.GIBRALTAR],
      departureDate: new Date(now.getTime() + 5 * day),
      estimatedArrival: new Date(now.getTime() + 22 * day),
      status: 'Planned',
      progressPercent: 0,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-013',
      vessel: vesselMap['Baltic Merchant']._id,
      origin: PORTS.ROTTERDAM,
      destination: PORTS.ANTWERP,
      waypoints: [],
      departureDate: new Date(now.getTime() + 3 * day),
      estimatedArrival: new Date(now.getTime() + 5 * day),
      status: 'Planned',
      progressPercent: 0,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-014',
      vessel: vesselMap['Equatorial Star']._id,
      origin: PORTS.CHENNAI,
      destination: PORTS.MUMBAI,
      waypoints: [PORTS.COLOMBO],
      departureDate: new Date(now.getTime() + 4 * day),
      estimatedArrival: new Date(now.getTime() + 9 * day),
      status: 'Planned',
      progressPercent: 0,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-015',
      vessel: vesselMap['Aegean Mariner']._id,
      origin: PORTS.DUBAI,
      destination: PORTS.SINGAPORE,
      waypoints: [PORTS.COLOMBO, PORTS.MALACCA],
      departureDate: new Date(now.getTime() + 10 * day),
      estimatedArrival: new Date(now.getTime() + 20 * day),
      status: 'Planned',
      progressPercent: 0,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-016',
      vessel: vesselMap['Meridian Trader']._id,
      origin: PORTS.COLOMBO,
      destination: PORTS.DUBAI,
      waypoints: [{ lat: 14.0, lng: 70.0, name: 'Central Arabian Sea' }],
      departureDate: new Date(now.getTime() + 7 * day),
      estimatedArrival: new Date(now.getTime() + 13 * day),
      status: 'Planned',
      progressPercent: 0,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-017',
      vessel: vesselMap['Pacific Horizon']._id,
      origin: PORTS.ROTTERDAM,
      destination: PORTS.ANTWERP,
      waypoints: [],
      departureDate: new Date(now.getTime() + 12 * day),
      estimatedArrival: new Date(now.getTime() + 14 * day),
      status: 'Planned',
      progressPercent: 0,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-018',
      vessel: vesselMap['Oceanic Titan']._id,
      origin: PORTS.SINGAPORE,
      destination: PORTS.SHANGHAI,
      waypoints: [PORTS.HONG_KONG],
      departureDate: new Date(now.getTime() + 9 * day),
      estimatedArrival: new Date(now.getTime() + 15 * day),
      status: 'Planned',
      progressPercent: 0,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-019',
      vessel: vesselMap['Coral Explorer']._id,
      origin: PORTS.CHENNAI,
      destination: PORTS.COLOMBO,
      waypoints: [],
      departureDate: new Date(now.getTime() + 4 * day),
      estimatedArrival: new Date(now.getTime() + 6 * day),
      status: 'Planned',
      progressPercent: 0,
      delayHours: 0,
    },
    {
      voyageNo: 'VOY-2026-020',
      vessel: vesselMap['Solaris Wave']._id,
      origin: PORTS.HONG_KONG,
      destination: PORTS.SINGAPORE,
      waypoints: [{ lat: 15.0, lng: 110.0, name: 'Paracel Passage' }],
      departureDate: new Date(now.getTime() - 25 * day),
      estimatedArrival: new Date(now.getTime() - 21 * day),
      actualArrival: new Date(now.getTime() - 21 * day),
      status: 'Completed',
      progressPercent: 100,
      delayHours: 0,
    },
  ];

  const voyages = [];
  for (const vDef of voyageDefinitions) {
    const dist = calculateRouteDistanceNm(vDef.origin, vDef.waypoints, vDef.destination);
    const plannedFuel = Math.round(dist * 0.032);
    const v = await Voyage.create({
      ...vDef,
      plannedDistanceNm: dist,
      plannedFuelTons: plannedFuel,
    });
    voyages.push(v);
  }

  const voyageMap = {};
  voyages.forEach((v) => {
    voyageMap[v.voyageNo] = v;
  });

  // 5. Seed Position Reports for In Progress Voyages
  console.log('[Seed] Seeding simulated position reports...');
  const positionReports = [];
  for (const v of vessels.filter((v) => v.status === 'Active')) {
    const activeV = voyages.find((vy) => String(vy.vessel) === String(v._id) && vy.status === 'In Progress');
    if (activeV && v.lastKnownPosition) {
      for (let i = 5; i >= 0; i--) {
        const offset = i * 0.15;
        positionReports.push({
          vessel: v._id,
          voyage: activeV._id,
          lat: Number((v.lastKnownPosition.lat - offset * 0.5).toFixed(4)),
          lng: Number((v.lastKnownPosition.lng - offset).toFixed(4)),
          speedKnots: v.lastKnownPosition.speedKnots,
          heading: v.lastKnownPosition.heading,
          timestamp: new Date(now.getTime() - i * 3600 * 1000 * 3),
          source: 'demo-simulated',
        });
      }
    }
  }
  await PositionReport.insertMany(positionReports);

  // 6. Seed Fuel Records (Past 30 days)
  console.log('[Seed] Seeding fuel records with tons/day & tons/NM...');
  const fuelRecords = [];
  for (let i = 0; i < 24; i++) {
    const targetVessel = vessels[i % vessels.length];
    const relatedVoyage = voyages.find((vy) => String(vy.vessel) === String(targetVessel._id));
    const qty = Number((35 + (i % 7) * 4.5).toFixed(1));
    const dist = Number((qty * 28 + (i % 5) * 12).toFixed(1));
    const date = new Date(now.getTime() - (28 - i) * day);

    // Make one record intentionally high consumption to trigger alert
    const isOveruse = i === 18;
    const finalQty = isOveruse ? qty * 1.4 : qty;

    fuelRecords.push({
      vessel: targetVessel._id,
      voyage: relatedVoyage ? relatedVoyage._id : null,
      date,
      fuelType: ['VLSFO', 'LSMGO', 'HFO'][i % 3],
      quantityTons: Number(finalQty.toFixed(1)),
      pricePerTon: settings.fuelPricePerTon || 650,
      distanceNm: dist,
      source: i % 2 === 0 ? 'measured' : 'simulated',
    });
  }

  for (const fr of fuelRecords) {
    await FuelRecord.create(fr);
  }

  // 7. Seed Maintenance Tasks
  console.log('[Seed] Seeding maintenance tasks with running hours & overdue items...');
  const maintenanceTasks = [
    {
      vessel: vesselMap['Pacific Horizon']._id,
      equipment: 'Main Engine Cylinder Liners #1-#6',
      taskType: 'Inspection',
      priority: 'High',
      scheduledDate: new Date(now.getTime() + 14 * day),
      status: 'Scheduled',
      runningHoursThreshold: 16000,
      estimatedCost: 18500,
      notes: 'Routine boroscopic inspection and piston ring clearance check.',
    },
    {
      vessel: vesselMap['Nordic Pioneer']._id,
      equipment: 'Turbocharger Bearing Assembly',
      taskType: 'Overhaul',
      priority: 'Critical',
      scheduledDate: new Date(now.getTime() - 5 * day), // Overdue!
      status: 'Overdue',
      runningHoursThreshold: 8000,
      estimatedCost: 32000,
      notes: 'Vibration monitoring flagged anomalous frequency at 12,000 RPM.',
    },
    {
      vessel: vesselMap['Oceanic Titan']._id,
      equipment: 'Auxiliary Diesel Generator #2',
      taskType: 'Repair',
      priority: 'High',
      scheduledDate: new Date(now.getTime() - 2 * day), // Overdue!
      status: 'Overdue',
      runningHoursThreshold: 18000,
      estimatedCost: 14200,
      notes: 'Fuel injector leak detected during sea trials.',
    },
    {
      vessel: vesselMap['Starlight Aurora']._id,
      equipment: 'Cryogenic Boil-off Gas Compressor',
      taskType: 'Inspection',
      priority: 'Medium',
      scheduledDate: new Date(now.getTime() + 25 * day),
      status: 'Scheduled',
      runningHoursThreshold: 10000,
      estimatedCost: 9500,
      notes: 'Dual-fuel gas valve unit calibration.',
    },
    {
      vessel: vesselMap['Baltic Merchant']._id,
      equipment: 'Steering Gear Hydraulic Actuator',
      taskType: 'Inspection',
      priority: 'Medium',
      scheduledDate: new Date(now.getTime() - 40 * day),
      completedDate: new Date(now.getTime() - 38 * day),
      status: 'Completed',
      runningHoursThreshold: 20000,
      estimatedCost: 6500,
      notes: 'Hydraulic seals renewed, pressure tested to 210 bar.',
    },
    {
      vessel: vesselMap['Coral Explorer']._id,
      equipment: 'Cargo Tank Deepwell Pumps',
      taskType: 'Inspection',
      priority: 'High',
      scheduledDate: new Date(now.getTime() + 6 * day),
      status: 'Scheduled',
      runningHoursThreshold: 12000,
      estimatedCost: 11000,
      notes: 'Stainless steel impeller inspection before chemical loading.',
    },
    {
      vessel: vesselMap['Aegean Mariner']._id,
      equipment: 'Main Engine Crankshaft Alignment & Bearings',
      taskType: 'Overhaul',
      priority: 'Critical',
      scheduledDate: new Date(now.getTime() - 1 * day),
      status: 'In Progress',
      runningHoursThreshold: 30000,
      estimatedCost: 85000,
      notes: 'Major drydock overhaul at Jebel Ali Maritime Shipyard.',
    },
    {
      vessel: vesselMap['Atlas Voyager']._id,
      equipment: 'Oily Water Separator (Bilge Alarm 15ppm)',
      taskType: 'Repair',
      priority: 'Medium',
      scheduledDate: new Date(now.getTime() + 18 * day),
      status: 'Scheduled',
      runningHoursThreshold: 15000,
      estimatedCost: 4800,
      notes: 'MARPOL Annex I compliance recalibration.',
    },
    {
      vessel: vesselMap['Solaris Wave']._id,
      equipment: 'Exhaust Gas Cleaning System (Scrubber)',
      taskType: 'Inspection',
      priority: 'Low',
      scheduledDate: new Date(now.getTime() + 45 * day),
      status: 'Scheduled',
      runningHoursThreshold: 5000,
      estimatedCost: 7200,
      notes: 'Washwater pH sensor check.',
    },
  ];

  await MaintenanceTask.insertMany(maintenanceTasks);

  // 8. Seed ~30 Cargo Shipments
  console.log('[Seed] Seeding 30 cargo shipments...');
  const cargoTypes = [
    { type: 'Consumer Electronics & Machinery', unit: 'TEU' },
    { type: 'Automotive Parts & Components', unit: 'TEU' },
    { type: 'Wheat & Grain Bulk', unit: 'Metric Tons' },
    { type: 'Crude Petroleum Oil', unit: 'Barrels' },
    { type: 'Liquefied Natural Gas (LNG)', unit: 'CBM' },
    { type: 'Industrial Petrochemicals', unit: 'Metric Tons' },
    { type: 'Iron Ore & Mineral Pellets', unit: 'Metric Tons' },
    { type: 'Refrigerated Pharmaceuticals & Perishables', unit: 'TEU' },
    { type: 'Heavy Mining Machinery', unit: 'Units' },
    { type: 'Renewable Solar Panels & Inverters', unit: 'TEU' },
  ];

  const statuses = ['Booked', 'Loaded', 'In Transit', 'Delayed', 'Delivered'];
  const cargoShipments = [];

  for (let i = 1; i <= 30; i++) {
    const cargoMeta = cargoTypes[i % cargoTypes.length];
    const shipmentNo = `SHP-2026-${String(i).padStart(4, '0')}`;
    const assignedVoyage = voyages[i % voyages.length];
    const assignedVessel = vessels.find((v) => String(v._id) === String(assignedVoyage.vessel));

    let status = statuses[i % statuses.length];
    // If voyage is delayed, mark transit cargo as delayed
    if (assignedVoyage.status === 'Delayed' && (status === 'In Transit' || status === 'Loaded')) {
      status = 'Delayed';
    } else if (assignedVoyage.status === 'Completed') {
      status = 'Delivered';
    } else if (assignedVoyage.status === 'Planned') {
      status = 'Booked';
    }

    const qty = cargoMeta.unit === 'TEU' ? 250 + (i % 8) * 80 : 12000 + (i % 5) * 5000;
    const weightTons = Number((qty * (cargoMeta.unit === 'TEU' ? 14 : 0.95)).toFixed(1));

    cargoShipments.push({
      shipmentNo,
      cargoType: cargoMeta.type,
      quantity: qty,
      unit: cargoMeta.unit,
      weightTons,
      origin: assignedVoyage.origin.name,
      destination: assignedVoyage.destination.name,
      vessel: assignedVessel ? assignedVessel._id : null,
      voyage: assignedVoyage._id,
      status,
      estimatedDelivery: assignedVoyage.estimatedArrival,
      actualDelivery: status === 'Delivered' ? assignedVoyage.actualArrival || now : null,
    });
  }

  await CargoShipment.insertMany(cargoShipments);

  // 9. Run Alert Rules Engine
  console.log('[Seed] Evaluating centralized alert rules...');
  const alertEvaluation = await evaluateAllAlerts();

  console.log(`[Seed] Seed process completed successfully!`);
  console.log(`  - Users: ${users.length} (Admin, Fleet Operator, Marine Engineer, Cargo Manager)`);
  console.log(`  - Vessels: ${vessels.length}`);
  console.log(`  - Voyages: ${voyages.length}`);
  console.log(`  - Fuel Records: ${fuelRecords.length}`);
  console.log(`  - Maintenance Tasks: ${maintenanceTasks.length}`);
  console.log(`  - Cargo Shipments: ${cargoShipments.length}`);
  console.log(`  - Open Alerts Created: ${alertEvaluation.newAlertsCount}`);

  return {
    users: users.length,
    vessels: vessels.length,
    voyages: voyages.length,
    fuelRecords: fuelRecords.length,
    maintenanceTasks: maintenanceTasks.length,
    cargoShipments: cargoShipments.length,
    alertsCreated: alertEvaluation.newAlertsCount,
  };
}

module.exports = { seedDatabase };
