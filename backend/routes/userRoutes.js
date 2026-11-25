/**
 * ============================================================================
 * User Management Routes (Admin & Owner)
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleStatus,
} = require('../controllers/userController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// All user management routes require valid JWT and either ADMIN or OWNER role
router.use(authenticateToken);
router.use(requireRoles('ADMIN', 'OWNER'));

router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.patch('/:id/status', toggleStatus);

module.exports = router;
