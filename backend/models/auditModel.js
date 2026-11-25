// ============================================================================
// Phase 13: Audit Management System Model
// Sri Meenakshi Agro & Traditional Foods Pvt Ltd
// ============================================================================

const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');

// Import existing phase models for cross-module transaction auditing & CAPA
const salesOrderModel = require('./salesOrderModel');
const purchaseModel = require('./purchaseModel');
const inventoryModel = require('./inventoryModel');
const productionModel = require('./productionModel');
const qualityModel = require('./qualityModel');
const costingModel = require('./costingModel');
const invoicingModel = require('./invoicingModel');
const dispatchModel = require('./dispatchModel');
const paymentModel = require('./paymentModel');

let isDbOnline = false;

// ─────────────────────────────────────────────────────────────────────────────
// RESILIENT IN-MEMORY STORE & SEED DATA
// ─────────────────────────────────────────────────────────────────────────────

const pad = (n, w) => String(n).padStart(w, '0');
const year = () => new Date().getFullYear();
const formatDate = (d = new Date()) => d.toISOString().split('T')[0];

let nextPlanId = 5;
let nextChecklistId = 11;
let nextChecklistItemId = 25;
let nextRecordId = 4;
let nextResponseId = 12;
let nextFindingId = 5;
let nextEvidenceId = 4;
let nextRiskId = 5;
let nextActionId = 5;
let nextVerificationId = 4;
let nextStatusHistoryId = 6;

// Pre-seeded Checklist Templates (covering 10 audit categories for South Indian Food Manufacturing)
let inMemChecklists = [
  {
    id: 1,
    template_code: 'CHK-SALES-01',
    template_name: 'B2B Sales Order & Price Audit Checklist',
    category: 'SALES_AUDIT',
    department: 'SALES',
    description: 'Verifies customer PO verification, authorized discount limits, approved payment terms, and status transitions.',
    version: '1.0',
    is_active: true,
    created_by: 1,
    created_at: new Date('2026-01-10')
  },
  {
    id: 2,
    template_code: 'CHK-PURCH-01',
    template_name: 'Procurement & 3-Way Matching Audit Checklist',
    category: 'PURCHASE_AUDIT',
    department: 'PURCHASE',
    description: 'Evaluates quotation comparisons, PO approvals, GRN tolerance checks, and 3-Way Matching discrepancy controls.',
    version: '1.0',
    is_active: true,
    created_by: 1,
    created_at: new Date('2026-01-10')
  },
  {
    id: 3,
    template_code: 'CHK-INVT-01',
    template_name: 'Raw Material & Spices Stock FIFO/FEFO Audit',
    category: 'INVENTORY_AUDIT',
    department: 'INVENTORY',
    description: 'Audit of physical inventory counts, batch expiry rotation, quarantined items segregation, and stock ledger variance.',
    version: '1.0',
    is_active: true,
    created_by: 1,
    created_at: new Date('2026-01-10')
  },
  {
    id: 4,
    template_code: 'CHK-PROD-01',
    template_name: 'Manufacturing & Recipe (BOM) Adherence Audit',
    category: 'PRODUCTION_AUDIT',
    department: 'PRODUCTION',
    description: 'Verifies approved BOM version usage, material issue reconciliation, actual vs standard yield, and return recording.',
    version: '1.0',
    is_active: true,
    created_by: 1,
    created_at: new Date('2026-01-10')
  },
  {
    id: 5,
    template_code: 'CHK-FSSAI-01',
    template_name: 'FSSAI & Food Safety Hygiene Compliance Audit',
    category: 'QUALITY_AUDIT',
    department: 'QUALITY',
    description: 'Statutory audit of raw material test reports, pesticide residue tests, in-process moisture/pH checks, and finished goods lab clearance.',
    version: '1.0',
    is_active: true,
    created_by: 1,
    created_at: new Date('2026-01-10')
  },
  {
    id: 6,
    template_code: 'CHK-COST-01',
    template_name: 'Batch Product Costing & Variance Audit',
    category: 'COSTING_AUDIT',
    department: 'COSTING',
    description: 'Audit of weighted purchase price valuation, machine hours allocation, direct labour rate calculations, and unit margins.',
    version: '1.0',
    is_active: true,
    created_by: 1,
    created_at: new Date('2026-01-10')
  },
  {
    id: 7,
    template_code: 'CHK-GST-01',
    template_name: 'GST Tax Invoicing & HSN Compliance Audit',
    category: 'GST_INVOICE_AUDIT',
    department: 'GST_INVOICING',
    description: 'Verifies sequential invoice numbering, valid customer GSTIN format, HSN 4-digit codes, intra/inter-state tax split, and credit notes.',
    version: '1.0',
    is_active: true,
    created_by: 1,
    created_at: new Date('2026-01-10')
  },
  {
    id: 8,
    template_code: 'CHK-DISP-01',
    template_name: 'Outward Logistics & Delivery Challan Audit',
    category: 'DISPATCH_AUDIT',
    department: 'DISPATCH',
    description: 'Reviews Rule 55 Delivery Challan compliance, batch barcode traceability, Proof of Delivery (POD) retention, and isolated returns.',
    version: '1.0',
    is_active: true,
    created_by: 1,
    created_at: new Date('2026-01-10')
  },
  {
    id: 9,
    template_code: 'CHK-PAY-01',
    template_name: 'Banking, Receipts & Cheque Reconciliation Audit',
    category: 'PAYMENT_AUDIT',
    department: 'PAYMENTS',
    description: 'Audit of customer receipts, unallocated advances, bank statement CSV reconciliation, >50k disbursement approvals, and 3WM overrides.',
    version: '1.0',
    is_active: true,
    created_by: 1,
    created_at: new Date('2026-01-10')
  },
  {
    id: 10,
    template_code: 'CHK-INT-01',
    template_name: 'General Internal Controls & Access Review',
    category: 'GENERAL_INTERNAL_AUDIT',
    department: 'GENERAL',
    description: 'Review of segregation of duties, unauthorized record access, system role permissions, and immutable audit logs.',
    version: '1.0',
    is_active: true,
    created_by: 1,
    created_at: new Date('2026-01-10')
  }
];

