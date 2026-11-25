/**
 * ============================================================================
 * Product Costing Management System Controller (Phase 9)
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const costingModel = require('../models/costingModel');

// ─────────────────────────────────────────────────────────────────────────────
// 1. MATERIAL COSTING (RAW MATERIAL & PACKAGING)
// ─────────────────────────────────────────────────────────────────────────────

exports.getMaterialCosts = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, error: { message: 'Production order ID is required' } });
    }
    const data = await costingModel.calculateMaterialCostsForOrder(orderId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. LABOUR COSTING
// ─────────────────────────────────────────────────────────────────────────────

exports.recordLabourCost = async (req, res, next) => {
  try {
    const { production_order_id, worker_name, working_hours, hourly_rate } = req.body;
    if (!production_order_id || !worker_name || working_hours === undefined || hourly_rate === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'Order ID, worker name, working hours, and hourly rate are required' }
      });
    }
    const result = await costingModel.recordLabourCost(req.body, req.user?.id || 1);
    res.status(201).json({ success: true, message: 'Labour cost recorded successfully', data: result });
  } catch (err) {
    if (err.message.includes('must be greater than zero') || err.message.includes('cannot be negative')) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
    next(err);
  }
};

exports.getLabourCosts = async (req, res, next) => {
  try {
    const filters = {
      production_order_id: req.query.production_order_id,
      batch_number: req.query.batch_number,
      labour_category: req.query.labour_category
    };
    const data = await costingModel.getLabourCosts(filters);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. MACHINE AND ELECTRICITY COSTING
// ─────────────────────────────────────────────────────────────────────────────

exports.recordMachineCost = async (req, res, next) => {
  try {
    const { production_order_id, machine_id, machine_name, operating_hours } = req.body;
    if (!production_order_id || !machine_id || !machine_name || operating_hours === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'Order ID, machine ID, machine name, and operating hours are required' }
      });
    }
    const result = await costingModel.recordMachineCost(req.body, req.user?.id || 1);
    res.status(201).json({ success: true, message: 'Machine & electricity expense recorded', data: result });
  } catch (err) {
    if (err.message.includes('already recorded')) {
      return res.status(409).json({ success: false, error: { message: err.message } });
    }
    if (err.message.includes('must be greater than zero')) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
    next(err);
  }
};

exports.getMachineCosts = async (req, res, next) => {
  try {
    const filters = {
      production_order_id: req.query.production_order_id,
      batch_number: req.query.batch_number
    };
    const data = await costingModel.getMachineCosts(filters);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. OVERHEAD MASTER & ALLOCATION
// ─────────────────────────────────────────────────────────────────────────────

exports.getOverheadPool = async (req, res, next) => {
  try {
    const { period } = req.query;
    const data = await costingModel.getOverheadPool(period);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.createOverhead = async (req, res, next) => {
  try {
    const { overhead_category, description, expense_period_month, amount } = req.body;
    if (!overhead_category || !description || !expense_period_month || amount === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'Category, description, period (YYYY-MM), and amount are required' }
      });
    }
    const result = await costingModel.createOverhead(req.body, req.user?.id || 1);
    res.status(201).json({ success: true, message: 'Overhead expense recorded', data: result });
  } catch (err) {
    next(err);
  }
};

exports.allocateOverhead = async (req, res, next) => {
  try {
    const { production_order_id, overhead_category, allocation_method, basis_value, allocation_rate } = req.body;
    if (!production_order_id || !overhead_category || !allocation_method || basis_value === undefined || allocation_rate === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'Order ID, category, allocation method, basis value, and allocation rate are required' }
      });
    }
    const result = await costingModel.allocateOverhead(req.body, req.user?.id || 1);
    res.status(201).json({ success: true, message: 'Overhead allocated successfully', data: result });
  } catch (err) {
    if (err.message.includes('Unsupported allocation method')) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
    next(err);
  }
};

exports.getCostAllocations = async (req, res, next) => {
  try {
    const filters = {
      production_order_id: req.query.production_order_id,
      batch_number: req.query.batch_number
    };
    const data = await costingModel.getCostAllocations(filters);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. BATCH COST CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

exports.calculateBatchCost = async (req, res, next) => {
  try {
    const { production_order_id, batch_number, produced_quantity } = req.body;
    if (!production_order_id || !batch_number || !produced_quantity) {
      return res.status(400).json({
        success: false,
        error: { message: 'Production order ID, batch number, and produced quantity are required' }
      });
    }
    const result = await costingModel.calculateBatchCost(req.body, req.user?.id || 1);
    res.status(201).json({ success: true, message: 'Batch production cost calculated', data: result });
  } catch (err) {
    if (err.message.includes('already finalized')) {
      return res.status(409).json({ success: false, error: { message: err.message } });
    }
    if (err.message.includes('must be greater than zero')) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
    next(err);
  }
};

exports.getBatchCosts = async (req, res, next) => {
  try {
    const filters = {
      production_order_id: req.query.production_order_id,
      batch_number: req.query.batch_number,
      product_id: req.query.product_id
    };
    const data = await costingModel.getBatchCosts(filters);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. SELLING PRICE & PROFITABILITY
// ─────────────────────────────────────────────────────────────────────────────

exports.calculateSuggestedSellingPrice = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { target_margin_pct } = req.query;
    if (!productId) {
      return res.status(400).json({ success: false, error: { message: 'Product ID is required' } });
    }
    const data = await costingModel.calculateSuggestedSellingPrice(productId, target_margin_pct || 25.0);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.createSellingPrice = async (req, res, next) => {
  try {
    const { product_id, unit_manufacturing_cost, approved_selling_price } = req.body;
    if (!product_id || unit_manufacturing_cost === undefined || approved_selling_price === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'Product ID, manufacturing cost, and approved selling price are required' }
      });
    }
    const result = await costingModel.createSellingPrice(req.body, req.user);
    res.status(201).json({ success: true, message: 'Selling price recorded', data: result });
  } catch (err) {
    if (err.message.includes('must be greater than zero') || err.message.includes('cannot be negative')) {
      return res.status(400).json({ success: false, error: { message: err.message } });
    }
    next(err);
  }
};

exports.updateSellingPriceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, error: { message: 'Status must be APPROVED or REJECTED' } });
    }
    const result = await costingModel.updateSellingPriceStatus(id, status, req.user, notes);
    res.json({ success: true, message: `Selling price marked as ${status}`, data: result });
  } catch (err) {
    if (err.message.includes('Only ADMIN or OWNER')) {
      return res.status(403).json({ success: false, error: { message: err.message } });
    }
    next(err);
  }
};

exports.getSellingPrices = async (req, res, next) => {
  try {
    const filters = {
      product_id: req.query.product_id,
      status: req.query.status
    };
    const data = await costingModel.getSellingPrices(filters);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. PLANNED VS ACTUAL VARIANCE
// ─────────────────────────────────────────────────────────────────────────────

exports.calculateCostVariance = async (req, res, next) => {
  try {
    const { production_order_id } = req.body;
    if (!production_order_id) {
      return res.status(400).json({ success: false, error: { message: 'Production order ID is required' } });
    }
    const result = await costingModel.calculateCostVariance(req.body, req.user?.id || 1);
    res.status(201).json({ success: true, message: 'Cost variance evaluated', data: result });
  } catch (err) {
    next(err);
  }
};

exports.getCostVariances = async (req, res, next) => {
  try {
    const filters = {
      production_order_id: req.query.production_order_id,
      batch_number: req.query.batch_number,
      variance_status: req.query.variance_status
    };
    const data = await costingModel.getCostVariances(filters);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. PRODUCT PROFITABILITY
// ─────────────────────────────────────────────────────────────────────────────

exports.getProductProfitability = async (req, res, next) => {
  try {
    const data = await costingModel.getProductProfitability();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. DASHBOARD & 10 COSTING REPORTS
// ─────────────────────────────────────────────────────────────────────────────

exports.getCostingDashboard = async (req, res, next) => {
  try {
    const data = await costingModel.getCostingDashboardStats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getCostingReports = async (req, res, next) => {
  try {
    const { report_type } = req.query;
    const data = await costingModel.generateCostingReport(report_type, req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
