-- ============================================================================
-- Phase 12 Migration: Payment Management System
-- Sri Meenakshi Agro & Traditional Foods Pvt Ltd
-- ============================================================================

-- 1. Payment Methods Master
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  method_code VARCHAR(30) UNIQUE NOT NULL, -- CASH, BANK_TRANSFER, UPI, CHEQUE, CARD
  method_name VARCHAR(100) NOT NULL,
  requires_reference BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Cash & Company Bank Accounts Master
CREATE TABLE IF NOT EXISTS cash_bank_accounts (
  id SERIAL PRIMARY KEY,
  account_code VARCHAR(50) UNIQUE NOT NULL,
  account_name VARCHAR(150) NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('CASH', 'BANK')),
  bank_name VARCHAR(150),
  account_number VARCHAR(50),
  ifsc_code VARCHAR(20),
  branch_name VARCHAR(100),
  opening_balance NUMERIC(15, 2) DEFAULT 0.00,
  current_balance NUMERIC(15, 2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customer Payments (Receipts)
CREATE TABLE IF NOT EXISTS customer_payments (
  id SERIAL PRIMARY KEY,
  receipt_number VARCHAR(50) UNIQUE NOT NULL, -- RCP-2026-0001
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  customer_name VARCHAR(200) NOT NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(30) NOT NULL,
  cash_bank_account_id INTEGER REFERENCES cash_bank_accounts(id) ON DELETE RESTRICT,
  reference_number VARCHAR(100),
  cheque_number VARCHAR(50),
  cheque_date DATE,
  bank_name VARCHAR(100),
  notes TEXT,
  status VARCHAR(30) DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'ALLOCATED', 'PARTIALLY_ALLOCATED', 'REVERSED')),
  allocated_amount NUMERIC(15, 2) DEFAULT 0.00 CHECK (allocated_amount >= 0),
  unallocated_amount NUMERIC(15, 2) DEFAULT 0.00 CHECK (unallocated_amount >= 0),
  is_advance BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Customer Payment Allocations (Linking Payments to Invoices)
CREATE TABLE IF NOT EXISTS customer_payment_allocations (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL REFERENCES customer_payments(id) ON DELETE CASCADE,
  invoice_id INTEGER NOT NULL, -- references sales_invoices(id)
  invoice_number VARCHAR(50) NOT NULL,
  allocated_amount NUMERIC(15, 2) NOT NULL CHECK (allocated_amount > 0),
  allocation_date DATE NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Supplier Payments (Vouchers)
CREATE TABLE IF NOT EXISTS supplier_payments (
  id SERIAL PRIMARY KEY,
  voucher_number VARCHAR(50) UNIQUE NOT NULL, -- PV-2026-0001
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  supplier_name VARCHAR(200) NOT NULL,
  payment_date DATE NOT NULL,
  due_date DATE,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(30) NOT NULL,
  cash_bank_account_id INTEGER REFERENCES cash_bank_accounts(id) ON DELETE RESTRICT,
  reference_number VARCHAR(100),
  cheque_number VARCHAR(50),
  cheque_date DATE,
  bank_name VARCHAR(100),
  notes TEXT,
  status VARCHAR(30) DEFAULT 'PAID' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'REVERSED')),
  allocated_amount NUMERIC(15, 2) DEFAULT 0.00 CHECK (allocated_amount >= 0),
  unallocated_amount NUMERIC(15, 2) DEFAULT 0.00 CHECK (unallocated_amount >= 0),
  is_advance BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  discrepancy_override_reason TEXT,
  discrepancy_approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Supplier Payment Allocations
