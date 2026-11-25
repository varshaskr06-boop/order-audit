-- ============================================================================
-- Phase 10 Migration: GST Billing and Invoicing Management System Schema
-- Sri Meenakshi Agro & Traditional Foods Pvt Ltd
-- ============================================================================

-- 1. Company Tax Profiles Table
CREATE TABLE IF NOT EXISTS company_tax_profiles (
    id SERIAL PRIMARY KEY,
    legal_name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(200) NOT NULL,
    gstin VARCHAR(15) NOT NULL,
    pan VARCHAR(10) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Tamil Nadu',
    state_code VARCHAR(2) NOT NULL DEFAULT '33',
    pincode VARCHAR(10) NOT NULL,
    phone VARCHAR(25),
    email VARCHAR(120),
    website VARCHAR(150),
    invoice_prefix VARCHAR(20) DEFAULT 'INV',
    financial_year VARCHAR(10) DEFAULT '2026-27',
    default_payment_terms VARCHAR(50) DEFAULT 'Net 30 Days',
    bank_name VARCHAR(150) DEFAULT 'State Bank of India',
    bank_account_no VARCHAR(50) DEFAULT '330011223344',
    bank_ifsc VARCHAR(20) DEFAULT 'SBIN0001234',
    bank_branch VARCHAR(100) DEFAULT 'Kappalur Industrial Estate, Madurai',
    lut_arn VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_company_tax_gstin ON company_tax_profiles(gstin);

-- 2. GST Tax Rates Configuration Table
CREATE TABLE IF NOT EXISTS tax_rates (
    id SERIAL PRIMARY KEY,
    tax_name VARCHAR(100) NOT NULL,
    hsn_code VARCHAR(10) NOT NULL,
    product_category VARCHAR(100),
    gst_rate NUMERIC(5, 2) NOT NULL,
    cgst_rate NUMERIC(5, 2) NOT NULL,
    sgst_rate NUMERIC(5, 2) NOT NULL,
    igst_rate NUMERIC(5, 2) NOT NULL,
    cess_rate NUMERIC(5, 2) DEFAULT 0.00,
    effective_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tax_rates_hsn ON tax_rates(hsn_code);
CREATE INDEX IF NOT EXISTS idx_tax_rates_active ON tax_rates(is_active);

-- 3. Customer Tax Details Extension Table
CREATE TABLE IF NOT EXISTS customer_tax_details (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    legal_name VARCHAR(150),
    trade_name VARCHAR(150),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    registration_type VARCHAR(50) DEFAULT 'REGULAR' CHECK (
        registration_type IN ('REGULAR', 'COMPOSITION', 'UNREGISTERED', 'CONSUMER_B2C', 'SEZ', 'DEEMED_EXPORT')
    ),
    place_of_supply_state VARCHAR(100) DEFAULT 'Tamil Nadu',
    place_of_supply_code VARCHAR(2) DEFAULT '33',
    is_reverse_charge_applicable BOOLEAN DEFAULT FALSE,
    is_composition BOOLEAN DEFAULT FALSE,
    tax_status VARCHAR(30) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_tax_customer UNIQUE (customer_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_tax_gstin ON customer_tax_details(gstin);
CREATE INDEX IF NOT EXISTS idx_customer_tax_pos ON customer_tax_details(place_of_supply_code);

-- 4. Invoice Number Sequential Counter Table
CREATE TABLE IF NOT EXISTS invoice_number_sequences (
    id SERIAL PRIMARY KEY,
    doc_type VARCHAR(30) NOT NULL CHECK (
        doc_type IN ('SALES_INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE')
    ),
    prefix VARCHAR(20) NOT NULL,
    financial_year VARCHAR(10) NOT NULL,
    next_number INTEGER NOT NULL DEFAULT 1,
    padding_digits INTEGER DEFAULT 4,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_seq_doc_fy UNIQUE (doc_type, financial_year)
);

-- 5. Sales Invoices Header Table
CREATE TABLE IF NOT EXISTS sales_invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    sales_order_id INTEGER REFERENCES sales_orders(id) ON DELETE SET NULL,
    sales_order_number VARCHAR(50),
    dispatch_id INTEGER,
    dispatch_reference VARCHAR(50),
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(150) NOT NULL,
    customer_gstin VARCHAR(15),
    customer_registration_type VARCHAR(50) DEFAULT 'REGULAR',
    billing_address TEXT NOT NULL,
    shipping_address TEXT,
    place_of_supply VARCHAR(100) NOT NULL DEFAULT 'Tamil Nadu',
    place_of_supply_code VARCHAR(2) NOT NULL DEFAULT '33',
    supply_type VARCHAR(20) NOT NULL DEFAULT 'INTRA_STATE' CHECK (
        supply_type IN ('INTRA_STATE', 'INTER_STATE')
    ),
    reverse_charge BOOLEAN DEFAULT FALSE,
    payment_terms VARCHAR(50) DEFAULT 'Net 30 Days',
    status VARCHAR(30) NOT NULL DEFAULT 'ISSUED' CHECK (
        status IN ('DRAFT', 'APPROVED', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'VOID')
    ),
    total_taxable_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cess_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    round_off_amount NUMERIC(6, 2) DEFAULT 0.00,
    total_invoice_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(14, 2) DEFAULT 0.00,
    balance_due NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    amount_in_words TEXT,
    notes TEXT,
    terms_conditions TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    einvoice_status VARCHAR(30) DEFAULT 'NOT_APPLICABLE' CHECK (
        einvoice_status IN ('NOT_APPLICABLE', 'PENDING', 'GENERATED', 'CANCELLED')
    ),
    irn VARCHAR(64),
    eway_bill_status VARCHAR(30) DEFAULT 'NOT_APPLICABLE' CHECK (
        eway_bill_status IN ('NOT_APPLICABLE', 'PENDING', 'GENERATED', 'CANCELLED')
    ),
    eway_bill_number VARCHAR(50),
    created_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON sales_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON sales_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON sales_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_so ON sales_invoices(sales_order_id);

-- 6. Sales Invoice Line Items Table
CREATE TABLE IF NOT EXISTS sales_invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    product_sku VARCHAR(30) NOT NULL,
    hsn_code VARCHAR(10) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    uom VARCHAR(20) NOT NULL DEFAULT 'PKT',
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    taxable_value NUMERIC(14, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL,
    cgst_rate NUMERIC(5, 2) DEFAULT 0.00,
    cgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    sgst_rate NUMERIC(5, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    igst_rate NUMERIC(5, 2) DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) DEFAULT 0.00,
    cess_rate NUMERIC(5, 2) DEFAULT 0.00,
    cess_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_item_amount NUMERIC(14, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inv_items_invoice ON sales_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_inv_items_product ON sales_invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_items_hsn ON sales_invoice_items(hsn_code);

-- 7. Invoice HSN Tax Breakdown Snapshot Table
CREATE TABLE IF NOT EXISTS invoice_tax_breakdowns (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    hsn_code VARCHAR(10) NOT NULL,
    taxable_value NUMERIC(14, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL,
    cgst_rate NUMERIC(5, 2) DEFAULT 0.00,
    cgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    sgst_rate NUMERIC(5, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    igst_rate NUMERIC(5, 2) DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) DEFAULT 0.00,
    cess_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_tax NUMERIC(14, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inv_tax_breakdown ON invoice_tax_breakdowns(invoice_id);

-- 8. Credit Notes Table
CREATE TABLE IF NOT EXISTS credit_notes (
    id SERIAL PRIMARY KEY,
    credit_note_number VARCHAR(50) UNIQUE NOT NULL,
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(50) NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(150) NOT NULL,
    customer_gstin VARCHAR(15),
    reason_type VARCHAR(50) NOT NULL CHECK (
        reason_type IN ('SALES_RETURN', 'DAMAGED_GOODS', 'PRICE_ADJUSTMENT', 'DEFICIENCY_OF_SERVICE', 'QUANTITY_CORRECTION', 'OTHER')
    ),
    reason_description TEXT,
    total_taxable_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_note_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'APPROVED' CHECK (
        status IN ('DRAFT', 'APPROVED', 'CANCELLED')
    ),
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cn_number ON credit_notes(credit_note_number);
CREATE INDEX IF NOT EXISTS idx_cn_invoice ON credit_notes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_cn_customer ON credit_notes(customer_id);

-- 9. Credit Note Items Table
CREATE TABLE IF NOT EXISTS credit_note_items (
    id SERIAL PRIMARY KEY,
    credit_note_id INTEGER NOT NULL REFERENCES credit_notes(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150),
    hsn_code VARCHAR(10),
    quantity NUMERIC(12, 2) DEFAULT 0,
    unit_price NUMERIC(12, 2) DEFAULT 0,
    taxable_value NUMERIC(14, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL,
    cgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_item_amount NUMERIC(14, 2) NOT NULL
);

-- 10. Debit Notes Table
CREATE TABLE IF NOT EXISTS debit_notes (
    id SERIAL PRIMARY KEY,
    debit_note_number VARCHAR(50) UNIQUE NOT NULL,
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(50) NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(150) NOT NULL,
    customer_gstin VARCHAR(15),
    reason_type VARCHAR(50) NOT NULL CHECK (
        reason_type IN ('PRICE_INCREASE', 'ADDITIONAL_QUANTITY', 'OTHER_EXPENSES')
    ),
    reason_description TEXT,
    total_taxable_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_note_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'APPROVED' CHECK (
        status IN ('DRAFT', 'APPROVED', 'CANCELLED')
    ),
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dn_number ON debit_notes(debit_note_number);
CREATE INDEX IF NOT EXISTS idx_dn_invoice ON debit_notes(invoice_id);

-- 11. Debit Note Items Table
CREATE TABLE IF NOT EXISTS debit_note_items (
    id SERIAL PRIMARY KEY,
    debit_note_id INTEGER NOT NULL REFERENCES debit_notes(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150),
    hsn_code VARCHAR(10),
    quantity NUMERIC(12, 2) DEFAULT 0,
    unit_price NUMERIC(12, 2) DEFAULT 0,
    taxable_value NUMERIC(14, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL,
    cgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_item_amount NUMERIC(14, 2) NOT NULL
);

-- 12. Invoice Status Lifecycle Audit History Table
CREATE TABLE IF NOT EXISTS invoice_status_history (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inv_history_invoice ON invoice_status_history(invoice_id);
