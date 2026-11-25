/**
 * ============================================================================
 * Phase 12: Payment Management System Routes
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// All payment routes require JWT authentication
router.use(authenticateToken);

// 1. Dashboard
router.get(
  '/dashboard',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'),
  paymentController.getPaymentDashboardStats
);

// 2. Payment Methods & Cash/Bank Accounts
router.get(
  '/methods',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'),
  paymentController.getPaymentMethods
);

router.get(
  '/accounts',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  paymentController.getCashBankAccounts
);

router.post(
  '/accounts',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  paymentController.createCashBankAccount
);

// 3. Customer Payments (Receipts)
router.get(
  '/customer-payments',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'),
  paymentController.getCustomerPayments
);

router.get(
  '/customer-payments/:id',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'),
  paymentController.getCustomerPaymentById
);

router.get(
  '/customers/:id/invoices',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'),
  paymentController.getCustomerInvoicesForPayment
);

router.post(
  '/customer-payments',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'), // SALESMAN & PRODUCTION blocked
  paymentController.recordCustomerPayment
);

router.post(
  '/customer-payments/:id/reverse',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  paymentController.reverseCustomerPayment
);

router.get(
  '/customers/:id/statement',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'),
  paymentController.getCustomerStatement
);

// 4. Supplier Payments (Vouchers)
router.get(
  '/supplier-payments',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  paymentController.getSupplierPayments
);

router.get(
  '/supplier-payments/:id',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  paymentController.getSupplierPaymentById
);

router.get(
  '/suppliers/:id/invoices',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  paymentController.getSupplierInvoicesForPayment
);

router.post(
  '/supplier-payments',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  paymentController.recordSupplierPayment
);

router.post(
  '/supplier-payments/:id/approve',
  requireRoles('ADMIN', 'OWNER'), // Only Admin & Owner can approve payments exceeding threshold
  paymentController.approveSupplierPayment
);

router.post(
  '/supplier-payments/:id/reverse',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  paymentController.reverseSupplierPayment
);

router.get(
  '/suppliers/:id/statement',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  paymentController.getSupplierStatement
);

// 5. Bank Statement Import & Reconciliation
router.get(
  '/accounts/:id/statement-lines',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  paymentController.getBankStatementLines
);

router.post(
  '/accounts/:id/import-statement',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  paymentController.importBankStatementCsv
);

router.post(
  '/reconcile',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  paymentController.reconcileStatementLine
);

// 6. Outstanding & Aging Reports
router.get(
  '/reports/customer-aging',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'),
  paymentController.getCustomerAgingReport
);

router.get(
  '/reports/supplier-aging',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  paymentController.getSupplierAgingReport
);

module.exports = router;
