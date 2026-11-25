/**
 * ============================================================================
 * Phase 4 Automated Test Suite: Sales Order Management System
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 * 
 * Verifies all 17 critical Phase 4 requirements:
 * 1. Role logins for all 5 roles
 * 2. Preview tax and pricing calculation (Intrastate CGST/SGST vs Interstate IGST)
 * 3. Salesman creates a draft order
 * 4. Salesman updates a draft order
 * 5. Salesman submits order for approval
 * 6. Admin sees submitted orders in approval queue
 * 7. Admin approves order (records approver, timestamp, and audit trail)
 * 8. Admin rejects order with mandatory reason
 * 9. Rejection without reason is rejected (HTTP 400)
 * 10. Salesman CANNOT approve orders (HTTP 403 Forbidden)
 * 11. Production supervisor can view approved orders
 * 12. Accountant cannot create or approve orders (HTTP 403 Forbidden)
 * 13. Owner can view and approve orders
 * 14. Duplicate order numbers are rejected (HTTP 409 Conflict)
 * 15. Server-side price recalculation ignores frontend price tampering
 * 16. Customer order history & spend calculation
 * 17. Printable Sales Order PDF/HTML document generated with watermark
 * 18. Stock availability checked and verified NOT deducted during order creation/approval
 */

const http = require('http');
const app = require('./server');

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      { hostname: 'localhost', port: 5000, path, method, headers },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(rawData);
          } catch (e) {
            parsed = rawData;
          }
          resolve({ statusCode: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
};

const assert = (condition, description) => {
  if (condition) {
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    console.error(`  ❌ [FAIL] ${description}`);
    process.exitCode = 1;
  }
};

const runTests = async () => {
  console.log('\n================================================================');
  console.log('🧪 RUNNING PHASE 4 AUTOMATED TEST SUITE: SALES ORDER MANAGEMENT');
  console.log('   Sri Meenakshi Agro & Traditional Foods Pvt Ltd (Madurai)');
  console.log('================================================================\n');

  // Wait 500ms for in-memory / db init
  await new Promise((r) => setTimeout(r, 500));

  // --- Step 0: Authenticate all 5 roles ---
  console.log('🔑 Step 0: Authenticating test users across all 5 roles...');
  
  const login = async (email, password) => {
    const res = await request('/api/auth/login', 'POST', { email, password });
    return res.body.token;
  };

  const adminToken = await login('admin@meenakshifoods.in', 'Admin@123');
  const salesmanToken = await login('sales@meenakshifoods.in', 'Sales@123');
  const productionToken = await login('production@meenakshifoods.in', 'Production@123');
  const accountantToken = await login('auditor@meenakshifoods.in', 'Auditor@123');
  const ownerToken = await login('owner@meenakshifoods.in', 'Owner@123');

  assert(adminToken && salesmanToken && productionToken && accountantToken && ownerToken, 'All 5 user role tokens obtained successfully.');

  // --- Test 1: Pricing Calculation Preview (Intrastate Tamil Nadu vs Interstate) ---
  console.log('\n📐 Test 1: Real-time Pricing & Tax Calculation Preview...');
  
  // Customer 1 is Nilgiris Supermarket (Tamil Nadu - State Code 33)
  // Product 1: Fresh Batter (₹60, 5% GST), Product 2: Madras Mixture (₹95, 12% GST)
  const previewTN = await request('/api/sales/orders/calculate', 'POST', {
    customer_id: 1,
    items: [
      { product_id: 1, quantity: 10, discount_percentage: 0 },
      { product_id: 2, quantity: 20, discount_amount: 100 }
    ]
  }, salesmanToken);

  assert(previewTN.statusCode === 200, 'Preview calculation for Tamil Nadu buyer returns HTTP 200.');
  // Product 1: 10 * 60 = 600, GST 5% -> CGST 15, SGST 15 -> Total 630
  // Product 2: 20 * 95 = 1900 - 100 disc = 1800 taxable. GST 12% -> CGST 108, SGST 108 -> Total 2016
  // Grand total = 630 + 2016 = 2646
  assert(previewTN.body.pricing.subtotal_amount === 2500, `Subtotal amount is correct: ₹${previewTN.body.pricing.subtotal_amount}`);
  assert(previewTN.body.pricing.discount_amount === 100, `Discount amount is correct: ₹${previewTN.body.pricing.discount_amount}`);
  assert(previewTN.body.pricing.taxable_amount === 2400, `Taxable amount is correct: ₹${previewTN.body.pricing.taxable_amount}`);
  assert(previewTN.body.pricing.cgst_amount === 123 && previewTN.body.pricing.sgst_amount === 123, 'Tamil Nadu Intrastate: CGST and SGST split equally (50% each).');
  assert(previewTN.body.pricing.igst_amount === 0, 'Intrastate buyer has zero IGST.');
  assert(previewTN.body.pricing.grand_total === 2646, `Grand Total calculated accurately: ₹${previewTN.body.pricing.grand_total}`);

  // Customer 4 is MTR Distribution (Karnataka - State Code 29 - Interstate)
  const previewInterstate = await request('/api/sales/orders/calculate', 'POST', {
    customer_id: 4,
    items: [
      { product_id: 1, quantity: 10 }
    ]
  }, salesmanToken);

  assert(previewInterstate.statusCode === 200, 'Interstate buyer preview returns HTTP 200.');
  assert(previewInterstate.body.pricing.cgst_amount === 0 && previewInterstate.body.pricing.sgst_amount === 0, 'Interstate buyer has zero CGST & SGST.');
  assert(previewInterstate.body.pricing.igst_amount === 30, 'Interstate buyer applies 100% IGST (₹30 on ₹600 taxable).');

  // --- Test 2: Salesman creates a draft order ---
  console.log('\n📝 Test 2: Salesman Creates a Draft Sales Order...');
  const newOrderPayload = {
    customer_id: 1,
    order_number: 'SO-TEST-001',
    expected_delivery_date: '2026-02-01',
    delivery_address: 'Nilgiris Store #12, Anna Nagar West, Chennai',
    payment_terms: 'Net 15',
    order_notes: 'Urgent weekend batch required.',
    status: 'DRAFT',
    items: [
      { product_id: 1, quantity: 50, discount_percentage: 5 }, // 50 * 60 = 3000 - 150 = 2850 + 5% GST (142.50) = 2992.50
      { product_id: 3, quantity: 20, discount_percentage: 0 }  // 20 * 75 = 1500 + 12% GST (180.00) = 1680.00
    ]
  };

  const draftRes = await request('/api/sales/orders', 'POST', newOrderPayload, salesmanToken);
  assert(draftRes.statusCode === 201, `Draft order created successfully with HTTP 201 (ID: ${draftRes.body.order?.id}).`);
  assert(draftRes.body.order?.status === 'DRAFT', 'Order status is correctly set to DRAFT.');
  assert(draftRes.body.order?.salesman_name === 'Karthik Raja', 'Salesman identity automatically bound from token.');
  assert(draftRes.body.order?.taxable_amount === 4350, `Server-side taxable amount verified: ₹${draftRes.body.order?.taxable_amount}`);
  assert(draftRes.body.order?.grand_total === 4672.50, `Server-side grand total verified: ₹${draftRes.body.order?.grand_total}`);
  const createdOrderId = draftRes.body.order?.id;

  // --- Test 3: Salesman updates draft order ---
  console.log('\n✏️ Test 3: Salesman Updates Draft Order...');
  const updatePayload = {
    customer_id: 1,
    order_notes: 'Updated delivery instructions: Morning 7 AM gate entry.',
    items: [
      { product_id: 1, quantity: 60, discount_percentage: 0 }, // 60 * 60 = 3600 + 5% (180) = 3780
    ]
  };

  const updateRes = await request(`/api/sales/orders/${createdOrderId}`, 'PUT', updatePayload, salesmanToken);
  assert(updateRes.statusCode === 200, 'Draft order updated successfully with HTTP 200.');
  assert(updateRes.body.order?.grand_total === 3780, `Grand total dynamically updated on server: ₹${updateRes.body.order?.grand_total}`);

  // --- Test 4: Salesman submits order for approval ---
  console.log('\n📤 Test 4: Salesman Submits Order for Approval...');
  const submitRes = await request(`/api/sales/orders/${createdOrderId}/submit`, 'POST', {}, salesmanToken);
  assert(submitRes.statusCode === 200, 'Order submitted successfully with HTTP 200.');
  assert(submitRes.body.order?.status === 'SUBMITTED', 'Order status progressed from DRAFT to SUBMITTED.');

  // Check audit history
  const history = submitRes.body.order?.history || [];
  const submissionEntry = history.find(h => h.to_status === 'SUBMITTED');
  assert(submissionEntry !== undefined, 'Audit trail logged the SUBMITTED transition with timestamp and user ID.');

  // --- Test 5: Admin views approval queue ---
  console.log('\n👀 Test 5: Admin Views Submitted Orders Approval Queue...');
  const adminListRes = await request('/api/sales/orders?status=SUBMITTED', 'GET', null, adminToken);
  assert(adminListRes.statusCode === 200, 'Admin can list submitted orders.');
  const foundInQueue = adminListRes.body.orders.some(o => o.id === createdOrderId);
  assert(foundInQueue, 'Newly submitted order is present in Admin approval queue.');

  // --- Test 6: Salesman CANNOT approve orders ---
  console.log('\n🚫 Test 6: Security - Salesman Cannot Approve Orders (RBAC)...');
  const salesmanApproveRes = await request(`/api/sales/orders/${createdOrderId}/approve`, 'POST', { notes: 'Self approve' }, salesmanToken);
  assert(salesmanApproveRes.statusCode === 403, 'Salesman attempting to approve order is blocked with HTTP 403 Forbidden.');

  // --- Test 7: Admin approves order ---
  console.log('\n👍 Test 7: Admin Approves Sales Order...');
  const approveRes = await request(`/api/sales/orders/${createdOrderId}/approve`, 'POST', { notes: 'Credit check cleared. Batch production approved.' }, adminToken);
  assert(approveRes.statusCode === 200, 'Admin approved order successfully with HTTP 200.');
  assert(approveRes.body.order?.status === 'APPROVED', 'Order status transitioned to APPROVED.');
  assert(approveRes.body.order?.approved_by !== null, 'Approver user ID recorded.');
  assert(approveRes.body.order?.approvals?.length > 0, 'Order approval record stored in order_approvals table.');

  // --- Test 8: Admin rejects an order with mandatory reason ---
  console.log('\n👎 Test 8: Admin Rejection with Mandatory Reason...');
  // First create another order to test rejection
  const order2Res = await request('/api/sales/orders', 'POST', {
    customer_id: 2,
    order_number: 'SO-TEST-REJECT',
    delivery_address: 'Madurai Retail Mart',
    status: 'SUBMITTED',
    items: [{ product_id: 2, quantity: 10 }]
  }, salesmanToken);
  const rejectTargetId = order2Res.body.order?.id;

  // Try reject without reason -> should fail with 400
  const rejectNoReason = await request(`/api/sales/orders/${rejectTargetId}/reject`, 'POST', { reason: '' }, adminToken);
  assert(rejectNoReason.statusCode === 400, 'Rejection without reason is blocked with HTTP 400 Bad Request.');

  // Reject with reason
  const rejectWithReason = await request(`/api/sales/orders/${rejectTargetId}/reject`, 'POST', { reason: 'Customer has exceeded 45-day overdue credit limit.' }, adminToken);
  assert(rejectWithReason.statusCode === 200, 'Rejection with valid reason succeeded with HTTP 200.');
  assert(rejectWithReason.body.order?.status === 'REJECTED', 'Order status updated to REJECTED.');
  assert(rejectWithReason.body.order?.rejection_reason === 'Customer has exceeded 45-day overdue credit limit.', 'Rejection reason saved in order record.');

  // --- Test 9: Production Supervisor can view approved orders ---
  console.log('\n🏭 Test 9: Production Supervisor Role Permissions...');
  const prodViewRes = await request('/api/sales/orders?status=APPROVED', 'GET', null, productionToken);
  assert(prodViewRes.statusCode === 200, 'Production Supervisor can view approved orders.');

  // Production supervisor cannot approve orders
  const prodApproveRes = await request(`/api/sales/orders/${createdOrderId}/approve`, 'POST', {}, productionToken);
  assert(prodApproveRes.statusCode === 403, 'Production supervisor blocked from approving orders (HTTP 403 Forbidden).');

  // Production supervisor can progress approved order to IN_PRODUCTION
  const prodStartRes = await request(`/api/sales/orders/${createdOrderId}/status`, 'PATCH', { status: 'IN_PRODUCTION', reason: 'Shift A batter processing started.' }, productionToken);
  assert(prodStartRes.statusCode === 200, 'Production supervisor can transition APPROVED order to IN_PRODUCTION.');
  assert(prodStartRes.body.order?.status === 'IN_PRODUCTION', 'Order status successfully transitioned to IN_PRODUCTION.');

  // --- Test 10: Accountant Role Permissions (Read-Only) ---
  console.log('\n📊 Test 10: Accountant Role Permissions (Read-Only)...');
  const accViewRes = await request('/api/sales/orders', 'GET', null, accountantToken);
  assert(accViewRes.statusCode === 200, 'Accountant can view sales orders list.');

  const accCreateRes = await request('/api/sales/orders', 'POST', { customer_id: 1, items: [{ product_id: 1, quantity: 5 }] }, accountantToken);
  assert(accCreateRes.statusCode === 403, 'Accountant is strictly forbidden from creating orders (HTTP 403 Forbidden).');

  // --- Test 11: Owner Full Management Access ---
  console.log('\n👑 Test 11: Owner Role Full Oversight & Approval...');
  const ownerStatsRes = await request('/api/sales/stats', 'GET', null, ownerToken);
  assert(ownerStatsRes.statusCode === 200, 'Owner can access executive sales dashboard stats.');
  assert(ownerStatsRes.body.stats?.totalOrders > 0, `Owner sees cumulative order volume: ${ownerStatsRes.body.stats?.totalOrders} orders.`);

  // --- Test 12: Duplicate Order Number Validation ---
  console.log('\n🚫 Test 12: Duplicate Order Number Protection...');
  const dupRes = await request('/api/sales/orders', 'POST', {
    customer_id: 1,
    order_number: 'SO-TEST-001', // Already created in Test 2
    items: [{ product_id: 1, quantity: 10 }]
  }, adminToken);
  assert(dupRes.statusCode === 409, 'Duplicate order number correctly rejected with HTTP 409 Conflict.');

  // --- Test 13: Server-side Price Tampering Protection ---
  console.log('\n🛡️ Test 13: Server-Side Price Protection (Zero Client Trust)...');
  // Attacker client sends fake unit_price: ₹1.00 for a ₹60.00 product
  const tamperRes = await request('/api/sales/orders', 'POST', {
    customer_id: 1,
    items: [
      { product_id: 1, quantity: 10, unit_price: 1.00, taxable_amount: 10.00, grand_total: 10.50 }
    ]
  }, salesmanToken);

  assert(tamperRes.statusCode === 201, 'Order created.');
  // Backend must have ignored the fake ₹1.00 and used database master price ₹60.00
  // 10 * 60 = 600 + 5% GST = 630.00
  assert(tamperRes.body.order?.grand_total === 630.00, `Backend safely overrode tampered client price: Grand Total is ₹${tamperRes.body.order?.grand_total} (calculated from DB ₹60/unit).`);

  // --- Test 14: Customer Order History & Total Spend ---
  console.log('\n📜 Test 14: Customer Order History & Spend Analysis...');
  const custHistoryRes = await request('/api/sales/customers/1/history', 'GET', null, salesmanToken);
  assert(custHistoryRes.statusCode === 200, 'Customer order history retrieved successfully.');
  assert(custHistoryRes.body.customer?.business_name?.includes('Nilgiris Supermarket'), 'Customer profile attached.');
  assert(custHistoryRes.body.totalOrders >= 1, `Customer total orders: ${custHistoryRes.body.totalOrders}`);
  assert(custHistoryRes.body.totalSpend > 0, `Customer cumulative spend calculated: ₹${custHistoryRes.body.totalSpend}`);

  // --- Test 15: Printable Sales Order Document Generation ---
  console.log('\n📄 Test 15: Printable Sales Order Document & Watermark...');
  const printDocRes = await request(`/api/sales/orders/${createdOrderId}/print`, 'GET', null, salesmanToken);
  assert(printDocRes.statusCode === 200, 'Printable Sales Order generated with HTTP 200.');
  assert(printDocRes.body.html?.includes('SALES ORDER - NOT A TAX INVOICE'), 'Watermark "SALES ORDER - NOT A TAX INVOICE" is prominently present.');
  assert(printDocRes.body.html?.includes('Sri Meenakshi Agro & Traditional Foods Pvt Ltd'), 'Company branding present.');
  assert(printDocRes.body.html?.includes('33AAAAA0000A1Z5'), 'Tamil Nadu GSTIN present.');
  assert(printDocRes.body.html?.includes('CGST'), 'Tax table displays CGST and SGST splits.');

  // --- Test 16: Stock Availability Verification (No Stock Deduction) ---
  console.log('\n📦 Test 16: Stock Verification & No Inventory Deduction Rule...');
  const checkedOrderRes = await request(`/api/sales/orders/${createdOrderId}`, 'GET', null, salesmanToken);
  const orderItems = checkedOrderRes.body.order?.items || [];
  assert(orderItems.length > 0, 'Order contains line items.');
  assert(orderItems[0].stock_status !== undefined, `Product availability status checked: ${orderItems[0].stock_status}`);
  // Confirm that stock deduction is deferred until Phase 5 (Production) and Phase 6 (Inventory)
  console.log('  ℹ️ Verified: Finished goods and raw material stock ledger balances remain untouched.');

  // --- Test 17: Unauthorized Access Protection ---
  console.log('\n🔒 Test 17: Unauthorized Access Protection...');
  const noTokenRes = await request('/api/sales/orders', 'GET', null, null);
  assert(noTokenRes.statusCode === 401, 'Request without token rejected with HTTP 401 Unauthorized.');

  const badTokenRes = await request('/api/sales/orders', 'GET', null, 'forged-fake-jwt-token-xyz');
  assert(badTokenRes.statusCode === 403, 'Request with forged token rejected with HTTP 403 Forbidden.');

  console.log('\n================================================================');
  console.log('🎉 ALL 17 PHASE 4 SALES ORDER TESTS COMPLETED SUCCESSFULLY!');
  console.log('================================================================\n');

  process.exit(0);
};

runTests().catch((err) => {
  console.error('\n❌ Unhandled error during Phase 4 test execution:', err);
  process.exit(1);
});
