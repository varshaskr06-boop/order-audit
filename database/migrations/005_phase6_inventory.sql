-- ============================================================================
-- Sri Meenakshi Agro & Traditional Foods Pvt Ltd
-- Order-to-Audit Management System
-- Phase 6: Inventory Management System (Centralized Stock Ledger Architecture)
-- ============================================================================

-- 1. Inventory Storage Locations
CREATE TABLE IF NOT EXISTS inventory_locations (
  id SERIAL PRIMARY KEY,
  location_code VARCHAR(30) UNIQUE NOT NULL,
  location_name VARCHAR(100) NOT NULL,
  location_type VARCHAR(40) NOT NULL CHECK (location_type IN (
    'RAW_MATERIAL_WAREHOUSE', 
    'PACKAGING_STORE', 
    'PRODUCTION_FLOOR', 
    'FINISHED_GOODS_STORE', 
    'QUARANTINE_AREA', 
    'REJECTED_STORE'
  )),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Unified Inventory Items Catalog
CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('RAW_MATERIAL', 'PACKAGING', 'FINISHED_GOOD')),
  reference_id INTEGER NOT NULL,
  item_code VARCHAR(50) NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  min_stock_level NUMERIC(12, 3) DEFAULT 0 CHECK (min_stock_level >= 0),
  reorder_level NUMERIC(12, 3) DEFAULT 0 CHECK (reorder_level >= 0),
  valuation_rate NUMERIC(12, 2) DEFAULT 0 CHECK (valuation_rate >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_inventory_item_type_ref UNIQUE (item_type, reference_id)
);

-- 3. Inventory Batches & Expiry Tracking
CREATE TABLE IF NOT EXISTS inventory_batches (
  id SERIAL PRIMARY KEY,
  batch_number VARCHAR(50) NOT NULL,
  item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  location_id INTEGER REFERENCES inventory_locations(id) ON DELETE RESTRICT,
  mfg_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  initial_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (initial_quantity >= 0),
  current_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
  qc_status VARCHAR(20) DEFAULT 'PASS' CHECK (qc_status IN ('PASS', 'QUARANTINE', 'REJECTED')),
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  source_grn_id INTEGER REFERENCES goods_received_notes(id) ON DELETE SET NULL,
  source_production_ref VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_batch_item_loc UNIQUE (batch_number, item_id, location_id)
);

