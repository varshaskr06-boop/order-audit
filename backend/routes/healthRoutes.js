/**
 * ============================================================================
 * Health Check Routes
 * Phase 15: Final Integration & Production Readiness
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { getHealth, getDatabaseHealth, getInfo } = require('../controllers/healthController');

// GET /api/health - Health check status and service uptime
router.get('/health', getHealth);

// GET /api/health/db - Dedicated database connectivity probe
router.get('/health/db', getDatabaseHealth);

// GET /api/info - Company info, GST settings, and complete 15-module registry
router.get('/info', getInfo);

module.exports = router;
