/**
 * ============================================================================
 * Phase 14: Reports & Analytics System Routes
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// All analytics routes require JWT authentication
router.use(authenticateToken);

// 1. Executive Dashboard (Owner, Admin, Accountant)
router.get(
  '/executive-dashboard',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  analyticsController.getExecutiveDashboard
);

// 2. Subsystem Analytics
router.get(
  '/sales',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'),
  analyticsController.getSalesAnalytics
);

router.get(
  '/purchase',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  analyticsController.getPurchaseAnalytics
);

router.get(
  '/inventory',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  analyticsController.getInventoryAnalytics
);

router.get(
  '/production',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  analyticsController.getProductionAnalytics
);

router.get(
  '/quality',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  analyticsController.getQualityAnalytics
);

router.get(
  '/costing',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  analyticsController.getCostingAnalytics
);

router.get(
  '/gst',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  analyticsController.getGstAnalytics
);

router.get(
  '/dispatch',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'SALESMAN'),
  analyticsController.getDispatchAnalytics
);

router.get(
  '/payments',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  analyticsController.getPaymentAnalytics
);

router.get(
  '/audit',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  analyticsController.getAuditAnalytics
);

// 3. Definitions & Master Data
router.get(
  '/definitions',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  analyticsController.getReportDefinitions
);

// 4. Saved Reports
router.get(
  '/saved-reports',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  analyticsController.getSavedReports
);

router.post(
  '/saved-reports',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  analyticsController.createSavedReport
);

router.delete(
  '/saved-reports/:id',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  analyticsController.deleteSavedReport
);

// 5. Report Schedules
router.get(
  '/schedules',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  analyticsController.getReportSchedules
);

router.post(
  '/schedules',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  analyticsController.createReportSchedule
);

router.post(
  '/schedules/:id/run',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  analyticsController.runReportSchedule
);

// 6. Execution Logs
router.get(
  '/execution-logs',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  analyticsController.getExecutionLogs
);

// 7. User Dashboard Preferences
router.get(
  '/preferences',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  analyticsController.getDashboardPreferences
);

router.put(
  '/preferences',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  analyticsController.updateDashboardPreferences
);

module.exports = router;
