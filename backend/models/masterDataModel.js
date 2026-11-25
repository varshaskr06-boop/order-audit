/**
 * ============================================================================
 * Master Data Model & Repository
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 * 
 * Provides unified data access for:
 * 1. Products (Finished Goods)
 * 2. Customers
 * 3. Suppliers
 * 4. Raw Materials
 * 5. Packaging Materials
 * 6. Bill of Materials (BOM Headers & Items)
 */

const { query } = require('../config/db');

// Benchmark Master Data for South Indian Food Manufacturing
const INITIAL_SUPPLIERS = [
  { id: 1, code: 'SUP-001', name: 'Kaveri Delta Agro Millers', contact_person: 'M. Shanmugam', phone: '+91 94431 10001', email: 'sales@kaveriagro.com', address: 'Rice Mill Road, Thanjavur, TN - 613001', state: 'Tamil Nadu', state_code: '33', gstin: '33AABCK1234F1Z1', category: 'Grains & Pulses', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 2, code: 'SUP-002', name: 'Guntur Dal & Pulses Syndicate', contact_person: 'V. Venkatesh', phone: '+91 98480 20002', email: 'orders@gunturdal.com', address: 'Market Yard, Guntur, AP - 522004', state: 'Andhra Pradesh', state_code: '37', gstin: '37AABCG5678K1Z3', category: 'Grains & Pulses', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 3, code: 'SUP-003', name: 'Erode Turmeric & Spice Traders', contact_person: 'K. Arumugam', phone: '+91 98427 30003', email: 'erodespices@gmail.com', address: 'Perundurai Road, Erode, TN - 638011', state: 'Tamil Nadu', state_code: '33', gstin: '33AADCE9012M1Z8', category: 'Spices & Seasoning', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 4, code: 'SUP-004', name: 'Aavin / TN Milk Producers Fed', contact_person: 'Dairy Division', phone: '+91 44234 40004', email: 'ghee@aavin.tn.gov.in', address: 'Pasumalai, Madurai, TN - 625004', state: 'Tamil Nadu', state_code: '33', gstin: '33AAACT0890Q1Z2', category: 'Dairy & Ghee', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 5, code: 'SUP-005', name: 'Sri Balaji Flexible Packaging Ltd', contact_person: 'R. Balaji', phone: '+91 98410 50005', email: 'balaji@sbpack.in', address: 'Sipcot Phase 2, Hosur, TN - 635130', state: 'Tamil Nadu', state_code: '33', gstin: '33AACCS3321L1Z0', category: 'Packaging Materials', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
];

const INITIAL_CUSTOMERS = [
  { id: 1, code: 'CUST-001', business_name: 'Nilgiris Supermarket - Anna Nagar', contact_person: 'P. Selvam', phone: '+91 98400 90001', email: 'annanagar@nilgiris.in', billing_address: '2nd Avenue, Anna Nagar, Chennai, TN - 600040', shipping_address: '2nd Avenue, Anna Nagar, Chennai, TN - 600040', state: 'Tamil Nadu', state_code: '33', gstin: '33AABCN4321B1Z9', customer_type: 'Supermarket Retailer', credit_limit: 100000.00, is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 2, code: 'CUST-002', business_name: 'Kovai Pazhamudir Nilayam - RS Puram', contact_person: 'T. Duraisamy', phone: '+91 98430 80002', email: 'orders@kpnretail.com', billing_address: 'DB Road, RS Puram, Coimbatore, TN - 641002', shipping_address: 'DB Road, RS Puram, Coimbatore, TN - 641002', state: 'Tamil Nadu', state_code: '33', gstin: '33AAACK7788P1Z6', customer_type: 'Supermarket Retailer', credit_limit: 150000.00, is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 3, code: 'CUST-003', business_name: 'Madurai Pandian Provision Stores', contact_person: 'M. Pandian', phone: '+91 94432 70003', email: 'pandianstores@gmail.com', billing_address: 'South Masi Street, Madurai, TN - 625001', shipping_address: 'South Masi Street, Madurai, TN - 625001', state: 'Tamil Nadu', state_code: '33', gstin: '33AAAPP9988D1Z4', customer_type: 'Provision Store', credit_limit: 50000.00, is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 4, code: 'CUST-004', business_name: 'MTR Bangalore Distribution Hub', contact_person: 'Anand Kumar', phone: '+91 80265 60004', email: 'hub@mtrdistributors.com', billing_address: 'Koramangala 4th Block, Bengaluru, KA - 560034', shipping_address: 'Koramangala 4th Block, Bengaluru, KA - 560034', state: 'Karnataka', state_code: '29', gstin: '29AABCM6655L1Z7', customer_type: 'Wholesale Distributor', credit_limit: 250000.00, is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
];

const INITIAL_PRODUCTS = [
  { id: 1, sku: 'FG-001', name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)', category: 'Fresh Batter', description: 'Naturally fermented stone-ground batter with Ponni rice and RO water', pack_size: '1 KG Pouch', unit: 'PKT', hsn_code: '2106', gst_rate: 5.00, selling_price: 60.00, is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 2, sku: 'FG-002', name: 'Madurai Special Madras Mixture (250g)', category: 'Snacks & Savouries', description: 'Crispy traditional snack prepared in 100% sunflower oil with roasted cashews and curry leaves', pack_size: '250g Pouch', unit: 'PKT', hsn_code: '2106', gst_rate: 12.00, selling_price: 95.00, is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 3, sku: 'FG-003', name: 'Traditional Kai Murukku / Thenkuzhal (200g)', category: 'Snacks & Savouries', description: 'Authentic butter murukku made with pure rice flour and hing', pack_size: '200g Packet', unit: 'PKT', hsn_code: '2106', gst_rate: 12.00, selling_price: 75.00, is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 4, sku: 'FG-004', name: 'Melt-in-Mouth Pure Ghee Mysore Pak (250g)', category: 'Traditional Sweets', description: 'Classic royal South Indian delicacy made with aromatic cow ghee and besan', pack_size: '250g Box', unit: 'PKT', hsn_code: '2106', gst_rate: 5.00, selling_price: 180.00, is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
];

const INITIAL_RAW_MATERIALS = [
  { id: 1, code: 'RM-001', name: 'Ponni Idli Rice (Special)', category: 'Grains & Pulses', unit: 'kg', preferred_supplier_id: 1, min_stock_alert: 200.0, reorder_level: 500.0, avg_unit_cost: 42.00, description: 'First quality aged Ponni parboiled rice', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 2, code: 'RM-002', name: 'Guntur Urad Dal (Skinless/Gundu)', category: 'Grains & Pulses', unit: 'kg', preferred_supplier_id: 2, min_stock_alert: 80.0, reorder_level: 200.0, avg_unit_cost: 125.00, description: 'High-rise polished whole urad dal', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 3, code: 'RM-003', name: 'Fenugreek Seeds (Vendhayam)', category: 'Spices & Seasoning', unit: 'kg', preferred_supplier_id: 3, min_stock_alert: 10.0, reorder_level: 25.0, avg_unit_cost: 95.00, description: 'Natural aroma and fluffiness enhancer', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 4, code: 'RM-004', name: 'Pure Desi Ghee (Cow Butter Ghee)', category: 'Dairy & Fats', unit: 'kg', preferred_supplier_id: 4, min_stock_alert: 25.0, reorder_level: 60.0, avg_unit_cost: 580.00, description: 'Pure dairy cow ghee for sweets', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 5, code: 'RM-005', name: 'Refined Sunflower Oil', category: 'Oils & Fats', unit: 'litre', preferred_supplier_id: 3, min_stock_alert: 50.0, reorder_level: 150.0, avg_unit_cost: 115.00, description: 'Light frying oil for snacks', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 6, code: 'RM-006', name: 'Gram Flour (Besan / Kadalai Maavu)', category: 'Grains & Pulses', unit: 'kg', preferred_supplier_id: 2, min_stock_alert: 100.0, reorder_level: 250.0, avg_unit_cost: 82.00, description: 'Super fine chana dal besan', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 7, code: 'RM-007', name: 'Rice Flour (Arisi Maavu)', category: 'Grains & Pulses', unit: 'kg', preferred_supplier_id: 1, min_stock_alert: 80.0, reorder_level: 200.0, avg_unit_cost: 48.00, description: 'Idiyappam / Murukku grade fine rice flour', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 8, code: 'RM-008', name: 'Guntur Red Chilli Powder', category: 'Spices & Seasoning', unit: 'kg', preferred_supplier_id: 2, min_stock_alert: 15.0, reorder_level: 40.0, avg_unit_cost: 240.00, description: 'Hot and vibrant red spice', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 9, code: 'RM-009', name: 'Perungayam / Hing (Compounded Asafoetida)', category: 'Spices & Seasoning', unit: 'kg', preferred_supplier_id: 3, min_stock_alert: 5.0, reorder_level: 12.0, avg_unit_cost: 850.00, description: 'Digestive spice for murukku and mixture', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 10, code: 'RM-010', name: 'Refined Salt (Crystal / Powdered)', category: 'Spices & Seasoning', unit: 'kg', preferred_supplier_id: 3, min_stock_alert: 50.0, reorder_level: 100.0, avg_unit_cost: 18.00, description: 'High purity iodized salt', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
];

const INITIAL_PACKAGING_MATERIALS = [
  { id: 1, code: 'PM-001', name: '1 KG Multilayer Fresh Batter Pouch (Printed)', packaging_type: 'Pouch', unit: 'pieces', preferred_supplier_id: 5, min_stock_alert: 1000.0, reorder_level: 3000.0, avg_unit_cost: 3.20, description: 'Food grade multi-barrier nitrogen seal pouch', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 2, code: 'PM-002', name: '250g Metallized Zip Pouch (Mixture)', packaging_type: 'Zip Bag', unit: 'pieces', preferred_supplier_id: 5, min_stock_alert: 800.0, reorder_level: 2000.0, avg_unit_cost: 4.50, description: 'Oxygen moisture-proof foil pouch with ziplock', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 3, code: 'PM-003', name: '200g Polybag Nitrogen Flushing (Murukku)', packaging_type: 'Pouch', unit: 'pieces', preferred_supplier_id: 5, min_stock_alert: 600.0, reorder_level: 1500.0, avg_unit_cost: 2.80, description: 'Crisp-protection transparent printed polybag', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 4, code: 'PM-004', name: '250g Food-Grade Sweet Box with Butter Paper', packaging_type: 'Box', unit: 'pieces', preferred_supplier_id: 5, min_stock_alert: 500.0, reorder_level: 1200.0, avg_unit_cost: 8.50, description: 'Rigid board box with grease-resistant butter paper', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
  { id: 5, code: 'PM-005', name: 'Outer Master Corrugated Carton (24 units)', packaging_type: 'Carton Box', unit: 'pieces', preferred_supplier_id: 5, min_stock_alert: 80.0, reorder_level: 200.0, avg_unit_cost: 28.00, description: 'Heavy duty 5-ply shipping outer carton', is_active: true, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01') },
];

const INITIAL_BOMS = [
  {
    id: 1,
    product_id: 1,
    recipe_name: 'Standard 100-Pack Fresh Batter Batch (100 KG)',
    bom_version: 'v1.0',
    batch_output_qty: 100.00,
    output_unit: 'PKT',
    effective_date: '2026-01-01',
    status: 'ACTIVE',
    notes: 'Soaking 5 hrs, stone grinding 45 mins, natural fermentation 8-10 hrs',
    created_by: 1,
    is_active: true,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    items: [
      { id: 1, bom_id: 1, material_type: 'RAW_MATERIAL', material_id: 1, quantity_required: 65.0000, unit: 'kg', wastage_percentage: 1.50, notes: 'Ponni Idli Rice' },
      { id: 2, bom_id: 1, material_type: 'RAW_MATERIAL', material_id: 2, quantity_required: 16.2500, unit: 'kg', wastage_percentage: 1.00, notes: 'Guntur Urad Dal' },
      { id: 3, bom_id: 1, material_type: 'RAW_MATERIAL', material_id: 3, quantity_required: 0.5000, unit: 'kg', wastage_percentage: 0.00, notes: 'Methi Seeds' },
      { id: 4, bom_id: 1, material_type: 'RAW_MATERIAL', material_id: 10, quantity_required: 1.2000, unit: 'kg', wastage_percentage: 0.00, notes: 'Salt' },
      { id: 5, bom_id: 1, material_type: 'PACKAGING', material_id: 1, quantity_required: 100.0000, unit: 'pieces', wastage_percentage: 2.00, notes: '1 KG Printed Pouch' },
    ]
  },
  {
    id: 2,
    product_id: 2,
    recipe_name: 'Standard 100-Pack Madras Mixture Batch (25 KG)',
    bom_version: 'v1.0',
    batch_output_qty: 100.00,
    output_unit: 'PKT',
    effective_date: '2026-01-01',
    status: 'ACTIVE',
    notes: 'Sev, boondi, omapodi, fried peanuts seasoned with chili & hing',
    created_by: 1,
    is_active: true,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    items: [
      { id: 6, bom_id: 2, material_type: 'RAW_MATERIAL', material_id: 6, quantity_required: 14.0000, unit: 'kg', wastage_percentage: 2.00, notes: 'Gram Flour / Besan' },
      { id: 7, bom_id: 2, material_type: 'RAW_MATERIAL', material_id: 7, quantity_required: 5.0000, unit: 'kg', wastage_percentage: 1.00, notes: 'Rice Flour' },
      { id: 8, bom_id: 2, material_type: 'RAW_MATERIAL', material_id: 5, quantity_required: 8.0000, unit: 'litre', wastage_percentage: 5.00, notes: 'Sunflower Oil for frying' },
      { id: 9, bom_id: 2, material_type: 'RAW_MATERIAL', material_id: 8, quantity_required: 0.7500, unit: 'kg', wastage_percentage: 0.50, notes: 'Guntur Chilli Powder' },
      { id: 10, bom_id: 2, material_type: 'RAW_MATERIAL', material_id: 9, quantity_required: 0.1500, unit: 'kg', wastage_percentage: 0.00, notes: 'Hing Powder' },
      { id: 11, bom_id: 2, material_type: 'RAW_MATERIAL', material_id: 10, quantity_required: 0.4500, unit: 'kg', wastage_percentage: 0.00, notes: 'Salt' },
      { id: 12, bom_id: 2, material_type: 'PACKAGING', material_id: 2, quantity_required: 100.0000, unit: 'pieces', wastage_percentage: 2.00, notes: '250g Zip Pouch' },
    ]
  }
];

// In-Memory state for high availability
let suppliers = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
let customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
let products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
let rawMaterials = JSON.parse(JSON.stringify(INITIAL_RAW_MATERIALS));
let packagingMaterials = JSON.parse(JSON.stringify(INITIAL_PACKAGING_MATERIALS));
let boms = JSON.parse(JSON.stringify(INITIAL_BOMS));

let nextSupplierId = 6;
let nextCustomerId = 5;
let nextProductId = 5;
let nextRawMaterialId = 11;
let nextPackagingMaterialId = 6;
let nextBomId = 3;
let nextBomItemId = 13;

let isDbOnline = false;

/**
 * Initialize Master Data tables in PostgreSQL if online
 */
const initMasterTables = async () => {
  try {
    await query('SELECT 1');
    isDbOnline = true;
    console.log('✅ [Master Data] PostgreSQL is ready for master tables.');
  } catch {
    isDbOnline = false;
    console.warn('ℹ️ [Master Data] PostgreSQL offline. Using in-memory master data repository.');
  }
};

// ----------------------------------------------------------------------------
// 1. PRODUCTS REPOSITORY
// ----------------------------------------------------------------------------
const getProducts = async ({ search = '', category = '', is_active, page = 1, limit = 50 } = {}) => {
  let list = [...products];

  if (search) {
    const q = search.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }
  if (category && category !== 'ALL') {
    list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }
  if (is_active !== undefined) {
    const activeBool = is_active === true || is_active === 'true';
    list = list.filter((p) => p.is_active === activeBool);
  }

  const total = list.length;
  const offset = (page - 1) * limit;
  const paged = list.slice(offset, offset + limit);

  return { items: paged, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
};

const getProductById = async (id) => {
  return products.find((p) => p.id === Number(id)) || null;
};

const getProductBySku = async (sku) => {
  return products.find((p) => p.sku.toLowerCase() === sku.trim().toLowerCase()) || null;
};

const createProduct = async (data) => {
  const newProduct = {
    id: nextProductId++,
    sku: data.sku.trim().toUpperCase(),
    name: data.name.trim(),
    category: data.category || 'Fresh Batter',
    description: data.description || '',
    pack_size: data.pack_size || '1 KG',
    unit: (data.unit || 'PKT').toUpperCase(),
    selling_price: parseFloat(data.selling_price) || 0.00,
    gst_rate: parseFloat(data.gst_rate) || 5.00,
    hsn_code: data.hsn_code || '2106',
    is_active: data.is_active !== false,
    created_at: new Date(),
    updated_at: new Date(),
  };
  products.push(newProduct);
  return newProduct;
};

const updateProduct = async (id, data) => {
  const idx = products.findIndex((p) => p.id === Number(id));
  if (idx === -1) return null;

  if (data.name !== undefined) products[idx].name = data.name.trim();
  if (data.category !== undefined) products[idx].category = data.category;
  if (data.description !== undefined) products[idx].description = data.description;
  if (data.pack_size !== undefined) products[idx].pack_size = data.pack_size;
  if (data.unit !== undefined) products[idx].unit = data.unit.toUpperCase();
  if (data.selling_price !== undefined) products[idx].selling_price = parseFloat(data.selling_price);
  if (data.gst_rate !== undefined) products[idx].gst_rate = parseFloat(data.gst_rate);
  if (data.hsn_code !== undefined) products[idx].hsn_code = data.hsn_code;
  if (data.is_active !== undefined) products[idx].is_active = data.is_active;
  products[idx].updated_at = new Date();

  return products[idx];
};

const toggleProductStatus = async (id, is_active) => {
  return updateProduct(id, { is_active });
};

// ----------------------------------------------------------------------------
// 2. CUSTOMERS REPOSITORY
// ----------------------------------------------------------------------------
const getCustomers = async ({ search = '', is_active, page = 1, limit = 50 } = {}) => {
  let list = [...customers];

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (c) =>
        c.business_name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }
  if (is_active !== undefined) {
    const activeBool = is_active === true || is_active === 'true';
    list = list.filter((c) => c.is_active === activeBool);
  }

  const total = list.length;
  const offset = (page - 1) * limit;
  const paged = list.slice(offset, offset + limit);

  return { items: paged, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
};

const getCustomerById = async (id) => {
  return customers.find((c) => c.id === Number(id)) || null;
};

const getCustomerByCode = async (code) => {
  return customers.find((c) => c.code.toLowerCase() === code.trim().toLowerCase()) || null;
};

const createCustomer = async (data) => {
  const newCustomer = {
    id: nextCustomerId++,
    code: data.code.trim().toUpperCase(),
    business_name: data.business_name.trim(),
    contact_person: data.contact_person || '',
    phone: data.phone || '',
    email: data.email || '',
    billing_address: data.billing_address || '',
    shipping_address: data.shipping_address || data.billing_address || '',
    state: data.state || 'Tamil Nadu',
    state_code: data.state_code || '33',
    gstin: data.gstin ? data.gstin.trim().toUpperCase() : null,
    customer_type: data.customer_type || 'Retail Store',
    credit_limit: parseFloat(data.credit_limit) || 50000.00,
    is_active: data.is_active !== false,
    created_at: new Date(),
    updated_at: new Date(),
  };
  customers.push(newCustomer);
  return newCustomer;
};

const updateCustomer = async (id, data) => {
  const idx = customers.findIndex((c) => c.id === Number(id));
  if (idx === -1) return null;

  if (data.business_name !== undefined) customers[idx].business_name = data.business_name.trim();
  if (data.contact_person !== undefined) customers[idx].contact_person = data.contact_person;
  if (data.phone !== undefined) customers[idx].phone = data.phone;
  if (data.email !== undefined) customers[idx].email = data.email;
  if (data.billing_address !== undefined) customers[idx].billing_address = data.billing_address;
  if (data.shipping_address !== undefined) customers[idx].shipping_address = data.shipping_address;
  if (data.state !== undefined) customers[idx].state = data.state;
  if (data.state_code !== undefined) customers[idx].state_code = data.state_code;
  if (data.gstin !== undefined) customers[idx].gstin = data.gstin ? data.gstin.trim().toUpperCase() : null;
  if (data.customer_type !== undefined) customers[idx].customer_type = data.customer_type;
  if (data.credit_limit !== undefined) customers[idx].credit_limit = parseFloat(data.credit_limit);
  if (data.is_active !== undefined) customers[idx].is_active = data.is_active;
  customers[idx].updated_at = new Date();

  return customers[idx];
};

const toggleCustomerStatus = async (id, is_active) => {
  return updateCustomer(id, { is_active });
};

// ----------------------------------------------------------------------------
// 3. SUPPLIERS REPOSITORY
// ----------------------------------------------------------------------------
const getSuppliers = async ({ search = '', is_active, page = 1, limit = 50 } = {}) => {
  let list = [...suppliers];

  if (search) {
    const q = search.toLowerCase();
    list = list.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }
  if (is_active !== undefined) {
    const activeBool = is_active === true || is_active === 'true';
    list = list.filter((s) => s.is_active === activeBool);
  }

  const total = list.length;
  const offset = (page - 1) * limit;
  const paged = list.slice(offset, offset + limit);

  return { items: paged, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
};

const getSupplierById = async (id) => {
  return suppliers.find((s) => s.id === Number(id)) || null;
};

const getSupplierByCode = async (code) => {
  return suppliers.find((s) => s.code.toLowerCase() === code.trim().toLowerCase()) || null;
};

const createSupplier = async (data) => {
  const newSupplier = {
    id: nextSupplierId++,
    code: data.code.trim().toUpperCase(),
    name: data.name.trim(),
    contact_person: data.contact_person || '',
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    state: data.state || 'Tamil Nadu',
    state_code: data.state_code || '33',
    gstin: data.gstin ? data.gstin.trim().toUpperCase() : null,
    category: data.category || 'Raw Materials',
    is_active: data.is_active !== false,
    created_at: new Date(),
    updated_at: new Date(),
  };
  suppliers.push(newSupplier);
  return newSupplier;
};

const updateSupplier = async (id, data) => {
  const idx = suppliers.findIndex((s) => s.id === Number(id));
  if (idx === -1) return null;

  if (data.name !== undefined) suppliers[idx].name = data.name.trim();
  if (data.contact_person !== undefined) suppliers[idx].contact_person = data.contact_person;
  if (data.phone !== undefined) suppliers[idx].phone = data.phone;
  if (data.email !== undefined) suppliers[idx].email = data.email;
  if (data.address !== undefined) suppliers[idx].address = data.address;
  if (data.state !== undefined) suppliers[idx].state = data.state;
  if (data.state_code !== undefined) suppliers[idx].state_code = data.state_code;
  if (data.gstin !== undefined) suppliers[idx].gstin = data.gstin ? data.gstin.trim().toUpperCase() : null;
  if (data.category !== undefined) suppliers[idx].category = data.category;
  if (data.is_active !== undefined) suppliers[idx].is_active = data.is_active;
  suppliers[idx].updated_at = new Date();

  return suppliers[idx];
};

const toggleSupplierStatus = async (id, is_active) => {
  return updateSupplier(id, { is_active });
};

// ----------------------------------------------------------------------------
// 4. RAW MATERIALS REPOSITORY
// ----------------------------------------------------------------------------
const getRawMaterials = async ({ search = '', category = '', is_active, page = 1, limit = 50 } = {}) => {
  let list = rawMaterials.map((rm) => {
    const prefSupplier = suppliers.find((s) => s.id === rm.preferred_supplier_id);
    return {
      ...rm,
      preferred_supplier_name: prefSupplier ? prefSupplier.name : null,
    };
  });

  if (search) {
    const q = search.toLowerCase();
    list = list.filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
  }
  if (category && category !== 'ALL') {
    list = list.filter((r) => r.category.toLowerCase() === category.toLowerCase());
  }
  if (is_active !== undefined) {
    const activeBool = is_active === true || is_active === 'true';
    list = list.filter((r) => r.is_active === activeBool);
  }

  const total = list.length;
  const offset = (page - 1) * limit;
  const paged = list.slice(offset, offset + limit);

  return { items: paged, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
};

const getRawMaterialById = async (id) => {
  const rm = rawMaterials.find((r) => r.id === Number(id));
  if (!rm) return null;
  const prefSupplier = suppliers.find((s) => s.id === rm.preferred_supplier_id);
  return { ...rm, preferred_supplier_name: prefSupplier ? prefSupplier.name : null };
};

const getRawMaterialByCode = async (code) => {
  return rawMaterials.find((r) => r.code.toLowerCase() === code.trim().toLowerCase()) || null;
};

const createRawMaterial = async (data) => {
  const newRM = {
    id: nextRawMaterialId++,
    code: data.code.trim().toUpperCase(),
    name: data.name.trim(),
    category: data.category || 'Grains & Pulses',
    unit: (data.unit || 'kg').toLowerCase(),
    preferred_supplier_id: data.preferred_supplier_id ? Number(data.preferred_supplier_id) : null,
    min_stock_alert: parseFloat(data.min_stock_alert || data.min_stock_level) || 10.0,
    reorder_level: parseFloat(data.reorder_level) || 25.0,
    avg_unit_cost: parseFloat(data.avg_unit_cost) || 0.00,
    description: data.description || '',
    is_active: data.is_active !== false,
    created_at: new Date(),
    updated_at: new Date(),
  };
  rawMaterials.push(newRM);
  return getRawMaterialById(newRM.id);
};

const updateRawMaterial = async (id, data) => {
  const idx = rawMaterials.findIndex((r) => r.id === Number(id));
  if (idx === -1) return null;

  if (data.name !== undefined) rawMaterials[idx].name = data.name.trim();
  if (data.category !== undefined) rawMaterials[idx].category = data.category;
  if (data.unit !== undefined) rawMaterials[idx].unit = data.unit.toLowerCase();
  if (data.preferred_supplier_id !== undefined)
    rawMaterials[idx].preferred_supplier_id = data.preferred_supplier_id ? Number(data.preferred_supplier_id) : null;
  if (data.min_stock_alert !== undefined || data.min_stock_level !== undefined)
    rawMaterials[idx].min_stock_alert = parseFloat(data.min_stock_alert || data.min_stock_level);
  if (data.reorder_level !== undefined) rawMaterials[idx].reorder_level = parseFloat(data.reorder_level);
  if (data.avg_unit_cost !== undefined) rawMaterials[idx].avg_unit_cost = parseFloat(data.avg_unit_cost);
  if (data.description !== undefined) rawMaterials[idx].description = data.description;
  if (data.is_active !== undefined) rawMaterials[idx].is_active = data.is_active;
  rawMaterials[idx].updated_at = new Date();

  return getRawMaterialById(id);
};

const toggleRawMaterialStatus = async (id, is_active) => {
  return updateRawMaterial(id, { is_active });
};

// ----------------------------------------------------------------------------
// 5. PACKAGING MATERIALS REPOSITORY
// ----------------------------------------------------------------------------
const getPackagingMaterials = async ({ search = '', is_active, page = 1, limit = 50 } = {}) => {
  let list = packagingMaterials.map((pm) => {
    const prefSupplier = suppliers.find((s) => s.id === pm.preferred_supplier_id);
    return {
      ...pm,
      preferred_supplier_name: prefSupplier ? prefSupplier.name : null,
    };
  });

  if (search) {
    const q = search.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  }
  if (is_active !== undefined) {
    const activeBool = is_active === true || is_active === 'true';
    list = list.filter((p) => p.is_active === activeBool);
  }

  const total = list.length;
  const offset = (page - 1) * limit;
  const paged = list.slice(offset, offset + limit);

  return { items: paged, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
};

const getPackagingMaterialById = async (id) => {
  const pm = packagingMaterials.find((p) => p.id === Number(id));
  if (!pm) return null;
  const prefSupplier = suppliers.find((s) => s.id === pm.preferred_supplier_id);
  return { ...pm, preferred_supplier_name: prefSupplier ? prefSupplier.name : null };
};

const getPackagingMaterialByCode = async (code) => {
  return packagingMaterials.find((p) => p.code.toLowerCase() === code.trim().toLowerCase()) || null;
};

const createPackagingMaterial = async (data) => {
  const newPM = {
    id: nextPackagingMaterialId++,
    code: data.code.trim().toUpperCase(),
    name: data.name.trim(),
    packaging_type: data.packaging_type || 'Pouch',
    unit: (data.unit || 'pieces').toLowerCase(),
    preferred_supplier_id: data.preferred_supplier_id ? Number(data.preferred_supplier_id) : null,
    min_stock_alert: parseFloat(data.min_stock_alert || data.min_stock_level) || 100.0,
    reorder_level: parseFloat(data.reorder_level) || 250.0,
    avg_unit_cost: parseFloat(data.avg_unit_cost) || 0.00,
    description: data.description || '',
    is_active: data.is_active !== false,
    created_at: new Date(),
    updated_at: new Date(),
  };
  packagingMaterials.push(newPM);
  return getPackagingMaterialById(newPM.id);
};

const updatePackagingMaterial = async (id, data) => {
  const idx = packagingMaterials.findIndex((p) => p.id === Number(id));
  if (idx === -1) return null;

  if (data.name !== undefined) packagingMaterials[idx].name = data.name.trim();
  if (data.packaging_type !== undefined) packagingMaterials[idx].packaging_type = data.packaging_type;
  if (data.unit !== undefined) packagingMaterials[idx].unit = data.unit.toLowerCase();
  if (data.preferred_supplier_id !== undefined)
    packagingMaterials[idx].preferred_supplier_id = data.preferred_supplier_id
      ? Number(data.preferred_supplier_id)
      : null;
  if (data.min_stock_alert !== undefined || data.min_stock_level !== undefined)
    packagingMaterials[idx].min_stock_alert = parseFloat(data.min_stock_alert || data.min_stock_level);
  if (data.reorder_level !== undefined) packagingMaterials[idx].reorder_level = parseFloat(data.reorder_level);
  if (data.avg_unit_cost !== undefined) packagingMaterials[idx].avg_unit_cost = parseFloat(data.avg_unit_cost);
  if (data.description !== undefined) packagingMaterials[idx].description = data.description;
  if (data.is_active !== undefined) packagingMaterials[idx].is_active = data.is_active;
  packagingMaterials[idx].updated_at = new Date();

  return getPackagingMaterialById(id);
};

const togglePackagingMaterialStatus = async (id, is_active) => {
  return updatePackagingMaterial(id, { is_active });
};

// ----------------------------------------------------------------------------
// 6. BILL OF MATERIALS (BOM) REPOSITORY
// ----------------------------------------------------------------------------
const enrichBomItems = (items) => {
  return items.map((item) => {
    let materialName = 'Unknown Item';
    let materialCode = '—';
    if (item.material_type === 'RAW_MATERIAL') {
      const rm = rawMaterials.find((r) => r.id === item.material_id);
      if (rm) {
        materialName = rm.name;
        materialCode = rm.code;
      }
    } else {
      const pm = packagingMaterials.find((p) => p.id === item.material_id);
      if (pm) {
        materialName = pm.name;
        materialCode = pm.code;
      }
    }
    return {
      ...item,
      material_name: materialName,
      material_code: materialCode,
    };
  });
};

const getBoms = async ({ product_id, status, is_active, page = 1, limit = 50 } = {}) => {
  let list = boms.map((b) => {
    const product = products.find((p) => p.id === b.product_id);
    return {
      ...b,
      product_name: product ? product.name : null,
      product_sku: product ? product.sku : null,
      items_count: (b.items || []).length,
    };
  });

  if (product_id) {
    list = list.filter((b) => b.product_id === Number(product_id));
  }
  if (status && status !== 'ALL') {
    list = list.filter((b) => b.status === status);
  }
  if (is_active !== undefined) {
    const activeBool = is_active === true || is_active === 'true';
    list = list.filter((b) => b.is_active === activeBool);
  }

  const total = list.length;
  const offset = (page - 1) * limit;
  const paged = list.slice(offset, offset + limit);

  return { items: paged, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
};

const getBomById = async (id) => {
  const b = boms.find((recipe) => recipe.id === Number(id));
  if (!b) return null;
  const product = products.find((p) => p.id === b.product_id);

  return {
    ...b,
    product_name: product ? product.name : null,
    product_sku: product ? product.sku : null,
    product_unit: product ? product.unit : null,
    items: enrichBomItems(b.items || []),
  };
};

const createBom = async ({ product_id, recipe_name, bom_version = 'v1.0', batch_output_qty = 100.0, output_unit = 'PKT', effective_date, status = 'ACTIVE', notes = '', created_by = 1 }, items = []) => {
  const newBomId = nextBomId++;

  // Validate items for duplicates: (material_type + material_id)
  const seen = new Set();
  const processedItems = items.map((it) => {
    const key = `${it.material_type}_${it.material_id}`;
    if (seen.has(key)) {
      throw new Error(`Duplicate item detected: ${it.material_type} ID ${it.material_id} cannot be listed twice in the same BOM.`);
    }
    seen.add(key);

    const qty = parseFloat(it.quantity_required);
    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Quantity required for each BOM item must be greater than zero.`);
    }

    return {
      id: nextBomItemId++,
      bom_id: newBomId,
      material_type: it.material_type,
      material_id: Number(it.material_id),
      quantity_required: qty,
      unit: it.unit || 'kg',
      wastage_percentage: parseFloat(it.wastage_percentage || 0.0),
      notes: it.notes || '',
    };
  });

  const newBom = {
    id: newBomId,
    product_id: Number(product_id),
    recipe_name: recipe_name.trim(),
    bom_version: bom_version.trim(),
    batch_output_qty: parseFloat(batch_output_qty) || 100.0,
    output_unit: output_unit.toUpperCase(),
    effective_date: effective_date || new Date().toISOString().split('T')[0],
    status,
    notes,
    created_by: Number(created_by),
    is_active: status === 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
    items: processedItems,
  };

  boms.push(newBom);
  return getBomById(newBomId);
};

const updateBom = async (id, data, items) => {
  const idx = boms.findIndex((b) => b.id === Number(id));
  if (idx === -1) return null;

  if (data.recipe_name !== undefined) boms[idx].recipe_name = data.recipe_name.trim();
  if (data.batch_output_qty !== undefined) boms[idx].batch_output_qty = parseFloat(data.batch_output_qty);
  if (data.output_unit !== undefined) boms[idx].output_unit = data.output_unit.toUpperCase();
  if (data.effective_date !== undefined) boms[idx].effective_date = data.effective_date;
  if (data.status !== undefined) {
    boms[idx].status = data.status;
    boms[idx].is_active = data.status === 'ACTIVE';
  }
  if (data.notes !== undefined) boms[idx].notes = data.notes;
  boms[idx].updated_at = new Date();

  // If new items provided, update items
  if (Array.isArray(items)) {
    const seen = new Set();
    boms[idx].items = items.map((it) => {
      const key = `${it.material_type}_${it.material_id}`;
      if (seen.has(key)) {
        throw new Error(`Duplicate item detected: ${it.material_type} ID ${it.material_id} cannot be listed twice.`);
      }
      seen.add(key);
      const qty = parseFloat(it.quantity_required);
      if (isNaN(qty) || qty <= 0) {
        throw new Error(`Quantity required must be greater than zero.`);
      }
      return {
        id: it.id || nextBomItemId++,
        bom_id: Number(id),
        material_type: it.material_type,
        material_id: Number(it.material_id),
        quantity_required: qty,
        unit: it.unit || 'kg',
        wastage_percentage: parseFloat(it.wastage_percentage || 0.0),
        notes: it.notes || '',
      };
    });
  }

  return getBomById(id);
};

const createBomVersion = async (existingBomId, { new_version, notes, batch_output_qty, output_unit, items }, userId = 1) => {
  const existing = await getBomById(existingBomId);
  if (!existing) {
    throw new Error(`Source BOM ID ${existingBomId} not found.`);
  }

  // Supersede existing BOM version to preserve history
  await updateBom(existingBomId, { status: 'SUPERSEDED' });

  // Items to use: new items if provided, or copy existing
  const itemsToClone = items && items.length > 0 ? items : existing.items;

  // Create new active version
  const created = await createBom(
    {
      product_id: existing.product_id,
      recipe_name: `${existing.recipe_name} (${new_version})`,
      bom_version: new_version,
      batch_output_qty: batch_output_qty || existing.batch_output_qty,
      output_unit: output_unit || existing.output_unit,
      status: 'ACTIVE',
      notes: notes || `Created from ${existing.bom_version}`,
      created_by: userId,
    },
    itemsToClone
  );

  return created;
};

const toggleBomStatus = async (id, status, is_active) => {
  const updateData = {};
  if (status !== undefined) updateData.status = status;
  if (is_active !== undefined) updateData.is_active = is_active;
  return updateBom(id, updateData);
};

module.exports = {
  initMasterTables,
  // Products
  getProducts,
  getProductById,
  getProductBySku,
  createProduct,
  updateProduct,
  toggleProductStatus,
  // Customers
  getCustomers,
  getCustomerById,
  getCustomerByCode,
  createCustomer,
  updateCustomer,
  toggleCustomerStatus,
  // Suppliers
  getSuppliers,
  getSupplierById,
  getSupplierByCode,
  createSupplier,
  updateSupplier,
  toggleSupplierStatus,
  // Raw Materials
  getRawMaterials,
  getRawMaterialById,
  getRawMaterialByCode,
  createRawMaterial,
  updateRawMaterial,
  toggleRawMaterialStatus,
  // Packaging Materials
  getPackagingMaterials,
  getPackagingMaterialById,
  getPackagingMaterialByCode,
  createPackagingMaterial,
  updatePackagingMaterial,
  togglePackagingMaterialStatus,
  // BOM
  getBoms,
  getBomById,
  createBom,
  updateBom,
  createBomVersion,
  toggleBomStatus,
};
