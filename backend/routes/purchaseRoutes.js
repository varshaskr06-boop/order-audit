/**
 * ============================================================================
 * Purchase & Procurement Routes
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 *
 * All routes are mounted at: /api/purchase
 *
 * Role permissions:
 *   PRODUCTION  → Can create PRs and GRNs. View only for POs and invoices.
 *   ADMIN/OWNER → Full access to all procurement operations.
 *   ACCOUNTANT  → Can record and view invoices. View quotations, POs, GRNs.
 *                 Can run three-way matching and record explanations.
 *   SALESMAN    → NO access to procurement (403 on all endpoints).
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/purchaseController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// ─── Dashboard ────────────────────────────────────────────────────────────────
// All authenticated roles except SALESMAN can see the procurement dashboard.
router.get(
  '/stats',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getStats
);

// ─── Purchase Requisitions ────────────────────────────────────────────────────
router.get(
  '/requisitions',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.listRequisitions
);

router.get(
  '/requisitions/:id',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getRequisition
);

// PRODUCTION can create a PR (they know what raw materials are needed)
router.post(
  '/requisitions',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  ctrl.createRequisition
);

// Only DRAFT PRs can be updated — by same roles who created them
router.put(
  '/requisitions/:id',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  ctrl.updateRequisition
);

// PRODUCTION can submit their own PR for admin review
router.post(
  '/requisitions/:id/submit',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  ctrl.submitRequisition
);

// Only ADMIN/OWNER can approve or reject PRs
router.post(
  '/requisitions/:id/approve',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  ctrl.approveRequisition
);

router.post(
  '/requisitions/:id/reject',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  ctrl.rejectRequisition
);

// ─── Supplier Quotations ──────────────────────────────────────────────────────
// ACCOUNTANT can view quotations for financial review
router.get(
  '/quotations',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  ctrl.listQuotations
);

router.get(
  '/quotations/compare',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  ctrl.compareQuotations
);

router.get(
  '/quotations/:id',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  ctrl.getQuotation
);

// Only ADMIN/OWNER handle supplier negotiations
router.post(
  '/quotations',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  ctrl.createQuotation
);

router.put(
  '/quotations/:id',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  ctrl.updateQuotation
);

router.post(
  '/quotations/:id/submit',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  ctrl.submitQuotation
);

router.post(
  '/quotations/:id/select',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  ctrl.selectQuotation
);

// ─── Purchase Orders ──────────────────────────────────────────────────────────
// PRODUCTION and ACCOUNTANT can view POs (read-only)
router.get(
  '/orders',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.listPOs
);

router.get(
  '/orders/:id',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getPO
);

router.get(
  '/orders/:id/print',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.generatePOPrint
);

// Only ADMIN/OWNER can create or manage POs
router.post(
  '/orders',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  ctrl.createPO
);

router.put(
  '/orders/:id',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  ctrl.updatePO
);

router.post(
  '/orders/:id/submit',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  ctrl.submitPO
);

router.post(
  '/orders/:id/approve',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  ctrl.approvePO
);

router.post(
  '/orders/:id/reject',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  ctrl.rejectPO
);

router.post(
  '/orders/:id/return',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER'),
  ctrl.returnPO
);

// ─── Goods Receipt Notes ──────────────────────────────────────────────────────
// PRODUCTION can create and post GRNs (they receive goods at the warehouse)
router.get(
  '/grns',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.listGRNs
);

router.get(
  '/grns/:id',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getGRN
);

router.post(
  '/grns',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  ctrl.createGRN
);

router.post(
  '/grns/:id/post',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  ctrl.postGRN
);

// ─── Supplier Invoices ────────────────────────────────────────────────────────
// ACCOUNTANT records and manages invoices
router.get(
  '/invoices',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  ctrl.listInvoices
);

router.get(
  '/invoices/:id',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  ctrl.getInvoice
);

router.post(
  '/invoices',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  ctrl.createInvoice
);

// ─── Three-Way Matching ───────────────────────────────────────────────────────
router.get(
  '/matching',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  ctrl.listMatches
);

router.get(
  '/matching/:id',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  ctrl.getMatch
);

// Run match for a specific invoice
router.post(
  '/invoices/:id/match',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  ctrl.runMatch
);

// Record explanation for discrepant invoice
router.post(
  '/invoices/:id/explain',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  ctrl.recordExplanation
);

// ─── History & Approvals ──────────────────────────────────────────────────────
router.get(
  '/history',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getHistory
);

router.get(
  '/approvals',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  ctrl.getApprovals
);

// ─── Purchase Reports (Module 10) ─────────────────────────────────────────────
router.get(
  '/reports',
  authenticateToken,
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  ctrl.getReports
);

module.exports = router;
