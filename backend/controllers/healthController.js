/**
 * ============================================================================
 * Health Check & System Information Controller
 * Phase 15: Final Integration & Production Readiness
 * ============================================================================
 */

const os = require('os');
const { testConnection } = require('../config/db');

/**
 * GET /api/health
 * Returns service uptime, memory metrics, and live PostgreSQL connection state.
 */
const getHealth = async (req, res, next) => {
  try {
    const startTime = Date.now();
    const dbStatus = await testConnection();
    const responseTime = `${Date.now() - startTime}ms`;

    const status = dbStatus.connected ? 'healthy' : 'degraded';
    const httpCode = dbStatus.connected ? 200 : 200; // Return 200 for app health with degraded flag for resilient in-memory mode

    return res.status(httpCode).json({
      status,
      timestamp: new Date().toISOString(),
      service: 'Sri Meenakshi Agro & Traditional Foods ERP',
      version: '1.0.0',
      phase: 15,
      phaseTitle: 'Final Integration, Testing & Deployment',
      uptime: `${Math.floor(process.uptime())}s`,
      responseTime,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsageMb: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
      database: {
        status: dbStatus.connected ? 'connected' : 'in-memory-fallback',
        engine: 'PostgreSQL 15+ / Resilient In-Memory Dual Mode',
        targetDatabase: dbStatus.database || 'food_mfg_db',
        serverTime: dbStatus.serverTime || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/health/db
 * Dedicated database connectivity probe.
 */
const getDatabaseHealth = async (req, res, next) => {
  try {
    const dbStatus = await testConnection();
    return res.status(dbStatus.connected ? 200 : 503).json({
      connected: dbStatus.connected,
      database: dbStatus.database || 'food_mfg_db',
      serverTime: dbStatus.serverTime || null,
      dualMode: 'Resilient in-memory fallback active when PostgreSQL is offline',
      error: dbStatus.connected ? null : 'PostgreSQL offline or unreachable'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/info
 * Returns company profile, GST configuration baseline, and complete 15-module registry.
 */
const getInfo = async (req, res, next) => {
  try {
    return res.status(200).json({
      application: 'Order-to-Audit Management System',
      industry: 'South Indian Food Manufacturing (Idli/Dosa Batter, Ready-to-Cook Foods, Podis, Traditional Cold-Pressed Oils)',
      company: {
        name: process.env.COMPANY_NAME || 'Sri Meenakshi Agro & Traditional Foods Pvt Ltd',
        gstin: process.env.COMPANY_GSTIN || '33AAAAA0000A1Z5',
        stateCode: process.env.COMPANY_STATE_CODE || '33',
        stateName: process.env.COMPANY_STATE_NAME || 'Tamil Nadu',
        address: process.env.COMPANY_ADDRESS || 'Plot No. 42-B, SIDCO Industrial Estate, Kappalur, Madurai, TN - 625008',
        taxRules: {
          intrastate: 'CGST (2.5%) + SGST (2.5%) = 5% (Buyer State Code == 33)',
          interstate: 'IGST (5%) (Buyer State Code != 33)',
        },
      },
      roles: [
        'SALESMAN',
        'ADMIN',
        'PRODUCTION',
        'ACCOUNTANT',
        'OWNER',
      ],
      modules: [
        { id: 'phase1_setup', name: 'Project Architecture & Setup', phase: 1, status: 'completed' },
        { id: 'phase2_auth', name: 'Authentication & Role-Based Access Control', phase: 2, status: 'completed' },
        { id: 'phase3_master', name: 'Master Data (Products, Customers, Suppliers, RM, BOM)', phase: 3, status: 'completed' },
        { id: 'phase4_sales', name: 'Sales Order Management & Approvals', phase: 4, status: 'completed' },
        { id: 'phase5_purchase', name: 'Procurement & 3-Way Matching (PR, RFQ, PO, GRN)', phase: 5, status: 'completed' },
        { id: 'phase6_inventory', name: 'Perpetual Stock Ledger & FEFO Batch Expiry', phase: 6, status: 'completed' },
        { id: 'phase7_production', name: 'Manufacturing Execution & BOM Adherence', phase: 7, status: 'completed' },
        { id: 'phase8_quality', name: 'FSSAI Quality Control, Inspections & CAPA', phase: 8, status: 'completed' },
        { id: 'phase9_costing', name: 'Product Costing & Margin Analysis (Excl. GST)', phase: 9, status: 'completed' },
        { id: 'phase10_gst', name: 'GST Billing & Invoicing (TN CGST/SGST/IGST)', phase: 10, status: 'completed' },
        { id: 'phase11_dispatch', name: 'Dispatch & Logistics Turnaround', phase: 11, status: 'completed' },
        { id: 'phase12_payments', name: 'Cashflow, Receipts & Bank Reconciliation', phase: 12, status: 'completed' },
        { id: 'phase13_audit', name: 'Internal Audit & 5x5 Risk Matrix', phase: 13, status: 'completed' },
        { id: 'phase14_analytics', name: 'Executive Dashboard & Subsystem Analytics', phase: 14, status: 'completed' },
        { id: 'phase15_integration', name: 'Final Integration, Testing & Deployment', phase: 15, status: 'completed' },
      ],
      currentPhase: {
        phase: 15,
        title: 'Final Integration, Testing & Deployment',
        status: 'completed',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
  getDatabaseHealth,
  getInfo,
};
