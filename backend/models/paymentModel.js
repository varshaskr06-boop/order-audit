/**
 * ============================================================================
 * Phase 12: Payment Management System Model
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 *
 * Dual-Mode: PostgreSQL when online, resilient in-memory fallback for offline/testing.
 * Integrates with:
 *  - Master Customers & Suppliers (Phase 3)
 *  - Supplier Invoices & Three-Way Matching (Phase 5)
 *  - GST Sales Invoices (Phase 10)
 * ============================================================================
 */

const { query, getClient } = require('../config/db');
const purchaseModel = require('./purchaseModel');
const invoicingModel = require('./invoicingModel');

let isDbOnline = false;

const formatDate = (d = new Date()) => new Date(d).toISOString().split('T')[0];
const round2 = (num) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY SEED DATA
// ─────────────────────────────────────────────────────────────────────────────

let inMemPaymentMethods = [
  { id: 1, method_code: 'CASH', method_name: 'Cash on Delivery / Direct Cash', requires_reference: false, is_active: true },
  { id: 2, method_code: 'BANK_TRANSFER', method_name: 'NEFT / RTGS / IMPS Bank Transfer', requires_reference: true, is_active: true },
  { id: 3, method_code: 'UPI', method_name: 'UPI / BharatPe / QR Settlement', requires_reference: true, is_active: true },
  { id: 4, method_code: 'CHEQUE', method_name: 'Bank Cheque / Demand Draft', requires_reference: true, is_active: true },
  { id: 5, method_code: 'CARD', method_name: 'Debit / Corporate Credit Card', requires_reference: true, is_active: true }
];

let inMemCashBankAccounts = [
  {
    id: 1,
    account_code: 'BNK-HDFC-01',
    account_name: 'HDFC Bank Primary Operational Current A/C',
    account_type: 'BANK',
    bank_name: 'HDFC Bank',
    account_number: '50200088991122',
    ifsc_code: 'HDFC0001234',
    branch_name: 'Kappalur Industrial Estate, Madurai',
    opening_balance: 500000.00,
    current_balance: 624500.00,
    is_active: true,
    created_at: new Date('2026-01-01')
  },
  {
    id: 2,
    account_code: 'BNK-SBI-02',
    account_name: 'State Bank of India (SBI) Trade Settlement A/C',
    account_type: 'BANK',
    bank_name: 'State Bank of India',
    account_number: '30881122334',
    ifsc_code: 'SBIN0004567',
    branch_name: 'Madurai Main Branch, Madurai',
    opening_balance: 300000.00,
    current_balance: 385000.00,
    is_active: true,
    created_at: new Date('2026-01-01')
  },
  {
    id: 3,
    account_code: 'CSH-MAIN-01',
    account_name: 'Factory Cash Desk & Petty Cash',
    account_type: 'CASH',
    bank_name: null,
    account_number: null,
    ifsc_code: null,
    branch_name: 'SIPCOT Factory Office, Kappalur',
    opening_balance: 50000.00,
    current_balance: 42000.00,
    is_active: true,
    created_at: new Date('2026-01-01')
  }
];

let inMemCustomerPayments = [
  {
    id: 1,
    receipt_number: 'RCP-2026-0001',
    customer_id: 1,
    customer_name: 'Hotel Meenakshi Bhavan (T.Nagar)',
    payment_date: '2026-11-21',
    amount: 3780.00,
    payment_method: 'BANK_TRANSFER',
    cash_bank_account_id: 1,
    reference_number: 'NEFT-HDFC-9988112',
    cheque_number: null,
    cheque_date: null,
    bank_name: 'ICICI Bank',
    notes: 'Settlement for invoice INV/2026-27/0101',
    status: 'ALLOCATED',
    allocated_amount: 3780.00,
    unallocated_amount: 0.00,
    is_advance: false,
    created_by: 5,
    created_at: new Date('2026-11-21T14:00:00Z'),
    updated_at: new Date('2026-11-21T14:00:00Z')
  },
  {
    id: 2,
    receipt_number: 'RCP-2026-0002',
    customer_id: 2,
    customer_name: 'Saravana Bhavan Super Store Private Limited',
    payment_date: '2026-11-22',
    amount: 2000.00,
    payment_method: 'UPI',
    cash_bank_account_id: 1,
    reference_number: 'UPI-BHARATPE-776655',
    cheque_number: null,
    cheque_date: null,
    bank_name: 'HDFC Bank',
    notes: 'Part payment for INV/2026-27/0103',
    status: 'PARTIALLY_ALLOCATED',
    allocated_amount: 2000.00,
    unallocated_amount: 0.00,
    is_advance: false,
    created_by: 5,
    created_at: new Date('2026-11-22T10:00:00Z'),
    updated_at: new Date('2026-11-22T10:00:00Z')
  }
];

let inMemCustomerAllocations = [
  {
    id: 1,
    payment_id: 1,
    invoice_id: 1,
    invoice_number: 'INV/2026-27/0101',
    allocated_amount: 3780.00,
    allocation_date: '2026-11-21',
    notes: 'Full payment allocation',
    created_by: 5,
    created_at: new Date('2026-11-21T14:00:00Z')
  },
  {
    id: 2,
    payment_id: 2,
    invoice_id: 3,
    invoice_number: 'INV/2026-27/0103',
    allocated_amount: 2000.00,
    allocation_date: '2026-11-22',
    notes: 'Partial allocation against batter supply',
    created_by: 5,
    created_at: new Date('2026-11-22T10:00:00Z')
  }
];

let inMemSupplierPayments = [
  {
    id: 1,
    voucher_number: 'PV-2026-0001',
    supplier_id: 1,
    supplier_name: 'Kaveri Delta Agro Millers',
    payment_date: '2026-01-28',
    due_date: '2026-01-29',
    amount: 35467.50,
    payment_method: 'BANK_TRANSFER',
    cash_bank_account_id: 1,
    reference_number: 'RTGS-HDFC-4433221',
    cheque_number: null,
    cheque_date: null,
    bank_name: 'SBI Bank',
    notes: 'Payment for raw paddy & dal supplies on INV-2026-001',
    status: 'PAID',
    allocated_amount: 35467.50,
    unallocated_amount: 0.00,
    is_advance: false,
    requires_approval: false,
    approved_by: 2,
    approved_at: new Date('2026-01-28T11:00:00Z'),
    discrepancy_override_reason: null,
    discrepancy_approved_by: null,
    created_by: 5,
    created_at: new Date('2026-01-28T10:00:00Z'),
    updated_at: new Date('2026-01-28T11:00:00Z')
  }
];

