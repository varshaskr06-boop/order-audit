-- ============================================================================
-- Phase 11 Migration: Dispatch and Delivery Management System Schema
-- Sri Meenakshi Agro & Traditional Foods Pvt Ltd
-- ============================================================================

-- 1. Transporters Master Table
CREATE TABLE IF NOT EXISTS transporters (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(25) NOT NULL,
    email VARCHAR(120),
    gstin VARCHAR(15),
    address TEXT,
    transport_mode VARCHAR(30) DEFAULT 'ROAD' CHECK (
        transport_mode IN ('ROAD', 'RAIL', 'AIR', 'COURIER')
    ),
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(25),
    is_active BOOLEAN DEFAULT TRUE,
    rating NUMERIC(3, 2) DEFAULT 4.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transporters_code ON transporters(code);

-- 2. Dispatch Orders Table
CREATE TABLE IF NOT EXISTS dispatch_orders (
    id SERIAL PRIMARY KEY,
    dispatch_order_number VARCHAR(50) UNIQUE NOT NULL,
    sales_order_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE RESTRICT,
    sales_order_number VARCHAR(50) NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(150) NOT NULL,
    delivery_address TEXT NOT NULL,
    expected_delivery_date DATE,
    dispatch_priority VARCHAR(20) DEFAULT 'STANDARD' CHECK (
        dispatch_priority IN ('STANDARD', 'HIGH', 'URGENT')
    ),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (
        status IN (
            'PENDING', 'PACKED', 'READY_FOR_DISPATCH', 'DISPATCHED',
            'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED',
            'PARTIALLY_DELIVERED', 'DELIVERY_FAILED', 'RETURNED', 'CANCELLED'
        )
    ),
    assigned_employee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_employee_name VARCHAR(100),
    transporter_id INTEGER REFERENCES transporters(id) ON DELETE SET NULL,
    transporter_name VARCHAR(150),
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(25),
    lr_number VARCHAR(50),
    freight_charges NUMERIC(10, 2) DEFAULT 0.00,
    total_ordered_quantity NUMERIC(12, 2) DEFAULT 0.00,
    total_dispatched_quantity NUMERIC(12, 2) DEFAULT 0.00,
    total_delivered_quantity NUMERIC(12, 2) DEFAULT 0.00,
    dispatch_date TIMESTAMP WITH TIME ZONE,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    special_instructions TEXT,
    inventory_deducted BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dispatch_orders_number ON dispatch_orders(dispatch_order_number);
CREATE INDEX IF NOT EXISTS idx_dispatch_orders_so ON dispatch_orders(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_orders_customer ON dispatch_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_orders_status ON dispatch_orders(status);

-- 3. Dispatch Order Items Table
CREATE TABLE IF NOT EXISTS dispatch_items (
    id SERIAL PRIMARY KEY,
    dispatch_order_id INTEGER NOT NULL REFERENCES dispatch_orders(id) ON DELETE CASCADE,
    sales_order_item_id INTEGER REFERENCES sales_order_items(id) ON DELETE SET NULL,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    product_sku VARCHAR(30) NOT NULL,
    ordered_quantity NUMERIC(12, 2) NOT NULL,
    previously_dispatched_quantity NUMERIC(12, 2) DEFAULT 0.00,
    remaining_quantity NUMERIC(12, 2) NOT NULL,
    dispatch_quantity NUMERIC(12, 2) NOT NULL CHECK (dispatch_quantity > 0),
    delivered_quantity NUMERIC(12, 2) DEFAULT 0.00,
    uom VARCHAR(20) NOT NULL DEFAULT 'PKT',
    batch_id INTEGER,
    batch_number VARCHAR(50),
    mfg_date DATE,
    expiry_date DATE,
    qc_status VARCHAR(20) DEFAULT 'PASS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dispatch_items_order ON dispatch_items(dispatch_order_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_items_product ON dispatch_items(product_id);

-- 4. Packing Records Table
CREATE TABLE IF NOT EXISTS packing_records (
    id SERIAL PRIMARY KEY,
    packing_slip_number VARCHAR(50) UNIQUE NOT NULL,
    dispatch_order_id INTEGER NOT NULL REFERENCES dispatch_orders(id) ON DELETE CASCADE,
    dispatch_order_number VARCHAR(50) NOT NULL,
    packing_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    packed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    packed_by_name VARCHAR(100),
    total_cartons INTEGER NOT NULL DEFAULT 1,
    total_packages INTEGER NOT NULL DEFAULT 0,
    total_gross_weight_kg NUMERIC(10, 3) DEFAULT 0.000,
    total_net_weight_kg NUMERIC(10, 3) DEFAULT 0.000,
    packing_remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_packing_records_dispatch ON packing_records(dispatch_order_id);

-- 5. Packing Items Table
CREATE TABLE IF NOT EXISTS packing_items (
    id SERIAL PRIMARY KEY,
    packing_record_id INTEGER NOT NULL REFERENCES packing_records(id) ON DELETE CASCADE,
    dispatch_item_id INTEGER REFERENCES dispatch_items(id) ON DELETE SET NULL,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    carton_number VARCHAR(30) DEFAULT 'CTN-01',
    packed_quantity NUMERIC(12, 2) NOT NULL,
    packets_per_carton INTEGER DEFAULT 1,
    gross_weight_kg NUMERIC(10, 3) DEFAULT 0.000,
    net_weight_kg NUMERIC(10, 3) DEFAULT 0.000,
    uom VARCHAR(20) DEFAULT 'PKT'
);

-- 6. Delivery Challans Table
CREATE TABLE IF NOT EXISTS delivery_challans (
    id SERIAL PRIMARY KEY,
    challan_number VARCHAR(50) UNIQUE NOT NULL,
    challan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    dispatch_order_id INTEGER NOT NULL REFERENCES dispatch_orders(id) ON DELETE RESTRICT,
    dispatch_order_number VARCHAR(50) NOT NULL,
    sales_order_number VARCHAR(50),
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(150) NOT NULL,
    customer_gstin VARCHAR(15),
    delivery_address TEXT NOT NULL,
    transporter_name VARCHAR(150),
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(25),
    lr_number VARCHAR(50),
    total_packages INTEGER DEFAULT 0,
    total_weight_kg NUMERIC(10, 3) DEFAULT 0.000,
    dispatch_date TIMESTAMP WITH TIME ZONE,
    is_invoice_linked BOOLEAN DEFAULT FALSE,
    invoice_number VARCHAR(50),
    authorized_signatory VARCHAR(100) DEFAULT 'Dispatch & Warehouse Manager',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_challans_number ON delivery_challans(challan_number);
CREATE INDEX IF NOT EXISTS idx_delivery_challans_dispatch ON delivery_challans(dispatch_order_id);

-- 7. Shipment Tracking Table
CREATE TABLE IF NOT EXISTS shipment_tracking (
    id SERIAL PRIMARY KEY,
    dispatch_order_id INTEGER NOT NULL REFERENCES dispatch_orders(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    location VARCHAR(150),
    carrier_remarks TEXT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by_name VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipment_tracking_dispatch ON shipment_tracking(dispatch_order_id);

-- 8. Proof of Delivery Table
CREATE TABLE IF NOT EXISTS proof_of_delivery (
    id SERIAL PRIMARY KEY,
    dispatch_order_id INTEGER NOT NULL REFERENCES dispatch_orders(id) ON DELETE CASCADE,
    delivery_challan_id INTEGER REFERENCES delivery_challans(id) ON DELETE SET NULL,
    delivered_quantity NUMERIC(12, 2) NOT NULL,
    delivery_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(25),
    receiver_designation VARCHAR(100) DEFAULT 'Receiving Supervisor / Store Mgr',
    acknowledgement_type VARCHAR(50) DEFAULT 'SIGNATURE_AND_STAMP',
    delivery_remarks TEXT,
    attachment_url TEXT,
    attachment_filename VARCHAR(200),
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pod_dispatch UNIQUE (dispatch_order_id)
);

-- 9. Delivery Returns & Damaged Goods Table
CREATE TABLE IF NOT EXISTS delivery_returns (
    id SERIAL PRIMARY KEY,
    return_number VARCHAR(50) UNIQUE NOT NULL,
    dispatch_order_id INTEGER NOT NULL REFERENCES dispatch_orders(id) ON DELETE RESTRICT,
    sales_order_id INTEGER REFERENCES sales_orders(id) ON DELETE SET NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(150) NOT NULL,
    return_date DATE NOT NULL DEFAULT CURRENT_DATE,
    return_reason VARCHAR(60) NOT NULL CHECK (
        return_reason IN ('TRANSIT_DAMAGE', 'CUSTOMER_REJECTION', 'EXPIRY_NEAR', 'LEAKAGE', 'QUALITY_DEFECT', 'INCORRECT_ITEM', 'OTHER')
    ),
    reason_description TEXT,
    total_returned_quantity NUMERIC(12, 2) NOT NULL,
    total_damaged_quantity NUMERIC(12, 2) DEFAULT 0.00,
    inspection_status VARCHAR(30) DEFAULT 'QUARANTINED' CHECK (
        inspection_status IN ('QUARANTINED', 'INSPECTION_PENDING', 'APPROVED_RESTOCK', 'REJECTED_SCRAP')
    ),
    qc_inspection_id INTEGER,
    restocked_to_inventory BOOLEAN DEFAULT FALSE,
    stock_ledger_ref_id INTEGER,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_returns_number ON delivery_returns(return_number);
CREATE INDEX IF NOT EXISTS idx_returns_dispatch ON delivery_returns(dispatch_order_id);

-- 10. Delivery Return Line Items Table
CREATE TABLE IF NOT EXISTS delivery_return_items (
    id SERIAL PRIMARY KEY,
    return_id INTEGER NOT NULL REFERENCES delivery_returns(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    returned_quantity NUMERIC(12, 2) NOT NULL,
    damaged_quantity NUMERIC(12, 2) DEFAULT 0.00,
    unit_price NUMERIC(12, 2) DEFAULT 0.00,
    disposition VARCHAR(30) DEFAULT 'QUARANTINE'
);

-- 11. Dispatch Status History Table
CREATE TABLE IF NOT EXISTS dispatch_status_history (
    id SERIAL PRIMARY KEY,
    dispatch_order_id INTEGER NOT NULL REFERENCES dispatch_orders(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dispatch_history_order ON dispatch_status_history(dispatch_order_id);
