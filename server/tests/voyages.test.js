const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');

let operatorToken;
let sampleVesselId;

beforeAll(async () => {
  await connectDB();

  const opLogin = await request(app).post('/api/auth/login').send({
    email: 'operator@vesselfleet.com',
    password: 'Password123!',
  });
  operatorToken = opLogin.body.token;

  const vesselsRes = await request(app)
    .get('/api/vessels?limit=1')
    .set('Authorization', `Bearer ${operatorToken}`);

  sampleVesselId = vesselsRes.body.data[0]._id;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Voyage Scheduling & Route API Flows', () => {
  it('should list voyages with populated vessel', async () => {
    const res = await request(app)
      .get('/api/voyages?limit=5')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].vessel).toBeDefined();
  });

  it('should create a new planned voyage and compute distance automatically', async () => {
    const uniqueVoyageNo = `TEST-VOY-${Date.now().toString().slice(-6)}`;
    const departure = new Date(Date.now() + 60 * 24 * 3600 * 1000);
    const arrival = new Date(Date.now() + 65 * 24 * 3600 * 1000);

    const voyageData = {
      voyageNo: uniqueVoyageNo,
      vessel: sampleVesselId,
      origin: { name: 'Port of Singapore', lat: 1.29027, lng: 103.851959 },
      destination: { name: 'Port of Colombo', lat: 6.9271, lng: 79.8612 },
      waypoints: [{ name: 'Strait of Malacca', lat: 2.2, lng: 102.2 }],
      departureDate: departure.toISOString(),
      estimatedArrival: arrival.toISOString(),
      status: 'Planned',
    };

    const res = await request(app)
      .post('/api/voyages')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send(voyageData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.voyageNo).toBe(uniqueVoyageNo);
    expect(res.body.data.plannedDistanceNm).toBeGreaterThan(100);
  });

  it('should prevent double-booking the vessel for an overlapping voyage schedule', async () => {
    // Attempt to book the same vessel on overlapping dates
    const departure = new Date(Date.now() + 61 * 24 * 3600 * 1000);
    const arrival = new Date(Date.now() + 64 * 24 * 3600 * 1000);

    const conflictingVoyage = {
      voyageNo: `CONFLICT-VOY-${Date.now().toString().slice(-6)}`,
      vessel: sampleVesselId,
      origin: { name: 'Port of Singapore', lat: 1.29027, lng: 103.851959 },
      destination: { name: 'Chennai Port', lat: 13.0827, lng: 80.2707 },
      departureDate: departure.toISOString(),
      estimatedArrival: arrival.toISOString(),
      status: 'Planned',
    };

    const res = await request(app)
      .post('/api/voyages')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send(conflictingVoyage);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already booked');
  });
});
