-- ============================================================================
-- Phase 5: Purchase & Procurement Management System
-- Sri Meenakshi Agro & Traditional Foods ERP System
-- ============================================================================
-- Run this AFTER migrations 001, 002, 003 are applied.
-- All monetary fields use NUMERIC(14,2); quantities use NUMERIC(12,3)
-- because food manufacturing needs 3 decimal places (grams / litres).
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 1: Purchase Requisitions (PR)
-- A PR is an internal request to buy raw materials or packaging.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_requisitions (
  id                   SERIAL PRIMARY KEY,
  requisition_number   VARCHAR(20) UNIQUE NOT NULL,          -- e.g. PR-2026-001
  request_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  requested_by         INT NOT NULL REFERENCES users(id),
  department           VARCHAR(100) NOT NULL,
  required_delivery_date DATE,
  priority             VARCHAR(10) NOT NULL DEFAULT 'MEDIUM'
                       CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT')),
  reason_for_purchase  TEXT,
  status               VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                       CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED','CANCELLED')),
  approved_by          INT REFERENCES users(id),
  approved_at          TIMESTAMPTZ,
  rejection_reason     TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 2: Purchase Requisition Items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_requisition_items (
  id                 SERIAL PRIMARY KEY,
  requisition_id     INT NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  item_type          VARCHAR(20) NOT NULL CHECK (item_type IN ('RAW_MATERIAL','PACKAGING')),
  material_id        INT NOT NULL,                        -- FK to raw_materials or packaging_materials
  material_name      VARCHAR(200) NOT NULL,               -- Denormalised for quick display
  required_qty       NUMERIC(12,3) NOT NULL CHECK (required_qty > 0),
  uom                VARCHAR(30) NOT NULL,
  remarks            TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 3: Supplier Quotations (QT)
-- Supplier's price offer for the materials in a PR (or standalone).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_quotations (
  id                 SERIAL PRIMARY KEY,
  quotation_number   VARCHAR(20) UNIQUE NOT NULL,          -- e.g. QT-2026-001
  supplier_id        INT NOT NULL REFERENCES suppliers(id),
  requisition_id     INT REFERENCES purchase_requisitions(id),
  quotation_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until        DATE,
  payment_terms      VARCHAR(100),
  delivery_terms     VARCHAR(100),
  notes              TEXT,
  status             VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                     CHECK (status IN ('DRAFT','SUBMITTED','SELECTED','EXPIRED','CANCELLED')),
  created_by         INT NOT NULL REFERENCES users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 4: Supplier Quotation Items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_quotation_items (
  id                 SERIAL PRIMARY KEY,
  quotation_id       INT NOT NULL REFERENCES supplier_quotations(id) ON DELETE CASCADE,
  item_type          VARCHAR(20) NOT NULL CHECK (item_type IN ('RAW_MATERIAL','PACKAGING')),
  material_id        INT NOT NULL,
  material_name      VARCHAR(200) NOT NULL,
  uom                VARCHAR(30) NOT NULL,
  required_qty       NUMERIC(12,3) NOT NULL,
  unit_price         NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
  discount_pct       NUMERIC(5,2) NOT NULL DEFAULT 0,
  gst_rate           NUMERIC(5,2) NOT NULL DEFAULT 0,
  taxable_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount         NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  delivery_days      INT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 5: Purchase Orders (PO)
-- A PO is a formal order sent to a supplier based on an approved PR/quotation.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id                 SERIAL PRIMARY KEY,
  po_number          VARCHAR(20) UNIQUE NOT NULL,          -- e.g. PO-2026-001
  supplier_id        INT NOT NULL REFERENCES suppliers(id),
  quotation_id       INT REFERENCES supplier_quotations(id),
  requisition_id     INT REFERENCES purchase_requisitions(id),
  po_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  delivery_address   TEXT,
  payment_terms      VARCHAR(100),
  notes              TEXT,
  status             VARCHAR(25) NOT NULL DEFAULT 'DRAFT'
                     CHECK (status IN (
                       'DRAFT','SUBMITTED','APPROVED','REJECTED',
                       'SENT','PARTIALLY_RECEIVED','RECEIVED','CANCELLED'
                     )),
  subtotal_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  taxable_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  cgst_amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
  sgst_amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
  igst_amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_tax_amount   NUMERIC(14,2) NOT NULL DEFAULT 0,
  grand_total        NUMERIC(14,2) NOT NULL DEFAULT 0,
  approved_by        INT REFERENCES users(id),
  approved_at        TIMESTAMPTZ,
  rejection_reason   TEXT,
  created_by         INT NOT NULL REFERENCES users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 6: Purchase Order Items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                 SERIAL PRIMARY KEY,
  po_id              INT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_type          VARCHAR(20) NOT NULL CHECK (item_type IN ('RAW_MATERIAL','PACKAGING')),
  material_id        INT NOT NULL,
  material_name      VARCHAR(200) NOT NULL,
  uom                VARCHAR(30) NOT NULL,
  ordered_qty        NUMERIC(12,3) NOT NULL CHECK (ordered_qty > 0),
  unit_price         NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
  discount_pct       NUMERIC(5,2) NOT NULL DEFAULT 0,
  gst_rate           NUMERIC(5,2) NOT NULL DEFAULT 0,
  taxable_value      NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount         NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  received_qty       NUMERIC(12,3) NOT NULL DEFAULT 0,    -- cumulative received so far
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 7: Purchase Approvals
-- Approval/rejection log for PR and PO.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_approvals (
  id                 SERIAL PRIMARY KEY,
  entity_type        VARCHAR(5) NOT NULL CHECK (entity_type IN ('PR','PO')),
  entity_id          INT NOT NULL,
  approver_id        INT NOT NULL REFERENCES users(id),
  decision           VARCHAR(10) NOT NULL CHECK (decision IN ('APPROVED','REJECTED','RETURNED')),
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 8: Goods Receipt Notes (GRN)
-- Records physical goods received against a Purchase Order.
-- GRN does NOT update stock — that is Phase 6 (Inventory).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goods_receipts (
  id                 SERIAL PRIMARY KEY,
  grn_number         VARCHAR(20) UNIQUE NOT NULL,          -- e.g. GRN-2026-001
  po_id              INT NOT NULL REFERENCES purchase_orders(id),
  grn_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  challan_number     VARCHAR(100),                         -- Supplier delivery challan
  vehicle_number     VARCHAR(30),
  received_by        INT NOT NULL REFERENCES users(id),
  notes              TEXT,
  status             VARCHAR(15) NOT NULL DEFAULT 'DRAFT'
                     CHECK (status IN ('DRAFT','POSTED','CANCELLED')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 9: Goods Receipt Items
-- Line-by-line quantity inspection (accepted, rejected, damaged, shortage).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goods_receipt_items (
  id                        SERIAL PRIMARY KEY,
  grn_id                    INT NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
  po_item_id                INT NOT NULL REFERENCES purchase_order_items(id),
  item_type                 VARCHAR(20) NOT NULL,
  material_id               INT NOT NULL,
  material_name             VARCHAR(200) NOT NULL,
  uom                       VARCHAR(30) NOT NULL,
  ordered_qty               NUMERIC(12,3) NOT NULL,
  prev_received_qty         NUMERIC(12,3) NOT NULL DEFAULT 0,
  current_received_qty      NUMERIC(12,3) NOT NULL CHECK (current_received_qty >= 0),
  accepted_qty              NUMERIC(12,3) NOT NULL DEFAULT 0,
  rejected_qty              NUMERIC(12,3) NOT NULL DEFAULT 0,
  damaged_qty               NUMERIC(12,3) NOT NULL DEFAULT 0,
  shortage_qty              NUMERIC(12,3) GENERATED ALWAYS AS
                            (ordered_qty - prev_received_qty - current_received_qty) STORED,
  batch_number              VARCHAR(100),
  mfg_date                  DATE,
  expiry_date               DATE,
  quality_result            VARCHAR(10) NOT NULL DEFAULT 'PENDING'
                            CHECK (quality_result IN ('PASS','FAIL','PENDING')),
  remarks                   TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Quantity sanity check: accepted + rejected + damaged must not exceed current_received
  CONSTRAINT chk_grn_qty CHECK (accepted_qty + rejected_qty + damaged_qty <= current_received_qty)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 10: Supplier Invoices
-- The tax invoice raised by the supplier for goods/services delivered.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_invoices (
  id                       SERIAL PRIMARY KEY,
  invoice_number           VARCHAR(20) UNIQUE NOT NULL,     -- Internal: INV-2026-001
  supplier_id              INT NOT NULL REFERENCES suppliers(id),
  po_id                    INT NOT NULL REFERENCES purchase_orders(id),
  grn_id                   INT REFERENCES goods_receipts(id),
  supplier_invoice_number  VARCHAR(100) NOT NULL,           -- Supplier's own invoice#
  invoice_date             DATE NOT NULL,
  due_date                 DATE,
  taxable_amount           NUMERIC(14,2) NOT NULL DEFAULT 0,
  cgst_amount              NUMERIC(14,2) NOT NULL DEFAULT 0,
  sgst_amount              NUMERIC(14,2) NOT NULL DEFAULT 0,
  igst_amount              NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_tax_amount         NUMERIC(14,2) NOT NULL DEFAULT 0,
  grand_total              NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount_paid              NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_status           VARCHAR(20) NOT NULL DEFAULT 'UNPAID'
                           CHECK (payment_status IN ('UNPAID','PARTIALLY_PAID','PAID')),
  notes                    TEXT,
  created_by               INT NOT NULL REFERENCES users(id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Each supplier can only have one invoice with a given number
  UNIQUE (supplier_id, supplier_invoice_number)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 11: Supplier Invoice Items
-- Line items of the supplier's tax invoice.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_invoice_items (
  id                 SERIAL PRIMARY KEY,
  invoice_id         INT NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  po_item_id         INT REFERENCES purchase_order_items(id),
  item_type          VARCHAR(20) NOT NULL,
  material_id        INT NOT NULL,
  material_name      VARCHAR(200) NOT NULL,
  uom                VARCHAR(30) NOT NULL,
  invoiced_qty       NUMERIC(12,3) NOT NULL,
  unit_price         NUMERIC(14,2) NOT NULL,
  taxable_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  gst_rate           NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount         NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 12: Purchase Status History
-- Audit trail for every status change on PR or PO.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_status_history (
  id                 SERIAL PRIMARY KEY,
  entity_type        VARCHAR(5) NOT NULL CHECK (entity_type IN ('PR','PO','GRN','INV')),
  entity_id          INT NOT NULL,
  from_status        VARCHAR(30),
  to_status          VARCHAR(30) NOT NULL,
  changed_by         INT NOT NULL REFERENCES users(id),
  reason             TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 13: Three-Way Matching Records
-- Matches PO quantities/prices → GRN receipt quantities → Supplier Invoice.
-- A discrepant invoice MUST be manually reviewed; never auto-approved.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS three_way_matching_records (
  id                       SERIAL PRIMARY KEY,
  invoice_id               INT NOT NULL REFERENCES supplier_invoices(id),
  po_id                    INT NOT NULL REFERENCES purchase_orders(id),
  grn_id                   INT REFERENCES goods_receipts(id),
  match_status             VARCHAR(25) NOT NULL DEFAULT 'PENDING_REVIEW'
                           CHECK (match_status IN (
                             'MATCHED','PARTIALLY_MATCHED','DISCREPANCY','PENDING_REVIEW'
                           )),
  po_grand_total           NUMERIC(14,2),
  grn_accepted_qty_total   NUMERIC(12,3),
  invoice_grand_total      NUMERIC(14,2),
  qty_variance             NUMERIC(12,3),     -- GRN accepted qty vs Invoice qty
  price_variance           NUMERIC(14,2),     -- PO price vs Invoice price
  discrepancy_details      TEXT,              -- Human-readable description of issues
  reviewed_by              INT REFERENCES users(id),
  reviewed_at              TIMESTAMPTZ,
  review_explanation       TEXT,              -- Mandatory for discrepant invoices
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES (Performance — Filter by status and date often)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pr_status ON purchase_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_pr_requested_by ON purchase_requisitions(requested_by);
CREATE INDEX IF NOT EXISTS idx_pr_date ON purchase_requisitions(request_date);

CREATE INDEX IF NOT EXISTS idx_qt_supplier ON supplier_quotations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_qt_status ON supplier_quotations(status);

CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_date ON purchase_orders(po_date);

CREATE INDEX IF NOT EXISTS idx_grn_po ON goods_receipts(po_id);
CREATE INDEX IF NOT EXISTS idx_grn_status ON goods_receipts(status);

CREATE INDEX IF NOT EXISTS idx_inv_supplier ON supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inv_payment ON supplier_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_inv_po ON supplier_invoices(po_id);

CREATE INDEX IF NOT EXISTS idx_match_invoice ON three_way_matching_records(invoice_id);
CREATE INDEX IF NOT EXISTS idx_match_status ON three_way_matching_records(match_status);

CREATE INDEX IF NOT EXISTS idx_psh_entity ON purchase_status_history(entity_type, entity_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- END OF PHASE 5 MIGRATION
-- Next: Phase 6 — Inventory (Stock Ledger, RM balances, Finished Goods)
-- ─────────────────────────────────────────────────────────────────────────────
