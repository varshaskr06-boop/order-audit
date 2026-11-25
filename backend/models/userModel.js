/**
 * ============================================================================
 * User Model & Database Repository
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 * 
 * Provides database query functions for user management with automatic
 * table creation, role constraints, and resilient fallback handling.
 */

const { query, pool } = require('../config/db');

// Benchmark initial seed accounts
const INITIAL_USERS = [
  {
    id: 1,
    full_name: 'Meenakshi Sundaram',
    email: 'owner@meenakshifoods.in',
    password_hash: '$2a$10$YKKTtfmyvk/mueCoXfi/pOICYWrEnMbvU7rlhUYUQ7f71EC6TWV3S', // Owner@123
    role: 'OWNER',
    phone: '+91 98420 11111',
    is_active: true,
    created_at: new Date('2026-01-01T08:00:00Z'),
    updated_at: new Date('2026-01-01T08:00:00Z'),
  },
  {
    id: 2,
    full_name: 'Senthil Nathan',
    email: 'admin@meenakshifoods.in',
    password_hash: '$2a$10$ae2XZzi2.F.gJzDes8WzkeEtAM70KlhKIt/dshOqre/QMtYmOQ5uK', // Admin@123
    role: 'ADMIN',
    phone: '+91 98420 22222',
    is_active: true,
    created_at: new Date('2026-01-01T08:00:00Z'),
    updated_at: new Date('2026-01-01T08:00:00Z'),
  },
  {
    id: 3,
    full_name: 'Karthik Raja',
    email: 'sales@meenakshifoods.in',
    password_hash: '$2a$10$V.1pSZdHJBcqoLHtvAgFuOfKDMr7xFo7kUK.dDWaxda3fuCw.06my', // Sales@123
    role: 'SALESMAN',
    phone: '+91 98420 33333',
    is_active: true,
    created_at: new Date('2026-01-01T08:00:00Z'),
    updated_at: new Date('2026-01-01T08:00:00Z'),
  },
  {
    id: 4,
    full_name: 'Murugesan Velu',
    email: 'production@meenakshifoods.in',
    password_hash: '$2a$10$nVAvKTQl36O6fMfgwjg82u8UTT87tes/qTs/96Dr4xCbpfVQn3N3y', // Production@123
    role: 'PRODUCTION',
    phone: '+91 98420 44444',
    is_active: true,
    created_at: new Date('2026-01-01T08:00:00Z'),
    updated_at: new Date('2026-01-01T08:00:00Z'),
  },
  {
    id: 5,
    full_name: 'Radha Raman',
    email: 'auditor@meenakshifoods.in',
    password_hash: '$2a$10$MiA.Cj3Z9uVWYjafMFY48uUyiaznHldCsA8yBRjJUj.CLnrqdpFVu', // Auditor@123
    role: 'ACCOUNTANT',
    phone: '+91 98420 55555',
    is_active: true,
    created_at: new Date('2026-01-01T08:00:00Z'),
    updated_at: new Date('2026-01-01T08:00:00Z'),
  },
];

// In-memory user registry for seamless operation when PostgreSQL is not yet running
let memoryUsers = JSON.parse(JSON.stringify(INITIAL_USERS));
let nextMemoryId = 6;
let isPostgresAvailable = false;

/**
 * Initialize Users table in PostgreSQL if available, or initialize memory store
 */