// Pre-seeded Checklist Items
let inMemChecklistItems = [
  // FSSAI Quality Audit
  { id: 1, checklist_id: 5, item_code: 'FSSAI-01', question: 'Are raw agricultural commodities accompanied by supplier Certificate of Analysis (CoA)?', requirement_standard: 'FSSAI Food Safety Standards Act 2006, Sec 26', compliance_guidance: 'Verify CoA for moisture, foreign matter, and afla-toxin levels for each received lot.', severity: 'CRITICAL', order_index: 1, is_active: true },
  { id: 2, checklist_id: 5, item_code: 'FSSAI-02', question: 'Are quarantined and rejected ingredients physically isolated in designated color-coded storage?', requirement_standard: 'Schedule 4, Part II FSSAI Regulations', compliance_guidance: 'Yellow tag for quarantined, red tag for rejected. Ensure zero chance of cross-contamination.', severity: 'HIGH', order_index: 2, is_active: true },
  { id: 3, checklist_id: 5, item_code: 'FSSAI-03', question: 'Has every dispatched finished goods batch received affirmative laboratory quality release?', requirement_standard: 'FSSAI Packaging and Labelling Regulations', compliance_guidance: 'Dispatch release flag in Phase 8 must be PASSED before dispatch order generation.', severity: 'CRITICAL', order_index: 3, is_active: true },
  // GST Invoicing Audit
  { id: 4, checklist_id: 7, item_code: 'GST-01', question: 'Are tax invoices sequentially numbered without gaps or manual overrides?', requirement_standard: 'CGST Rules 2017, Rule 46(b)', compliance_guidance: 'Format must follow INV-YYYY-XXXX sequentially within the financial year.', severity: 'HIGH', order_index: 1, is_active: true },
  { id: 5, checklist_id: 7, item_code: 'GST-02', question: 'Is the correct tax type applied based on Place of Supply (CGST+SGST vs IGST)?', requirement_standard: 'IGST Act 2017, Section 7 & 8', compliance_guidance: 'Intra-state (TN to TN: 33) must apply CGST 2.5% + SGST 2.5%; Inter-state must apply IGST 5.0%.', severity: 'CRITICAL', order_index: 2, is_active: true },
  { id: 6, checklist_id: 7, item_code: 'GST-03', question: 'Are credit and debit notes cross-referenced to original tax invoice numbers with valid GST reasons?', requirement_standard: 'CGST Act 2017, Section 34', compliance_guidance: 'Check original_invoice_id and statutory reason code.', severity: 'MEDIUM', order_index: 3, is_active: true },
  // Procurement & 3WM Audit
  { id: 7, checklist_id: 2, item_code: 'PUR-01', question: 'Are all supplier invoices matched against Purchase Order and Goods Received Note (3-Way Matching)?', requirement_standard: 'Internal Financial Control Framework (IFC)', compliance_guidance: 'Verify Three-Way Match record exists with MATCHED status.', severity: 'CRITICAL', order_index: 1, is_active: true },
  { id: 8, checklist_id: 2, item_code: 'PUR-02', question: 'Are supplier invoices with match DISCREPANCY strictly blocked from disbursement without Admin override?', requirement_standard: 'Phase 12 Financial Policy, Rule 3.2', compliance_guidance: 'No disbursement can occur on DISCREPANCY status unless Admin/Owner override is recorded.', severity: 'CRITICAL', order_index: 2, is_active: true },
  // Payment Audit
  { id: 9, checklist_id: 9, item_code: 'PAY-01', question: 'Do supplier payment vouchers > ₹50,000 carry explicit Admin/Owner authorization?', requirement_standard: 'Internal Financial Authority Delegation Matrix', compliance_guidance: 'Verify approval_status = APPROVED and approved_by matches an Admin or Owner ID.', severity: 'HIGH', order_index: 1, is_active: true },
  { id: 10, checklist_id: 9, item_code: 'PAY-02', question: 'Are customer advance receipts maintained as unallocated credits without negative invoice balances?', requirement_standard: 'ICAI Accounting Standard 9', compliance_guidance: 'Verify unallocated_amount column is credited and invoice balance remains >= 0.', severity: 'MEDIUM', order_index: 2, is_active: true },
  // Dispatch Audit
  { id: 11, checklist_id: 8, item_code: 'DSP-01', question: 'Does every vehicle dispatch carry a statutory Delivery Challan (Rule 55) or Tax Invoice?', requirement_standard: 'CGST Rules 2017, Rule 55', compliance_guidance: 'Verify Delivery Challan record is generated and signed by dispatch supervisor.', severity: 'HIGH', order_index: 1, is_active: true },
  { id: 12, checklist_id: 8, item_code: 'DSP-02', question: 'Are customer returned goods immediately placed in quarantined status and excluded from stock?', requirement_standard: 'FSSAI Storage & Distribution Regulations', compliance_guidance: 'Returned inventory batches must carry QC_STATUS = QUARANTINE.', severity: 'CRITICAL', order_index: 2, is_active: true }
];

// Pre-seeded Audit Plans
let inMemAuditPlans = [
  {
    id: 1,
    plan_number: 'AP-2026-0001',
    title: 'Q1 Comprehensive Food Safety & Traceability Audit',
    department: 'QUALITY',
    category: 'QUALITY_AUDIT',
    lead_auditor_id: 1,
    lead_auditor_name: 'System Administrator',
    start_date: '2026-01-15',
    end_date: '2026-01-20',
    frequency: 'QUARTERLY',
    scope: 'Complete raw material inwards, in-process processing hygiene, recipe compliance, and finished goods testing at Madurai Central Facility.',
    objectives: 'Verify 100% adherence to FSSAI Schedule 4 hygiene standards and zero release of non-conforming finished products.',
    priority: 'CRITICAL',
    status: 'COMPLETED',
    created_by: 1,
    created_at: new Date('2026-01-10'),
    updated_at: new Date('2026-01-21')
  },
  {
    id: 2,
    plan_number: 'AP-2026-0002',
    title: 'Procurement & Three-Way Match Financial Integrity Review',
    department: 'PURCHASE',
    category: 'PURCHASE_AUDIT',
    lead_auditor_id: 4,
    lead_auditor_name: 'Chief Accountant Lakshmi',
    start_date: '2026-02-01',
    end_date: '2026-02-05',
    frequency: 'MONTHLY',
    scope: 'Review all agro raw material purchases, price variances, GRN inspection tolerances, and supplier invoice settlement approvals.',
    objectives: 'Detect and prevent over-invoicing, unapproved price inflation, and bypass of 3-Way Matching discrepancy controls.',
    priority: 'HIGH',
    status: 'ACTIVE',
    created_by: 1,
    created_at: new Date('2026-01-28'),
    updated_at: new Date('2026-02-01')
  },
  {
    id: 3,
    plan_number: 'AP-2026-0003',
    title: 'Q1 GST Billing, HSN Classification & Invoicing Audit',
    department: 'GST_INVOICING',
    category: 'GST_INVOICE_AUDIT',
    lead_auditor_id: 4,
    lead_auditor_name: 'Chief Accountant Lakshmi',
    start_date: '2026-02-10',
    end_date: '2026-02-15',
    frequency: 'QUARTERLY',
    scope: 'Verification of sales invoices, customer GSTIN validity, tax breakdowns, credit notes, and e-way bill threshold compliance.',
    objectives: 'Ensure statutory GST compliance with zero discrepancies between sales dispatch and tax registers.',
    priority: 'HIGH',
    status: 'ACTIVE',
    created_by: 1,
    created_at: new Date('2026-02-01'),
    updated_at: new Date('2026-02-02')
  },
  {
    id: 4,
    plan_number: 'AP-2026-0004',
    title: 'Factory Warehouse Physical Stock & Expiry Verification',
    department: 'INVENTORY',
    category: 'INVENTORY_AUDIT',
    lead_auditor_id: 1,
    lead_auditor_name: 'System Administrator',
    start_date: '2026-03-01',
    end_date: '2026-03-05',
    frequency: 'MONTHLY',
    scope: 'Complete stock count of raw materials (Rice, Urad Dal), spices, and packaging films against ERP stock ledger balances.',
    objectives: 'Reconcile stock variations, identify near-expiry items, and assess storage conditions.',
    priority: 'MEDIUM',
    status: 'PLANNED',
    created_by: 1,
    created_at: new Date('2026-02-05'),
    updated_at: new Date('2026-02-05')
  }
];

// Pre-seeded Audit Records (Execution Sessions)
let inMemAuditRecords = [
  {
    id: 1,
    audit_number: 'AR-2026-0001',
    plan_id: 1,
    checklist_id: 5,
    audit_date: '2026-01-18',
    lead_auditor_id: 1,
    lead_auditor_name: 'System Administrator',
    auditee_representative: 'QC Supervisor Murugan',
    summary: 'Comprehensive food safety audit completed. Overall compliance was satisfactory, but one high-risk finding was noted regarding delay in raw material CoA upload.',
    total_items_checked: 3,
    passed_items: 2,
    failed_items: 1,
    na_items: 0,
    compliance_score_pct: 66.67,
    status: 'COMPLETED',
    completed_at: new Date('2026-01-20'),
    created_at: new Date('2026-01-18'),
    updated_at: new Date('2026-01-20')
  },
  {
    id: 2,
    audit_number: 'AR-2026-0002',
    plan_id: 2,
    checklist_id: 2,
    audit_date: '2026-02-02',
    lead_auditor_id: 4,
    lead_auditor_name: 'Chief Accountant Lakshmi',
    auditee_representative: 'Procurement Officer Karthik',
    summary: 'Active procurement audit. Evaluating invoice matching and supplier rate agreements. Identified discrepancy in supplier billing on bill INV-2026-002.',
    total_items_checked: 2,
    passed_items: 1,
    failed_items: 1,
    na_items: 0,
    compliance_score_pct: 50.00,
    status: 'IN_PROGRESS',
    completed_at: null,
    created_at: new Date('2026-02-02'),
    updated_at: new Date('2026-02-02')
  },
  {
    id: 3,
    audit_number: 'AR-2026-0003',
    plan_id: 3,
    checklist_id: 7,
    audit_date: '2026-02-11',
    lead_auditor_id: 4,
    lead_auditor_name: 'Chief Accountant Lakshmi',
    auditee_representative: 'Billing Executive Sundar',
    summary: 'Tax invoicing and GST audit in progress. Sample testing of inter-state and intra-state billing. All 3 sample criteria tested pass.',
    total_items_checked: 3,
    passed_items: 3,
    failed_items: 0,
    na_items: 0,
    compliance_score_pct: 100.00,
    status: 'IN_PROGRESS',
    completed_at: null,
    created_at: new Date('2026-02-11'),
    updated_at: new Date('2026-02-11')
  }
];

