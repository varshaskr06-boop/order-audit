/**
 * ============================================================================
 * Phase 12 Automated Test Suite: Payment Management System
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
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error(`     Details: ${details}`);
    failCount++;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING PHASE 12: PAYMENT MANAGEMENT SYSTEM TEST SUITE');
  console.log('================================================================\n');

  await sleep(1500);

  // 1. Authenticate All User Roles
  console.log('--- STEP 1: AUTHENTICATING USER ROLES ---');
  tokens.admin = await login('admin@meenakshifoods.in', 'Admin@123');
  tokens.production = await login('production@meenakshifoods.in', 'Production@123');
  tokens.accountant = await login('auditor@meenakshifoods.in', 'Auditor@123');
  tokens.owner = await login('owner@meenakshifoods.in', 'Owner@123');
  tokens.salesman = await login('sales@meenakshifoods.in', 'Sales@123');

  assert(Boolean(tokens.admin), 'Admin login successful');
  assert(Boolean(tokens.accountant), 'Accountant login successful');
  assert(Boolean(tokens.owner), 'Owner login successful');
  assert(Boolean(tokens.salesman), 'Salesman login successful');
  assert(Boolean(tokens.production), 'Production supervisor login successful');

  const adminHeaders = { Authorization: `Bearer ${tokens.admin}` };
  const acctHeaders = { Authorization: `Bearer ${tokens.accountant}` };
  const ownerHeaders = { Authorization: `Bearer ${tokens.owner}` };
  const salesHeaders = { Authorization: `Bearer ${tokens.salesman}` };
  const prodHeaders = { Authorization: `Bearer ${tokens.production}` };

  // 2. Bank & Cash Accounts
  console.log('\n--- STEP 2: BANK & CASH ACCOUNTS ---');
  const accountsRes = await makeRequest({
    method: 'GET',
    path: '/api/payments/accounts',
    headers: acctHeaders
  });
  assert(accountsRes.status === 200 && Array.isArray(accountsRes.body.data) && accountsRes.body.data.length >= 3,
    'Retrieve cash & bank accounts (minimum 3 seeded accounts: HDFC, SBI, Cash Desk)',
    `Status: ${accountsRes.status}, Count: ${accountsRes.body.data?.length}`
  );

  const newAccRes = await makeRequest({
    method: 'POST',
    path: '/api/payments/accounts',
    headers: adminHeaders,
    body: {
      account_code: 'BNK-ICICI-03',
      account_name: 'ICICI Bank Export & Specialized Trade A/C',
      account_type: 'BANK',
      bank_name: 'ICICI Bank',
      account_number: '621100554433',
      ifsc_code: 'ICIC0000456',
      branch_name: 'KK Nagar, Madurai',
      opening_balance: 100000.00
    }
  });
  assert(newAccRes.status === 201 && newAccRes.body.data?.account_code === 'BNK-ICICI-03',
    'Create new company bank account with balance tracking',
    `Status: ${newAccRes.status}`
  );

  // 3. Customer Payments: Full & Partial & Multi-Invoice Allocations
  console.log('\n--- STEP 3: CUSTOMER PAYMENT RECEIPTS & ALLOCATIONS ---');
  
  // Fetch invoices for Customer 3 (Bengaluru Traditional Foods Distributor LLP)
  // invoice 2 (INV/2026-27/0102) has total 13,440.00 and balance_due 13,440.00
  const custInvoicesRes = await makeRequest({
    method: 'GET',
    path: '/api/payments/customers/3/invoices',
    headers: acctHeaders
  });
  assert(custInvoicesRes.status === 200 && Array.isArray(custInvoicesRes.body.data) && custInvoicesRes.body.data.length > 0,
    'Query customer issued invoices eligible for payment settlement',
    `Status: ${custInvoicesRes.status}`
  );

  // Test over-allocation prevention (> invoice balance)
  const overAllocAttempt = await makeRequest({
    method: 'POST',
    path: '/api/payments/customer-payments',
    headers: acctHeaders,
    body: {
      customer_id: 3,
      customer_name: 'Bengaluru Traditional Foods Distributor LLP',
      amount: 20000.00,
      payment_method: 'BANK_TRANSFER',
      reference_number: 'NEFT-OVERALLOC-01',
      allocations: [
        { invoice_id: 2, invoice_number: 'INV/2026-27/0102', allocated_amount: 15000.00 } // Balance is only 13,440!
      ]
    }
  });
  assert(overAllocAttempt.status === 400 && overAllocAttempt.body.code === 'OVER_ALLOCATION',
    'Prevent allocation exceeding invoice remaining balance (HTTP 400 OVER_ALLOCATION)',
    `Status: ${overAllocAttempt.status}, Code: ${overAllocAttempt.body.code}`
  );

  // Partial Payment with Advance (Receipt of ₹15,000: ₹10,000 allocated to INV 2, ₹5,000 unallocated advance)
  const partialAdvancePaymentRes = await makeRequest({
    method: 'POST',
    path: '/api/payments/customer-payments',
    headers: acctHeaders,
    body: {
      customer_id: 3,
      customer_name: 'Bengaluru Traditional Foods Distributor LLP',
      payment_date: '2026-11-23',
      amount: 15000.00,
      payment_method: 'BANK_TRANSFER',
      cash_bank_account_id: 1,
      reference_number: 'NEFT-HDFC-BENG-001',
      notes: 'Partial settlement for savories invoice plus advance credit',
      allocations: [
        { invoice_id: 2, invoice_number: 'INV/2026-27/0102', allocated_amount: 10000.00 }
      ]
    }
  });
  assert(partialAdvancePaymentRes.status === 201 &&
    partialAdvancePaymentRes.body.data?.allocated_amount === 10000 &&
    partialAdvancePaymentRes.body.data?.unallocated_amount === 5000,
    'Record customer payment with partial allocation (₹10,000) and unallocated advance credit (₹5,000)',
    `Status: ${partialAdvancePaymentRes.status}, Allocated: ${partialAdvancePaymentRes.body.data?.allocated_amount}, Advance: ${partialAdvancePaymentRes.body.data?.unallocated_amount}`
  );

  const customerPaymentId = partialAdvancePaymentRes.body.data?.id;

  // Prevent duplicate payment reference on same bank account
  const dupRefAttempt = await makeRequest({
    method: 'POST',
    path: '/api/payments/customer-payments',
    headers: acctHeaders,
    body: {
      customer_id: 3,
      amount: 500.00,
      payment_method: 'BANK_TRANSFER',
      cash_bank_account_id: 1,
      reference_number: 'NEFT-HDFC-BENG-001' // Duplicate!
    }
  });
  assert([400, 409].includes(dupRefAttempt.status) && dupRefAttempt.body.code === 'DUPLICATE_REFERENCE',
    'Prevent duplicate payment transaction reference within bank account scope (HTTP 400/409 DUPLICATE_REFERENCE)',
    `Status: ${dupRefAttempt.status}, Code: ${dupRefAttempt.body.code}`
  );

  // Full settlement of remaining invoice balance (₹3,440.00)
  const fullSettleRes = await makeRequest({
    method: 'POST',
    path: '/api/payments/customer-payments',
    headers: acctHeaders,
    body: {
      customer_id: 3,
      amount: 3440.00,
      payment_method: 'UPI',
      cash_bank_account_id: 1,
      reference_number: 'UPI-BENG-998800',
      allocations: [
        { invoice_id: 2, invoice_number: 'INV/2026-27/0102', allocated_amount: 3440.00 }
      ]
    }
  });
  assert(fullSettleRes.status === 201 && fullSettleRes.body.data?.status === 'ALLOCATED',
    'Full settlement of remaining invoice balance updating status to ALLOCATED',
    `Status: ${fullSettleRes.status}`
  );

  // 4. Payment Reversal (Bounced Cheque / Failed Transaction)
  console.log('\n--- STEP 4: PAYMENT REVERSAL & BOUNCED CHEQUE HANDLING ---');
  // Record a cheque receipt to test reversal
  const chequeReceiptRes = await makeRequest({
    method: 'POST',
    path: '/api/payments/customer-payments',
    headers: acctHeaders,
    body: {
      customer_id: 2,
      amount: 1000.00,
      payment_method: 'CHEQUE',
      cheque_number: 'CHQ-889900',
      cheque_date: '2026-11-20',
      bank_name: 'Canara Bank',
      reference_number: 'CHQ-REF-8899',
      allocations: [
        { invoice_id: 3, invoice_number: 'INV/2026-27/0103', allocated_amount: 1000.00 }
      ]
    }
  });
  const chequePaymentId = chequeReceiptRes.body.data?.id;

  const reversalRes = await makeRequest({
    method: 'POST',
    path: `/api/payments/customer-payments/${chequePaymentId}/reverse`,
    headers: acctHeaders,
    body: {
      reversal_reason: 'BOUNCED_CHEQUE',
      notes: 'Cheque returned unpaid with memo: Insufficient Funds'
    }
  });
  assert(reversalRes.status === 200 && reversalRes.body.reversal?.reversal_number?.startsWith('REV-'),
    'Process payment reversal for bounced cheque with immutable audit trail and balance restoration',
    `Status: ${reversalRes.status}, Rev #: ${reversalRes.body.reversal?.reversal_number}`
  );

  // Prevent duplicate reversal
  const dupReversalRes = await makeRequest({
    method: 'POST',
    path: `/api/payments/customer-payments/${chequePaymentId}/reverse`,
    headers: acctHeaders,
    body: { reversal_reason: 'BOUNCED_CHEQUE' }
  });
  assert(dupReversalRes.status === 400 && dupReversalRes.body.code === 'ALREADY_REVERSED',
    'Prevent double reversal of already reversed transaction (HTTP 400 ALREADY_REVERSED)',
    `Status: ${dupReversalRes.status}`
  );

  // 5. Supplier Payments & 3-Way Matching Discrepancy Gate
  console.log('\n--- STEP 5: SUPPLIER PAYMENTS & 3WM DISCREPANCY GUARD ---');
  
  // In purchaseModel: Seeded supplier invoice 1 is MATCHED. Invoice 2 has DISCREPANCY.
  // Supplier ID 2: Guntur Dal Traders
  const suppInvoicesRes = await makeRequest({
    method: 'GET',
    path: '/api/payments/suppliers/1/invoices',
    headers: acctHeaders
  });
  assert(suppInvoicesRes.status === 200 && Array.isArray(suppInvoicesRes.body.data),
    'Query supplier unpaid procurement invoices with 3WM match verification',
    `Status: ${suppInvoicesRes.status}`
  );

  // CRITICAL TEST: Block payment of supplier invoice marked DISCREPANCY by 3WM
  const discrepancyPayAttempt = await makeRequest({
    method: 'POST',
    path: '/api/payments/supplier-payments',
    headers: acctHeaders,
    body: {
      supplier_id: 2,
      supplier_name: 'Guntur Dal Traders',
      amount: 15750.00,
      payment_method: 'BANK_TRANSFER',
      allocations: [
        { supplier_invoice_id: 2, invoice_number: 'INV-2026-002', allocated_amount: 15750.00 }
      ]
    }
  });
  assert(discrepancyPayAttempt.status === 400 && discrepancyPayAttempt.body.code === 'THREE_WAY_MATCH_DISCREPANCY',
    'Block payment of supplier invoice with 3WM DISCREPANCY without authorized override (HTTP 400)',
    `Status: ${discrepancyPayAttempt.status}, Code: ${discrepancyPayAttempt.body.code}`
  );

  // Authorized Admin overrides discrepancy with recorded business reason
  const discrepancyOverridePay = await makeRequest({
    method: 'POST',
    path: '/api/payments/supplier-payments',
    headers: adminHeaders,
    body: {
      supplier_id: 2,
      supplier_name: 'Guntur Dal Traders',
      amount: 15750.00,
      payment_method: 'BANK_TRANSFER',
      reference_number: 'RTGS-OVERRIDE-GDT-01',
      discrepancy_override_reason: 'Emergency interstate freight rate difference verified & authorized by MD',
      allocations: [
        { supplier_invoice_id: 2, invoice_number: 'INV-2026-002', allocated_amount: 15750.00 }
      ]
    }
  });
  assert(discrepancyOverridePay.status === 201 && discrepancyOverridePay.body.data?.discrepancy_override_reason,
    'Allow authorized ADMIN/OWNER override of 3WM discrepancy with documented business reason',
    `Status: ${discrepancyOverridePay.status}`
  );

  // Supplier Payment under threshold (<= ₹50,000) auto-approved/paid
  const normalSuppPayment = await makeRequest({
    method: 'POST',
    path: '/api/payments/supplier-payments',
    headers: acctHeaders,
    body: {
      supplier_id: 1,
      supplier_name: 'Kaveri Delta Agro Millers',
      amount: 15000.00,
      payment_method: 'BANK_TRANSFER',
      reference_number: 'RTGS-KDA-15000',
      notes: 'Payment for fresh harvest raw rice'
    }
  });
  assert(normalSuppPayment.status === 201 && normalSuppPayment.body.data?.status === 'PAID',
    'Process supplier payment within approval threshold (auto-approved & status PAID)',
    `Status: ${normalSuppPayment.status}, Status: ${normalSuppPayment.body.data?.status}`
  );

  // Supplier Payment exceeding threshold (> ₹50,000) created by Accountant -> PENDING_APPROVAL
  const highValueSuppPayment = await makeRequest({
    method: 'POST',
    path: '/api/payments/supplier-payments',
    headers: acctHeaders,
    body: {
      supplier_id: 2,
      supplier_name: 'Guntur Dal Traders',
      amount: 75000.00, // > ₹50,000 threshold
      payment_method: 'BANK_TRANSFER',
      reference_number: 'RTGS-GUNTUR-75000',
      notes: 'Bulk Urad Dal procurement settlement'
    }
  });
  assert(highValueSuppPayment.status === 201 && highValueSuppPayment.body.data?.status === 'PENDING_APPROVAL',
    'Enforce approval limits: Payments > ₹50,000 default to PENDING_APPROVAL',
    `Status: ${highValueSuppPayment.status}, Status: ${highValueSuppPayment.body.data?.status}`
  );

  const pendingPaymentId = highValueSuppPayment.body.data?.id;

  // Management (Admin / Owner) approves high-value payment
  const approveRes = await makeRequest({
    method: 'POST',
    path: `/api/payments/supplier-payments/${pendingPaymentId}/approve`,
    headers: adminHeaders,
    body: { notes: 'Approved by Managing Director for procurement discount' }
  });
  assert(approveRes.status === 200 && approveRes.body.data?.status === 'PAID',
    'Admin/Owner approves high-value supplier payment voucher transitioning to PAID',
    `Status: ${approveRes.status}`
  );

  // 6. Bank Statement Import & Reconciliation (Module 3)
  console.log('\n--- STEP 6: BANK STATEMENT CSV IMPORT & RECONCILIATION ---');
  const sampleCsv = `Date,Description,Reference,Type,Amount,Balance
2026-11-23,UPI CREDIT RECEIVED-SARAVANA,UPI-BHARATPE-990011,CREDIT,3500.00,635000.00
2026-11-23,NEFT DEBIT-PACKAGING EXPENSE,NEFT-DEBIT-PKG-01,DEBIT,12000.00,623000.00`;

  const importRes = await makeRequest({
    method: 'POST',
    path: '/api/payments/accounts/1/import-statement',
    headers: acctHeaders,
    body: {
      file_name: 'HDFC_Statement_Nov2026.csv',
      csv_content: sampleCsv
    }
  });
  assert(importRes.status === 201 && importRes.body.import?.total_rows === 2,
    'Import bank statement CSV with transaction parsing and line balance computation',
    `Status: ${importRes.status}, Rows: ${importRes.body.import?.total_rows}`
  );

  // Duplicate CSV import prevention
  const dupImportRes = await makeRequest({
    method: 'POST',
    path: '/api/payments/accounts/1/import-statement',
    headers: acctHeaders,
    body: {
      file_name: 'HDFC_Statement_Nov2026.csv',
      csv_content: sampleCsv
    }
  });
  assert(dupImportRes.status === 409 && dupImportRes.body.code === 'DUPLICATE_IMPORT',
    'Prevent duplicate bank statement CSV import (HTTP 409 DUPLICATE_IMPORT)',
    `Status: ${dupImportRes.status}`
  );

  // Statement Reconciliation
  const linesRes = await makeRequest({
    method: 'GET',
    path: '/api/payments/accounts/1/statement-lines',
    headers: acctHeaders
  });
  const unreconLine = linesRes.body.data?.find(l => l.reconciliation_status === 'UNMATCHED');
  assert(Boolean(unreconLine), 'Fetch unmatched bank statement transactions');

  if (unreconLine) {
    const reconRes = await makeRequest({
      method: 'POST',
      path: '/api/payments/reconcile',
      headers: acctHeaders,
      body: {
        statement_line_id: unreconLine.id,
        payment_type: 'CUSTOMER',
        payment_id: 1,
        matched_amount: unreconLine.amount,
        notes: 'Reconciled with HDFC statement line'
      }
    });
    assert(reconRes.status === 200 && reconRes.body.statement_line?.reconciliation_status === 'MATCHED',
      'Manually reconcile statement entry with recorded payment record (Status: MATCHED)',
      `Status: ${reconRes.status}`
    );
  }

  // 7. Payment Dashboard KPIs (Module 4)
  console.log('\n--- STEP 7: PAYMENT DASHBOARD METRICS ---');
  const dashRes = await makeRequest({
    method: 'GET',
    path: '/api/payments/dashboard',
    headers: acctHeaders
  });
  assert(dashRes.status === 200 &&
    dashRes.body.data?.kpis?.total_customer_received > 0 &&
    dashRes.body.data?.kpis?.customer_outstanding >= 0 &&
    dashRes.body.data?.kpis?.supplier_outstanding >= 0,
    'Retrieve real-time payment dashboard metrics (receipts, payments, customer & supplier outstanding)',
    `Status: ${dashRes.status}, Received: ${dashRes.body.data?.kpis?.total_customer_received}`
  );

  // 8. Outstanding & Aging Reports (Module 5)
  console.log('\n--- STEP 8: AGING & OUTSTANDING REPORTS ---');
  const custAgingRes = await makeRequest({
    method: 'GET',
    path: '/api/payments/reports/customer-aging',
    headers: acctHeaders
  });
  assert(custAgingRes.status === 200 && Array.isArray(custAgingRes.body.data),
    'Generate Customer Aging Report with aging buckets (0-30, 31-60, 61-90, 90+ days)',
    `Status: ${custAgingRes.status}`
  );

  const suppAgingRes = await makeRequest({
    method: 'GET',
    path: '/api/payments/reports/supplier-aging',
    headers: acctHeaders
  });
  assert(suppAgingRes.status === 200 && Array.isArray(suppAgingRes.body.data),
    'Generate Supplier Aging Report based on procurement bill due dates',
    `Status: ${suppAgingRes.status}`
  );

  // 9. Customer & Supplier Statements (Module 6)
  console.log('\n--- STEP 9: ACCOUNT STATEMENTS ---');
  const custStmtRes = await makeRequest({
    method: 'GET',
    path: '/api/payments/customers/3/statement',
    headers: acctHeaders
  });
  assert(custStmtRes.status === 200 && Array.isArray(custStmtRes.body.data?.ledger) && custStmtRes.body.data?.closing_balance !== undefined,
    'Generate Customer Account Statement with debit/credit ledger entries and running balance',
    `Status: ${custStmtRes.status}, Balance: ${custStmtRes.body.data?.closing_balance}`
  );

  const suppStmtRes = await makeRequest({
    method: 'GET',
    path: '/api/payments/suppliers/1/statement',
    headers: acctHeaders
  });
  assert(suppStmtRes.status === 200 && Array.isArray(suppStmtRes.body.data?.ledger),
    'Generate Supplier Account Statement with bills, vouchers and running balance',
    `Status: ${suppStmtRes.status}`
  );

  // 10. Role-Based Access Control (RBAC) Enforcement (Module 9)
  console.log('\n--- STEP 10: ROLE-BASED ACCESS CONTROL (RBAC) ---');
  
  // SALESMAN blocked from recording customer payments (403)
  const salesPayAttempt = await makeRequest({
    method: 'POST',
    path: '/api/payments/customer-payments',
    headers: salesHeaders,
    body: { customer_id: 1, amount: 500, payment_method: 'CASH' }
  });
  assert(salesPayAttempt.status === 403,
    'RBAC: SALESMAN blocked from recording payments (HTTP 403 Forbidden)',
    `Status: ${salesPayAttempt.status}`
  );

  // SALESMAN authorized to view customer payments
  const salesViewAttempt = await makeRequest({
    method: 'GET',
    path: '/api/payments/customer-payments',
    headers: salesHeaders
  });
  assert(salesViewAttempt.status === 200 && Array.isArray(salesViewAttempt.body.data),
    'RBAC: SALESMAN authorized to query customer receipts (HTTP 200 OK)',
    `Status: ${salesViewAttempt.status}`
  );

  // PRODUCTION blocked from all payment operations (403)
  const prodPayAttempt = await makeRequest({
    method: 'POST',
    path: '/api/payments/supplier-payments',
    headers: prodHeaders,
    body: { supplier_id: 1, amount: 1000, payment_method: 'CASH' }
  });
  assert(prodPayAttempt.status === 403,
    'RBAC: PRODUCTION supervisor blocked from supplier payments (HTTP 403 Forbidden)',
    `Status: ${prodPayAttempt.status}`
  );

  // ACCOUNTANT blocked from approving payments exceeding approval limit (403)
  const acctApproveAttempt = await makeRequest({
    method: 'POST',
    path: `/api/payments/supplier-payments/${pendingPaymentId}/approve`,
    headers: acctHeaders,
    body: { notes: 'Accountant trying to approve high value' }
  });
  assert(acctApproveAttempt.status === 403,
    'RBAC: ACCOUNTANT blocked from approving high-value payments exceeding limit (HTTP 403)',
    `Status: ${acctApproveAttempt.status}`
  );

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passCount} PASSED | ${failCount} FAILED`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
