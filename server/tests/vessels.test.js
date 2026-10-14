const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');

let adminToken;
let operatorToken;

beforeAll(async () => {
  await connectDB();

  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin@vesselfleet.com',
    password: 'Password123!',
  });
  adminToken = adminLogin.body.token;

  const opLogin = await request(app).post('/api/auth/login').send({
    email: 'operator@vesselfleet.com',
    password: 'Password123!',
  });
  operatorToken = opLogin.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Vessel Management API Flows', () => {
  it('should list vessels with pagination', async () => {
    const res = await request(app)
      .get('/api/vessels?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThan(0);
  });

  it('should filter vessels by status', async () => {
    const res = await request(app)
      .get('/api/vessels?status=Active')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach((v) => {
      expect(v.status).toBe('Active');
    });
  });

  it('should allow Admin to create a new vessel', async () => {
    const uniqueImo = String(Math.floor(1000000 + Math.random() * 9000000));
    const newVessel = {
      name: `Test Vessel ${uniqueImo}`,
      imoNumber: uniqueImo,
      type: 'Container Ship',
      flag: 'Panama',
      capacityDwt: 55000,
      status: 'Active',
      specs: { lengthM: 260, beamM: 32, enginePowerKw: 30000, builtYear: 2020 },
    };

    const res = await request(app)
      .post('/api/vessels')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newVessel);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.imoNumber).toBe(uniqueImo);
  });

  it('should compute rule-based risk score for a vessel', async () => {
    const vesselsRes = await request(app)
      .get('/api/vessels?limit=1')
      .set('Authorization', `Bearer ${adminToken}`);

    const vesselId = vesselsRes.body.data[0]._id;

    const res = await request(app)
      .get(`/api/vessels/${vesselId}/risk-score`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.score).toBeGreaterThanOrEqual(0);
    expect(res.body.data.score).toBeLessThanOrEqual(100);
    expect(res.body.data.category).toBeDefined();
    expect(res.body.data.isMLModel).toBe(false); // Explicitly verifies rule-based label
  });

  it('should reject vessel deletion by non-admin', async () => {
    const vesselsRes = await request(app)
      .get('/api/vessels?limit=1')
      .set('Authorization', `Bearer ${adminToken}`);

    const vesselId = vesselsRes.body.data[0]._id;

    const res = await request(app)
      .delete(`/api/vessels/${vesselId}`)
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(res.statusCode).toBe(403);
  });
});