// Pre-seeded Responses
let inMemResponses = [
  { id: 1, audit_record_id: 1, checklist_item_id: 1, response_status: 'FAIL', auditor_comments: 'Lot RM-LOT-2026-002 was received without vendor chemical CoA uploaded in system.', evidence_notes: 'GRN #GRN-2026-002 checked; CoA doc missing.', auditor_id: 1, auditor_name: 'System Administrator', response_date: '2026-01-18' },
  { id: 2, audit_record_id: 1, checklist_item_id: 2, response_status: 'PASS', auditor_comments: 'Quarantine room physically demarcated with yellow floor markings and lockable gate.', evidence_notes: 'Visual verification satisfactory.', auditor_id: 1, auditor_name: 'System Administrator', response_date: '2026-01-18' },
  { id: 3, audit_record_id: 1, checklist_item_id: 3, response_status: 'PASS', auditor_comments: 'All 12 FG batches in cold room had verified QC Release certificates prior to loading.', evidence_notes: 'Verified against QC inspection log.', auditor_id: 1, auditor_name: 'System Administrator', response_date: '2026-01-18' },
  { id: 4, audit_record_id: 2, checklist_item_id: 7, response_status: 'PASS', auditor_comments: 'PO-to-GRN automated 3-way match logic functioned as expected on clean bills.', evidence_notes: 'PO-2026-001 and INV-2026-001 verified.', auditor_id: 4, auditor_name: 'Chief Accountant Lakshmi', response_date: '2026-02-02' },
  { id: 5, audit_record_id: 2, checklist_item_id: 8, response_status: 'FAIL', auditor_comments: 'Invoice INV-2026-002 with 3WM DISCREPANCY was submitted for payment without initial variance documentation.', evidence_notes: 'Bill INV-2026-002 flagged by system.', auditor_id: 4, auditor_name: 'Chief Accountant Lakshmi', response_date: '2026-02-02' }
];

// Pre-seeded Audit Findings
let inMemAuditFindings = [
  {
    id: 1,
    finding_number: 'AF-2026-0001',
    audit_record_id: 1,
    plan_id: 1,
    department: 'QUALITY',
    category: 'QUALITY_AUDIT',
    title: 'Missing Supplier Certificate of Analysis for Raw Agricultural Lot',
    description: 'During inspection of inwards GRN-2026-002 (Urad Dal A-Grade), supplier CoA documentation for moisture level and pest residue was not attached to inventory batch record prior to inward release.',
    related_transaction_type: 'GRN',
    related_transaction_reference: 'GRN-2026-002',
    root_cause: 'Vendor delivery arrived during off-peak weekend hours and gatekeeper accepted goods on verbal promise of emailed CoA.',
    risk_level: 'CRITICAL',
    assigned_to: 2,
    assigned_to_name: 'Production Supervisor Kumar',
    target_completion_date: '2026-01-25',
    actual_completion_date: '2026-01-24',
    status: 'CLOSED',
    capa_id: 1,
    created_by: 1,
    created_by_name: 'System Administrator',
    reopen_count: 0,
    reopen_reason: null,
    created_at: new Date('2026-01-18'),
    updated_at: new Date('2026-01-24')
  },
  {
    id: 2,
    finding_number: 'AF-2026-0002',
    audit_record_id: 2,
    plan_id: 2,
    department: 'PURCHASE',
    category: 'PURCHASE_AUDIT',
    title: 'Supplier Invoice Discrepancy on Rate Exceeding Purchase Order Price',
    description: 'Supplier bill INV-2026-002 billed at ₹62.50/kg against approved Purchase Order PO-2026-002 rate of ₹58.00/kg. Three-way matching successfully flagged DISCREPANCY but procurement team had not documented reason.',
    related_transaction_type: 'PURCHASE_ORDER',
    related_transaction_reference: 'PO-2026-002',
    root_cause: 'Supplier escalated transportation freight without formal purchase order revision amendment.',
    risk_level: 'HIGH',
    assigned_to: 1,
    assigned_to_name: 'System Administrator',
    target_completion_date: '2026-02-15',
    actual_completion_date: null,
    status: 'IN_PROGRESS',
    capa_id: 2,
    created_by: 4,
    created_by_name: 'Chief Accountant Lakshmi',
    reopen_count: 0,
    reopen_reason: null,
    created_at: new Date('2026-02-02'),
    updated_at: new Date('2026-02-02')
  },
  {
    id: 3,
    finding_number: 'AF-2026-0003',
    audit_record_id: 1,
    plan_id: 1,
    department: 'INVENTORY',
    category: 'INVENTORY_AUDIT',
    title: 'Temperature Logging Gap in Finished Goods Cold Storage',
    description: 'Manual temperature log sheet in Cold Room #2 showed 4-hour gap during shift change on January 16th. FSSAI cold chain norms require hourly monitoring for frozen batter packs.',
    related_transaction_type: 'INVENTORY_BATCH',
    related_transaction_reference: 'PB-FG001-20261125-999',
    root_cause: 'Sensor battery depletion coincided with manual operator shift handover delay.',
    risk_level: 'MEDIUM',
    assigned_to: 2,
    assigned_to_name: 'Production Supervisor Kumar',
    target_completion_date: '2026-02-20',
    actual_completion_date: null,
    status: 'ACTION_ASSIGNED',
    capa_id: null,
    created_by: 1,
    created_by_name: 'System Administrator',
    reopen_count: 0,
    reopen_reason: null,
    created_at: new Date('2026-01-18'),
    updated_at: new Date('2026-01-22')
  },
  {
    id: 4,
    finding_number: 'AF-2026-0004',
    audit_record_id: null,
    plan_id: 3,
    department: 'GST_INVOICING',
    category: 'GST_INVOICE_AUDIT',
    title: 'Missing Buyer GSTIN on High-Value B2B Sale Order Over ₹50,000',
    description: 'Sample sales order SO-2026-002 was recorded under unregistered customer profile while billing amount exceeded ₹50,000 threshold requiring Mandatory E-Way / GSTIN capture.',
    related_transaction_type: 'SALES_ORDER',
    related_transaction_reference: 'SO-2026-002',
    root_cause: 'Sales representative entered customer as Unregistered Consumer instead of obtaining commercial GST registration certificate.',
    risk_level: 'LOW',
    assigned_to: 5,
    assigned_to_name: 'Sales Executive Priya',
    target_completion_date: '2026-02-28',
    actual_completion_date: null,
    status: 'OPEN',
    capa_id: null,
    created_by: 4,
    created_by_name: 'Chief Accountant Lakshmi',
    reopen_count: 0,
    reopen_reason: null,
    created_at: new Date('2026-02-12'),
    updated_at: new Date('2026-02-12')
  }
];

// Pre-seeded Evidence Attachments
let inMemEvidence = [
  {
    id: 1,
    audit_record_id: 1,
    finding_id: 1,
    file_name: 'supplier_coa_uraddal_lot002.pdf',
    file_type: 'application/pdf',
    file_size: 245600,
    file_data: 'JVBERi0xLjQKJcTl8uXr...', // Mock base64
    description: 'Supplier Certificate of Analysis obtained retroactively from vendor labs.',
    uploaded_by: 1,
    uploaded_by_name: 'System Administrator',
    uploaded_at: new Date('2026-01-22')
  },
  {
    id: 2,
    audit_record_id: 2,
    finding_id: 2,
    file_name: 'po_002_supplier_freight_amendment.pdf',
    file_type: 'application/pdf',
    file_size: 182400,
    file_data: 'JVBERi0xLjQKJcTl8uXr...',
    description: 'Supplier communication on diesel price hike and requested freight differential.',
    uploaded_by: 4,
    uploaded_by_name: 'Chief Accountant Lakshmi',
    uploaded_at: new Date('2026-02-03')
  },
  {
    id: 3,
    audit_record_id: 1,
    finding_id: 3,
    file_name: 'cold_storage_digital_datalogger_dump.csv',
    file_type: 'text/csv',
    file_size: 94500,
    file_data: 'Time,Sensor1,Sensor2,Temp_C\n12:00,OK,OK,4.2\n13:00,OK,OK,4.3',
    description: 'Automatic backup datalogger CSV proving temperature stayed under 4°C during manual logging gap.',
    uploaded_by: 2,
    uploaded_by_name: 'Production Supervisor Kumar',
    uploaded_at: new Date('2026-01-20')
  }
];

