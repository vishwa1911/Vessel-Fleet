const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');

let token;

beforeAll(async () => {
  await connectDB();

  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'admin@vesselfleet.com',
    password: 'Password123!',
  });
  token = loginRes.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Dashboard Aggregation API Flows', () => {
  it('should compute real-time KPI metrics from MongoDB', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const { kpi, cargoBreakdown, fleetLocations } = res.body.data;
    expect(kpi.totalVessels).toBeGreaterThan(0);
    expect(kpi.fleetAvailabilityPercent).toBeGreaterThanOrEqual(0);
    expect(kpi.totalFuelTons).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(cargoBreakdown)).toBe(true);
    expect(Array.isArray(fleetLocations)).toBe(true);
    expect(fleetLocations.length).toBe(kpi.totalVessels);
  });

  it('should compute charts data aggregations', async () => {
    const res = await request(app)
      .get('/api/dashboard/charts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fleetUtilization).toBeDefined();
    expect(res.body.data.fuelTrend).toBeDefined();
    expect(res.body.data.operationalCostBreakdown).toBeDefined();
  });
});
