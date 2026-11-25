-- ============================================================================
-- Phase 13 Migration: Audit Management System
-- Sri Meenakshi Agro & Traditional Foods Pvt Ltd
-- ============================================================================

-- 1. Audit Plans
CREATE TABLE IF NOT EXISTS audit_plans (
  id SERIAL PRIMARY KEY,
  plan_number VARCHAR(50) UNIQUE NOT NULL, -- AP-YYYY-XXXX
  title VARCHAR(200) NOT NULL,
  department VARCHAR(50) NOT NULL, -- SALES, PURCHASE, INVENTORY, PRODUCTION, QUALITY, COSTING, GST_INVOICING, DISPATCH, PAYMENTS, GENERAL
  category VARCHAR(50) NOT NULL, -- SALES_AUDIT, PURCHASE_AUDIT, INVENTORY_AUDIT, PRODUCTION_AUDIT, QUALITY_AUDIT, COSTING_AUDIT, GST_INVOICE_AUDIT, DISPATCH_AUDIT, PAYMENT_AUDIT, GENERAL_INTERNAL_AUDIT
  lead_auditor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  lead_auditor_name VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  frequency VARCHAR(30) DEFAULT 'QUARTERLY' CHECK (frequency IN ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'BI_ANNUAL', 'ANNUAL')),
  scope TEXT NOT NULL,
  objectives TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status VARCHAR(30) DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Audit Checklist Templates Master
