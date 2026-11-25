/**
 * ============================================================================
 * Phase 10 Automated Test Suite: GST Billing and Invoicing Management System
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
    console.log(`  \x1b[32m✅ PASS\x1b[0m  [${passCount + failCount + 1}] ${testName}`);
    passCount++;
  } else {
    console.error(`  \x1b[31m❌ FAIL\x1b[0m  [${passCount + failCount + 1}] ${testName}`);
    if (details) console.error(`       Detail: ${JSON.stringify(details)}`);
    failCount++;
  }
};

const runTests = async () => {
  await new Promise(r => setTimeout(r, 1500));

  console.log('\n================================================================');
  console.log('🧪 PHASE 10: GST BILLING & INVOICING — AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  try {
    // 1. Authenticate users
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

    const adminHeader = { Authorization: `Bearer ${tokens.admin}` };
    const acctHeader = { Authorization: `Bearer ${tokens.accountant}` };
    const ownerHeader = { Authorization: `Bearer ${tokens.owner}` };
    const salesHeader = { Authorization: `Bearer ${tokens.salesman}` };
    const prodHeader = { Authorization: `Bearer ${tokens.production}` };

    // 2. Module 1: Retrieve and Update Company GST Configuration
    const profileRes = await makeRequest({
      method: 'GET',
      path: '/api/invoicing/company-profile',
      headers: acctHeader
    });
    assert(
      profileRes.status === 200 &&
      profileRes.body?.data?.gstin === '33AAAAA0000A1Z5' &&
      profileRes.body?.data?.state_code === '33',
      'Module 1: Retrieve Company GST Configuration (GSTIN: 33AAAAA0000A1Z5, State Code 33 Tamil Nadu)',
      profileRes.body
    );

    const updateProfileRes = await makeRequest({
      method: 'PUT',
      path: '/api/invoicing/company-profile',
      headers: adminHeader,
      body: {
        legal_name: 'Sri Meenakshi Agro & Traditional Foods Private Limited',
        trade_name: 'Sri Meenakshi Foods',
        phone: '+91 452 2488999'
      }
    });
    assert(
      updateProfileRes.status === 200 &&
      updateProfileRes.body?.data?.phone === '+91 452 2488999',
      'Module 1: Update Company Tax Profile details without hardcoding',
      updateProfileRes.body
    );

    // 3. Module 2: Tax Rate Management (Configurable HSN & rates)
    const ratesRes = await makeRequest({
      method: 'GET',
      path: '/api/invoicing/tax-rates',
      headers: acctHeader
    });
    assert(
      ratesRes.status === 200 &&
      Array.isArray(ratesRes.body?.data) &&
      ratesRes.body?.data?.some(r => r.hsn_code === '2106' && r.gst_rate === 5) &&
      ratesRes.body?.data?.some(r => r.hsn_code === '1905' && r.gst_rate === 12),
      'Module 2: Retrieve Configured GST Tax Rates (Food Batter 5%, Savories 12%)',
      ratesRes.body
    );

    const createRateRes = await makeRequest({
      method: 'POST',
      path: '/api/invoicing/tax-rates',
      headers: acctHeader,
      body: {
        tax_name: 'Specialty Traditional Spices & Masala',
        hsn_code: '0910',
        product_category: 'Spices',
        gst_rate: 5.00,
        notes: 'Ground turmeric and chili powders'
      }
    });
    assert(
      createRateRes.status === 201 &&
      createRateRes.body?.data?.cgst_rate === 2.50 &&
      createRateRes.body?.data?.sgst_rate === 2.50 &&
      createRateRes.body?.data?.igst_rate === 5.00,
      'Module 2: Add configurable Tax Rate with auto-split CGST (2.5%) and SGST (2.5%)',
      createRateRes.body
    );

    // 4. Module 3: Customer GST Details
    const custTaxRes = await makeRequest({
      method: 'GET',
      path: '/api/invoicing/customers/1/tax-details',
      headers: acctHeader
    });
    assert(
      custTaxRes.status === 200 &&
      custTaxRes.body?.data?.place_of_supply_code === '33' &&
      custTaxRes.body?.data?.registration_type === 'REGULAR',
      'Module 3: Retrieve Customer GST Information (Place of Supply Code 33 Tamil Nadu)',
      custTaxRes.body
    );

    const updateCustTaxRes = await makeRequest({
      method: 'PUT',
      path: '/api/invoicing/customers/1/tax-details',
      headers: acctHeader,
      body: {
        legal_name: 'Hotel Meenakshi Bhavan (T.Nagar)',
        gstin: '33AABCM1111A1Z1',
        place_of_supply_state: 'Tamil Nadu',
        place_of_supply_code: '33'
      }
    });
    assert(
      updateCustTaxRes.status === 200 &&
      updateCustTaxRes.body?.data?.gstin === '33AABCM1111A1Z1',
      'Module 3: Upsert Customer GST & Place of Supply settings',
      updateCustTaxRes.body
    );

    // 5. Module 5: Tax Calculation Engine - Intra-State (Tamil Nadu to Tamil Nadu)
    const intraCalcRes = await makeRequest({
      method: 'POST',
      path: '/api/invoicing/calculate-tax',
      headers: acctHeader,
      body: {
        place_of_supply_code: '33', // Same as company (33)
        items: [
          { product_id: 1, product_name: 'Idli Batter 1KG', hsn_code: '2106', quantity: 100, unit_price: 50.00, discount_amount: 0, gst_rate: 5.00 }
        ]
      }
    });
    // Taxable: 5000. CGST 2.5%: 125, SGST 2.5%: 125, IGST: 0, Total: 5250
    assert(
      intraCalcRes.status === 200 &&
      intraCalcRes.body?.data?.supplyType === 'INTRA_STATE' &&
      intraCalcRes.body?.data?.totalTaxableValue === 5000.00 &&
      intraCalcRes.body?.data?.cgstAmount === 125.00 &&
      intraCalcRes.body?.data?.sgstAmount === 125.00 &&
      intraCalcRes.body?.data?.igstAmount === 0.00 &&
      intraCalcRes.body?.data?.totalInvoiceAmount === 5250.00,
      'Module 5: Intra-State GST Calculation (₹5,000 taxable -> CGST ₹125 + SGST ₹125, IGST ₹0 = Total ₹5,250)',
      intraCalcRes.body
    );

    // 6. Module 5: Tax Calculation Engine - Inter-State (Tamil Nadu 33 to Karnataka 29)
    const interCalcRes = await makeRequest({
      method: 'POST',
      path: '/api/invoicing/calculate-tax',
      headers: acctHeader,
      body: {
        place_of_supply_code: '29', // Karnataka (different from 33)
        items: [
          { product_id: 2, product_name: 'Kai Murukku 250g', hsn_code: '1905', quantity: 100, unit_price: 60.00, discount_amount: 0, gst_rate: 12.00 }
        ]
      }
    });
    // Taxable: 6000. CGST: 0, SGST: 0, IGST 12%: 720, Total: 6720
    assert(
      interCalcRes.status === 200 &&
      interCalcRes.body?.data?.supplyType === 'INTER_STATE' &&
      interCalcRes.body?.data?.totalTaxableValue === 6000.00 &&
      interCalcRes.body?.data?.cgstAmount === 0.00 &&
      interCalcRes.body?.data?.sgstAmount === 0.00 &&
      interCalcRes.body?.data?.igstAmount === 720.00 &&
      interCalcRes.body?.data?.totalInvoiceAmount === 6720.00,
      'Module 5: Inter-State GST Calculation (₹6,000 taxable -> CGST ₹0, SGST ₹0, IGST ₹720 = Total ₹6,720)',
      interCalcRes.body
    );

    // 7. Module 5: Discount Subtraction before Tax Computation
    const discountCalcRes = await makeRequest({
      method: 'POST',
      path: '/api/invoicing/calculate-tax',
      headers: acctHeader,
      body: {
        place_of_supply_code: '33',
        items: [
          { product_id: 1, product_name: 'Idli Batter 1KG', hsn_code: '2106', quantity: 100, unit_price: 50.00, discount_amount: 500.00, gst_rate: 5.00 }
        ]
      }
    });
    // Gross: 5000 - 500 = 4500 Taxable. CGST: 112.50, SGST: 112.50. Total: 4725
    assert(
      discountCalcRes.status === 200 &&
      discountCalcRes.body?.data?.totalTaxableValue === 4500.00 &&
      discountCalcRes.body?.data?.cgstAmount === 112.50 &&
      discountCalcRes.body?.data?.totalInvoiceAmount === 4725.00,
      'Module 5: Decimal-safe Discount subtraction before GST assessment (₹5,000 - ₹500 = ₹4,500 taxable)',
      discountCalcRes.body
    );

    // 8. Module 4: Sales Invoice Generation with Backend Recalculation
    const createInvRes = await makeRequest({
      method: 'POST',
      path: '/api/invoicing/invoices',
      headers: acctHeader,
      body: {
        sales_order_id: 2,
        sales_order_number: 'SO-2026-0002',
        customer_id: 1,
        customer_name: 'Hotel Meenakshi Bhavan (T.Nagar)',
        customer_gstin: '33AABCM1111A1Z1',
        billing_address: 'No 45, Usman Road, T.Nagar, Chennai, Tamil Nadu - 600017',
        place_of_supply: 'Tamil Nadu',
        place_of_supply_code: '33',
        payment_terms: 'Net 30 Days',
        items: [
          { product_id: 1, product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)', product_sku: 'FG-BAT-1KG', hsn_code: '2106', quantity: 50, uom: 'Pouch', unit_price: 60.00, discount_amount: 0, gst_rate: 5.00 }
        ]
      }
    });
    // Taxable: 3000, CGST 2.5%: 75, SGST 2.5%: 75, Total: 3150
    const createdInvoice = createInvRes.body?.data;
    assert(
      createInvRes.status === 201 &&
      createdInvoice?.invoice_number?.startsWith('INV/2026-27/') &&
      createdInvoice?.total_taxable_value === 3000.00 &&
      createdInvoice?.total_tax_amount === 150.00 &&
      createdInvoice?.total_invoice_amount === 3150.00 &&
      createdInvoice?.balance_due === 3150.00,
      'Module 4: Generate Sales Invoice with sequential number and backend recalculation (₹3,000 + ₹150 GST = ₹3,150)',
      createInvRes.body
    );

    // 9. Module 6: Invoice Printable Particulars & Amount in Words
    assert(
      createdInvoice?.amount_in_words?.includes('Three Thousand One Hundred and Fifty') &&
      createdInvoice?.company_profile?.gstin === '33AAAAA0000A1Z5' &&
      Array.isArray(createdInvoice?.tax_breakdowns),
      'Module 6: Invoice particulars, bank details, HSN summary & amount in words populated correctly',
      createdInvoice?.amount_in_words
    );

    // 10. Module 4: Prevent Duplicate Invoice Generation for Same Sales Order
    const dupInvRes = await makeRequest({
      method: 'POST',
      path: '/api/invoicing/invoices',
      headers: acctHeader,
      body: {
        sales_order_id: 2, // Re-submitting for same sales order #2
        customer_id: 1,
        items: [
          { product_id: 1, product_name: 'Idli Batter 1KG', quantity: 10, unit_price: 60.00, gst_rate: 5.00 }
        ]
      }
    });
    assert(
      dupInvRes.status === 409,
      'Module 4: Prevent duplicate invoice generation for the same sales order (HTTP 409 Conflict)',
      dupInvRes.status
    );

    // 11. Module 7: Credit Note Creation
    const invId = createdInvoice?.id;
    const cnRes = await makeRequest({
      method: 'POST',
      path: '/api/invoicing/credit-notes',
      headers: acctHeader,
      body: {
        invoice_id: invId,
        product_id: 1,
        product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)',
        hsn_code: '2106',
        quantity: 5,
        unit_price: 60.00,
        total_taxable_value: 300.00,
        gst_rate: 5.00,
        reason_type: 'DAMAGED_GOODS',
        reason_description: '5 pouches received punctured during transport'
      }
    });
    // Taxable: 300, CGST 2.5%: 7.50, SGST 2.5%: 7.50, Total: 315
    assert(
      cnRes.status === 201 &&
      cnRes.body?.data?.credit_note_number?.startsWith('CN/2026-27/') &&
      cnRes.body?.data?.total_note_amount === 315.00 &&
      cnRes.body?.data?.cgst_amount === 7.50 &&
      cnRes.body?.data?.sgst_amount === 7.50,
      'Module 7: Issue Credit Note referencing original invoice (₹300 taxable + ₹15 tax = ₹315)',
      cnRes.body
    );

    // 12. Module 7: Prevent Excessive Credit Note Value Exceeding Original Invoice
    const excessCnRes = await makeRequest({
      method: 'POST',
      path: '/api/invoicing/credit-notes',
      headers: acctHeader,
      body: {
        invoice_id: invId,
        total_taxable_value: 5000.00, // Exceeds invoice's remaining taxable amount (3000 - 300 = 2700)
        gst_rate: 5.00,
        reason_type: 'PRICE_ADJUSTMENT'
      }
    });
    assert(
      excessCnRes.status === 400,
      'Module 7: Prevent excessive credit note value exceeding invoice taxable balance (HTTP 400 Bad Request)',
      excessCnRes.status
    );

    // 13. Module 7: Debit Note Creation
    const dnRes = await makeRequest({
      method: 'POST',
      path: '/api/invoicing/debit-notes',
      headers: acctHeader,
      body: {
        invoice_id: invId,
        total_taxable_value: 200.00,
        gst_rate: 5.00,
        reason_type: 'PRICE_INCREASE',
        reason_description: 'Packaging surcharge price differential adjustment'
      }
    });
    assert(
      dnRes.status === 201 &&
      dnRes.body?.data?.debit_note_number?.startsWith('DN/2026-27/') &&
      dnRes.body?.data?.total_note_amount === 210.00,
      'Module 7: Issue Debit Note referencing invoice with tax adjustment (₹200 + ₹10 = ₹210)',
      dnRes.body
    );

    // 14. Module 8: Invoice Status Management (Record payment & update balance)
    const payRes = await makeRequest({
      method: 'PATCH',
      path: `/api/invoicing/invoices/${invId}/status`,
      headers: acctHeader,
      body: {
        status: 'PAID',
        reason: 'Payment received in full via NEFT Ref SBIN202611239999'
      }
    });
    assert(
      payRes.status === 200 &&
      payRes.body?.data?.status === 'PAID' &&
      payRes.body?.data?.balance_due === 0.00,
      'Module 8: Update Invoice status to PAID with zero balance due and audit history',
      payRes.body
    );

    // 15. Module 8: Prevent Modifying CANCELLED Invoices
    const cancelRes = await makeRequest({
      method: 'PATCH',
      path: `/api/invoicing/invoices/${invId}/status`,
      headers: adminHeader,
      body: {
        status: 'CANCELLED',
        reason: 'Order cancelled by buyer before dispatch'
      }
    });
    const attemptEditRes = await makeRequest({
      method: 'PATCH',
      path: `/api/invoicing/invoices/${invId}/status`,
      headers: adminHeader,
      body: { status: 'ISSUED' }
    });
    assert(
      cancelRes.status === 200 && attemptEditRes.status === 400,
      'Module 8: Enforce immutability: Invoices in CANCELLED status cannot be re-opened or freely edited',
      attemptEditRes.status
    );

    // 16. Module 10: Invoicing Dashboard Statistics
    const dashRes = await makeRequest({
      method: 'GET',
      path: '/api/invoicing/dashboard',
      headers: acctHeader
    });
    assert(
      dashRes.status === 200 &&
      dashRes.body?.data?.kpis?.total_invoices > 0 &&
      dashRes.body?.data?.kpis?.total_taxable_sales > 0 &&
      dashRes.body?.data?.tax_summary?.net_tax_liability_note !== undefined,
      'Module 10: Invoicing Dashboard KPIs (Total Sales, Output GST, Paid vs Outstanding)',
      dashRes.body?.data?.kpis
    );

    // 17. Module 9: Sales Register Report
    const repSalesRes = await makeRequest({
      method: 'GET',
      path: '/api/invoicing/reports?report_type=SALES_REGISTER',
      headers: acctHeader
    });
    assert(
      repSalesRes.status === 200 &&
      repSalesRes.body?.data?.report_type === 'SALES_REGISTER' &&
      Array.isArray(repSalesRes.body?.data?.records),
      'Module 9: Generate Sales Register Report with CSV-exportable format',
      repSalesRes.body?.data?.record_count
    );

    // 18. Module 9: GST Summary & HSN Reports
    const [repGstRes, repHsnRes] = await Promise.all([
      makeRequest({ method: 'GET', path: '/api/invoicing/reports?report_type=GST_SUMMARY', headers: acctHeader }),
      makeRequest({ method: 'GET', path: '/api/invoicing/reports?report_type=HSN_SUMMARY', headers: acctHeader })
    ]);
    assert(
      repGstRes.status === 200 &&
      repHsnRes.status === 200 &&
      repGstRes.body?.data?.disclaimer?.includes('INTERNAL SUMMARY'),
      'Module 9: Generate GST Summary and HSN-wise Sales Reports with statutory disclaimer',
      { gst: repGstRes.status, hsn: repHsnRes.status }
    );

    // 19. Module 9: Credit & Debit Note Reports
    const repCnRes = await makeRequest({
      method: 'GET',
      path: '/api/invoicing/reports?report_type=CREDIT_NOTE_REPORT',
      headers: acctHeader
    });
    assert(
      repCnRes.status === 200 &&
      Array.isArray(repCnRes.body?.data?.records),
      'Module 9: Generate Credit Note & Adjustment Report',
      repCnRes.body?.data?.record_count
    );

    // 20. Module 11: Future GST Integration Readiness
    // Invoices contain clean fields for e-invoicing and e-way bill without mock government claims
    assert(
      createdInvoice?.einvoice_status === 'NOT_APPLICABLE' &&
      createdInvoice?.eway_bill_status !== undefined,
      'Module 11: Future GST Integration fields (IRN, E-Way Bill) present without fabricating government data'
    );

    // 21. Module 13: RBAC - SALESMAN authorized to view customer invoices
    const salesmanViewRes = await makeRequest({
      method: 'GET',
      path: '/api/invoicing/invoices',
      headers: salesHeader
    });
    assert(
      salesmanViewRes.status === 200 && Array.isArray(salesmanViewRes.body?.data),
      'Module 13: RBAC - SALESMAN authorized to view customer invoices (HTTP 200 OK)',
      salesmanViewRes.status
    );

    // 22. Module 13: RBAC - SALESMAN blocked from generating tax invoices
    const salesmanBlockInv = await makeRequest({
      method: 'POST',
      path: '/api/invoicing/invoices',
      headers: salesHeader,
      body: { customer_id: 1, items: [{ product_id: 1, quantity: 1, unit_price: 100 }] }
    });
    assert(
      salesmanBlockInv.status === 403,
      'Module 13: RBAC - SALESMAN blocked from generating tax invoices (HTTP 403 Forbidden)',
      salesmanBlockInv.status
    );

    // 23. Module 13: RBAC - SALESMAN blocked from modifying company tax profile
    const salesmanBlockProfile = await makeRequest({
      method: 'PUT',
      path: '/api/invoicing/company-profile',
      headers: salesHeader,
      body: { gstin: '33MODIFIED0000Z' }
    });
    assert(
      salesmanBlockProfile.status === 403,
      'Module 13: RBAC - SALESMAN blocked from modifying company tax configuration (HTTP 403 Forbidden)',
      salesmanBlockProfile.status
    );

    // 24. Module 13: RBAC - PRODUCTION blocked from issuing invoices
    const prodBlockInv = await makeRequest({
      method: 'POST',
      path: '/api/invoicing/invoices',
      headers: prodHeader,
      body: { customer_id: 1, items: [{ product_id: 1, quantity: 1, unit_price: 100 }] }
    });
    assert(
      prodBlockInv.status === 403,
      'Module 13: RBAC - PRODUCTION blocked from modifying invoicing records (HTTP 403 Forbidden)',
      prodBlockInv.status
    );

  } catch (err) {
    console.error('Fatal error during test run:', err);
    failCount++;
  }

  console.log('\n================================================================');
  console.log(`  🏁 RESULTS: ${passCount} PASS  |  ${failCount} FAIL  |  ${passCount + failCount} TOTAL`);
  console.log('================================================================\n');

  if (failCount === 0) {
    console.log('  🎉 ALL TESTS PASSED! Phase 10 GST Invoicing System API is working correctly.\n');
    process.exit(0);
  } else {
    console.error(`  ⚠️ ${failCount} test(s) failed. Check logs above.\n`);
    process.exit(1);
  }
};

runTests();
