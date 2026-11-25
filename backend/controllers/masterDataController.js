/**
 * ============================================================================
 * Master Data Controller
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 */

const masterModel = require('../models/masterDataModel');

// GSTIN format validator (Standard Indian 15-character GST alphanumeric pattern)
// Example: 33AAAAA0000A1Z5
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const validateGstin = (gstin) => {
  if (!gstin) return true; // Optional if unregistered
  return GSTIN_REGEX.test(gstin.trim().toUpperCase());
};

// ============================================================================
// 1. PRODUCTS
// ============================================================================
const listProducts = async (req, res, next) => {
  try {
    const { search, category, is_active, page, limit } = req.query;
    const data = await masterModel.getProducts({ search, category, is_active, page, limit });
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await masterModel.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: { message: `Product ID ${req.params.id} not found.` } });
    }
    return res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const addProduct = async (req, res, next) => {
  try {
    const { name, sku, category, description, pack_size, unit, selling_price, gst_rate, hsn_code, is_active } = req.body;

    if (!name || !sku || selling_price === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'Product name, SKU / code, and selling price are required.' },
      });
    }

    if (parseFloat(selling_price) < 0) {
      return res.status(400).json({ success: false, error: { message: 'Selling price cannot be negative.' } });
    }

    // Check duplicate SKU
    const existing = await masterModel.getProductBySku(sku);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_CODE', message: `Product code/SKU "${sku}" is already in use.` },
      });
    }

    const created = await masterModel.createProduct({
      name,
      sku,
      category,
      description,
      pack_size,
      unit,
      selling_price,
      gst_rate,
      hsn_code,
      is_active,
    });

    return res.status(201).json({ success: true, message: 'Product created successfully.', product: created });
  } catch (error) {
    next(error);
  }
};

const editProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await masterModel.getProductById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: `Product ID ${id} not found.` } });
    }

    const updated = await masterModel.updateProduct(id, req.body);
    return res.status(200).json({ success: true, message: 'Product updated successfully.', product: updated });
  } catch (error) {
    next(error);
  }
};

const toggleProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, error: { message: 'is_active must be a boolean.' } });
    }

    const updated = await masterModel.toggleProductStatus(id, is_active);
    return res.status(200).json({
      success: true,
      message: `Product ${is_active ? 'activated' : 'deactivated'} successfully.`,
      product: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. CUSTOMERS
// ============================================================================
const listCustomers = async (req, res, next) => {
  try {
    const { search, is_active, page, limit } = req.query;
    const data = await masterModel.getCustomers({ search, is_active, page, limit });
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

const getCustomer = async (req, res, next) => {
  try {
    const customer = await masterModel.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: { message: `Customer ID ${req.params.id} not found.` } });
    }
    return res.status(200).json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};

const addCustomer = async (req, res, next) => {
  try {
    const { business_name, code, contact_person, phone, email, billing_address, shipping_address, state, state_code, gstin, customer_type, credit_limit, is_active } = req.body;

    if (!business_name || !code) {
      return res.status(400).json({ success: false, error: { message: 'Business name and customer code are required.' } });
    }

    // Validate GSTIN format
    if (gstin && !validateGstin(gstin)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_GSTIN', message: `Invalid GSTIN format "${gstin}". Must match 15-character Indian standard (e.g. 33AAAAA0000A1Z5).` },
      });
    }

    // Check duplicate code
    const existing = await masterModel.getCustomerByCode(code);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_CODE', message: `Customer code "${code}" is already in use.` },
      });
    }

    const created = await masterModel.createCustomer({
      business_name,
      code,
      contact_person,
      phone,
      email,
      billing_address,
      shipping_address,
      state,
      state_code,
      gstin,
      customer_type,
      credit_limit,
      is_active,
    });

    return res.status(201).json({ success: true, message: 'Customer created successfully.', customer: created });
  } catch (error) {
    next(error);
  }
};

const editCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { gstin } = req.body;

    if (gstin && !validateGstin(gstin)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_GSTIN', message: `Invalid GSTIN format "${gstin}".` },
      });
    }

    const updated = await masterModel.updateCustomer(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: `Customer ID ${id} not found.` } });
    }
    return res.status(200).json({ success: true, message: 'Customer updated successfully.', customer: updated });
  } catch (error) {
    next(error);
  }
};

const toggleCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, error: { message: 'is_active must be a boolean.' } });
    }
    const updated = await masterModel.toggleCustomerStatus(id, is_active);
    return res.status(200).json({
      success: true,
      message: `Customer ${is_active ? 'activated' : 'deactivated'} successfully.`,
      customer: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. SUPPLIERS
// ============================================================================
const listSuppliers = async (req, res, next) => {
  try {
    const { search, is_active, page, limit } = req.query;
    const data = await masterModel.getSuppliers({ search, is_active, page, limit });
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

const getSupplier = async (req, res, next) => {
  try {
    const supplier = await masterModel.getSupplierById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, error: { message: `Supplier ID ${req.params.id} not found.` } });
    }
    return res.status(200).json({ success: true, supplier });
  } catch (error) {
    next(error);
  }
};

const addSupplier = async (req, res, next) => {
  try {
    const { name, code, contact_person, phone, email, address, state, state_code, gstin, category, is_active } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, error: { message: 'Supplier name and code are required.' } });
    }

    if (gstin && !validateGstin(gstin)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_GSTIN', message: `Invalid GSTIN format "${gstin}".` },
      });
    }

    const existing = await masterModel.getSupplierByCode(code);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_CODE', message: `Supplier code "${code}" is already in use.` },
      });
    }

    const created = await masterModel.createSupplier({
      name,
      code,
      contact_person,
      phone,
      email,
      address,
      state,
      state_code,
      gstin,
      category,
      is_active,
    });

    return res.status(201).json({ success: true, message: 'Supplier created successfully.', supplier: created });
  } catch (error) {
    next(error);
  }
};

const editSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { gstin } = req.body;

    if (gstin && !validateGstin(gstin)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_GSTIN', message: `Invalid GSTIN format "${gstin}".` },
      });
    }

    const updated = await masterModel.updateSupplier(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: `Supplier ID ${id} not found.` } });
    }
    return res.status(200).json({ success: true, message: 'Supplier updated successfully.', supplier: updated });
  } catch (error) {
    next(error);
  }
};

const toggleSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, error: { message: 'is_active must be a boolean.' } });
    }
    const updated = await masterModel.toggleSupplierStatus(id, is_active);
    return res.status(200).json({
      success: true,
      message: `Supplier ${is_active ? 'activated' : 'deactivated'} successfully.`,
      supplier: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. RAW MATERIALS
// ============================================================================
const listRawMaterials = async (req, res, next) => {
  try {
    const { search, category, is_active, page, limit } = req.query;
    const data = await masterModel.getRawMaterials({ search, category, is_active, page, limit });
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

const getRawMaterial = async (req, res, next) => {
  try {
    const rm = await masterModel.getRawMaterialById(req.params.id);
    if (!rm) {
      return res.status(404).json({ success: false, error: { message: `Raw material ID ${req.params.id} not found.` } });
    }
    return res.status(200).json({ success: true, raw_material: rm });
  } catch (error) {
    next(error);
  }
};

const addRawMaterial = async (req, res, next) => {
  try {
    const { name, code, category, unit, preferred_supplier_id, min_stock_alert, reorder_level, avg_unit_cost, description, is_active } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, error: { message: 'Material name and code are required.' } });
    }

    const existing = await masterModel.getRawMaterialByCode(code);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_CODE', message: `Raw material code "${code}" is already in use.` },
      });
    }

    const created = await masterModel.createRawMaterial({
      name,
      code,
      category,
      unit,
      preferred_supplier_id,
      min_stock_alert,
      reorder_level,
      avg_unit_cost,
      description,
      is_active,
    });

    return res.status(201).json({ success: true, message: 'Raw material created successfully.', raw_material: created });
  } catch (error) {
    next(error);
  }
};

const editRawMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await masterModel.updateRawMaterial(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: `Raw material ID ${id} not found.` } });
    }
    return res.status(200).json({ success: true, message: 'Raw material updated successfully.', raw_material: updated });
  } catch (error) {
    next(error);
  }
};

const toggleRawMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, error: { message: 'is_active must be a boolean.' } });
    }
    const updated = await masterModel.toggleRawMaterialStatus(id, is_active);
    return res.status(200).json({
      success: true,
      message: `Raw material ${is_active ? 'activated' : 'deactivated'} successfully.`,
      raw_material: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 5. PACKAGING MATERIALS
// ============================================================================
const listPackagingMaterials = async (req, res, next) => {
  try {
    const { search, is_active, page, limit } = req.query;
    const data = await masterModel.getPackagingMaterials({ search, is_active, page, limit });
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

const getPackagingMaterial = async (req, res, next) => {
  try {
    const pm = await masterModel.getPackagingMaterialById(req.params.id);
    if (!pm) {
      return res.status(404).json({ success: false, error: { message: `Packaging material ID ${req.params.id} not found.` } });
    }
    return res.status(200).json({ success: true, packaging_material: pm });
  } catch (error) {
    next(error);
  }
};

const addPackagingMaterial = async (req, res, next) => {
  try {
    const { name, code, packaging_type, unit, preferred_supplier_id, min_stock_alert, reorder_level, avg_unit_cost, description, is_active } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, error: { message: 'Packaging name and code are required.' } });
    }

    const existing = await masterModel.getPackagingMaterialByCode(code);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_CODE', message: `Packaging code "${code}" is already in use.` },
      });
    }

    const created = await masterModel.createPackagingMaterial({
      name,
      code,
      packaging_type,
      unit,
      preferred_supplier_id,
      min_stock_alert,
      reorder_level,
      avg_unit_cost,
      description,
      is_active,
    });

    return res.status(201).json({ success: true, message: 'Packaging material created successfully.', packaging_material: created });
  } catch (error) {
    next(error);
  }
};

const editPackagingMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await masterModel.updatePackagingMaterial(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: `Packaging material ID ${id} not found.` } });
    }
    return res.status(200).json({ success: true, message: 'Packaging material updated successfully.', packaging_material: updated });
  } catch (error) {
    next(error);
  }
};

const togglePackagingMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, error: { message: 'is_active must be a boolean.' } });
    }
    const updated = await masterModel.togglePackagingMaterialStatus(id, is_active);
    return res.status(200).json({
      success: true,
      message: `Packaging material ${is_active ? 'activated' : 'deactivated'} successfully.`,
      packaging_material: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 6. BILL OF MATERIALS (BOM)
// ============================================================================
const listBoms = async (req, res, next) => {
  try {
    const { product_id, status, is_active, page, limit } = req.query;
    const data = await masterModel.getBoms({ product_id, status, is_active, page, limit });
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

const getBom = async (req, res, next) => {
  try {
    const bom = await masterModel.getBomById(req.params.id);
    if (!bom) {
      return res.status(404).json({ success: false, error: { message: `BOM ID ${req.params.id} not found.` } });
    }
    return res.status(200).json({ success: true, bom });
  } catch (error) {
    next(error);
  }
};

const addBom = async (req, res, next) => {
  try {
    const { product_id, recipe_name, bom_version, batch_output_qty, output_unit, effective_date, status, notes, items } = req.body;

    if (!product_id || !recipe_name || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Product ID, recipe name, and at least one ingredient/packaging item are required.' },
      });
    }

    const created = await masterModel.createBom(
      {
        product_id,
        recipe_name,
        bom_version,
        batch_output_qty,
        output_unit,
        effective_date,
        status,
        notes,
        created_by: req.user ? req.user.id : 1,
      },
      items
    );

    return res.status(201).json({ success: true, message: 'BOM recipe created successfully.', bom: created });
  } catch (error) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

const editBom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recipe_name, batch_output_qty, output_unit, effective_date, status, notes, items } = req.body;

    const updated = await masterModel.updateBom(
      id,
      { recipe_name, batch_output_qty, output_unit, effective_date, status, notes },
      items
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: { message: `BOM ID ${id} not found.` } });
    }

    return res.status(200).json({ success: true, message: 'BOM recipe updated successfully.', bom: updated });
  } catch (error) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

const createNewBomVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_version, notes, batch_output_qty, output_unit, items } = req.body;

    if (!new_version) {
      return res.status(400).json({ success: false, error: { message: 'New version label (e.g. "v1.1") is required.' } });
    }

    const newBom = await masterModel.createBomVersion(
      id,
      { new_version, notes, batch_output_qty, output_unit, items },
      req.user ? req.user.id : 1
    );

    return res.status(201).json({
      success: true,
      message: `Created new BOM version ${new_version}. Prior version superseded.`,
      bom: newBom,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

const toggleBom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, is_active } = req.body;

    const updated = await masterModel.toggleBomStatus(id, status, is_active);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: `BOM ID ${id} not found.` } });
    }
    return res.status(200).json({ success: true, message: 'BOM status updated successfully.', bom: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Products
  listProducts,
  getProduct,
  addProduct,
  editProduct,
  toggleProduct,
  // Customers
  listCustomers,
  getCustomer,
  addCustomer,
  editCustomer,
  toggleCustomer,
  // Suppliers
  listSuppliers,
  getSupplier,
  addSupplier,
  editSupplier,
  toggleSupplier,
  // Raw Materials
  listRawMaterials,
  getRawMaterial,
  addRawMaterial,
  editRawMaterial,
  toggleRawMaterial,
  // Packaging Materials
  listPackagingMaterials,
  getPackagingMaterial,
  addPackagingMaterial,
  editPackagingMaterial,
  togglePackagingMaterial,
  // BOM
  listBoms,
  getBom,
  addBom,
  editBom,
  createNewBomVersion,
  toggleBom,
};