CREATE TABLE IF NOT EXISTS supplier_payment_allocations (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL REFERENCES supplier_payments(id) ON DELETE CASCADE,
  supplier_invoice_id INTEGER NOT NULL, -- references supplier_invoices(id)
  invoice_number VARCHAR(50) NOT NULL,
  allocated_amount NUMERIC(15, 2) NOT NULL CHECK (allocated_amount > 0),
  allocation_date DATE NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Payment Vouchers Printable Particulars
CREATE TABLE IF NOT EXISTS payment_vouchers (
  id SERIAL PRIMARY KEY,
  voucher_number VARCHAR(50) UNIQUE NOT NULL,
  voucher_type VARCHAR(30) DEFAULT 'SUPPLIER_PAYMENT',
  payment_id INTEGER NOT NULL REFERENCES supplier_payments(id) ON DELETE CASCADE,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  supplier_name VARCHAR(200) NOT NULL,
  voucher_date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  reference_number VARCHAR(100),
  total_allocated_invoices INTEGER DEFAULT 0,
  authorized_by VARCHAR(100) DEFAULT 'Authorized Accountant',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Payment Receipts Printable Particulars
CREATE TABLE IF NOT EXISTS payment_receipts (
  id SERIAL PRIMARY KEY,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  receipt_type VARCHAR(30) DEFAULT 'CUSTOMER_RECEIPT',
  payment_id INTEGER NOT NULL REFERENCES customer_payments(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  customer_name VARCHAR(200) NOT NULL,
  receipt_date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  reference_number VARCHAR(100),
  total_allocated_invoices INTEGER DEFAULT 0,
  received_by VARCHAR(100) DEFAULT 'Accounts Officer',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Bank Statement Imports
CREATE TABLE IF NOT EXISTS bank_statement_imports (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES cash_bank_accounts(id) ON DELETE RESTRICT,
  file_name VARCHAR(255) NOT NULL,
  file_hash VARCHAR(64),
  import_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  total_rows INTEGER DEFAULT 0,
  opening_balance NUMERIC(15, 2) DEFAULT 0.00,
  closing_balance NUMERIC(15, 2) DEFAULT 0.00,
  statement_start_date DATE,
  statement_end_date DATE,
  imported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Bank Statement Lines
CREATE TABLE IF NOT EXISTS bank_statement_lines (
  id SERIAL PRIMARY KEY,
  import_id INTEGER NOT NULL REFERENCES bank_statement_imports(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES cash_bank_accounts(id) ON DELETE RESTRICT,
  transaction_date DATE NOT NULL,
  value_date DATE,
  description TEXT NOT NULL,
  reference_number VARCHAR(100),
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('CREDIT', 'DEBIT')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  balance_after NUMERIC(15, 2),
  reconciliation_status VARCHAR(30) DEFAULT 'UNMATCHED' CHECK (reconciliation_status IN ('UNMATCHED', 'MATCHED', 'PARTIALLY_MATCHED')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Payment Reconciliations
CREATE TABLE IF NOT EXISTS payment_reconciliations (
  id SERIAL PRIMARY KEY,
  statement_line_id INTEGER NOT NULL REFERENCES bank_statement_lines(id) ON DELETE CASCADE,
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('CUSTOMER', 'SUPPLIER')),
  payment_id INTEGER NOT NULL,
  matched_amount NUMERIC(15, 2) NOT NULL CHECK (matched_amount > 0),
  reconciled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reconciled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  status VARCHAR(30) DEFAULT 'MATCHED' CHECK (status IN ('MATCHED', 'PARTIALLY_MATCHED'))
);

-- 12. Payment Reversals (For Bounced Cheques & Failed Payments)
CREATE TABLE IF NOT EXISTS payment_reversals (
  id SERIAL PRIMARY KEY,
  reversal_number VARCHAR(50) UNIQUE NOT NULL, -- REV-2026-0001
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('CUSTOMER', 'SUPPLIER')),
  payment_id INTEGER NOT NULL,
  reversal_date DATE NOT NULL,
  reversal_reason VARCHAR(50) NOT NULL CHECK (reversal_reason IN ('BOUNCED_CHEQUE', 'FAILED_TRANSFER', 'DATA_ENTRY_ERROR', 'CUSTOMER_DISPUTE')),
  reversal_amount NUMERIC(15, 2) NOT NULL CHECK (reversal_amount > 0),
  reversed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. Payment Status & Audit History
CREATE TABLE IF NOT EXISTS payment_status_history (
  id SERIAL PRIMARY KEY,
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('CUSTOMER', 'SUPPLIER')),
  payment_id INTEGER NOT NULL,
  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer ON customer_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_date ON customer_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_customer_payment_alloc_invoice ON customer_payment_allocations(invoice_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_date ON supplier_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_supplier_payment_alloc_inv ON supplier_payment_allocations(supplier_invoice_id);
CREATE INDEX IF NOT EXISTS idx_stmt_lines_account_recon ON bank_statement_lines(account_id, reconciliation_status);
