/**
 * ============================================================================
 * Role-Restricted Test Routes (Verification & Security Guards)
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// Base authentication for all test routes
router.use(authenticateToken);

// Salesman only (or Owner / Admin)
router.get('/salesman-only', requireRoles('SALESMAN', 'OWNER', 'ADMIN'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Salesman workspace.',
    user: req.user,
    module: 'Sales Management',
  });
});

// Production only (or Owner / Admin)
router.get('/production-only', requireRoles('PRODUCTION', 'OWNER', 'ADMIN'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Production workspace.',
    user: req.user,
    module: 'Production & Yield Variance',
  });
});

// Accountant only (or Owner / Admin)
router.get('/accountant-only', requireRoles('ACCOUNTANT', 'OWNER', 'ADMIN'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Accountant / Auditor workspace.',
    user: req.user,
    module: 'Financial & GST Audits (Read-Only)',
  });
});

// Admin only (or Owner)
router.get('/admin-only', requireRoles('ADMIN', 'OWNER'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Administration control panel.',
    user: req.user,
    module: 'User Management & Master Configurations',
  });
});

// Owner only
router.get('/owner-only', requireRoles('OWNER'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Executive Owner command room.',
    user: req.user,
    module: 'Executive Governance & Profit Analytics',
  });
});

module.exports = router;
