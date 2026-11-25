-- ============================================================================
-- Sri Meenakshi Agro & Traditional Foods Pvt Ltd
-- Order-to-Audit Management System
-- Phase 8: Quality Control Management System (QCMS)
-- ============================================================================

-- 1. Quality Standards (Configurable Master Specifications)
CREATE TABLE IF NOT EXISTS quality_standards (
  id SERIAL PRIMARY KEY,
  standard_code VARCHAR(50) UNIQUE NOT NULL,
  standard_name VARCHAR(150) NOT NULL,
  target_type VARCHAR(30) NOT NULL CHECK (target_type IN ('RAW_MATERIAL', 'PACKAGING', 'FINISHED_GOOD')),
  target_id INTEGER NOT NULL,
  target_name VARCHAR(200),
  standard_version VARCHAR(20) DEFAULT 'v1.0',
  description TEXT,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Quality Inspection Parameters per Standard
CREATE TABLE IF NOT EXISTS inspection_parameters (
  id SERIAL PRIMARY KEY,
  standard_id INTEGER NOT NULL REFERENCES quality_standards(id) ON DELETE CASCADE,
  parameter_name VARCHAR(100) NOT NULL,
  parameter_type VARCHAR(20) NOT NULL CHECK (parameter_type IN ('NUMERIC', 'TEXT', 'BOOLEAN')),
  uom VARCHAR(30),
  min_value NUMERIC(12, 4),
  max_value NUMERIC(12, 4),
  target_value NUMERIC(12, 4),
  acceptable_text_values TEXT, -- JSON or comma-separated allowed values (e.g. "Normal,Fine,Golden")
  stage VARCHAR(30) DEFAULT 'INCOMING' CHECK (stage IN ('INCOMING', 'IN_PROCESS', 'FINAL')),
  is_mandatory BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Quality Inspections (Master Inspection Records)
CREATE TABLE IF NOT EXISTS quality_inspections (
  id SERIAL PRIMARY KEY,
  inspection_number VARCHAR(50) UNIQUE NOT NULL,
  inspection_type VARCHAR(30) NOT NULL CHECK (inspection_type IN ('RAW_MATERIAL', 'PACKAGING', 'IN_PROCESS', 'FINISHED_GOOD')),
  stage VARCHAR(30) DEFAULT 'INCOMING' CHECK (stage IN ('INCOMING', 'IN_PROCESS', 'FINAL')),
  standard_id INTEGER REFERENCES quality_standards(id) ON DELETE SET NULL,
  grn_id INTEGER,
  supplier_id INTEGER,
  supplier_name VARCHAR(200),
  production_order_id INTEGER,
  production_order_number VARCHAR(50),
  production_batch_id INTEGER,
  inventory_batch_id INTEGER,
  item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('RAW_MATERIAL', 'PACKAGING', 'FINISHED_GOOD')),
  item_id INTEGER NOT NULL,
  item_name VARCHAR(200) NOT NULL,
  item_code VARCHAR(50),
  batch_number VARCHAR(60) NOT NULL,
  received_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  inspected_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (inspected_quantity >= 0),
  accepted_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (accepted_quantity >= 0),
  rejected_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (rejected_quantity >= 0),
  uom VARCHAR(20) NOT NULL,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inspector_id INTEGER,
  inspector_name VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'PASSED', 'FAILED', 'PARTIALLY_ACCEPTED', 'UNDER_REVIEW')),
  overall_result VARCHAR(20) DEFAULT 'PENDING' CHECK (overall_result IN ('PENDING', 'PASS', 'FAIL')),
  remarks TEXT,
  inventory_updated BOOLEAN DEFAULT FALSE,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Inspection Parameter Test Results
