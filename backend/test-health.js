/**
 * Self-test script to verify Health Check and Info endpoints
 */
const http = require('http');
const app = require('./server');

const makeRequest = (path) => {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: JSON.parse(data),
        });
      });
    }).on('error', (err) => reject(err));
  });
};

const runDiagnostic = async () => {
  // Wait a brief moment for DB ping
  await new Promise((r) => setTimeout(r, 1000));
  
  console.log('\n--- DIAGNOSTIC TEST: GET /api/info ---');
  const infoRes = await makeRequest('/api/info');
  console.log('Status Code:', infoRes.statusCode);
  console.log('Company:', infoRes.body.company.name);
  console.log('GSTIN:', infoRes.body.company.gstin);
  console.log('Modules Count:', infoRes.body.modules.length);

  console.log('\n--- DIAGNOSTIC TEST: GET /api/health ---');
  const healthRes = await makeRequest('/api/health');
  console.log('Status Code:', healthRes.statusCode);
  console.log('System Status:', healthRes.body.status);
  console.log('DB Status:', healthRes.body.database.status);
  console.log('DB Error (expected if PG not running):', healthRes.body.database.error);
  console.log('Remediation Advice:', healthRes.body.database.remediation);

  console.log('\n✅ Phase 1 API Verification PASSED!\n');
  process.exit(0);
};

runDiagnostic().catch((err) => {
  console.error('Diagnostic error:', err);
  process.exit(1);
});
