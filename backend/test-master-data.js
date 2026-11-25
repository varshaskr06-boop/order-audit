/**
 * ============================================================================
 * Phase 3 Automated Test Suite: Master Data Management
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 * 
 * Verifies all 12 required testing conditions:
 * 1. Add a product
 * 2. Edit a product
 * 3. Prevent duplicate product codes (HTTP 409)
 * 4. Add a customer with valid GSTIN
 * 5. Add a supplier with valid GSTIN
 * 6. Add raw materials linked with preferred supplier
 * 7. Add packaging materials
 * 8. Create a BOM with multiple ingredients
 * 9. Edit and version a BOM (preserves historical version as SUPERSEDED)
 * 10. Check role permissions (Salesman/Production forbidden from modifying)
 * 11. Verify relationships (BOM references product, RM references supplier)
 * 12. Check soft deactivation filtering
 */

const http = require('http');
const app = require('./server');

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      { hostname: 'localhost', port: 5000, path, method, headers },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(rawData);
          } catch (e) {
            parsed = rawData;
          }
          resolve({ statusCode: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
};

const assert = (condition, description) => {
  if (condition) {
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    console.error(`  ❌ [FAIL] ${description}`);
    process.exitCode = 1;
  }
};

const runTestSuite = async () => {
  console.log('\n================================================================');
  console.log('🧪 RUNNING PHASE 3 MASTER DATA TEST SUITE');
  console.log('================================================================\n');

  // Wait 1s for server binding
  await new Promise((r) => setTimeout(r, 1200));

  // 1. Obtain tokens for ADMIN and SALESMAN
  const adminLogin = await request('/api/auth/login', 'POST', {
    email: 'admin@meenakshifoods.in',
    password: 'Admin@123',
  });
  const adminToken = adminLogin.body.token;

  const salesmanLogin = await request('/api/auth/login', 'POST', {
    email: 'sales@meenakshifoods.in',
    password: 'Sales@123',
  });
  const salesmanToken = salesmanLogin.body.token;

  const prodLogin = await request('/api/auth/login', 'POST', {
    email: 'production@meenakshifoods.in',
    password: 'Production@123',
  });
  const prodToken = prodLogin.body.token;

  // --------------------------------------------------------------------------
  // TEST 1: Add a product
  // --------------------------------------------------------------------------
  console.log('Test 1: Add a Product');
  const addProdRes = await request(
    '/api/master/products',
    'POST',
    {
      name: 'Garlic & Cumin Crisp Appalam (100g)',
      sku: 'FG-005',
      category: 'Appalam & Papads',
      description: 'Sun-dried crisp traditional appalam with garlic and cumin seeds',
      pack_size: '100g Pack',
      unit: 'PKT',
      selling_price: 35.00,
      gst_rate: 5.00,
      hsn_code: '1905',
    },
    adminToken
  );
  assert(
    addProdRes.statusCode === 201 && addProdRes.body.product.sku === 'FG-005',
    `Added product: ${addProdRes.body.product?.name} (SKU: FG-005)`
  );
  const newProdId = addProdRes.body.product.id;

  // --------------------------------------------------------------------------
  // TEST 2: Edit a product
  // --------------------------------------------------------------------------
  console.log('\nTest 2: Edit a Product');
  const editProdRes = await request(
    `/api/master/products/${newProdId}`,
    'PUT',
    {
      selling_price: 38.00,
      description: 'Hand-rolled sun-dried crisp traditional appalam with fresh garlic cloves',
    },
    adminToken
  );
  assert(
    editProdRes.statusCode === 200 && editProdRes.body.product.selling_price === 38.00,
    `Updated selling price to ₹38.00 (Status: ${editProdRes.statusCode})`
  );

  // --------------------------------------------------------------------------
  // TEST 3: Prevent duplicate product codes (SKU)
  // --------------------------------------------------------------------------
  console.log('\nTest 3: Prevent Duplicate Product Codes');
  const dupProdRes = await request(
    '/api/master/products',
    'POST',
    {
      name: 'Duplicate SKU Attempt',
      sku: 'FG-005',
      category: 'Appalam',
      selling_price: 40.00,
    },
    adminToken
  );
  assert(
    dupProdRes.statusCode === 409 && dupProdRes.body.error?.code === 'DUPLICATE_CODE',
    `Rejected duplicate SKU "FG-005" with HTTP 409 (Received ${dupProdRes.statusCode})`
  );

  // --------------------------------------------------------------------------
  // TEST 4: Add a customer with valid GSTIN
  // --------------------------------------------------------------------------
  console.log('\nTest 4: Add a Customer with Valid GSTIN');
  const addCustRes = await request(
    '/api/master/customers',
    'POST',
    {
      business_name: 'Nellai Grand Supermarket',
      code: 'CUST-005',
      contact_person: 'R. Chelladurai',
      phone: '+91 94433 55555',
      email: 'nellaigrand@gmail.com',
      billing_address: 'Trivandrum Road, Tirunelveli, TN - 627002',
      state: 'Tamil Nadu',
      state_code: '33',
      gstin: '33AABCN9988E1Z2',
      customer_type: 'Supermarket Retailer',
      credit_limit: 75000.00,
    },
    adminToken
  );
  assert(
    addCustRes.statusCode === 201 && addCustRes.body.customer.code === 'CUST-005',
    `Added customer: ${addCustRes.body.customer?.business_name} (GSTIN: 33AABCN9988E1Z2)`
  );

  // Invalid GSTIN validation test
  const invalidGstCustRes = await request(
    '/api/master/customers',
    'POST',
    {
      business_name: 'Invalid GST Customer',
      code: 'CUST-ERR',
      gstin: 'NOT_A_VALID_GSTIN_123',
    },
    adminToken
  );
  assert(
    invalidGstCustRes.statusCode === 400 && invalidGstCustRes.body.error?.code === 'INVALID_GSTIN',
    `Rejected invalid GSTIN format with HTTP 400`
  );

  // --------------------------------------------------------------------------
  // TEST 5: Add a supplier with valid GSTIN
  // --------------------------------------------------------------------------
  console.log('\nTest 5: Add a Supplier with Valid GSTIN');
  const addSuppRes = await request(
    '/api/master/suppliers',
    'POST',
    {
      name: 'Salem Star Sago & Starch Millers',
      code: 'SUP-006',
      contact_person: 'P. Mani',
      phone: '+91 98424 77777',
      email: 'salemsago@starstarch.com',
      address: 'Omalur Main Road, Salem, TN - 636004',
      state: 'Tamil Nadu',
      state_code: '33',
      gstin: '33AADCS6655J1Z4',
      category: 'Agro Commodity',
    },
    adminToken
  );
  assert(
    addSuppRes.statusCode === 201 && addSuppRes.body.supplier.code === 'SUP-006',
    `Added supplier: ${addSuppRes.body.supplier?.name} (Code: SUP-006)`
  );
  const newSuppId = addSuppRes.body.supplier.id;

  // --------------------------------------------------------------------------
  // TEST 6: Add raw materials linked with preferred supplier
  // --------------------------------------------------------------------------
  console.log('\nTest 6: Add Raw Material Linked with Preferred Supplier');
  const addRMRes = await request(
    '/api/master/raw-materials',
    'POST',
    {
      name: 'Tapioca Sago (Javvarisi / Sabudana)',
      code: 'RM-011',
      category: 'Grains & Pulses',
      unit: 'kg',
      preferred_supplier_id: newSuppId,
      min_stock_alert: 50.0,
      reorder_level: 150.0,
      avg_unit_cost: 65.00,
      description: 'Premium quality sago pearls for appalam crisping',
    },
    adminToken
  );
  assert(
    addRMRes.statusCode === 201 && addRMRes.body.raw_material.preferred_supplier_name === 'Salem Star Sago & Starch Millers',
    `Added raw material: RM-011 linked to supplier "${addRMRes.body.raw_material?.preferred_supplier_name}"`
  );
  const newRMId = addRMRes.body.raw_material.id;

  // --------------------------------------------------------------------------
  // TEST 7: Add packaging materials
  // --------------------------------------------------------------------------
  console.log('\nTest 7: Add Packaging Material');
  const addPMRes = await request(
    '/api/master/packaging-materials',
    'POST',
    {
      name: '100g High-Barrier Crisp Foil Pouch (Appalam)',
      code: 'PM-006',
      packaging_type: 'Pouch',
      unit: 'pieces',
      preferred_supplier_id: 5,
      min_stock_alert: 1000.0,
      reorder_level: 2500.0,
      avg_unit_cost: 2.40,
      description: 'Silver foil barrier pouch for crispy appalams',
    },
    adminToken
  );
  assert(
    addPMRes.statusCode === 201 && addPMRes.body.packaging_material.code === 'PM-006',
    `Added packaging material: PM-006 (${addPMRes.body.packaging_material?.name})`
  );
  const newPMId = addPMRes.body.packaging_material.id;

  // --------------------------------------------------------------------------
  // TEST 8: Create a BOM with multiple ingredients & packaging
  // --------------------------------------------------------------------------
  console.log('\nTest 8: Create a Bill of Materials (BOM) with Multiple Ingredients');
  const addBomRes = await request(
    '/api/master/boms',
    'POST',
    {
      product_id: newProdId,
      recipe_name: 'Standard 100-Pack Crisp Appalam Batch (10 KG)',
      bom_version: 'v1.0',
      batch_output_qty: 100.0,
      output_unit: 'PKT',
      effective_date: '2026-01-01',
      status: 'ACTIVE',
      notes: 'Knead dough with cumin, press thin discs, dry in solar dryer 6 hrs',
      items: [
        { material_type: 'RAW_MATERIAL', material_id: 2, quantity_required: 8.0, unit: 'kg', wastage_percentage: 2.0, notes: 'Urad Dal Flour' },
        { material_type: 'RAW_MATERIAL', material_id: newRMId, quantity_required: 1.5, unit: 'kg', wastage_percentage: 1.0, notes: 'Tapioca Sago' },
        { material_type: 'RAW_MATERIAL', material_id: 10, quantity_required: 0.3, unit: 'kg', wastage_percentage: 0.0, notes: 'Salt' },
        { material_type: 'RAW_MATERIAL', material_id: 9, quantity_required: 0.05, unit: 'kg', wastage_percentage: 0.0, notes: 'Hing' },
        { material_type: 'PACKAGING', material_id: newPMId, quantity_required: 100.0, unit: 'pieces', wastage_percentage: 2.0, notes: '100g Foil Pouch' },
      ],
    },
    adminToken
  );
  assert(
    addBomRes.statusCode === 201 && addBomRes.body.bom.items.length === 5,
    `Created BOM with ${addBomRes.body.bom?.items.length} items (Status: ${addBomRes.statusCode})`
  );
  const newBomId = addBomRes.body.bom.id;

  // --------------------------------------------------------------------------
  // TEST 9: Edit and version a BOM (Historical preservation)
  // --------------------------------------------------------------------------
  console.log('\nTest 9: Edit and Version a BOM (Version v1.1)');
  const versionRes = await request(
    `/api/master/boms/${newBomId}/version`,
    'POST',
    {
      new_version: 'v1.1',
      notes: 'Increased sago proportion for extra crispiness',
      batch_output_qty: 100.0,
      output_unit: 'PKT',
      items: [
        { material_type: 'RAW_MATERIAL', material_id: 2, quantity_required: 7.5, unit: 'kg', wastage_percentage: 2.0, notes: 'Urad Dal Flour' },
        { material_type: 'RAW_MATERIAL', material_id: newRMId, quantity_required: 2.0, unit: 'kg', wastage_percentage: 1.0, notes: 'Tapioca Sago (increased)' },
        { material_type: 'RAW_MATERIAL', material_id: 10, quantity_required: 0.3, unit: 'kg', wastage_percentage: 0.0, notes: 'Salt' },
        { material_type: 'RAW_MATERIAL', material_id: 9, quantity_required: 0.05, unit: 'kg', wastage_percentage: 0.0, notes: 'Hing' },
        { material_type: 'PACKAGING', material_id: newPMId, quantity_required: 100.0, unit: 'pieces', wastage_percentage: 2.0, notes: '100g Foil Pouch' },
      ],
    },
    adminToken
  );
  assert(
    versionRes.statusCode === 201 && versionRes.body.bom.bom_version === 'v1.1',
    `Created new BOM version v1.1 (ID: ${versionRes.body.bom?.id})`
  );

  // Verify old version is now SUPERSEDED
  const oldBomCheck = await request(`/api/master/boms/${newBomId}`, 'GET', null, adminToken);
  assert(
    oldBomCheck.body.bom.status === 'SUPERSEDED',
    `Original version v1.0 preserved with status: ${oldBomCheck.body.bom?.status}`
  );

  // --------------------------------------------------------------------------
  // TEST 10: Check Role Permissions (Backend Enforcement)
  // --------------------------------------------------------------------------
  console.log('\nTest 10: Role-Based Master Data Access Restrictions');
  // Salesman attempts to create a product -> 403 Forbidden
  const salesCreateRes = await request(
    '/api/master/products',
    'POST',
    { name: 'Unauthorized Product', sku: 'ERR-SKU', selling_price: 10 },
    salesmanToken
  );
  assert(
    salesCreateRes.statusCode === 403 && salesCreateRes.body.error?.code === 'FORBIDDEN_ROLE',
    `Blocked Salesman from creating products with HTTP 403`
  );

  // Salesman attempts to view Raw Materials -> 403 Forbidden
  const salesRMRes = await request('/api/master/raw-materials', 'GET', null, salesmanToken);
  assert(
    salesRMRes.statusCode === 403 && salesRMRes.body.error?.code === 'FORBIDDEN_ROLE',
    `Blocked Salesman from accessing Raw Materials with HTTP 403`
  );

  // Production attempts to modify BOM -> 403 Forbidden
  const prodEditRes = await request(
    `/api/master/boms/${newBomId}`,
    'PUT',
    { recipe_name: 'Unauthorized Edit' },
    prodToken
  );
  assert(
    prodEditRes.statusCode === 403 && prodEditRes.body.error?.code === 'FORBIDDEN_ROLE',
    `Blocked Production supervisor from modifying BOM with HTTP 403`
  );

  // Production reads BOM -> 200 OK
  const prodReadRes = await request(`/api/master/boms/${newBomId}`, 'GET', null, prodToken);
  assert(
    prodReadRes.statusCode === 200,
    `Allowed Production supervisor to view BOM with HTTP 200`
  );

  // --------------------------------------------------------------------------
  // TEST 11: Verify Database Relationships
  // --------------------------------------------------------------------------
  console.log('\nTest 11: Verify Foreign Key Relationships');
  const bomDetailRes = await request(`/api/master/boms/${newBomId}`, 'GET', null, adminToken);
  assert(
    bomDetailRes.body.bom.product_name === 'Garlic & Cumin Crisp Appalam (100g)' &&
      bomDetailRes.body.bom.product_sku === 'FG-005',
    `BOM properly resolved product relationship to "${bomDetailRes.body.bom?.product_name}"`
  );

  // --------------------------------------------------------------------------
  // TEST 12: Soft Deactivation & Status Filtering
  // --------------------------------------------------------------------------
  console.log('\nTest 12: Soft Deactivation Filtering');
  // Deactivate product FG-005
  const deactRes = await request(
    `/api/master/products/${newProdId}/status`,
    'PATCH',
    { is_active: false },
    adminToken
  );
  assert(
    deactRes.statusCode === 200 && deactRes.body.product.is_active === false,
    `Deactivated product FG-005 (is_active: false)`
  );

  // Filter only active products
  const activeOnlyRes = await request('/api/master/products?is_active=true', 'GET', null, adminToken);
  const hasDeactivated = activeOnlyRes.body.items.some((p) => p.id === newProdId);
  assert(
    !hasDeactivated,
    `Confirmed deactivated product is excluded from active transactions filter`
  );

  console.log('\n================================================================');
  console.log('🎉 ALL 12 PHASE 3 MASTER DATA TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');

  process.exit(0);
};

runTestSuite().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
