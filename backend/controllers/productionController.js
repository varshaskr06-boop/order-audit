/**
 * ============================================================================
 * Production Management System Controller (Phase 7)
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const productionModel = require('../models/productionModel');

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1: PRODUCTION PLANNING
// ─────────────────────────────────────────────────────────────────────────────

exports.getProductionPlans = async (req, res, next) => {
  try {
    const { status, product_id, page, limit } = req.query;
    const plans = await productionModel.getProductionPlans({ status, product_id, page, limit });
    res.json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    next(error);
  }
};

exports.getPlanById = async (req, res, next) => {
  try {
    const plan = await productionModel.getPlanById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, error: { message: 'Production plan not found' } });
    }
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

exports.createProductionPlan = async (req, res, next) => {
  try {
    const { product_id, planned_quantity, planned_start_date, planned_end_date } = req.body;
    if (!product_id || !planned_quantity || !planned_start_date || !planned_end_date) {
      return res.status(400).json({
        success: false,
        error: { message: 'product_id, planned_quantity, planned_start_date, and planned_end_date are required' }
      });
    }
    if (Number(planned_quantity) <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'planned_quantity must be greater than zero' }
      });
    }

    const plan = await productionModel.createProductionPlan(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Production plan created successfully', data: plan });
  } catch (error) {
    next(error);
  }
};

exports.updatePlanStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['DRAFT', 'APPROVED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid status. Allowed: DRAFT, APPROVED, CANCELLED' }
      });
    }
    const updated = await productionModel.updatePlanStatus(req.params.id, status, req.user.id);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Production plan not found' } });
    }
    res.json({ success: true, message: `Production plan marked as ${status}`, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 & 3: PRODUCTION ORDERS & BOM SNAPSHOT
// ─────────────────────────────────────────────────────────────────────────────

exports.getProductionOrders = async (req, res, next) => {
  try {
    const { status, product_id, page, limit } = req.query;
    const orders = await productionModel.getProductionOrders({ status, product_id, page, limit });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

exports.getProductionOrderById = async (req, res, next) => {
  try {
    const order = await productionModel.getProductionOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: { message: 'Production order not found' } });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

exports.createProductionOrder = async (req, res, next) => {
  try {
    const { product_id, bom_id, planned_quantity, planned_start_date, planned_end_date } = req.body;
    if (!product_id || !bom_id || !planned_quantity || !planned_start_date || !planned_end_date) {
      return res.status(400).json({
        success: false,
        error: { message: 'product_id, bom_id, planned_quantity, planned_start_date, and planned_end_date are required' }
      });
    }
    if (Number(planned_quantity) <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'planned_quantity must be greater than zero' }
      });
    }

    const order = await productionModel.createProductionOrder(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Production order created with BOM snapshot', data: order });
  } catch (error) {
    next(error);
  }
};

exports.updateProductionOrderStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: { message: 'Status is required' } });
    }

    const updated = await productionModel.updateProductionOrderStatus(
      req.params.id,
      status,
      reason,
      req.user.id,
      req.user.name || req.user.username || 'User'
    );
    res.json({ success: true, message: `Production order status changed to ${status}`, data: updated });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: { message: error.message } });
    }
    if (error.message.includes('Invalid status transition')) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
    next(error);
  }
};

exports.getMaterialRequirements = async (req, res, next) => {
  try {
    const reqs = await productionModel.getMaterialRequirements(req.params.id);
    res.json({ success: true, count: reqs.length, data: reqs });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4: MATERIAL AVAILABILITY CHECK
// ─────────────────────────────────────────────────────────────────────────────

exports.checkMaterialAvailability = async (req, res, next) => {
  try {
    const availability = await productionModel.checkMaterialAvailability(req.params.id);
    res.json({ success: true, data: availability });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5: MATERIAL ISSUE
// ─────────────────────────────────────────────────────────────────────────────

exports.getMaterialIssues = async (req, res, next) => {
  try {
    const issues = await productionModel.getMaterialIssues(req.params.id);
    res.json({ success: true, count: issues.length, data: issues });
  } catch (error) {
    next(error);
  }
};

exports.postMaterialIssue = async (req, res, next) => {
  try {
    const { items, issue_date, received_by, notes } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'items array with at least one material is required' }
      });
    }

    const issue = await productionModel.postMaterialIssue(
      {
        production_order_id: req.params.id,
        items,
        issue_date,
        received_by,
        notes
      },
      req.user.id,
      req.user.name || req.user.username || 'User'
    );

    res.status(201).json({ success: true, message: 'Materials issued successfully to production', data: issue });
  } catch (error) {
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: { message: error.message } });
    }
    if (error.message.includes('APPROVED or IN_PROGRESS')) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 6: MATERIAL RETURN
// ─────────────────────────────────────────────────────────────────────────────

exports.getMaterialReturns = async (req, res, next) => {
  try {
    const returns = await productionModel.getMaterialReturns(req.params.id);
    res.json({ success: true, count: returns.length, data: returns });
  } catch (error) {
    next(error);
  }
};

exports.postMaterialReturn = async (req, res, next) => {
  try {
    const { material_type, material_id, material_name, returned_quantity, unit, condition, return_reason } = req.body;
    if (!material_id || !returned_quantity || Number(returned_quantity) <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'material_id and returned_quantity (>0) are required' }
      });
    }

    const ret = await productionModel.postMaterialReturn(
      {
        ...req.body,
        production_order_id: req.params.id
      },
      req.user.id,
      req.user.name || req.user.username || 'User'
    );

    res.status(201).json({ success: true, message: 'Material return recorded', data: ret });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 7: PRODUCTION EXECUTION & DOWNTIME
// ─────────────────────────────────────────────────────────────────────────────

exports.updateProductionExecution = async (req, res, next) => {
  try {
    const updated = await productionModel.updateProductionExecution(
      req.params.id,
      req.body,
      req.user.id,
      req.user.name || req.user.username || 'User'
    );
    res.json({ success: true, message: 'Production execution progress updated', data: updated });
  } catch (error) {
    if (error.message.includes('Rejected quantity cannot exceed')) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
    next(error);
  }
};

exports.recordDowntime = async (req, res, next) => {
  try {
    const { downtime_start, reason_category } = req.body;
    if (!downtime_start) {
      return res.status(400).json({ success: false, error: { message: 'downtime_start is required' } });
    }

    const dt = await productionModel.recordDowntime(
      req.params.id,
      req.body,
      req.user.id,
      req.user.name || req.user.username || 'User'
    );
    res.status(201).json({ success: true, message: 'Production downtime logged', data: dt });
  } catch (error) {
    next(error);
  }
};

exports.getDowntime = async (req, res, next) => {
  try {
    const dtList = await productionModel.getDowntime(req.params.id);
    res.json({ success: true, count: dtList.length, data: dtList });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 8: PRODUCTION BATCH MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

exports.createProductionBatch = async (req, res, next) => {
  try {
    const { mfg_date, expiry_date } = req.body;
    if (!mfg_date || !expiry_date) {
      return res.status(400).json({
        success: false,
        error: { message: 'mfg_date and expiry_date are required to register production batch' }
      });
    }

    const batch = await productionModel.createProductionBatch(
      {
        ...req.body,
        production_order_id: req.params.id
      },
      req.user.id,
      req.user.name || req.user.username || 'User'
    );
    res.status(201).json({ success: true, message: 'Production batch created', data: batch });
  } catch (error) {
    next(error);
  }
};

exports.getProductionBatches = async (req, res, next) => {
  try {
    const batches = await productionModel.getProductionBatches(req.params.id);
    res.json({ success: true, count: batches.length, data: batches });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 9: FINISHED GOODS RECEIPT
// ─────────────────────────────────────────────────────────────────────────────

exports.getFGReceipts = async (req, res, next) => {
  try {
    const receipts = await productionModel.getFGReceipts(req.params.id);
    res.json({ success: true, count: receipts.length, data: receipts });
  } catch (error) {
    next(error);
  }
};

exports.postFGReceipt = async (req, res, next) => {
  try {
    const { accepted_quantity, mfg_date, expiry_date } = req.body;
    if (accepted_quantity === undefined || Number(accepted_quantity) < 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'accepted_quantity is required and cannot be negative' }
      });
    }
    if (!mfg_date || !expiry_date) {
      return res.status(400).json({
        success: false,
        error: { message: 'mfg_date and expiry_date are required' }
      });
    }

    const receipt = await productionModel.postFGReceipt(
      {
        ...req.body,
        production_order_id: req.params.id
      },
      req.user.id,
      req.user.name || req.user.username || 'User'
    );

    res.status(201).json({ success: true, message: 'Finished goods successfully received into inventory', data: receipt });
  } catch (error) {
    if (error.message.includes('HTTP 409') || error.message.includes('already posted')) {
      return res.status(409).json({ success: false, error: { message: error.message } });
    }
    if (error.message.includes('IN_PROGRESS or COMPLETED')) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 10: PRODUCTION DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

exports.getProductionDashboard = async (req, res, next) => {
  try {
    const stats = await productionModel.getProductionDashboard();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 11: PRODUCTION REPORTS
// ─────────────────────────────────────────────────────────────────────────────

exports.getProductionReport = async (req, res, next) => {
  try {
    const { type = 'daily', from_date, to_date, product_id } = req.query;
    const report = await productionModel.getProductionReport(type, { from_date, to_date, product_id });
    res.json({ success: true, ...report });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGS & STATUS HISTORY
// ─────────────────────────────────────────────────────────────────────────────

exports.getProductionLogs = async (req, res, next) => {
  try {
    const logs = await productionModel.getProductionLogs(req.params.id);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};

exports.getStatusHistory = async (req, res, next) => {
  try {
    const history = await productionModel.getStatusHistory(req.params.id);
    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    next(error);
  }
};
