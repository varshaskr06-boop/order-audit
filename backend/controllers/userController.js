/**
 * ============================================================================
 * User Management Controller (Admin & Owner)
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 */

const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

const VALID_ROLES = ['SALESMAN', 'ADMIN', 'PRODUCTION', 'ACCOUNTANT', 'OWNER'];

/**
 * GET /api/users
 * Returns list of all system users.
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await userModel.getAllUsers();
    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 * Returns a single user by ID.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: `User with ID ${req.params.id} does not exist.`,
        },
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users
 * Admin creates a new user account with hashed password.
 */
const createUser = async (req, res, next) => {
  try {
    const { full_name, email, password, role, phone, is_active } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Full name, email, password, and role are required fields.',
        },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL_FORMAT',
          message: 'Please provide a valid email address.',
        },
      });
    }

    // Validate password complexity
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 6 characters in length.',
        },
      });
    }

    // Validate role
    const canonicalRole = userModel.normalizeRole(role);
    if (!VALID_ROLES.includes(canonicalRole)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: `Invalid role "${role}". Allowed roles: ${VALID_ROLES.join(', ')}.`,
        },
      });
    }

    // Check for existing email conflict
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_IN_USE',
          message: `User with email "${email}" already exists.`,
        },
      });
    }

    // Hash password with bcrypt (10 rounds)
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const newUser = await userModel.createUser({
      full_name,
      email,
      password_hash,
      role: canonicalRole,
      phone: phone || null,
      is_active: is_active !== false,
    });

    return res.status(201).json({
      success: true,
      message: `User ${newUser.full_name} (${newUser.email}) created successfully.`,
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id
 * Admin edits user details (name, role, phone, active state, or optional password reset).
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, role, phone, is_active, password } = req.body;

    const existingUser = await userModel.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: `User with ID ${id} not found.`,
        },
      });
    }

    // Validate role if updated
    let canonicalRole;
    if (role) {
      canonicalRole = userModel.normalizeRole(role);
      if (!VALID_ROLES.includes(canonicalRole)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: `Invalid role "${role}". Allowed roles: ${VALID_ROLES.join(', ')}.`,
          },
        });
      }
    }

    // Prevent self-deactivation
    if (is_active === false && parseInt(id, 10) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DEACTIVATE_SELF',
          message: 'You cannot deactivate your own account.',
        },
      });
    }

    let password_hash = undefined;
    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'WEAK_PASSWORD',
            message: 'Password must be at least 6 characters long.',
          },
        });
      }
      password_hash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await userModel.updateUser(id, {
      full_name,
      role: canonicalRole,
      phone,
      is_active,
      password_hash,
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id/status
 * Admin activates or deactivates a user account.
 */
const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Field "is_active" must be a boolean (true or false).',
        },
      });
    }

    // Prevent deactivating own account
    if (!is_active && parseInt(id, 10) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DEACTIVATE_SELF',
          message: 'You cannot deactivate your own account.',
        },
      });
    }

    const existing = await userModel.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: `User with ID ${id} not found.`,
        },
      });
    }

    const updated = await userModel.toggleUserStatus(id, is_active);

    return res.status(200).json({
      success: true,
      message: `User account has been ${is_active ? 'activated' : 'deactivated'}.`,
      user: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleStatus,
};
