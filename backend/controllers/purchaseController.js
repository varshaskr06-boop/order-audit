/**
 * ============================================================================
 * Purchase & Procurement Controller
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 *
 * HTTP request handlers for all procurement modules:
 *   - Purchase Requisitions (PR)
 *   - Supplier Quotations (QT)
 *   - Purchase Orders (PO)
 *   - Goods Receipt Notes (GRN)
 *   - Supplier Invoices (INV)
 *   - Three-Way Matching (3WM)
 *   - Dashboard Statistics
 *
 * Pattern: Each function receives (req, res, next).
 * Errors are passed to next() so the global error handler catches them.
 */

const purchaseModel = require('../models/purchaseModel');

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const stats = await purchaseModel.getDashboardStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (err) { next(err); }
};

// ─── Purchase Requisitions ────────────────────────────────────────────────────
const listRequisitions = async (req, res, next) => {
  try {
    const list = await purchaseModel.getRequisitions(req.query);
    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err) { next(err); }
};

const getRequisition = async (req, res, next) => {
  try {
    const pr = await purchaseModel.getRequisitionById(req.params.id);
    if (!pr) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Purchase Requisition #${req.params.id} not found.` } });
    return res.status(200).json({ success: true, data: pr });
  } catch (err) { next(err); }
};

const createRequisition = async (req, res, next) => {
  try {
    const pr = await purchaseModel.createRequisition(req.body, req.user.id);
    return res.status(201).json({ success: true, message: 'Purchase requisition created successfully.', data: pr });
  } catch (err) { next(err); }
};

const updateRequisition = async (req, res, next) => {
  try {
    const pr = await purchaseModel.updateRequisition(req.params.id, req.body, req.user.id);
    return res.status(200).json({ success: true, message: 'Purchase requisition updated.', data: pr });
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    if (err.message.includes('DRAFT')) return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: err.message } });
    next(err);
  }
};

const submitRequisition = async (req, res, next) => {
  try {
    const pr = await purchaseModel.submitRequisition(req.params.id, req.user.id);
    return res.status(200).json({ success: true, message: `PR ${pr.requisition_number} submitted for approval.`, data: pr });
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    if (err.message.includes('DRAFT') || err.message.includes('no items')) return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: err.message } });
    next(err);
  }
};

const approveRequisition = async (req, res, next) => {
  try {
    const pr = await purchaseModel.approveRequisition(req.params.id, req.user.id, req.body.notes);
    return res.status(200).json({ success: true, message: `PR ${pr.requisition_number} approved.`, data: pr });
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    if (err.message.includes('SUBMITTED')) return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: err.message } });
    next(err);
  }
};

const rejectRequisition = async (req, res, next) => {
  try {
    const pr = await purchaseModel.rejectRequisition(req.params.id, req.user.id, req.body.reason);
    return res.status(200).json({ success: true, message: `PR ${pr.requisition_number} rejected.`, data: pr });
  } catch (err) {
    if (err.message.includes('mandatory')) return res.status(400).json({ success: false, error: { code: 'REASON_REQUIRED', message: err.message } });
    if (err.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    next(err);
  }
};

// ─── Supplier Quotations ──────────────────────────────────────────────────────
const listQuotations = async (req, res, next) => {
  try {
    const list = await purchaseModel.getQuotations(req.query);
    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err) { next(err); }
};

const getQuotation = async (req, res, next) => {
  try {
    const qt = await purchaseModel.getQuotationById(req.params.id);
    if (!qt) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Quotation #${req.params.id} not found.` } });
    return res.status(200).json({ success: true, data: qt });
  } catch (err) { next(err); }
};

const compareQuotations = async (req, res, next) => {
  try {
    const { material_id, item_type } = req.query;
    if (!material_id) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAM', message: 'material_id query parameter is required.' } });
    const result = await purchaseModel.compareQuotations(material_id, item_type);
    return res.status(200).json({ success: true, count: result.length, data: result });
  } catch (err) { next(err); }
};

const createQuotation = async (req, res, next) => {
  try {
    const qt = await purchaseModel.createQuotation(req.body, req.user.id);
    return res.status(201).json({ success: true, message: 'Supplier quotation created.', data: qt });
  } catch (err) { next(err); }
};

const updateQuotation = async (req, res, next) => {
  try {
    const qt = await purchaseModel.updateQuotation(req.params.id, req.body, req.user.id);
    return res.status(200).json({ success: true, message: `Quotation ${qt.quotation_number} updated.`, data: qt });
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    if (err.message.includes('DRAFT')) return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: err.message } });
    next(err);
  }
};

const submitQuotation = async (req, res, next) => {
  try {
    const qt = await purchaseModel.submitQuotation(req.params.id, req.user.id);
    return res.status(200).json({ success: true, message: `Quotation ${qt.quotation_number} submitted.`, data: qt });
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    next(err);
  }
};

const selectQuotation = async (req, res, next) => {
  try {
    const qt = await purchaseModel.selectQuotation(req.params.id, req.user.id, req.body.reason);
    return res.status(200).json({ success: true, message: `Quotation ${qt.quotation_number} selected as preferred supplier.`, data: qt });
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    next(err);
  }
};