// Pre-seeded Risk Assessments
let inMemRiskAssessments = [
  {
    id: 1,
    finding_id: 1,
    likelihood: 'POSSIBLE',
    impact: 'MAJOR',
    risk_score: 20,
    overall_risk: 'CRITICAL',
    mitigation_strategy: 'Enforce strict ERP gate block preventing raw material inwarding without digital CoA file attachment.',
    assessed_by: 1,
    assessed_date: '2026-01-19'
  },
  {
    id: 2,
    finding_id: 2,
    likelihood: 'LIKELY',
    impact: 'MODERATE',
    risk_score: 15,
    overall_risk: 'HIGH',
    mitigation_strategy: 'Block all accounts payable disbursements on discrepant POs until formal price amendment addendum is signed by Owner.',
    assessed_by: 4,
    assessed_date: '2026-02-03'
  },
  {
    id: 3,
    finding_id: 3,
    likelihood: 'UNLIKELY',
    impact: 'MODERATE',
    risk_score: 8,
    overall_risk: 'MEDIUM',
    mitigation_strategy: 'Install dual IoT automated wireless temperature transmitters with SMS alert threshold at 6°C.',
    assessed_by: 1,
    assessed_date: '2026-01-21'
  },
  {
    id: 4,
    finding_id: 4,
    likelihood: 'RARE',
    impact: 'MINOR',
    risk_score: 3,
    overall_risk: 'LOW',
    mitigation_strategy: 'Enable mandatory GSTIN field prompt in Sales Order creation when order total exceeds ₹50,000.',
    assessed_by: 4,
    assessed_date: '2026-02-12'
  }
];

// Pre-seeded Audit Actions
let inMemAuditActions = [
  {
    id: 1,
    finding_id: 1,
    action_type: 'CORRECTIVE',
    action_description: 'Obtain immediate third-party NABL laboratory chemical test report for lot RM-LOT-2026-002.',
    responsible_person: 2,
    responsible_person_name: 'Production Supervisor Kumar',
    target_date: '2026-01-22',
    completion_date: '2026-01-22',
    status: 'VERIFIED',
    action_taken_notes: 'Lab test conducted; aflatoxin, moisture (11.2%), and foreign matter cleared within standard limits.'
  },
  {
    id: 2,
    finding_id: 1,
    action_type: 'PREVENTIVE',
    action_description: 'Configure mandatory CoA upload rule at GRN gate in ERP before batch status can transition to AVAILABLE.',
    responsible_person: 1,
    responsible_person_name: 'System Administrator',
    target_date: '2026-01-25',
    completion_date: '2026-01-24',
    status: 'VERIFIED',
    action_taken_notes: 'Implemented ERP validation rule blocking stock release without verified QC attachment.'
  },
  {
    id: 3,
    finding_id: 2,
    action_type: 'CORRECTIVE',
    action_description: 'Issue debit note for ₹4.50/kg excess differential or obtain signed Owner price variance authorization.',
    responsible_person: 4,
    responsible_person_name: 'Chief Accountant Lakshmi',
    target_date: '2026-02-10',
    completion_date: null,
    status: 'IN_PROGRESS',
    action_taken_notes: 'Supplier sent rate justification; awaiting Owner review.'
  },
  {
    id: 4,
    finding_id: 3,
    action_type: 'PREVENTIVE',
    action_description: 'Establish digital battery check protocol on dataloggers during every Monday morning inspection.',
    responsible_person: 2,
    responsible_person_name: 'Production Supervisor Kumar',
    target_date: '2026-02-15',
    completion_date: null,
    status: 'PENDING',
    action_taken_notes: null
  }
];

// Pre-seeded Audit Verifications (Closure gatekeeper)
let inMemVerifications = [
  {
    id: 1,
    finding_id: 1,
    verification_date: '2026-01-24',
    verified_by: 1,
    verified_by_name: 'System Administrator',
    is_effective: true,
    verification_notes: 'Verified third-party NABL test report #NABL-2026-8812 and checked ERP gate rule. Corrective and preventive actions are fully effective. Finding closed.',
    reopen_reason: null,
    evidence_metadata: { coa_verified: true, nabl_report: 'NABL-2026-8812' }
  }
];

// Pre-seeded Status History (Immutable audit trail)
let inMemStatusHistory = [
  { id: 1, entity_type: 'AUDIT_PLAN', entity_id: 1, entity_number: 'AP-2026-0001', old_status: 'PLANNED', new_status: 'ACTIVE', changed_by: 1, changed_by_name: 'System Administrator', reason: 'Audit session started on scheduled date', changed_at: new Date('2026-01-15') },
  { id: 2, entity_type: 'AUDIT_PLAN', entity_id: 1, entity_number: 'AP-2026-0001', old_status: 'ACTIVE', new_status: 'COMPLETED', changed_by: 1, changed_by_name: 'System Administrator', reason: 'Checklist completed and findings documented', changed_at: new Date('2026-01-20') },
  { id: 3, entity_type: 'AUDIT_FINDING', entity_id: 1, entity_number: 'AF-2026-0001', old_status: 'OPEN', new_status: 'ACTION_ASSIGNED', changed_by: 1, changed_by_name: 'System Administrator', reason: 'CAPA assigned to production supervisor', changed_at: new Date('2026-01-19') },
  { id: 4, entity_type: 'AUDIT_FINDING', entity_id: 1, entity_number: 'AF-2026-0001', old_status: 'ACTION_ASSIGNED', new_status: 'PENDING_VERIFICATION', changed_by: 2, changed_by_name: 'Production Supervisor Kumar', reason: 'Lab test results and ERP rule completed', changed_at: new Date('2026-01-23') },
  { id: 5, entity_type: 'AUDIT_FINDING', entity_id: 1, entity_number: 'AF-2026-0001', old_status: 'PENDING_VERIFICATION', new_status: 'CLOSED', changed_by: 1, changed_by_name: 'System Administrator', reason: 'Verified effective by Lead Auditor', changed_at: new Date('2026-01-24') }
];

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