let inMemSupplierAllocations = [
  {
    id: 1,
    payment_id: 1,
    supplier_invoice_id: 1,
    invoice_number: 'INV-2026-001',
    allocated_amount: 35467.50,
    allocation_date: '2026-01-28',
    notes: 'Full settlement of approved PO-2026-001 invoice',
    created_by: 5,
    created_at: new Date('2026-01-28T10:00:00Z')
  }
];

let inMemPaymentReceipts = [
  {
    id: 1,
    receipt_number: 'RCP-2026-0001',
    receipt_type: 'CUSTOMER_RECEIPT',
    payment_id: 1,
    customer_id: 1,
    customer_name: 'Hotel Meenakshi Bhavan (T.Nagar)',
    receipt_date: '2026-11-21',
    amount: 3780.00,
    payment_method: 'BANK_TRANSFER',
    reference_number: 'NEFT-HDFC-9988112',
    total_allocated_invoices: 1,
    received_by: 'M. Sridhar (Senior Accountant)',
    created_at: new Date('2026-11-21T14:00:00Z')
  },
  {
    id: 2,
    receipt_number: 'RCP-2026-0002',
    receipt_type: 'CUSTOMER_RECEIPT',
    payment_id: 2,
    customer_id: 2,
    customer_name: 'Saravana Bhavan Super Store Private Limited',
    receipt_date: '2026-11-22',
    amount: 2000.00,
    payment_method: 'UPI',
    reference_number: 'UPI-BHARATPE-776655',
    total_allocated_invoices: 1,
    received_by: 'M. Sridhar (Senior Accountant)',
    created_at: new Date('2026-11-22T10:00:00Z')
  }
];

let inMemPaymentVouchers = [
  {
    id: 1,
    voucher_number: 'PV-2026-0001',
    voucher_type: 'SUPPLIER_PAYMENT',
    payment_id: 1,
    supplier_id: 1,
    supplier_name: 'Kaveri Delta Agro Millers',
    voucher_date: '2026-01-28',
    amount: 35467.50,
    payment_method: 'BANK_TRANSFER',
    reference_number: 'RTGS-HDFC-4433221',
    total_allocated_invoices: 1,
    authorized_by: 'A. Sundararajan (Finance Director / Admin)',
    created_at: new Date('2026-01-28T10:00:00Z')
  }
];

let inMemStatementImports = [];
let inMemStatementLines = [
  {
    id: 1,
    import_id: 1,
    account_id: 1,
    transaction_date: '2026-11-21',
    value_date: '2026-11-21',
    description: 'NEFT CR-HDFC0001234-HOTEL MEENAKSHI BHAVAN-NEFT-HDFC-9988112',
    reference_number: 'NEFT-HDFC-9988112',
    transaction_type: 'CREDIT',
    amount: 3780.00,
    balance_after: 624500.00,
    reconciliation_status: 'MATCHED',
    created_at: new Date('2026-11-21T15:00:00Z')
  },
  {
    id: 2,
    import_id: 1,
    account_id: 1,
    transaction_date: '2026-11-22',
    value_date: '2026-11-22',
    description: 'UPI CR-SARAVANA BHAVAN-UPI-BHARATPE-776655',
    reference_number: 'UPI-BHARATPE-776655',
    transaction_type: 'CREDIT',
    amount: 2000.00,
    balance_after: 626500.00,
    reconciliation_status: 'MATCHED',
    created_at: new Date('2026-11-22T11:00:00Z')
  },
  {
    id: 3,
    import_id: 1,
    account_id: 1,
    transaction_date: '2026-11-23',
    value_date: '2026-11-23',
    description: 'IMPS CR-BENGALURU AGRO TRADERS-TXN889922',
    reference_number: 'TXN889922',
    transaction_type: 'CREDIT',
    amount: 5000.00,
    balance_after: 631500.00,
    reconciliation_status: 'UNMATCHED',
    created_at: new Date('2026-11-23T09:00:00Z')
  }
];

let inMemReconciliations = [
  {
    id: 1,
    statement_line_id: 1,
    payment_type: 'CUSTOMER',
    payment_id: 1,
    matched_amount: 3780.00,
    reconciled_by: 5,
    reconciled_at: new Date('2026-11-21T16:00:00Z'),
    notes: 'Exact match with customer receipt RCP-2026-0001',
    status: 'MATCHED'
  },
  {
    id: 2,
    statement_line_id: 2,
    payment_type: 'CUSTOMER',
    payment_id: 2,
    matched_amount: 2000.00,
    reconciled_by: 5,
    reconciled_at: new Date('2026-11-22T12:00:00Z'),
    notes: 'Exact match with UPI receipt RCP-2026-0002',
    status: 'MATCHED'
  }
];

let inMemReversals = [];
let inMemStatusHistory = [];

let seqCounters = {
  receipt: 103,
  voucher: 102,
  reversal: 101,
  import: 2
};

// Approval limit: Payments exceeding ₹50,000 require ADMIN or OWNER approval
const APPROVAL_THRESHOLD = 50000.00;

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

