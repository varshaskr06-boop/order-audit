/**
 * ============================================================================
 * Purchase & Procurement Model
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 *
 * This file manages:
 *   - Purchase Requisitions (PR)
 *   - Supplier Quotations (QT)
 *   - Purchase Orders (PO)
 *   - Goods Receipt Notes (GRN)
 *   - Supplier Invoices (INV)
 *   - Three-Way Matching (3WM)
 *   - Status History
 *
 * DUAL MODE: When PostgreSQL is running, all data is saved to the real database.
 * When PostgreSQL is offline, data is stored in memory (in-memory arrays).
 * This lets you develop and test even without a database server.
 */

const { query } = require('../config/db');

// ─── Helper ───────────────────────────────────────────────────────────────────
// Round a number to exactly 2 decimal places (money-safe arithmetic)
const round2 = (val) => Math.round((parseFloat(val) + Number.EPSILON) * 100) / 100;

// Auto-number generators: PR-2026-001, QT-2026-001, etc.
const makeNumber = (prefix, counter) => {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(counter).padStart(3, '0')}`;
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
// These are realistic Tamil Nadu food-manufacturing procurement records.
// Supplier IDs match masterDataModel:
//   1 = Kaveri Delta Agro (TN-33), 2 = Guntur Dal Traders (AP-37-Interstate)
//   3 = Erode Spices (TN-33), 4 = Aavin (TN-33), 5 = Sri Balaji Packaging (TN-33)
// User IDs: 2=ADMIN, 3=SALESMAN, 4=PRODUCTION, 5=ACCOUNTANT, 6=OWNER

const INITIAL_REQUISITIONS = [
  {
    id: 1,
    requisition_number: 'PR-2026-001',
    request_date: '2026-01-10',
    requested_by: 4,                // Production Supervisor
    department: 'Production',
    required_delivery_date: '2026-01-15',
    priority: 'HIGH',
    reason_for_purchase: 'Monthly Idli/Dosa batter raw material replenishment for January production batch.',
    status: 'APPROVED',
    approved_by: 2,
    approved_at: new Date('2026-01-11T10:00:00Z'),
    rejection_reason: null,
    created_at: new Date('2026-01-10T09:00:00Z'),
    updated_at: new Date('2026-01-11T10:00:00Z'),
    items: [
      { id: 1, requisition_id: 1, item_type: 'RAW_MATERIAL', material_id: 1, material_name: 'Ponni Boiled Rice (Idli Grade)', required_qty: 500, uom: 'KG', remarks: 'Premium grade only. Check moisture < 14%.' },
      { id: 2, requisition_id: 1, item_type: 'RAW_MATERIAL', material_id: 2, material_name: 'Urad Dal (Black Gram, Split)', required_qty: 150, uom: 'KG', remarks: 'Guntur variety preferred.' },
    ],
  },
  {
    id: 2,
    requisition_number: 'PR-2026-002',
    request_date: '2026-01-18',
    requested_by: 4,                // Production Supervisor
    department: 'Production',
    required_delivery_date: '2026-01-25',
    priority: 'MEDIUM',
    reason_for_purchase: 'Packaging material restock for Murukku and Mixture product lines.',
    status: 'DRAFT',
    approved_by: null,
    approved_at: null,
    rejection_reason: null,
    created_at: new Date('2026-01-18T11:00:00Z'),
    updated_at: new Date('2026-01-18T11:00:00Z'),
    items: [
      { id: 3, requisition_id: 2, item_type: 'PACKAGING', material_id: 1, material_name: 'BOPP Laminated Pouch 250g', required_qty: 5000, uom: 'PCS', remarks: 'Supplier: Sri Balaji Flexible Packaging.' },
      { id: 4, requisition_id: 2, item_type: 'PACKAGING', material_id: 2, material_name: 'BOPP Laminated Pouch 500g', required_qty: 3000, uom: 'PCS', remarks: 'Confirm lead time before ordering.' },
    ],
  },
];

const INITIAL_QUOTATIONS = [
  {
    id: 1,
    quotation_number: 'QT-2026-001',
    supplier_id: 1,                  // Kaveri Delta Agro (TN-33 Intrastate)
    requisition_id: 1,
    quotation_date: '2026-01-11',
    valid_until: '2026-01-20',
    payment_terms: 'Net 15',
    delivery_terms: 'Delivery at Factory, Kappalur',
    notes: 'Ponni rice from Jan 2026 harvest. Moisture certified.',
    status: 'SELECTED',
    created_by: 2,
    created_at: new Date('2026-01-11T12:00:00Z'),
    updated_at: new Date('2026-01-12T09:00:00Z'),
    items: [
      {
        id: 1, quotation_id: 1,
        item_type: 'RAW_MATERIAL', material_id: 1,
        material_name: 'Ponni Boiled Rice (Idli Grade)',
        uom: 'KG', required_qty: 500,
        unit_price: 42.00, discount_pct: 2.00, gst_rate: 0,
        taxable_amount: round2(500 * 42.00 * (1 - 2/100)),
        tax_amount: 0,
        total_amount: round2(500 * 42.00 * (1 - 2/100)),
        delivery_days: 2,
      },
      {
        id: 2, quotation_id: 1,
        item_type: 'RAW_MATERIAL', material_id: 2,
        material_name: 'Urad Dal (Black Gram, Split)',
        uom: 'KG', required_qty: 150,
        unit_price: 95.00, discount_pct: 0, gst_rate: 5,
        taxable_amount: round2(150 * 95.00),
        tax_amount: round2(150 * 95.00 * 0.05),
        total_amount: round2(150 * 95.00 * 1.05),
        delivery_days: 2,
      },
    ],
  },
  {
    id: 2,
    quotation_number: 'QT-2026-002',
    supplier_id: 2,                  // Guntur Dal Traders (AP-37 Interstate → IGST)
    requisition_id: 1,
    quotation_date: '2026-01-11',
    valid_until: '2026-01-21',
    payment_terms: 'Net 7',
    delivery_terms: 'FOR Destination',
    notes: 'Guntur-variety urad dal. Transport via Madurai goods agent.',
    status: 'SUBMITTED',
    created_by: 2,
    created_at: new Date('2026-01-11T14:00:00Z'),
    updated_at: new Date('2026-01-11T14:00:00Z'),
    items: [
      {
        id: 3, quotation_id: 2,
        item_type: 'RAW_MATERIAL', material_id: 1,
        material_name: 'Ponni Boiled Rice (Idli Grade)',
        uom: 'KG', required_qty: 500,
        unit_price: 44.00, discount_pct: 0, gst_rate: 0,
        taxable_amount: round2(500 * 44.00),
        tax_amount: 0,
        total_amount: round2(500 * 44.00),
        delivery_days: 4,
      },
      {
        id: 4, quotation_id: 2,
        item_type: 'RAW_MATERIAL', material_id: 2,
        material_name: 'Urad Dal (Black Gram, Split)',
        uom: 'KG', required_qty: 150,
        unit_price: 90.00, discount_pct: 0, gst_rate: 5,
        taxable_amount: round2(150 * 90.00),
        tax_amount: round2(150 * 90.00 * 0.05),  // IGST (interstate)
        total_amount: round2(150 * 90.00 * 1.05),
        delivery_days: 4,
      },
    ],
  },
  {
    id: 3,
    quotation_number: 'QT-2026-003',
    supplier_id: 5,                  // Sri Balaji Flexible Packaging (TN-33)
    requisition_id: null,
    quotation_date: '2026-01-18',
    valid_until: '2026-02-18',
    payment_terms: 'Net 30',
    delivery_terms: 'Delivery at Factory',
    notes: 'BOPP laminated pouches. Custom printing available.',
    status: 'SUBMITTED',
    created_by: 2,
    created_at: new Date('2026-01-18T13:00:00Z'),
    updated_at: new Date('2026-01-18T13:00:00Z'),
    items: [
      {
        id: 5, quotation_id: 3,
        item_type: 'PACKAGING', material_id: 1,
        material_name: 'BOPP Laminated Pouch 250g',
        uom: 'PCS', required_qty: 5000,
        unit_price: 3.50, discount_pct: 5.00, gst_rate: 18,
        taxable_amount: round2(5000 * 3.50 * (1 - 5/100)),
        tax_amount: round2(5000 * 3.50 * (1 - 5/100) * 0.18),
        total_amount: round2(5000 * 3.50 * (1 - 5/100) * 1.18),
        delivery_days: 7,
      },
    ],
  },
];

const INITIAL_PURCHASE_ORDERS = [
  {
    id: 1,
    po_number: 'PO-2026-001',
    supplier_id: 1,                  // Kaveri Delta Agro (TN-33)
    quotation_id: 1,
    requisition_id: 1,
    po_date: '2026-01-12',
    expected_delivery_date: '2026-01-14',
    delivery_address: 'Plot No. 42-B, SIDCO Industrial Estate, Kappalur, Madurai, TN - 625008',
    payment_terms: 'Net 15',
    notes: 'Please deliver before 10 AM for quality inspection.',
    status: 'APPROVED',
    subtotal_amount: 35175.00,
    discount_amount: 420.00,
    taxable_amount: 34755.00,       // Rice: 20580 (0% GST), Dal: 14250 (intrastate)
    cgst_amount: 356.25,            // 2.5% CGST on dal taxable
    sgst_amount: 356.25,            // 2.5% SGST on dal taxable
    igst_amount: 0,
    total_tax_amount: 712.50,
    grand_total: 35467.50,
    approved_by: 2,
    approved_at: new Date('2026-01-12T15:00:00Z'),
    rejection_reason: null,
    created_by: 2,
    created_at: new Date('2026-01-12T14:00:00Z'),
    updated_at: new Date('2026-01-12T15:00:00Z'),
    items: [
      {
        id: 1, po_id: 1,
        item_type: 'RAW_MATERIAL', material_id: 1,
        material_name: 'Ponni Boiled Rice (Idli Grade)',
        uom: 'KG', ordered_qty: 500, unit_price: 42.00,
        discount_pct: 2.00, gst_rate: 0,
        taxable_value: 20580.00,
        tax_amount: 0, total_amount: 20580.00, received_qty: 500,
      },
      {
        id: 2, po_id: 1,
        item_type: 'RAW_MATERIAL', material_id: 2,
        material_name: 'Urad Dal (Black Gram, Split)',
        uom: 'KG', ordered_qty: 150, unit_price: 95.00,
        discount_pct: 0, gst_rate: 5,
        taxable_value: 14250.00,
        tax_amount: 712.50, total_amount: 14962.50, received_qty: 150,
      },
    ],
  },
];

const INITIAL_GRNS = [
  {
    id: 1,
    grn_number: 'GRN-2026-001',
    po_id: 1,
    grn_date: '2026-01-14',
    challan_number: 'KDA-CH-20260114-01',
    vehicle_number: 'TN59 AK 1234',
    received_by: 4,                 // Production Supervisor
    notes: 'All goods received in good condition. Ponni rice moisture at 13.2% — PASS.',
    status: 'POSTED',
    created_at: new Date('2026-01-14T10:30:00Z'),
    updated_at: new Date('2026-01-14T11:00:00Z'),
    items: [
      {
        id: 1, grn_id: 1, po_item_id: 1,
        item_type: 'RAW_MATERIAL', material_id: 1,
        material_name: 'Ponni Boiled Rice (Idli Grade)',
        uom: 'KG', ordered_qty: 500,
        prev_received_qty: 0, current_received_qty: 500,
        accepted_qty: 498, rejected_qty: 2, damaged_qty: 0,
        batch_number: 'KDA-JAN26-R001', mfg_date: '2025-12-10', expiry_date: '2026-12-09',
        quality_result: 'PASS', remarks: '2 kg rejected due to moisture > 15%. Rest PASS.',
      },
      {
        id: 2, grn_id: 1, po_item_id: 2,
        item_type: 'RAW_MATERIAL', material_id: 2,
        material_name: 'Urad Dal (Black Gram, Split)',
        uom: 'KG', ordered_qty: 150,
        prev_received_qty: 0, current_received_qty: 150,
        accepted_qty: 150, rejected_qty: 0, damaged_qty: 0,
        batch_number: 'KDA-JAN26-D001', mfg_date: '2025-11-20', expiry_date: '2026-11-19',
        quality_result: 'PASS', remarks: 'Fully accepted. Good quality.',
      },
    ],
  },
];

const INITIAL_INVOICES = [
  {
    id: 1,
    invoice_number: 'INV-2026-001',
    supplier_id: 1,
    po_id: 1,
    grn_id: 1,
    supplier_invoice_number: 'KDA/2026/00147',
    invoice_date: '2026-01-14',
    due_date: '2026-01-29',
    taxable_amount: 34755.00,
    cgst_amount: 356.25,
    sgst_amount: 356.25,
    igst_amount: 0,
    total_tax_amount: 712.50,
    grand_total: 35467.50,
    amount_paid: 0,
    payment_status: 'UNPAID',
    notes: 'Invoice for PO-2026-001. Due by 29-Jan-2026.',
    created_by: 5,                  // Accountant
    created_at: new Date('2026-01-14T15:00:00Z'),
    updated_at: new Date('2026-01-14T15:00:00Z'),
    items: [
      {
        id: 1, invoice_id: 1, po_item_id: 1,
        item_type: 'RAW_MATERIAL', material_id: 1,
        material_name: 'Ponni Boiled Rice (Idli Grade)',
        uom: 'KG', invoiced_qty: 500,
        unit_price: 42.00, taxable_amount: 20580.00, gst_rate: 0,
        tax_amount: 0, total_amount: 20580.00,
      },
      {
        id: 2, invoice_id: 1, po_item_id: 2,
        item_type: 'RAW_MATERIAL', material_id: 2,
        material_name: 'Urad Dal (Black Gram, Split)',
        uom: 'KG', invoiced_qty: 150,
        unit_price: 95.00, taxable_amount: 14250.00, gst_rate: 5,
        tax_amount: 712.50, total_amount: 14962.50,
      },
    ],
  },
  {
    id: 2,
    invoice_number: 'INV-2026-002',
    supplier_id: 2,
    po_id: 2,
    grn_id: 2,
    supplier_invoice_number: 'GDT/2026/0881',
    invoice_date: '2026-01-20',
    due_date: '2026-02-04',
    taxable_amount: 15000.00,
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 750.00,
    total_tax_amount: 750.00,
    grand_total: 15750.00,
    amount_paid: 0,
    payment_status: 'UNPAID',
    notes: 'Price variance flagged by 3WM engine',
    created_by: 5,
    created_at: new Date('2026-01-20T10:00:00Z'),
    updated_at: new Date('2026-01-20T10:00:00Z'),
    items: [],
  },
];

const INITIAL_MATCHING = [
  {
    id: 1,
    invoice_id: 1,
    po_id: 1,
    grn_id: 1,
    match_status: 'MATCHED',
    po_grand_total: 35467.50,
    grn_accepted_qty_total: 648,     // 498 rice + 150 dal
    invoice_grand_total: 35467.50,
    qty_variance: 0,
    price_variance: 0,
    discrepancy_details: null,
    reviewed_by: null,
    reviewed_at: null,
    review_explanation: null,
    created_at: new Date('2026-01-14T16:00:00Z'),
    updated_at: new Date('2026-01-14T16:00:00Z'),
  },
  {
    id: 2,
    invoice_id: 2,
    po_id: 2,
    grn_id: 2,
    match_status: 'DISCREPANCY',
    po_grand_total: 15000.00,
    grn_accepted_qty_total: 150,
    invoice_grand_total: 15750.00,
    qty_variance: 0,
    price_variance: 750.00,
    discrepancy_details: 'Freight surcharge not in original PO quotation',
    reviewed_by: null,
    reviewed_at: null,
    review_explanation: null,
    created_at: new Date('2026-01-20T10:30:00Z'),
    updated_at: new Date('2026-01-20T10:30:00Z'),
  },
];

const INITIAL_STATUS_HISTORY = [
  { id: 1, entity_type: 'PR', entity_id: 1, from_status: null, to_status: 'DRAFT', changed_by: 4, reason: 'Requisition created', created_at: new Date('2026-01-10T09:00:00Z') },
  { id: 2, entity_type: 'PR', entity_id: 1, from_status: 'DRAFT', to_status: 'SUBMITTED', changed_by: 4, reason: 'Submitted for admin approval', created_at: new Date('2026-01-10T09:30:00Z') },
  { id: 3, entity_type: 'PR', entity_id: 1, from_status: 'SUBMITTED', to_status: 'APPROVED', changed_by: 2, reason: 'January batch approved. PO to be raised with Kaveri Delta.', created_at: new Date('2026-01-11T10:00:00Z') },
  { id: 4, entity_type: 'PO', entity_id: 1, from_status: null, to_status: 'DRAFT', changed_by: 2, reason: 'PO created from PR-2026-001 quotation', created_at: new Date('2026-01-12T14:00:00Z') },
  { id: 5, entity_type: 'PO', entity_id: 1, from_status: 'DRAFT', to_status: 'SUBMITTED', changed_by: 2, reason: 'Submitted for owner review', created_at: new Date('2026-01-12T14:30:00Z') },
  { id: 6, entity_type: 'PO', entity_id: 1, from_status: 'SUBMITTED', to_status: 'APPROVED', changed_by: 2, reason: 'Approved. Best price from Kaveri Delta. Delivery by 14-Jan.', created_at: new Date('2026-01-12T15:00:00Z') },
  { id: 7, entity_type: 'GRN', entity_id: 1, from_status: null, to_status: 'DRAFT', changed_by: 4, reason: 'GRN created on receipt of goods', created_at: new Date('2026-01-14T10:30:00Z') },
  { id: 8, entity_type: 'GRN', entity_id: 1, from_status: 'DRAFT', to_status: 'POSTED', changed_by: 4, reason: 'Quality inspection complete. Posted.', created_at: new Date('2026-01-14T11:00:00Z') },
];

const INITIAL_APPROVALS = [
  { id: 1, entity_type: 'PR', entity_id: 1, approver_id: 2, decision: 'APPROVED', notes: 'Approved. Raise PO with Kaveri Delta Agro.', created_at: new Date('2026-01-11T10:00:00Z') },
  { id: 2, entity_type: 'PO', entity_id: 1, approver_id: 2, decision: 'APPROVED', notes: 'PO approved. Supplier lead time 2 days.', created_at: new Date('2026-01-12T15:00:00Z') },
];

// ─── In-Memory Stores ─────────────────────────────────────────────────────────
let requisitions = JSON.parse(JSON.stringify(INITIAL_REQUISITIONS));
let quotations   = JSON.parse(JSON.stringify(INITIAL_QUOTATIONS));
let pos          = JSON.parse(JSON.stringify(INITIAL_PURCHASE_ORDERS));
let grns         = JSON.parse(JSON.stringify(INITIAL_GRNS));
let invoices     = JSON.parse(JSON.stringify(INITIAL_INVOICES));
let matching     = JSON.parse(JSON.stringify(INITIAL_MATCHING));
let statusHistory= JSON.parse(JSON.stringify(INITIAL_STATUS_HISTORY));
let approvals    = JSON.parse(JSON.stringify(INITIAL_APPROVALS));

// In-memory auto-increment counters
let nextPrId   = 3,  nextPrItemId   = 5, nextPrNum   = 3;
let nextQtId   = 4,  nextQtItemId   = 6, nextQtNum   = 4;
let nextPoId   = 2,  nextPoItemId   = 3, nextPoNum   = 2;
let nextGrnId  = 2,  nextGrnItemId  = 3, nextGrnNum  = 2;
let nextInvId  = 2,  nextInvItemId  = 3, nextInvNum  = 2;
let nextMatchId= 2;
let nextHistId = 9;
let nextApprId = 3;

let isDbOnline = false;

// ─── Init ─────────────────────────────────────────────────────────────────────
const initPurchaseTables = async () => {
  try {
    await query('SELECT 1');
    isDbOnline = true;
    console.log('✅ [Purchase] PostgreSQL database verified for procurement tables.');
  } catch {
    isDbOnline = false;
    console.warn('ℹ️ [Purchase] PostgreSQL offline. Using in-memory procurement repository.');
  }
};

// ─── Status History Helper ────────────────────────────────────────────────────
const addHistory = (entityType, entityId, fromStatus, toStatus, userId, reason) => {
  const entry = {
    id: nextHistId++,
    entity_type: entityType,
    entity_id: entityId,
    from_status: fromStatus,
    to_status: toStatus,
    changed_by: userId,
    reason: reason || null,
    created_at: new Date(),
  };
  statusHistory.push(entry);
  return entry;
};

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASE REQUISITIONS
// ─────────────────────────────────────────────────────────────────────────────

const getRequisitions = async (filters = {}) => {
  let list = [...requisitions];
  if (filters.status) list = list.filter(r => r.status === filters.status);
  if (filters.requested_by) list = list.filter(r => r.requested_by === parseInt(filters.requested_by));
  // Sort newest first
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list;
};

const getRequisitionById = async (id) => {
  return requisitions.find(r => r.id === parseInt(id)) || null;
};

const createRequisition = async (data, userId) => {
  const pr = {
    id: nextPrId++,
    requisition_number: makeNumber('PR', nextPrNum++),
    request_date: data.request_date || new Date().toISOString().slice(0, 10),
    requested_by: parseInt(userId),
    department: data.department || 'Production',
    required_delivery_date: data.required_delivery_date || null,
    priority: data.priority || 'MEDIUM',
    reason_for_purchase: data.reason_for_purchase || null,
    status: 'DRAFT',
    approved_by: null,
    approved_at: null,
    rejection_reason: null,
    created_at: new Date(),
    updated_at: new Date(),
    items: [],
  };

  if (Array.isArray(data.items)) {
    data.items.forEach(item => {
      pr.items.push({
        id: nextPrItemId++,
        requisition_id: pr.id,
        item_type: item.item_type,
        material_id: parseInt(item.material_id),
        material_name: item.material_name,
        required_qty: parseFloat(item.required_qty),
        uom: item.uom,
        remarks: item.remarks || null,
        created_at: new Date(),
      });
    });
  }

  requisitions.push(pr);
  addHistory('PR', pr.id, null, 'DRAFT', userId, 'Requisition created');
  return pr;
};

const updateRequisition = async (id, data, userId) => {
  const pr = requisitions.find(r => r.id === parseInt(id));
  if (!pr) throw new Error(`PR #${id} not found.`);
  if (pr.status !== 'DRAFT') throw new Error('Only DRAFT requisitions can be edited.');

  if (data.department !== undefined) pr.department = data.department;
  if (data.required_delivery_date !== undefined) pr.required_delivery_date = data.required_delivery_date;
  if (data.priority !== undefined) pr.priority = data.priority;
  if (data.reason_for_purchase !== undefined) pr.reason_for_purchase = data.reason_for_purchase;

  if (Array.isArray(data.items)) {
    // Replace all items (simpler than partial update for beginners)
    // Remove old items and re-assign IDs
    pr.items = data.items.map(item => ({
      id: nextPrItemId++,
      requisition_id: pr.id,
      item_type: item.item_type,
      material_id: parseInt(item.material_id),
      material_name: item.material_name,
      required_qty: parseFloat(item.required_qty),
      uom: item.uom,
      remarks: item.remarks || null,
      created_at: new Date(),
    }));
  }

  pr.updated_at = new Date();
  return pr;
};