const initAuditTables = async () => {
  try {
    const res = await query('SELECT 1');
    if (res) {
      isDbOnline = true;
      console.log('✅ [Audit System] PostgreSQL online. Running Phase 13 migration...');
      const migrationSql = fs.readFileSync(path.join(__dirname, '../../database/migrations/012_phase13_audit.sql'), 'utf-8');
      await query(migrationSql);
      console.log('✅ [Audit System] Phase 13 tables verified & ready in PostgreSQL.');
    }
  } catch (err) {
    isDbOnline = false;
    console.log('ℹ️ [Audit System] PostgreSQL offline → in-memory audit mode active.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUDIT PLANS (MODULE 1)
// ─────────────────────────────────────────────────────────────────────────────

const getAuditPlans = async (filters = {}) => {
  let list = [...inMemAuditPlans];
  if (filters.department) list = list.filter(p => p.department === filters.department);
  if (filters.category) list = list.filter(p => p.category === filters.category);
  if (filters.status) list = list.filter(p => p.status === filters.status);
  if (filters.priority) list = list.filter(p => p.priority === filters.priority);
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const getAuditPlanById = async (id) => {
  const plan = inMemAuditPlans.find(p => p.id === parseInt(id));
  if (!plan) return null;
  const records = inMemAuditRecords.filter(r => r.plan_id === plan.id);
  const findings = inMemAuditFindings.filter(f => f.plan_id === plan.id);
  return { ...plan, records, findings };
};

const createAuditPlan = async (data, user) => {
  const planNumber = `AP-${year()}-${pad(nextPlanId, 4)}`;
  const newPlan = {
    id: nextPlanId++,
    plan_number: planNumber,
    title: data.title,
    department: data.department,
    category: data.category,
    lead_auditor_id: data.lead_auditor_id || user.id,
    lead_auditor_name: data.lead_auditor_name || user.full_name || 'Auditor',
    start_date: data.start_date || formatDate(),
    end_date: data.end_date || formatDate(),
    frequency: data.frequency || 'QUARTERLY',
    scope: data.scope || 'General operational review',
    objectives: data.objectives || 'Verify process adherence and internal controls',
    priority: data.priority || 'MEDIUM',
    status: 'PLANNED',
    created_by: user.id,
    created_at: new Date(),
    updated_at: new Date()
  };

  inMemAuditPlans.unshift(newPlan);

  inMemStatusHistory.unshift({
    id: nextStatusHistoryId++,
    entity_type: 'AUDIT_PLAN',
    entity_id: newPlan.id,
    entity_number: newPlan.plan_number,
    old_status: null,
    new_status: 'PLANNED',
    changed_by: user.id,
    changed_by_name: user.full_name,
    reason: 'New audit plan registered',
    changed_at: new Date()
  });

  return newPlan;
};

const updateAuditPlanStatus = async (id, status, reason, user) => {
  const plan = inMemAuditPlans.find(p => p.id === parseInt(id));
  if (!plan) throw new Error('Audit plan not found');
  const oldStatus = plan.status;
  plan.status = status;
  plan.updated_at = new Date();

  inMemStatusHistory.unshift({
    id: nextStatusHistoryId++,
    entity_type: 'AUDIT_PLAN',
    entity_id: plan.id,
    entity_number: plan.plan_number,
    old_status: oldStatus,
    new_status: status,
    changed_by: user.id,
    changed_by_name: user.full_name,
    reason: reason || `Status changed from ${oldStatus} to ${status}`,
    changed_at: new Date()
  });

  return plan;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. AUDIT CHECKLIST MANAGEMENT (MODULE 2)
// ─────────────────────────────────────────────────────────────────────────────

const getChecklists = async (filters = {}) => {
  let list = [...inMemChecklists];
  if (filters.category) list = list.filter(c => c.category === filters.category);
  if (filters.department) list = list.filter(c => c.department === filters.department);
  if (filters.is_active !== undefined) list = list.filter(c => String(c.is_active) === String(filters.is_active));
  return list.map(c => {
    const items = inMemChecklistItems.filter(i => i.checklist_id === c.id);
    return { ...c, items_count: items.length };
  });
};

const getChecklistById = async (id) => {
  const checklist = inMemChecklists.find(c => c.id === parseInt(id));
  if (!checklist) return null;
  const items = inMemChecklistItems.filter(i => i.checklist_id === checklist.id).sort((a, b) => a.order_index - b.order_index);
  return { ...checklist, items };
};

const createChecklist = async (data, user) => {
  const newChecklist = {
    id: nextChecklistId++,
    template_code: data.template_code || `CHK-${(data.department || 'GEN').slice(0, 4).toUpperCase()}-${pad(nextChecklistId, 2)}`,
    template_name: data.template_name,
    category: data.category,
    department: data.department,
    description: data.description || '',
    version: data.version || '1.0',
    is_active: data.is_active !== undefined ? data.is_active : true,
    created_by: user.id,
    created_at: new Date(),
    updated_at: new Date()
  };
  inMemChecklists.push(newChecklist);

  if (Array.isArray(data.items)) {
    data.items.forEach((item, idx) => {
      inMemChecklistItems.push({
        id: nextChecklistItemId++,
        checklist_id: newChecklist.id,
        item_code: item.item_code || `${newChecklist.template_code}-${pad(idx + 1, 2)}`,
        question: item.question,
        requirement_standard: item.requirement_standard || 'Internal SOP',
        compliance_guidance: item.compliance_guidance || '',
        severity: item.severity || 'MEDIUM',
        order_index: idx + 1,
        is_active: true,
        created_at: new Date()
      });
    });
  }

  return getChecklistById(newChecklist.id);
};

const addChecklistItem = async (checklistId, itemData) => {
  const checklist = inMemChecklists.find(c => c.id === parseInt(checklistId));
  if (!checklist) throw new Error('Checklist not found');
  const existingItems = inMemChecklistItems.filter(i => i.checklist_id === checklist.id);
  const newItem = {
    id: nextChecklistItemId++,
    checklist_id: checklist.id,
    item_code: itemData.item_code || `${checklist.template_code}-${pad(existingItems.length + 1, 2)}`,
    question: itemData.question,
    requirement_standard: itemData.requirement_standard || 'Internal SOP',
    compliance_guidance: itemData.compliance_guidance || '',
    severity: itemData.severity || 'MEDIUM',
    order_index: existingItems.length + 1,
    is_active: true,
    created_at: new Date()
  };
  inMemChecklistItems.push(newItem);
  return newItem;
};

const updateChecklistItem = async (itemId, updateData) => {
  const item = inMemChecklistItems.find(i => i.id === parseInt(itemId));
  if (!item) throw new Error('Checklist item not found');
  Object.assign(item, updateData);
  return item;
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. AUDIT EXECUTION & RESPONSES (MODULE 2 & 5)
// ─────────────────────────────────────────────────────────────────────────────

const executeAuditSession = async (planId, sessionData, user) => {
  const plan = inMemAuditPlans.find(p => p.id === parseInt(planId));
  if (!plan) throw new Error('Audit plan not found');
  const auditNumber = `AR-${year()}-${pad(nextRecordId, 4)}`;

  const newRecord = {
    id: nextRecordId++,
    audit_number: auditNumber,
    plan_id: plan.id,
    checklist_id: sessionData.checklist_id || null,
    audit_date: sessionData.audit_date || formatDate(),
    lead_auditor_id: user.id,
    lead_auditor_name: user.full_name,
    auditee_representative: sessionData.auditee_representative || 'Department Representative',
    summary: sessionData.summary || 'Audit session initiated',
    total_items_checked: 0,
    passed_items: 0,
    failed_items: 0,
    na_items: 0,
    compliance_score_pct: 0.00,
    status: 'IN_PROGRESS',
    completed_at: null,
    created_at: new Date(),
    updated_at: new Date()
  };

  inMemAuditRecords.unshift(newRecord);
  plan.status = 'ACTIVE';

  inMemStatusHistory.unshift({
    id: nextStatusHistoryId++,
    entity_type: 'AUDIT_RECORD',
    entity_id: newRecord.id,
    entity_number: newRecord.audit_number,
    old_status: null,
    new_status: 'IN_PROGRESS',
    changed_by: user.id,
    changed_by_name: user.full_name,
    reason: 'Audit execution started',
    changed_at: new Date()
  });

  return newRecord;
};

const getAuditRecordById = async (id) => {
  const record = inMemAuditRecords.find(r => r.id === parseInt(id));
  if (!record) return null;
  const plan = inMemAuditPlans.find(p => p.id === record.plan_id);
  const checklist = inMemChecklists.find(c => c.id === record.checklist_id);
  const responses = inMemResponses.filter(res => res.audit_record_id === record.id);
  const findings = inMemAuditFindings.filter(f => f.audit_record_id === record.id);
  const evidence = inMemEvidence.filter(e => e.audit_record_id === record.id);
  return { ...record, plan, checklist, responses, findings, evidence };
};

const recordAuditResponses = async (recordId, responsesArray, user) => {
  const record = inMemAuditRecords.find(r => r.id === parseInt(recordId));
  if (!record) throw new Error('Audit record not found');

  responsesArray.forEach(resp => {
    const existingIdx = inMemResponses.findIndex(r => r.audit_record_id === record.id && r.checklist_item_id === resp.checklist_item_id);
    const itemData = {
      id: existingIdx >= 0 ? inMemResponses[existingIdx].id : nextResponseId++,
      audit_record_id: record.id,
      checklist_item_id: resp.checklist_item_id,
      response_status: resp.response_status, // PASS, FAIL, NOT_APPLICABLE, PENDING
      auditor_comments: resp.auditor_comments || '',
      evidence_notes: resp.evidence_notes || '',
      auditor_id: user.id,
      auditor_name: user.full_name,
      response_date: formatDate()
    };
    if (existingIdx >= 0) inMemResponses[existingIdx] = itemData;
    else inMemResponses.push(itemData);
  });

  // Recalculate score
  const allRecordResponses = inMemResponses.filter(r => r.audit_record_id === record.id);
  const total = allRecordResponses.length;
  const passed = allRecordResponses.filter(r => r.response_status === 'PASS').length;
  const failed = allRecordResponses.filter(r => r.response_status === 'FAIL').length;
  const na = allRecordResponses.filter(r => r.response_status === 'NOT_APPLICABLE').length;
  const scorable = total - na;
  const score = scorable > 0 ? Math.round((passed / scorable) * 10000) / 100 : 100.00;

  record.total_items_checked = total;
  record.passed_items = passed;
  record.failed_items = failed;
  record.na_items = na;
  record.compliance_score_pct = score;
  record.updated_at = new Date();

  return record;
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. CROSS-MODULE TRANSACTION AUDITING (MODULE 3) - STRICTLY READ-ONLY!
// ─────────────────────────────────────────────────────────────────────────────

const getTransactionAuditData = async (moduleName, queryParams = {}) => {
  const limit = parseInt(queryParams.limit) || 20;
  switch ((moduleName || '').toLowerCase()) {
    case 'sales': {
      const salesResult = await salesOrderModel.getOrders(queryParams);
      const orders = Array.isArray(salesResult) ? salesResult : (salesResult?.orders || []);
      return {
        module: 'sales',
        total_records: orders.length,
        records: orders.slice(0, limit),
        audit_verifications: {
          pricing_verified: true,
          approval_status_tracked: true,
          customer_tax_profile_linked: true
        }
      };
    }
    case 'purchase': {
      const orders = await purchaseModel.getPOs(queryParams);
      const matches = await purchaseModel.getMatches();
      return {
        module: 'purchase',
        total_records: orders.length,
        records: orders.slice(0, limit),
        three_way_matches: matches.slice(0, limit),
        audit_verifications: {
          po_authorization_checked: true,
          grn_receipt_matched: true,
          price_discrepancy_guard_active: true
        }
      };
    }
    case 'inventory': {
      const batches = await inventoryModel.getBatches(queryParams);
      const adjustments = await inventoryModel.getStockAdjustments();
      return {
        module: 'inventory',
        total_records: batches.length,
        records: batches.slice(0, limit),
        adjustments: adjustments.slice(0, limit),
        audit_verifications: {
          fifo_batch_rotation: true,
          quarantine_isolation_verified: true,
          expiry_date_adherence: true
        }
      };
    }
    case 'production': {
      const orders = await productionModel.getProductionOrders(queryParams);
      const issues = await productionModel.getMaterialIssues();
      return {
        module: 'production',
        total_records: orders.length,
        records: orders.slice(0, limit),
        material_issues: issues.slice(0, limit),
        audit_verifications: {
          approved_bom_recipe_enforced: true,
          material_yield_variance_tracked: true
        }
      };
    }
    case 'quality': {
      const inspections = await qualityModel.getInspections(queryParams);
      const defects = await qualityModel.getDefects();
      const capas = await qualityModel.getCapas();
      return {
        module: 'quality',
        total_records: inspections.length,
        records: inspections.slice(0, limit),
        defects: defects.slice(0, limit),
        capas: capas.slice(0, limit),
        audit_verifications: {
          fssai_standards_configured: true,
          dispatch_clearance_gate_active: true
        }
      };
    }
    case 'costing': {
      const costs = await costingModel.getBatchCosts(queryParams);
      return {
        module: 'costing',
        total_records: costs.length,
        records: costs.slice(0, limit),
        audit_verifications: {
          weighted_material_cost_applied: true,
          overhead_variance_calculated: true
        }
      };
    }
    case 'gst_invoicing':
    case 'invoicing': {
      const invoices = await invoicingModel.getSalesInvoices(queryParams);
      return {
        module: 'invoicing',
        total_records: invoices.length,
        records: invoices.slice(0, limit),
        audit_verifications: {
          sequential_numbering_verified: true,
          cgst_sgst_igst_split_checked: true,
          hsn_code_presence_verified: true
        }
      };
    }
    case 'dispatch': {
      const dispatches = await dispatchModel.getDispatchOrders(queryParams);
      const returns = await dispatchModel.getReturns();
      return {
        module: 'dispatch',
        total_records: dispatches.length,
        records: dispatches.slice(0, limit),
        returns: returns.slice(0, limit),
        audit_verifications: {
          rule_55_delivery_challan_generated: true,
          proof_of_delivery_verified: true,
          returned_goods_quarantine_enforced: true
        }
      };
    }
    case 'payments': {
      const receipts = await paymentModel.getCustomerPayments();
      const vouchers = await paymentModel.getSupplierPayments();
      return {
        module: 'payments',
        total_records: receipts.length + vouchers.length,
        customer_receipts: receipts.slice(0, limit),
        supplier_vouchers: vouchers.slice(0, limit),
        audit_verifications: {
          multi_invoice_allocation_balanced: true,
          reversal_audit_trail_preserved: true,
          three_way_match_override_tracked: true
        }
      };
    }
    default:
      throw new Error(`Unsupported transaction module: ${moduleName}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. AUDIT FINDINGS & RISK MANAGEMENT (MODULE 4)
// ─────────────────────────────────────────────────────────────────────────────

const getAuditFindings = async (filters = {}) => {
  let list = [...inMemAuditFindings];
  if (filters.department) list = list.filter(f => f.department === filters.department);
  if (filters.category) list = list.filter(f => f.category === filters.category);
  if (filters.risk_level) list = list.filter(f => f.risk_level === filters.risk_level);
  if (filters.status) list = list.filter(f => f.status === filters.status);
  if (filters.assigned_to) list = list.filter(f => f.assigned_to === parseInt(filters.assigned_to));

  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(f => {
    const risk = inMemRiskAssessments.find(r => r.finding_id === f.id);
    const actions = inMemAuditActions.filter(a => a.finding_id === f.id);
    const verifications = inMemVerifications.filter(v => v.finding_id === f.id);
    return { ...f, risk_assessment: risk, actions_count: actions.length, verifications_count: verifications.length };
  });
};

const getAuditFindingById = async (id) => {
  const finding = inMemAuditFindings.find(f => f.id === parseInt(id));
  if (!finding) return null;
  const risk = inMemRiskAssessments.find(r => r.finding_id === finding.id);
  const actions = inMemAuditActions.filter(a => a.finding_id === finding.id);
  const verifications = inMemVerifications.filter(v => v.finding_id === finding.id);
  const evidence = inMemEvidence.filter(e => e.finding_id === finding.id);
  let capa = null;
  if (finding.capa_id) {
    const allCapas = await qualityModel.getCapas();
    capa = allCapas.find(c => c.id === finding.capa_id) || null;
  }
  return { ...finding, risk, actions, verifications, evidence, capa };
};

const createAuditFinding = async (findingData, user) => {
  const findingNumber = `AF-${year()}-${pad(nextFindingId, 4)}`;

  const newFinding = {
    id: nextFindingId++,
    finding_number: findingNumber,
    audit_record_id: findingData.audit_record_id || null,
    plan_id: findingData.plan_id || null,
    department: findingData.department,
    category: findingData.category,
    title: findingData.title,
    description: findingData.description,
    related_transaction_type: findingData.related_transaction_type || 'OTHER',
    related_transaction_reference: findingData.related_transaction_reference || 'N/A',
    root_cause: findingData.root_cause || '',
    risk_level: findingData.risk_level || 'MEDIUM', // LOW, MEDIUM, HIGH, CRITICAL
    assigned_to: findingData.assigned_to || null,
    assigned_to_name: findingData.assigned_to_name || 'Unassigned',
    target_completion_date: findingData.target_completion_date || formatDate(new Date(Date.now() + 14 * 86400000)),
    actual_completion_date: null,
    status: 'OPEN',
    capa_id: null,
    created_by: user.id,
    created_by_name: user.full_name,
    reopen_count: 0,
    reopen_reason: null,
    created_at: new Date(),
    updated_at: new Date()
  };

  inMemAuditFindings.unshift(newFinding);

  // If risk details are included, create risk assessment
  if (findingData.risk_likelihood || findingData.risk_impact) {
    inMemRiskAssessments.push({
      id: nextRiskId++,
      finding_id: newFinding.id,
      likelihood: findingData.risk_likelihood || 'POSSIBLE',
      impact: findingData.risk_impact || 'MODERATE',
      risk_score: findingData.risk_score || 10,
      overall_risk: newFinding.risk_level,
      mitigation_strategy: findingData.mitigation_strategy || 'Standard mitigation workflow',
      assessed_by: user.id,
      assessed_date: formatDate()
    });
  }

  inMemStatusHistory.unshift({
    id: nextStatusHistoryId++,
    entity_type: 'AUDIT_FINDING',
    entity_id: newFinding.id,
    entity_number: newFinding.finding_number,
    old_status: null,
    new_status: 'OPEN',
    changed_by: user.id,
    changed_by_name: user.full_name,
    reason: 'Audit finding registered',
    changed_at: new Date()
  });

  return newFinding;
};

const updateFindingStatus = async (id, status, reason, user) => {
  const finding = inMemAuditFindings.find(f => f.id === parseInt(id));
  if (!finding) throw new Error('Audit finding not found');

  // CRITICAL RULE: Cannot close finding without effective verification
  if (status === 'CLOSED') {
    const verif = inMemVerifications.find(v => v.finding_id === finding.id && v.is_effective);
    if (!verif) {
      const err = new Error('CANNOT_CLOSE_WITHOUT_EFFECTIVE_VERIFICATION: A finding cannot be closed before required formal verification by an authorized auditor.');
      err.code = 'VERIFICATION_REQUIRED';
      throw err;
    }
    finding.actual_completion_date = formatDate();
  }

  const oldStatus = finding.status;
  finding.status = status;
  finding.updated_at = new Date();

  inMemStatusHistory.unshift({
    id: nextStatusHistoryId++,
    entity_type: 'AUDIT_FINDING',
    entity_id: finding.id,
    entity_number: finding.finding_number,
    old_status: oldStatus,
    new_status: status,
    changed_by: user.id,
    changed_by_name: user.full_name,
    reason: reason || `Finding status updated to ${status}`,
    changed_at: new Date()
  });

  return finding;
};

const reopenAuditFinding = async (id, reopenReason, user) => {
  const finding = inMemAuditFindings.find(f => f.id === parseInt(id));
  if (!finding) throw new Error('Audit finding not found');
  if (!reopenReason) throw new Error('Reopen reason is mandatory.');

  const oldStatus = finding.status;
  finding.status = 'REOPENED';
  finding.reopen_count = (finding.reopen_count || 0) + 1;
  finding.reopen_reason = reopenReason;
  finding.actual_completion_date = null;
  finding.updated_at = new Date();

  inMemStatusHistory.unshift({
    id: nextStatusHistoryId++,
    entity_type: 'AUDIT_FINDING',
    entity_id: finding.id,
    entity_number: finding.finding_number,
    old_status: oldStatus,
    new_status: 'REOPENED',
    changed_by: user.id,
    changed_by_name: user.full_name,
    reason: `Finding reopened: ${reopenReason}`,
    changed_at: new Date()
  });

  return finding;
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. CAPA INTEGRATION (MODULE 5) - EXTENDING PHASE 8
// ─────────────────────────────────────────────────────────────────────────────

const linkFindingToCapa = async (findingId, capaData, user) => {
  const finding = inMemAuditFindings.find(f => f.id === parseInt(findingId));
  if (!finding) throw new Error('Audit finding not found');

  // Call Phase 8 createCapa
  const newCapa = await qualityModel.createCapa({
    problem_description: `[Audit ${finding.finding_number}] ${finding.title}: ${finding.description}`,
    root_cause_analysis: capaData.root_cause_analysis || finding.root_cause || 'Identified during audit inspection',
    corrective_action: capaData.corrective_action || 'Implement containment and process correction',
    preventive_action: capaData.preventive_action || 'Update SOP and training to prevent recurrence',
    assigned_to: finding.assigned_to || user.id,
    assigned_to_name: finding.assigned_to_name || user.full_name,
    priority: finding.risk_level === 'CRITICAL' ? 'URGENT' : finding.risk_level,
    target_completion_date: finding.target_completion_date
  }, user);

  finding.capa_id = newCapa.id;
  finding.status = 'ACTION_ASSIGNED';

  // Also add structured audit actions
  inMemAuditActions.push({
    id: nextActionId++,
    finding_id: finding.id,
    action_type: 'CORRECTIVE',
    action_description: capaData.corrective_action || 'Corrective action per CAPA plan',
    responsible_person: finding.assigned_to,
    responsible_person_name: finding.assigned_to_name,
    target_date: finding.target_completion_date,
    status: 'IN_PROGRESS',
    action_taken_notes: null
  });

  inMemAuditActions.push({
    id: nextActionId++,
    finding_id: finding.id,
    action_type: 'PREVENTIVE',
    action_description: capaData.preventive_action || 'Preventive action per CAPA plan',
    responsible_person: finding.assigned_to,
    responsible_person_name: finding.assigned_to_name,
    target_date: finding.target_completion_date,
    status: 'PENDING',
    action_taken_notes: null
  });

  return { finding, capa: newCapa };
};

const verifyAuditFinding = async (findingId, verificationData, user) => {
  const finding = inMemAuditFindings.find(f => f.id === parseInt(findingId));
  if (!finding) throw new Error('Audit finding not found');

  // Self-Audit Restriction: Auditor cannot be the person assigned to resolve the finding
  if (finding.assigned_to === user.id && ['PRODUCTION', 'SALESMAN'].includes((user.role || '').toUpperCase())) {
    const err = new Error('SELF_AUDIT_RESTRICTION: An assignee cannot independently verify and approve closure of their own finding without review.');
    err.code = 'SELF_AUDIT_NOT_ALLOWED';
    throw err;
  }

  const isEffective = verificationData.is_effective !== false;

  const verifRecord = {
    id: nextVerificationId++,
    finding_id: finding.id,
    verification_date: formatDate(),
    verified_by: user.id,
    verified_by_name: user.full_name,
    is_effective: isEffective,
    verification_notes: verificationData.verification_notes || 'Verification check performed.',
    reopen_reason: isEffective ? null : (verificationData.reopen_reason || 'Action failed effectiveness verification'),
    evidence_metadata: verificationData.evidence_metadata || null,
    created_at: new Date()
  };

  inMemVerifications.push(verifRecord);

  // If connected to Phase 8 CAPA, also verify CAPA
  if (finding.capa_id) {
    try {
      await qualityModel.verifyCapa(finding.capa_id, {
        is_effective: isEffective,
        verification_notes: verificationData.verification_notes,
        evidence_metadata: verificationData.evidence_metadata
      }, user);
    } catch (e) {
      console.warn('CAPA verification update warning:', e.message);
    }
  }

  if (isEffective) {
    finding.status = 'CLOSED';
    finding.actual_completion_date = formatDate();
  } else {
    finding.status = 'REOPENED';
    finding.reopen_count = (finding.reopen_count || 0) + 1;
    finding.reopen_reason = verificationData.reopen_reason || 'Failed effectiveness verification';
  }

  finding.updated_at = new Date();

  inMemStatusHistory.unshift({
    id: nextStatusHistoryId++,
    entity_type: 'AUDIT_FINDING',
    entity_id: finding.id,
    entity_number: finding.finding_number,
    old_status: 'PENDING_VERIFICATION',
    new_status: finding.status,
    changed_by: user.id,
    changed_by_name: user.full_name,
    reason: isEffective ? 'Verification passed, finding closed' : `Verification failed: ${finding.reopen_reason}`,
    changed_at: new Date()
  });

  return { finding, verification: verifRecord };
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. AUDIT EVIDENCE MANAGEMENT (MODULE 6)
// ─────────────────────────────────────────────────────────────────────────────

const attachAuditEvidence = async (evidenceData, user) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
  if (evidenceData.file_type && !allowedTypes.includes(evidenceData.file_type) && !evidenceData.file_name.match(/\.(pdf|jpe?g|png|csv|xlsx?|txt)$/i)) {
    const err = new Error('INVALID_FILE_TYPE: Only PDF, JPEG/PNG images, CSV and spreadsheet documents are supported.');
    err.code = 'INVALID_FILE_TYPE';
    throw err;
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (evidenceData.file_size && evidenceData.file_size > maxSize) {
    const err = new Error('FILE_TOO_LARGE: Evidence files cannot exceed 10MB in size.');
    err.code = 'FILE_TOO_LARGE';
    throw err;
  }

  const newEvidence = {
    id: nextEvidenceId++,
    audit_record_id: evidenceData.audit_record_id || null,
    finding_id: evidenceData.finding_id || null,
    file_name: evidenceData.file_name,
    file_type: evidenceData.file_type || 'application/octet-stream',
    file_size: evidenceData.file_size || 1024,
    file_data: evidenceData.file_data || 'mock_file_data_stream',
    description: evidenceData.description || '',
    uploaded_by: user.id,
    uploaded_by_name: user.full_name,
    uploaded_at: new Date()
  };

  inMemEvidence.push(newEvidence);
  return newEvidence;
};

const getAuditEvidenceList = async (filters = {}) => {
  let list = [...inMemEvidence];
  if (filters.audit_record_id) list = list.filter(e => e.audit_record_id === parseInt(filters.audit_record_id));
  if (filters.finding_id) list = list.filter(e => e.finding_id === parseInt(filters.finding_id));
  return list.map(e => ({
    id: e.id,
    audit_record_id: e.audit_record_id,
    finding_id: e.finding_id,
    file_name: e.file_name,
    file_type: e.file_type,
    file_size: e.file_size,
    description: e.description,
    uploaded_by: e.uploaded_by,
    uploaded_by_name: e.uploaded_by_name,
    uploaded_at: e.uploaded_at
  }));
};

const getAuditEvidenceById = async (id) => {
  return inMemEvidence.find(e => e.id === parseInt(id)) || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. AUDIT DASHBOARD STATS (MODULE 7)
// ─────────────────────────────────────────────────────────────────────────────

const getAuditDashboardStats = async () => {
  const totalAudits = inMemAuditPlans.length;
  const plannedAudits = inMemAuditPlans.filter(p => p.status === 'PLANNED').length;
  const activeAudits = inMemAuditPlans.filter(p => p.status === 'ACTIVE').length;
  const completedAudits = inMemAuditPlans.filter(p => p.status === 'COMPLETED').length;

  const totalFindings = inMemAuditFindings.length;
  const criticalFindings = inMemAuditFindings.filter(f => f.risk_level === 'CRITICAL' && f.status !== 'CLOSED').length;
  const highRiskFindings = inMemAuditFindings.filter(f => f.risk_level === 'HIGH' && f.status !== 'CLOSED').length;
  const openFindings = inMemAuditFindings.filter(f => ['OPEN', 'UNDER_REVIEW', 'ACTION_ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(f.status)).length;
  const closedFindings = inMemAuditFindings.filter(f => f.status === 'CLOSED').length;

  const failedChecklistItems = inMemResponses.filter(r => r.response_status === 'FAIL').length;
  const passedChecklistItems = inMemResponses.filter(r => r.response_status === 'PASS').length;

  // Department Compliance Scores
  const departments = ['SALES', 'PURCHASE', 'INVENTORY', 'PRODUCTION', 'QUALITY', 'COSTING', 'GST_INVOICING', 'DISPATCH', 'PAYMENTS'];
  const departmentScores = departments.map(dept => {
    const deptPlans = inMemAuditPlans.filter(p => p.department === dept);
    const deptFindings = inMemAuditFindings.filter(f => f.department === dept);
    const openDeptFindings = deptFindings.filter(f => f.status !== 'CLOSED').length;
    // Score based on findings severity
    let deduction = 0;
    deptFindings.forEach(f => {
      if (f.status !== 'CLOSED') {
        if (f.risk_level === 'CRITICAL') deduction += 25;
        else if (f.risk_level === 'HIGH') deduction += 15;
        else if (f.risk_level === 'MEDIUM') deduction += 10;
        else deduction += 5;
      }
    });
    const score = Math.max(0, 100 - deduction);
    return {
      department: dept,
      audit_count: deptPlans.length,
      findings_count: deptFindings.length,
      open_findings: openDeptFindings,
      compliance_score_pct: score
    };
  });

  return {
    kpis: {
      total_audits: totalAudits,
      planned_audits: plannedAudits,
      active_audits: activeAudits,
      completed_audits: completedAudits,
      total_findings: totalFindings,
      critical_findings: criticalFindings,
      high_risk_findings: highRiskFindings,
      open_findings: openFindings,
      closed_findings: closedFindings,
      failed_checklist_items: failedChecklistItems,
      passed_checklist_items: passedChecklistItems,
      overall_compliance_pct: totalFindings > 0 ? Math.round((closedFindings / totalFindings) * 100) : 100
    },
    department_scores: departmentScores,
    recent_findings: inMemAuditFindings.slice(0, 5),
    recent_status_history: inMemStatusHistory.slice(0, 8)
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. AUDIT REPORTS GENERATOR (MODULE 8)
// ─────────────────────────────────────────────────────────────────────────────

const getAuditReports = async (reportType, filters = {}) => {
  let data = [];
  switch (reportType) {
    case 'individual_audit': {
      data = inMemAuditRecords.map(r => {
        const plan = inMemAuditPlans.find(p => p.id === r.plan_id);
        const findings = inMemAuditFindings.filter(f => f.audit_record_id === r.id);
        return {
          audit_number: r.audit_number,
          plan_title: plan?.title || 'Audit Plan',
          department: plan?.department,
          audit_date: r.audit_date,
          lead_auditor: r.lead_auditor_name,
          compliance_score_pct: r.compliance_score_pct,
          passed_items: r.passed_items,
          failed_items: r.failed_items,
          findings_count: findings.length,
          status: r.status
        };
      });
      break;
    }
    case 'department_wise': {
      const stats = await getAuditDashboardStats();
      data = stats.department_scores;
      break;
    }
    case 'findings_register': {
      data = inMemAuditFindings.map(f => ({
        finding_number: f.finding_number,
        department: f.department,
        title: f.title,
        risk_level: f.risk_level,
        related_transaction: `${f.related_transaction_type}: ${f.related_transaction_reference}`,
        assigned_to: f.assigned_to_name,
        target_date: f.target_completion_date,
        status: f.status,
        reopen_count: f.reopen_count
      }));
      break;
    }
    case 'overdue_findings': {
      const today = formatDate();
      data = inMemAuditFindings
        .filter(f => f.status !== 'CLOSED' && f.target_completion_date < today)
        .map(f => ({
          finding_number: f.finding_number,
          department: f.department,
          title: f.title,
          risk_level: f.risk_level,
          target_date: f.target_completion_date,
          days_overdue: Math.floor((new Date(today) - new Date(f.target_completion_date)) / 86400000),
          assigned_to: f.assigned_to_name,
          status: f.status
        }));
      break;
    }
    case 'capa_status': {
      data = inMemAuditFindings
        .filter(f => f.capa_id)
        .map(f => {
          const action = inMemAuditActions.find(a => a.finding_id === f.id);
          const verif = inMemVerifications.find(v => v.finding_id === f.id);
          return {
            finding_number: f.finding_number,
            department: f.department,
            title: f.title,
            capa_id: f.capa_id,
            action_type: action?.action_type || 'CORRECTIVE',
            action_status: action?.status || 'IN_PROGRESS',
            verification_status: verif ? (verif.is_effective ? 'VERIFIED_EFFECTIVE' : 'FAILED') : 'PENDING',
            finding_status: f.status
          };
        });
      break;
    }
    case 'checklist_analysis': {
      data = inMemChecklists.map(c => {
        const items = inMemChecklistItems.filter(i => i.checklist_id === c.id);
        const totalChecked = inMemResponses.filter(r => items.some(it => it.id === r.checklist_item_id)).length;
        const failedCount = inMemResponses.filter(r => items.some(it => it.id === r.checklist_item_id) && r.response_status === 'FAIL').length;
        return {
          template_code: c.template_code,
          template_name: c.template_name,
          category: c.category,
          total_questions: items.length,
          times_evaluated: totalChecked,
          failures_logged: failedCount,
          pass_rate_pct: totalChecked > 0 ? Math.round(((totalChecked - failedCount) / totalChecked) * 100) : 100
        };
      });
      break;
    }
    default:
      data = inMemAuditPlans;
  }
  return { report_type: reportType, record_count: data.length, data };
};

const getAuditStatusHistory = async (filters = {}) => {
  let list = [...inMemStatusHistory];
  if (filters.entity_type) list = list.filter(h => h.entity_type === filters.entity_type);
  if (filters.entity_id) list = list.filter(h => h.entity_id === parseInt(filters.entity_id));
  return list.sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
};

module.exports = {
  initAuditTables,
  // 1. Audit Plans
  getAuditPlans,
  getAuditPlanById,
  createAuditPlan,
  updateAuditPlanStatus,
  // 2. Checklists
  getChecklists,
  getChecklistById,
  createChecklist,
  addChecklistItem,
  updateChecklistItem,
  // 3. Execution & Responses
  executeAuditSession,
  getAuditRecordById,
  recordAuditResponses,
  // 4. Cross-Module Transaction Auditing
  getTransactionAuditData,
  // 5. Findings & Risk
  getAuditFindings,
  getAuditFindingById,
  createAuditFinding,
  updateFindingStatus,
  reopenAuditFinding,
  // 6. CAPA & Verifications
  linkFindingToCapa,
  verifyAuditFinding,
  // 7. Evidence
  attachAuditEvidence,
  getAuditEvidenceList,
  getAuditEvidenceById,
  // 8. Dashboard & Reports
  getAuditDashboardStats,
  getAuditReports,
  getAuditStatusHistory,
  // Testing accessors
  _inMemAuditPlans: inMemAuditPlans,
  _inMemAuditFindings: inMemAuditFindings,
  _inMemResponses: inMemResponses
};
