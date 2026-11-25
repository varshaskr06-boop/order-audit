/**
 * ============================================================================
 * Phase 13: Audit Management System Routes
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// All audit routes require JWT authentication
router.use(authenticateToken);

// 1. Audit Dashboard
router.get(
  '/dashboard',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  auditController.getAuditDashboardStats
);

// 2. Audit Planning & Scheduling
router.get(
  '/plans',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  auditController.getAuditPlans
);

router.post(
  '/plans',
  requireRoles('ADMIN', 'OWNER'),
  auditController.createAuditPlan
);

router.get(
  '/plans/:id',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  auditController.getAuditPlanById
);

router.put(
  '/plans/:id/status',
  requireRoles('ADMIN', 'OWNER'),
  auditController.updateAuditPlanStatus
);

// 3. Checklist Templates & Questions
router.get(
  '/checklists',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  auditController.getChecklists
);

router.post(
  '/checklists',
  requireRoles('ADMIN', 'OWNER'),
  auditController.createChecklist
);

router.get(
  '/checklists/:id',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  auditController.getChecklistById
);

router.post(
  '/checklists/:id/items',
  requireRoles('ADMIN', 'OWNER'),
  auditController.addChecklistItem
);

router.put(
  '/checklists/items/:itemId',
  requireRoles('ADMIN', 'OWNER'),
  auditController.updateChecklistItem
);

// 4. Audit Execution & Checklist Responses
router.post(
  '/plans/:planId/execute',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  auditController.executeAuditSession
);

router.get(
  '/records/:id',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  auditController.getAuditRecordById
);

router.post(
  '/records/:id/responses',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  auditController.recordAuditResponses
);

// 5. Cross-Module Transaction Auditing (Read-Only)
router.get(
  '/transactions/query',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  auditController.getTransactionAuditData
);

// 6. Audit Findings & Risk Management
router.get(
  '/findings',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  auditController.getAuditFindings
);

router.post(
  '/findings',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  auditController.createAuditFinding
);

router.get(
  '/findings/:id',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  auditController.getAuditFindingById
);

router.put(
  '/findings/:id/status',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  auditController.updateFindingStatus
);

router.post(
  '/findings/:id/reopen',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  auditController.reopenAuditFinding
);

// 7. CAPA Integration & Verifications
router.post(
  '/findings/:id/capa',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  auditController.linkFindingToCapa
);

router.post(
  '/findings/:id/verify',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  auditController.verifyAuditFinding
);

// 8. Audit Evidence Management
router.get(
  '/evidence',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  auditController.getAuditEvidenceList
);

router.post(
  '/evidence',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  auditController.attachAuditEvidence
);

router.get(
  '/evidence/:id/download',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  auditController.downloadAuditEvidence
);

// 9. Audit Reports & History
router.get(
  '/reports',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  auditController.getAuditReports
);

router.get(
  '/history',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'),
  auditController.getAuditStatusHistory
);

module.exports = router;
