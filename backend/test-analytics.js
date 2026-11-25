// ============================================================================
// Phase 14: Reports & Analytics System - Automated Test Suite
// Sri Meenakshi Agro & Traditional Foods Pvt Ltd
// ============================================================================

const http = require('http');

let app;
try {
  app = require('./server');
} catch (e) {
  console.error('Failed to load server:', e);
  process.exit(1);
}

let tokenAdmin = '';
let tokenOwner = '';
let tokenAccountant = '';
let tokenProduction = '';
let tokenSalesman = '';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let resBody = '';
      res.on('data', (chunk) => (resBody += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(resBody);
          resolve({ status: res.status, statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.status, statusCode: res.statusCode, raw: resBody });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (data) req.write(data);
    req.end();
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  await sleep(1500);

  console.log('\n================================================================');
  console.log('🧪 RUNNING PHASE 14: REPORTS & ANALYTICS SYSTEM TEST SUITE');
  console.log('================================================================\n');

  // STEP 1: AUTHENTICATION
  console.log('--- STEP 1: AUTHENTICATING USER ROLES ---');
  try {
    const resA = await request('POST', '/api/auth/login', { email: 'admin@meenakshifoods.in', password: 'Admin@123' });
    tokenAdmin = resA.body.token || resA.body.data?.token;
    assert(resA.statusCode === 200 && tokenAdmin, 'Admin login successful');

    const resO = await request('POST', '/api/auth/login', { email: 'owner@meenakshifoods.in', password: 'Owner@123' });
    tokenOwner = resO.body.token || resO.body.data?.token;
    assert(resO.statusCode === 200 && tokenOwner, 'Owner login successful');

    const resAcc = await request('POST', '/api/auth/login', { email: 'auditor@meenakshifoods.in', password: 'Auditor@123' });
    tokenAccountant = resAcc.body.token || resAcc.body.data?.token;
    assert(resAcc.statusCode === 200 && tokenAccountant, 'Accountant login successful');

    const resP = await request('POST', '/api/auth/login', { email: 'production@meenakshifoods.in', password: 'Production@123' });
    tokenProduction = resP.body.token || resP.body.data?.token;
    assert(resP.statusCode === 200 && tokenProduction, 'Production supervisor login successful');

    const resS = await request('POST', '/api/auth/login', { email: 'sales@meenakshifoods.in', password: 'Sales@123' });
    tokenSalesman = resS.body.token || resS.body.data?.token;
    assert(resS.statusCode === 200 && tokenSalesman, 'Salesman login successful');
  } catch (err) {
    console.error('Authentication failed:', err.message);
    process.exit(1);
  }

  // STEP 2: EXECUTIVE DASHBOARD & RBAC
  console.log('\n--- STEP 2: EXECUTIVE DASHBOARD KPIS & RBAC ---');
  const execRes = await request('GET', '/api/analytics/executive-dashboard', null, tokenOwner);
  assert(execRes.statusCode === 200 && execRes.body.success, 'Owner retrieves Executive Dashboard');
  assert(execRes.body.data.kpis && execRes.body.data.kpis.totalSales > 0, 'Aggregates Total Sales metric');
  assert(execRes.body.data.kpis.totalRevenue > 0, 'Aggregates Total Collected Revenue');
  assert(execRes.body.data.kpis.totalInventoryValue > 0, 'Aggregates Total Inventory Valuation');
  assert(Array.isArray(execRes.body.data.monthlyTrends) && execRes.body.data.monthlyTrends.length === 12, '12-Month Historical Financial Trends');

  // RBAC check: Salesman must be blocked from Executive Dashboard
  const execBlocked = await request('GET', '/api/analytics/executive-dashboard', null, tokenSalesman);
  assert(execBlocked.statusCode === 403, 'RBAC: Salesman is blocked from Executive Dashboard (HTTP 403)');

  // STEP 3: SALES ANALYTICS
  console.log('\n--- STEP 3: SALES ANALYTICS MODULE ---');
  const salesRes = await request('GET', '/api/analytics/sales', null, tokenSalesman);
  assert(salesRes.statusCode === 200 && salesRes.body.success, 'Salesman retrieves Sales Analytics');
  assert(salesRes.body.data.summary.total_sales > 0, 'Sales summary total calculation');
  assert(Array.isArray(salesRes.body.data.topCustomers) && salesRes.body.data.topCustomers.length > 0, 'Top customer revenue ranking');
  assert(Array.isArray(salesRes.body.data.topProducts) && salesRes.body.data.topProducts.length > 0, 'Top product volume and revenue');

  // STEP 4: PURCHASE & 3-WAY MATCHING ANALYTICS
  console.log('\n--- STEP 4: PURCHASE & 3-WAY MATCHING ANALYTICS ---');
  const purchRes = await request('GET', '/api/analytics/purchase', null, tokenAdmin);
  assert(purchRes.statusCode === 200 && purchRes.body.success, 'Admin retrieves Purchase Analytics');
  assert(purchRes.body.data.matchSummary && typeof purchRes.body.data.matchSummary.matched === 'number', '3-Way Match Audit Breakdown (Matched vs Discrepancy)');
  assert(Array.isArray(purchRes.body.data.topSuppliers) && purchRes.body.data.topSuppliers.length > 0, 'Top supplier spend distribution');

  // STEP 5: INVENTORY ANALYTICS (Single Source of Truth: Phase 6 Ledger)
  console.log('\n--- STEP 5: INVENTORY VALUATION & BATCH EXPIRY ---');
  const invRes = await request('GET', '/api/analytics/inventory', null, tokenProduction);
  assert(invRes.statusCode === 200 && invRes.body.success, 'Production supervisor retrieves Inventory Analytics');
  assert(invRes.body.data.summary.total_valuation > 0, 'Phase 6 Stock Ledger inventory valuation');
  assert(Array.isArray(invRes.body.data.categoryValuation) && invRes.body.data.categoryValuation.length >= 3, 'Valuation split across Raw Material, Packaging & Finished Goods');
  assert(Array.isArray(invRes.body.data.stockAlerts), 'Low stock and reorder alert tracking');

  // STEP 6: PRODUCTION ANALYTICS
  console.log('\n--- STEP 6: PRODUCTION OUTPUT & DOWNTIME ANALYSIS ---');
  const prodRes = await request('GET', '/api/analytics/production', null, tokenProduction);
  assert(prodRes.statusCode === 200 && prodRes.body.success, 'Production supervisor retrieves Production Analytics');
  assert(prodRes.body.data.summary.yield_efficiency > 0, 'Calculates Batch Yield Efficiency %');
  assert(Array.isArray(prodRes.body.data.downtimeBreakdown) && prodRes.body.data.downtimeBreakdown.length > 0, 'Machine downtime root-cause breakdown');

  // STEP 7: QUALITY & CAPA ANALYTICS
  console.log('\n--- STEP 7: QUALITY INSPECTION YIELD & CAPA STATUS ---');
  const qualRes = await request('GET', '/api/analytics/quality', null, tokenAdmin);
  assert(qualRes.statusCode === 200 && qualRes.body.success, 'Admin retrieves Quality Analytics');
  assert(qualRes.body.data.summary.overall_pass_rate > 0, 'Calculates Overall Inspection Yield %');
  assert(Array.isArray(qualRes.body.data.defectPareto) && qualRes.body.data.defectPareto.length > 0, 'Defect Pareto frequency and cumulative curve');
  assert(qualRes.body.data.capaMetrics && qualRes.body.data.capaMetrics.total_capas >= 0, 'Phase 8 CAPA open vs closed metrics');

  // STEP 8: PRODUCT COSTING & UNIT MARGINS (GST Excluded)
  console.log('\n--- STEP 8: PRODUCT COSTING & UNIT MARGINS ---');
  const costRes = await request('GET', '/api/analytics/costing', null, tokenAccountant);
  assert(costRes.statusCode === 200 && costRes.body.success, 'Accountant retrieves Costing Analytics');
  assert(Array.isArray(costRes.body.data.costBreakdown) && costRes.body.data.costBreakdown.length >= 4, 'Direct material, labour, machine power, and overhead breakdown');
  assert(costRes.body.data.costBreakdown.every(c => !c.component.includes('GST')), 'Statutory GST strictly excluded from manufacturing cost');
  assert(Array.isArray(costRes.body.data.productMargins) && costRes.body.data.productMargins.length > 0, 'Calculates unit gross margin percentage');

  // STEP 9: GST & INVOICING TAX REGISTERS
  console.log('\n--- STEP 9: GST TAX REGISTER & HSN SUMMARY ---');
  const gstRes = await request('GET', '/api/analytics/gst', null, tokenAccountant);
  assert(gstRes.statusCode === 200 && gstRes.body.success, 'Accountant retrieves GST Analytics');
  assert(gstRes.body.data.summary.total_tax_collected > 0, 'Total CGST, SGST, IGST tax collection summary');
  assert(Array.isArray(gstRes.body.data.hsnSummary) && gstRes.body.data.hsnSummary.length > 0, 'HSN 4-digit code wise tax breakdown');

  // RBAC check: Salesman blocked from GST register
  const gstBlocked = await request('GET', '/api/analytics/gst', null, tokenSalesman);
  assert(gstBlocked.statusCode === 403, 'RBAC: Salesman is blocked from GST Tax Register (HTTP 403)');

  // STEP 10: DISPATCH & LOGISTICS ANALYTICS
  console.log('\n--- STEP 10: DISPATCH LOGISTICS & CARRIER PERFORMANCE ---');
  const dispRes = await request('GET', '/api/analytics/dispatch', null, tokenSalesman);
  assert(dispRes.statusCode === 200 && dispRes.body.success, 'Salesman/Dispatch retrieves Dispatch Analytics');
  assert(dispRes.body.data.summary.total_dispatches > 0, 'Aggregates total customer dispatches');
  assert(Array.isArray(dispRes.body.data.carrierPerformance) && dispRes.body.data.carrierPerformance.length > 0, 'Carrier on-time delivery and turnaround tracking');

  // STEP 11: PAYMENT INFLOW/OUTFLOW (Excluding Reversals)
  console.log('\n--- STEP 11: PAYMENT CASH INFLOW/OUTFLOW & AGING ---');
  const payRes = await request('GET', '/api/analytics/payments', null, tokenAccountant);
  assert(payRes.statusCode === 200 && payRes.body.success, 'Accountant retrieves Payment Analytics');
  assert(payRes.body.data.summary.total_inflow > 0, 'Customer payment cash inflow calculation');
  assert(payRes.body.data.summary.total_outflow > 0, 'Supplier payment cash outflow calculation');
  assert(payRes.body.data.summary.reversed_inflow_count !== undefined, 'Payment reversals tracked and excluded from successful cashflow');
  assert(Array.isArray(payRes.body.data.agingReceivables) && payRes.body.data.agingReceivables.length >= 3, 'Aging Accounts Receivable brackets (0-30, 31-60, 61-90, 90+)');

  // RBAC check: Salesman blocked from Payment Cashflow
  const payBlocked = await request('GET', '/api/analytics/payments', null, tokenSalesman);
  assert(payBlocked.statusCode === 403, 'RBAC: Salesman is blocked from Payment Inflow/Outflow (HTTP 403)');

  // STEP 12: AUDIT COMPLIANCE & RISK HEATMAP
  console.log('\n--- STEP 12: AUDIT COMPLIANCE & RISK ANALYTICS ---');
  const audRes = await request('GET', '/api/analytics/audit', null, tokenAdmin);
  assert(audRes.statusCode === 200 && audRes.body.success, 'Admin retrieves Audit Analytics');
  assert(audRes.body.data.riskDistribution && audRes.body.data.riskDistribution.CRITICAL !== undefined, '5x5 Risk matrix distribution (Critical, High, Medium, Low)');
  assert(Array.isArray(audRes.body.data.departmentalScores) && audRes.body.data.departmentalScores.length > 0, 'Departmental compliance scoring');

  // STEP 13: REPORT DEFINITIONS & SAVED REPORTS CRUD
  console.log('\n--- STEP 13: REPORT DEFINITIONS & SAVED REPORTS ---');
  const defsRes = await request('GET', '/api/analytics/definitions', null, tokenAdmin);
  assert(defsRes.statusCode === 200 && defsRes.body.success, 'Retrieve report definitions catalog');
  assert(Array.isArray(defsRes.body.data) && defsRes.body.data.length >= 10, 'Catalog contains 10+ standard reports across subsystems');

  const createSaved = await request('POST', '/api/analytics/saved-reports', {
    custom_title: 'Automated Test Custom Filter Report',
    report_definition_id: 2,
    saved_filters: { customer_id: 1, period: 'MONTHLY' }
  }, tokenAdmin);
  assert(createSaved.statusCode === 201 && createSaved.body.success, 'Save custom filtered report configuration');
  const savedId = createSaved.body.data?.id;

  const getSaved = await request('GET', '/api/analytics/saved-reports', null, tokenAdmin);
  assert(getSaved.statusCode === 200 && getSaved.body.data.some(r => r.id === savedId), 'List saved reports including newly created');

  const delSaved = await request('DELETE', `/api/analytics/saved-reports/${savedId}`, null, tokenAdmin);
  assert(delSaved.statusCode === 200 && delSaved.body.success, 'Delete saved custom report');

  // STEP 14: REPORT SCHEDULES & MANUAL EXECUTION
  console.log('\n--- STEP 14: REPORT SCHEDULES & EXECUTION LOGS ---');
  const scheds = await request('GET', '/api/analytics/schedules', null, tokenAdmin);
  assert(scheds.statusCode === 200 && scheds.body.data.length >= 3, 'Retrieve scheduled report automations (Daily, Weekly, Monthly)');

  const triggerRes = await request('POST', '/api/analytics/schedules/1/run', null, tokenAdmin);
  assert(triggerRes.statusCode === 200 && triggerRes.body.success, 'Trigger manual run of scheduled report');

  const logsRes = await request('GET', '/api/analytics/execution-logs', null, tokenAdmin);
  assert(logsRes.statusCode === 200 && logsRes.body.data.length > 0, 'Audit log records report execution with timestamp and record count');

  // STEP 15: USER DASHBOARD PREFERENCES
  console.log('\n--- STEP 15: USER DASHBOARD PREFERENCES ---');
  const getPrefs = await request('GET', '/api/analytics/preferences', null, tokenOwner);
  assert(getPrefs.statusCode === 200 && getPrefs.body.data.user_id === 1, 'Retrieve owner dashboard widget preferences');

  const updatePrefs = await request('PUT', '/api/analytics/preferences', {
    visible_widgets: ['SALES', 'PURCHASE', 'PROD', 'QC', 'GST', 'PAYMENTS', 'AUDIT'],
    default_date_range: 'CURRENT_QUARTER',
    chart_theme: 'DARK'
  }, tokenOwner);
  assert(updatePrefs.statusCode === 200 && updatePrefs.body.data.default_date_range === 'CURRENT_QUARTER', 'Persist updated user dashboard preferences');

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
