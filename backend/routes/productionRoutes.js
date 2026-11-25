/**
 * ============================================================================
 * Production Management System Routes (Phase 7)
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// All production routes require authentication
router.use(authenticateToken);

// ─────────────────────────────────────────────────────────────────────────────
// 1. DASHBOARD & REPORTS
// ─────────────────────────────────────────────────────────────────────────────

// Production Dashboard (All active roles can monitor)
router.get(
  '/dashboard',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  productionController.getProductionDashboard
);

// Production Reports (Auditors, Admins, Owners, Production)
router.get(
  '/reports',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  productionController.getProductionReport
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. PRODUCTION PLANNING
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/plans',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  productionController.getProductionPlans
);

router.get(
  '/plans/:id',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  productionController.getPlanById
);

router.post(
  '/plans',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  productionController.createProductionPlan
);

router.patch(
  '/plans/:id/status',
  requireRoles('ADMIN', 'OWNER'),
  productionController.updatePlanStatus
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. PRODUCTION ORDERS
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/orders',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  productionController.getProductionOrders
);

router.get(
  '/orders/:id',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  productionController.getProductionOrderById
);

router.post(
  '/orders',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  productionController.createProductionOrder
);

// Custom status change route
router.patch(
  '/orders/:id/status',
  (req, res, next) => {
    const { status } = req.body;
    // Approving requires ADMIN or OWNER
    if (status === 'APPROVED') {
      return requireRoles('ADMIN', 'OWNER')(req, res, next);
    }
    // Execution state transitions (IN_PROGRESS, ON_HOLD, COMPLETED, CLOSED, CANCELLED)
    return requireRoles('ADMIN', 'OWNER', 'PRODUCTION')(req, res, next);
  },
  productionController.updateProductionOrderStatus
);

// Material Requirements (BOM Snapshot)
router.get(
  '/orders/:id/requirements',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  productionController.getMaterialRequirements
);

// Material Availability Check
router.get(
  '/orders/:id/availability',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  productionController.checkMaterialAvailability
);

// Material Issues
router.get(
  '/orders/:id/issues',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  productionController.getMaterialIssues
);

router.post(
  '/orders/:id/issues',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  productionController.postMaterialIssue
);

// Material Returns
router.get(
  '/orders/:id/returns',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  productionController.getMaterialReturns
);

router.post(
  '/orders/:id/returns',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  productionController.postMaterialReturn
);

// Execution Progress Update
router.put(
  '/orders/:id/execution',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  productionController.updateProductionExecution
);

// Downtime Tracking
router.get(
  '/orders/:id/downtime',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  productionController.getDowntime
);

router.post(
  '/orders/:id/downtime',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  productionController.recordDowntime
);

// Batch Management
router.get(
  '/orders/:id/batches',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  productionController.getProductionBatches
);

router.post(
  '/orders/:id/batches',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  productionController.createProductionBatch
);

// Finished Goods Receipt
router.get(
  '/orders/:id/fg-receipts',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  productionController.getFGReceipts
);

router.post(
  '/orders/:id/fg-receipts',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  productionController.postFGReceipt
);

// Audit & Status Logs
router.get(
  '/orders/:id/logs',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  productionController.getProductionLogs
);

router.get(
  '/orders/:id/history',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  productionController.getStatusHistory
);

module.exports = router;
