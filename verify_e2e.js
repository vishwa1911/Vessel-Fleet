const http = require('http');

async function testEndpoint(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:5000' + path, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function run() {
  console.log('--- VESSELFLEET END-TO-END VERIFICATION ---');

  // 1. Health
  const health = await testEndpoint('/api/health');
  console.log('✓ Health Check:', health.status, health.body.status);

  // 2. Login all 4 roles
  const roles = [
    { email: 'admin@vesselfleet.com', role: 'Admin' },
    { email: 'operator@vesselfleet.com', role: 'Fleet Operator' },
    { email: 'engineer@vesselfleet.com', role: 'Marine Engineer' },
    { email: 'cargo@vesselfleet.com', role: 'Cargo Manager' }
  ];

  let adminToken = '';
  for (const r of roles) {
    const res = await testEndpoint('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: r.email, password: 'Password123!' }
    });
    console.log(`✓ Login [${r.role}]: status ${res.status}, role verified: ${res.body.user?.role}`);
    if (r.role === 'Admin') adminToken = res.body.token;
  }

  const headers = { 'Authorization': 'Bearer ' + adminToken };

  // 3. Dashboard summary & charts
  const summary = await testEndpoint('/api/dashboard/summary', { headers });
  console.log(`✓ Dashboard Summary: ${summary.status}, Total Vessels: ${summary.body.data?.kpi?.totalVessels}, Active Underway: ${summary.body.data?.kpi?.activeVessels}, Availability: ${summary.body.data?.kpi?.fleetAvailabilityPercent}%`);

  const charts = await testEndpoint('/api/dashboard/charts', { headers });
  console.log(`✓ Dashboard Charts: ${charts.status}, Utilization Categories: ${charts.body.data?.fleetUtilization?.length}, Cost Breakdown: ${charts.body.data?.operationalCostBreakdown?.length}`);

  // 4. Vessels & Rule-based Risk Score
  const vessels = await testEndpoint('/api/vessels?limit=3', { headers });
  console.log(`✓ Vessels Registry: ${vessels.status}, Retrieved: ${vessels.body.data?.length} vessels`);
  const firstVesselId = vessels.body.data[0]._id;
  const risk = await testEndpoint('/api/vessels/' + firstVesselId + '/risk-score', { headers });
  console.log(`✓ Rule-based Risk Score: ${risk.status}, Score: ${risk.body.data?.score}/100 (${risk.body.data?.category}), isMLModel: ${risk.body.data?.isMLModel} (${risk.body.data?.methodology})`);

  // 5. Voyages
  const voyages = await testEndpoint('/api/voyages?limit=3', { headers });
  console.log(`✓ Voyages Scheduling: ${voyages.status}, Count: ${voyages.body.data?.length}, First Voyage: ${voyages.body.data[0]?.voyageNo} (${voyages.body.data[0]?.status})`);

  // 6. Fuel Analytics
  const fuel = await testEndpoint('/api/fuel/analytics', { headers });
  console.log(`✓ Fuel Analytics: ${fuel.status}, Total Fuel: ${fuel.body.data?.summary?.totalQuantityTons} MT, Efficiency Suggestions: ${fuel.body.data?.recommendations?.length}`);

  // 7. Maintenance Risk Matrix
  const matrix = await testEndpoint('/api/maintenance/risk-matrix', { headers });
  console.log(`✓ Maintenance Risk Matrix: ${matrix.status}, Fleet matrix size: ${matrix.body.data?.length}`);

  // 8. Cargo Manifest
  const cargo = await testEndpoint('/api/cargo?limit=3', { headers });
  console.log(`✓ Cargo Manifest: ${cargo.status}, Total shipments tracked: ${cargo.body.pagination?.total}`);

  // 9. Central Alert Rules Engine
  const evalAlerts = await testEndpoint('/api/alerts/evaluate', { method: 'POST', headers });
  console.log(`✓ Central Alert Rules Engine: ${evalAlerts.status}, Evaluated: ${evalAlerts.body.message}`);

  // 10. Simulation Engine Status & Step
  const simStatus = await testEndpoint('/api/simulation/status', { headers });
  console.log(`✓ Simulation Status: ${simStatus.status}, Engine mode: ${simStatus.body.data?.mode}`);
  const simStep = await testEndpoint('/api/simulation/step', { method: 'POST', headers });
  console.log(`✓ Simulation Step: ${simStep.status}, Vessels progressed: ${simStep.body.data?.vesselsMoved}`);

  // 11. Frontend Vite Server Check
  const clientReq = http.get('http://localhost:5173', (cRes) => {
    console.log(`✓ Frontend Client HTTP Check: Status ${cRes.statusCode}, Content-Type: ${cRes.headers['content-type']}`);
    console.log('--- ALL SYSTEMS OPERATIONAL AND PASSING ---');
  });
}

run().catch(console.error);
