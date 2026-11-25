// ============================================================================
// Phase 13: Audit Management System Controller
// Sri Meenakshi Agro & Traditional Foods Pvt Ltd
// ============================================================================

const auditModel = require('../models/auditModel');

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUDIT PLANS
// ─────────────────────────────────────────────────────────────────────────────

const getAuditPlans = async (req, res) => {
  try {
    const plans = await auditModel.getAuditPlans(req.query);
    res.json({ success: true, count: plans.length, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAuditPlanById = async (req, res) => {
  try {
    const plan = await auditModel.getAuditPlanById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Audit plan not found' });
    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createAuditPlan = async (req, res) => {
  try {
    const { title, department, category, start_date, end_date } = req.body;
    if (!title || !department || !category || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Missing required audit plan fields: title, department, category, start_date, end_date.' });
    }
    const newPlan = await auditModel.createAuditPlan(req.body, req.user);
    res.status(201).json({ success: true, message: 'Audit plan created successfully', data: newPlan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateAuditPlanStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required.' });
    const plan = await auditModel.updateAuditPlanStatus(req.params.id, status, reason, req.user);
    res.json({ success: true, message: 'Audit plan status updated', data: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. CHECKLIST TEMPLATES & QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

const getChecklists = async (req, res) => {
  try {
    const checklists = await auditModel.getChecklists(req.query);
    res.json({ success: true, count: checklists.length, data: checklists });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getChecklistById = async (req, res) => {
  try {
    const checklist = await auditModel.getChecklistById(req.params.id);
    if (!checklist) return res.status(404).json({ success: false, message: 'Checklist template not found' });
    res.json({ success: true, data: checklist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createChecklist = async (req, res) => {
  try {
    const { template_name, category, department } = req.body;
    if (!template_name || !category || !department) {
      return res.status(400).json({ success: false, message: 'template_name, category, and department are required.' });
    }
    const newChecklist = await auditModel.createChecklist(req.body, req.user);
    res.status(201).json({ success: true, message: 'Checklist template created', data: newChecklist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addChecklistItem = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Question text is required.' });
    const item = await auditModel.addChecklistItem(req.params.id, req.body);
    res.status(201).json({ success: true, message: 'Checklist item added', data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateChecklistItem = async (req, res) => {
  try {
    const item = await auditModel.updateChecklistItem(req.params.itemId, req.body);
    res.json({ success: true, message: 'Checklist item updated', data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. AUDIT EXECUTION & RESPONSES
// ─────────────────────────────────────────────────────────────────────────────

const executeAuditSession = async (req, res) => {
  try {
    const record = await auditModel.executeAuditSession(req.params.planId, req.body, req.user);
    res.status(201).json({ success: true, message: 'Audit execution session started', data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAuditRecordById = async (req, res) => {
  try {
    const record = await auditModel.getAuditRecordById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Audit execution record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const recordAuditResponses = async (req, res) => {
  try {
    const { responses } = req.body;
    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ success: false, message: 'Responses array is required.' });
    }
    const updatedRecord = await auditModel.recordAuditResponses(req.params.id, responses, req.user);
    res.json({ success: true, message: 'Audit responses saved and compliance score calculated', data: updatedRecord });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. CROSS-MODULE TRANSACTION AUDITING (STRICTLY READ-ONLY)
// ─────────────────────────────────────────────────────────────────────────────

const getTransactionAuditData = async (req, res) => {
  try {
    const { module: moduleName } = req.query;
    if (!moduleName) {
      return res.status(400).json({ success: false, message: 'Query parameter "module" is required (e.g. sales, purchase, inventory, production, quality, costing, invoicing, dispatch, payments).' });
    }
    const result = await auditModel.getTransactionAuditData(moduleName, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. AUDIT FINDINGS & RISK MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

const getAuditFindings = async (req, res) => {
  try {
    const findings = await auditModel.getAuditFindings(req.query);
    res.json({ success: true, count: findings.length, data: findings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAuditFindingById = async (req, res) => {
  try {
    const finding = await auditModel.getAuditFindingById(req.params.id);
    if (!finding) return res.status(404).json({ success: false, message: 'Audit finding not found' });
    res.json({ success: true, data: finding });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createAuditFinding = async (req, res) => {
  try {
    const { department, category, title, description, risk_level } = req.body;
    if (!department || !category || !title || !description || !risk_level) {
      return res.status(400).json({ success: false, message: 'department, category, title, description, and risk_level are required.' });
    }
    const finding = await auditModel.createAuditFinding(req.body, req.user);
    res.status(201).json({ success: true, message: 'Audit finding registered', data: finding });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateFindingStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required.' });
    const finding = await auditModel.updateFindingStatus(req.params.id, status, reason, req.user);
    res.json({ success: true, message: 'Finding status updated', data: finding });
  } catch (err) {
    if (err.code === 'VERIFICATION_REQUIRED') {
      return res.status(400).json({ success: false, code: err.code, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const reopenAuditFinding = async (req, res) => {
  try {
    const { reopen_reason } = req.body;
    if (!reopen_reason) return res.status(400).json({ success: false, message: 'Reopen reason is mandatory.' });
    const finding = await auditModel.reopenAuditFinding(req.params.id, reopen_reason, req.user);
    res.json({ success: true, message: 'Audit finding reopened', data: finding });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. CAPA INTEGRATION & VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

const linkFindingToCapa = async (req, res) => {
  try {
    const result = await auditModel.linkFindingToCapa(req.params.id, req.body, req.user);
    res.status(201).json({ success: true, message: 'Corrective and Preventive Action linked to finding', data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const verifyAuditFinding = async (req, res) => {
  try {
    const result = await auditModel.verifyAuditFinding(req.params.id, req.body, req.user);
    res.json({ success: true, message: 'Verification recorded successfully', data: result });
  } catch (err) {
    if (err.code === 'SELF_AUDIT_NOT_ALLOWED') {
      return res.status(403).json({ success: false, code: err.code, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. AUDIT EVIDENCE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

const attachAuditEvidence = async (req, res) => {
  try {
    const { file_name } = req.body;
    if (!file_name) return res.status(400).json({ success: false, message: 'file_name is required.' });
    const evidence = await auditModel.attachAuditEvidence(req.body, req.user);
    res.status(201).json({ success: true, message: 'Audit evidence attached successfully', data: evidence });
  } catch (err) {
    if (err.code === 'INVALID_FILE_TYPE' || err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ success: false, code: err.code, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAuditEvidenceList = async (req, res) => {
  try {
    const list = await auditModel.getAuditEvidenceList(req.query);
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const downloadAuditEvidence = async (req, res) => {
  try {
    const evidence = await auditModel.getAuditEvidenceById(req.params.id);
    if (!evidence) return res.status(404).json({ success: false, message: 'Evidence document not found.' });
    res.setHeader('Content-Type', evidence.file_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${evidence.file_name}"`);
    res.send(evidence.file_data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. DASHBOARD & REPORTS
// ─────────────────────────────────────────────────────────────────────────────

const getAuditDashboardStats = async (req, res) => {
  try {
    const stats = await auditModel.getAuditDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAuditReports = async (req, res) => {
  try {
    const { type } = req.query;
    const reports = await auditModel.getAuditReports(type || 'individual_audit', req.query);
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAuditStatusHistory = async (req, res) => {
  try {
    const history = await auditModel.getAuditStatusHistory(req.query);
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  // 1. Plans
  getAuditPlans,
  getAuditPlanById,
  createAuditPlan,
  updateAuditPlanStatus,
  // 2. Checklists
  getChecklists,
  getChecklistById,
  createChecklist,
  addChecklistItem,
  updateChecklistItem,
  // 3. Execution
  executeAuditSession,
  getAuditRecordById,
  recordAuditResponses,
  // 4. Transaction Audit
  getTransactionAuditData,
  // 5. Findings
  getAuditFindings,
  getAuditFindingById,
  createAuditFinding,
  updateFindingStatus,
  reopenAuditFinding,
  // 6. CAPA & Verifications
  linkFindingToCapa,
  verifyAuditFinding,
  // 7. Evidence
  attachAuditEvidence,
  getAuditEvidenceList,
  downloadAuditEvidence,
  // 8. Dashboard & Reports
  getAuditDashboardStats,
  getAuditReports,
  getAuditStatusHistory
};
