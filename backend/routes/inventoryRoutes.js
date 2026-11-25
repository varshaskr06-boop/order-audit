/**
 * ============================================================================
 * Inventory Management Routes (Phase 6)
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 *
 * All routes are mounted at: /api/inventory
 *
 * Role permissions:
 *   SALESMAN    → Finished goods availability ONLY (HTTP 403 on all other endpoints).
 *   PRODUCTION  → View RM/PM/FG stock, inward/outward movements, FEFO recommendations.
 *   ACCOUNTANT  → View inventory valuation, stock movements, and reports.
 *   ADMIN/OWNER → Full management, approve stock adjustments & physical count discrepancies.
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventoryController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// ─── Locations ───────────────────────────────────────────────────────────────
router.get(
  '/locations',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getLocations
);

// ─── Module 1: Raw Material Inventory ────────────────────────────────────────
router.get(
  '/raw-materials',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getRawMaterialInventory
);

// ─── Module 2: Packaging Material Inventory ───────────────────────────────────
router.get(
  '/packaging',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getPackagingInventory
);

// ─── Module 3: Finished Goods Inventory ───────────────────────────────────────
// Accessible by SALESMAN, PRODUCTION, ADMIN, OWNER, ACCOUNTANT
router.get(
  '/finished-goods',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  ctrl.getFinishedGoodsInventory
);

// ─── Module 4: Stock Inward ───────────────────────────────────────────────────
router.post(
  '/inward/grn',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  ctrl.postGRNStockInward
);

router.post(
  '/inward/production',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  ctrl.recordProductionFGInward
);

// ─── Module 5: Stock Outward ──────────────────────────────────────────────────
router.post(
  '/outward/issue',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  ctrl.issueStockToProduction
);

router.get(
  '/outward/issues',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getStockIssues
);

// ─── Module 6: Stock Adjustments ─────────────────────────────────────────────
router.post(
  '/adjustments',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.requestStockAdjustment
);

router.get(
  '/adjustments',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getStockAdjustments
);

router.patch(
  '/adjustments/:id/approve',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  ctrl.approveStockAdjustment
);

// ─── Module 7: Batches & Expiry Management ────────────────────────────────────
router.get(
  '/batches',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getBatches
);

router.get(
  '/batches/expired',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getExpiredBatches
);

router.get(
  '/batches/expiring-soon',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getExpiringSoonBatches
);

router.get(
  '/fefo-recommendation',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  ctrl.getFEFORecommendation
);

// ─── Module 8: Stock Transfers ────────────────────────────────────────────────
router.post(
  '/transfers',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  ctrl.transferStock
);

router.get(
  '/transfers',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getStockTransfers
);

// ─── Module 9: Physical Stock Verification ────────────────────────────────────
router.post(
  '/counts',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  ctrl.createPhysicalStockCount
);

router.get(
  '/counts',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  ctrl.getPhysicalStockCounts
);

router.get(
  '/counts/:id',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  ctrl.getPhysicalStockCountById
);

router.put(
  '/counts/:id/items',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  ctrl.updatePhysicalStockCountItems
);

router.patch(
  '/counts/:id/approve',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  ctrl.approvePhysicalStockCount
);

// ─── Module 10: Inventory Dashboard Stats ─────────────────────────────────────
router.get(
  '/dashboard',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getInventoryDashboardStats
);

// ─── Module 11: Inventory Reports ─────────────────────────────────────────────
router.get(
  '/reports',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  ctrl.getInventoryReports
);

module.exports = router;