// ─── Purchase Orders ──────────────────────────────────────────────────────────
const listPOs = async (req, res, next) => {
  try {
    const list = await purchaseModel.getPOs(req.query);
    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err) { next(err); }
};

const getPO = async (req, res, next) => {
  try {
    const po = await purchaseModel.getPOById(req.params.id);
    if (!po) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Purchase Order #${req.params.id} not found.` } });
    return res.status(200).json({ success: true, data: po });
  } catch (err) { next(err); }
};

const createPO = async (req, res, next) => {
  try {
    const po = await purchaseModel.createPO(req.body, req.user.id);
    return res.status(201).json({ success: true, message: 'Purchase order created.', data: po });
  } catch (err) { next(err); }
};

const updatePO = async (req, res, next) => {
  try {
    const po = await purchaseModel.updatePO(req.params.id, req.body, req.user.id);
    return res.status(200).json({ success: true, message: `PO ${po.po_number} updated.`, data: po });
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    if (err.message.includes('Only DRAFT')) return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: err.message } });
    next(err);
  }
};

const submitPO = async (req, res, next) => {
  try {
    const po = await purchaseModel.submitPO(req.params.id, req.user.id);
    return res.status(200).json({ success: true, message: `PO ${po.po_number} submitted for approval.`, data: po });
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    if (err.message.includes('DRAFT') || err.message.includes('no items')) return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: err.message } });
    next(err);
  }
};

const approvePO = async (req, res, next) => {
  try {
    const po = await purchaseModel.approvePO(req.params.id, req.user.id, req.body.notes);
    return res.status(200).json({ success: true, message: `PO ${po.po_number} approved.`, data: po });
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    if (err.message.includes('SUBMITTED')) return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: err.message } });
    next(err);
  }
};

const rejectPO = async (req, res, next) => {
  try {
    const po = await purchaseModel.rejectPO(req.params.id, req.user.id, req.body.reason);
    return res.status(200).json({ success: true, message: `PO ${po.po_number} rejected.`, data: po });
  } catch (err) {
    if (err.message.includes('mandatory')) return res.status(400).json({ success: false, error: { code: 'REASON_REQUIRED', message: err.message } });
    if (err.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    next(err);
  }
};

const returnPO = async (req, res, next) => {
  try {
    const po = await purchaseModel.returnPO(req.params.id, req.user.id, req.body.reason);
    return res.status(200).json({ success: true, message: `PO ${po.po_number} returned for correction.`, data: po });
  } catch (err) {
    if (err.message.includes('mandatory')) return res.status(400).json({ success: false, error: { code: 'REASON_REQUIRED', message: err.message } });
    if (err.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    next(err);
  }
};

// Generate printable PO document (HTML string)
const generatePOPrint = async (req, res, next) => {
  try {
    const po = await purchaseModel.getPOById(req.params.id);
    if (!po) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `PO #${req.params.id} not found.` } });

    const html = `<!DOCTYPE html><html><head><title>${po.po_number}</title>
<style>body{font-family:Arial,sans-serif;padding:20px;max-width:800px;margin:0 auto;}
h2{color:#1e293b;} table{width:100%;border-collapse:collapse;margin-top:12px;}
th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:13px;}
th{background:#f1f5f9;} .total-row{font-weight:bold;background:#fef9c3;}
</style></head><body>
<h2>Purchase Order — ${po.po_number}</h2>
<p><strong>Status:</strong> ${po.status} | <strong>Date:</strong> ${po.po_date}</p>
<p><strong>Supplier ID:</strong> ${po.supplier_id} | <strong>Expected Delivery:</strong> ${po.expected_delivery_date || 'TBD'}</p>
<p><strong>Payment Terms:</strong> ${po.payment_terms || 'N/A'} | <strong>Notes:</strong> ${po.notes || 'N/A'}</p>
<table>
<tr><th>#</th><th>Material</th><th>Type</th><th>UOM</th><th>Qty</th><th>Rate</th><th>Disc%</th><th>GST%</th><th>Total</th></tr>
${po.items.map((item, i) => `<tr><td>${i+1}</td><td>${item.material_name}</td><td>${item.item_type}</td><td>${item.uom}</td><td>${item.ordered_qty}</td><td>₹${item.unit_price}</td><td>${item.discount_pct}%</td><td>${item.gst_rate}%</td><td>₹${item.total_amount}</td></tr>`).join('')}
<tr class="total-row"><td colspan="8" style="text-align:right">Grand Total</td><td>₹${po.grand_total}</td></tr>
</table>
<p style="margin-top:20px;font-size:12px;color:#94a3b8;">Sri Meenakshi Agro & Traditional Foods Pvt Ltd | GSTIN: 33AAAAA0000A1Z5</p>
</body></html>`;

    return res.status(200).json({ success: true, data: { po_number: po.po_number, html } });
  } catch (err) { next(err); }
};

// ─── Goods Receipt Notes ──────────────────────────────────────────────────────
const listGRNs = async (req, res, next) => {
  try {
    const list = await purchaseModel.getGRNs(req.query);
    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err) { next(err); }
};

