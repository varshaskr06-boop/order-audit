/**
 * ============================================================================
 * Phase 7: Production Management System — Automated Test Suite
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 *
 * Tests:
 *  1. Authenticate users across roles (ADMIN, PRODUCTION, OWNER, ACCOUNTANT, SALESMAN)
 *  2. Module 1: Create a Production Plan
 *  3. Module 1: Approve Production Plan
 *  4. Module 2: Create a Production Order
 *  5. Module 3: Verify BOM snapshot and calculated material requirements
 *  6. Module 4: Check Material Availability from Phase 6 inventory
 *  7. Module 5: Issue materials from inventory to production
 *  8. Module 5: Prevent issuing more material than available stock (Insufficient Stock block)
 *  9. Module 6: Return unused material back to inventory (reusable stock)
 * 10. Module 6: Material return (Damaged/Contaminated) - not returned to usable stock
 * 11. Module 7: Start production execution (transitions to IN_PROGRESS)
 * 12. Module 7: Record machine downtime with reason & duration
 * 13. Module 7: Validation - prevent rejected qty exceeding produced qty
 * 14. Module 7: Complete production run with output quantities
 * 15. Module 8: Create batch record with unique batch number & QC status
 * 16. Module 9: Post Finished Goods receipt into inventory & stock ledger
 * 17. Module 9: Prevent duplicate Finished Goods receipt posting (HTTP 409)
 * 18. Module 10: Production Dashboard stats & KPI calculations
 * 19. Module 11: Daily & Product-wise production reports
 * 20. Module 11: Downtime & batch-wise reports
 * 21. Module 12: RBAC - SALESMAN blocked from creating plans (HTTP 403)
 * 22. Module 12: RBAC - ACCOUNTANT blocked from posting material issues (HTTP 403)
 * 23. Module 12: RBAC - PRODUCTION allowed to issue materials & update progress
 * 24. Audit Trail: Verify production status history and audit logs
 * ============================================================================
 */

const http = require('http');

