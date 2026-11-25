/**
 * ============================================================================
 * Product Costing Management System Routes (Phase 9)
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const costingController = require('../controllers/costingController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// ─────────────────────────────────────────────────────────────────────────────
// 1. DASHBOARD & REPORTS
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/dashboard',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  costingController.getCostingDashboard
);

router.get(
  '/reports',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  costingController.getCostingReports
);

router.get(
  '/profitability',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  costingController.getProductProfitability
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. MATERIAL COSTING
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/materials/order/:orderId',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  costingController.getMaterialCosts
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. LABOUR COSTING
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/labour',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  costingController.getLabourCosts
);

router.post(
  '/labour',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  costingController.recordLabourCost
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. MACHINE & ELECTRICITY COSTING
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/machines',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  costingController.getMachineCosts
);

router.post(
  '/machines',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  costingController.recordMachineCost
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. OVERHEAD COSTS & ALLOCATION
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/overheads',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  costingController.getOverheadPool
);

router.post(
  '/overheads',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  costingController.createOverhead
);

router.get(
  '/allocations',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  costingController.getCostAllocations
);

router.post(
  '/allocations',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  costingController.allocateOverhead
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. BATCH COST CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/batches',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  costingController.getBatchCosts
);

router.post(
  '/batches/calculate',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  costingController.calculateBatchCost
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. SELLING PRICES & PROFIT MARGINS
// ─────────────────────────────────────────────────────────────────────────────

// SALESMAN is explicitly authorized to view approved product selling prices
router.get(
  '/selling-prices',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  costingController.getSellingPrices
);

router.get(
  '/selling-prices/suggested/:productId',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  costingController.calculateSuggestedSellingPrice
);

router.post(
  '/selling-prices',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  costingController.createSellingPrice
);

// Only ADMIN and OWNER can approve / reject selling price updates
router.patch(
  '/selling-prices/:id/status',
  requireRoles('ADMIN', 'OWNER'),
  costingController.updateSellingPriceStatus
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. PLANNED VS ACTUAL VARIANCE
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/variances',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  costingController.getCostVariances
);

router.post(
  '/variances/calculate',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  costingController.calculateCostVariance
);

module.exports = router;
