/**
 * ============================================================================
 * Sales Order Routes
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const salesOrderCtrl = require('../controllers/salesOrderController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// 1. Sales Statistics & KPIs (All authenticated roles)
router.get(
  '/stats',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'SALESMAN', 'PRODUCTION', 'ACCOUNTANT'),
  salesOrderCtrl.getStats
);

// 2. Customer Order History (Salesman, Admin, Owner, Accountant)
router.get(
  '/customers/:id/history',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'SALESMAN', 'ACCOUNTANT'),
  salesOrderCtrl.getCustomerHistory
);

// 3. Pricing & Tax Preview Calculation (Before placing order)
router.post(
  '/orders/calculate',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'SALESMAN'),
  salesOrderCtrl.previewPricing
);

// 4. List Orders (Role-scoped: Salesman sees own, others see all)
router.get(
  '/orders',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'SALESMAN', 'PRODUCTION', 'ACCOUNTANT'),
  salesOrderCtrl.listOrders
);

// 5. Get Single Order Details with items, tax breakdown & history
router.get(
  '/orders/:id',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'SALESMAN', 'PRODUCTION', 'ACCOUNTANT'),
  salesOrderCtrl.getOrder
);

// 6. Printable Sales Order Document (HTML/PDF format)
router.get(
  '/orders/:id/print',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'SALESMAN', 'PRODUCTION', 'ACCOUNTANT'),
  salesOrderCtrl.generateOrderPdfHtml
);

// 7. Create Sales Order (Draft or Direct Submit)
router.post(
  '/orders',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'SALESMAN'),
  salesOrderCtrl.createOrder
);

// 8. Update Draft or Returned Sales Order
router.put(
  '/orders/:id',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'SALESMAN'),
  salesOrderCtrl.updateDraft
);

// 9. Submit Order for Manager Approval
router.post(
  '/orders/:id/submit',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'SALESMAN'),
  salesOrderCtrl.submitOrder
);

// 10. Approve Order (ADMIN and OWNER only!)
router.post(
  '/orders/:id/approve',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  salesOrderCtrl.approveOrder
);

// 11. Reject Order with mandatory reason (ADMIN and OWNER only!)
router.post(
  '/orders/:id/reject',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  salesOrderCtrl.rejectOrder
);

// 12. Return Order for Salesman Correction (ADMIN and OWNER only!)
router.post(
  '/orders/:id/return',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  salesOrderCtrl.returnOrder
);

// 13. Progress Order Status (IN_PRODUCTION, READY, DISPATCHED)
router.patch(
  '/orders/:id/status',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  salesOrderCtrl.updateStatus
);

module.exports = router;