const getGRN = async (req, res, next) => {
  try {
    const grn = await purchaseModel.getGRNById(req.params.id);
    if (!grn) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `GRN #${req.params.id} not found.` } });
    return res.status(200).json({ success: true, data: grn });
  } catch (err) { next(err); }
};

const createGRN = async (req, res, next) => {
  try {
    const grn = await purchaseModel.createGRN(req.body, req.user.id);
    return res.status(201).json({ success: true, message: 'GRN created. Post it after quality inspection.', data: grn });
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('not found in PO')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    if (err.message.includes('exceeds') || err.message.includes('can only be created') || err.message.includes('cannot be created')) return res.status(400).json({ success: false, error: { code: 'QTY_EXCEEDED', message: err.message } });
    next(err);
  }
};

const postGRN = async (req, res, next) => {
  try {
    const grn = await purchaseModel.postGRN(req.params.id, req.user.id);
    return res.status(200).json({ success: true, message: `GRN ${grn.grn_number} posted successfully. PO status updated.`, data: grn });
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    if (err.message.includes('DRAFT')) return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: err.message } });
    next(err);
  }
};

// ─── Supplier Invoices ────────────────────────────────────────────────────────
const listInvoices = async (req, res, next) => {
  try {
    const list = await purchaseModel.getInvoices(req.query);
    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err) { next(err); }
};

const getInvoice = async (req, res, next) => {
  try {
    const inv = await purchaseModel.getInvoiceById(req.params.id);
    if (!inv) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Invoice #${req.params.id} not found.` } });
    return res.status(200).json({ success: true, data: inv });
  } catch (err) { next(err); }
};

const createInvoice = async (req, res, next) => {
  try {
    const inv = await purchaseModel.createInvoice(req.body, req.user.id);
    return res.status(201).json({ success: true, message: 'Supplier invoice recorded successfully.', data: inv });
  } catch (err) {
    if (err.statusCode === 409) return res.status(409).json({ success: false, error: { code: 'DUPLICATE_INVOICE', message: err.message } });
    next(err);
  }
};

// ─── Three-Way Matching ───────────────────────────────────────────────────────
const listMatches = async (req, res, next) => {
  try {
    const list = await purchaseModel.getMatches(req.query);
    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err) { next(err); }
};

const getMatch = async (req, res, next) => {
  try {
    const m = await purchaseModel.getMatchById(req.params.id);
    if (!m) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Match record #${req.params.id} not found.` } });
    return res.status(200).json({ success: true, data: m });
  } catch (err) { next(err); }
};

const runMatch = async (req, res, next) => {
  try {
    const record = await purchaseModel.runThreeWayMatch(req.params.id, req.user.id);
    return res.status(200).json({ success: true, message: `Three-way matching complete. Status: ${record.match_status}`, data: record });
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    next(err);
  }
};

const recordExplanation = async (req, res, next) => {
  try {
    const record = await purchaseModel.recordMatchExplanation(req.params.id, req.user.id, req.body.explanation);
    return res.status(200).json({ success: true, message: 'Review explanation recorded.', data: record });
  } catch (err) {
    if (err.message.includes('mandatory')) return res.status(400).json({ success: false, error: { code: 'EXPLANATION_REQUIRED', message: err.message } });
    if (err.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    next(err);
  }
};

// ─── History & Approvals ──────────────────────────────────────────────────────
const getHistory = async (req, res, next) => {
  try {
    const { entity_type, entity_id } = req.query;
    const history = await purchaseModel.getHistory(entity_type, entity_id);
    return res.status(200).json({ success: true, count: history.length, data: history });
  } catch (err) { next(err); }
};

const getApprovals = async (req, res, next) => {
  try {
    const { entity_type, entity_id } = req.query;
    const list = await purchaseModel.getApprovals(entity_type, entity_id);
    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err) { next(err); }
};

// ─── Purchase Reports (Module 10) ─────────────────────────────────────────────
const getReports = async (req, res, next) => {
  try {
    const { type, startDate, endDate, supplierId, materialId, status } = req.query;
    const reportType = type || 'purchase_register';
    const data = await purchaseModel.getPurchaseReports(reportType, { startDate, endDate, supplierId, materialId, status });
    return res.status(200).json({ success: true, reportType, count: data.length, data });
  } catch (err) { next(err); }
};

module.exports = {
  getStats,
  // PR
  listRequisitions, getRequisition, createRequisition, updateRequisition,
  submitRequisition, approveRequisition, rejectRequisition,
  // Quotations
  listQuotations, getQuotation, compareQuotations, createQuotation, updateQuotation,
  submitQuotation, selectQuotation,
  // PO
  listPOs, getPO, createPO, updatePO, submitPO, approvePO, rejectPO, returnPO, generatePOPrint,
  // GRN
  listGRNs, getGRN, createGRN, postGRN,
  // Invoices
  listInvoices, getInvoice, createInvoice,
  // 3WM
  listMatches, getMatch, runMatch, recordExplanation,
  // History & Approvals
  getHistory, getApprovals,
  // Reports
  getReports,
};
