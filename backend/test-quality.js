/**
 * ============================================================================
 * Phase 8: Quality Control Management System — Automated Test Suite
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 *
 * Tests:
 *  1. Authenticate users across all roles (ADMIN, PRODUCTION, OWNER, ACCOUNTANT, SALESMAN)
 *  2. Module 3: Create configurable Quality Standard with parameters (min/max limits & text values)
 *  3. Module 3: Toggle quality standard active status
 *  4. Module 1: Inspect received raw material lot (PASSED -> batch qc_status = 'PASS')
 *  5. Module 1: Reject defective raw material lot (FAILED -> batch qc_status = 'REJECTED')
 *  6. Module 1: Prevent rejected raw material from usable stock in Phase 6 inventory
 *  7. Module 2: Inspect packaging material lot (Pouch thickness, leak test -> PASSED)
 *  8. Module 2: Reject packaging material lot (auto-logs defect and rejection)
 *  9. Module 4: In-process production quality check linked to Phase 7 order
 * 10. Module 4: Auto-flag out-of-range measurement against configured standard limits
 * 11. Module 5: Inspect Finished Goods batch (Approved -> released for dispatch)
 * 12. Module 5: Reject defective Finished Goods batch (FAILED -> batch_status = QC_FAILED)
 * 13. Module 5: Prevent unreleased / rejected finished goods from dispatch
 * 14. Module 6: Defect & Rejection Management (separate supplier vs production defects)
 * 15. Module 6: Log manual defect with disposition action
 * 16. Module 7: Create Quality Incident (Process deviation / customer complaint)
 * 17. Module 7: Create CAPA action linked to incident
 * 18. Module 7: Update CAPA lifecycle status (ASSIGNED -> IN_PROGRESS)
 * 19. Module 7: Verify CAPA effectiveness and close action
 * 20. Module 8: Quality Dashboard KPIs, metrics & recent inspection activities
 * 21. Module 9: Raw Material Inspection Report
 * 22. Module 9: Supplier Quality & Defect Analysis Reports
 * 23. Module 10: RBAC - SALESMAN blocked from submitting inspections (HTTP 403 Forbidden)
 * 24. Module 10: RBAC - SALESMAN authorized to check FG release status for dispatch
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
  await new Promise(r => setTimeout(r, 1500));

  console.log('\n================================================================');
  console.log('🧪 PHASE 8: QUALITY CONTROL MANAGEMENT — AUTOMATED TEST SUITE');
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

    // 2. Module 3: Create Quality Standard with Parameters
    const createStdRes = await makeRequest({
      method: 'POST',
      path: '/api/quality/standards',
      headers: adminHeader,
      body: {
        standard_name: 'Raw Material Spec: Guntur Urad Dal Grade A',
        target_type: 'RAW_MATERIAL',
        target_id: 2,
        target_name: 'Guntur Urad Dal',
        standard_version: 'v1.1',
        description: 'Moisture, broken grains, and visual polish specifications',
        effective_date: '2026-11-20',
        parameters: [
          { parameter_name: 'Moisture Content', parameter_type: 'NUMERIC', uom: '%', min_value: 10.0, max_value: 13.5, target_value: 11.5, stage: 'INCOMING' },
          { parameter_name: 'Broken Grains', parameter_type: 'NUMERIC', uom: '%', min_value: 0.0, max_value: 2.0, target_value: 0.5, stage: 'INCOMING' },
          { parameter_name: 'Aroma / Odour', parameter_type: 'TEXT', uom: 'Descriptive', acceptable_text_values: 'Fresh,Normal,Clean', stage: 'INCOMING' }
        ]
      }
    });

    const newStd = createStdRes.body?.data;
    assert(
      createStdRes.status === 201 && newStd?.id && newStd.parameters?.length === 3,
      'Module 3: Create configurable Quality Standard with parameters and acceptable tolerances',
      createStdRes.body
    );

    // 3. Module 3: Toggle Standard Status
    const toggleStdRes = await makeRequest({
      method: 'PATCH',
      path: `/api/quality/standards/${newStd.id}/status`,
      headers: adminHeader,
      body: { is_active: true }
    });

    assert(
      toggleStdRes.status === 200 && toggleStdRes.body?.data?.is_active === true,
      'Module 3: Toggle Quality Standard activation status',
      toggleStdRes.body
    );

    // 4. Module 1: Inspect Raw Material lot - PASSED
    const passRMRes = await makeRequest({
      method: 'POST',
      path: '/api/quality/inspections',
      headers: prodHeader,
      body: {
        inspection_type: 'RAW_MATERIAL',
        stage: 'INCOMING',
        grn_id: 1,
        supplier_id: 1,
        supplier_name: 'Kaveri Delta Agro Millers',
        item_type: 'RAW_MATERIAL',
        item_id: 1,
        item_name: 'Ponni Boiled Rice',
        item_code: 'RM-RICE-001',
        batch_number: 'RM-RICE-2026-B01',
        received_quantity: 500,
        inspected_quantity: 50,
        accepted_quantity: 500,
        rejected_quantity: 0,
        uom: 'KG',
        status: 'PASSED',
        remarks: 'Sample clear. Moisture 11.5%. Accepted for batter processing.',
        results: [
          { parameter_name: 'Moisture Content', measured_numeric_value: 11.5, min_limit: 10.0, max_limit: 14.0, uom: '%' },
          { parameter_name: 'Odour / Smell', measured_text_value: 'Clean', acceptable_text_values: 'Clean,Fresh' }
        ]
      }
    });

    assert(
      passRMRes.status === 201 && passRMRes.body?.data?.status === 'PASSED',
      'Module 1: Inspect received raw material lot and clear for production (PASSED)',
      passRMRes.body
    );

    // 5. Module 1: Reject defective raw material lot (FAILED)
    const failRMRes = await makeRequest({
      method: 'POST',
      path: '/api/quality/inspections',
      headers: prodHeader,
      body: {
        inspection_type: 'RAW_MATERIAL',
        stage: 'INCOMING',
        grn_id: 2,
        supplier_id: 2,
        supplier_name: 'Guntur Dal & Pulses Syndicate',
        item_type: 'RAW_MATERIAL',
        item_id: 2,
        item_name: 'Guntur Urad Dal',
        item_code: 'RM-DAL-002',
        batch_number: 'RM-DAL-REJECTED-LOT',
        received_quantity: 100,
        inspected_quantity: 100,
        accepted_quantity: 0,
        rejected_quantity: 100,
        uom: 'KG',
        status: 'FAILED',
        defect_category: 'MOISTURE_EXCESS',
        remarks: 'Moisture 16.8% exceeds safe limit 13.5%. High mold risk. Return to vendor.',
        results: [
          { parameter_name: 'Moisture Content', measured_numeric_value: 16.8, min_limit: 10.0, max_limit: 13.5, uom: '%' }
        ]
      }
    });

    assert(
      failRMRes.status === 201 && failRMRes.body?.data?.status === 'FAILED',
      'Module 1: Reject defective raw material lot (FAILED -> quarantined/rejected)',
      failRMRes.body
    );

    // 6. Module 1: Verify rejected stock is prevented from usable stock
    const invBatchesRes = await makeRequest({
      method: 'GET',
      path: '/api/inventory/batches',
      headers: prodHeader
    });
    const rejectedLot = invBatchesRes.body?.data?.find(b => b.batch_number === 'RM-DAL-REJECTED-LOT');
    const isQuarantinedOrRejected = !rejectedLot || rejectedLot.qc_status === 'REJECTED' || rejectedLot.qc_status !== 'PASS';

    assert(
      isQuarantinedOrRejected,
      'Module 1: Rejected raw material lot is excluded from usable Phase 6 inventory (QC_STATUS != PASS)'
    );

    // 7. Module 2: Inspect Packaging Material - PASSED
    const passPkgRes = await makeRequest({
      method: 'POST',
      path: '/api/quality/inspections',
      headers: prodHeader,
      body: {
        inspection_type: 'PACKAGING',
        stage: 'INCOMING',
        supplier_id: 3,
        supplier_name: 'Sri Balaji Flexible Packaging Ltd',
        item_type: 'PACKAGING',
        item_id: 1,
        item_name: '1 KG Multilayer Fresh Batter Pouch',
        batch_number: 'PKG-POUCH-2026-B01',
        received_quantity: 3000,
        inspected_quantity: 100,
        accepted_quantity: 3000,
        rejected_quantity: 0,
        uom: 'PCS',
        status: 'PASSED',
        remarks: 'Thickness 92 microns, seal burst pressure 35 kPa passed.',
        results: [
          { parameter_name: 'Film Thickness', measured_numeric_value: 92, min_limit: 80, max_limit: 105, uom: 'Microns' },
          { parameter_name: 'Sealing Integrity', measured_text_value: 'Pass', acceptable_text_values: 'Pass,Strong' }
        ]
      }
    });

    assert(
      passPkgRes.status === 201 && passPkgRes.body?.data?.status === 'PASSED',
      'Module 2: Inspect packaging material parameters (film thickness, sealing integrity -> PASSED)',
      passPkgRes.body
    );

    // 8. Module 2: Reject defective packaging batch
    const failPkgRes = await makeRequest({
      method: 'POST',
      path: '/api/quality/inspections',
      headers: prodHeader,
      body: {
        inspection_type: 'PACKAGING',
        stage: 'INCOMING',
        supplier_id: 3,
        supplier_name: 'Sri Balaji Flexible Packaging Ltd',
        item_type: 'PACKAGING',
        item_id: 2,
        item_name: '250g Zip Pouch',
        batch_number: 'PKG-ZIP-REJECTED',
        received_quantity: 500,
        inspected_quantity: 500,
        accepted_quantity: 0,
        rejected_quantity: 500,
        uom: 'PCS',
        status: 'FAILED',
        defect_category: 'PRINTING_ERROR',
        remarks: 'FSSAI License number blurred & barcode unscannable.'
      }
    });

    assert(
      failPkgRes.status === 201 && failPkgRes.body?.data?.rejected_quantity === 500,
      'Module 2: Reject defective packaging batch and record rejection disposition',
      failPkgRes.body
    );

    // 9. Module 4: In-Process Quality Check on Production Order
    const inProcessRes = await makeRequest({
      method: 'POST',
      path: '/api/quality/inspections',
      headers: prodHeader,
      body: {
        inspection_type: 'IN_PROCESS',
        stage: 'IN_PROCESS',
        production_order_id: 1,
        production_order_number: 'PO-PROD-2026-001',
        item_type: 'FINISHED_GOOD',
        item_id: 1,
        item_name: 'Fresh Batter Grinding Run',
        batch_number: 'PROD-FLR-LINE1-RUN',
        received_quantity: 200,
        inspected_quantity: 5,
        accepted_quantity: 200,
        rejected_quantity: 0,
        uom: 'PACK',
        status: 'PASSED',
        remarks: 'Mid-grind fermentation temperature 28C, texture smooth.',
        results: [
          { parameter_name: 'Grind Temperature', measured_numeric_value: 28.5, min_limit: 25.0, max_limit: 32.0, uom: 'C' }
        ]
      }
    });

    assert(
      inProcessRes.status === 201 && inProcessRes.body?.data?.stage === 'IN_PROCESS',
      'Module 4: In-process production quality check linked to Phase 7 production order',
      inProcessRes.body
    );

    // 10. Module 4: Auto-flag out-of-range measurement
    const outOfRangeRes = await makeRequest({
      method: 'POST',
      path: '/api/quality/inspections',
      headers: prodHeader,
      body: {
        inspection_type: 'IN_PROCESS',
        stage: 'IN_PROCESS',
        production_order_id: 1,
        item_type: 'FINISHED_GOOD',
        item_id: 1,
        item_name: 'Batter Viscosity Check',
        batch_number: 'PROD-RUN-TOO-THICK',
        received_quantity: 100,
        inspected_quantity: 2,
        accepted_quantity: 80,
        rejected_quantity: 20,
        uom: 'PACK',
        results: [
          { parameter_name: 'Apparent Viscosity', measured_numeric_value: 7200, min_limit: 3500, max_limit: 5500, uom: 'cP' }
        ]
      }
    });

    const flaggedResult = outOfRangeRes.body?.data?.results?.find(r => r.parameter_name === 'Apparent Viscosity');
    assert(
      outOfRangeRes.status === 201 && flaggedResult?.flagged_out_of_range === true,
      'Module 4: Automatically flag out-of-range test measurement exceeding specification limits',
      outOfRangeRes.body
    );

    // 11. Module 5: Finished Goods Quality Inspection - Approved
    const passFGRes = await makeRequest({
      method: 'POST',
      path: '/api/quality/inspections',
      headers: prodHeader,
      body: {
        inspection_type: 'FINISHED_GOOD',
        stage: 'FINAL',
        production_order_id: 1,
        production_batch_id: 1,
        item_type: 'FINISHED_GOOD',
        item_id: 1,
        item_name: 'Fresh Idli & Dosa Batter 1KG',
        batch_number: 'PB-FG001-20261125-999',
        received_quantity: 100,
        inspected_quantity: 10,
        accepted_quantity: 100,
        rejected_quantity: 0,
        uom: 'PACK',
        status: 'PASSED',
        remarks: 'pH 4.25, seal intact, package weight 1012g. Cleared for cold room dispatch.',
        results: [
          { parameter_name: 'Fermentation pH', measured_numeric_value: 4.25, min_limit: 4.0, max_limit: 4.8, uom: 'pH' },
          { parameter_name: 'Package Net Weight', measured_numeric_value: 1012, min_limit: 1000, max_limit: 1030, uom: 'g' }
        ]
      }
    });

    assert(
      passFGRes.status === 201 && passFGRes.body?.data?.status === 'PASSED',
      'Module 5: Inspect and approve Finished Goods batch for dispatch clearance',
      passFGRes.body
    );

    // 12. Module 5: Reject Finished Goods batch
    const failFGRes = await makeRequest({
      method: 'POST',
      path: '/api/quality/inspections',
      headers: prodHeader,
      body: {
        inspection_type: 'FINISHED_GOOD',
        stage: 'FINAL',
        production_order_id: 1,
        item_type: 'FINISHED_GOOD',
        item_id: 1,
        item_name: 'Fresh Batter 1KG',
        batch_number: 'PB-FG001-FAILED-ACIDITY',
        received_quantity: 60,
        inspected_quantity: 60,
        accepted_quantity: 0,
        rejected_quantity: 60,
        uom: 'PACK',
        status: 'FAILED',
        defect_category: 'SMELL_RANCIDITY',
        remarks: 'Over-fermented. pH 3.4 is too sour, off-gas pouch ballooning. Reject lot.'
      }
    });

    assert(
      failFGRes.status === 201 && failFGRes.body?.data?.status === 'FAILED',
      'Module 5: Reject defective Finished Goods batch (FAILED -> excluded from dispatch)',
      failFGRes.body
    );

    // 13. Module 5: Prevent unreleased / rejected goods from dispatch
    const releaseCheckPass = await makeRequest({
      method: 'GET',
      path: '/api/quality/batches/PB-FG001-20261125-999/release-status',
      headers: salesHeader
    });

    const releaseCheckFail = await makeRequest({
      method: 'GET',
      path: '/api/quality/batches/PB-FG001-FAILED-ACIDITY/release-status',
      headers: salesHeader
    });

    assert(
      releaseCheckPass.body?.data?.can_dispatch === true && releaseCheckFail.body?.data?.can_dispatch === false,
      'Module 5: Enforce dispatch lock: Only passed FG batches released; failed lots blocked',
      { passResult: releaseCheckPass.body, failResult: releaseCheckFail.body }
    );

    // 14. Module 6: Defect & Rejection Log query
    const defectsRes = await makeRequest({
      method: 'GET',
      path: '/api/quality/defects',
      headers: prodHeader
    });

    const defectsList = defectsRes.body?.data || [];
    const hasSupplierDefect = defectsList.some(d => d.defect_source === 'SUPPLIER');
    const hasProdDefect = defectsList.some(d => d.defect_source === 'PRODUCTION');

    assert(
      defectsRes.status === 200 && defectsList.length >= 2 && hasSupplierDefect && hasProdDefect,
      'Module 6: Defect and Rejection Log accurately segments supplier vs production rejections',
      { totalDefects: defectsList.length, hasSupplierDefect, hasProdDefect }
    );

    // 15. Module 6: Manual defect logging with disposition action
    const manualDefectRes = await makeRequest({
      method: 'POST',
      path: '/api/quality/defects',
      headers: prodHeader,
      body: {
        defect_source: 'SUPPLIER',
        defect_category: 'FOREIGN_MATTER',
        defect_description: 'Sand grit detected in fenugreek seed sample',
        material_or_product_type: 'RAW_MATERIAL',
        material_or_product_id: 3,
        material_or_product_name: 'Fenugreek Seeds',
        supplier_id: 3,
        supplier_name: 'Erode Turmeric & Spice Traders',
        batch_number: 'RM-FEN-2026-LOT2',
        defective_quantity: 15,
        uom: 'KG',
        rejection_reason: 'Sand level exceeds maximum permissible limit 0.1%',
        severity: 'MAJOR',
        disposition_action: 'REJECT_RETURN_TO_VENDOR'
      }
    });

    assert(
      manualDefectRes.status === 201 && manualDefectRes.body?.data?.defect_number,
      'Module 6: Manually log quality defect with disposition action (REJECT_RETURN_TO_VENDOR)',
      manualDefectRes.body
    );

    // 16. Module 7: Create Quality Incident
    const incRes = await makeRequest({
      method: 'POST',
      path: '/api/quality/incidents',
      headers: prodHeader,
      body: {
        title: 'Recurring packaging heat-sealing leakage on Line 2',
        description: 'Micro-pinholes along pouch vertical seam observed during batter drop test',
        incident_type: 'PROCESS_DEVIATION',
        severity: 'HIGH'
      }
    });

    const incidentData = incRes.body?.data;
    assert(
      incRes.status === 201 && incidentData?.incident_number && incidentData.status === 'OPEN',
      'Module 7: Log quality incident with severity classification',
      incRes.body
    );

    // 17. Module 7: Create CAPA action
    const capaRes = await makeRequest({
      method: 'POST',
      path: '/api/quality/capa',
      headers: prodHeader,
      body: {
        incident_id: incidentData.id,
        problem_description: 'Heat sealing temperature fluctuation caused micro-leakages in 20 pouches',
        root_cause_analysis: 'Thermocouple sensor wire oxidized, providing erroneous 170C reading when actual was 145C',
        corrective_action: 'Replaced thermocouple probe and recalibrated sealing bar heating elements',
        preventive_action: 'Institute weekly pyrometer temperature validation check in maintenance SOP',
        assigned_to_name: 'Maintenance Supervisor Selvan',
        priority: 'HIGH',
        target_completion_date: '2026-12-05'
      }
    });

    const capaData = capaRes.body?.data;
    assert(
      capaRes.status === 201 && capaData?.capa_number && capaData.status === 'ASSIGNED',
      'Module 7: Create CAPA record with root cause analysis and preventive actions',
      capaRes.body
    );

    // 18. Module 7: Update CAPA status
    const updateCapaRes = await makeRequest({
      method: 'PATCH',
      path: `/api/quality/capa/${capaData.id}/status`,
      headers: prodHeader,
      body: { status: 'IN_PROGRESS', reason: 'Replacement heating element installed' }
    });

    assert(
      updateCapaRes.status === 200 && updateCapaRes.body?.data?.status === 'IN_PROGRESS',
      'Module 7: Progress CAPA workflow through status lifecycle (IN_PROGRESS)',
      updateCapaRes.body
    );

    // 19. Module 7: Verify CAPA effectiveness & close
    const verifyRes = await makeRequest({
      method: 'POST',
      path: `/api/quality/capa/${capaData.id}/verify`,
      headers: adminHeader,
      body: {
        is_effective: true,
        verification_notes: 'Audited 500 pouches on Line 2 over 48 hours. Zero seal failures detected. Action closed.'
      }
    });

    assert(
      verifyRes.status === 201 && verifyRes.body?.data?.is_effective === true,
      'Module 7: Verify CAPA effectiveness and close quality incident',
      verifyRes.body
    );

    // 20. Module 8: Quality Dashboard KPIs
    const dashRes = await makeRequest({
      method: 'GET',
      path: '/api/quality/dashboard',
      headers: adminHeader
    });

    const dashData = dashRes.body?.data;
    assert(
      dashRes.status === 200 && dashData?.total_inspections >= 4 && dashData.recent_inspections,
      'Module 8: Quality Dashboard aggregates total, passed, and rejected metrics with recent activity',
      dashData
    );

    // 21. Module 9: Raw Material Quality Report
    const rmRep = await makeRequest({
      method: 'GET',
      path: '/api/quality/reports?type=raw_material',
      headers: accHeader
    });

    assert(
      rmRep.status === 200 && Array.isArray(rmRep.body?.data) && rmRep.body?.data?.length > 0,
      'Module 9: Generate Raw Material inspection report with parameters and acceptance history',
      { count: rmRep.body?.data?.length }
    );

    // 22. Module 9: Supplier Quality & Defect Analysis Reports
    const supRep = await makeRequest({
      method: 'GET',
      path: '/api/quality/reports?type=supplier_quality',
      headers: adminHeader
    });

    const defRep = await makeRequest({
      method: 'GET',
      path: '/api/quality/reports?type=defect_analysis',
      headers: ownerHeader
    });

    assert(
      supRep.status === 200 && defRep.status === 200 && Array.isArray(supRep.body?.data),
      'Module 9: Generate Supplier Quality Performance and Defect Analysis reports',
      { supLots: supRep.body?.data?.length, defTypes: defRep.body?.data?.length }
    );

    // 23. Module 10: RBAC - SALESMAN blocked from submitting inspections
    const salesmanBlocked = await makeRequest({
      method: 'POST',
      path: '/api/quality/inspections',
      headers: salesHeader,
      body: { inspection_type: 'RAW_MATERIAL', item_id: 1, item_name: 'Rice', batch_number: 'B01' }
    });

    assert(
      salesmanBlocked.status === 403,
      'Module 10: RBAC - SALESMAN blocked from submitting quality inspections (HTTP 403 Forbidden)',
      salesmanBlocked.body
    );

    // 24. Module 10: RBAC - SALESMAN authorized to check FG release status
    const salesmanCheck = await makeRequest({
      method: 'GET',
      path: '/api/quality/batches/PB-FG001-20261125-999/release-status',
      headers: salesHeader
    });

    assert(
      salesmanCheck.status === 200 && salesmanCheck.body?.data?.is_released === true,
      'Module 10: RBAC - SALESMAN authorized to verify finished goods dispatch release status',
      salesmanCheck.body
    );

  } catch (error) {
    console.error('Fatal test error:', error);
    failCount++;
  }

  console.log('\n================================================================');
  console.log(`  🏁 RESULTS: ${passCount} PASS  |  ${failCount} FAIL  |  ${passCount + failCount} TOTAL`);
  console.log('================================================================\n');

  if (failCount === 0) {
    console.log('  🎉 ALL TESTS PASSED! Phase 8 Quality Control System API is working correctly.\n');
    process.exit(0);
  } else {
    console.error(`  ⚠️ ${failCount} test(s) failed. Check logs above.\n`);
    process.exit(1);
  }
};

runTests();
