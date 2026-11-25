-- ============================================================================
-- Phase 3 Migration: Master Data Management Schema
-- Sri Meenakshi Agro & Traditional Foods Pvt Ltd
-- ============================================================================

-- 1. Suppliers Table Enhancements
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(25),
    email VARCHAR(120),
    address TEXT,
    state VARCHAR(50) DEFAULT 'Tamil Nadu',
    state_code VARCHAR(2) DEFAULT '33',
    gstin VARCHAR(15),
    category VARCHAR(60) DEFAULT 'Raw Materials',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- 2. Customers Table Enhancements
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(25),
    email VARCHAR(120),
    billing_address TEXT NOT NULL,
    shipping_address TEXT,
    state VARCHAR(50) DEFAULT 'Tamil Nadu',
    state_code VARCHAR(2) DEFAULT '33',
    gstin VARCHAR(15),
    customer_type VARCHAR(60) DEFAULT 'Retail Store',
    credit_limit NUMERIC(14, 2) DEFAULT 50000.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

-- 3. Raw Materials Table
CREATE TABLE IF NOT EXISTS raw_materials (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(60) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    preferred_supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    min_stock_alert NUMERIC(14, 4) DEFAULT 10.0000,
    reorder_level NUMERIC(14, 4) DEFAULT 25.0000,
    avg_unit_cost NUMERIC(12, 4) DEFAULT 0.0000,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raw_materials_code ON raw_materials(code);
CREATE INDEX IF NOT EXISTS idx_raw_materials_category ON raw_materials(category);

-- 4. Packaging Materials Table
CREATE TABLE IF NOT EXISTS packaging_materials (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    packaging_type VARCHAR(60) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'PCS',
    preferred_supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    min_stock_alert NUMERIC(14, 4) DEFAULT 100.0000,
    reorder_level NUMERIC(14, 4) DEFAULT 250.0000,
    avg_unit_cost NUMERIC(12, 4) DEFAULT 0.0000,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_packaging_materials_code ON packaging_materials(code);

-- 5. Products Table (Finished Goods)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(60) NOT NULL DEFAULT 'Fresh Batter',
    description TEXT,
    pack_size VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'PKT',
    hsn_code VARCHAR(10) NOT NULL DEFAULT '2106',
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    selling_price NUMERIC(12, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- 6. Bill of Materials (BOM Headers & Items)
CREATE TABLE IF NOT EXISTS bom_recipes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    recipe_name VARCHAR(150) NOT NULL,
    bom_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    batch_output_qty NUMERIC(12, 2) NOT NULL DEFAULT 100.00,
    output_unit VARCHAR(20) NOT NULL DEFAULT 'PKT',
    effective_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (
        status IN ('ACTIVE', 'DRAFT', 'SUPERSEDED', 'INACTIVE')
    ),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bom_product ON bom_recipes(product_id);

CREATE TABLE IF NOT EXISTS bom_items (
    id SERIAL PRIMARY KEY,
    bom_id INTEGER NOT NULL REFERENCES bom_recipes(id) ON DELETE CASCADE,
    material_type VARCHAR(20) NOT NULL CHECK (material_type IN ('RAW_MATERIAL', 'PACKAGING')),
    material_id INTEGER NOT NULL,
    quantity_required NUMERIC(12, 4) NOT NULL CHECK (quantity_required > 0),
    unit VARCHAR(20) NOT NULL,
    wastage_percentage NUMERIC(5, 2) DEFAULT 0.00,
    notes VARCHAR(150),
    CONSTRAINT uq_bom_material UNIQUE (bom_id, material_type, material_id)
);
