/**
 * ============================================================================
 * Master Data Routes (with Role-Based Access Control)
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 * 
 * Permissions Matrix:
 * - ADMIN: Full access (GET, POST, PUT, PATCH) on all master data.
 * - OWNER: Full read & management access.
 * - SALESMAN: Read-only access to active Products & Customers.
 * - PRODUCTION: Read-only access to Products, Raw Materials, Packaging, & BOM.
 * - ACCOUNTANT: Read-only access to Products, Customers, & Suppliers.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');
const c = require('../controllers/masterDataController');

// All master data routes require a valid JWT
router.use(authenticateToken);

// ============================================================================
// 1. PRODUCTS
// Read: ADMIN, OWNER, SALESMAN, PRODUCTION, ACCOUNTANT
// Write: ADMIN, OWNER
// ============================================================================
router.get('/products', requireRoles('ADMIN', 'OWNER', 'SALESMAN', 'PRODUCTION', 'ACCOUNTANT'), c.listProducts);
router.get('/products/:id', requireRoles('ADMIN', 'OWNER', 'SALESMAN', 'PRODUCTION', 'ACCOUNTANT'), c.getProduct);
router.post('/products', requireRoles('ADMIN', 'OWNER'), c.addProduct);
router.put('/products/:id', requireRoles('ADMIN', 'OWNER'), c.editProduct);
router.patch('/products/:id/status', requireRoles('ADMIN', 'OWNER'), c.toggleProduct);

// ============================================================================
// 2. CUSTOMERS
// Read: ADMIN, OWNER, SALESMAN, ACCOUNTANT
// Write: ADMIN, OWNER
// ============================================================================
router.get('/customers', requireRoles('ADMIN', 'OWNER', 'SALESMAN', 'ACCOUNTANT'), c.listCustomers);
router.get('/customers/:id', requireRoles('ADMIN', 'OWNER', 'SALESMAN', 'ACCOUNTANT'), c.getCustomer);
router.post('/customers', requireRoles('ADMIN', 'OWNER'), c.addCustomer);
router.put('/customers/:id', requireRoles('ADMIN', 'OWNER'), c.editCustomer);
router.patch('/customers/:id/status', requireRoles('ADMIN', 'OWNER'), c.toggleCustomer);

// ============================================================================
// 3. SUPPLIERS
// Read: ADMIN, OWNER, ACCOUNTANT
// Write: ADMIN, OWNER
// ============================================================================
router.get('/suppliers', requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'), c.listSuppliers);
router.get('/suppliers/:id', requireRoles('ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'), c.getSupplier);
router.post('/suppliers', requireRoles('ADMIN', 'OWNER'), c.addSupplier);
router.put('/suppliers/:id', requireRoles('ADMIN', 'OWNER'), c.editSupplier);
router.patch('/suppliers/:id/status', requireRoles('ADMIN', 'OWNER'), c.toggleSupplier);

// ============================================================================
// 4. RAW MATERIALS
// Read: ADMIN, OWNER, PRODUCTION
// Write: ADMIN, OWNER
// ============================================================================
router.get('/raw-materials', requireRoles('ADMIN', 'OWNER', 'PRODUCTION'), c.listRawMaterials);
router.get('/raw-materials/:id', requireRoles('ADMIN', 'OWNER', 'PRODUCTION'), c.getRawMaterial);
router.post('/raw-materials', requireRoles('ADMIN', 'OWNER'), c.addRawMaterial);
router.put('/raw-materials/:id', requireRoles('ADMIN', 'OWNER'), c.editRawMaterial);
router.patch('/raw-materials/:id/status', requireRoles('ADMIN', 'OWNER'), c.toggleRawMaterial);

// ============================================================================
// 5. PACKAGING MATERIALS
// Read: ADMIN, OWNER, PRODUCTION
// Write: ADMIN, OWNER
// ============================================================================
router.get('/packaging-materials', requireRoles('ADMIN', 'OWNER', 'PRODUCTION'), c.listPackagingMaterials);
router.get('/packaging-materials/:id', requireRoles('ADMIN', 'OWNER', 'PRODUCTION'), c.getPackagingMaterial);
router.post('/packaging-materials', requireRoles('ADMIN', 'OWNER'), c.addPackagingMaterial);
router.put('/packaging-materials/:id', requireRoles('ADMIN', 'OWNER'), c.editPackagingMaterial);
router.patch('/packaging-materials/:id/status', requireRoles('ADMIN', 'OWNER'), c.togglePackagingMaterial);

// ============================================================================
// 6. BILL OF MATERIALS (BOM)
// Read: ADMIN, OWNER, PRODUCTION
// Write: ADMIN, OWNER
// ============================================================================
router.get('/boms', requireRoles('ADMIN', 'OWNER', 'PRODUCTION'), c.listBoms);
router.get('/boms/:id', requireRoles('ADMIN', 'OWNER', 'PRODUCTION'), c.getBom);
router.post('/boms', requireRoles('ADMIN', 'OWNER'), c.addBom);
router.put('/boms/:id', requireRoles('ADMIN', 'OWNER'), c.editBom);
router.post('/boms/:id/version', requireRoles('ADMIN', 'OWNER'), c.createNewBomVersion);
router.patch('/boms/:id/status', requireRoles('ADMIN', 'OWNER'), c.toggleBom);

module.exports = router;
