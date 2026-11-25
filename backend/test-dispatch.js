/**
 * ============================================================================
 * Phase 11 Automated Test Suite: Dispatch and Delivery Management System
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
  console.log('🧪 RUNNING PHASE 11: DISPATCH & DELIVERY MANAGEMENT TEST SUITE');
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
  assert(Boolean(tokens.production), 'Production supervisor login successful');
  assert(Boolean(tokens.accountant), 'Accountant login successful');
  assert(Boolean(tokens.salesman), 'Salesman login successful');

  const adminHeaders = { Authorization: `Bearer ${tokens.admin}` };
  const prodHeaders = { Authorization: `Bearer ${tokens.production}` };
  const acctHeaders = { Authorization: `Bearer ${tokens.accountant}` };
  const salesHeaders = { Authorization: `Bearer ${tokens.salesman}` };

  // 2. Transporters Master (Module 5)
  console.log('\n--- STEP 2: TRANSPORTER MANAGEMENT ---');
  const transRes = await makeRequest({
    method: 'GET',
    path: '/api/dispatch/transporters',
    headers: adminHeaders
  });
  assert(transRes.status === 200 && Array.isArray(transRes.body.data) && transRes.body.data.length >= 3,
    'Retrieve active transporters list (minimum 3 seeded partners)',
    `Status: ${transRes.status}, Count: ${transRes.body.data?.length}`
  );

  const newTrans = await makeRequest({
    method: 'POST',
    path: '/api/dispatch/transporters',
    headers: prodHeaders,
    body: {
      name: 'Vasantham Express Cargo & Cold Logistics',
      contact_person: 'S. Shanmugam',
      phone: '+91 98425 55555',
      email: 'ops@vasanthamcargo.in',
      gstin: '33AABCV5555J1Z4',
      address: 'Industrial Estate, Madurai - 625020',
      transport_mode: 'ROAD',
      vehicle_number: 'TN-58-DD-7788',
      driver_name: 'P. Ramanathan',
      driver_phone: '+91 98425 11223'
    }
  });
  assert(newTrans.status === 201 && newTrans.body.data?.code,
    'Create new transporter partner with driver & vehicle credentials',
    `Status: ${newTrans.status}`
  );

  // 3. Finished Goods Verification & QC Gate (Module 2)
  console.log('\n--- STEP 3: FINISHED GOODS STOCK & QUALITY CONTROL VERIFICATION ---');
  const validBatchCheck = await makeRequest({
    method: 'POST',
    path: '/api/dispatch/verify-batch',
    headers: prodHeaders,
    body: { product_id: 1, batch_number: 'FG-BAT-260320-A', quantity: 20 }
  });
  assert(validBatchCheck.status === 200 && validBatchCheck.body.data?.verified === true,
    'Verify approved & released Finished Goods batch (PASS)',
    `Status: ${validBatchCheck.status}`
  );

  const failedBatchCheck = await makeRequest({
    method: 'POST',
    path: '/api/dispatch/verify-batch',
    headers: prodHeaders,
    body: { product_id: 1, batch_number: 'FG-BAT-FAILED-01', quantity: 10 }
  });
  assert(failedBatchCheck.status === 400 && (failedBatchCheck.body.code === 'QC_FAILED' || failedBatchCheck.body.code === 'QC_RESTRICTED'),
    'Block dispatch of QC rejected batch (HTTP 400)',
    `Status: ${failedBatchCheck.status}, Code: ${failedBatchCheck.body.code}`
  );

  const expiredBatchCheck = await makeRequest({
    method: 'POST',
    path: '/api/dispatch/verify-batch',
    headers: prodHeaders,
    body: { product_id: 1, batch_number: 'FG-BAT-EXPIRED-01', quantity: 10 }
  });
  assert(expiredBatchCheck.status === 400 && expiredBatchCheck.body.code === 'BATCH_EXPIRED',
    'Block dispatch of expired batch (HTTP 400)',
    `Status: ${expiredBatchCheck.status}, Code: ${expiredBatchCheck.body.code}`
  );

  // 4. Dispatch Orders & Over-dispatch Prevention (Module 1)
  console.log('\n--- STEP 4: DISPATCH ORDER MANAGEMENT & VALIDATION ---');
  
  // Attempt Over-dispatch (> remaining sales order qty)
  const overDispatchAttempt = await makeRequest({
    method: 'POST',
    path: '/api/dispatch/orders',
    headers: prodHeaders,
    body: {
      sales_order_id: 1,
      customer_id: 1,
      items: [
        {
          product_id: 1,
          ordered_quantity: 50,
          previously_dispatched_quantity: 40,
          dispatch_quantity: 25 // Remaining is only 10!
        }
      ]
    }
  });
  assert(overDispatchAttempt.status === 400 && overDispatchAttempt.body.code === 'OVER_DISPATCH',
    'Prevent over-dispatching exceeding remaining sales order quantity (HTTP 400 OVER_DISPATCH)',
    `Status: ${overDispatchAttempt.status}, Code: ${overDispatchAttempt.body.code}`
  );

  // Create valid Dispatch Order with Partial Dispatch support
  const createDoRes = await makeRequest({
    method: 'POST',
    path: '/api/dispatch/orders',
    headers: prodHeaders,
    body: {
      sales_order_id: 2,
      sales_order_number: 'SO-2026-0002',
      customer_id: 2,
      customer_name: 'Ananda Traditional Supermarket (Madurai)',
      delivery_address: '12 West Masi Street, Madurai, Tamil Nadu - 625001',
      expected_delivery_date: '2026-11-25',
      dispatch_priority: 'HIGH',
      transporter_id: 1,
      special_instructions: 'Keep chilled in insulated thermal cartons at 4°C',
      items: [
        {
          product_id: 1,
          product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)',
          product_sku: 'FG-BAT-1KG',
          ordered_quantity: 100,
          previously_dispatched_quantity: 0,
          dispatch_quantity: 50, // Partial dispatch (50 out of 100)
          uom: 'PKT',
          batch_number: 'FG-BAT-260320-A',
          expiry_date: '2026-12-30'
        }
      ]
    }
  });
  assert(createDoRes.status === 201 && createDoRes.body.data?.dispatch_order_number,
    'Create dispatch order supporting partial dispatch (50 of 100 PKT)',
    `Status: ${createDoRes.status}, Order: ${createDoRes.body.data?.dispatch_order_number}`
  );

  const createdDoId = createDoRes.body.data?.id;

  // Retrieve single dispatch order with sub-records
  const getDoRes = await makeRequest({
    method: 'GET',
    path: `/api/dispatch/orders/${createdDoId}`,
    headers: adminHeaders
  });
  assert(getDoRes.status === 200 && getDoRes.body.data?.items?.length === 1 && getDoRes.body.data?.items[0].remaining_quantity === 50,
    'Fetch dispatch order detail with computed remaining order balance (50 PKT remaining)',
    `Status: ${getDoRes.status}, Remaining: ${getDoRes.body.data?.items[0]?.remaining_quantity}`
  );

  // 5. Packing Management (Module 3)
  console.log('\n--- STEP 5: PACKING SLIP & SECONDARY PACKAGING ---');
  const packingRes = await makeRequest({
    method: 'POST',
    path: '/api/dispatch/packing',
    headers: prodHeaders,
    body: {
      dispatch_order_id: createdDoId,
      total_cartons: 5,
      total_gross_weight_kg: 52.5,
      total_net_weight_kg: 50.0,
      packing_remarks: 'Packed in corrugated 5-ply cartons with ice gel packs',
      items: [
        {
          product_id: 1,
          product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)',
          carton_number: 'CTN-01 to CTN-05',
          packed_quantity: 50,
          packets_per_carton: 10,
          gross_weight_kg: 1.05,
          net_weight_kg: 1.0,
          uom: 'PKT'
        }
      ]
    }
  });
  assert(packingRes.status === 201 && packingRes.body.data?.packing_slip_number?.startsWith('PKG-'),
    'Generate sequential packing slip (PKG-YYYY-XXXX) and set status to PACKED',
    `Status: ${packingRes.status}, Slip: ${packingRes.body.data?.packing_slip_number}`
  );

  // 6. Delivery Challan Generation (Module 4)
  console.log('\n--- STEP 6: DELIVERY CHALLAN (DC) GENERATION ---');
  const challanRes = await makeRequest({
    method: 'POST',
    path: '/api/dispatch/challans',
    headers: prodHeaders,
    body: {
      dispatch_order_id: createdDoId,
      transporter_name: 'Kaveri Cold Logistics Private Limited',
      vehicle_number: 'TN-59-AB-1234',
      driver_name: 'M. Murugan',
      driver_phone: '+91 98421 12345',
      lr_number: 'LR-KVR-8821',
      authorized_signatory: 'Warehouse & Dispatch Lead'
    }
  });
  assert(challanRes.status === 201 && challanRes.body.data?.challan_number?.startsWith('DC/'),
    'Generate Delivery Challan (DC/YYYY-YY/XXXX) distinct from tax invoice',
    `Status: ${challanRes.status}, DC: ${challanRes.body.data?.challan_number}`
  );

  const challanId = challanRes.body.data?.id;

  // Prevent duplicate delivery challan
  const dupChallan = await makeRequest({
    method: 'POST',
    path: '/api/dispatch/challans',
    headers: prodHeaders,
    body: { dispatch_order_id: createdDoId }
  });
  assert(dupChallan.status === 201 && dupChallan.body.data?.id === challanId,
    'Prevent duplicate Delivery Challan for the same dispatch order',
    `Status: ${dupChallan.status}, ID: ${dupChallan.body.data?.id}`
  );

  // 7. Shipment Status Tracking & Inventory Integration (Module 6 & 9)
  console.log('\n--- STEP 7: SHIPMENT TRACKING & ATOMIC INVENTORY DEDUCTION ---');
  const dispatchStatusRes = await makeRequest({
    method: 'PUT',
    path: `/api/dispatch/orders/${createdDoId}/status`,
    headers: prodHeaders,
    body: {
      status: 'DISPATCHED',
      location: 'Madurai Central Dispatch Gate 2',
      remarks: 'Loaded onto refrigerated truck TN-59-AB-1234'
    }
  });
  assert(dispatchStatusRes.status === 200 && dispatchStatusRes.body.data?.inventory_deducted === true,
    'Atomic inventory deduction triggered upon transitioning to DISPATCHED',
    `Status: ${dispatchStatusRes.status}, Deducted: ${dispatchStatusRes.body.data?.inventory_deducted}`
  );

  // In-transit tracking updates
  const inTransitRes = await makeRequest({
    method: 'PUT',
    path: `/api/dispatch/orders/${createdDoId}/status`,
    headers: prodHeaders,
    body: {
      status: 'IN_TRANSIT',
      location: 'NH-44 Toll Plaza (Madurai-Dindigul)',
      remarks: 'In transit under 4°C cold chain'
    }
  });
  assert(inTransitRes.status === 200 && inTransitRes.body.data?.status === 'IN_TRANSIT',
    'Update shipment tracking to IN_TRANSIT with live waypoint location',
    `Status: ${inTransitRes.status}`
  );

  // 8. Proof of Delivery (POD) (Module 7)
  console.log('\n--- STEP 8: PROOF OF DELIVERY (POD) ---');
  const podRes = await makeRequest({
    method: 'POST',
    path: '/api/dispatch/pod',
    headers: prodHeaders,
    body: {
      dispatch_order_id: createdDoId,
      delivered_quantity: 50,
      receiver_name: 'K. Venkatesh',
      receiver_phone: '+91 98422 33445',
      receiver_designation: 'Inventory Receiving Head',
      acknowledgement_type: 'SIGNATURE_AND_STAMP',
      delivery_remarks: 'All 5 cartons received intact and cold temperature verified at 4.2°C'
    }
  });
  assert(podRes.status === 201 && podRes.body.data?.dispatch_order_status === 'DELIVERED' && podRes.body.data?.total_delivered === 50,
    'Record POD with receiver acknowledgement, stamp & mark DELIVERED',
    `Status: ${podRes.status}, Delivered: ${podRes.body.data?.total_delivered}`
  );

  // 9. Customer Returns & Damaged Goods Quarantined (Module 8)
  console.log('\n--- STEP 9: CUSTOMER RETURNS & QUARANTINE INSPECTION ---');
  const returnRes = await makeRequest({
    method: 'POST',
    path: '/api/dispatch/returns',
    headers: acctHeaders,
    body: {
      dispatch_order_id: createdDoId,
      return_reason: 'TRANSIT_DAMAGE',
      reason_description: 'Outer seal punctured during transit rough handling',
      total_returned_quantity: 2,
      total_damaged_quantity: 2,
      items: [
        {
          product_id: 1,
          product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)',
          batch_number: 'FG-BAT-260320-A',
          returned_quantity: 2,
          damaged_quantity: 2,
          unit_price: 60.00
        }
      ]
    }
  });
  assert(returnRes.status === 201 && returnRes.body.data?.inspection_status === 'QUARANTINED' && returnRes.body.data?.restocked_to_inventory === false,
    'Customer return logged as QUARANTINED and NOT restocked directly to usable inventory',
    `Status: ${returnRes.status}, Inspection: ${returnRes.body.data?.inspection_status}, Restocked: ${returnRes.body.data?.restocked_to_inventory}`
  );

  // 10. Dispatch Dashboard Statistics (Module 10)
  console.log('\n--- STEP 10: DISPATCH DASHBOARD KPIS ---');
  const statsRes = await makeRequest({
    method: 'GET',
    path: '/api/dispatch/dashboard-stats',
    headers: adminHeaders
  });
  assert(statsRes.status === 200 && statsRes.body.data?.kpis?.total_dispatch_orders >= 2 && statsRes.body.data?.kpis?.delivered_shipments >= 1,
    'Retrieve real-time dispatch dashboard KPIs and status distribution',
    `Status: ${statsRes.status}, Orders: ${statsRes.body.data?.kpis?.total_dispatch_orders}`
  );

  // 11. Dispatch Reports (Module 11)
  console.log('\n--- STEP 11: DISPATCH REPORTS (10 FORMATS) ---');
  const reportTypes = [
    'DAILY_DISPATCH',
    'MONTHLY_DISPATCH',
    'CUSTOMER_WISE',
    'PRODUCT_WISE',
    'BATCH_WISE',
    'TRANSPORTER_PERFORMANCE',
    'DELIVERY_DELAY',
    'RETURNED_GOODS',
    'DELIVERY_COMPLETION',
    'OUTSTANDING_DELIVERY'
  ];

  let passedReports = 0;
  for (const rType of reportTypes) {
    const repRes = await makeRequest({
      method: 'GET',
      path: `/api/dispatch/reports?type=${rType}`,
      headers: adminHeaders
    });
    if (repRes.status === 200 && repRes.body.data?.records !== undefined) {
      passedReports++;
    }
  }
  assert(passedReports === 10,
    'All 10 required Dispatch & Delivery Reports generated successfully',
    `Passed ${passedReports} of 10 reports`
  );

  // 12. Role-Based Access Control (RBAC) Enforcement (Module 13)
  console.log('\n--- STEP 12: ROLE-BASED ACCESS CONTROL (RBAC) ---');
  
  // SALESMAN blocked from creating dispatch orders
  const salesCreateAttempt = await makeRequest({
    method: 'POST',
    path: '/api/dispatch/orders',
    headers: salesHeaders,
    body: { sales_order_id: 1, customer_id: 1, items: [{ product_id: 1, dispatch_quantity: 5 }] }
  });
  assert(salesCreateAttempt.status === 403,
    'RBAC: SALESMAN blocked from creating dispatch orders (HTTP 403)',
    `Status: ${salesCreateAttempt.status}`
  );

  // SALESMAN allowed to view dispatch orders and reports
  const salesViewAttempt = await makeRequest({
    method: 'GET',
    path: '/api/dispatch/orders',
    headers: salesHeaders
  });
  assert(salesViewAttempt.status === 200 && Array.isArray(salesViewAttempt.body.data),
    'RBAC: SALESMAN authorized to view dispatch orders list (HTTP 200)',
    `Status: ${salesViewAttempt.status}`
  );

  // PRODUCTION blocked from creating customer returns
  const prodReturnAttempt = await makeRequest({
    method: 'POST',
    path: '/api/dispatch/returns',
    headers: prodHeaders,
    body: { dispatch_order_id: createdDoId, total_returned_quantity: 1 }
  });
  assert(prodReturnAttempt.status === 403,
    'RBAC: PRODUCTION blocked from modifying customer returns (HTTP 403)',
    `Status: ${prodReturnAttempt.status}`
  );

  // ACCOUNTANT allowed to create customer returns
  const acctReturnAttempt = await makeRequest({
    method: 'POST',
    path: '/api/dispatch/returns',
    headers: acctHeaders,
    body: {
      dispatch_order_id: createdDoId,
      return_reason: 'CUSTOMER_REJECTION',
      reason_description: 'Over-ordered by customer store',
      total_returned_quantity: 1,
      items: [{ product_id: 1, returned_quantity: 1 }]
    }
  });
  assert(acctReturnAttempt.status === 201,
    'RBAC: ACCOUNTANT authorized to process customer returns (HTTP 201)',
    `Status: ${acctReturnAttempt.status}`
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
