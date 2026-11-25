/**
 * ============================================================================
 * Database Connection Pool Configuration
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 * 
 * This module manages the connection pool to PostgreSQL using the 'pg' library.
 * Using a connection pool ensures high throughput and avoids opening a new
 * TCP connection for every incoming HTTP request.
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Pool configuration using environment variables or connection string
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'food_mfg_db',
      max: 20, // Max concurrent connections in pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // Return an error after 5s if connection cannot be made
    };

const pool = new Pool(poolConfig);

// Handle idle client connection errors to prevent process crashing
pool.on('error', (err, client) => {
  console.error('⚠️ [Database Pool Error] Unexpected idle client error:', err.message);
});

/**
 * Execute a parameterized SQL query
 * @param {string} text - SQL statement (with $1, $2 placeholders)
 * @param {Array} params - Array of parameter values to prevent SQL injection
 * @returns {Promise<Object>} Query result object
 */
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      // Log slow queries (>100ms) or detailed debug info
      if (duration > 100) {
        console.warn(`⏳ [Slow Query] (${duration}ms): ${text.substring(0, 80)}...`);
      }
    }
    return res;
  } catch (error) {
    console.error(`❌ [DB Query Failed]:`, {
      query: text.substring(0, 100),
      error: error.message,
    });
    throw error;
  }
};

/**
 * Acquire a dedicated client for executing multi-statement transactions.
 * Transactions (BEGIN, COMMIT, ROLLBACK) are mandatory for:
 * 1. Stock ledger balance updates
 * 2. Production material issues & batch output
 * 3. Sales order confirmation & inventory allocation
 * 4. Invoicing and payment postings
 * 
 * Always release the client in a finally block!
 * 
 * Example:
 *   const client = await getClient();
 *   try {
 *     await client.query('BEGIN');
 *     // ... transactional queries
 *     await client.query('COMMIT');
 *   } catch(e) {
 *     await client.query('ROLLBACK');
 *     throw e;
 *   } finally {
 *     client.release();
 *   }
 */
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Test the database connectivity for health checks
 * @returns {Promise<Object>} Health check diagnostic data
 */
const testConnection = async () => {
  try {
    const res = await pool.query(
      'SELECT NOW() AS server_time, current_database() AS database_name, version() AS version'
    );
    return {
      connected: true,
      serverTime: res.rows[0].server_time,
      database: res.rows[0].database_name,
      postgresVersion: res.rows[0].version,
      config: {
        host: poolConfig.host || 'remote-url',
        port: poolConfig.port || 5432,
        user: poolConfig.user || 'configured',
      },
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      config: {
        host: poolConfig.host || 'remote-url',
        port: poolConfig.port || 5432,
        user: poolConfig.user || 'configured',
        database: poolConfig.database || 'food_mfg_db',
      },
    };
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};
