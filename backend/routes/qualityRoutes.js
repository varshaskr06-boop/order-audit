/**
 * ============================================================================
 * Quality Control Management System Routes (Phase 8)
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const qualityController = require('../controllers/qualityController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// ─────────────────────────────────────────────────────────────────────────────
// 1. DASHBOARD & REPORTS
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/dashboard',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  qualityController.getQualityDashboardStats
);

router.get(
  '/reports',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'),
  qualityController.getQualityReports
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. QUALITY STANDARDS (Master Data)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/standards',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  qualityController.getQualityStandards
);

router.get(
  '/standards/:id',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  qualityController.getQualityStandardById
);

router.post(
  '/standards',
  requireRoles('ADMIN', 'OWNER'),
  qualityController.createQualityStandard
);

router.patch(
  '/standards/:id/status',
  requireRoles('ADMIN', 'OWNER'),
  qualityController.toggleStandardStatus
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. QUALITY INSPECTIONS (RM, Packaging, In-Process, Finished Goods)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/inspections',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  qualityController.getInspections
);

router.get(
  '/inspections/:id',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  qualityController.getInspectionById
);

router.post(
  '/inspections',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  qualityController.createInspection
);

// Finished Goods Release Check (Salesman can verify if FG batch is released for dispatch)
router.get(
  '/batches/:batchNumber/release-status',
  requireRoles('ADMIN', 'OWNER', 'SALESMAN', 'PRODUCTION', 'ACCOUNTANT'),
  qualityController.checkFGReleaseStatus
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. DEFECTS & REJECTION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/defects',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  qualityController.getDefects
);

router.post(
  '/defects',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  qualityController.createDefect
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. CAPA & QUALITY INCIDENTS
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/incidents',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  qualityController.getIncidents
);

router.post(
  '/incidents',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  qualityController.createIncident
);

router.get(
  '/capa',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  qualityController.getCapas
);

router.post(
  '/capa',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  qualityController.createCapa
);

router.patch(
  '/capa/:id/status',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION'),
  qualityController.updateCapaStatus
);

router.post(
  '/capa/:id/verify',
  requireRoles('ADMIN', 'OWNER'),
  qualityController.verifyCapa
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. STATUS HISTORY & AUDIT TRAIL
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/history/:entityType/:entityId',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'),
  qualityController.getQualityStatusHistory
);

module.exports = router;
