-- ============================================================================
-- Phase 14 Migration: Reports & Analytics System
-- Sri Meenakshi Agro & Traditional Foods Pvt Ltd
-- ============================================================================

-- 1. Report Definitions Master
CREATE TABLE IF NOT EXISTS report_definitions (
  id SERIAL PRIMARY KEY,
  report_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. REP-SALES-DAILY, REP-INV-VALUATION
  report_name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'EXECUTIVE', 'SALES', 'PURCHASE', 'INVENTORY', 'PRODUCTION',
    'QUALITY', 'COSTING', 'GST', 'DISPATCH', 'PAYMENTS', 'AUDIT'
  )),
  description TEXT,
  default_filters JSONB DEFAULT '{}',
  is_system BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Report Filters Metadata
CREATE TABLE IF NOT EXISTS report_filters (
  id SERIAL PRIMARY KEY,
  report_definition_id INTEGER NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  filter_name VARCHAR(100) NOT NULL,
  filter_key VARCHAR(50) NOT NULL,
  filter_type VARCHAR(30) NOT NULL CHECK (filter_type IN ('DATE', 'DATE_RANGE', 'SELECT', 'MULTI_SELECT', 'TEXT', 'NUMERIC')),
  options JSONB DEFAULT '[]',
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Saved User Report Configurations
CREATE TABLE IF NOT EXISTS saved_reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_definition_id INTEGER NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  custom_title VARCHAR(150) NOT NULL,
  saved_filters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Scheduled Report Automations
CREATE TABLE IF NOT EXISTS report_schedules (
  id SERIAL PRIMARY KEY,
  schedule_name VARCHAR(150) NOT NULL,
  report_definition_id INTEGER NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  frequency VARCHAR(30) NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  schedule_time TIME DEFAULT '08:00:00',
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  export_format VARCHAR(20) DEFAULT 'PDF' CHECK (export_format IN ('PDF', 'CSV', 'EXCEL')),
  recipients TEXT, -- Internal distribution list
  applied_filters JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Report Execution & Generation Logs
CREATE TABLE IF NOT EXISTS report_execution_logs (
  id SERIAL PRIMARY KEY,
  report_definition_id INTEGER REFERENCES report_definitions(id) ON DELETE SET NULL,
  schedule_id INTEGER REFERENCES report_schedules(id) ON DELETE SET NULL,
  executed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  execution_type VARCHAR(20) DEFAULT 'MANUAL' CHECK (execution_type IN ('MANUAL', 'SCHEDULED')),
  status VARCHAR(20) DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'IN_PROGRESS')),
  parameters_used JSONB DEFAULT '{}',
  record_count INTEGER DEFAULT 0,
  execution_time_ms INTEGER DEFAULT 0,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. User Executive Dashboard Preferences
CREATE TABLE IF NOT EXISTS dashboard_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visible_widgets JSONB DEFAULT '[]',
  default_date_range VARCHAR(30) DEFAULT 'CURRENT_MONTH',
  chart_theme VARCHAR(30) DEFAULT 'LIGHT',
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_rep_def_cat ON report_definitions(category);
CREATE INDEX IF NOT EXISTS idx_saved_rep_user ON saved_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_rep_sched_active ON report_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_rep_logs_rep ON report_execution_logs(report_definition_id);
CREATE INDEX IF NOT EXISTS idx_rep_logs_time ON report_execution_logs(executed_at);
