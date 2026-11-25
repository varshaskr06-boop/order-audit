// ============================================================================
// Phase 13: Audit Management System - Automated Test Suite
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
  console.log('🧪 RUNNING PHASE 13: AUDIT MANAGEMENT SYSTEM TEST SUITE');
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

  // STEP 2: AUDIT DASHBOARD STATS
  console.log('\n--- STEP 2: AUDIT DASHBOARD & COMPLIANCE METRICS ---');
  const dashRes = await request('GET', '/api/audit/dashboard', null, tokenAdmin);
  assert(dashRes.statusCode === 200 && dashRes.body.success, 'Retrieve Audit Dashboard KPIs');
  assert(dashRes.body.data.kpis && dashRes.body.data.kpis.total_audits >= 4, 'Dashboard aggregates total planned and completed audits');
  assert(Array.isArray(dashRes.body.data.department_scores) && dashRes.body.data.department_scores.length >= 9, 'Aggregates compliance scores across all 9 operational departments');

  // STEP 3: AUDIT PLANNING
  console.log('\n--- STEP 3: AUDIT PLANNING & SCHEDULING ---');
  const plansRes = await request('GET', '/api/audit/plans', null, tokenAccountant);
  assert(plansRes.statusCode === 200 && Array.isArray(plansRes.body.data), 'Query audit plans (Accountant read access)');

  const newPlanPayload = {
    title: 'H2 Spices Traceability & FSSAI Pesticide Residue Audit',
    department: 'QUALITY',
    category: 'QUALITY_AUDIT',
    start_date: '2026-03-10',
    end_date: '2026-03-15',
    frequency: 'BI_ANNUAL',
    scope: 'Chemical residue testing and batch traceability for Coriander, Cumin, and Red Chilli whole spices.',
    objectives: 'Verify CoA from certified NABL labs and compliance with FSSAI limits.',
    priority: 'HIGH'
  };
  const createPlanRes = await request('POST', '/api/audit/plans', newPlanPayload, tokenAdmin);
  assert(createPlanRes.statusCode === 201 && createPlanRes.body.data.plan_number.startsWith('AP-'), 'Admin creates audit plan with AP-YYYY-XXXX formatting');
  const createdPlanId = createPlanRes.body.data.id;

  const updatePlanRes = await request('PUT', `/api/audit/plans/${createdPlanId}/status`, { status: 'ACTIVE', reason: 'Audit commenced on schedule' }, tokenOwner);
  assert(updatePlanRes.statusCode === 200 && updatePlanRes.body.data.status === 'ACTIVE', 'Owner updates audit plan status to ACTIVE');

  // STEP 4: CHECKLIST TEMPLATES & QUESTIONS
  console.log('\n--- STEP 4: CONFIGURABLE AUDIT CHECKLIST TEMPLATES ---');
  const chkListRes = await request('GET', '/api/audit/checklists', null, tokenAdmin);
  assert(chkListRes.statusCode === 200 && chkListRes.body.data.length >= 10, 'Retrieve checklist templates covering all 10 food manufacturing audit categories');

  const customTemplatePayload = {
    template_name: 'Packaging Heat Seal Integrity & Nitrogen Flush Audit',
    category: 'QUALITY_AUDIT',
    department: 'QUALITY',
    description: 'Daily audit checklist for multi-layer barrier film sealing and headspace oxygen measurement.',
    items: [
      { question: 'Is oxygen headspace below 2.0% in nitrogen flushed ready-to-eat pouches?', requirement_standard: 'FSSAI Packaging Reg 2018', severity: 'HIGH' },
      { question: 'Are heat-seal temperature controller displays calibrated quarterly?', requirement_standard: 'ISO 22000 Section 8.5', severity: 'MEDIUM' }
    ]
  };
  const createChkRes = await request('POST', '/api/audit/checklists', customTemplatePayload, tokenAdmin);
  assert(createChkRes.statusCode === 201 && createChkRes.body.data.items.length === 2, 'Create customizable checklist template with questions and standard refs');
  const newTemplateId = createChkRes.body.data.id;

  const addItemRes = await request('POST', `/api/audit/checklists/${newTemplateId}/items`, {
    question: 'Are burst pressure testing records logged for every sealing machine changeover?',
    requirement_standard: 'Internal Packaging SOP-PKG-004',
    severity: 'HIGH'
  }, tokenAdmin);
  assert(addItemRes.statusCode === 201 && addItemRes.body.data.question.includes('burst pressure'), 'Add checklist question item dynamically');

  // STEP 5: AUDIT EXECUTION & CHECKLIST RESPONSES
  console.log('\n--- STEP 5: AUDIT EXECUTION & RESPONSES ---');
  const execRes = await request('POST', `/api/audit/plans/${createdPlanId}/execute`, {
    checklist_id: newTemplateId,
    auditee_representative: 'Packaging Head Rajan',
    summary: 'Evaluating heat-sealing parameters on Line 1 & Line 2'
  }, tokenAdmin);
  assert(execRes.statusCode === 201 && execRes.body.data.audit_number.startsWith('AR-'), 'Execute audit session generating AR-YYYY-XXXX record');
  const recordId = execRes.body.data.id;

  const questions = (await request('GET', `/api/audit/checklists/${newTemplateId}`, null, tokenAdmin)).body.data.items;
  const responsesPayload = {
    responses: [
      { checklist_item_id: questions[0].id, response_status: 'PASS', auditor_comments: 'Headspace oxygen measured at 1.4% (acceptable)' },
      { checklist_item_id: questions[1].id, response_status: 'FAIL', auditor_comments: 'Temp controller on sealer #2 overdue for calibration by 12 days', evidence_notes: 'Calibration sticker expired 2026-01-31' },
      { checklist_item_id: questions[2].id, response_status: 'PASS', auditor_comments: 'Burst pressure logged at 3.2 bar (acceptable)' }
    ]
  };
  const recordResponsesRes = await request('POST', `/api/audit/records/${recordId}/responses`, responsesPayload, tokenAdmin);
  assert(recordResponsesRes.statusCode === 200 && recordResponsesRes.body.data.total_items_checked === 3, 'Record PASS/FAIL responses and recalculate compliance score');
  assert(parseFloat(recordResponsesRes.body.data.compliance_score_pct) === 66.67, 'Compliance score percentage calculated accurately (2/3 = 66.67%)');

  // STEP 6: CROSS-MODULE TRANSACTION AUDITING (STRICTLY READ-ONLY)
  console.log('\n--- STEP 6: CROSS-MODULE TRANSACTION AUDITING (READ-ONLY) ---');
  const auditSales = await request('GET', '/api/audit/transactions/query?module=sales', null, tokenAdmin);
  assert(auditSales.statusCode === 200 && auditSales.body.data.total_records >= 0, 'Transaction audit: Inspect live Sales orders and approvals');

  const auditPurch = await request('GET', '/api/audit/transactions/query?module=purchase', null, tokenAdmin);
  assert(auditPurch.statusCode === 200 && auditPurch.body.data.three_way_matches, 'Transaction audit: Inspect Purchase orders and 3-Way Matching discrepancies');

  const auditInv = await request('GET', '/api/audit/transactions/query?module=inventory', null, tokenAdmin);
  assert(auditInv.statusCode === 200 && auditInv.body.data.audit_verifications.quarantine_isolation_verified, 'Transaction audit: Inspect Stock ledger, batches, and quarantined stock');

  const auditPay = await request('GET', '/api/audit/transactions/query?module=payments', null, tokenAdmin);
  assert(auditPay.statusCode === 200 && auditPay.body.data.audit_verifications.reversal_audit_trail_preserved, 'Transaction audit: Inspect Customer receipts, payment vouchers, and reversals');

  // STEP 7: AUDIT FINDINGS & RISK MANAGEMENT
  console.log('\n--- STEP 7: AUDIT FINDINGS & RISK MANAGEMENT ---');
  const findingPayload = {
    audit_record_id: recordId,
    plan_id: createdPlanId,
    department: 'QUALITY',
    category: 'QUALITY_AUDIT',
    title: 'Packaging Line #2 Heat Sealer Temperature Controller Out of Calibration',
    description: 'Temperature controller TC-02 exceeded quarterly calibration window, posing risk of weak hermetic pouch seals.',
    related_transaction_type: 'PRODUCTION_ORDER',
    related_transaction_reference: 'PRD-ORD-2026-001',
    root_cause: 'Preventive maintenance calendar lacked automated alert for instrument recalibration.',
    risk_level: 'HIGH',
    assigned_to: 4, // Production supervisor (Murugesan Velu)
    assigned_to_name: 'Production Supervisor Kumar',
    risk_likelihood: 'LIKELY',
    risk_impact: 'MAJOR',
    risk_score: 16,
    mitigation_strategy: 'Recalibrate instrument immediately and audit all pouches produced on Line 2 since calibration due date.'
  };
  const createFindingRes = await request('POST', '/api/audit/findings', findingPayload, tokenAdmin);
  assert(createFindingRes.statusCode === 201 && createFindingRes.body.data.finding_number.startsWith('AF-'), 'Register audit finding AF-YYYY-XXXX with High risk rating');
  const findingId = createFindingRes.body.data.id;

  // STEP 8: CAPA INTEGRATION & CORRECTIVE ACTIONS
  console.log('\n--- STEP 8: CORRECTIVE & PREVENTIVE ACTION (CAPA) INTEGRATION ---');
  const capaPayload = {
    corrective_action: 'Perform emergency on-site recalibration using standard reference probe and re-test 50 pouches.',
    preventive_action: 'Configure automated 14-day calibration advance reminder in Maintenance module.',
    root_cause_analysis: 'Lack of automated scheduling alert for physical calibration instruments.'
  };
  const linkCapaRes = await request('POST', `/api/audit/findings/${findingId}/capa`, capaPayload, tokenAdmin);
  assert(linkCapaRes.statusCode === 201 && linkCapaRes.body.data.capa && linkCapaRes.body.data.finding.capa_id, 'Integrate audit finding with Phase 8 CAPA module');

  // STEP 9: CLOSURE GATEKEEPER & VERIFICATION ENFORCEMENT
  console.log('\n--- STEP 9: CLOSURE GATEKEEPER & FORMAL VERIFICATION ---');
  // Attempt to prematurely close finding without verification
  const prematureCloseRes = await request('PUT', `/api/audit/findings/${findingId}/status`, { status: 'CLOSED' }, tokenAdmin);
  assert(prematureCloseRes.statusCode === 400 && prematureCloseRes.body.code === 'VERIFICATION_REQUIRED', 'Enforce critical audit rule: Block finding closure without prior effective verification (HTTP 400)');

  // Attempt self-audit verification by assignee (Production supervisor)
  const selfVerifRes = await request('POST', `/api/audit/findings/${findingId}/verify`, {
    is_effective: true,
    verification_notes: 'I fixed it myself.'
  }, tokenProduction);
  assert(selfVerifRes.statusCode === 403 && selfVerifRes.body.code === 'SELF_AUDIT_NOT_ALLOWED', 'Enforce self-audit restriction: Assignee cannot verify closure of own work (HTTP 403)');

  // Independent verification by Lead Auditor / Admin
  const validVerifRes = await request('POST', `/api/audit/findings/${findingId}/verify`, {
    is_effective: true,
    verification_notes: 'Independent check of NABL calibration certificate #CAL-2026-992 and verified seal integrity. Finding resolved.',
    evidence_metadata: { calibration_cert: 'CAL-2026-992', tested_burst_pressure: '3.4 bar' }
  }, tokenAdmin);
  assert(validVerifRes.statusCode === 200 && validVerifRes.body.data.finding.status === 'CLOSED', 'Independent lead auditor verifies effective action and closes finding');

  // STEP 10: REOPENING FINDING WORKFLOW
  console.log('\n--- STEP 10: REOPENING FINDING WORKFLOW ---');
  const reopenRes = await request('POST', `/api/audit/findings/${findingId}/reopen`, {
    reopen_reason: 'Post-market customer seal leakage complaint received for batch manufactured on same date.'
  }, tokenAdmin);
  assert(reopenRes.statusCode === 200 && reopenRes.body.data.status === 'REOPENED' && reopenRes.body.data.reopen_count === 1, 'Reopen closed finding with mandatory documented reason and counter increment');

  // STEP 11: EVIDENCE MANAGEMENT
  console.log('\n--- STEP 11: AUDIT EVIDENCE MANAGEMENT ---');
  const evidencePayload = {
    audit_record_id: recordId,
    finding_id: findingId,
    file_name: 'nabl_calibration_certificate_tc02.pdf',
    file_type: 'application/pdf',
    file_size: 342100,
    file_data: 'JVBERi0xLjQKJcTl8uXr...', // Mock base64
    description: 'NABL accredited calibration test report for temperature controller TC-02.'
  };
  const uploadEvidenceRes = await request('POST', '/api/audit/evidence', evidencePayload, tokenAdmin);
  assert(uploadEvidenceRes.statusCode === 201 && uploadEvidenceRes.body.data.id, 'Attach supporting PDF evidence document to audit finding');

  // Validate file type rejection
  const invalidFilePayload = {
    file_name: 'malicious_script.exe',
    file_type: 'application/x-msdownload',
    file_size: 50000,
    file_data: 'binary'
  };
  const invalidUploadRes = await request('POST', '/api/audit/evidence', invalidFilePayload, tokenAdmin);
  assert(invalidUploadRes.statusCode === 400 && invalidUploadRes.body.code === 'INVALID_FILE_TYPE', 'Reject unapproved file types (.exe) with HTTP 400');

  // STEP 12: AUDIT REPORTS
  console.log('\n--- STEP 12: AUDIT REPORT GENERATION ---');
  const reportsToTest = ['individual_audit', 'department_wise', 'findings_register', 'overdue_findings', 'capa_status', 'checklist_analysis'];
  for (const rType of reportsToTest) {
    const repRes = await request('GET', `/api/audit/reports?type=${rType}`, null, tokenAdmin);
    assert(repRes.statusCode === 200 && repRes.body.data.report_type === rType, `Generate ${rType} report with verified data structure`);
  }

  // STEP 13: IMMUTABLE AUDIT STATUS HISTORY
  console.log('\n--- STEP 13: IMMUTABLE AUDIT TRAIL LOGGING ---');
  const histRes = await request('GET', '/api/audit/history', null, tokenAdmin);
  assert(histRes.statusCode === 200 && histRes.body.data.length >= 5, 'Query immutable audit status transitions with timestamp, user, and reason');

  // STEP 14: RBAC ENFORCEMENT
  console.log('\n--- STEP 14: ROLE-BASED ACCESS CONTROL (RBAC) ---');
  const salesmanCreatePlan = await request('POST', '/api/audit/plans', newPlanPayload, tokenSalesman);
  assert(salesmanCreatePlan.statusCode === 403, 'RBAC: Salesman blocked from creating audit plans (HTTP 403 Forbidden)');

  const prodCreateTemplate = await request('POST', '/api/audit/checklists', customTemplatePayload, tokenProduction);
  assert(prodCreateTemplate.statusCode === 403, 'RBAC: Production supervisor blocked from creating checklist templates (HTTP 403 Forbidden)');

  const salesmanViewFindings = await request('GET', '/api/audit/findings', null, tokenSalesman);
  assert(salesmanViewFindings.statusCode === 200 && salesmanViewFindings.body.success, 'RBAC: Salesman authorized to view permitted audit findings (HTTP 200 OK)');

  // FINAL TALLY
  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED | ${passed + failed} TOTAL`);
  console.log('================================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL PHASE 13 AUDIT MANAGEMENT SYSTEM TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED. Review errors above.\n');
    process.exit(1);
  }
}

// Start test execution
runTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