const initUsersTable = async () => {
  try {
    const ddl = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(120) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(30) NOT NULL CHECK (
          UPPER(role) IN ('SALESMAN', 'ADMIN', 'PRODUCTION', 'ACCOUNTANT', 'OWNER')
        ),
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `;
    await query(ddl);

    // Check if table has users, if not, seed benchmark users
    const checkRes = await query('SELECT COUNT(*) FROM users');
    if (parseInt(checkRes.rows[0].count, 10) === 0) {
      for (const u of INITIAL_USERS) {
        await query(
          `INSERT INTO users (full_name, email, password_hash, role, phone, is_active)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (email) DO NOTHING`,
          [u.full_name, u.email, u.password_hash, u.role, u.phone, u.is_active]
        );
      }
      console.log('✅ [Users Table] Seeded initial benchmark accounts into PostgreSQL.');
    }
    isPostgresAvailable = true;
    console.log('✅ [Users Table] PostgreSQL table verified with role constraints & indexes.');
  } catch (error) {
    isPostgresAvailable = false;
    console.warn('ℹ️ [Users Table] PostgreSQL is offline. Using resilient in-memory User store.');
  }
};

/**
 * Normalize role to uppercase canonical form
 */
const normalizeRole = (role) => {
  if (!role) return 'SALESMAN';
  const upper = role.toUpperCase().trim();
  if (upper === 'SALES' || upper === 'SALESPERSON') return 'SALESMAN';
  if (upper.includes('PROD')) return 'PRODUCTION';
  if (upper.includes('ACC') || upper.includes('AUDIT')) return 'ACCOUNTANT';
  return upper;
};

/**
 * Find user by email (returns password_hash for authentication)
 */
const findByEmail = async (email) => {
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  if (isPostgresAvailable) {
    try {
      const res = await query(
        'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
        [cleanEmail]
      );
      if (res.rows.length > 0) {
        const u = res.rows[0];
        u.role = normalizeRole(u.role);
        return u;
      }
    } catch (e) {
      console.warn('DB read failed, falling back to memory:', e.message);
    }
  }

  // Fallback to memory store
  const found = memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
  return found ? { ...found, role: normalizeRole(found.role) } : null;
};

/**
 * Find user by ID (excludes password_hash for safety)
 */
const findById = async (id) => {
  const numericId = parseInt(id, 10);
  if (isPostgresAvailable) {
    try {
      const res = await query(
        'SELECT id, full_name, email, role, phone, is_active, created_at, updated_at FROM users WHERE id = $1',
        [numericId]
      );
      if (res.rows.length > 0) {
        const u = res.rows[0];
        u.role = normalizeRole(u.role);
        return u;
      }
    } catch (e) {
      console.warn('DB read failed, falling back to memory:', e.message);
    }
  }

  const found = memoryUsers.find((u) => u.id === numericId);
  if (!found) return null;
  const { password_hash, ...safeUser } = found;
  return { ...safeUser, role: normalizeRole(safeUser.role) };
};

/**
 * Get all users (excludes password_hash)
 */
const getAllUsers = async () => {
  if (isPostgresAvailable) {
    try {
      const res = await query(
        'SELECT id, full_name, email, role, phone, is_active, created_at, updated_at FROM users ORDER BY id ASC'
      );
      return res.rows.map((u) => ({ ...u, role: normalizeRole(u.role) }));
    } catch (e) {
      console.warn('DB read failed, falling back to memory:', e.message);
    }
  }

  return memoryUsers.map(({ password_hash, ...u }) => ({
    ...u,
    role: normalizeRole(u.role),
  }));
};

/**
 * Create a new user
 */
const createUser = async ({ full_name, email, password_hash, role, phone = null, is_active = true }) => {
  const canonicalRole = normalizeRole(role);
  const cleanEmail = email.trim().toLowerCase();

  if (isPostgresAvailable) {
    try {
      const res = await query(
        `INSERT INTO users (full_name, email, password_hash, role, phone, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, full_name, email, role, phone, is_active, created_at, updated_at`,
        [full_name.trim(), cleanEmail, password_hash, canonicalRole, phone, is_active]
      );
      return { ...res.rows[0], role: canonicalRole };
    } catch (e) {
      console.warn('DB insert failed, falling back to memory:', e.message);
    }
  }

  const newUser = {
    id: nextMemoryId++,
    full_name: full_name.trim(),
    email: cleanEmail,
    password_hash,
    role: canonicalRole,
    phone,
    is_active: is_active !== false,
    created_at: new Date(),
    updated_at: new Date(),
  };
  memoryUsers.push(newUser);
  const { password_hash: _, ...safeUser } = newUser;
  return safeUser;
};

/**
 * Update an existing user
 */
const updateUser = async (id, { full_name, role, phone, is_active, password_hash }) => {
  const numericId = parseInt(id, 10);
  const canonicalRole = role ? normalizeRole(role) : undefined;

  if (isPostgresAvailable) {
    try {
      let sql;
      let params;
      if (password_hash) {
        sql = `
          UPDATE users 
          SET full_name = COALESCE($1, full_name),
              role = COALESCE($2, role),
              phone = COALESCE($3, phone),
              is_active = COALESCE($4, is_active),
              password_hash = $5,
              updated_at = NOW()
          WHERE id = $6
          RETURNING id, full_name, email, role, phone, is_active, created_at, updated_at
        `;
        params = [full_name, canonicalRole, phone, is_active, password_hash, numericId];
      } else {
        sql = `
          UPDATE users 
          SET full_name = COALESCE($1, full_name),
              role = COALESCE($2, role),
              phone = COALESCE($3, phone),
              is_active = COALESCE($4, is_active),
              updated_at = NOW()
          WHERE id = $5
          RETURNING id, full_name, email, role, phone, is_active, created_at, updated_at
        `;
        params = [full_name, canonicalRole, phone, is_active, numericId];
      }
      const res = await query(sql, params);
      if (res.rows.length > 0) {
        return { ...res.rows[0], role: normalizeRole(res.rows[0].role) };
      }
    } catch (e) {
      console.warn('DB update failed, falling back to memory:', e.message);
    }
  }

  const idx = memoryUsers.findIndex((u) => u.id === numericId);
  if (idx === -1) return null;

  if (full_name !== undefined) memoryUsers[idx].full_name = full_name.trim();
  if (canonicalRole !== undefined) memoryUsers[idx].role = canonicalRole;
  if (phone !== undefined) memoryUsers[idx].phone = phone;
  if (is_active !== undefined) memoryUsers[idx].is_active = is_active;
  if (password_hash) memoryUsers[idx].password_hash = password_hash;
  memoryUsers[idx].updated_at = new Date();

  const { password_hash: _, ...safeUser } = memoryUsers[idx];
  return safeUser;
};

/**
 * Toggle user active/inactive status
 */
const toggleUserStatus = async (id, is_active) => {
  return updateUser(id, { is_active });
};

module.exports = {
  initUsersTable,
  findByEmail,
  findById,
  getAllUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  normalizeRole,
  INITIAL_USERS,
};
