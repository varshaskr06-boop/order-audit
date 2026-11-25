-- ============================================================================
-- Sri Meenakshi Agro & Traditional Foods Pvt Ltd
-- Order-to-Audit Management System
-- Phase 9: Product Costing Management System (PCMS)
-- ============================================================================

-- 1. Standard Cost Sheets (Planned / Target Cost per SKU based on BOM & standard rates)
CREATE TABLE IF NOT EXISTS cost_sheets (
  id SERIAL PRIMARY KEY,
  sheet_number VARCHAR(30) UNIQUE NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_sku VARCHAR(50),
  product_name VARCHAR(200),
  bom_id INTEGER REFERENCES boms(id) ON DELETE SET NULL,
  bom_version VARCHAR(20) DEFAULT 'v1.0',
  batch_size NUMERIC(12, 3) NOT NULL CHECK (batch_size > 0),
  uom VARCHAR(20) NOT NULL,
  planned_material_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  planned_packaging_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  planned_labour_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  planned_machine_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  planned_electricity_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  planned_overhead_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  planned_total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  planned_unit_cost NUMERIC(12, 4) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  notes TEXT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Cost Sheet Items (Breakdown of components for planned standard cost sheet)
CREATE TABLE IF NOT EXISTS cost_sheet_items (
  id SERIAL PRIMARY KEY,
  cost_sheet_id INTEGER NOT NULL REFERENCES cost_sheets(id) ON DELETE CASCADE,
  item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('RAW_MATERIAL', 'PACKAGING', 'DIRECT_LABOUR', 'MACHINE', 'ELECTRICITY', 'OVERHEAD')),
  item_id INTEGER,
  item_code VARCHAR(50),
  item_name VARCHAR(200) NOT NULL,
  quantity NUMERIC(12, 4) NOT NULL DEFAULT 0,
  uom VARCHAR(20),
  standard_unit_rate NUMERIC(12, 4) NOT NULL DEFAULT 0,
  total_standard_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Labour Costs (Actual labour hours & expenses logged per order / batch)
CREATE TABLE IF NOT EXISTS labour_costs (
  id SERIAL PRIMARY KEY,
  entry_number VARCHAR(30) UNIQUE NOT NULL,
  production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE RESTRICT,
  production_order_number VARCHAR(30),
  production_batch_id INTEGER REFERENCES production_batches(id) ON DELETE SET NULL,
  batch_number VARCHAR(50),
  worker_id INTEGER,
  worker_name VARCHAR(100) NOT NULL,
  labour_category VARCHAR(30) NOT NULL DEFAULT 'DIRECT' CHECK (labour_category IN ('DIRECT', 'INDIRECT')),
  operation_name VARCHAR(100) NOT NULL, -- e.g. Soaking, Roasting, Milling, Packing
  working_hours NUMERIC(8, 2) NOT NULL CHECK (working_hours > 0),
  hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
  total_labour_cost NUMERIC(12, 2) NOT NULL CHECK (total_labour_cost >= 0),
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift VARCHAR(20) DEFAULT 'GENERAL',
  notes TEXT,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Machine and Electricity Costs (Actual equipment & power costs logged per order)
CREATE TABLE IF NOT EXISTS machine_costs (
  id SERIAL PRIMARY KEY,
  entry_number VARCHAR(30) UNIQUE NOT NULL,
  production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE RESTRICT,
  production_order_number VARCHAR(30),
  production_batch_id INTEGER REFERENCES production_batches(id) ON DELETE SET NULL,
  batch_number VARCHAR(50),
  machine_id VARCHAR(50) NOT NULL,
  machine_name VARCHAR(100) NOT NULL, -- e.g. Commercial Wet Grinder #1, Roaster #2, Nitrogen Sealer
  operating_hours NUMERIC(8, 2) NOT NULL CHECK (operating_hours > 0),
  electricity_consumption_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (electricity_consumption_kwh >= 0),
  electricity_rate NUMERIC(8, 2) NOT NULL DEFAULT 8.50 CHECK (electricity_rate >= 0),
  electricity_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (electricity_cost >= 0),
  maintenance_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (maintenance_cost >= 0),
  other_machine_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (other_machine_expenses >= 0),
  total_machine_cost NUMERIC(12, 2) NOT NULL CHECK (total_machine_cost >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_machine_order_entry UNIQUE (production_order_id, machine_id, expense_date)
);

-- 5. Manufacturing Overhead Master Pool (Factory Rent, Common Utilities, Maintenance Pool)
CREATE TABLE IF NOT EXISTS overhead_costs (
  id SERIAL PRIMARY KEY,
  overhead_code VARCHAR(30) UNIQUE NOT NULL,
  overhead_category VARCHAR(50) NOT NULL, -- e.g. FACTORY_RENT, MAINTENANCE, UTILITIES, INDIRECT_LABOUR, OTHER
  description VARCHAR(200) NOT NULL,
  expense_period_month VARCHAR(7) NOT NULL, -- Format YYYY-MM
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  default_allocation_method VARCHAR(30) NOT NULL DEFAULT 'PER_UNIT'
    CHECK (default_allocation_method IN ('PER_UNIT', 'PER_BATCH', 'PER_MACHINE_HOUR', 'PERCENTAGE_OF_LABOUR')),
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Cost Allocations (Specific overhead allocation snapshot to an order or batch)
CREATE TABLE IF NOT EXISTS cost_allocations (
  id SERIAL PRIMARY KEY,
  allocation_number VARCHAR(30) UNIQUE NOT NULL,
  production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE RESTRICT,
  production_batch_id INTEGER REFERENCES production_batches(id) ON DELETE SET NULL,
  batch_number VARCHAR(50),
  overhead_id INTEGER REFERENCES overhead_costs(id) ON DELETE SET NULL,
  overhead_category VARCHAR(50) NOT NULL,
  allocation_method VARCHAR(30) NOT NULL
    CHECK (allocation_method IN ('PER_UNIT', 'PER_BATCH', 'PER_MACHINE_HOUR', 'PERCENTAGE_OF_LABOUR')),
  basis_value NUMERIC(12, 4) NOT NULL, -- e.g. 500 units, 1 batch, 10 machine hours, or ₹3,500 direct labour
  allocation_rate NUMERIC(12, 4) NOT NULL,
  allocated_amount NUMERIC(14, 2) NOT NULL CHECK (allocated_amount >= 0),
  allocation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Batch Costs (Actual Consolidated Production Cost for a Manufactured Batch)
CREATE TABLE IF NOT EXISTS batch_costs (
  id SERIAL PRIMARY KEY,
  cost_calculation_number VARCHAR(30) UNIQUE NOT NULL,
  production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE RESTRICT,
  production_order_number VARCHAR(30) NOT NULL,
  production_batch_id INTEGER REFERENCES production_batches(id) ON DELETE SET NULL,
  batch_number VARCHAR(50) NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_sku VARCHAR(50),
  product_name VARCHAR(200),
  uom VARCHAR(20) NOT NULL,
  
  -- Cost Breakdown Components
  raw_material_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  packaging_material_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  direct_labour_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  machine_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  electricity_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  overhead_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_batch_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,

  -- Output Quantities
  produced_quantity NUMERIC(12, 3) NOT NULL CHECK (produced_quantity > 0),
  accepted_quantity NUMERIC(12, 3) NOT NULL CHECK (accepted_quantity >= 0),
  rejected_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (rejected_quantity >= 0),

  -- Unit Cost Metrics
  cost_per_accepted_unit NUMERIC(12, 4) NOT NULL CHECK (cost_per_accepted_unit >= 0),
  rejection_wastage_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  
  -- Metadata & Auditing
  allocation_summary JSONB,
  calculated_by INTEGER NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_batch_cost_calculation UNIQUE (production_order_id, batch_number)
);

-- 8. Product Selling Prices (Configured Selling Prices, Target Margin %, GST & Approval Workflow)
CREATE TABLE IF NOT EXISTS product_selling_prices (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_sku VARCHAR(50),
  product_name VARCHAR(200),
  uom VARCHAR(20) NOT NULL,
  unit_manufacturing_cost NUMERIC(12, 4) NOT NULL CHECK (unit_manufacturing_cost >= 0),
  target_profit_margin_pct NUMERIC(6, 2) NOT NULL DEFAULT 25.00 CHECK (target_profit_margin_pct >= 0),
  suggested_selling_price NUMERIC(12, 2) NOT NULL CHECK (suggested_selling_price >= 0),
  approved_selling_price NUMERIC(12, 2) NOT NULL CHECK (approved_selling_price >= 0),
  gst_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 5.00 CHECK (gst_rate_pct >= 0),
  gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  final_price_with_gst NUMERIC(12, 2) NOT NULL DEFAULT 0,
  expected_profit_per_unit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  actual_margin_pct NUMERIC(6, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING_APPROVAL'
    CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  requested_by INTEGER NOT NULL,
  approved_by INTEGER,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Cost Variances (Planned vs Actual Cost Variance Analysis)
CREATE TABLE IF NOT EXISTS cost_variances (
  id SERIAL PRIMARY KEY,
  variance_number VARCHAR(30) UNIQUE NOT NULL,
  production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE RESTRICT,
  batch_cost_id INTEGER REFERENCES batch_costs(id) ON DELETE CASCADE,
  batch_number VARCHAR(50),
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Materials
  planned_material_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  actual_material_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  material_price_variance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  material_usage_variance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  
  -- Labour
  planned_labour_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  actual_labour_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  labour_variance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  
  -- Overhead
  planned_overhead_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  actual_overhead_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  overhead_variance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  
  -- Total
  planned_total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  actual_total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_cost_variance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  variance_pct NUMERIC(6, 2) NOT NULL DEFAULT 0,
  variance_status VARCHAR(20) NOT NULL DEFAULT 'FAVORABLE'
    CHECK (variance_status IN ('FAVORABLE', 'UNFAVORABLE', 'NEUTRAL')),
    
  investigation_notes TEXT,
  evaluated_by INTEGER NOT NULL,
  evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_cost_sheets_prod ON cost_sheets(product_id, status);
CREATE INDEX IF NOT EXISTS idx_labour_order ON labour_costs(production_order_id, work_date);
CREATE INDEX IF NOT EXISTS idx_machine_order ON machine_costs(production_order_id, machine_id);
CREATE INDEX IF NOT EXISTS idx_allocations_order ON cost_allocations(production_order_id);
CREATE INDEX IF NOT EXISTS idx_batch_costs_prod ON batch_costs(product_id, batch_number);
CREATE INDEX IF NOT EXISTS idx_selling_prices_prod ON product_selling_prices(product_id, status);
CREATE INDEX IF NOT EXISTS idx_variances_order ON cost_variances(production_order_id);
