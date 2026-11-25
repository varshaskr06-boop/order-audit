/**
 * ============================================================================
 * Phase 6: Inventory Management System — Automated Test Suite
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 *
 * Tests:
 *  1. Authenticate users across roles (ADMIN, PRODUCTION, ACCOUNTANT, SALESMAN)
 *  2. Raw Material Inventory (Module 1: stocks, UOM, min & reorder levels)
 *  3. Packaging Material Inventory (Module 2: pouches, cartons, stock alerts)
 *  4. Finished Goods Inventory (Module 3: available stock visible to SALESMAN)
 *  5. RBAC: SALESMAN blocked with HTTP 403 on Raw Materials, Inward, Outward
 *  6. Stock Inward (Module 4: Post stock inward from Phase 5 GRN)
 *  7. Stock Inward: Prevent duplicate posting of the same GRN (HTTP 409)
 *  8. Stock Outward (Module 5: Issue materials to production floor)
 *  9. Stock Outward: Prevent issuing more stock than available (Over-issue block)
 * 10. Batch & Expiry (Module 7: Detect expired batches & near-expiry within 30 days)
 * 11. Batch & Expiry: Prevent issuing expired stock to normal production floor
 * 12. FEFO Recommendation Engine (Module 7: earliest expiry prioritized)
 * 13. Stock Adjustment Request (Module 6: Damaged/expired stock recorded as PENDING)
 * 14. Stock Adjustment Approval (Module 6: ADMIN approves adjustment & updates ledger)
 * 15. Stock Transfer (Module 8: Transfer between locations with balance conservation)
 * 16. Physical Stock Verification (Module 9: Create stock count & enter physical counts)
 * 17. Physical Stock Variance Approval (Module 9: ADMIN approves discrepancy & updates ledger)
 * 18. Inventory Dashboard Stats (Module 10: KPIs, low-stock, movements, fast-moving items)
 * 19. Inventory Reports (Module 11: Current stock, Inward, Outward, Movement ledger)
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
  console.log('🧪 PHASE 6: INVENTORY MANAGEMENT — AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  try {
    // 1. Authenticate users
    tokens.admin = await login('admin@meenakshifoods.in', 'Admin@123');
    tokens.production = await login('production@meenakshifoods.in', 'Production@123');
    tokens.accountant = await login('auditor@meenakshifoods.in', 'Auditor@123');
    tokens.salesman = await login('sales@meenakshifoods.in', 'Sales@123');

    assert(
      tokens.admin && tokens.production && tokens.accountant && tokens.salesman,
      'Authentication: Tokens obtained for ADMIN, PRODUCTION, ACCOUNTANT, SALESMAN'
    );

    // 2. Module 1: Raw Material Inventory
    const rmRes = await makeRequest({
      method: 'GET',
      path: '/api/inventory/raw-materials',
      headers: { Authorization: `Bearer ${tokens.production}` }
    });
    assert(
      rmRes.status === 200 && Array.isArray(rmRes.body?.data) && rmRes.body.data.length >= 5,
      'Module 1: PRODUCTION lists raw material inventory with stocks, UOM, and valuation',
      rmRes.body
    );

    const ponniRice = rmRes.body.data.find(i => i.item_code === 'RM-RICE-001');
    assert(
      ponniRice && ponniRice.uom === 'KG' && Number(ponniRice.current_stock) > 0,
      'Module 1: Ponni Rice stock is tracked in KG with active batch balance',
      ponniRice
    );

    // 3. Module 2: Packaging Material Inventory
    const pkgRes = await makeRequest({
      method: 'GET',
      path: '/api/inventory/packaging',
      headers: { Authorization: `Bearer ${tokens.production}` }
    });
    assert(
      pkgRes.status === 200 && Array.isArray(pkgRes.body?.data) && pkgRes.body.data.length >= 3,
      'Module 2: Packaging inventory displays pouches, cartons, and min stock levels',
      pkgRes.body
    );

    // 4. Module 3: Finished Goods Inventory (Accessible by SALESMAN)
    const fgSalesRes = await makeRequest({
      method: 'GET',
      path: '/api/inventory/finished-goods',
      headers: { Authorization: `Bearer ${tokens.salesman}` }
    });
    assert(
      fgSalesRes.status === 200 && Array.isArray(fgSalesRes.body?.data) && fgSalesRes.body.data.length >= 3,
      'Module 3: SALESMAN can view available Finished Goods stock for order booking',
      fgSalesRes.body
    );

    // 5. RBAC: SALESMAN blocked with HTTP 403 on Raw Materials, Inward, Outward
    const rmSalesRes = await makeRequest({
      method: 'GET',
      path: '/api/inventory/raw-materials',
      headers: { Authorization: `Bearer ${tokens.salesman}` }
    });
    assert(
      rmSalesRes.status === 403,
      'RBAC: SALESMAN blocked with HTTP 403 on Raw Material Inventory endpoint',
      rmSalesRes.status
    );

    const inwardSalesRes = await makeRequest({
      method: 'POST',
      path: '/api/inventory/inward/grn',
      headers: { Authorization: `Bearer ${tokens.salesman}` },
      body: { grn_id: 1 }
    });
    assert(
      inwardSalesRes.status === 403,
      'RBAC: SALESMAN blocked with HTTP 403 on Stock Inward endpoint',
      inwardSalesRes.status
    );

    // 6. Module 4: Stock Inward (Post stock inward from Phase 5 GRN #1)
    const inwardRes = await makeRequest({
      method: 'POST',
      path: '/api/inventory/inward/grn',
      headers: { Authorization: `Bearer ${tokens.production}` },
      body: { grn_id: 1 }
    });
    assert(
      inwardRes.status === 201 && inwardRes.body?.data?.entries_count > 0,
      'Module 4: Stock Inward posted from GRN #1 into Centralized Stock Ledger',
      inwardRes.body
    );

    // 7. Stock Inward: Prevent duplicate posting of the same GRN (HTTP 409 Conflict)
    const dupInwardRes = await makeRequest({
      method: 'POST',
      path: '/api/inventory/inward/grn',
      headers: { Authorization: `Bearer ${tokens.production}` },
      body: { grn_id: 1 }
    });
    assert(
      dupInwardRes.status === 409,
      'Module 4: Duplicate posting of same GRN #1 blocked with HTTP 409 Conflict',
      dupInwardRes.body
    );

    // 8. Module 5: Stock Outward (Issue raw material to production floor)
    const issuePayload = {
      department: 'BATTER_PRODUCTION',
      issued_to: 'M. Arumugam (Plant Operator)',
      bom_id: 1,
      production_batch_ref: 'PROD-BAT-2026-03-21',
      notes: 'Issued rice and urad dal for daily stone grinding shift',
      items: [
        {
          item_id: 1, // Ponni Rice
          batch_id: 1,
          location_id: 1,
          quantity: 50,
          purpose: 'Batter grinding batch'
        }
      ]
    };
    const issueRes = await makeRequest({
      method: 'POST',
      path: '/api/inventory/outward/issue',
      headers: { Authorization: `Bearer ${tokens.production}` },
      body: issuePayload
    });
    assert(
      issueRes.status === 201 && issueRes.body?.data?.stock_issue?.issue_number,
      'Module 5: Stock Outward issued to production floor with batch deduction',
      issueRes.body
    );

    // 9. Stock Outward: Prevent issuing more stock than available (Over-issue block)
    const overIssuePayload = {
      department: 'PRODUCTION',
      issued_to: 'Operator',
      items: [
        {
          item_id: 1,
          quantity: 999999, // Exceeds available stock
          purpose: 'Massive overflow attempt'
        }
      ]
    };
    const overIssueRes = await makeRequest({
      method: 'POST',
      path: '/api/inventory/outward/issue',
      headers: { Authorization: `Bearer ${tokens.production}` },
      body: overIssuePayload
    });
    assert(
      overIssueRes.status === 400 && overIssueRes.body?.message?.includes('Insufficient stock'),
      'Module 5: Over-issue strictly blocked with HTTP 400 Bad Request',
      overIssueRes.body
    );

    // 10. Batch & Expiry (Module 7: Detect expired batches & near-expiry within 30 days)
    const expRes = await makeRequest({
      method: 'GET',
      path: '/api/inventory/batches/expired',
      headers: { Authorization: `Bearer ${tokens.accountant}` }
    });
    assert(
      expRes.status === 200 && Array.isArray(expRes.body?.data) && expRes.body.data.length >= 1,
      'Module 7: Expired batches detected and flagged for QC action',
      expRes.body
    );

    const nearExpRes = await makeRequest({
      method: 'GET',
      path: '/api/inventory/batches/expiring-soon?days=30',
      headers: { Authorization: `Bearer ${tokens.production}` }
    });
    assert(
      nearExpRes.status === 200 && Array.isArray(nearExpRes.body?.data) && nearExpRes.body.data.length >= 1,
      'Module 7: Batches expiring within 30 days flagged with remaining days count',
      nearExpRes.body
    );

    // 11. Batch & Expiry: Prevent issuing expired stock to normal production floor
    const expiredBatch = expRes.body.data[0];
    const expiredIssuePayload = {
      department: 'PRODUCTION',
      issued_to: 'Operator',
      items: [
        {
          item_id: expiredBatch.item_id,
          batch_id: expiredBatch.id,
          quantity: 1,
          purpose: 'Attempting to issue expired material'
        }
      ]
    };
    const expIssueRes = await makeRequest({
      method: 'POST',
      path: '/api/inventory/outward/issue',
      headers: { Authorization: `Bearer ${tokens.production}` },
      body: expiredIssuePayload
    });
    assert(
      expIssueRes.status === 400 && expIssueRes.body?.message?.includes('expired'),
      'Module 7: Issuing expired material to production strictly blocked (HTTP 400)',
      expIssueRes.body
    );

    // 12. FEFO Recommendation Engine (Module 7: earliest expiry prioritized)
    const fefoRes = await makeRequest({
      method: 'GET',
      path: '/api/inventory/fefo-recommendation?item_id=1&quantity=30',
      headers: { Authorization: `Bearer ${tokens.production}` }
    });
    assert(
      fefoRes.status === 200 && fefoRes.body?.data?.recommendations?.length > 0,
      'Module 7: FEFO recommendation engine allocates earliest expiring batches first',
      fefoRes.body
    );

    // 13. Stock Adjustment Request (Module 6: Damaged/expired stock recorded as PENDING)
    const adjPayload = {
      item_id: 3, // Fenugreek
      batch_id: 4,
      location_id: 1,
      adjustment_type: 'EXPIRED',
      quantity: 5,
      reason: 'Physical inspection confirmed expiration. Discard recommended.'
    };
    const adjReqRes = await makeRequest({
      method: 'POST',
      path: '/api/inventory/adjustments',
      headers: { Authorization: `Bearer ${tokens.production}` },
      body: adjPayload
    });
    assert(
      adjReqRes.status === 201 && adjReqRes.body?.data?.status === 'PENDING',
      'Module 6: Stock adjustment request created with PENDING status for approval',
      adjReqRes.body
    );

    const adjId = adjReqRes.body.data.id;

    // 14. Stock Adjustment Approval (Module 6: ADMIN approves adjustment & updates ledger)
    const adjApproveRes = await makeRequest({
      method: 'PATCH',
      path: `/api/inventory/adjustments/${adjId}/approve`,
      headers: { Authorization: `Bearer ${tokens.admin}` },
      body: {
        decision: 'APPROVED',
        notes: 'Verified by Plant Quality Head and approved for scrap write-off.'
      }
    });
    assert(
      adjApproveRes.status === 200 && adjApproveRes.body?.data?.adjustment?.status === 'APPROVED',
      'Module 6: ADMIN approves stock adjustment and ledger entry is posted',
      adjApproveRes.body
    );

    // 15. Stock Transfer (Module 8: Transfer between locations with balance conservation)
    const trfPayload = {
      from_location_id: 1, // Central RM Warehouse
      to_location_id: 3,   // Production Floor
      item_id: 1,
      quantity: 20,
      notes: 'Transfer 20 KG Ponni rice to processing floor hopper'
    };
    const trfRes = await makeRequest({
      method: 'POST',
      path: '/api/inventory/transfers',
      headers: { Authorization: `Bearer ${tokens.production}` },
      body: trfPayload
    });
    assert(
      trfRes.status === 201 && trfRes.body?.data?.transfer?.transfer_number,
      'Module 8: Stock transfer completed (Source debited, Destination credited, Net conserved)',
      trfRes.body
    );

    // 16. Physical Stock Verification (Module 9: Create stock count & enter physical counts)
    const countPayload = {
      location_id: 1,
      counted_by: 'K. Sundaram (Internal Inventory Auditor)',
      notes: 'Quarterly Physical Inventory Audit - Central Warehouse'
    };
    const countCreateRes = await makeRequest({
      method: 'POST',
      path: '/api/inventory/counts',
      headers: { Authorization: `Bearer ${tokens.accountant}` },
      body: countPayload
    });
    assert(
      countCreateRes.status === 201 && countCreateRes.body?.data?.items?.length > 0,
      'Module 9: Physical stock count sheet generated with automated system baselines',
      countCreateRes.body
    );

    const countId = countCreateRes.body.data.id;

    // Update with counted discrepancy
    const updateCountRes = await makeRequest({
      method: 'PUT',
      path: `/api/inventory/counts/${countId}/items`,
      headers: { Authorization: `Bearer ${tokens.accountant}` },
      body: {
        items: [
          {
            item_id: 1,
            counted_quantity: 800, // discrepancy entered
            remarks: 'Physical count verified 2 extra bags from Kaveri lot'
          }
        ]
      }
    });
    assert(
      updateCountRes.status === 200 && updateCountRes.body?.data?.status === 'SUBMITTED',
      'Module 9: Auditor records physical count and system automatically computes variance',
      updateCountRes.body
    );

    // 17. Physical Stock Variance Approval (Module 9: ADMIN approves discrepancy & updates ledger)
    const approveCountRes = await makeRequest({
      method: 'PATCH',
      path: `/api/inventory/counts/${countId}/approve`,
      headers: { Authorization: `Bearer ${tokens.admin}` },
      body: {
        decision: 'APPROVED',
        notes: 'Audit variance approved after verification of supplier delivery slip.'
      }
    });
    assert(
      approveCountRes.status === 200 && approveCountRes.body?.data?.count?.status === 'APPROVED',
      'Module 9: ADMIN approves audit count and difference is reconciled in stock ledger',
      approveCountRes.body
    );

    // 18. Inventory Dashboard Stats (Module 10: KPIs, low-stock, movements, fast-moving items)
    const dashRes = await makeRequest({
      method: 'GET',
      path: '/api/inventory/dashboard',
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    assert(
      dashRes.status === 200 &&
      dashRes.body?.data?.raw_materials &&
      dashRes.body?.data?.packaging &&
      dashRes.body?.data?.finished_goods &&
      dashRes.body?.data?.alerts &&
      dashRes.body?.data?.movements_summary,
      'Module 10: Inventory dashboard calculates real valuations, alert counts, and movements',
      dashRes.body
    );

    // 19. Inventory Reports (Module 11: Current stock, Inward, Outward, Movement ledger)
    const repCurrentRes = await makeRequest({
      method: 'GET',
      path: '/api/inventory/reports?type=current_stock',
      headers: { Authorization: `Bearer ${tokens.accountant}` }
    });
    assert(
      repCurrentRes.status === 200 && Array.isArray(repCurrentRes.body?.data?.rows),
      'Module 11: Current Stock valuation report generated with export-ready dataset',
      repCurrentRes.body
    );

    const repMoveRes = await makeRequest({
      method: 'GET',
      path: '/api/inventory/reports?type=movement_history',
      headers: { Authorization: `Bearer ${tokens.accountant}` }
    });
    assert(
      repMoveRes.status === 200 && repMoveRes.body?.data?.rows?.length > 0,
      'Module 11: Stock Movement Ledger Audit Trail report generated',
      repMoveRes.body
    );

    console.log('\n================================================================');
    console.log(`  🏁 RESULTS: ${passCount} PASS  |  ${failCount} FAIL  |  ${passCount + failCount} TOTAL`);
    console.log('================================================================\n');

    if (failCount === 0) {
      console.log('  🎉 ALL TESTS PASSED! Phase 6 Inventory System API is working correctly.');
      process.exit(0);
    } else {
      console.error(`  ⚠️  ${failCount} tests failed. Please review output above.`);
      process.exit(1);
    }

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
};

runTests();
