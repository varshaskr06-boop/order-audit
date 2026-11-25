/**
 * ============================================================================
 * Phase 10: GST Billing and Invoicing Management Routes
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const invoicingController = require('../controllers/invoicingController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// All invoicing endpoints require JWT authentication
router.use(authenticateToken);

// 1. Company Tax Profile (Module 1)
router.get(
  '/company-profile',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN', 'PRODUCTION'),
  invoicingController.getCompanyTaxProfile
);
router.put(
  '/company-profile',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  invoicingController.updateCompanyTaxProfile
);

// 2. Tax Rates Configuration (Module 2)
router.get(
  '/tax-rates',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN', 'PRODUCTION'),
  invoicingController.getTaxRates
);
router.post(
  '/tax-rates',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  invoicingController.createTaxRate
);

// 3. Customer Tax Details (Module 3)
router.get(
  '/customers/:customerId/tax-details',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'),
  invoicingController.getCustomerTaxDetails
);
router.put(
  '/customers/:customerId/tax-details',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'),
  invoicingController.upsertCustomerTaxDetails
);

// 4. Invoices (Modules 4, 5, 6, 8)
router.get(
  '/invoices',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN', 'PRODUCTION'),
  invoicingController.getSalesInvoices
);
router.get(
  '/invoices/:id',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN', 'PRODUCTION'),
  invoicingController.getSalesInvoiceById
);
router.post(
  '/invoices',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  invoicingController.createSalesInvoice
);
router.patch(
  '/invoices/:id/status',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  invoicingController.updateInvoiceStatus
);

// 5. Tax Calculation Engine Preview (Module 5)
router.post(
  '/calculate-tax',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'),
  invoicingController.previewTaxCalculation
);

// 6. Credit & Debit Notes (Module 7)
router.get(
  '/credit-notes',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'),
  invoicingController.getCreditNotes
);
router.post(
  '/credit-notes',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  invoicingController.createCreditNote
);
router.get(
  '/debit-notes',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  invoicingController.getDebitNotes
);
router.post(
  '/debit-notes',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  invoicingController.createDebitNote
);

// 7. Dashboard & Reports (Modules 9 & 10)
router.get(
  '/dashboard',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'),
  invoicingController.getInvoicingDashboardStats
);
router.get(
  '/reports',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'OWNER'),
  invoicingController.generateInvoicingReport
);

module.exports = router;