-- 4. Centralized Immutable Stock Ledger
CREATE TABLE IF NOT EXISTS stock_ledger (
  id SERIAL PRIMARY KEY,
  entry_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  transaction_type VARCHAR(40) NOT NULL CHECK (transaction_type IN (
    'INWARD_GRN',
    'INWARD_PRODUCTION',
    'OUTWARD_PRODUCTION',
    'OUTWARD_DISPATCH',
    'ADJUSTMENT_EXCESS',
    'ADJUSTMENT_SHORTAGE',
    'ADJUSTMENT_DAMAGED',
    'ADJUSTMENT_EXPIRED',
    'TRANSFER_OUT',
    'TRANSFER_IN',
    'PHYSICAL_COUNT_VARIANCE'
  )),
  item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  batch_id INTEGER REFERENCES inventory_batches(id) ON DELETE SET NULL,
  location_id INTEGER NOT NULL REFERENCES inventory_locations(id) ON DELETE RESTRICT,
  quantity NUMERIC(12, 3) NOT NULL,
  unit_rate NUMERIC(12, 2) DEFAULT 0,
  total_valuation NUMERIC(14, 2) DEFAULT 0,
  reference_type VARCHAR(50) NOT NULL,
  reference_id INTEGER,
  reference_no VARCHAR(100),
  running_balance NUMERIC(12, 3) NOT NULL,
  remarks TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Stock Issues (Outward to Production or Scrap)
CREATE TABLE IF NOT EXISTS stock_issues (
  id SERIAL PRIMARY KEY,
  issue_number VARCHAR(50) UNIQUE NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issue_type VARCHAR(30) DEFAULT 'PRODUCTION_ISSUE' CHECK (issue_type IN ('PRODUCTION_ISSUE', 'SCRAP', 'SAMPLE', 'INTERNAL_USE')),
  department VARCHAR(50) DEFAULT 'PRODUCTION',
  issued_to VARCHAR(100) NOT NULL,
  bom_id INTEGER REFERENCES bill_of_materials(id) ON DELETE SET NULL,
  production_batch_ref VARCHAR(100),
  notes TEXT,
  total_items INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_issue_items (
  id SERIAL PRIMARY KEY,
  stock_issue_id INTEGER NOT NULL REFERENCES stock_issues(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  batch_id INTEGER REFERENCES inventory_batches(id) ON DELETE RESTRICT,
  location_id INTEGER NOT NULL REFERENCES inventory_locations(id) ON DELETE RESTRICT,
  quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
  uom VARCHAR(20) NOT NULL,
  purpose TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Stock Adjustments (Physical Verification Reconciliations & Quality Write-offs)
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id SERIAL PRIMARY KEY,
  adjustment_number VARCHAR(50) UNIQUE NOT NULL,
  item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  batch_id INTEGER REFERENCES inventory_batches(id) ON DELETE SET NULL,
  location_id INTEGER NOT NULL REFERENCES inventory_locations(id) ON DELETE RESTRICT,
  adjustment_type VARCHAR(30) NOT NULL CHECK (adjustment_type IN ('EXCESS', 'SHORTAGE', 'DAMAGED', 'EXPIRED')),
  quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT
);

-- 7. Stock Transfers (Warehouse Inter-Location Movement)
CREATE TABLE IF NOT EXISTS stock_transfers (
  id SERIAL PRIMARY KEY,
  transfer_number VARCHAR(50) UNIQUE NOT NULL,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  batch_id INTEGER REFERENCES inventory_batches(id) ON DELETE SET NULL,
  from_location_id INTEGER NOT NULL REFERENCES inventory_locations(id) ON DELETE RESTRICT,
  to_location_id INTEGER NOT NULL REFERENCES inventory_locations(id) ON DELETE RESTRICT,
  quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
  uom VARCHAR(20) NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'CANCELLED')),
  transferred_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_distinct_locations CHECK (from_location_id != to_location_id)
);

-- 8. Physical Stock Verification
CREATE TABLE IF NOT EXISTS physical_stock_counts (
  id SERIAL PRIMARY KEY,
  count_number VARCHAR(50) UNIQUE NOT NULL,
  count_date DATE NOT NULL DEFAULT CURRENT_DATE,
  location_id INTEGER NOT NULL REFERENCES inventory_locations(id) ON DELETE RESTRICT,
  counted_by VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS physical_stock_count_items (
  id SERIAL PRIMARY KEY,
  stock_count_id INTEGER NOT NULL REFERENCES physical_stock_counts(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  batch_id INTEGER REFERENCES inventory_batches(id) ON DELETE SET NULL,
  system_quantity NUMERIC(12, 3) NOT NULL,
  counted_quantity NUMERIC(12, 3) NOT NULL,
  difference_quantity NUMERIC(12, 3) NOT NULL,
  valuation_difference NUMERIC(14, 2) DEFAULT 0,
  remarks TEXT
);

-- Indexes for performance & reporting
CREATE INDEX IF NOT EXISTS idx_stock_ledger_item ON stock_ledger(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_batch ON stock_ledger(batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_loc ON stock_ledger(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_type ON stock_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_item ON inventory_batches(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_adj_status ON stock_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_stock_count_status ON physical_stock_counts(status);

-- Seed Initial Locations
INSERT INTO inventory_locations (id, location_code, location_name, location_type, is_active)
VALUES
  (1, 'WH-RM-01', 'Madurai Central Raw Material Warehouse', 'RAW_MATERIAL_WAREHOUSE', TRUE),
  (2, 'WH-PKG-01', 'Packaging Material Store A', 'PACKAGING_STORE', TRUE),
  (3, 'PROD-FLR-01', 'Batter & Snack Processing Floor', 'PRODUCTION_FLOOR', TRUE),
  (4, 'WH-FG-01', 'Finished Goods Cold Storage & Dispatch', 'FINISHED_GOODS_STORE', TRUE),
  (5, 'WH-QC-01', 'Quarantine & Inspection Area', 'QUARANTINE_AREA', TRUE),
  (6, 'WH-REJ-01', 'Damaged / Rejected Goods Scrap Bay', 'REJECTED_STORE', TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('inventory_locations_id_seq', (SELECT COALESCE(MAX(id), 1) FROM inventory_locations));