const submitRequisition = async (id, userId) => {
  const pr = requisitions.find(r => r.id === parseInt(id));
  if (!pr) throw new Error(`PR #${id} not found.`);
  if (pr.status !== 'DRAFT') throw new Error('Only DRAFT requisitions can be submitted.');
  if (!pr.items || pr.items.length === 0) throw new Error('Cannot submit a requisition with no items.');

  addHistory('PR', pr.id, pr.status, 'SUBMITTED', userId, 'Submitted for admin approval');
  pr.status = 'SUBMITTED';
  pr.updated_at = new Date();
  return pr;
};

const approveRequisition = async (id, userId, notes) => {
  const pr = requisitions.find(r => r.id === parseInt(id));
  if (!pr) throw new Error(`PR #${id} not found.`);
  if (pr.status !== 'SUBMITTED') throw new Error('Only SUBMITTED requisitions can be approved.');

  approvals.push({
    id: nextApprId++,
    entity_type: 'PR',
    entity_id: pr.id,
    approver_id: parseInt(userId),
    decision: 'APPROVED',
    notes: notes || null,
    created_at: new Date(),
  });

  addHistory('PR', pr.id, pr.status, 'APPROVED', userId, notes || 'Approved by admin');
  pr.status = 'APPROVED';
  pr.approved_by = parseInt(userId);
  pr.approved_at = new Date();
  pr.rejection_reason = null;
  pr.updated_at = new Date();
  return pr;
};