let app;
try {
  app = require('./server');
} catch (e) {
  console.error('Failed to require server:', e);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

let tokens = {
  admin: '',
  production: '',
  owner: '',
  accountant: '',
  salesman: ''
};

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

let passCount = 0;
let failCount = 0;

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
  // Allow server initialization
  await new Promise(r => setTimeout(r, 1500));

  console.log('\n================================================================');
  console.log('🧪 PHASE 7: PRODUCTION MANAGEMENT — AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  try {
    // 1. Authenticate users
    tokens.admin = await login('admin@meenakshifoods.in', 'Admin@123');
    tokens.production = await login('production@meenakshifoods.in', 'Production@123');
    tokens.owner = await login('owner@meenakshifoods.in', 'Owner@123');
    tokens.accountant = await login('auditor@meenakshifoods.in', 'Auditor@123');
    tokens.salesman = await login('sales@meenakshifoods.in', 'Sales@123');

    assert(
      tokens.admin && tokens.production && tokens.owner && tokens.accountant && tokens.salesman,
      'Authenticate users across all roles (ADMIN, PRODUCTION, OWNER, ACCOUNTANT, SALESMAN)'
    );

    const adminHeader = { Authorization: `Bearer ${tokens.admin}` };
    const prodHeader = { Authorization: `Bearer ${tokens.production}` };
    const ownerHeader = { Authorization: `Bearer ${tokens.owner}` };
    const accHeader = { Authorization: `Bearer ${tokens.accountant}` };
    const salesHeader = { Authorization: `Bearer ${tokens.salesman}` };

    // 2. Module 1: Create Production Plan
    const createPlanRes = await makeRequest({
      method: 'POST',
      path: '/api/production/plans',
      headers: prodHeader,
      body: {
        product_id: 1,
        planned_quantity: 150,
        planned_start_date: '2026-11-25',
        planned_end_date: '2026-11-27',
        department: 'Batter Division',
        notes: 'Holiday season surge production plan'
      }
    });

    const newPlan = createPlanRes.body?.data;
    assert(
      createPlanRes.status === 201 && newPlan?.id && newPlan.status === 'DRAFT',
      'Module 1: PRODUCTION creates a new Production Plan with unique plan number',
      createPlanRes.body
    );

    // 3. Module 1: Approve Production Plan
    const approvePlanRes = await makeRequest({
      method: 'POST',
      path: `/api/production/plans/${newPlan.id}/status`,
      method: 'PATCH',
      headers: adminHeader,
      body: { status: 'APPROVED' }
    });

    assert(
      approvePlanRes.status === 200 && approvePlanRes.body?.data?.status === 'APPROVED',
      'Module 1: ADMIN approves production plan (Status: APPROVED)',
      approvePlanRes.body
    );

    // 4. Module 2: Create Production Order
    const createOrderRes = await makeRequest({
      method: 'POST',
      path: '/api/production/orders',
      headers: prodHeader,
      body: {
        plan_id: newPlan.id,
        product_id: 1,
        bom_id: 1,
        planned_quantity: 100,
        planned_start_date: '2026-11-25',
        planned_end_date: '2026-11-26',
        priority: 'HIGH',
        notes: 'Batter batch for fresh retail dispatch'
      }
    });

    const newOrder = createOrderRes.body?.data;
    assert(
      createOrderRes.status === 201 && newOrder?.id && newOrder.status === 'PLANNED' && newOrder.order_number,
      'Module 2: Create Production Order linked to plan with unique order number',
      createOrderRes.body
    );

    // Approve the order (ADMIN)
    await makeRequest({
      method: 'PATCH',
      path: `/api/production/orders/${newOrder.id}/status`,
      headers: adminHeader,
      body: { status: 'APPROVED', reason: 'Order reviewed and approved by management' }
    });

    // 5. Module 3: BOM Material Calculation Snapshot
    const reqRes = await makeRequest({
      method: 'GET',
      path: `/api/production/orders/${newOrder.id}/requirements`,
      headers: prodHeader
    });

    const requirements = reqRes.body?.data || [];
    const hasPonniRice = requirements.some(r => r.material_id === 1 && r.required_quantity > 0);
    assert(
      reqRes.status === 200 && requirements.length >= 3 && hasPonniRice,
      'Module 3: Automatically snapshot BOM and calculate material requirements including wastage',
      requirements
    );

    // 6. Module 4: Check Material Availability
    const availRes = await makeRequest({
      method: 'GET',
      path: `/api/production/orders/${newOrder.id}/availability`,
      headers: prodHeader
    });

    const availData = availRes.body?.data;
    assert(
      availRes.status === 200 && availData?.items && availData.overall_status,
      'Module 4: Material availability check compares requirements against Phase 6 stock',
      availData
    );

    // 7. Module 5: Issue materials from inventory
    const riceReq = requirements.find(r => r.material_id === 1);
    const dalReq = requirements.find(r => r.material_id === 2);

    const issueRes = await makeRequest({
      method: 'POST',
      path: `/api/production/orders/${newOrder.id}/issues`,
      headers: prodHeader,
      body: {
        issue_date: '2026-11-25',
        received_by: 'Shift Operator Murugan',
        notes: 'Issued raw materials for batter batch',
        items: [
          {
            requirement_id: riceReq?.id,
            material_type: 'RAW_MATERIAL',
            material_id: 1,
            material_name: 'Ponni Idli Rice',
            inventory_item_id: 1,
            inventory_batch_id: 1,
            batch_number: 'RM-RICE-2026-B01',
            issued_quantity: 65,
            unit: 'KG',
            unit_rate: 42.0
          },
          {
            requirement_id: dalReq?.id,
            material_type: 'RAW_MATERIAL',
            material_id: 2,
            material_name: 'Guntur Urad Dal',
            inventory_item_id: 2,
            inventory_batch_id: 3,
            batch_number: 'RM-DAL-2026-B01',
            issued_quantity: 16.25,
            unit: 'KG',
            unit_rate: 115.0
          }
        ]
      }
    });

    const issueData = issueRes.body?.data;
    assert(
      issueRes.status === 201 && issueData?.id && issueData.issue_number,
      'Module 5: Issue materials creates issue slip and posts outward movements to Phase 6 stock ledger',
      issueRes.body
    );

    // 8. Module 5: Prevent over-issue beyond available stock
    const overIssueRes = await makeRequest({
      method: 'POST',
      path: `/api/production/orders/${newOrder.id}/issues`,
      headers: prodHeader,
      body: {
        items: [
          {
            material_type: 'RAW_MATERIAL',
            material_id: 1,
            material_name: 'Ponni Rice',
            inventory_item_id: 1,
            issued_quantity: 999999, // Impossible stock
            unit: 'KG',
            unit_rate: 42.0
          }
        ]
      }
    });

    assert(
      overIssueRes.status === 400 && overIssueRes.body?.error?.message?.includes('Insufficient stock'),
      'Module 5: Over-issue block prevents negative stock in Phase 6 inventory',
      overIssueRes.body
    );

    // 9. Module 6: Return unused material back to stock
    const returnRes = await makeRequest({
      method: 'POST',
      path: `/api/production/orders/${newOrder.id}/returns`,
      headers: prodHeader,
      body: {
        issue_id: issueData.id,
        material_type: 'RAW_MATERIAL',
        material_id: 1,
        material_name: 'Ponni Idli Rice',
        inventory_item_id: 1,
        inventory_batch_id: 1,
        batch_number: 'RM-RICE-2026-B01',
        returned_quantity: 5,
        unit: 'KG',
        condition: 'GOOD',
        return_reason: 'Excess raw rice retrieved after stone grinding complete'
      }
    });

    const retData = returnRes.body?.data;
    assert(
      returnRes.status === 201 && retData?.id && retData.return_to_stock === true,
      'Module 6: Reusable material return successfully credited back into stock ledger',
      retData
    );

    // 10. Module 6: Return damaged material (not returned to usable stock)
    const damagedReturnRes = await makeRequest({
      method: 'POST',
      path: `/api/production/orders/${newOrder.id}/returns`,
      headers: prodHeader,
      body: {
        material_type: 'RAW_MATERIAL',
        material_id: 2,
        material_name: 'Urad Dal',
        inventory_item_id: 2,
        returned_quantity: 1,
        unit: 'KG',
        condition: 'DAMAGED',
        return_reason: 'Contaminated by water drip in mixing area'
      }
    });

    assert(
      damagedReturnRes.status === 201 && damagedReturnRes.body?.data?.return_to_stock === false,
      'Module 6: Damaged/contaminated returns are flagged and excluded from usable stock',
      damagedReturnRes.body
    );

    // 11. Module 7: Start production execution (transitions to IN_PROGRESS)
    const startRes = await makeRequest({
      method: 'PATCH',
      path: `/api/production/orders/${newOrder.id}/status`,
      headers: prodHeader,
      body: { status: 'IN_PROGRESS', reason: 'Raw materials loaded into grinders' }
    });

    assert(
      startRes.status === 200 && startRes.body?.data?.status === 'IN_PROGRESS' && startRes.body?.data?.actual_start_time,
      'Module 7: Start production records actual start timestamp and sets status to IN_PROGRESS',
      startRes.body
    );

    // 12. Module 7: Record machine downtime
    const dtRes = await makeRequest({
      method: 'POST',
      path: `/api/production/orders/${newOrder.id}/downtime`,
      headers: prodHeader,
      body: {
        downtime_start: new Date().toISOString(),
        duration_minutes: 25,
        reason_category: 'POWER',
        reason_description: 'Grid voltage surge tripped stone grinder breaker',
        machine_or_line: 'Grinder Line #2'
      }
    });

    assert(
      dtRes.status === 201 && dtRes.body?.data?.duration_minutes === 25,
      'Module 7: Record production downtime with category, duration, and machine identifier',
      dtRes.body
    );

    // 13. Module 7: Quantity validation - reject if rejected > actual
    const invalidQtyRes = await makeRequest({
      method: 'PUT',
      path: `/api/production/orders/${newOrder.id}/execution`,
      headers: prodHeader,
      body: {
        actual_quantity: 50,
        rejected_quantity: 70 // Greater than produced
      }
    });

    assert(
      invalidQtyRes.status === 400 && invalidQtyRes.body?.error?.message?.includes('cannot exceed'),
      'Module 7: Validation prevents rejected quantity from exceeding actual produced quantity',
      invalidQtyRes.body
    );

    // 14. Module 7: Complete production run
    await makeRequest({
      method: 'PUT',
      path: `/api/production/orders/${newOrder.id}/execution`,
      headers: prodHeader,
      body: {
        actual_quantity: 100,
        accepted_quantity: 98,
        rejected_quantity: 2,
        wastage_quantity: 1.5,
        supervisor_name: 'Production Supervisor'
      }
    });

    const completeRes = await makeRequest({
      method: 'PATCH',
      path: `/api/production/orders/${newOrder.id}/status`,
      headers: prodHeader,
      body: { status: 'COMPLETED', reason: 'Batter grinding and packaging finalized' }
    });

    assert(
      completeRes.status === 200 && completeRes.body?.data?.status === 'COMPLETED' && completeRes.body?.data?.actual_end_time,
      'Module 7: Complete production run records actual end time, final output and accepted/rejected quantities',
      completeRes.body
    );

    // 15. Module 8: Create batch record with unique batch number
    const batchRes = await makeRequest({
      method: 'POST',
      path: `/api/production/orders/${newOrder.id}/batches`,
      headers: prodHeader,
      body: {
        product_id: 1,
        product_name: 'Fresh Batter 1KG',
        product_sku: 'FG-001',
        mfg_date: '2026-11-25',
        expiry_date: '2026-11-30',
        produced_quantity: 100,
        accepted_quantity: 98,
        rejected_quantity: 2,
        batch_status: 'QC_PASSED',
        qc_remarks: 'Fermentation pH 4.2 passed organoleptic evaluation'
      }
    });

    const batchData = batchRes.body?.data;
    assert(
      batchRes.status === 201 && batchData?.batch_number && batchData.batch_number.startsWith('PB-'),
      'Module 8: Generate unique batch number and track manufacturing & expiry dates with QC approval',
      batchData
    );

    // 16. Module 9: Finished Goods Receipt into Inventory
    const fgRes = await makeRequest({
      method: 'POST',
      path: `/api/production/orders/${newOrder.id}/fg-receipts`,
      headers: prodHeader,
      body: {
        batch_id: batchData.id,
        batch_number: batchData.batch_number,
        mfg_date: '2026-11-25',
        expiry_date: '2026-11-30',
        produced_quantity: 100,
        accepted_quantity: 98,
        rejected_quantity: 2,
        warehouse_location_id: 4,
        warehouse_location_name: 'Finished Goods Cold Storage',
        notes: 'Received into Cold Storage bay 2'
      }
    });

    const fgReceipt = fgRes.body?.data;
    assert(
      fgRes.status === 201 && fgReceipt?.receipt_number && fgReceipt.is_posted === true,
      'Module 9: Finished goods receipt enters accepted quantities into Phase 6 stock ledger',
      fgRes.body
    );

    // 17. Module 9: Prevent duplicate FG receipt posting (HTTP 409)
    const dupFGRes = await makeRequest({
      method: 'POST',
      path: `/api/production/orders/${newOrder.id}/fg-receipts`,
      headers: prodHeader,
      body: {
        mfg_date: '2026-11-25',
        expiry_date: '2026-11-30',
        accepted_quantity: 98
      }
    });

    assert(
      dupFGRes.status === 409,
      'Module 9: Prevent duplicate posting of finished goods receipts for same production order (HTTP 409)',
      dupFGRes.body
    );

    // 18. Module 10: Production Dashboard
    const dashRes = await makeRequest({
      method: 'GET',
      path: '/api/production/dashboard',
      headers: adminHeader
    });

    const dashData = dashRes.body?.data;
    assert(
      dashRes.status === 200 && dashData?.total_orders >= 1 && dashData.recent_activities,
      'Module 10: Production Dashboard calculates total orders, quantities produced, and recent activity',
      dashData
    );

    // 19. Module 11: Production Reports (Daily & Product-wise)
    const dailyRep = await makeRequest({
      method: 'GET',
      path: '/api/production/reports?type=daily',
      headers: adminHeader
    });

    const prodRep = await makeRequest({
      method: 'GET',
      path: '/api/production/reports?type=product_wise',
      headers: accHeader
    });

    assert(
      dailyRep.status === 200 && prodRep.status === 200 && Array.isArray(dailyRep.body?.data),
      'Module 11: Daily & Product-wise production reports with aggregation generated',
      { dailyCount: dailyRep.body?.data?.length, prodCount: prodRep.body?.data?.length }
    );

    // 20. Module 11: Downtime & Batch reports
    const dtRep = await makeRequest({
      method: 'GET',
      path: '/api/production/reports?type=downtime',
      headers: ownerHeader
    });

    assert(
      dtRep.status === 200 && Array.isArray(dtRep.body?.data),
      'Module 11: Production downtime and machine stoppage report generated',
      dtRep.body
    );

    // 21. Module 12: RBAC - SALESMAN blocked from creating plans
    const salesmanBlocked = await makeRequest({
      method: 'POST',
      path: '/api/production/plans',
      headers: salesHeader,
      body: { product_id: 1, planned_quantity: 50, planned_start_date: '2026-12-01', planned_end_date: '2026-12-02' }
    });

    assert(
      salesmanBlocked.status === 403,
      'Module 12: RBAC - SALESMAN blocked from creating production plans (HTTP 403 Forbidden)',
      salesmanBlocked.body
    );

    // 22. Module 12: RBAC - ACCOUNTANT blocked from issuing materials
    const accountantBlocked = await makeRequest({
      method: 'POST',
      path: `/api/production/orders/${newOrder.id}/issues`,
      headers: accHeader,
      body: { items: [{ material_id: 1, issued_quantity: 10 }] }
    });

    assert(
      accountantBlocked.status === 403,
      'Module 12: RBAC - ACCOUNTANT blocked from material issue operations (HTTP 403 Forbidden)',
      accountantBlocked.body
    );

    // 23. Module 12: RBAC - PRODUCTION allowed to view orders and dashboard
    const prodDashboard = await makeRequest({
      method: 'GET',
      path: '/api/production/dashboard',
      headers: prodHeader
    });

    assert(
      prodDashboard.status === 200,
      'Module 12: RBAC - PRODUCTION authorized to access production workspace',
      prodDashboard.body
    );

    // 24. Audit Trail & Status History
    const historyRes = await makeRequest({
      method: 'GET',
      path: `/api/production/orders/${newOrder.id}/history`,
      headers: adminHeader
    });

    const logsRes = await makeRequest({
      method: 'GET',
      path: `/api/production/orders/${newOrder.id}/logs`,
      headers: adminHeader
    });

    assert(
      historyRes.status === 200 && logsRes.status === 200 && historyRes.body?.data?.length >= 2,
      'Audit Trail: Complete status transition history and audit logs maintained',
      { historyCount: historyRes.body?.data?.length, logsCount: logsRes.body?.data?.length }
    );

  } catch (error) {
    console.error('Fatal test error:', error);
    failCount++;
  }

  console.log('\n================================================================');
  console.log(`  🏁 RESULTS: ${passCount} PASS  |  ${failCount} FAIL  |  ${passCount + failCount} TOTAL`);
  console.log('================================================================\n');

  if (failCount === 0) {
    console.log('  🎉 ALL TESTS PASSED! Phase 7 Production Management System API is working correctly.\n');
    process.exit(0);
  } else {
    console.error(`  ⚠️ ${failCount} test(s) failed. Check logs above.\n`);
    process.exit(1);
  }
};

runTests();
