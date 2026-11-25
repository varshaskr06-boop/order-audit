-- ============================================================================
-- Sri Meenakshi Agro & Traditional Foods Pvt Ltd
-- Order-to-Audit Management System
-- Phase 7: Production Management System
-- ============================================================================

-- 1. Production Plans
CREATE TABLE IF NOT EXISTS production_plans (
  id SERIAL PRIMARY KEY,
  plan_number VARCHAR(30) UNIQUE NOT NULL,
  plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  planned_start_date DATE NOT NULL,
  planned_end_date DATE NOT NULL,
  sales_order_id INTEGER,
  product_id INTEGER NOT NULL,
  planned_quantity NUMERIC(12, 3) NOT NULL CHECK (planned_quantity > 0),
  supervisor_id INTEGER,
  supervisor_name VARCHAR(100),
  department VARCHAR(100) DEFAULT 'Production',
  notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'APPROVED', 'CANCELLED')),
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Production Orders
CREATE TABLE IF NOT EXISTS production_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(30) UNIQUE NOT NULL,
  plan_id INTEGER REFERENCES production_plans(id) ON DELETE SET NULL,
  sales_order_id INTEGER,
  product_id INTEGER NOT NULL,
  product_sku VARCHAR(50),
  product_name VARCHAR(200),
  bom_id INTEGER NOT NULL,
  bom_version VARCHAR(20) DEFAULT 'v1.0',
  planned_quantity NUMERIC(12, 3) NOT NULL CHECK (planned_quantity > 0),
  actual_quantity NUMERIC(12, 3) DEFAULT 0 CHECK (actual_quantity >= 0),
  accepted_quantity NUMERIC(12, 3) DEFAULT 0 CHECK (accepted_quantity >= 0),
  rejected_quantity NUMERIC(12, 3) DEFAULT 0 CHECK (rejected_quantity >= 0),
  wastage_quantity NUMERIC(12, 3) DEFAULT 0 CHECK (wastage_quantity >= 0),
  planned_start_date DATE NOT NULL,
  planned_end_date DATE NOT NULL,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  supervisor_id INTEGER,
  supervisor_name VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'PLANNED'
    CHECK (status IN ('PLANNED','APPROVED','IN_PROGRESS','ON_HOLD','COMPLETED','CLOSED','CANCELLED')),
  priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
  materials_issued BOOLEAN DEFAULT FALSE,
  fg_receipt_posted BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BOM Snapshot for each Production Order (so changes to master BOM don't affect history)
CREATE TABLE IF NOT EXISTS production_material_requirements (
  id SERIAL PRIMARY KEY,
  production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  material_type VARCHAR(30) NOT NULL CHECK (material_type IN ('RAW_MATERIAL','PACKAGING')),
  material_id INTEGER NOT NULL,
  material_name VARCHAR(200),
  material_code VARCHAR(50),
  unit VARCHAR(20),
  quantity_per_batch NUMERIC(12, 4) NOT NULL,
  wastage_percentage NUMERIC(5, 2) DEFAULT 0,
  required_quantity NUMERIC(12, 4) NOT NULL,
  issued_quantity NUMERIC(12, 4) DEFAULT 0,
  returned_quantity NUMERIC(12, 4) DEFAULT 0,
  bom_item_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Material Issue Header
CREATE TABLE IF NOT EXISTS material_issues (
  id SERIAL PRIMARY KEY,
  issue_number VARCHAR(30) UNIQUE NOT NULL,
  production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE RESTRICT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issued_by INTEGER NOT NULL,
  issued_by_name VARCHAR(100),
  received_by VARCHAR(100),
  status VARCHAR(20) DEFAULT 'POSTED' CHECK (status IN ('DRAFT','POSTED')),
  notes TEXT,
  is_posted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Material Issue Line Items
CREATE TABLE IF NOT EXISTS material_issue_items (
  id SERIAL PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES material_issues(id) ON DELETE CASCADE,
  requirement_id INTEGER REFERENCES production_material_requirements(id) ON DELETE SET NULL,
  material_type VARCHAR(30) NOT NULL,
  material_id INTEGER NOT NULL,
  material_name VARCHAR(200),
  batch_number VARCHAR(50),
  inventory_batch_id INTEGER,
  inventory_item_id INTEGER,
  issued_quantity NUMERIC(12, 4) NOT NULL CHECK (issued_quantity > 0),
  unit VARCHAR(20),
  unit_rate NUMERIC(12, 2) DEFAULT 0,
  total_value NUMERIC(14, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Material Returns
CREATE TABLE IF NOT EXISTS material_returns (
  id SERIAL PRIMARY KEY,
  return_number VARCHAR(30) UNIQUE NOT NULL,
  production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE RESTRICT,
  issue_id INTEGER REFERENCES material_issues(id) ON DELETE SET NULL,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  material_type VARCHAR(30) NOT NULL,
  material_id INTEGER NOT NULL,
  material_name VARCHAR(200),
  batch_number VARCHAR(50),
  inventory_batch_id INTEGER,
  inventory_item_id INTEGER,
  returned_quantity NUMERIC(12, 4) NOT NULL CHECK (returned_quantity > 0),
  unit VARCHAR(20),
  condition VARCHAR(30) DEFAULT 'GOOD' CHECK (condition IN ('GOOD','DAMAGED','CONTAMINATED','EXPIRED')),
  return_reason TEXT,
  returned_by INTEGER NOT NULL,
  returned_by_name VARCHAR(100),
  return_to_stock BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Production Batches (Finished Goods)
CREATE TABLE IF NOT EXISTS production_batches (
  id SERIAL PRIMARY KEY,
  batch_number VARCHAR(50) UNIQUE NOT NULL,
  production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE RESTRICT,
  product_id INTEGER NOT NULL,
  product_name VARCHAR(200),
  product_sku VARCHAR(50),
  mfg_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  produced_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0,
  accepted_quantity NUMERIC(12, 3) DEFAULT 0,
  rejected_quantity NUMERIC(12, 3) DEFAULT 0,
  supervisor_id INTEGER,
  supervisor_name VARCHAR(100),
  batch_status VARCHAR(30) DEFAULT 'PENDING_QC'
    CHECK (batch_status IN ('PENDING_QC','QC_PASSED','QC_FAILED','DISPATCHED','EXPIRED')),
  qc_remarks TEXT,
  fg_receipt_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Production Logs (audit trail for status changes & key events)
CREATE TABLE IF NOT EXISTS production_logs (
  id SERIAL PRIMARY KEY,
  production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  log_type VARCHAR(50) NOT NULL,
  log_message TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  logged_by INTEGER,
  logged_by_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Production Downtime Records
CREATE TABLE IF NOT EXISTS production_downtime (
  id SERIAL PRIMARY KEY,
  production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  downtime_start TIMESTAMP WITH TIME ZONE NOT NULL,
  downtime_end TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  reason_category VARCHAR(50) DEFAULT 'MACHINE'
    CHECK (reason_category IN ('MACHINE','POWER','MATERIAL','MANPOWER','QUALITY','OTHER')),
  reason_description TEXT,
  machine_or_line VARCHAR(100),
  reported_by INTEGER,
  reported_by_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Finished Goods Receipts (from production into inventory)
CREATE TABLE IF NOT EXISTS finished_goods_receipts (
  id SERIAL PRIMARY KEY,
  receipt_number VARCHAR(30) UNIQUE NOT NULL,
  production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE RESTRICT,
  batch_id INTEGER REFERENCES production_batches(id) ON DELETE SET NULL,
  product_id INTEGER NOT NULL,
  product_name VARCHAR(200),
  product_sku VARCHAR(50),
  batch_number VARCHAR(50) NOT NULL,
  mfg_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  produced_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0,
  accepted_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (accepted_quantity >= 0),
  rejected_quantity NUMERIC(12, 3) DEFAULT 0 CHECK (rejected_quantity >= 0),
  warehouse_location_id INTEGER,
  warehouse_location_name VARCHAR(100),
  stock_ledger_entry_id INTEGER,
  is_posted BOOLEAN DEFAULT FALSE,
  posted_at TIMESTAMP WITH TIME ZONE,
  posted_by INTEGER,
  posted_by_name VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Production Status History
CREATE TABLE IF NOT EXISTS production_status_history (
  id SERIAL PRIMARY KEY,
  production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  old_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,
  changed_by INTEGER,
  changed_by_name VARCHAR(100),
  reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prod_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_prod_orders_product ON production_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_orders_created ON production_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_prod_requirements_order ON production_material_requirements(production_order_id);
CREATE INDEX IF NOT EXISTS idx_material_issues_order ON material_issues(production_order_id);
CREATE INDEX IF NOT EXISTS idx_material_returns_order ON material_returns(production_order_id);
CREATE INDEX IF NOT EXISTS idx_prod_batches_order ON production_batches(production_order_id);
CREATE INDEX IF NOT EXISTS idx_prod_logs_order ON production_logs(production_order_id);
CREATE INDEX IF NOT EXISTS idx_fg_receipts_order ON finished_goods_receipts(production_order_id);
CREATE INDEX IF NOT EXISTS idx_prod_status_history_order ON production_status_history(production_order_id);
