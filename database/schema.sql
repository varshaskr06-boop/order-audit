-- ============================================================================
-- Sri Meenakshi Agro & Traditional Foods Pvt Ltd
-- Order-to-Audit Management System - Master Relational Schema
-- ============================================================================

-- Clean slate (for fresh setup)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS production_costs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS production_material_issues CASCADE;
DROP TABLE IF EXISTS production_runs CASCADE;
DROP TABLE IF EXISTS sales_order_items CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS stock_ledger CASCADE;
DROP TABLE IF EXISTS bom_items CASCADE;
DROP TABLE IF EXISTS bom_recipes CASCADE;
DROP TABLE IF EXISTS packaging_materials CASCADE;
DROP TABLE IF EXISTS raw_materials CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. USERS & ROLES TABLE
-- Roles: 'Salesman', 'Admin', 'Production Supervisor', 'Accountant/Auditor', 'Owner'
-- ----------------------------------------------------------------------------
CREATE TABLE users (
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ----------------------------------------------------------------------------
-- 2. MASTER DATA: SUPPLIERS
-- Raw material and packaging suppliers (Madurai, Erode, Salem, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    gstin VARCHAR(15),
    state_code VARCHAR(2) NOT NULL DEFAULT '33', -- 33 = Tamil Nadu
    state_name VARCHAR(50) NOT NULL DEFAULT 'Tamil Nadu',
    phone VARCHAR(20),
    email VARCHAR(120),
    address TEXT,
    payment_terms_days INTEGER DEFAULT 30,
    outstanding_balance NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. MASTER DATA: CUSTOMERS (B2B Retailers, Supermarkets, Distributors)
-- Customers with Tamil Nadu (33) and Interstate (e.g. Karnataka 29, Kerala 32) GST
-- ----------------------------------------------------------------------------
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    gstin VARCHAR(15),
    state_code VARCHAR(2) NOT NULL DEFAULT '33', -- Used for CGST+SGST vs IGST
    state_name VARCHAR(50) NOT NULL DEFAULT 'Tamil Nadu',
    phone VARCHAR(20),
    email VARCHAR(120),
    billing_address TEXT NOT NULL,
    shipping_address TEXT,
    credit_limit NUMERIC(14, 2) DEFAULT 50000.00,
    outstanding_balance NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_state ON customers(state_code);

-- ----------------------------------------------------------------------------
-- 4. MASTER DATA: RAW MATERIALS
-- Grains, pulses, spices, oils, ghee, etc.
-- ----------------------------------------------------------------------------
CREATE TABLE raw_materials (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Grains & Pulses', 'Oils & Fats', 'Spices & Seasoning', etc.
    unit VARCHAR(20) NOT NULL DEFAULT 'KG', -- 'KG', 'LITER', 'GRAM'
    current_stock NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    min_stock_alert NUMERIC(14, 4) NOT NULL DEFAULT 10.0000,
    avg_unit_cost NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. MASTER DATA: PACKAGING MATERIALS
-- Pouches, corrugated boxes, labels, sealing tapes
-- ----------------------------------------------------------------------------
CREATE TABLE packaging_materials (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'PCS', -- 'PCS', 'ROLLS', 'BOX'
    current_stock NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    min_stock_alert NUMERIC(14, 4) NOT NULL DEFAULT 100.0000,
    avg_unit_cost NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. MASTER DATA: FINISHED GOODS / PRODUCTS
-- Idli/Dosa Batter, Murukku, Madras Mixture, Mysore Pak, Appalam
-- ----------------------------------------------------------------------------
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    pack_size VARCHAR(50) NOT NULL, -- e.g., '1 KG Pouch', '250g Pouch', '200g Packet'
    unit VARCHAR(20) NOT NULL DEFAULT 'PKT', -- 'PKT', 'BOX', 'TUB'
    hsn_code VARCHAR(10) NOT NULL DEFAULT '2106',
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00, -- 5.00%, 12.00%, etc.
    selling_price NUMERIC(12, 2) NOT NULL,
    current_stock NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    min_stock_alert NUMERIC(14, 4) NOT NULL DEFAULT 20.0000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. BILL OF MATERIALS (BOM) / RECIPES
-- Standard recipes for batch production (e.g., 100 kg batch of batter)
-- ----------------------------------------------------------------------------
CREATE TABLE bom_recipes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    recipe_name VARCHAR(150) NOT NULL,
    standard_batch_size NUMERIC(12, 2) NOT NULL, -- e.g. 100 packets
    standard_batch_unit VARCHAR(20) NOT NULL DEFAULT 'PKT',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bom_items (
    id SERIAL PRIMARY KEY,
    bom_id INTEGER NOT NULL REFERENCES bom_recipes(id) ON DELETE CASCADE,
    material_type VARCHAR(20) NOT NULL CHECK (material_type IN ('RAW_MATERIAL', 'PACKAGING')),
    material_id INTEGER NOT NULL, -- References raw_materials(id) or packaging_materials(id)
    quantity_required NUMERIC(12, 4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    notes VARCHAR(150)
);

-- ----------------------------------------------------------------------------
-- 8. STOCK LEDGER (IMMUTABLE AUDIT TRAIL)
-- Requirement: "Never overwrite stock balances without recording ledger movements"
-- ----------------------------------------------------------------------------
CREATE TABLE stock_ledger (
    id SERIAL PRIMARY KEY,
    item_type VARCHAR(20) NOT NULL CHECK (
        item_type IN ('RAW_MATERIAL', 'PACKAGING', 'FINISHED_GOOD')
    ),
    item_id INTEGER NOT NULL,
    transaction_type VARCHAR(30) NOT NULL CHECK (
        transaction_type IN (
            'PURCHASE_RECEIPT',
            'PRODUCTION_ISSUE',
            'PRODUCTION_OUTPUT',
            'SALES_DISPATCH',
            'SALES_RETURN',
            'WASTAGE_SCRAP',
            'STOCK_ADJUSTMENT'
        )
    ),
    quantity_change NUMERIC(14, 4) NOT NULL, -- Positive for IN, Negative for OUT
    balance_after NUMERIC(14, 4) NOT NULL,  -- Running verified balance
    unit_cost NUMERIC(12, 4) DEFAULT 0.0000,
    total_value NUMERIC(14, 2) DEFAULT 0.00,
    reference_type VARCHAR(50), -- 'PURCHASE_INVOICE', 'PRODUCTION_RUN', 'SALES_INVOICE', etc.
    reference_id INTEGER,
    remarks TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_item ON stock_ledger(item_type, item_id);
CREATE INDEX idx_ledger_date ON stock_ledger(created_at);

-- ----------------------------------------------------------------------------
-- 9. SALES ORDERS & ORDER ITEMS
-- Salesman creates, Admin approves/rejects, stock verification
-- ----------------------------------------------------------------------------
CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(30) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    salesman_id INTEGER NOT NULL REFERENCES users(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (
        status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'INVOICED', 'CANCELLED')
    ),
    subtotal_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    admin_notes TEXT,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    gst_rate NUMERIC(5, 2) NOT NULL,
    taxable_amount NUMERIC(14, 2) NOT NULL,
    tax_amount NUMERIC(14, 2) NOT NULL,
    total_line_amount NUMERIC(14, 2) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 10. PRODUCTION MANAGEMENT & YIELD VARIANCE
-- Batch runs, material issuance, expected vs actual output, wastage
-- ----------------------------------------------------------------------------
CREATE TABLE production_runs (
    id SERIAL PRIMARY KEY,
    batch_number VARCHAR(40) UNIQUE NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id),
    bom_id INTEGER NOT NULL REFERENCES bom_recipes(id),
    supervisor_id INTEGER NOT NULL REFERENCES users(id),
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED' CHECK (
        status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    ),
    expected_output_qty NUMERIC(12, 2) NOT NULL,
    actual_output_qty NUMERIC(12, 2) DEFAULT 0.00,
    wastage_qty NUMERIC(12, 2) DEFAULT 0.00,
    yield_variance_percentage NUMERIC(6, 2) DEFAULT 0.00, -- ((Actual - Expected) / Expected) * 100
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE production_material_issues (
    id SERIAL PRIMARY KEY,
    production_run_id INTEGER NOT NULL REFERENCES production_runs(id) ON DELETE CASCADE,
    material_type VARCHAR(20) NOT NULL CHECK (material_type IN ('RAW_MATERIAL', 'PACKAGING')),
    material_id INTEGER NOT NULL,
    standard_quantity NUMERIC(12, 4) NOT NULL,
    actual_quantity_issued NUMERIC(12, 4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_cost NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 11. BATCH COSTING
-- Material cost, packaging, labour, gas/electricity, cost/packet, profit margin
-- ----------------------------------------------------------------------------
CREATE TABLE production_costs (
    id SERIAL PRIMARY KEY,
    production_run_id INTEGER UNIQUE NOT NULL REFERENCES production_runs(id) ON DELETE CASCADE,
    raw_material_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    packaging_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    direct_labour_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    electricity_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    gas_fuel_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    other_overheads NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_batch_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    output_quantity NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    cost_per_packet NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    selling_price_per_packet NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    profit_margin_per_packet NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    profit_margin_percentage NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 12. GST INVOICING & BILLING
-- Full Tamil Nadu Intrastate (CGST + SGST) and Interstate (IGST) support
-- ----------------------------------------------------------------------------
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(40) UNIQUE NOT NULL,
    order_id INTEGER REFERENCES sales_orders(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    company_gstin VARCHAR(15) NOT NULL DEFAULT '33AAAAA0000A1Z5',
    customer_gstin VARCHAR(15),
    place_of_supply_state_code VARCHAR(2) NOT NULL DEFAULT '33',
    is_interstate BOOLEAN NOT NULL DEFAULT FALSE,
    taxable_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    dispatch_status VARCHAR(30) DEFAULT 'PENDING' CHECK (
        dispatch_status IN ('PENDING', 'DISPATCHED', 'DELIVERED')
    ),
    dispatch_date DATE,
    vehicle_number VARCHAR(30),
    payment_status VARCHAR(30) DEFAULT 'UNPAID' CHECK (
        payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID')
    ),
    paid_amount NUMERIC(14, 2) DEFAULT 0.00,
    balance_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    hsn_code VARCHAR(10) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    taxable_amount NUMERIC(14, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL,
    cgst_rate NUMERIC(5, 2) DEFAULT 0.00,
    cgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    sgst_rate NUMERIC(5, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    igst_rate NUMERIC(5, 2) DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 13. PAYMENTS & OUTSTANDING LEDGER
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    receipt_number VARCHAR(40) UNIQUE NOT NULL,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_paid NUMERIC(14, 2) NOT NULL,
    payment_mode VARCHAR(30) NOT NULL CHECK (
        payment_mode IN ('NEFT', 'RTGS', 'UPI', 'CHEQUE', 'CASH')
    ),
    reference_number VARCHAR(100),
    notes TEXT,
    received_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 14. AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
