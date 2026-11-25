/**
 * ============================================================================
 * Main Server Entry Point
 * Order-to-Audit Management System (South Indian Food Manufacturing)
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection } = require('./config/db');
const { initUsersTable } = require('./models/userModel');
const { initMasterTables } = require('./models/masterDataModel');
const { initSalesOrderTables } = require('./models/salesOrderModel');
const { initPurchaseTables } = require('./models/purchaseModel');
const { initInventoryTables } = require('./models/inventoryModel');
const { initProductionTables } = require('./models/productionModel');
const { initQualityTables } = require('./models/qualityModel');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleTestRoutes = require('./routes/roleTestRoutes');
const masterDataRoutes = require('./routes/masterDataRoutes');
const salesOrderRoutes = require('./routes/salesOrderRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const productionRoutes = require('./routes/productionRoutes');
const qualityRoutes = require('./routes/qualityRoutes');
const costingRoutes = require('./routes/costingRoutes');
const { initCostingTables } = require('./models/costingModel');
const invoicingRoutes = require('./routes/invoicingRoutes');
const { initInvoicingTables } = require('./models/invoicingModel');
const dispatchRoutes = require('./routes/dispatchRoutes');
const { initDispatchTables } = require('./models/dispatchModel');
const paymentRoutes = require('./routes/paymentRoutes');
const { initPaymentTables } = require('./models/paymentModel');
const auditRoutes = require('./routes/auditRoutes');
const { initAuditTables } = require('./models/auditModel');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { initAnalyticsTables } = require('./models/analyticsModel');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Enable CORS for frontend development and configurable production origins
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*';
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// In-Memory Rate Limiter Middleware for Auth Protection
const loginAttempts = new Map();
const rateLimitWindowMs = 60 * 1000;
const maxLoginAttempts = 60; // Up to 60 attempts per min per IP to accommodate automated test suites

const authRateLimiter = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const clientData = loginAttempts.get(ip) || { count: 0, resetTime: now + rateLimitWindowMs };

  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + rateLimitWindowMs;
  } else {
    clientData.count++;
  }
  loginAttempts.set(ip, clientData);

  if (clientData.count > maxLoginAttempts) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many login requests. Please try again in one minute.',
      },
    });
  }
  next();
};

app.use('/api/auth/login', authRateLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    console.log(
      `${logColor}[${req.method}]\x1b[0m ${req.originalUrl} - ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Sri Meenakshi Agro & Traditional Foods ERP API',
    company: process.env.COMPANY_NAME,
    state: `${process.env.COMPANY_STATE_NAME} (GST State Code: ${process.env.COMPANY_STATE_CODE})`,
    docs: {
      healthCheck: '/api/health',
      systemInfo: '/api/info',
    },
  });
});

// Mount API routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleTestRoutes);
app.use('/api/master', masterDataRoutes);
app.use('/api/sales', salesOrderRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/costing', costingRoutes);
app.use('/api/invoicing', invoicingRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// Start HTTP Server
const server = app.listen(PORT, async () => {
  console.log('\n================================================================');
  console.log('🚀 SRI MEENAKSHI AGRO & TRADITIONAL FOODS ERP BACKEND');
  console.log('================================================================');
  console.log(`📡 Server listening on port : ${PORT}`);
  console.log(`🌐 Base URL                 : http://localhost:${PORT}`);
  console.log(`🩺 Health Check Endpoint    : http://localhost:${PORT}/api/health`);
  console.log(`📋 System Info Endpoint     : http://localhost:${PORT}/api/info`);
  console.log('----------------------------------------------------------------');

  // Verify PostgreSQL connection on startup
  const dbStatus = await testConnection();
  if (dbStatus.connected) {
    console.log(`✅ [Database] PostgreSQL CONNECTED successfully!`);
    console.log(`   - Database: ${dbStatus.database}`);
    console.log(`   - Server Time: ${dbStatus.serverTime}`);
  } else {
    console.log(`⚠️ [Database] PostgreSQL is currently NOT reachable.`);
    console.log(`   - Error: ${dbStatus.error}`);
    console.log(`   - Target Host: ${dbStatus.config.host}:${dbStatus.config.port}`);
    console.log(`   - Target DB: ${dbStatus.config.database}`);
    console.log(`   💡 NOTE: Start PostgreSQL or update backend/.env credentials.`);
    console.log(`   The Health Check API (/api/health) will dynamically reflect DB status.`);
  }
  // Initialize user tables and check schema constraints
  await initUsersTable();
  await initMasterTables();
  await initSalesOrderTables();
  await initPurchaseTables();
  await initInventoryTables();
  await initProductionTables();
  await initQualityTables();
  await initCostingTables();
  await initInvoicingTables();
  await initDispatchTables();
  await initPaymentTables();
  await initAuditTables();
  await initAnalyticsTables();
  console.log('================================================================\n');
});

// Handle graceful shutdown
const gracefulShutdown = () => {
  console.log('\n🛑 Received kill signal, shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = app;