CREATE TABLE IF NOT EXISTS audit_checklists (
  id SERIAL PRIMARY KEY,
  template_code VARCHAR(50) UNIQUE NOT NULL, -- CHK-SALES-01, CHK-FSSAI-01, etc.
  template_name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  department VARCHAR(50) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Audit Checklist Questions / Criteria
CREATE TABLE IF NOT EXISTS audit_checklist_items (
  id SERIAL PRIMARY KEY,
  checklist_id INTEGER NOT NULL REFERENCES audit_checklists(id) ON DELETE CASCADE,
  item_code VARCHAR(30) NOT NULL,
  question TEXT NOT NULL,
  requirement_standard VARCHAR(150), -- e.g. FSSAI Act 2006, GST Rule 46, ISO 22000:2018
  compliance_guidance TEXT,
  severity VARCHAR(20) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Audit Team Assignments
CREATE TABLE IF NOT EXISTS audit_assignments (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES audit_plans(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_in_audit VARCHAR(50) DEFAULT 'AUDITOR' CHECK (role_in_audit IN ('LEAD_AUDITOR', 'AUDITOR', 'OBSERVER', 'REVIEWER')),
  assigned_date DATE DEFAULT CURRENT_DATE,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Audit Execution Records (Audit Sessions)
CREATE TABLE IF NOT EXISTS audit_records (
  id SERIAL PRIMARY KEY,
  audit_number VARCHAR(50) UNIQUE NOT NULL, -- AR-YYYY-XXXX
  plan_id INTEGER NOT NULL REFERENCES audit_plans(id) ON DELETE RESTRICT,
  checklist_id INTEGER REFERENCES audit_checklists(id) ON DELETE SET NULL,
  audit_date DATE NOT NULL,
  lead_auditor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  lead_auditor_name VARCHAR(100),
  auditee_representative VARCHAR(150),
  summary TEXT,
  total_items_checked INTEGER DEFAULT 0,
  passed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  na_items INTEGER DEFAULT 0,
  compliance_score_pct NUMERIC(5, 2) DEFAULT 0.00,
  status VARCHAR(30) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Audit Checklist Responses
CREATE TABLE IF NOT EXISTS audit_responses (
  id SERIAL PRIMARY KEY,
  audit_record_id INTEGER NOT NULL REFERENCES audit_records(id) ON DELETE CASCADE,
  checklist_item_id INTEGER NOT NULL REFERENCES audit_checklist_items(id) ON DELETE RESTRICT,
  response_status VARCHAR(20) NOT NULL CHECK (response_status IN ('PASS', 'FAIL', 'NOT_APPLICABLE', 'PENDING')),
  auditor_comments TEXT,
  evidence_notes TEXT,
  auditor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  auditor_name VARCHAR(100),
  response_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Audit Findings (Non-conformances & Observations)
CREATE TABLE IF NOT EXISTS audit_findings (
  id SERIAL PRIMARY KEY,
  finding_number VARCHAR(50) UNIQUE NOT NULL, -- AF-YYYY-XXXX
  audit_record_id INTEGER REFERENCES audit_records(id) ON DELETE SET NULL,
  plan_id INTEGER REFERENCES audit_plans(id) ON DELETE SET NULL,
  department VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  related_transaction_type VARCHAR(50), -- SALES_ORDER, PURCHASE_ORDER, GRN, INVENTORY_BATCH, PRODUCTION_ORDER, INSPECTION, INVOICE, DISPATCH, PAYMENT, OTHER
  related_transaction_reference VARCHAR(100),
  root_cause TEXT,
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(100),
  target_completion_date DATE NOT NULL,
  actual_completion_date DATE,
  status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'ACTION_ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'CLOSED', 'REOPENED')),
  capa_id INTEGER REFERENCES capa_records(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by_name VARCHAR(100),
  reopen_count INTEGER DEFAULT 0,
  reopen_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Audit Evidence Files & Documents
CREATE TABLE IF NOT EXISTS audit_evidence (
  id SERIAL PRIMARY KEY,
  audit_record_id INTEGER REFERENCES audit_records(id) ON DELETE CASCADE,
  finding_id INTEGER REFERENCES audit_findings(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  file_data TEXT, -- Base64 or local storage reference
  description TEXT,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  uploaded_by_name VARCHAR(100),
  uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Audit Risk Assessments
CREATE TABLE IF NOT EXISTS audit_risk_assessments (
  id SERIAL PRIMARY KEY,
  finding_id INTEGER NOT NULL REFERENCES audit_findings(id) ON DELETE CASCADE,
  likelihood VARCHAR(20) NOT NULL CHECK (likelihood IN ('RARE', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'ALMOST_CERTAIN')),
  impact VARCHAR(20) NOT NULL CHECK (impact IN ('INSIGNIFICANT', 'MINOR', 'MODERATE', 'MAJOR', 'CATASTROPHIC')),
  risk_score INTEGER NOT NULL, -- 1 to 25
  overall_risk VARCHAR(20) NOT NULL CHECK (overall_risk IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  mitigation_strategy TEXT NOT NULL,
  assessed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assessed_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Audit Actions (Action plans linked to findings / CAPA)
CREATE TABLE IF NOT EXISTS audit_actions (
  id SERIAL PRIMARY KEY,
  finding_id INTEGER NOT NULL REFERENCES audit_findings(id) ON DELETE CASCADE,
  action_type VARCHAR(30) NOT NULL CHECK (action_type IN ('CORRECTIVE', 'PREVENTIVE', 'IMMEDIATE_CONTAINMENT')),
  action_description TEXT NOT NULL,
  responsible_person INTEGER REFERENCES users(id) ON DELETE SET NULL,
  responsible_person_name VARCHAR(100),
  target_date DATE NOT NULL,
  completion_date DATE,
  status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'FAILED')),
  action_taken_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Audit Verifications (Closure gatekeeper)
CREATE TABLE IF NOT EXISTS audit_verifications (
  id SERIAL PRIMARY KEY,
  finding_id INTEGER NOT NULL REFERENCES audit_findings(id) ON DELETE CASCADE,
  verification_date DATE NOT NULL DEFAULT CURRENT_DATE,
  verified_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  verified_by_name VARCHAR(100),
  is_effective BOOLEAN NOT NULL DEFAULT true,
  verification_notes TEXT NOT NULL,
  reopen_reason TEXT,
  evidence_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Audit Status History (Immutable audit trail)
CREATE TABLE IF NOT EXISTS audit_status_history (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(30) NOT NULL CHECK (entity_type IN ('AUDIT_PLAN', 'AUDIT_RECORD', 'AUDIT_FINDING', 'AUDIT_ACTION')),
  entity_id INTEGER NOT NULL,
  entity_number VARCHAR(50),
  old_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  changed_by_name VARCHAR(100),
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning-fast queries and reporting
CREATE INDEX IF NOT EXISTS idx_audit_plans_dept ON audit_plans(department);
CREATE INDEX IF NOT EXISTS idx_audit_plans_status ON audit_plans(status);
CREATE INDEX IF NOT EXISTS idx_audit_records_plan ON audit_records(plan_id);
CREATE INDEX IF NOT EXISTS idx_audit_records_status ON audit_records(status);
CREATE INDEX IF NOT EXISTS idx_audit_findings_risk ON audit_findings(risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_findings_status ON audit_findings(status);
CREATE INDEX IF NOT EXISTS idx_audit_findings_dept ON audit_findings(department);
CREATE INDEX IF NOT EXISTS idx_audit_responses_rec ON audit_responses(audit_record_id);
CREATE INDEX IF NOT EXISTS idx_audit_status_hist ON audit_status_history(entity_type, entity_id);