const initPaymentTables = async () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const migPath = path.join(__dirname, '../../database/migrations/011_phase12_payments.sql');
    if (fs.existsSync(migPath)) {
      const sql = fs.readFileSync(migPath, 'utf8');
      await query(sql);
      isDbOnline = true;
      console.log('✅ [Payments] PostgreSQL Phase 12 tables initialized successfully.');
    }
  } catch (err) {
    isDbOnline = false;
    console.log('ℹ️ [Payments] PostgreSQL offline → in-memory payment mode active.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1: CASH & BANK ACCOUNTS
// ─────────────────────────────────────────────────────────────────────────────

const getPaymentMethods = async () => inMemPaymentMethods.filter(m => m.is_active);

const getCashBankAccounts = async () => {
  return inMemCashBankAccounts.filter(a => a.is_active);
};

const createCashBankAccount = async (data) => {
  const newAcc = {
    id: inMemCashBankAccounts.length + 1,
    account_code: data.account_code || `BNK-0${inMemCashBankAccounts.length + 1}`,
    account_name: data.account_name,
    account_type: data.account_type || 'BANK',
    bank_name: data.bank_name || null,
    account_number: data.account_number || null,
    ifsc_code: data.ifsc_code || null,
    branch_name: data.branch_name || null,
    opening_balance: round2(data.opening_balance || 0),
    current_balance: round2(data.opening_balance || 0),
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };
  inMemCashBankAccounts.push(newAcc);
  return newAcc;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2: CUSTOMER PAYMENTS & RECEIPTS
// ─────────────────────────────────────────────────────────────────────────────

const getCustomerPayments = async (filters = {}) => {
  let list = [...inMemCustomerPayments];
  if (filters.customer_id) list = list.filter(p => p.customer_id === parseInt(filters.customer_id));
  if (filters.status) list = list.filter(p => p.status === filters.status);
  if (filters.payment_method) list = list.filter(p => p.payment_method === filters.payment_method);
  return list.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
};

const getCustomerPaymentById = async (id) => {
  const pId = parseInt(id);
  const payment = inMemCustomerPayments.find(p => p.id === pId);
  if (!payment) return null;
  const allocations = inMemCustomerAllocations.filter(a => a.payment_id === pId);
  const receipt = inMemPaymentReceipts.find(r => r.payment_id === pId);
  const reversals = inMemReversals.filter(r => r.payment_type === 'CUSTOMER' && r.payment_id === pId);
  return { ...payment, allocations, receipt, reversals };
};

const getCustomerInvoicesForPayment = async (customerId) => {
  const cId = parseInt(customerId);
  const invoices = await invoicingModel.getSalesInvoices({ customer_id: cId });
  // Filter only eligible unpaid or partially paid invoices
  return invoices.map(inv => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    invoice_date: inv.invoice_date,
    due_date: inv.due_date,
    total_invoice_amount: round2(inv.total_invoice_amount),
    amount_paid: round2(inv.amount_paid),
    balance_due: round2(inv.balance_due),
    status: inv.status
  }));
};

/**
 * Record Customer Payment Receipt with multi-invoice allocation & advances support
 */
const recordCustomerPayment = async (payload, userId) => {
  const {
    customer_id,
    customer_name,
    payment_date = formatDate(),
    amount,
    payment_method,
    cash_bank_account_id = 1,
    reference_number,
    cheque_number,
    cheque_date,
    bank_name,
    notes,
    is_advance = false,
    allocations = []
  } = payload;

  const totalAmount = round2(amount);
  if (totalAmount <= 0) {
    const err = new Error('Payment amount must be greater than zero.');
    err.status = 400;
    throw err;
  }

  // Prevent duplicate payment reference within the bank account scope
  if (reference_number) {
    const dupRef = inMemCustomerPayments.find(p =>
      p.status !== 'REVERSED' &&
      p.reference_number &&
      p.reference_number.trim().toLowerCase() === reference_number.trim().toLowerCase() &&
      p.cash_bank_account_id === parseInt(cash_bank_account_id)
    );
    if (dupRef) {
      const err = new Error(`Payment reference ${reference_number} already exists on this account.`);
      err.code = 'DUPLICATE_REFERENCE';
      err.status = 409;
      throw err;
    }
  }

  // Validate allocations
  let totalAllocated = 0;
  for (const alloc of allocations) {
    const allocAmt = round2(alloc.allocated_amount);
    if (allocAmt <= 0) {
      const err = new Error('Allocated amount must be positive.');
      err.status = 400;
      throw err;
    }
    totalAllocated += allocAmt;

    // Check invoice remaining balance
    const inv = await invoicingModel.getSalesInvoiceById(alloc.invoice_id);
    if (!inv) {
      const err = new Error(`Invoice ID ${alloc.invoice_id} not found.`);
      err.status = 404;
      throw err;
    }
    if (allocAmt > round2(inv.balance_due)) {
      const err = new Error(`Allocated amount (₹${allocAmt}) exceeds remaining balance of invoice ${inv.invoice_number} (₹${inv.balance_due}).`);
      err.code = 'OVER_ALLOCATION';
      err.status = 400;
      throw err;
    }
  }

  totalAllocated = round2(totalAllocated);
  if (totalAllocated > totalAmount) {
    const err = new Error(`Total allocated amount (₹${totalAllocated}) cannot exceed payment amount (₹${totalAmount}).`);
    err.code = 'OVER_ALLOCATION';
    err.status = 400;
    throw err;
  }

  const unallocatedAmount = round2(totalAmount - totalAllocated);
  const rcpNumber = `RCP-2026-00${seqCounters.receipt++}`;
  const pId = inMemCustomerPayments.length ? Math.max(...inMemCustomerPayments.map(p => p.id)) + 1 : 1;

  const paymentStatus = unallocatedAmount === 0 && totalAllocated > 0
    ? 'ALLOCATED'
    : totalAllocated > 0
      ? 'PARTIALLY_ALLOCATED'
      : 'RECEIVED';

  const newPayment = {
    id: pId,
    receipt_number: rcpNumber,
    customer_id: parseInt(customer_id),
    customer_name: customer_name || 'Customer',
    payment_date: formatDate(payment_date),
    amount: totalAmount,
    payment_method,
    cash_bank_account_id: parseInt(cash_bank_account_id),
    reference_number: reference_number || null,
    cheque_number: cheque_number || null,
    cheque_date: cheque_date ? formatDate(cheque_date) : null,
    bank_name: bank_name || null,
    notes: notes || '',
    status: paymentStatus,
    allocated_amount: totalAllocated,
    unallocated_amount: unallocatedAmount, // Advance or credit available for future invoices
    is_advance: Boolean(is_advance || unallocatedAmount > 0),
    created_by: userId,
    created_at: new Date(),
    updated_at: new Date()
  };

  inMemCustomerPayments.push(newPayment);

  // Apply allocations to invoices
  for (const alloc of allocations) {
    const allocAmt = round2(alloc.allocated_amount);
    const allocId = inMemCustomerAllocations.length + 1;
    inMemCustomerAllocations.push({
      id: allocId,
      payment_id: pId,
      invoice_id: parseInt(alloc.invoice_id),
      invoice_number: alloc.invoice_number || `INV-${alloc.invoice_id}`,
      allocated_amount: allocAmt,
      allocation_date: formatDate(payment_date),
      notes: alloc.notes || 'Payment allocation',
      created_by: userId,
      created_at: new Date()
    });

    // Update Phase 10 Invoice Balance & Payment Status
    const targetInvoice = await invoicingModel.getSalesInvoiceById(alloc.invoice_id);
    if (targetInvoice) {
      targetInvoice.amount_paid = round2(targetInvoice.amount_paid + allocAmt);
      targetInvoice.balance_due = round2(Math.max(0, targetInvoice.total_invoice_amount - targetInvoice.amount_paid));
      if (targetInvoice.balance_due <= 0) {
        targetInvoice.status = 'PAID';
      } else {
        targetInvoice.status = 'PARTIALLY_PAID';
      }
      targetInvoice.updated_at = new Date();
    }
  }

  // Update bank account balance
  const bankAcc = inMemCashBankAccounts.find(a => a.id === parseInt(cash_bank_account_id));
  if (bankAcc) {
    bankAcc.current_balance = round2(bankAcc.current_balance + totalAmount);
    bankAcc.updated_at = new Date();
  }

  // Create printable payment receipt particulars
  const receiptDoc = {
    id: inMemPaymentReceipts.length + 1,
    receipt_number: rcpNumber,
    receipt_type: 'CUSTOMER_RECEIPT',
    payment_id: pId,
    customer_id: parseInt(customer_id),
    customer_name: customer_name || 'Customer',
    receipt_date: formatDate(payment_date),
    amount: totalAmount,
    payment_method,
    reference_number: reference_number || null,
    total_allocated_invoices: allocations.length,
    received_by: 'M. Sridhar (Senior Accountant)',
    created_at: new Date()
  };
  inMemPaymentReceipts.push(receiptDoc);

  // Status History
  inMemStatusHistory.push({
    id: inMemStatusHistory.length + 1,
    payment_type: 'CUSTOMER',
    payment_id: pId,
    from_status: null,
    to_status: paymentStatus,
    changed_by: userId,
    reason: `Receipt created: allocated ₹${totalAllocated}, advance ₹${unallocatedAmount}`,
    created_at: new Date()
  });

  return getCustomerPaymentById(pId);
};

/**
 * Reverse Customer Payment (e.g. Bounced Cheque or Payment Failure)
 */
const reverseCustomerPayment = async (paymentId, payload, userId) => {
  const pId = parseInt(paymentId);
  const payment = inMemCustomerPayments.find(p => p.id === pId);
  if (!payment) {
    const err = new Error('Customer payment record not found.');
    err.status = 404;
    throw err;
  }

  if (payment.status === 'REVERSED') {
    const err = new Error('This payment has already been reversed.');
    err.code = 'ALREADY_REVERSED';
    err.status = 400;
    throw err;
  }

  const {
    reversal_reason = 'BOUNCED_CHEQUE',
    notes = 'Bounced cheque / transaction reversal requested'
  } = payload;

  const revNumber = `REV-2026-00${seqCounters.reversal++}`;

  // 1. Rollback invoice balances
  const allocations = inMemCustomerAllocations.filter(a => a.payment_id === pId);
  for (const alloc of allocations) {
    const targetInvoice = await invoicingModel.getSalesInvoiceById(alloc.invoice_id);
    if (targetInvoice) {
      targetInvoice.amount_paid = round2(Math.max(0, targetInvoice.amount_paid - alloc.allocated_amount));
      targetInvoice.balance_due = round2(targetInvoice.total_invoice_amount - targetInvoice.amount_paid);
      targetInvoice.status = targetInvoice.amount_paid === 0 ? 'ISSUED' : 'PARTIALLY_PAID';
      targetInvoice.updated_at = new Date();
    }
  }

  // 2. Adjust bank balance
  const bankAcc = inMemCashBankAccounts.find(a => a.id === payment.cash_bank_account_id);
  if (bankAcc) {
    bankAcc.current_balance = round2(bankAcc.current_balance - payment.amount);
    bankAcc.updated_at = new Date();
  }

  // 3. Mark payment as REVERSED
  const oldStatus = payment.status;
  payment.status = 'REVERSED';
  payment.unallocated_amount = 0.00;
  payment.allocated_amount = 0.00;
  payment.updated_at = new Date();

  // 4. Create Reversal Audit Record
  const reversalRecord = {
    id: inMemReversals.length + 1,
    reversal_number: revNumber,
    payment_type: 'CUSTOMER',
    payment_id: pId,
    reversal_date: formatDate(),
    reversal_reason,
    reversal_amount: payment.amount,
    reversed_by: userId,
    notes,
    created_at: new Date()
  };
  inMemReversals.push(reversalRecord);

  inMemStatusHistory.push({
    id: inMemStatusHistory.length + 1,
    payment_type: 'CUSTOMER',
    payment_id: pId,
    from_status: oldStatus,
    to_status: 'REVERSED',
    changed_by: userId,
    reason: `Payment reversed: ${reversal_reason} - ${notes}`,
    created_at: new Date()
  });

  return {
    success: true,
    message: `Payment ${payment.receipt_number} successfully reversed (${revNumber})`,
    reversal: reversalRecord,
    payment
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3: SUPPLIER PAYMENTS & VOUCHERS
// ─────────────────────────────────────────────────────────────────────────────

const getSupplierPayments = async (filters = {}) => {
  let list = [...inMemSupplierPayments];
  if (filters.supplier_id) list = list.filter(p => p.supplier_id === parseInt(filters.supplier_id));
  if (filters.status) list = list.filter(p => p.status === filters.status);
  if (filters.payment_method) list = list.filter(p => p.payment_method === filters.payment_method);
  return list.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
};

const getSupplierPaymentById = async (id) => {
  const pId = parseInt(id);
  const payment = inMemSupplierPayments.find(p => p.id === pId);
  if (!payment) return null;
  const allocations = inMemSupplierAllocations.filter(a => a.payment_id === pId);
  const voucher = inMemPaymentVouchers.find(v => v.payment_id === pId);
  const reversals = inMemReversals.filter(r => r.payment_type === 'SUPPLIER' && r.payment_id === pId);
  return { ...payment, allocations, voucher, reversals };
};

const getSupplierInvoicesForPayment = async (supplierId) => {
  const sId = parseInt(supplierId);
  const allInvoices = await purchaseModel.getInvoices();
  const allMatching = await purchaseModel.getMatches();

  return allInvoices
    .filter(inv => inv.supplier_id === sId)
    .map(inv => {
      const match = allMatching.find(m => m.invoice_id === inv.id);
      const remaining = round2(inv.grand_total - (inv.amount_paid || 0));
      return {
        id: inv.id,
        invoice_number: inv.invoice_number,
        supplier_invoice_number: inv.supplier_invoice_number,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        grand_total: round2(inv.grand_total),
        amount_paid: round2(inv.amount_paid || 0),
        balance_due: remaining,
        payment_status: inv.payment_status || 'UNPAID',
        match_status: match ? match.match_status : 'MATCHED',
        has_discrepancy: match ? (match.match_status === 'DISCREPANCY' || match.match_status === 'PENDING_REVIEW') : false
      };
    });
};

/**
 * Record Supplier Payment Voucher with 3WM Discrepancy Prevention & Approval Limits
 */
const recordSupplierPayment = async (payload, userRole, userId) => {
  const {
    supplier_id,
    supplier_name,
    payment_date = formatDate(),
    due_date,
    amount,
    payment_method,
    cash_bank_account_id = 1,
    reference_number,
    cheque_number,
    cheque_date,
    bank_name,
    notes,
    is_advance = false,
    discrepancy_override_reason,
    allocations = []
  } = payload;

  const totalAmount = round2(amount);
  if (totalAmount <= 0) {
    const err = new Error('Payment amount must be greater than zero.');
    err.status = 400;
    throw err;
  }

  // Prevent duplicate payment reference on account
  if (reference_number) {
    const dupRef = inMemSupplierPayments.find(p =>
      p.status !== 'REVERSED' &&
      p.reference_number &&
      p.reference_number.trim().toLowerCase() === reference_number.trim().toLowerCase() &&
      p.cash_bank_account_id === parseInt(cash_bank_account_id)
    );
    if (dupRef) {
      const err = new Error(`Supplier payment reference ${reference_number} already exists on this account.`);
      err.code = 'DUPLICATE_REFERENCE';
      err.status = 409;
      throw err;
    }
  }

  // Check 3WM Discrepancy Gate for each allocated invoice
  const allMatching = await purchaseModel.getMatches();
  const allInvoices = await purchaseModel.getInvoices();

  let totalAllocated = 0;
  for (const alloc of allocations) {
    const allocAmt = round2(alloc.allocated_amount);
    if (allocAmt <= 0) {
      const err = new Error('Allocated amount must be positive.');
      err.status = 400;
      throw err;
    }
    totalAllocated += allocAmt;

    const inv = allInvoices.find(i => i.id === parseInt(alloc.supplier_invoice_id));
    if (!inv) {
      const err = new Error(`Supplier Invoice ID ${alloc.supplier_invoice_id} not found.`);
      err.status = 404;
      throw err;
    }

    const remaining = round2(inv.grand_total - (inv.amount_paid || 0));
    if (allocAmt > remaining) {
      const err = new Error(`Allocated amount (₹${allocAmt}) exceeds remaining balance of invoice ${inv.invoice_number} (₹${remaining}).`);
      err.code = 'OVER_ALLOCATION';
      err.status = 400;
      throw err;
    }

    // CRITICAL: 3WM Matching Discrepancy Guard
    const match = allMatching.find(m => m.invoice_id === inv.id);
    if (match && (match.match_status === 'DISCREPANCY' || match.match_status === 'PENDING_REVIEW')) {
      const isAuthorizedApprover = ['ADMIN', 'OWNER'].includes(userRole);
      if (!isAuthorizedApprover || !discrepancy_override_reason) {
        const err = new Error(
          `Cannot pay invoice ${inv.invoice_number}: Marked as ${match.match_status} by Phase 5 Three-Way Matching. ` +
          `Payment is blocked unless an authorized user (ADMIN/OWNER) provides an explicit override reason.`
        );
        err.code = 'THREE_WAY_MATCH_DISCREPANCY';
        err.status = 400;
        throw err;
      }
    }
  }

  totalAllocated = round2(totalAllocated);
  if (totalAllocated > totalAmount) {
    const err = new Error(`Total allocated amount (₹${totalAllocated}) cannot exceed payment amount (₹${totalAmount}).`);
    err.code = 'OVER_ALLOCATION';
    err.status = 400;
    throw err;
  }

  const unallocatedAmount = round2(totalAmount - totalAllocated);

  // Approval Limits: If amount > ₹50,000 and created by ACCOUNTANT -> requires approval
  const requiresApproval = totalAmount > APPROVAL_THRESHOLD && !['ADMIN', 'OWNER'].includes(userRole);
  const status = requiresApproval ? 'PENDING_APPROVAL' : 'PAID';

  const pvNumber = `PV-2026-00${seqCounters.voucher++}`;
  const pId = inMemSupplierPayments.length ? Math.max(...inMemSupplierPayments.map(p => p.id)) + 1 : 1;

  const newPayment = {
    id: pId,
    voucher_number: pvNumber,
    supplier_id: parseInt(supplier_id),
    supplier_name: supplier_name || 'Supplier',
    payment_date: formatDate(payment_date),
    due_date: due_date ? formatDate(due_date) : null,
    amount: totalAmount,
    payment_method,
    cash_bank_account_id: parseInt(cash_bank_account_id),
    reference_number: reference_number || null,
    cheque_number: cheque_number || null,
    cheque_date: cheque_date ? formatDate(cheque_date) : null,
    bank_name: bank_name || null,
    notes: notes || '',
    status,
    allocated_amount: totalAllocated,
    unallocated_amount: unallocatedAmount,
    is_advance: Boolean(is_advance || unallocatedAmount > 0),
    requires_approval: requiresApproval,
    approved_by: requiresApproval ? null : userId,
    approved_at: requiresApproval ? null : new Date(),
    discrepancy_override_reason: discrepancy_override_reason || null,
    discrepancy_approved_by: discrepancy_override_reason ? userId : null,
    created_by: userId,
    created_at: new Date(),
    updated_at: new Date()
  };

  inMemSupplierPayments.push(newPayment);

  // Apply allocations if payment is auto-approved/paid
  if (!requiresApproval) {
    for (const alloc of allocations) {
      const allocAmt = round2(alloc.allocated_amount);
      const allocId = inMemSupplierAllocations.length + 1;
      inMemSupplierAllocations.push({
        id: allocId,
        payment_id: pId,
        supplier_invoice_id: parseInt(alloc.supplier_invoice_id),
        invoice_number: alloc.invoice_number || `INV-${alloc.supplier_invoice_id}`,
        allocated_amount: allocAmt,
        allocation_date: formatDate(payment_date),
        notes: alloc.notes || 'Supplier settlement',
        created_by: userId,
        created_at: new Date()
      });

      // Update Phase 5 supplier invoice paid amount
      const targetInv = allInvoices.find(i => i.id === parseInt(alloc.supplier_invoice_id));
      if (targetInv) {
        targetInv.amount_paid = round2((targetInv.amount_paid || 0) + allocAmt);
        if (targetInv.amount_paid >= targetInv.grand_total) {
          targetInv.payment_status = 'PAID';
        } else {
          targetInv.payment_status = 'PARTIALLY_PAID';
        }
        targetInv.updated_at = new Date();
      }
    }

    // Deduct from bank balance
    const bankAcc = inMemCashBankAccounts.find(a => a.id === parseInt(cash_bank_account_id));
    if (bankAcc) {
      bankAcc.current_balance = round2(bankAcc.current_balance - totalAmount);
      bankAcc.updated_at = new Date();
    }
  }

  // Create printable voucher record
  const voucherDoc = {
    id: inMemPaymentVouchers.length + 1,
    voucher_number: pvNumber,
    voucher_type: 'SUPPLIER_PAYMENT',
    payment_id: pId,
    supplier_id: parseInt(supplier_id),
    supplier_name: supplier_name || 'Supplier',
    voucher_date: formatDate(payment_date),
    amount: totalAmount,
    payment_method,
    reference_number: reference_number || null,
    total_allocated_invoices: allocations.length,
    authorized_by: requiresApproval ? 'Pending Approval' : 'A. Sundararajan (Finance Director / Admin)',
    created_at: new Date()
  };
  inMemPaymentVouchers.push(voucherDoc);

  inMemStatusHistory.push({
    id: inMemStatusHistory.length + 1,
    payment_type: 'SUPPLIER',
    payment_id: pId,
    from_status: null,
    to_status: status,
    changed_by: userId,
    reason: requiresApproval
      ? `Payment of ₹${totalAmount} exceeds threshold ₹${APPROVAL_THRESHOLD}. Pending approval.`
      : `Supplier payment voucher ${pvNumber} posted.`,
    created_at: new Date()
  });

  return getSupplierPaymentById(pId);
};

const approveSupplierPayment = async (paymentId, notes, userId) => {
  const pId = parseInt(paymentId);
  const payment = inMemSupplierPayments.find(p => p.id === pId);
  if (!payment) throw new Error('Supplier payment record not found.');

  if (payment.status !== 'PENDING_APPROVAL') {
    throw new Error(`Payment is in ${payment.status} status and cannot be approved.`);
  }

  payment.status = 'PAID';
  payment.approved_by = userId;
  payment.approved_at = new Date();
  payment.updated_at = new Date();

  // Deduct from bank
  const bankAcc = inMemCashBankAccounts.find(a => a.id === payment.cash_bank_account_id);
  if (bankAcc) {
    bankAcc.current_balance = round2(bankAcc.current_balance - payment.amount);
    bankAcc.updated_at = new Date();
  }

  // Update voucher doc authorized signature
  const voucherDoc = inMemPaymentVouchers.find(v => v.payment_id === pId);
  if (voucherDoc) {
    voucherDoc.authorized_by = 'Authorized Approver (Admin / Owner)';
  }

  inMemStatusHistory.push({
    id: inMemStatusHistory.length + 1,
    payment_type: 'SUPPLIER',
    payment_id: pId,
    from_status: 'PENDING_APPROVAL',
    to_status: 'PAID',
    changed_by: userId,
    reason: notes || 'Payment approved by management',
    created_at: new Date()
  });

  return getSupplierPaymentById(pId);
};

const reverseSupplierPayment = async (paymentId, payload, userId) => {
  const pId = parseInt(paymentId);
  const payment = inMemSupplierPayments.find(p => p.id === pId);
  if (!payment) throw new Error('Supplier payment record not found.');

  if (payment.status === 'REVERSED') {
    const err = new Error('This supplier payment has already been reversed.');
    err.code = 'ALREADY_REVERSED';
    err.status = 400;
    throw err;
  }

  const {
    reversal_reason = 'FAILED_TRANSFER',
    notes = 'Supplier payment reversed'
  } = payload;

  const revNumber = `REV-2026-00${seqCounters.reversal++}`;

  // Rollback supplier invoice amounts
  const allocations = inMemSupplierAllocations.filter(a => a.payment_id === pId);
  const allInvoices = await purchaseModel.getInvoices();
  for (const alloc of allocations) {
    const targetInv = allInvoices.find(i => i.id === alloc.supplier_invoice_id);
    if (targetInv) {
      targetInv.amount_paid = round2(Math.max(0, (targetInv.amount_paid || 0) - alloc.allocated_amount));
      targetInv.payment_status = targetInv.amount_paid === 0 ? 'UNPAID' : 'PARTIALLY_PAID';
      targetInv.updated_at = new Date();
    }
  }

  // Credit back bank account
  const bankAcc = inMemCashBankAccounts.find(a => a.id === payment.cash_bank_account_id);
  if (bankAcc) {
    bankAcc.current_balance = round2(bankAcc.current_balance + payment.amount);
    bankAcc.updated_at = new Date();
  }

  payment.status = 'REVERSED';
  payment.allocated_amount = 0.00;
  payment.unallocated_amount = 0.00;
  payment.updated_at = new Date();

  const revRecord = {
    id: inMemReversals.length + 1,
    reversal_number: revNumber,
    payment_type: 'SUPPLIER',
    payment_id: pId,
    reversal_date: formatDate(),
    reversal_reason,
    reversal_amount: payment.amount,
    reversed_by: userId,
    notes,
    created_at: new Date()
  };
  inMemReversals.push(revRecord);

  return { success: true, message: `Supplier payment reversed (${revNumber})`, reversal: revRecord, payment };
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4: BANK STATEMENT IMPORT & RECONCILIATION
// ─────────────────────────────────────────────────────────────────────────────

const getBankStatementLines = async (accountId, statusFilter = '') => {
  let list = inMemStatementLines.filter(l => l.account_id === parseInt(accountId));
  if (statusFilter) list = list.filter(l => l.reconciliation_status === statusFilter);
  return list.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
};

const importBankStatementCsv = async ({ account_id, csv_content, file_name }, userId) => {
  const accId = parseInt(account_id);
  const account = inMemCashBankAccounts.find(a => a.id === accId);
  if (!account) throw new Error('Bank account not found.');

  // Prevent duplicate file import
  const dupImport = inMemStatementImports.find(imp =>
    imp.account_id === accId && imp.file_name.toLowerCase() === file_name.toLowerCase()
  );
  if (dupImport) {
    const err = new Error(`Statement file ${file_name} has already been imported for this account.`);
    err.code = 'DUPLICATE_IMPORT';
    err.status = 409;
    throw err;
  }

  const lines = (csv_content || '').trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV statement file must contain a header and at least one transaction row.');
  }

  const importId = inMemStatementImports.length + 1;
  const importedLines = [];

  // Expected Header: Date,Description,Reference,Type,Amount,Balance
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row) continue;
    const parts = row.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    if (parts.length < 5) continue;

    const [txDate, desc, ref, type, amt, bal] = parts;
    const lineAmt = round2(amt);
    const lineBal = bal ? round2(bal) : account.current_balance;

    const newLine = {
      id: inMemStatementLines.length + 1,
      import_id: importId,
      account_id: accId,
      transaction_date: formatDate(txDate),
      value_date: formatDate(txDate),
      description: desc || 'Bank Transaction',
      reference_number: ref || '',
      transaction_type: (type || 'CREDIT').toUpperCase() === 'DEBIT' ? 'DEBIT' : 'CREDIT',
      amount: lineAmt,
      balance_after: lineBal,
      reconciliation_status: 'UNMATCHED',
      created_at: new Date()
    };

    inMemStatementLines.push(newLine);
    importedLines.push(newLine);
  }

  const importHeader = {
    id: importId,
    account_id: accId,
    file_name,
    import_date: new Date(),
    total_rows: importedLines.length,
    opening_balance: account.current_balance,
    closing_balance: importedLines.length ? importedLines[importedLines.length - 1].balance_after : account.current_balance,
    imported_by: userId,
    created_at: new Date()
  };

  inMemStatementImports.push(importHeader);

  return {
    success: true,
    message: `Successfully imported ${importedLines.length} bank statement transactions.`,
    import: importHeader,
    lines: importedLines
  };
};

const reconcileStatementLine = async (payload, userId) => {
  const {
    statement_line_id,
    payment_type, // CUSTOMER or SUPPLIER
    payment_id,
    matched_amount,
    notes
  } = payload;

  const lineId = parseInt(statement_line_id);
  const line = inMemStatementLines.find(l => l.id === lineId);
  if (!line) throw new Error('Bank statement line not found.');

  const matchAmt = round2(matched_amount || line.amount);
  const isExact = matchAmt >= line.amount;

  const reconId = inMemReconciliations.length + 1;
  const newRecon = {
    id: reconId,
    statement_line_id: lineId,
    payment_type,
    payment_id: parseInt(payment_id),
    matched_amount: matchAmt,
    reconciled_by: userId,
    reconciled_at: new Date(),
    notes: notes || 'Manual reconciliation confirmed',
    status: isExact ? 'MATCHED' : 'PARTIALLY_MATCHED'
  };

  inMemReconciliations.push(newRecon);
  line.reconciliation_status = isExact ? 'MATCHED' : 'PARTIALLY_MATCHED';

  return { success: true, reconciliation: newRecon, statement_line: line };
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5: PAYMENT DASHBOARD & REAL-TIME KPIS
// ─────────────────────────────────────────────────────────────────────────────

const getPaymentDashboardStats = async () => {
  const validCustomerPayments = inMemCustomerPayments.filter(p => p.status !== 'REVERSED');
  const validSupplierPayments = inMemSupplierPayments.filter(p => p.status === 'PAID');

  const totalCustomerReceived = round2(validCustomerPayments.reduce((s, p) => s + p.amount, 0));
  const totalSupplierPaid = round2(validSupplierPayments.reduce((s, p) => s + p.amount, 0));

  // Customer Invoices Outstanding
  const allSalesInvoices = await invoicingModel.getSalesInvoices();
  const customerOutstanding = round2(allSalesInvoices.reduce((s, inv) => s + (inv.balance_due || 0), 0));

  const todayStr = formatDate();
  const overdueCustomerInvoices = allSalesInvoices.filter(inv =>
    inv.balance_due > 0 && inv.due_date && inv.due_date < todayStr
  );
  const overdueCustomerAmount = round2(overdueCustomerInvoices.reduce((s, inv) => s + inv.balance_due, 0));

  // Supplier Invoices Outstanding
  const allSupplierInvoices = await purchaseModel.getInvoices();
  const supplierOutstanding = round2(allSupplierInvoices.reduce((s, inv) =>
    s + Math.max(0, inv.grand_total - (inv.amount_paid || 0)), 0
  ));

  const overdueSupplierInvoices = allSupplierInvoices.filter(inv => {
    const bal = inv.grand_total - (inv.amount_paid || 0);
    return bal > 0 && inv.due_date && inv.due_date < todayStr;
  });
  const overdueSupplierAmount = round2(overdueSupplierInvoices.reduce((s, inv) =>
    s + Math.max(0, inv.grand_total - (inv.amount_paid || 0)), 0
  ));

  // Today's flows
  const todayReceipts = round2(validCustomerPayments.filter(p => p.payment_date === todayStr).reduce((s, p) => s + p.amount, 0));
  const todayPayments = round2(validSupplierPayments.filter(p => p.payment_date === todayStr).reduce((s, p) => s + p.amount, 0));

  // Payment method summary
  const methodMap = {};
  validCustomerPayments.forEach(p => {
    methodMap[p.payment_method] = (methodMap[p.payment_method] || 0) + p.amount;
  });

  const recentTransactions = [
    ...validCustomerPayments.map(p => ({
      id: `CUST-${p.id}`,
      date: p.payment_date,
      type: 'CUSTOMER_RECEIPT',
      party: p.customer_name,
      amount: p.amount,
      method: p.payment_method,
      reference: p.receipt_number,
      status: p.status
    })),
    ...validSupplierPayments.map(p => ({
      id: `SUPP-${p.id}`,
      date: p.payment_date,
      type: 'SUPPLIER_PAYMENT',
      party: p.supplier_name,
      amount: p.amount,
      method: p.payment_method,
      reference: p.voucher_number,
      status: p.status
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  return {
    kpis: {
      total_customer_received: totalCustomerReceived,
      total_supplier_paid: totalSupplierPaid,
      customer_outstanding: customerOutstanding,
      supplier_outstanding: supplierOutstanding,
      overdue_customer_count: overdueCustomerInvoices.length,
      overdue_customer_amount: overdueCustomerAmount,
      overdue_supplier_count: overdueSupplierInvoices.length,
      overdue_supplier_amount: overdueSupplierAmount,
      today_receipts: todayReceipts,
      today_payments: todayPayments,
      net_cash_flow: round2(totalCustomerReceived - totalSupplierPaid)
    },
    payment_methods_summary: methodMap,
    recent_transactions: recentTransactions,
    accounts_overview: inMemCashBankAccounts.map(a => ({
      id: a.id,
      name: a.account_name,
      type: a.account_type,
      current_balance: a.current_balance
    }))
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 6: AGING & OUTSTANDING AUDIT REPORTS
// ─────────────────────────────────────────────────────────────────────────────

const calculateDaysDiff = (targetDate) => {
  const diffTime = new Date().setHours(0,0,0,0) - new Date(targetDate).setHours(0,0,0,0);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const getCustomerAgingReport = async () => {
  const invoices = await invoicingModel.getSalesInvoices();
  const activeInvoices = invoices.filter(inv => inv.balance_due > 0);

  const customerMap = {};
  activeInvoices.forEach(inv => {
    const daysOverdue = calculateDaysDiff(inv.due_date);
    const balance = round2(inv.balance_due);

    if (!customerMap[inv.customer_id]) {
      customerMap[inv.customer_id] = {
        customer_id: inv.customer_id,
        customer_name: inv.customer_name,
        total_outstanding: 0,
        not_due: 0,
        bucket_0_30: 0,
        bucket_31_60: 0,
        bucket_61_90: 0,
        bucket_90_plus: 0
      };
    }

    const c = customerMap[inv.customer_id];
    c.total_outstanding = round2(c.total_outstanding + balance);

    if (daysOverdue <= 0) {
      c.not_due = round2(c.not_due + balance);
    } else if (daysOverdue <= 30) {
      c.bucket_0_30 = round2(c.bucket_0_30 + balance);
    } else if (daysOverdue <= 60) {
      c.bucket_31_60 = round2(c.bucket_31_60 + balance);
    } else if (daysOverdue <= 90) {
      c.bucket_61_90 = round2(c.bucket_61_90 + balance);
    } else {
      c.bucket_90_plus = round2(c.bucket_90_plus + balance);
    }
  });

  return Object.values(customerMap);
};

const getSupplierAgingReport = async () => {
  const invoices = await purchaseModel.getInvoices();
  const activeInvoices = invoices.filter(inv => (inv.grand_total - (inv.amount_paid || 0)) > 0);

  const supplierMap = {};
  activeInvoices.forEach(inv => {
    const daysOverdue = calculateDaysDiff(inv.due_date);
    const balance = round2(inv.grand_total - (inv.amount_paid || 0));

    if (!supplierMap[inv.supplier_id]) {
      supplierMap[inv.supplier_id] = {
        supplier_id: inv.supplier_id,
        supplier_name: inv.supplier_name || 'Agro Supplier',
        total_outstanding: 0,
        not_due: 0,
        bucket_0_30: 0,
        bucket_31_60: 0,
        bucket_61_90: 0,
        bucket_90_plus: 0
      };
    }

    const s = supplierMap[inv.supplier_id];
    s.total_outstanding = round2(s.total_outstanding + balance);

    if (daysOverdue <= 0) {
      s.not_due = round2(s.not_due + balance);
    } else if (daysOverdue <= 30) {
      s.bucket_0_30 = round2(s.bucket_0_30 + balance);
    } else if (daysOverdue <= 60) {
      s.bucket_31_60 = round2(s.bucket_31_60 + balance);
    } else if (daysOverdue <= 90) {
      s.bucket_61_90 = round2(s.bucket_61_90 + balance);
    } else {
      s.bucket_90_plus = round2(s.bucket_90_plus + balance);
    }
  });

  return Object.values(supplierMap);
};

const getCustomerStatement = async (customerId, fromDate, toDate) => {
  const cId = parseInt(customerId);
  const invoices = await invoicingModel.getSalesInvoices({ customer_id: cId });
  const payments = inMemCustomerPayments.filter(p => p.customer_id === cId && p.status !== 'REVERSED');

  let entries = [];
  invoices.forEach(inv => {
    entries.push({
      date: inv.invoice_date,
      type: 'INVOICE',
      reference: inv.invoice_number,
      description: `Sales Invoice - ${inv.payment_terms || 'Net 30'}`,
      debit: round2(inv.total_invoice_amount),
      credit: 0.00
    });
  });

  payments.forEach(p => {
    entries.push({
      date: p.payment_date,
      type: 'RECEIPT',
      reference: p.receipt_number,
      description: `Customer Receipt via ${p.payment_method} (${p.reference_number || 'Cash'})`,
      debit: 0.00,
      credit: round2(p.amount)
    });
  });

  entries = entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  let runningBalance = 0;
  const ledger = entries.map(e => {
    runningBalance = round2(runningBalance + e.debit - e.credit);
    return { ...e, running_balance: runningBalance };
  });

  return {
    customer_id: cId,
    customer_name: invoices[0]?.customer_name || 'Customer',
    statement_period: { from: fromDate || '2026-01-01', to: toDate || formatDate() },
    total_invoiced: round2(entries.reduce((s, e) => s + e.debit, 0)),
    total_paid: round2(entries.reduce((s, e) => s + e.credit, 0)),
    closing_balance: runningBalance,
    ledger
  };
};

const getSupplierStatement = async (supplierId, fromDate, toDate) => {
  const sId = parseInt(supplierId);
  const allInvoices = await purchaseModel.getInvoices();
  const invoices = allInvoices.filter(i => i.supplier_id === sId);
  const payments = inMemSupplierPayments.filter(p => p.supplier_id === sId && p.status === 'PAID');

  let entries = [];
  invoices.forEach(inv => {
    entries.push({
      date: inv.invoice_date,
      type: 'SUPPLIER_INVOICE',
      reference: inv.invoice_number,
      description: `Procurement Bill (${inv.supplier_invoice_number || 'Bill'})`,
      debit: 0.00,
      credit: round2(inv.grand_total)
    });
  });

  payments.forEach(p => {
    entries.push({
      date: p.payment_date,
      type: 'PAYMENT_VOUCHER',
      reference: p.voucher_number,
      description: `Supplier Payment via ${p.payment_method} (${p.reference_number || 'Cash'})`,
      debit: round2(p.amount),
      credit: 0.00
    });
  });

  entries = entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  let runningBalance = 0;
  const ledger = entries.map(e => {
    runningBalance = round2(runningBalance + e.credit - e.debit);
    return { ...e, running_balance: runningBalance };
  });

  return {
    supplier_id: sId,
    supplier_name: invoices[0]?.supplier_name || 'Supplier Partner',
    statement_period: { from: fromDate || '2026-01-01', to: toDate || formatDate() },
    total_billed: round2(entries.reduce((s, e) => s + e.credit, 0)),
    total_paid: round2(entries.reduce((s, e) => s + e.debit, 0)),
    closing_balance: runningBalance,
    ledger
  };
};

module.exports = {
  initPaymentTables,
  getPaymentMethods,
  getCashBankAccounts,
  createCashBankAccount,
  getCustomerPayments,
  getCustomerPaymentById,
  getCustomerInvoicesForPayment,
  recordCustomerPayment,
  reverseCustomerPayment,
  getSupplierPayments,
  getSupplierPaymentById,
  getSupplierInvoicesForPayment,
  recordSupplierPayment,
  approveSupplierPayment,
  reverseSupplierPayment,
  getBankStatementLines,
  importBankStatementCsv,
  reconcileStatementLine,
  getPaymentDashboardStats,
  getCustomerAgingReport,
  getSupplierAgingReport,
  getCustomerStatement,
  getSupplierStatement
};
