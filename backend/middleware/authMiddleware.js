/**
 * ============================================================================
 * JWT Authentication & Role-Based Access Control (RBAC) Middleware
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 */

const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

/**
 * Authenticate incoming requests by verifying the JWT bearer token.
 * Extracts token from 'Authorization: Bearer <token>' header.
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_MISSING',
          message: 'Access denied. Authentication token is missing.',
        },
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_MALFORMED',
          message: 'Invalid authorization format. Format must be: Bearer <token>',
        },
      });
    }

    const token = parts[1];
    const jwtSecret = process.env.JWT_SECRET || 'dev_secret_food_mfg_jwt_key_998877665544332211';

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Your session has expired. Please log in again.',
          },
        });
      }
      return res.status(403).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Invalid or forged authentication token.',
        },
      });
    }

    // Live account verification: check if user exists and is active
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account associated with this token no longer exists.',
        },
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account has been deactivated. Please contact an Administrator.',
        },
      });
    }

    // Attach verified user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role authorization guard.
 * Restricts route access to specified roles.
 * 
 * Example usage:
 *   router.get('/production', authenticateToken, requireRoles('PRODUCTION', 'ADMIN', 'OWNER'), handler);
 */
const requireRoles = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required before checking permissions.',
        },
      });
    }

    const userRole = (req.user.role || '').toUpperCase();

    // Check if user has an authorized role
    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ROLE',
          message: `Access denied. Requires role(s): [${normalizedAllowed.join(', ')}], but current user has role: [${userRole}].`,
          requiredRoles: normalizedAllowed,
          userRole,
        },
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRoles,
};