const rejectRequisition = async (id, userId, reason) => {
  if (!reason || reason.trim() === '') throw new Error('Rejection reason is mandatory.');
  const pr = requisitions.find(r => r.id === parseInt(id));
  if (!pr) throw new Error(`PR #${id} not found.`);
  if (!['SUBMITTED', 'APPROVED'].includes(pr.status)) throw new Error('Only SUBMITTED or APPROVED PRs can be rejected.');

  approvals.push({
    id: nextApprId++,
    entity_type: 'PR',
    entity_id: pr.id,
    approver_id: parseInt(userId),
    decision: 'REJECTED',
    notes: reason,
    created_at: new Date(),
  });

  addHistory('PR', pr.id, pr.status, 'REJECTED', userId, reason);
  pr.status = 'REJECTED';
  pr.rejection_reason = reason;
  pr.updated_at = new Date();
  return pr;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIER QUOTATIONS
// ─────────────────────────────────────────────────────────────────────────────

const getQuotations = async (filters = {}) => {
  let list = [...quotations];
  if (filters.supplier_id) list = list.filter(q => q.supplier_id === parseInt(filters.supplier_id));
  if (filters.status) list = list.filter(q => q.status === filters.status);
  if (filters.requisition_id) list = list.filter(q => q.requisition_id === parseInt(filters.requisition_id));
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list;
};

const getQuotationById = async (id) => {
  return quotations.find(q => q.id === parseInt(id)) || null;
};

// Compare quotations for the same material — side-by-side supplier price comparison
const compareQuotations = async (materialId, itemType) => {
  const result = [];
  for (const qt of quotations) {
    const matchingItems = qt.items.filter(
      i => i.material_id === parseInt(materialId) &&
           (!itemType || i.item_type === itemType)
    );
    if (matchingItems.length > 0) {
      result.push({
        quotation_id: qt.id,
        quotation_number: qt.quotation_number,
        supplier_id: qt.supplier_id,
        quotation_date: qt.quotation_date,
        valid_until: qt.valid_until,
        status: qt.status,
        items: matchingItems,
      });
    }
  }
  return result;
};

const updateQuotation = async (id, data, userId) => {
  const qt = quotations.find(q => q.id === parseInt(id));
  if (!qt) throw new Error(`Quotation #${id} not found.`);
  if (qt.status !== 'DRAFT') throw new Error('Only DRAFT quotations can be edited.');

  if (data.supplier_id) qt.supplier_id = parseInt(data.supplier_id);
  if (data.valid_until !== undefined) qt.valid_until = data.valid_until;
  if (data.payment_terms !== undefined) qt.payment_terms = data.payment_terms;
  if (data.delivery_terms !== undefined) qt.delivery_terms = data.delivery_terms;
  if (data.notes !== undefined) qt.notes = data.notes;

  if (data.items && data.items.length > 0) {
    qt.items = data.items.map(item => {
      const qty = parseFloat(item.required_qty || 0);
      const price = parseFloat(item.unit_price || 0);
      const discPct = parseFloat(item.discount_pct || 0);
      const gstRate = parseFloat(item.gst_rate || 0);
      const lineSubtotal = round2(qty * price);
      const lineDisc = round2(lineSubtotal * discPct / 100);
      const lineTaxable = round2(lineSubtotal - lineDisc);
      const lineTax = round2(lineTaxable * gstRate / 100);
      const lineTotal = round2(lineTaxable + lineTax);
      return {
        id: item.id || nextQtItemId++,
        quotation_id: qt.id,
        item_type: item.item_type,
        material_id: parseInt(item.material_id),
        material_name: item.material_name,
        uom: item.uom,
        required_qty: qty,
        unit_price: round2(price),
        discount_pct: round2(discPct),
        gst_rate: round2(gstRate),
        taxable_amount: lineTaxable,
        tax_amount: lineTax,
        total_amount: lineTotal,
        delivery_days: item.delivery_days || 3,
        created_at: item.created_at || new Date(),
      };
    });
  }
  qt.updated_at = new Date();
  return qt;
};

const createQuotation = async (data, userId) => {
  const qt = {
    id: nextQtId++,
    quotation_number: makeNumber('QT', nextQtNum++),
    supplier_id: parseInt(data.supplier_id),
    requisition_id: data.requisition_id ? parseInt(data.requisition_id) : null,
    quotation_date: data.quotation_date || new Date().toISOString().slice(0, 10),
    valid_until: data.valid_until || null,
    payment_terms: data.payment_terms || null,
    delivery_terms: data.delivery_terms || null,
    notes: data.notes || null,
    status: 'DRAFT',
    created_by: parseInt(userId),
    created_at: new Date(),
    updated_at: new Date(),
    items: [],
  };

  if (Array.isArray(data.items)) {
    data.items.forEach(item => {
      const taxableAmt = round2(parseFloat(item.required_qty) * parseFloat(item.unit_price) * (1 - parseFloat(item.discount_pct || 0) / 100));
      const taxAmt = round2(taxableAmt * parseFloat(item.gst_rate || 0) / 100);
      qt.items.push({
        id: nextQtItemId++,
        quotation_id: qt.id,
        item_type: item.item_type,
        material_id: parseInt(item.material_id),
        material_name: item.material_name,
        uom: item.uom,
        required_qty: parseFloat(item.required_qty),
        unit_price: round2(parseFloat(item.unit_price)),
        discount_pct: round2(parseFloat(item.discount_pct || 0)),
        gst_rate: round2(parseFloat(item.gst_rate || 0)),
        taxable_amount: taxableAmt,
        tax_amount: taxAmt,
        total_amount: round2(taxableAmt + taxAmt),
        delivery_days: item.delivery_days ? parseInt(item.delivery_days) : null,
        created_at: new Date(),
      });
    });
  }

  quotations.push(qt);
  return qt;
};

const selectQuotation = async (id, userId, reason) => {
  const qt = quotations.find(q => q.id === parseInt(id));
  if (!qt) throw new Error(`Quotation #${id} not found.`);
  if (!['SUBMITTED', 'DRAFT'].includes(qt.status)) throw new Error('Only DRAFT or SUBMITTED quotations can be selected.');

  qt.status = 'SELECTED';
  qt.updated_at = new Date();
  return qt;
};

const submitQuotation = async (id, userId) => {
  const qt = quotations.find(q => q.id === parseInt(id));
  if (!qt) throw new Error(`Quotation #${id} not found.`);
  if (qt.status !== 'DRAFT') throw new Error('Only DRAFT quotations can be submitted.');
  if (!qt.items || qt.items.length === 0) throw new Error('Cannot submit a quotation with no items.');

  qt.status = 'SUBMITTED';
  qt.updated_at = new Date();
  return qt;
};

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASE ORDERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate PO line totals based on supplier state (intrastate = CGST+SGST, interstate = IGST).
 * Supplier state_code 33 = Tamil Nadu (intrastate). All others = interstate.
 */
const calculatePOTotals = (supplierStateCode, items = []) => {
  const isIntrastate = String(supplierStateCode || '33') === '33';
  let subtotal = 0, discountAmt = 0, taxableAmt = 0;
  let cgst = 0, sgst = 0, igst = 0;

  const processedItems = items.map(item => {
    const qty      = parseFloat(item.ordered_qty);
    const price    = parseFloat(item.unit_price);
    const discPct  = parseFloat(item.discount_pct || 0);
    const gstRate  = parseFloat(item.gst_rate || 0);

    const lineSubtotal  = round2(qty * price);
    const lineDisc      = round2(lineSubtotal * discPct / 100);
    const lineTaxable   = round2(lineSubtotal - lineDisc);
    const lineTax       = round2(lineTaxable * gstRate / 100);
    const lineCgst      = isIntrastate ? round2(lineTaxable * gstRate / 2 / 100) : 0;
    const lineSgst      = isIntrastate ? round2(lineTaxable * gstRate / 2 / 100) : 0;
    const lineIgst      = isIntrastate ? 0 : round2(lineTaxable * gstRate / 100);
    const lineTotal     = round2(lineTaxable + lineTax);

    subtotal    += lineSubtotal;
    discountAmt += lineDisc;
    taxableAmt  += lineTaxable;
    cgst        += lineCgst;
    sgst        += lineSgst;
    igst        += lineIgst;

    return {
      ...item,
      taxable_value: lineTaxable,
      tax_amount:    lineTax,
      total_amount:  lineTotal,
    };
  });

  const totalTax   = round2(cgst + sgst + igst);
  const grandTotal = round2(taxableAmt + totalTax);

  return {
    items: processedItems,
    subtotal_amount:   round2(subtotal),
    discount_amount:   round2(discountAmt),
    taxable_amount:    round2(taxableAmt),
    cgst_amount:       round2(cgst),
    sgst_amount:       round2(sgst),
    igst_amount:       round2(igst),
    total_tax_amount:  totalTax,
    grand_total:       grandTotal,
  };
};

const getPOs = async (filters = {}) => {
  let list = [...pos];
  if (filters.status) list = list.filter(p => p.status === filters.status);
  if (filters.supplier_id) list = list.filter(p => p.supplier_id === parseInt(filters.supplier_id));
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list;
};

const getPOById = async (id) => {
  return pos.find(p => p.id === parseInt(id)) || null;
};

const createPO = async (data, userId) => {
  // Look up supplier state code (from INITIAL_SUPPLIERS in masterDataModel)
  // Supplier 2 (Guntur Dal) is AP state_code 37; all others are TN 33.
  const SUPPLIER_STATE_CODES = { 1: '33', 2: '37', 3: '33', 4: '33', 5: '33' };
  const supplierStateCode = SUPPLIER_STATE_CODES[parseInt(data.supplier_id)] || '33';

  const { items: processedItems, ...totals } = calculatePOTotals(supplierStateCode, data.items || []);

  const po = {
    id: nextPoId++,
    po_number: makeNumber('PO', nextPoNum++),
    supplier_id: parseInt(data.supplier_id),
    quotation_id: data.quotation_id ? parseInt(data.quotation_id) : null,
    requisition_id: data.requisition_id ? parseInt(data.requisition_id) : null,
    po_date: data.po_date || new Date().toISOString().slice(0, 10),
    expected_delivery_date: data.expected_delivery_date || null,
    delivery_address: data.delivery_address || 'Plot No. 42-B, SIDCO Industrial Estate, Kappalur, Madurai, TN - 625008',
    payment_terms: data.payment_terms || null,
    notes: data.notes || null,
    status: 'DRAFT',
    ...totals,
    approved_by: null,
    approved_at: null,
    rejection_reason: null,
    created_by: parseInt(userId),
    created_at: new Date(),
    updated_at: new Date(),
    items: processedItems.map(item => ({
      id: nextPoItemId++,
      po_id: 0, // set below
      item_type: item.item_type,
      material_id: parseInt(item.material_id),
      material_name: item.material_name,
      uom: item.uom,
      ordered_qty: parseFloat(item.ordered_qty),
      unit_price: round2(parseFloat(item.unit_price)),
      discount_pct: round2(parseFloat(item.discount_pct || 0)),
      gst_rate: round2(parseFloat(item.gst_rate || 0)),
      taxable_value: item.taxable_value,
      tax_amount: item.tax_amount,
      total_amount: item.total_amount,
      received_qty: 0,
      created_at: new Date(),
    })),
  };
  // Fix po_id on each item
  po.items.forEach(i => { i.po_id = po.id; });

  pos.push(po);
  addHistory('PO', po.id, null, 'DRAFT', userId, 'PO created');
  return po;
};

const submitPO = async (id, userId) => {
  const po = pos.find(p => p.id === parseInt(id));
  if (!po) throw new Error(`PO #${id} not found.`);
  if (po.status !== 'DRAFT') throw new Error('Only DRAFT purchase orders can be submitted.');
  if (!po.items || po.items.length === 0) throw new Error('Cannot submit a PO with no items.');

  addHistory('PO', po.id, po.status, 'SUBMITTED', userId, 'Submitted for approval');
  po.status = 'SUBMITTED';
  po.updated_at = new Date();
  return po;
};

const approvePO = async (id, userId, notes) => {
  const po = pos.find(p => p.id === parseInt(id));
  if (!po) throw new Error(`PO #${id} not found.`);
  if (po.status !== 'SUBMITTED') throw new Error('Only SUBMITTED purchase orders can be approved.');

  approvals.push({
    id: nextApprId++,
    entity_type: 'PO',
    entity_id: po.id,
    approver_id: parseInt(userId),
    decision: 'APPROVED',
    notes: notes || null,
    created_at: new Date(),
  });

  addHistory('PO', po.id, po.status, 'APPROVED', userId, notes || 'Approved');
  po.status = 'APPROVED';
  po.approved_by = parseInt(userId);
  po.approved_at = new Date();
  po.updated_at = new Date();
  return po;
};

const rejectPO = async (id, userId, reason) => {
  if (!reason || reason.trim() === '') throw new Error('Rejection reason is mandatory.');
  const po = pos.find(p => p.id === parseInt(id));
  if (!po) throw new Error(`PO #${id} not found.`);
  if (!['SUBMITTED', 'APPROVED'].includes(po.status)) throw new Error('Only SUBMITTED or APPROVED POs can be rejected.');

  approvals.push({
    id: nextApprId++,
    entity_type: 'PO',
    entity_id: po.id,
    approver_id: parseInt(userId),
    decision: 'REJECTED',
    notes: reason,
    created_at: new Date(),
  });

  addHistory('PO', po.id, po.status, 'REJECTED', userId, reason);
  po.status = 'REJECTED';
  po.rejection_reason = reason;
  po.updated_at = new Date();
  return po;
};

const returnPO = async (id, userId, reason) => {
  if (!reason || reason.trim() === '') throw new Error('Return reason is mandatory.');
  const po = pos.find(p => p.id === parseInt(id));
  if (!po) throw new Error(`PO #${id} not found.`);
  if (po.status !== 'SUBMITTED') throw new Error('Only SUBMITTED POs can be returned for correction.');

  approvals.push({
    id: nextApprId++,
    entity_type: 'PO',
    entity_id: po.id,
    approver_id: parseInt(userId),
    decision: 'RETURNED',
    notes: reason,
    created_at: new Date(),
  });

  addHistory('PO', po.id, po.status, 'DRAFT', userId, `Returned for correction: ${reason}`);
  po.status = 'DRAFT';
  po.rejection_reason = reason;
  po.updated_at = new Date();
  return po;
};

const updatePO = async (id, data, userId) => {
  const po = pos.find(p => p.id === parseInt(id));
  if (!po) throw new Error(`PO #${id} not found.`);
  if (po.status !== 'DRAFT') throw new Error('Cannot modify a purchase order after it has been submitted or approved. Only DRAFT POs can be edited.');

  const SUPPLIER_STATE_CODES = { 1: '33', 2: '37', 3: '33', 4: '33', 5: '33' };
  const supplierId = data.supplier_id ? parseInt(data.supplier_id) : po.supplier_id;
  const supplierStateCode = SUPPLIER_STATE_CODES[supplierId] || '33';

  if (data.items && data.items.length > 0) {
    const { items: processedItems, ...totals } = calculatePOTotals(supplierStateCode, data.items);
    Object.assign(po, totals);
    po.items = processedItems.map(item => ({
      id: item.id || nextPoItemId++,
      po_id: po.id,
      item_type: item.item_type,
      material_id: parseInt(item.material_id),
      material_name: item.material_name,
      uom: item.uom,
      ordered_qty: parseFloat(item.ordered_qty),
      unit_price: round2(parseFloat(item.unit_price)),
      discount_pct: round2(parseFloat(item.discount_pct || 0)),
      gst_rate: round2(parseFloat(item.gst_rate || 0)),
      taxable_value: item.taxable_value,
      tax_amount: item.tax_amount,
      total_amount: item.total_amount,
      received_qty: item.received_qty || 0,
      created_at: item.created_at || new Date(),
    }));
  }

  if (data.supplier_id) po.supplier_id = supplierId;
  if (data.expected_delivery_date !== undefined) po.expected_delivery_date = data.expected_delivery_date;
  if (data.delivery_address !== undefined) po.delivery_address = data.delivery_address;
  if (data.payment_terms !== undefined) po.payment_terms = data.payment_terms;
  if (data.shipping_charges !== undefined) po.shipping_charges = round2(parseFloat(data.shipping_charges || 0));
  if (data.other_charges !== undefined) po.other_charges = round2(parseFloat(data.other_charges || 0));
  if (data.notes !== undefined) po.notes = data.notes;
  po.updated_at = new Date();

  addHistory('PO', po.id, 'DRAFT', 'DRAFT', userId, 'PO updated');
  return po;
};

// ─────────────────────────────────────────────────────────────────────────────
// GOODS RECEIPT NOTES (GRN)
// ─────────────────────────────────────────────────────────────────────────────

const getGRNs = async (filters = {}) => {
  let list = [...grns];
  if (filters.po_id) list = list.filter(g => g.po_id === parseInt(filters.po_id));
  if (filters.status) list = list.filter(g => g.status === filters.status);
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list;
};

const getGRNById = async (id) => {
  return grns.find(g => g.id === parseInt(id)) || null;
};

const createGRN = async (data, userId) => {
  const po = pos.find(p => p.id === parseInt(data.po_id));
  if (!po) throw new Error(`PO #${data.po_id} not found.`);
  if (!['APPROVED', 'SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
    throw new Error('GRN can only be created against APPROVED, SENT, or PARTIALLY_RECEIVED purchase orders.');
  }

  // Validate quantities per item
  for (const item of (data.items || [])) {
    const poItem = po.items.find(pi => pi.id === parseInt(item.po_item_id));
    if (!poItem) throw new Error(`PO line item #${item.po_item_id} not found in PO-${po.po_number}.`);

    const cumulative = round2((poItem.received_qty || 0) + parseFloat(item.current_received_qty));
    if (cumulative > poItem.ordered_qty) {
      throw new Error(
        `Received qty for "${poItem.material_name}" exceeds PO ordered qty. ` +
        `PO: ${poItem.ordered_qty} ${poItem.uom}, previously received: ${poItem.received_qty || 0}, ` +
        `current: ${item.current_received_qty}. Max allowed: ${round2(poItem.ordered_qty - (poItem.received_qty || 0))}.`
      );
    }

    const accepted = parseFloat(item.accepted_qty || 0);
    const rejected = parseFloat(item.rejected_qty || 0);
    const damaged  = parseFloat(item.damaged_qty || 0);
    if (accepted + rejected + damaged > parseFloat(item.current_received_qty)) {
      throw new Error(`Accepted + Rejected + Damaged qty cannot exceed current received qty for "${poItem.material_name}".`);
    }
  }

  const grn = {
    id: nextGrnId++,
    grn_number: makeNumber('GRN', nextGrnNum++),
    po_id: parseInt(data.po_id),
    grn_date: data.grn_date || new Date().toISOString().slice(0, 10),
    challan_number: data.challan_number || null,
    vehicle_number: data.vehicle_number || null,
    received_by: parseInt(userId),
    notes: data.notes || null,
    status: 'DRAFT',
    created_at: new Date(),
    updated_at: new Date(),
    items: [],
  };

  for (const item of (data.items || [])) {
    const poItem = po.items.find(pi => pi.id === parseInt(item.po_item_id));
    grn.items.push({
      id: nextGrnItemId++,
      grn_id: grn.id,
      po_item_id: parseInt(item.po_item_id),
      item_type: poItem.item_type,
      material_id: poItem.material_id,
      material_name: poItem.material_name,
      uom: poItem.uom,
      ordered_qty: poItem.ordered_qty,
      prev_received_qty: round2(poItem.received_qty || 0),
      current_received_qty: round2(parseFloat(item.current_received_qty)),
      accepted_qty: round2(parseFloat(item.accepted_qty || 0)),
      rejected_qty: round2(parseFloat(item.rejected_qty || 0)),
      damaged_qty: round2(parseFloat(item.damaged_qty || 0)),
      batch_number: item.batch_number || null,
      mfg_date: item.mfg_date || null,
      expiry_date: item.expiry_date || null,
      quality_result: item.quality_result || 'PENDING',
      remarks: item.remarks || null,
      created_at: new Date(),
    });
  }

  grns.push(grn);
  addHistory('GRN', grn.id, null, 'DRAFT', userId, 'GRN created on receipt');
  return grn;
};

const postGRN = async (id, userId) => {
  const grn = grns.find(g => g.id === parseInt(id));
  if (!grn) throw new Error(`GRN #${id} not found.`);
  if (grn.status !== 'DRAFT') throw new Error('Only DRAFT GRNs can be posted.');

  // Update PO received_qty and status
  const po = pos.find(p => p.id === grn.po_id);
  if (po) {
    for (const grnItem of grn.items) {
      const poItem = po.items.find(pi => pi.id === grnItem.po_item_id);
      if (poItem) {
        poItem.received_qty = round2((poItem.received_qty || 0) + grnItem.current_received_qty);
      }
    }
    // Check if all PO items are fully received
    const allReceived = po.items.every(pi => round2(pi.received_qty) >= round2(pi.ordered_qty));
    po.status = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
    po.updated_at = new Date();
  }

  addHistory('GRN', grn.id, grn.status, 'POSTED', userId, 'GRN posted after quality inspection');
  grn.status = 'POSTED';
  grn.updated_at = new Date();
  return grn;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIER INVOICES
// ─────────────────────────────────────────────────────────────────────────────

const getInvoices = async (filters = {}) => {
  let list = [...invoices];
  if (filters.supplier_id) list = list.filter(i => i.supplier_id === parseInt(filters.supplier_id));
  if (filters.payment_status) list = list.filter(i => i.payment_status === filters.payment_status);
  if (filters.po_id) list = list.filter(i => i.po_id === parseInt(filters.po_id));
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list;
};

const getInvoiceById = async (id) => {
  return invoices.find(i => i.id === parseInt(id)) || null;
};

const createInvoice = async (data, userId) => {
  // Duplicate prevention: same supplier_id + supplier_invoice_number must be unique
  const duplicate = invoices.find(
    i => i.supplier_id === parseInt(data.supplier_id) &&
         i.supplier_invoice_number === data.supplier_invoice_number
  );
  if (duplicate) {
    const err = new Error(
      `Invoice number "${data.supplier_invoice_number}" already recorded for this supplier.`
    );
    err.statusCode = 409; // HTTP 409 Conflict
    throw err;
  }

  // Server-side amount recalculation
  let taxableTotal = 0, cgstTotal = 0, sgstTotal = 0, igstTotal = 0;
  const SUPPLIER_STATE_CODES = { 1: '33', 2: '37', 3: '33', 4: '33', 5: '33' };
  const supplierStateCode = SUPPLIER_STATE_CODES[parseInt(data.supplier_id)] || '33';
  const isIntrastate = supplierStateCode === '33';

  const processedItems = (data.items || []).map(item => {
    const taxable = round2(parseFloat(item.invoiced_qty) * parseFloat(item.unit_price));
    const tax     = round2(taxable * parseFloat(item.gst_rate || 0) / 100);
    const lineCgst = isIntrastate ? round2(taxable * parseFloat(item.gst_rate || 0) / 2 / 100) : 0;
    const lineSgst = isIntrastate ? round2(taxable * parseFloat(item.gst_rate || 0) / 2 / 100) : 0;
    const lineIgst = isIntrastate ? 0 : tax;

    taxableTotal += taxable;
    cgstTotal    += lineCgst;
    sgstTotal    += lineSgst;
    igstTotal    += lineIgst;

    return {
      id: nextInvItemId++,
      invoice_id: 0, // set below
      po_item_id: item.po_item_id ? parseInt(item.po_item_id) : null,
      item_type: item.item_type,
      material_id: parseInt(item.material_id),
      material_name: item.material_name,
      uom: item.uom,
      invoiced_qty: round2(parseFloat(item.invoiced_qty)),
      unit_price: round2(parseFloat(item.unit_price)),
      taxable_amount: taxable,
      gst_rate: round2(parseFloat(item.gst_rate || 0)),
      tax_amount: tax,
      total_amount: round2(taxable + tax),
      created_at: new Date(),
    };
  });

  const totalTax   = round2(cgstTotal + sgstTotal + igstTotal);
  const grandTotal = round2(taxableTotal + totalTax);

  const inv = {
    id: nextInvId++,
    invoice_number: makeNumber('INV', nextInvNum++),
    supplier_id: parseInt(data.supplier_id),
    po_id: parseInt(data.po_id),
    grn_id: data.grn_id ? parseInt(data.grn_id) : null,
    supplier_invoice_number: data.supplier_invoice_number,
    invoice_date: data.invoice_date || new Date().toISOString().slice(0, 10),
    due_date: data.due_date || null,
    taxable_amount: round2(taxableTotal),
    cgst_amount:    round2(cgstTotal),
    sgst_amount:    round2(sgstTotal),
    igst_amount:    round2(igstTotal),
    total_tax_amount: totalTax,
    grand_total:    grandTotal,
    amount_paid:    0,
    payment_status: 'UNPAID',
    notes: data.notes || null,
    created_by: parseInt(userId),
    created_at: new Date(),
    updated_at: new Date(),
    items: processedItems,
  };
  inv.items.forEach(i => { i.invoice_id = inv.id; });

  invoices.push(inv);
  addHistory('INV', inv.id, null, 'UNPAID', userId, 'Invoice recorded');
  return inv;
};

// ─────────────────────────────────────────────────────────────────────────────
// THREE-WAY MATCHING
// ─────────────────────────────────────────────────────────────────────────────

const getMatches = async (filters = {}) => {
  let list = [...matching];
  if (filters.match_status) list = list.filter(m => m.match_status === filters.match_status);
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list;
};

const getMatchById = async (id) => {
  return matching.find(m => m.id === parseInt(id)) || null;
};

const getMatchByInvoiceId = async (invoiceId) => {
  return matching.find(m => m.invoice_id === parseInt(invoiceId)) || null;
};

/**
 * Run three-way matching for an invoice.
 * Compares: PO (what was ordered) ↔ GRN (what was received) ↔ Invoice (what supplier billed).
 * NEVER auto-approves a discrepant invoice. All discrepancies require human review.
 */
const runThreeWayMatch = async (invoiceId, userId) => {
  const inv = invoices.find(i => i.id === parseInt(invoiceId));
  if (!inv) throw new Error(`Invoice #${invoiceId} not found.`);

  const po = pos.find(p => p.id === inv.po_id);
  if (!po) throw new Error(`PO #${inv.po_id} not found for this invoice.`);

  const grn = inv.grn_id ? grns.find(g => g.id === inv.grn_id) : null;

  // Compare totals
  const poTotal      = round2(po.grand_total);
  const invTotal     = round2(inv.grand_total);
  const priceDiff    = round2(invTotal - poTotal);

  // Compare accepted qty (sum of GRN accepted) vs invoice qty (sum of invoiced)
  let grnAcceptedTotal = 0;
  let invQtyTotal = 0;

  if (grn) {
    grn.items.forEach(gi => { grnAcceptedTotal += gi.accepted_qty; });
  }
  inv.items.forEach(ii => { invQtyTotal += ii.invoiced_qty; });
  const qtyDiff = round2(invQtyTotal - grnAcceptedTotal);

  // Determine match status
  const discrepancies = [];
  if (Math.abs(priceDiff) > 0.01) {
    discrepancies.push(`Price variance: Invoice ₹${invTotal} vs PO ₹${poTotal} (diff: ₹${priceDiff})`);
  }
  if (grn && Math.abs(qtyDiff) > 0.001) {
    discrepancies.push(`Quantity variance: Invoiced ${invQtyTotal} vs GRN accepted ${grnAcceptedTotal} (diff: ${qtyDiff})`);
  }
  if (!grn) {
    discrepancies.push('GRN not linked. Cannot verify receipt quantities.');
  }

  let matchStatus;
  if (discrepancies.length === 0) {
    matchStatus = 'MATCHED';
  } else if (discrepancies.length === 1 && Math.abs(priceDiff) < 50) {
    // Small single discrepancy → partial match (requires review but not critical)
    matchStatus = 'PARTIALLY_MATCHED';
  } else {
    // Multiple or large discrepancies → DISCREPANCY (mandatory human review)
    matchStatus = 'DISCREPANCY';
  }

  // Check if a match record already exists for this invoice
  const existing = matching.find(m => m.invoice_id === parseInt(invoiceId));
  if (existing) {
    existing.match_status = matchStatus;
    existing.po_grand_total = poTotal;
    existing.grn_accepted_qty_total = round2(grnAcceptedTotal);
    existing.invoice_grand_total = invTotal;
    existing.qty_variance = qtyDiff;
    existing.price_variance = priceDiff;
    existing.discrepancy_details = discrepancies.length > 0 ? discrepancies.join(' | ') : null;
    existing.updated_at = new Date();
    return existing;
  }

  const record = {
    id: nextMatchId++,
    invoice_id: parseInt(invoiceId),
    po_id: po.id,
    grn_id: grn ? grn.id : null,
    match_status: matchStatus,
    po_grand_total: poTotal,
    grn_accepted_qty_total: round2(grnAcceptedTotal),
    invoice_grand_total: invTotal,
    qty_variance: qtyDiff,
    price_variance: priceDiff,
    discrepancy_details: discrepancies.length > 0 ? discrepancies.join(' | ') : null,
    reviewed_by: null,
    reviewed_at: null,
    review_explanation: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  matching.push(record);
  return record;
};

/**
 * Accountant records explanation for a discrepant invoice.
 * This is mandatory — discrepant invoices cannot be silently passed.
 */
const recordMatchExplanation = async (invoiceId, userId, explanation) => {
  if (!explanation || explanation.trim() === '') {
    throw new Error('Explanation is mandatory when reviewing a discrepant match.');
  }
  const record = matching.find(m => m.invoice_id === parseInt(invoiceId));
  if (!record) throw new Error(`No three-way match found for Invoice #${invoiceId}.`);

  record.review_explanation = explanation;
  record.reviewed_by = parseInt(userId);
  record.reviewed_at = new Date();
  record.updated_at = new Date();
  return record;
};

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT HISTORY & APPROVALS
// ─────────────────────────────────────────────────────────────────────────────

const getHistory = async (entityType, entityId) => {
  let list = [...statusHistory];
  if (entityType) list = list.filter(h => h.entity_type === entityType.toUpperCase());
  if (entityId) list = list.filter(h => h.entity_id === parseInt(entityId));
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list;
};

const getApprovals = async (entityType, entityId) => {
  let list = [...approvals];
  if (entityType) list = list.filter(a => a.entity_type === entityType.toUpperCase());
  if (entityId) list = list.filter(a => a.entity_id === parseInt(entityId));
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list;
};

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASE REPORTS (MODULE 10)
// ─────────────────────────────────────────────────────────────────────────────

const getPurchaseReports = async (reportType, filters = {}) => {
  const { startDate, endDate, supplierId, materialId, status } = filters;

  const inDateRange = (dateStr) => {
    if (!dateStr) return true;
    const d = new Date(dateStr).getTime();
    if (startDate && d < new Date(startDate).getTime()) return false;
    if (endDate && d > new Date(endDate).getTime() + 86400000) return false;
    return true;
  };

  switch (reportType) {
    case 'purchase_register': {
      let filtered = pos.filter(p => inDateRange(p.po_date));
      if (supplierId) filtered = filtered.filter(p => p.supplier_id === parseInt(supplierId));
      if (status) filtered = filtered.filter(p => p.status === status);
      return filtered.map(p => ({
        po_number: p.po_number,
        po_date: p.po_date,
        supplier_id: p.supplier_id,
        status: p.status,
        subtotal: p.subtotal_amount,
        discount: p.discount_amount,
        taxable: p.taxable_amount,
        cgst: p.cgst_amount,
        sgst: p.sgst_amount,
        igst: p.igst_amount,
        total_tax: p.total_tax_amount,
        grand_total: p.grand_total,
      }));
    }

    case 'supplier_wise': {
      const grouped = {};
      pos.forEach(p => {
        if (!inDateRange(p.po_date)) return;
        if (supplierId && p.supplier_id !== parseInt(supplierId)) return;
        const sid = p.supplier_id;
        if (!grouped[sid]) {
          grouped[sid] = { supplier_id: sid, po_count: 0, total_ordered_value: 0, received_value: 0, pending_pos: 0 };
        }
        grouped[sid].po_count += 1;
        grouped[sid].total_ordered_value += p.grand_total;
        if (p.status === 'RECEIVED') grouped[sid].received_value += p.grand_total;
        if (['APPROVED', 'PARTIALLY_RECEIVED'].includes(p.status)) grouped[sid].pending_pos += 1;
      });
      return Object.values(grouped).map(g => ({
        ...g,
        total_ordered_value: round2(g.total_ordered_value),
        received_value: round2(g.received_value),
      }));
    }

    case 'material_wise': {
      const matGroup = {};
      pos.forEach(p => {
        if (!inDateRange(p.po_date)) return;
        p.items.forEach(item => {
          if (materialId && item.material_id !== parseInt(materialId)) return;
          const key = `${item.item_type}_${item.material_id}`;
          if (!matGroup[key]) {
            matGroup[key] = {
              material_id: item.material_id,
              material_name: item.material_name,
              item_type: item.item_type,
              uom: item.uom,
              total_qty: 0,
              total_received_qty: 0,
              total_spend: 0,
              po_count: 0,
            };
          }
          matGroup[key].total_qty += item.ordered_qty;
          matGroup[key].total_received_qty += (item.received_qty || 0);
          matGroup[key].total_spend += item.total_amount;
          matGroup[key].po_count += 1;
        });
      });
      return Object.values(matGroup).map(m => ({
        ...m,
        total_qty: round2(m.total_qty),
        total_received_qty: round2(m.total_received_qty),
        total_spend: round2(m.total_spend),
      }));
    }

    case 'po_status': {
      const counts = { DRAFT: 0, SUBMITTED: 0, APPROVED: 0, REJECTED: 0, PARTIALLY_RECEIVED: 0, RECEIVED: 0, CANCELLED: 0 };
      const values = { DRAFT: 0, SUBMITTED: 0, APPROVED: 0, REJECTED: 0, PARTIALLY_RECEIVED: 0, RECEIVED: 0, CANCELLED: 0 };
      pos.forEach(p => {
        if (!inDateRange(p.po_date)) return;
        const st = p.status || 'DRAFT';
        if (counts[st] !== undefined) {
          counts[st]++;
          values[st] = round2(values[st] + p.grand_total);
        }
      });
      return Object.keys(counts).map(st => ({ status: st, count: counts[st], total_value: values[st] }));
    }

    case 'goods_receipt': {
      let filtered = grns.filter(g => inDateRange(g.grn_date));
      return filtered.map(g => {
        const po = pos.find(p => p.id === g.po_id);
        const totalAccepted = g.items.reduce((s, i) => s + (i.accepted_qty || 0), 0);
        const totalRejected = g.items.reduce((s, i) => s + (i.rejected_qty || 0), 0);
        const totalDamaged = g.items.reduce((s, i) => s + (i.damaged_qty || 0), 0);
        return {
          grn_number: g.grn_number,
          grn_date: g.grn_date,
          po_number: po?.po_number || `PO #${g.po_id}`,
          challan_number: g.challan_number,
          vehicle_number: g.vehicle_number,
          status: g.status,
          accepted_qty: round2(totalAccepted),
          rejected_qty: round2(totalRejected),
          damaged_qty: round2(totalDamaged),
        };
      });
    }

    case 'price_comparison': {
      const rows = [];
      quotations.forEach(q => {
        q.items.forEach(qi => {
          rows.push({
            quotation_number: q.quotation_number,
            supplier_id: q.supplier_id,
            material_name: qi.material_name,
            uom: qi.uom,
            quoted_price: qi.unit_price,
            discount_pct: qi.discount_pct,
            gst_rate: qi.gst_rate,
            delivery_days: qi.delivery_days,
            status: q.status,
          });
        });
      });
      return rows;
    }

    case 'supplier_invoice': {
      let filtered = invoices.filter(i => inDateRange(i.invoice_date));
      if (supplierId) filtered = filtered.filter(i => i.supplier_id === parseInt(supplierId));
      return filtered.map(i => ({
        invoice_number: i.invoice_number,
        supplier_invoice_number: i.supplier_invoice_number,
        supplier_id: i.supplier_id,
        invoice_date: i.invoice_date,
        due_date: i.due_date,
        taxable_amount: i.taxable_amount,
        cgst_amount: i.cgst_amount,
        sgst_amount: i.sgst_amount,
        igst_amount: i.igst_amount,
        total_tax: i.total_tax_amount,
        grand_total: i.grand_total,
        amount_paid: i.amount_paid,
        payment_status: i.payment_status,
      }));
    }

    case 'outstanding_invoices': {
      const unpaid = invoices.filter(i => i.payment_status !== 'PAID');
      return unpaid.map(i => ({
        invoice_number: i.invoice_number,
        supplier_invoice_number: i.supplier_invoice_number,
        supplier_id: i.supplier_id,
        invoice_date: i.invoice_date,
        due_date: i.due_date,
        grand_total: i.grand_total,
        amount_paid: i.amount_paid,
        balance_due: round2(i.grand_total - i.amount_paid),
        payment_status: i.payment_status,
      }));
    }

    case 'matching_discrepancy': {
      return matching.filter(m => m.match_status !== 'MATCHED').map(m => {
        const inv = invoices.find(i => i.id === m.invoice_id);
        const po = pos.find(p => p.id === m.po_id);
        const grn = grns.find(g => g.id === m.grn_id);
        return {
          id: m.id,
          match_status: m.match_status,
          invoice_number: inv?.invoice_number || `INV #${m.invoice_id}`,
          supplier_invoice_number: inv?.supplier_invoice_number,
          po_number: po?.po_number || `PO #${m.po_id}`,
          grn_number: grn?.grn_number || 'N/A',
          qty_variance: m.qty_variance,
          price_variance: m.price_variance,
          discrepancy_details: m.discrepancy_details,
          review_explanation: m.review_explanation,
          reviewed_by: m.reviewed_by,
        };
      });
    }

    default:
      return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATISTICS
// ─────────────────────────────────────────────────────────────────────────────

const getDashboardStats = async (filters = {}) => {
  const { supplierId, status } = filters;
  let filteredPRs = [...requisitions];
  let filteredPOs = [...pos];
  let filteredInvoices = [...invoices];
  let filteredGRNs = [...grns];

  if (supplierId) {
    filteredPOs = filteredPOs.filter(p => p.supplier_id === parseInt(supplierId));
    filteredInvoices = filteredInvoices.filter(i => i.supplier_id === parseInt(supplierId));
  }

  if (status) {
    filteredPOs = filteredPOs.filter(p => p.status === status);
  }

  const pendingPRs       = filteredPRs.filter(r => r.status === 'SUBMITTED').length;
  const approvedPRs      = filteredPRs.filter(r => r.status === 'APPROVED').length;
  const pendingPOs       = filteredPOs.filter(p => p.status === 'SUBMITTED').length;
  const approvedPOs      = filteredPOs.filter(p => p.status === 'APPROVED').length;
  const openGRNs         = filteredGRNs.filter(g => g.status === 'DRAFT').length;
  const postedGRNs       = filteredGRNs.filter(g => g.status === 'POSTED').length;
  const unpaidInvoices   = filteredInvoices.filter(i => i.payment_status === 'UNPAID').length;
  const discrepancies    = matching.filter(m => ['DISCREPANCY','PARTIALLY_MATCHED'].includes(m.match_status)).length;
  const totalPayable     = filteredInvoices
    .filter(i => i.payment_status !== 'PAID')
    .reduce((sum, i) => sum + (i.grand_total - i.amount_paid), 0);
  const totalReceivedQty = filteredGRNs
    .filter(g => g.status === 'POSTED')
    .reduce((sum, g) => sum + g.items.reduce((s, item) => s + (item.accepted_qty || 0), 0), 0);

  return {
    requisitions: { pending_approval: pendingPRs, total_approved: approvedPRs, total: filteredPRs.length },
    purchase_orders: { pending_approval: pendingPOs, total_approved: approvedPOs, total: filteredPOs.length },
    goods_receipts: { open_drafts: openGRNs, total_posted: postedGRNs, total: filteredGRNs.length, total_received_qty: round2(totalReceivedQty) },
    invoices: { unpaid: unpaidInvoices, total: filteredInvoices.length, total_payable: round2(totalPayable) },
    three_way_matching: { discrepancies_pending_review: discrepancies, total: matching.length },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  initPurchaseTables,
  // PR
  getRequisitions,
  getRequisitionById,
  createRequisition,
  updateRequisition,
  submitRequisition,
  approveRequisition,
  rejectRequisition,
  // Quotations
  getQuotations,
  getQuotationById,
  compareQuotations,
  createQuotation,
  updateQuotation,
  submitQuotation,
  selectQuotation,
  // PO
  getPOs,
  getPOById,
  createPO,
  updatePO,
  submitPO,
  approvePO,
  rejectPO,
  returnPO,
  calculatePOTotals,
  // GRN
  getGRNs,
  getGRNById,
  createGRN,
  postGRN,
  // Invoices
  getInvoices,
  getInvoiceById,
  createInvoice,
  // 3-Way Match
  getMatches,
  getMatchById,
  getMatchByInvoiceId,
  runThreeWayMatch,
  recordMatchExplanation,
  // History & Approvals
  getHistory,
  getApprovals,
  // Reports & Dashboard
  getPurchaseReports,
  getDashboardStats,
};
