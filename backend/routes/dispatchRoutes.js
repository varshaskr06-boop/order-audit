/**
 * ============================================================================
 * Phase 11: Dispatch and Delivery Management System Routes
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// All dispatch routes require JWT authentication
router.use(authenticateToken);

// 1. Dashboard Statistics
router.get(
  '/dashboard-stats',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  dispatchController.getDispatchDashboardStats
);

// 2. Transporters
router.get(
  '/transporters',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  dispatchController.getTransporters
);
router.post(
  '/transporters',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  dispatchController.createTransporter
);

// 3. Batch Stock & QC Verification Gate
router.post(
  '/verify-batch',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  dispatchController.verifyBatchStock
);

// 4. Dispatch Orders (Modules 1 & 2)
router.get(
  '/orders',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  dispatchController.getDispatchOrders
);
router.get(
  '/orders/:id',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  dispatchController.getDispatchOrderById
);
router.post(
  '/orders',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'), // SALESMAN blocked
  dispatchController.createDispatchOrder
);

// 5. Packing Management (Module 3)
router.get(
  '/packing',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  dispatchController.getPackingRecords
);
router.post(
  '/packing',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  dispatchController.recordPacking
);

// 6. Delivery Challans (Module 4)
router.get(
  '/challans',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  dispatchController.getDeliveryChallans
);
router.get(
  '/challans/:id',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  dispatchController.getDeliveryChallanById
);
router.post(
  '/challans',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  dispatchController.generateDeliveryChallan
);

// 7. Shipment Tracking Status (Module 6 & 9)
router.put(
  '/orders/:id/status',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  dispatchController.updateShipmentStatus
);
router.post(
  '/orders/:id/status',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  dispatchController.updateShipmentStatus
);

// 8. Proof of Delivery (POD) (Module 7)
router.get(
  '/pod',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  dispatchController.getProofOfDeliveryList
);
router.post(
  '/pod',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  dispatchController.recordProofOfDelivery
);

// 9. Customer Returns & Damaged Goods (Module 8)
// RBAC: PRODUCTION blocked from modifying customer returns
router.get(
  '/returns',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  dispatchController.getDeliveryReturns
);
router.get(
  '/returns/:id',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  dispatchController.getDeliveryReturnById
);
router.post(
  '/returns',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'), // PRODUCTION and SALESMAN blocked
  dispatchController.recordCustomerReturn
);

// 10. Reports (Module 11)
router.get(
  '/reports',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'),
  dispatchController.generateDispatchReport
);

module.exports = router;
