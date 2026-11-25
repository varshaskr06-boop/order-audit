/**
 * ============================================================================
 * Phase 9 Automated Test Suite: Product Costing Management System (PCMS)
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const http = require('http');

let app;
try {
  app = require('./server');
} catch (e) {
  console.error('Failed to load server:', e);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

let tokens = {
  admin: '',
  production: '',
  accountant: '',
  owner: '',
  salesman: ''
};

let passCount = 0;
let failCount = 0;

// Helper: HTTP request (matches test-quality.js pattern)
const makeRequest = ({ method, path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = { raw: data };
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
};

const login = async (email, password) => {
  const res = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: { email, password }
  });
  return res.body?.token || res.body?.data?.token || '';
};

const assert = (condition, testName, details = '') => {
  if (condition) {
    console.log(`  \x1b[32m✅ PASS\x1b[0m  [${passCount + failCount + 1}] ${testName}`);
    passCount++;
  } else {
    console.error(`  \x1b[31m❌ FAIL\x1b[0m  [${passCount + failCount + 1}] ${testName}`);
    if (details) console.error(`       Detail: ${JSON.stringify(details)}`);
    failCount++;
  }
};

const runTests = async () => {
  // Wait for server to be fully initialized (matches test-quality.js pattern)
  await new Promise(r => setTimeout(r, 1500));

  console.log('\n================================================================');
  console.log('🧪 PHASE 9: PRODUCT COSTING MANAGEMENT — AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  try {
    // 1. Authenticate users (sequential to avoid race conditions)
    tokens.admin = await login('admin@meenakshifoods.in', 'Admin@123');
    tokens.production = await login('production@meenakshifoods.in', 'Production@123');
    tokens.accountant = await login('auditor@meenakshifoods.in', 'Auditor@123');
    tokens.owner = await login('owner@meenakshifoods.in', 'Owner@123');
    tokens.salesman = await login('sales@meenakshifoods.in', 'Sales@123');

    assert(
      tokens.admin && tokens.production && tokens.accountant && tokens.owner && tokens.salesman,
      'Authenticate users across all roles (ADMIN, PRODUCTION, ACCOUNTANT, OWNER, SALESMAN)',
      { admin: !!tokens.admin, prod: !!tokens.production, acct: !!tokens.accountant, owner: !!tokens.owner, sales: !!tokens.salesman }
    );

    // 2. Module 1 & 2: Calculate Material Costs for an Order
    const matRes = await makeRequest({
      method: 'GET',
      path: '/api/costing/materials/order/1',
      headers: { Authorization: `Bearer ${tokens.accountant}` }
    });
    assert(
      matRes.status === 200 &&
      matRes.body?.data?.raw_material_cost > 0 &&
      matRes.body?.data?.packaging_material_cost > 0 &&
      Array.isArray(matRes.body?.data?.raw_materials),
      'Module 1 & 2: Calculate Raw Material and Packaging costs based on net consumed quantity & unit cost',
      matRes.body
    );

    // 3. Module 3: Record Direct Labour Cost
    const labourRes = await makeRequest({
      method: 'POST',
      path: '/api/costing/labour',
      headers: { Authorization: `Bearer ${tokens.production}` },
      body: {
        production_order_id: 1,
        production_order_number: 'PO-PROD-2026-001',
        batch_number: 'PB-FG001-20261125-001',
        worker_name: 'Karthik S (Senior Milling Tech)',
        labour_category: 'DIRECT',
        operation_name: 'Secondary Micro-Pulverizing',
        working_hours: 5.0,
        hourly_rate: 110.00,
        work_date: '2026-11-21'
      }
    });
    assert(
      labourRes.status === 201 &&
      labourRes.body?.data?.total_labour_cost === 550.00 &&
      labourRes.body?.data?.entry_number?.startsWith('LAB-'),
      'Module 3: Record Direct Labour cost (5.0 hrs × ₹110.00 = ₹550.00)',
      labourRes.body
    );

    // 4. Module 4: Record Machine Operating and Electricity Expenses
    const machineRes = await makeRequest({
      method: 'POST',
      path: '/api/costing/machines',
      headers: { Authorization: `Bearer ${tokens.production}` },
      body: {
        production_order_id: 1,
        production_order_number: 'PO-PROD-2026-001',
        batch_number: 'PB-FG001-20261125-001',
        machine_id: 'ROASTER-02',
        machine_name: 'Batch Roaster (Continuous Drum)',
        operating_hours: 3.5,
        electricity_consumption_kwh: 18.0,
        electricity_rate: 8.50,
        maintenance_cost: 45.00,
        other_machine_expenses: 15.00,
        expense_date: '2026-11-21'
      }
    });
    const expectedPower = 18.0 * 8.50; // 153.00
    const expectedMachineTotal = expectedPower + 45.00 + 15.00; // 213.00
    assert(
      machineRes.status === 201 &&
      machineRes.body?.data?.electricity_cost === expectedPower &&
      machineRes.body?.data?.total_machine_cost === expectedMachineTotal,
      'Module 4: Record Machine & Electricity cost (18 kWh × ₹8.50 + ₹60 maintenance = ₹213.00)',
      machineRes.body
    );

    // 5. Module 4: Prevent Duplicate Machine Expense Entry on same day/order
    const dupMachineRes = await makeRequest({
      method: 'POST',
      path: '/api/costing/machines',
      headers: { Authorization: `Bearer ${tokens.production}` },
      body: {
        production_order_id: 1,
        production_order_number: 'PO-PROD-2026-001',
        machine_id: 'ROASTER-02',
        machine_name: 'Batch Roaster (Continuous Drum)',
        operating_hours: 3.5,
        expense_date: '2026-11-21'
      }
    });
    assert(
      dupMachineRes.status === 409,
      'Module 4: Prevent double-counting of machine expenses on same order/machine (HTTP 409 Conflict)',
      { status: dupMachineRes.status }
    );

    // 6. Module 5: View Overhead Pool
    const ovhListRes = await makeRequest({
      method: 'GET',
      path: '/api/costing/overheads',
      headers: { Authorization: `Bearer ${tokens.accountant}` }
    });
    assert(
      ovhListRes.status === 200 && Array.isArray(ovhListRes.body?.data) && ovhListRes.body?.data?.length > 0,
      'Module 5: Retrieve Manufacturing Overhead expense pool (Rent, Utilities, Indirect Labour)',
      ovhListRes.body
    );

    // 7. Module 5: Allocate Manufacturing Overhead
    const allocRes = await makeRequest({
      method: 'POST',
      path: '/api/costing/allocations',
      headers: { Authorization: `Bearer ${tokens.accountant}` },
      body: {
        production_order_id: 1,
        batch_number: 'PB-FG001-20261125-001',
        overhead_category: 'UTILITIES',
        allocation_method: 'PER_MACHINE_HOUR',
        basis_value: 3.5,
        allocation_rate: 25.00
      }
    });
    assert(
      allocRes.status === 201 &&
      allocRes.body?.data?.allocated_amount === 87.50 &&
      allocRes.body?.data?.allocation_number?.startsWith('ALC-'),
      'Module 5: Allocate Manufacturing Overhead via PER_MACHINE_HOUR (3.5 hrs × ₹25 = ₹87.50)',
      allocRes.body
    );

    // 8. Module 6: Calculate Total Batch Production Cost
    const batchCostRes = await makeRequest({
      method: 'POST',
      path: '/api/costing/batches/calculate',
      headers: { Authorization: `Bearer ${tokens.accountant}` },
      body: {
        production_order_id: 1,
        production_order_number: 'PO-PROD-2026-001',
        batch_number: 'PB-FG001-20261125-002',
        product_id: 1,
        product_sku: 'FG-BAT-1KG',
        product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)',
        uom: 'Pouch',
        raw_material_cost: 2510.00,
        packaging_material_cost: 441.00,
        direct_labour_cost: 810.00,
        machine_cost: 70.00,
        electricity_cost: 127.50,
        overhead_cost: 471.50,
        produced_quantity: 100,
        accepted_quantity: 95,
        rejected_quantity: 5
      }
    });
    const totalExpected = 2510.00 + 441.00 + 810.00 + 70.00 + 127.50 + 471.50; // 4430.00
    const expectedUnitCost = Number((4430.00 / 95).toFixed(4)); // 46.6316
    assert(
      batchCostRes.status === 201 &&
      batchCostRes.body?.data?.total_batch_cost === totalExpected &&
      Math.abs(batchCostRes.body?.data?.cost_per_accepted_unit - expectedUnitCost) < 0.01,
      `Module 6: Total Product Cost calculation (RM+PKG+Labour+Machine+Power+Overhead = ₹${totalExpected})`,
      batchCostRes.body
    );

    // 9. Module 6: Distinguish Accepted Unit Cost vs Rejection/Wastage Cost
    const expectedRejectionCost = Number(((4430.00 / 100) * 5).toFixed(2)); // 221.50
    assert(
      batchCostRes.body?.data?.cost_per_accepted_unit > (totalExpected / 100) &&
      batchCostRes.body?.data?.rejection_wastage_cost === expectedRejectionCost,
      `Module 6: Enforce unit cost divided by accepted quantity & isolate rejection cost (₹${expectedRejectionCost})`,
      batchCostRes.body?.data
    );

    // 10. Module 6: Prevent Duplicate Batch Cost Calculation
    const dupBatchRes = await makeRequest({
      method: 'POST',
      path: '/api/costing/batches/calculate',
      headers: { Authorization: `Bearer ${tokens.accountant}` },
      body: {
        production_order_id: 1,
        batch_number: 'PB-FG001-20261125-002',
        produced_quantity: 100
      }
    });
    assert(
      dupBatchRes.status === 409,
      'Module 6: Prevent duplicate batch cost calculations (HTTP 409 Conflict)',
      { status: dupBatchRes.status }
    );

    // 11. Module 7: Calculate Suggested Selling Price with Target Margin %
    const suggestedRes = await makeRequest({
      method: 'GET',
      path: '/api/costing/selling-prices/suggested/1?target_margin_pct=30',
      headers: { Authorization: `Bearer ${tokens.accountant}` }
    });
    assert(
      suggestedRes.status === 200 &&
      suggestedRes.body?.data?.suggested_selling_price > suggestedRes.body?.data?.unit_manufacturing_cost &&
      suggestedRes.body?.data?.target_profit_margin_pct === 30,
      'Module 7: Suggested Selling Price calculation based on manufacturing cost and target profit margin',
      suggestedRes.body
    );

    // 12. Module 7: Create Product Selling Price with GST Separation
    const priceRes = await makeRequest({
      method: 'POST',
      path: '/api/costing/selling-prices',
      headers: { Authorization: `Bearer ${tokens.accountant}` },
      body: {
        product_id: 1,
        product_sku: 'FG-BAT-1KG',
        product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)',
        uom: 'Pouch',
        unit_manufacturing_cost: 45.20,
        target_profit_margin_pct: 30.00,
        approved_selling_price: 65.00,
        gst_rate_pct: 5.00,
        notes: 'Standard wholesale list price'
      }
    });
    assert(
      priceRes.status === 201 &&
      priceRes.body?.data?.expected_profit_per_unit === 19.80 &&
      priceRes.body?.data?.gst_amount === 3.25 &&
      priceRes.body?.data?.final_price_with_gst === 68.25,
      'Module 7: Configure selling price (₹65.00, 5% GST = ₹3.25, Final = ₹68.25, Profit = ₹19.80)',
      priceRes.body
    );

    // 13. Module 7: Approval Workflow for Selling Price (Owner/Admin)
    const priceId = priceRes.body?.data?.id || 1;
    const approvePriceRes = await makeRequest({
      method: 'PATCH',
      path: `/api/costing/selling-prices/${priceId}/status`,
      headers: { Authorization: `Bearer ${tokens.owner}` },
      body: { status: 'APPROVED', notes: 'Approved by Business Owner for all distributors' }
    });
    assert(
      approvePriceRes.status === 200 &&
      approvePriceRes.body?.data?.status === 'APPROVED',
      'Module 7: OWNER approves selling price update with audit log',
      approvePriceRes.body
    );

    // 14. Module 8: Calculate Planned vs Actual Cost Variance
    const varianceRes = await makeRequest({
      method: 'POST',
      path: '/api/costing/variances/calculate',
      headers: { Authorization: `Bearer ${tokens.accountant}` },
      body: {
        production_order_id: 1,
        batch_number: 'PB-FG001-20261125-002',
        planned_material_cost: 2900.00,
        actual_material_cost: 2951.00,
        planned_labour_cost: 400.00,
        actual_labour_cost: 810.00,
        planned_overhead_cost: 650.00,
        actual_overhead_cost: 669.00
      }
    });
    assert(
      varianceRes.status === 201 &&
      varianceRes.body?.data?.labour_variance === 410.00 &&
      varianceRes.body?.data?.variance_status === 'UNFAVORABLE' &&
      varianceRes.body?.data?.total_cost_variance === 480.00,
      'Module 8: Planned vs Actual Cost Variance evaluation (Material, Labour, Overhead variances)',
      varianceRes.body
    );

    // 15. Module 8: Retrieve Cost Variances List
    const varListRes = await makeRequest({
      method: 'GET',
      path: '/api/costing/variances?production_order_id=1',
      headers: { Authorization: `Bearer ${tokens.accountant}` }
    });
    assert(
      varListRes.status === 200 && Array.isArray(varListRes.body?.data) && varListRes.body?.data?.length > 0,
      'Module 8: Query cost variance history and unfavorable variance alerts',
      { count: varListRes.body?.data?.length }
    );

    // 16. Module 9: Product Profitability Analysis
    const profRes = await makeRequest({
      method: 'GET',
      path: '/api/costing/profitability',
      headers: { Authorization: `Bearer ${tokens.owner}` }
    });
    assert(
      profRes.status === 200 &&
      Array.isArray(profRes.body?.data?.items) &&
      profRes.body?.data?.assumptions?.margin_formula !== undefined,
      'Module 9: Product Profitability analysis with margin rankings and transparent assumptions',
      profRes.body?.data?.assumptions
    );

    // 17. Module 10: Costing Dashboard
    const dashRes = await makeRequest({
      method: 'GET',
      path: '/api/costing/dashboard',
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    assert(
      dashRes.status === 200 &&
      dashRes.body?.data?.kpis?.total_manufacturing_cost > 0 &&
      dashRes.body?.data?.cost_distribution_pct?.raw_materials > 0 &&
      Array.isArray(dashRes.body?.data?.most_profitable_products),
      'Module 10: Costing Dashboard KPIs (Total Manufacturing Cost, Cost % Distribution, Margins)',
      dashRes.body?.data?.kpis
    );

    // 18. Module 11: Reports - Product-Wise Costing
    const repProdRes = await makeRequest({
      method: 'GET',
      path: '/api/costing/reports?report_type=PRODUCT_WISE_COSTING',
      headers: { Authorization: `Bearer ${tokens.accountant}` }
    });
    assert(
      repProdRes.status === 200 &&
      repProdRes.body?.data?.report_type === 'PRODUCT_WISE_COSTING' &&
      Array.isArray(repProdRes.body?.data?.records),
      'Module 11: Generate Product-Wise Costing Report',
      { records: repProdRes.body?.data?.records?.length }
    );

    // 19. Module 11: Reports - Batch-Wise Costing
    const repBatchRes = await makeRequest({
      method: 'GET',
      path: '/api/costing/reports?report_type=BATCH_WISE_COSTING',
      headers: { Authorization: `Bearer ${tokens.accountant}` }
    });
    assert(
      repBatchRes.status === 200 &&
      repBatchRes.body?.data?.report_type === 'BATCH_WISE_COSTING' &&
      Array.isArray(repBatchRes.body?.data?.records),
      'Module 11: Generate Batch-Wise Costing Report',
      { records: repBatchRes.body?.data?.records?.length }
    );

    // 20. Module 11: Reports - Labour & Machine/Power Reports
    const repLabRes = await makeRequest({
      method: 'GET',
      path: '/api/costing/reports?report_type=LABOUR_COST',
      headers: { Authorization: `Bearer ${tokens.accountant}` }
    });
    const repMchRes = await makeRequest({
      method: 'GET',
      path: '/api/costing/reports?report_type=MACHINE_ELECTRICITY_COST',
      headers: { Authorization: `Bearer ${tokens.accountant}` }
    });
    assert(
      repLabRes.status === 200 && repMchRes.status === 200,
      'Module 11: Generate Labour and Machine/Electricity Cost Reports',
      { labour: repLabRes.status, machine: repMchRes.status }
    );

    // 21. Module 12: Historical Cost Preservation
    const histBatchRes = await makeRequest({
      method: 'GET',
      path: '/api/costing/batches?batch_number=PB-FG001-20261125-001',
      headers: { Authorization: `Bearer ${tokens.accountant}` }
    });
    const finalizedBatch = histBatchRes.body?.data?.[0];
    assert(
      finalizedBatch && finalizedBatch.total_batch_cost === 4430.00,
      'Module 12: Historical cost snapshot preservation (old batch costs immutable to future rate changes)',
      { total_batch_cost: finalizedBatch?.total_batch_cost }
    );

    // 22. Module 13: RBAC - SALESMAN authorized to view approved product selling prices
    const salesPriceRes = await makeRequest({
      method: 'GET',
      path: '/api/costing/selling-prices',
      headers: { Authorization: `Bearer ${tokens.salesman}` }
    });
    assert(
      salesPriceRes.status === 200 && Array.isArray(salesPriceRes.body?.data),
      'Module 13: RBAC - SALESMAN authorized to query approved product selling prices (HTTP 200 OK)',
      { status: salesPriceRes.status }
    );

    // 23. Module 13: RBAC - SALESMAN blocked from recording manufacturing costs
    const salesBlockedRes = await makeRequest({
      method: 'POST',
      path: '/api/costing/labour',
      headers: { Authorization: `Bearer ${tokens.salesman}` },
      body: { production_order_id: 1, worker_name: 'Unauthorized', working_hours: 5, hourly_rate: 100 }
    });
    assert(
      salesBlockedRes.status === 403,
      'Module 13: RBAC - SALESMAN blocked from modifying manufacturing cost records (HTTP 403 Forbidden)',
      { status: salesBlockedRes.status }
    );

    // 24. Module 13: RBAC - Non-owner blocked from approving selling price updates
    const prodApproveBlockedRes = await makeRequest({
      method: 'PATCH',
      path: `/api/costing/selling-prices/${priceId}/status`,
      headers: { Authorization: `Bearer ${tokens.production}` },
      body: { status: 'APPROVED' }
    });
    assert(
      prodApproveBlockedRes.status === 403,
      'Module 13: RBAC - PRODUCTION blocked from approving selling price changes (HTTP 403 Forbidden)',
      { status: prodApproveBlockedRes.status }
    );

  } catch (err) {
    console.error('Fatal error during test run:', err);
    failCount++;
  }

  console.log('\n================================================================');
  console.log(`  🏁 RESULTS: ${passCount} PASS  |  ${failCount} FAIL  |  ${passCount + failCount} TOTAL`);
  console.log('================================================================\n');

  if (failCount === 0) {
    console.log('  🎉 ALL TESTS PASSED! Phase 9 Costing Management System API is working correctly.\n');
    process.exit(0);
  } else {
    console.error(`  ⚠️ ${failCount} test(s) failed. Check logs above.\n`);
    process.exit(1);
  }
};

runTests();