CREATE TABLE IF NOT EXISTS inspection_results (
  id SERIAL PRIMARY KEY,
  inspection_id INTEGER NOT NULL REFERENCES quality_inspections(id) ON DELETE CASCADE,
  parameter_id INTEGER REFERENCES inspection_parameters(id) ON DELETE SET NULL,
  parameter_name VARCHAR(100) NOT NULL,
  measured_numeric_value NUMERIC(12, 4),
  measured_text_value VARCHAR(255),
  min_limit NUMERIC(12, 4),
  max_limit NUMERIC(12, 4),
  target_limit NUMERIC(12, 4),
  uom VARCHAR(30),
  is_conforming BOOLEAN NOT NULL DEFAULT TRUE,
  flagged_out_of_range BOOLEAN DEFAULT FALSE,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Quality Defects and Rejection Log
CREATE TABLE IF NOT EXISTS quality_defects (
  id SERIAL PRIMARY KEY,
  defect_number VARCHAR(50) UNIQUE NOT NULL,
  inspection_id INTEGER REFERENCES quality_inspections(id) ON DELETE SET NULL,
  defect_source VARCHAR(30) NOT NULL CHECK (defect_source IN ('SUPPLIER', 'PRODUCTION')),
  defect_category VARCHAR(50) NOT NULL CHECK (defect_category IN (
    'CONTAMINATION', 'MOISTURE_EXCESS', 'PHYSICAL_DAMAGE', 'SEALING_FAILURE',
    'PRINTING_ERROR', 'COLOUR_DEVIATION', 'WEIGHT_VARIATION', 'FOREIGN_MATTER',
    'PACKAGING_DEFECT', 'SMELL_RANCIDITY', 'LABEL_DEFECT', 'OTHER'
  )),
  defect_description TEXT NOT NULL,
  material_or_product_type VARCHAR(30) NOT NULL,
  material_or_product_id INTEGER NOT NULL,
  material_or_product_name VARCHAR(200) NOT NULL,
  supplier_id INTEGER,
  supplier_name VARCHAR(200),
  production_order_id INTEGER,
  production_order_number VARCHAR(50),
  batch_number VARCHAR(60) NOT NULL,
  defective_quantity NUMERIC(12, 3) NOT NULL CHECK (defective_quantity > 0),
  uom VARCHAR(20) NOT NULL,
  rejection_reason TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'MAJOR' CHECK (severity IN ('CRITICAL', 'MAJOR', 'MINOR')),
  disposition_action VARCHAR(50) DEFAULT 'REJECT_RETURN_TO_VENDOR'
    CHECK (disposition_action IN ('REJECT_RETURN_TO_VENDOR', 'SCRAP', 'REWORK', 'CONCESSION_USE', 'QUARANTINE')),
  attachment_metadata JSONB,
  reported_by INTEGER NOT NULL,
  reported_by_name VARCHAR(100),
  reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Quality Incidents
CREATE TABLE IF NOT EXISTS quality_incidents (
  id SERIAL PRIMARY KEY,
  incident_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  incident_type VARCHAR(40) NOT NULL CHECK (incident_type IN (
    'SUPPLIER_DEFECT', 'PROCESS_DEVIATION', 'CUSTOMER_COMPLAINT', 'AUDIT_NONCONFORMANCE', 'INTERNAL_INSPECTION_FAIL'
  )),
  severity VARCHAR(20) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'CAPA_REQUIRED', 'RESOLVED', 'CLOSED')),
  related_inspection_id INTEGER REFERENCES quality_inspections(id) ON DELETE SET NULL,
  related_defect_id INTEGER REFERENCES quality_defects(id) ON DELETE SET NULL,
  reported_by INTEGER NOT NULL,
  reported_by_name VARCHAR(100),
  reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
  resolved_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Corrective and Preventive Action (CAPA) Records
CREATE TABLE IF NOT EXISTS capa_records (
  id SERIAL PRIMARY KEY,
  capa_number VARCHAR(50) UNIQUE NOT NULL,
  incident_id INTEGER REFERENCES quality_incidents(id) ON DELETE SET NULL,
  defect_id INTEGER REFERENCES quality_defects(id) ON DELETE SET NULL,
  problem_description TEXT NOT NULL,
  root_cause_analysis TEXT,
  corrective_action TEXT NOT NULL,
  preventive_action TEXT NOT NULL,
  assigned_to INTEGER,
  assigned_to_name VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  target_completion_date DATE NOT NULL,
  actual_completion_date DATE,
  status VARCHAR(30) DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'CLOSED', 'REOPENED')),
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. CAPA Verification Audit Log
CREATE TABLE IF NOT EXISTS capa_verifications (
  id SERIAL PRIMARY KEY,
  capa_id INTEGER NOT NULL REFERENCES capa_records(id) ON DELETE CASCADE,
  verification_date DATE NOT NULL DEFAULT CURRENT_DATE,
  verified_by INTEGER NOT NULL,
  verified_by_name VARCHAR(100),
  is_effective BOOLEAN NOT NULL DEFAULT TRUE,
  verification_notes TEXT NOT NULL,
  evidence_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Quality Attachments Metadata
CREATE TABLE IF NOT EXISTS quality_attachments (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(30) NOT NULL CHECK (entity_type IN ('INSPECTION', 'DEFECT', 'INCIDENT', 'CAPA')),
  entity_id INTEGER NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  file_url TEXT,
  uploaded_by INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Quality Status History
CREATE TABLE IF NOT EXISTS quality_status_history (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(30) NOT NULL CHECK (entity_type IN ('INSPECTION', 'CAPA', 'INCIDENT')),
  entity_id INTEGER NOT NULL,
  old_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,
  changed_by INTEGER,
  changed_by_name VARCHAR(100),
  reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qc_inspections_status ON quality_inspections(status);
CREATE INDEX IF NOT EXISTS idx_qc_inspections_type ON quality_inspections(inspection_type);
CREATE INDEX IF NOT EXISTS idx_qc_inspections_batch ON quality_inspections(batch_number);
CREATE INDEX IF NOT EXISTS idx_qc_defects_source ON quality_defects(defect_source);
CREATE INDEX IF NOT EXISTS idx_qc_defects_batch ON quality_defects(batch_number);
CREATE INDEX IF NOT EXISTS idx_capa_status ON capa_records(status);
CREATE INDEX IF NOT EXISTS idx_capa_incident ON capa_records(incident_id);
CREATE INDEX IF NOT EXISTS idx_qc_standards_target ON quality_standards(target_type, target_id);
