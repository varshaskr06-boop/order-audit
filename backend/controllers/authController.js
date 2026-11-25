/**
 * ============================================================================
 * Authentication Controller
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

/**
 * POST /api/auth/login
 * Authenticates user credentials, verifies active status, and issues JWT token.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Both email and password are required.',
        },
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Lookup user by email (returns record with password_hash)
    const user = await userModel.findByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    // Verify account active status
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account is deactivated. Please contact an Administrator.',
        },
      });
    }

    // Verify password hash with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    // Sign JWT token
    const jwtSecret = process.env.JWT_SECRET || 'dev_secret_food_mfg_jwt_key_998877665544332211';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn });

    // Return safe user object (excluding password hash)
    const { password_hash, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      expiresIn,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns authenticated user's current profile.
 */
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Client-side logout acknowledgment.
 */
const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

module.exports = {
  login,
  getMe,
  logout,
};
