/**
 * ============================================================================
 * Authentication Routes
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { login, getMe, logout } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', login);
router.post('/logout', logout);

// Protected routes (Requires valid JWT)
router.get('/me', authenticateToken, getMe);

module.exports = router;
