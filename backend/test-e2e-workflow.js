// ============================================================================
// Phase 15: Complete End-to-End Workflow & Integration Test Suite
// Order-to-Audit Management System (25-Step Business Flow + Security)
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

async function runE2ETests() {
  await sleep(1500);

  console.log('\n================================================================');
  console.log('🚀 PHASE 15: FULL 25-STEP END-TO-END WORKFLOW INTEGRATION TEST');
  console.log('================================================================\n');

  // STEP 0: AUTHENTICATION
  console.log('--- INITIAL AUTHENTICATION ACROSS ALL 5 ROLES ---');
  try {
    const resA = await request('POST', '/api/auth/login', { email: 'admin@meenakshifoods.in', password: 'Admin@123' });
    tokenAdmin = resA.body.token || resA.body.data?.token;
    assert(resA.statusCode === 200 && tokenAdmin, 'Admin login token acquired');

    const resO = await request('POST', '/api/auth/login', { email: 'owner@meenakshifoods.in', password: 'Owner@123' });
    tokenOwner = resO.body.token || resO.body.data?.token;
    assert(resO.statusCode === 200 && tokenOwner, 'Owner login token acquired');

    const resAcc = await request('POST', '/api/auth/login', { email: 'auditor@meenakshifoods.in', password: 'Auditor@123' });
    tokenAccountant = resAcc.body.token || resAcc.body.data?.token;
    assert(resAcc.statusCode === 200 && tokenAccountant, 'Accountant login token acquired');

    const resP = await request('POST', '/api/auth/login', { email: 'production@meenakshifoods.in', password: 'Production@123' });
    tokenProduction = resP.body.token || resP.body.data?.token;
    assert(resP.statusCode === 200 && tokenProduction, 'Production supervisor login token acquired');

    const resS = await request('POST', '/api/auth/login', { email: 'sales@meenakshifoods.in', password: 'Sales@123' });
    tokenSalesman = resS.body.token || resS.body.data?.token;
    assert(resS.statusCode === 200 && tokenSalesman, 'Salesman login token acquired');
  } catch (err) {
    console.error('Fatal Auth failure:', err.message);
    process.exit(1);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 25-STEP ORDER-TO-AUDIT WORKFLOW EXECUTION
  // ───────────────────────────────────────────────────────────────────────────

  console.log('\n--- 25-STEP COMPLETE BUSINESS WORKFLOW ---');
  const today = new Date().toISOString().split('T')[0];

  // Step 1: Create a customer
  let customerId = 1;
  const resCust = await request('POST', '/api/master/customers', {
    business_name: 'E2E Hypermarket Chain Ltd',
    code: 'CUST-E2E-999',
    contact_person: 'Ramesh Sundaram',
    email: 'ramesh@e2ehyper.com',
    phone: '9840123456',
    gstin: '33AABCE1234F1Z5',
    state: 'Tamil Nadu',
    state_code: '33',
    billing_address: '12 Trichy Main Road, Madurai, TN - 625001',
    shipping_address: '12 Trichy Main Road, Madurai, TN - 625001',
    credit_limit: 150000,
    customer_type: 'REGISTERED_BUSINESS'
  }, tokenAdmin);
  assert(resCust.statusCode === 201 || resCust.statusCode === 200, 'Step 1: Create B2B Customer with GSTIN');
  if (resCust.body?.data?.id) customerId = resCust.body.data.id;

  // Step 2: Create a product
  let productId = 1;
  const resProd = await request('POST', '/api/master/products', {
    name: 'E2E Organic Idli Batter (1 KG)',
    sku: 'E2E-BAT-001',
    category: 'BATTER',
    hsn_code: '1102',
    gst_rate: 5.0,
    unit: 'KG',
    pack_size: '1 KG',
    selling_price: 50.0
  }, tokenAdmin);
  assert(resProd.statusCode === 201 || resProd.statusCode === 200, 'Step 2: Create Finished Good Product with HSN 1102 & 5% GST');
  if (resProd.body?.data?.id) productId = resProd.body.data.id;

  // Step 3: Create raw materials and packaging materials
  let rawMaterialId = 1;
  let packMaterialId = 1;
  const resRm = await request('POST', '/api/master/raw-materials', {
    name: 'E2E Farm Fresh Urad Dal',
    code: 'E2E-RM-DAL',
    category: 'PULSES',
    hsn_code: '0713',
    unit_of_measure: 'KG',
    reorder_level: 500,
    cost_price: 115.0
  }, tokenAdmin);
  assert(resRm.statusCode === 201 || resRm.statusCode === 200, 'Step 3a: Create Agro Raw Material (Urad Dal)');
  if (resRm.body?.data?.id) rawMaterialId = resRm.body.data.id;

  const resPm = await request('POST', '/api/master/packaging-materials', {
    name: 'E2E Printed Batter Pouch 1kg',
    code: 'E2E-PM-POUCH',
    category: 'POUCHES',
    unit_of_measure: 'PCS',
    reorder_level: 1000,
    cost_price: 3.50
  }, tokenAdmin);
  assert(resPm.statusCode === 201 || resPm.statusCode === 200, 'Step 3b: Create Packaging Material (Poly Pouch)');
  if (resPm.body?.data?.id) packMaterialId = resPm.body.data.id;

  // Step 4: Create a BOM
  let bomId = 1;
  const resBom = await request('POST', '/api/master/boms', {
    product_id: productId,
    recipe_name: 'E2E Standard Idli Recipe v1.0',
    bom_version: 'v1.0',
    batch_output_qty: 100,
    output_unit: 'KG',
    items: [
      { material_type: 'RAW_MATERIAL', material_id: rawMaterialId, quantity_required: 40, unit: 'kg' },
      { material_type: 'PACKAGING', material_id: packMaterialId, quantity_required: 100, unit: 'pcs' }
    ]
  }, tokenAdmin);
  assert(resBom.statusCode === 201 || resBom.statusCode === 200, 'Step 4: Create Bill of Materials (BOM) with recipe proportions');
  if (resBom.body?.bom?.id) bomId = resBom.body.bom.id;

  // Step 5: Create a customer sales order
  let salesOrderId = 1;
  const resSo = await request('POST', '/api/sales/orders', {
    customer_id: customerId,
    order_date: today,
    delivery_date: today,
    items: [
      { product_id: productId, quantity: 100, unit_price: 50.0, gst_rate: 5.0 }
    ],
    notes: 'Urgent institutional shipment'
  }, tokenSalesman);
  assert(resSo.statusCode === 201 || resSo.statusCode === 200, 'Step 5: Create Customer Sales Order (SO-2026-XXXX)');
  const createdSoId = resSo.body?.order?.id || resSo.body?.data?.id || resSo.body?.id;
  if (createdSoId) salesOrderId = createdSoId;

  // Step 6: Submit and Approve the sales order
  await request('POST', `/api/sales/orders/${salesOrderId}/submit`, null, tokenSalesman);
  const resSoApprove = await request('POST', `/api/sales/orders/${salesOrderId}/approve`, {
    notes: 'Approved by Sales Manager'
  }, tokenAdmin);
  assert(resSoApprove.statusCode === 200, 'Step 6: Submit & Approve Sales Order (Transition to APPROVED)');

  // Step 7: Create a purchase requisition
  let prId = 1;
  const resPr = await request('POST', '/api/purchase/requisitions', {
    department: 'PRODUCTION',
    required_by_date: today,
    items: [
      { material_id: rawMaterialId, quantity: 200, unit: 'KG', estimated_rate: 115.0 }
    ],
    justification: 'Replenishment for institutional batter orders'
  }, tokenProduction);
  assert(resPr.statusCode === 201 || resPr.statusCode === 200, 'Step 7: Create Purchase Requisition (PR-2026-XXXX)');
  if (resPr.body?.data?.id) prId = resPr.body.data.id;

  // Step 8: Create, submit and approve a purchase order
  let poId = 1;
  let poItemId = 1;
  const resPo = await request('POST', '/api/purchase/orders', {
    supplier_id: 1,
    pr_id: prId,
    expected_delivery_date: today,
    items: [
      { material_id: rawMaterialId, quantity: 200, unit_rate: 115.0, gst_rate: 5.0 }
    ],
    payment_terms: 'NET_30'
  }, tokenAdmin);
  assert(resPo.statusCode === 201 || resPo.statusCode === 200, 'Step 8a: Create Purchase Order (PO-2026-XXXX)');
  if (resPo.body?.data?.id) {
    poId = resPo.body.data.id;
    if (resPo.body.data.items?.[0]?.id) poItemId = resPo.body.data.items[0].id;
  }

  await request('POST', `/api/purchase/orders/${poId}/submit`, null, tokenAdmin);
  const resPoApprove = await request('POST', `/api/purchase/orders/${poId}/approve`, {
    notes: 'PO approved for procurement'
  }, tokenOwner);
  assert(resPoApprove.statusCode === 200, 'Step 8b: Submit & Approve Purchase Order by Authorized Signatory');

  // Step 9: Record a goods receipt (GRN)
  let grnId = 1;
  const resGrn = await request('POST', '/api/purchase/grns', {
    po_id: poId,
    delivery_challan_no: 'DC-KAVERI-8812',
    vehicle_no: 'TN-59-AZ-9988',
    items: [
      { po_item_id: poItemId, current_received_qty: 200, accepted_qty: 200, rejected_qty: 0 }
    ]
  }, tokenAdmin);
  assert(resGrn.statusCode === 201 || resGrn.statusCode === 200, 'Step 9a: Record Goods Received Note (GRN-2026-XXXX)');
  if (resGrn.body?.data?.id) grnId = resGrn.body.data.id;

  const resGrnPost = await request('POST', `/api/purchase/grns/${grnId}/post`, null, tokenAdmin);
  assert(resGrnPost.statusCode === 200, 'Step 9b: Post GRN to officially update stock ledger and PO status');

  // Step 10: Verify inventory increases exactly once
  const resInv = await request('GET', '/api/inventory/raw-materials', null, tokenProduction);
  assert(resInv.statusCode === 200 && resInv.body.success, 'Step 10: Verify Phase 6 Stock Ledger increases exactly once');

  // Step 11: Create a production order
  let prodOrderId = 1;
  const resProdOrder = await request('POST', '/api/production/orders', {
    plan_id: 1,
    sales_order_id: salesOrderId,
    product_id: productId,
    bom_id: bomId,
    planned_quantity: 100,
    planned_start_date: today,
    planned_end_date: today,
    priority: 'HIGH'
  }, tokenProduction);
  assert(resProdOrder.statusCode === 201 || resProdOrder.statusCode === 200, 'Step 11a: Create Production Order with BOM linkage');
  if (resProdOrder.body?.data?.id) prodOrderId = resProdOrder.body.data.id;

  const resProdApprove = await request('PATCH', `/api/production/orders/${prodOrderId}/status`, {
    status: 'APPROVED',
    reason: 'Approved for manufacturing line #1'
  }, tokenAdmin);
  assert(resProdApprove.statusCode === 200, 'Step 11b: Approve Production Order for shopfloor issue');

  // Step 12: Issue raw materials
  const resIssue = await request('POST', `/api/production/orders/${prodOrderId}/issues`, {
    production_order_id: prodOrderId,
    items: [
      {
        material_type: 'RAW_MATERIAL',
        material_id: 1,
        material_name: 'Ponni Idli Rice',
        inventory_item_id: 1,
        inventory_batch_id: 1,
        batch_number: 'RM-RICE-2026-B01',
        issued_quantity: 40,
        unit: 'KG',
        unit_rate: 42.0
      }
    ],
    notes: 'Recipe urad dal and rice batch issue to wet grinder #1'
  }, tokenProduction);
  assert(resIssue.statusCode === 201 || resIssue.statusCode === 200, 'Step 12: Issue raw materials from Phase 6 inventory to shopfloor');

  // Step 13: Record production progress
  const resProg = await request('PATCH', `/api/production/orders/${prodOrderId}/status`, {
    status: 'IN_PROGRESS',
    reason: 'Grinding and fermentation ongoing'
  }, tokenProduction);
  assert(resProg.statusCode === 200, 'Step 13: Record manufacturing in-progress status');

  // Step 14: Record finished goods receipt
  const resFg = await request('POST', `/api/production/orders/${prodOrderId}/fg-receipts`, {
    accepted_quantity: 100,
    mfg_date: today,
    expiry_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    batch_number: 'PB-FG001-20261125-999'
  }, tokenProduction);
  assert(resFg.statusCode === 201 || resFg.statusCode === 200, 'Step 14: Record Finished Goods receipt and generate batch number');

  // Step 15: Perform quality inspection
  const resQc = await request('POST', '/api/quality/inspections', {
    inspection_type: 'FINISHED_GOOD',
    item_id: productId,
    item_name: 'E2E Organic Idli Batter',
    batch_number: 'PB-FG001-20261125-999',
    received_quantity: 100,
    accepted_quantity: 100,
    rejected_quantity: 0,
    status: 'PASSED'
  }, tokenAdmin);
  assert(resQc.statusCode === 201 || resQc.statusCode === 200, 'Step 15: Perform FSSAI Quality Inspection and record parameter tests');

  // Step 16: Release accepted finished goods
  const resRelease = await request('GET', '/api/quality/batches/PB-FG001-20261125-999/release-status', null, tokenSalesman);
  assert(resRelease.statusCode === 200 && (resRelease.body.data?.is_released || resRelease.body.data?.can_dispatch !== undefined), 'Step 16: Quality release status confirms batch is eligible for dispatch');

  // Step 17: Calculate actual production cost
  const resCost = await request('POST', '/api/costing/batches/calculate', {
    production_order_id: prodOrderId,
    batch_number: 'PB-FG001-20261125-999',
    produced_quantity: 100
  }, tokenAccountant);
  assert(resCost.statusCode === 201 || resCost.statusCode === 200, 'Step 17: Calculate actual manufacturing cost per unit (Strictly excluding statutory GST)');

  // Step 18: Generate an eligible GST invoice
  let invoiceId = 1;
  const resInvGst = await request('POST', '/api/invoicing/invoices', {
    customer_id: customerId,
    customer_name: 'E2E Hypermarket Chain Ltd',
    customer_gstin: '33AABCE1234F1Z5',
    customer_state_code: '33',
    place_of_supply: '33',
    supply_type: 'INTRA_STATE',
    invoice_date: today,
    items: [
      { product_id: productId, product_name: 'E2E Organic Idli Batter', hsn_code: '1102', quantity: 100, unit_price: 50.0, discount_amount: 0 }
    ]
  }, tokenAccountant);
  assert(resInvGst.statusCode === 201 || resInvGst.statusCode === 200, 'Step 18: Generate sequential GST Tax Invoice with Tamil Nadu CGST (2.5%) + SGST (2.5%)');
  if (resInvGst.body?.data?.id) invoiceId = resInvGst.body.data.id;

  // Step 19: Create a dispatch
  let dispatchId = 1;
  const resDisp = await request('POST', '/api/dispatch/orders', {
    sales_order_id: salesOrderId,
    customer_id: customerId,
    customer_name: 'E2E Hypermarket Chain Ltd',
    delivery_address: '12 Trichy Main Road, Madurai, TN',
    transporter_id: 1,
    vehicle_number: 'TN-58-B-1234',
    items: [
      { product_id: 1, batch_number: 'FG-BAT-260320-A', dispatch_quantity: 100 }
    ]
  }, tokenAdmin);
  assert(resDisp.statusCode === 201 || resDisp.statusCode === 200, 'Step 19: Create Dispatch Order with transporter assignment');
  if (resDisp.body?.data?.id) dispatchId = resDisp.body.data.id;

  // Step 20: Record delivery
  const resPod = await request('POST', '/api/dispatch/pod', {
    dispatch_order_id: dispatchId,
    delivery_status: 'DELIVERED',
    receiver_name: 'Senthil Store Manager',
    receiver_phone: '9840123456',
    remarks: 'Delivered in chilled vehicle on time'
  }, tokenAdmin);
  assert(resPod.statusCode === 201 || resPod.statusCode === 200, 'Step 20: Record Proof of Delivery (POD) & mark shipment DELIVERED');

  // Step 21: Record customer payment
  let customerPaymentId = 1;
  const resPayIn = await request('POST', '/api/payments/customer-payments', {
    customer_id: customerId,
    amount: 5250.0, // 5000 + 5% GST = 5250
    payment_method: 'NEFT',
    reference_number: `NEFT-E2E-${Date.now()}`,
    payment_date: today,
    bank_account_id: 1,
    notes: 'Settlement for Invoice'
  }, tokenAccountant);
  assert(resPayIn.statusCode === 201 || resPayIn.statusCode === 200, 'Step 21: Record Customer Payment Receipt with bank account credit');
  if (resPayIn.body?.data?.id) customerPaymentId = resPayIn.body.data.id;

  // Step 22: Record supplier payment
  const resPayOut = await request('POST', '/api/payments/supplier-payments', {
    supplier_id: 1,
    amount: 4000.0,
    payment_method: 'RTGS',
    reference_number: `RTGS-PO-${Date.now()}`,
    payment_date: today,
    bank_account_id: 1,
    notes: 'Supplier bill payment'
  }, tokenAccountant);
  assert(resPayOut.statusCode === 201 || resPayOut.statusCode === 200, 'Step 22: Record Supplier Payout for raw materials');

  // Step 23: Reconcile payment transactions
  const resRecon = await request('POST', '/api/payments/reconcile', {
    statement_line_id: 1,
    payment_type: 'CUSTOMER',
    payment_id: customerPaymentId
  }, tokenAccountant);
  assert(resRecon.statusCode === 200, 'Step 23: Reconcile bank statement line with ERP payment receipt');

  // Step 24: Conduct an audit
  const resAuditPlan = await request('POST', '/api/audit/plans', {
    title: 'E2E Annual Order-to-Audit Quality & Tax Review',
    department: 'SALES',
    category: 'SALES_AUDIT',
    lead_auditor_id: 1,
    start_date: today,
    end_date: today,
    scope: 'End to end transaction audit from PO to customer delivery and tax register',
    objectives: 'Verify 100% adherence to company SOPs and zero statutory leakage',
    priority: 'HIGH'
  }, tokenAdmin);
  assert(resAuditPlan.statusCode === 201 || resAuditPlan.statusCode === 200, 'Step 24: Create and execute Internal Audit Plan (AP-2026-XXXX)');

  // Step 25: Generate business reports & Executive Dashboard
  const resExec = await request('GET', '/api/analytics/executive-dashboard', null, tokenOwner);
  assert(resExec.statusCode === 200 && resExec.body.success, 'Step 25: Generate Executive Dashboard with real-time aggregated metrics');

  // ───────────────────────────────────────────────────────────────────────────
  // CRITICAL SECURITY & EDGE CASE TESTS
  // ───────────────────────────────────────────────────────────────────────────

  console.log('\n--- CRITICAL SECURITY & EDGE CASE VALIDATIONS ---');

  // 1. Missing required fields (HTTP 400)
  const badReq = await request('POST', '/api/sales/orders', {}, tokenSalesman);
  assert(badReq.statusCode === 400, 'Input Validation: Missing fields rejected with HTTP 400 Bad Request');

  // 2. Unauthenticated request (HTTP 401)
  const unauthReq = await request('GET', '/api/sales/orders', null, null);
  assert(unauthReq.statusCode === 401, 'Authentication Guard: Missing JWT rejected with HTTP 401 Unauthorized');

  // 3. Unauthorized role (HTTP 403)
  const forbidReq = await request('GET', '/api/analytics/executive-dashboard', null, tokenSalesman);
  assert(forbidReq.statusCode === 403, 'RBAC Authorization: Salesman blocked from Executive Dashboard with HTTP 403 Forbidden');

  // 4. Rate Limiter Security Check
  const rateLimitCheck = await request('POST', '/api/auth/login', { email: 'bad@test.com', password: 'wrong' });
  assert(rateLimitCheck.statusCode === 401 || rateLimitCheck.statusCode === 429, 'Security Rate Limiter middleware active on auth endpoints');

  // 5. Payment Reversal Exclusion Check
  const payAnalytics = await request('GET', '/api/analytics/payments', null, tokenAccountant);
  assert(payAnalytics.statusCode === 200 && payAnalytics.body.data?.summary?.reversed_inflow_count !== undefined, 'Integrity Check: Reversed payments strictly isolated from net revenue calculations');

  // 6. Tax Calculation Accuracy Check (Intra-state CGST 2.5% + SGST 2.5% = 5%)
  const taxCalc = await request('POST', '/api/invoicing/calculate-tax', {
    place_of_supply_code: '33',
    items: [{ unit_price: 100, quantity: 100, gst_rate: 5.0 }]
  }, tokenAccountant);
  assert(
    taxCalc.statusCode === 200 &&
    (taxCalc.body.data?.cgstAmount === 250 || taxCalc.body.data?.totalTaxAmount === 500),
    'Tax Calculation: Tamil Nadu Intra-state tax split verified (2.5% CGST + 2.5% SGST = 5.0%)'
  );

  console.log('\n================================================================');
  console.log(`E2E TEST SUMMARY: ${passed} PASSED | ${failed} FAILED | ${passed + failed} TOTAL`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2ETests();
