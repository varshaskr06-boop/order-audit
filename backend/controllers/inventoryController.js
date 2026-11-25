/**
 * ============================================================================
 * Inventory Management Controller (Phase 6)
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const inventoryModel = require('../models/inventoryModel');

// 1. Locations
const getLocations = async (req, res, next) => {
  try {
    const locations = await inventoryModel.getLocations();
    res.json({ success: true, count: locations.length, data: locations });
  } catch (err) {
    next(err);
  }
};

// 2. Module 1: Raw Material Inventory
const getRawMaterialInventory = async (req, res, next) => {
  try {
    const data = await inventoryModel.getRawMaterialInventory(req.query);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

// 3. Module 2: Packaging Material Inventory
const getPackagingInventory = async (req, res, next) => {
  try {
    const data = await inventoryModel.getPackagingInventory(req.query);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

// 4. Module 3: Finished Goods Inventory (Accessible by SALESMAN, PRODUCTION, ADMIN, OWNER, ACCOUNTANT)
const getFinishedGoodsInventory = async (req, res, next) => {
  try {
    const data = await inventoryModel.getFinishedGoodsInventory(req.query);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

// 5. Module 4: Stock Inward (From GRN)
const postGRNStockInward = async (req, res, next) => {
  try {
    const { grn_id } = req.body;
    if (!grn_id) {
      return res.status(400).json({ success: false, message: 'grn_id is required for stock inward.' });
    }
    const result = await inventoryModel.postGRNStockInward(grn_id, req.user?.id || 1);
    res.status(201).json({
      success: true,
      message: `Stock inward successfully posted from GRN #${grn_id} into central ledger.`,
      data: result
    });
  } catch (err) {
    if (err.message && err.message.includes('Duplicate posting')) {
      return res.status(409).json({ success: false, message: err.message });
    }
    if (err.message && (err.message.includes('not found') || err.message.includes('must be in POSTED'))) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// Record finished goods production inward
const recordProductionFGInward = async (req, res, next) => {
  try {
    const result = await inventoryModel.recordProductionFGInward(req.body, req.user?.id || 1);
    res.status(201).json({
      success: true,
      message: 'Finished goods inward successfully recorded in stock ledger.',
      data: result
    });
  } catch (err) {
    if (err.message && (err.message.includes('required') || err.message.includes('not found'))) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// 6. Module 5: Stock Outward (Issue to Production)
const issueStockToProduction = async (req, res, next) => {
  try {
    const result = await inventoryModel.issueStockToProduction(req.body, req.user?.id || 1);
    res.status(201).json({
      success: true,
      message: `Stock issue ${result.stock_issue.issue_number} successfully posted to ledger.`,
      data: result
    });
  } catch (err) {
    if (
      err.message &&
      (err.message.includes('Insufficient') ||
        err.message.includes('Over-issue') ||
        err.message.includes('expired') ||
        err.message.includes('required') ||
        err.message.includes('not found'))
    ) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

const getStockIssues = async (req, res, next) => {
  try {
    const issues = await inventoryModel.getStockIssues(req.query);
    res.json({ success: true, count: issues.length, data: issues });
  } catch (err) {
    next(err);
  }
};

// 7. Module 6: Stock Adjustments
const requestStockAdjustment = async (req, res, next) => {
  try {
    const adjustment = await inventoryModel.requestStockAdjustment(req.body, req.user?.id || 1);
    res.status(201).json({
      success: true,
      message: `Stock adjustment request ${adjustment.adjustment_number} submitted for Admin/Owner approval.`,
      data: adjustment
    });
  } catch (err) {
    if (err.message && (err.message.includes('required') || err.message.includes('Invalid adjustment'))) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

const getStockAdjustments = async (req, res, next) => {
  try {
    const data = await inventoryModel.getStockAdjustments(req.query);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

const approveStockAdjustment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, notes } = req.body;
    if (!decision) {
      return res.status(400).json({ success: false, message: 'Decision (APPROVED or REJECTED) is required.' });
    }
    const result = await inventoryModel.approveStockAdjustment(id, req.user?.id || 1, decision, notes);
    res.json({
      success: true,
      message: `Stock adjustment #${id} has been ${result.adjustment.status}.`,
      data: result
    });
  } catch (err) {
    if (err.message && (err.message.includes('not found') || err.message.includes('already been'))) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// 8. Module 7: Batches & Expiry Management
const getBatches = async (req, res, next) => {
  try {
    const batches = await inventoryModel.getBatches(req.query);
    res.json({ success: true, count: batches.length, data: batches });
  } catch (err) {
    next(err);
  }
};

const getExpiredBatches = async (req, res, next) => {
  try {
    const expired = await inventoryModel.getExpiredBatches();
    res.json({ success: true, count: expired.length, data: expired });
  } catch (err) {
    next(err);
  }
};

const getExpiringSoonBatches = async (req, res, next) => {
  try {
    const days = Number(req.query.days || 30);
    const expiring = await inventoryModel.getExpiringSoonBatches(days);
    res.json({ success: true, count: expiring.length, data: expiring });
  } catch (err) {
    next(err);
  }
};

const getFEFORecommendation = async (req, res, next) => {
  try {
    const { item_id, quantity } = req.query;
    if (!item_id || !quantity) {
      return res.status(400).json({ success: false, message: 'item_id and quantity query parameters are required.' });
    }
    const recommendation = await inventoryModel.getFEFORecommendation(item_id, quantity);
    res.json({ success: true, data: recommendation });
  } catch (err) {
    if (err.message && err.message.includes('required')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// 9. Module 8: Stock Transfers
const transferStock = async (req, res, next) => {
  try {
    const result = await inventoryModel.transferStock(req.body, req.user?.id || 1);
    res.status(201).json({
      success: true,
      message: `Stock transfer ${result.transfer.transfer_number} completed. Balance conserved across locations.`,
      data: result
    });
  } catch (err) {
    if (
      err.message &&
      (err.message.includes('required') ||
        err.message.includes('identical') ||
        err.message.includes('Insufficient') ||
        err.message.includes('not found'))
    ) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

const getStockTransfers = async (req, res, next) => {
  try {
    const data = await inventoryModel.getStockTransfers();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

// 10. Module 9: Physical Stock Verification
const createPhysicalStockCount = async (req, res, next) => {
  try {
    const result = await inventoryModel.createPhysicalStockCount(req.body, req.user?.id || 1);
    res.status(201).json({
      success: true,
      message: `Physical stock count sheet ${result.count_number} created with system baseline.`,
      data: result
    });
  } catch (err) {
    if (err.message && err.message.includes('required')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

const getPhysicalStockCounts = async (req, res, next) => {
  try {
    const data = await inventoryModel.getPhysicalStockCounts();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

const getPhysicalStockCountById = async (req, res, next) => {
  try {
    const count = await inventoryModel.getPhysicalStockCountById(req.params.id);
    if (!count) {
      return res.status(404).json({ success: false, message: `Stock count #${req.params.id} not found.` });
    }
    res.json({ success: true, data: count });
  } catch (err) {
    next(err);
  }
};

const updatePhysicalStockCountItems = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items array is required.' });
    }
    const updated = await inventoryModel.updatePhysicalStockCountItems(req.params.id, items);
    res.json({
      success: true,
      message: `Stock count #${req.params.id} updated with physical quantities. Discrepancies computed.`,
      data: updated
    });
  } catch (err) {
    if (err.message && (err.message.includes('not found') || err.message.includes('Only DRAFT'))) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

const approvePhysicalStockCount = async (req, res, next) => {
  try {
    const { decision, notes } = req.body;
    if (!decision) {
      return res.status(400).json({ success: false, message: 'Decision (APPROVED or REJECTED) is required.' });
    }
    const result = await inventoryModel.approvePhysicalStockCount(req.params.id, req.user?.id || 1, decision, notes);
    res.json({
      success: true,
      message: `Stock count #${req.params.id} ${result.count.status}. Discrepancies reconciled in stock ledger.`,
      data: result
    });
  } catch (err) {
    if (err.message && (err.message.includes('not found') || err.message.includes('already approved'))) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// 11. Module 10: Inventory Dashboard Stats
const getInventoryDashboardStats = async (req, res, next) => {
  try {
    const stats = await inventoryModel.getInventoryDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

// 12. Module 11: Inventory Reports
const getInventoryReports = async (req, res, next) => {
  try {
    const type = req.query.type || 'current_stock';
    const report = await inventoryModel.getInventoryReports(type, req.query);
    res.json({ success: true, report_type: type, data: report });
  } catch (err) {
    if (err.message && err.message.includes('Unknown report type')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

module.exports = {
  getLocations,
  getRawMaterialInventory,
  getPackagingInventory,
  getFinishedGoodsInventory,
  postGRNStockInward,
  recordProductionFGInward,
  issueStockToProduction,
  getStockIssues,
  requestStockAdjustment,
  getStockAdjustments,
  approveStockAdjustment,
  getBatches,
  getExpiredBatches,
  getExpiringSoonBatches,
  getFEFORecommendation,
  transferStock,
  getStockTransfers,
  createPhysicalStockCount,
  getPhysicalStockCounts,
  getPhysicalStockCountById,
  updatePhysicalStockCountItems,
  approvePhysicalStockCount,
  getInventoryDashboardStats,
  getInventoryReports
};
