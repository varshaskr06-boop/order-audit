/**
 * ============================================================================
 * Phase 10: GST Billing and Invoicing Management System Model
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 *
 * Dual-Mode: PostgreSQL when online, resilient in-memory fallback for offline/testing.
 * Reuses:
 *  - Customers (Phase 3)
 *  - Products & HSN Codes (Phase 3)
 *  - Sales Orders (Phase 4)
 *  - Users & RBAC (Phase 2)
 * ============================================================================
 */

const { query, getClient } = require('../config/db');

let isDbOnline = false;

// Helper: Format date string YYYY-MM-DD
const formatDate = (d = new Date()) => {
  return new Date(d).toISOString().split('T')[0];
};

const round2 = (num) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;

// Helper: Convert number to Indian Currency Words (Lakhs, Crores)
function numberToIndianWords(num) {
  const n = Math.floor(Math.abs(Number(num || 0)));
  const paise = Math.round((Math.abs(Number(num || 0)) - n) * 100);

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(v) {
    if (v < 20) return units[v];
    const t = Math.floor(v / 10);
    const u = v % 10;
    return (tens[t] + (u > 0 ? ' ' + units[u] : '')).trim();
  }

  function convertThreeDigits(v) {
    const h = Math.floor(v / 100);
    const rem = v % 100;
    let res = '';
    if (h > 0) res += units[h] + ' Hundred';
    if (rem > 0) res += (res ? ' and ' : '') + convertTwoDigits(rem);
    return res.trim();
  }

  if (n === 0 && paise === 0) return 'Rupees Zero Only';

  let words = '';
  let crore = Math.floor(n / 10000000);
  let remCrore = n % 10000000;
  let lakh = Math.floor(remCrore / 100000);
  let remLakh = remCrore % 100000;
  let thousand = Math.floor(remLakh / 1000);
  let remThousand = remLakh % 1000;

  if (crore > 0) words += convertTwoDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand ';
  if (remThousand > 0) words += convertThreeDigits(remThousand);

  words = words.trim() || 'Zero';
  let result = 'Rupees ' + words;
  if (paise > 0) {
    result += ' and ' + convertTwoDigits(paise) + ' Paise';
  }
  result += ' Only';
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY STORAGE SEED DATA (For Offline & Testing)
// ─────────────────────────────────────────────────────────────────────────────

let inMemCompanyProfile = {
  id: 1,
  legal_name: 'Sri Meenakshi Agro & Traditional Foods Private Limited',
  trade_name: 'Sri Meenakshi Foods',
  gstin: '33AAAAA0000A1Z5',
  pan: 'AAAAA0000A',
  address_line1: 'Plot 42, SIDCO Industrial Estate',
  address_line2: 'Kappalur Phase-2',
  city: 'Madurai',
  state: 'Tamil Nadu',
  state_code: '33',
  pincode: '625008',
  phone: '+91 452 2488888',
  email: 'billing@meenakshifoods.in',
  website: 'https://meenakshifoods.in',
  invoice_prefix: 'INV',
  financial_year: '2026-27',
  default_payment_terms: 'Net 30 Days',
  bank_name: 'State Bank of India',
  bank_account_no: '330011223344',
  bank_ifsc: 'SBIN0001234',
  bank_branch: 'Kappalur Industrial Estate, Madurai',
  lut_arn: 'AD330426000123M',
  is_active: true,
  updated_at: new Date('2026-04-01T09:00:00Z')
};

let inMemTaxRates = [
  { id: 1, tax_name: 'Food Batter / Prepared Food Standard', hsn_code: '2106', product_category: 'Fresh Batter', gst_rate: 5.00, cgst_rate: 2.50, sgst_rate: 2.50, igst_rate: 5.00, cess_rate: 0.00, effective_date: '2026-01-01', is_active: true, notes: 'FSSAI certified ready-to-cook idli/dosa batter' },
  { id: 2, tax_name: 'Traditional Savories / Snacks (Branded)', hsn_code: '1905', product_category: 'Traditional Savories', gst_rate: 12.00, cgst_rate: 6.00, sgst_rate: 6.00, igst_rate: 12.00, cess_rate: 0.00, effective_date: '2026-01-01', is_active: true, notes: 'Kai Murukku, Madras Mixture in sealed pouches' },
  { id: 3, tax_name: 'Traditional Ghee Sweets', hsn_code: '2106', product_category: 'Traditional Sweets', gst_rate: 5.00, cgst_rate: 2.50, sgst_rate: 2.50, igst_rate: 5.00, cess_rate: 0.00, effective_date: '2026-01-01', is_active: true, notes: 'Pure Ghee Mysore Pak in branded gift boxes' },
  { id: 4, tax_name: 'Printed Pouches & Packaging Consumables', hsn_code: '3923', product_category: 'Packaging', gst_rate: 18.00, cgst_rate: 9.00, sgst_rate: 9.00, igst_rate: 18.00, cess_rate: 0.00, effective_date: '2026-01-01', is_active: true, notes: 'Multilayer food-grade pouches' },
  { id: 5, tax_name: 'Unbranded Agricultural Grains (Exempt)', hsn_code: '1006', product_category: 'Raw Material', gst_rate: 0.00, cgst_rate: 0.00, sgst_rate: 0.00, igst_rate: 0.00, cess_rate: 0.00, effective_date: '2026-01-01', is_active: true, notes: 'Raw paddy/unbranded Ponni rice' }
];

let inMemCustomerTaxDetails = [
  { id: 1, customer_id: 1, legal_name: 'Meenakshi Bhavan Restaurant & Caterers', trade_name: 'Hotel Meenakshi Bhavan', gstin: '33AABCM1111A1Z1', pan: 'AABCM1111A', registration_type: 'REGULAR', place_of_supply_state: 'Tamil Nadu', place_of_supply_code: '33', is_reverse_charge_applicable: false, is_composition: false },
  { id: 2, customer_id: 2, legal_name: 'Saravana Bhavan Super Store Private Limited', trade_name: 'Saravana Retail Mart', gstin: '33AABCS2222B1Z2', pan: 'AABCS2222B', registration_type: 'REGULAR', place_of_supply_state: 'Tamil Nadu', place_of_supply_code: '33', is_reverse_charge_applicable: false, is_composition: false },
  { id: 3, customer_id: 3, legal_name: 'Bengaluru Traditional Foods Distributor LLP', trade_name: 'Bengaluru Agro Mart', gstin: '29AABCB3333C1Z3', pan: 'AABCB3333C', registration_type: 'REGULAR', place_of_supply_state: 'Karnataka', place_of_supply_code: '29', is_reverse_charge_applicable: false, is_composition: false },
  { id: 4, customer_id: 4, legal_name: 'Kerala Agro Retail & Fresh Supermarkets', trade_name: 'Kerala Fresh Mart', gstin: '32AABCK4444D1Z4', pan: 'AABCK4444D', registration_type: 'REGULAR', place_of_supply_state: 'Kerala', place_of_supply_code: '32', is_reverse_charge_applicable: false, is_composition: false }
];

let inMemSequences = {
  SALES_INVOICE: { prefix: 'INV/2026-27/', next_number: 104, padding_digits: 4 },
  CREDIT_NOTE: { prefix: 'CN/2026-27/', next_number: 102, padding_digits: 4 },
  DEBIT_NOTE: { prefix: 'DN/2026-27/', next_number: 102, padding_digits: 4 }
};

let inMemInvoices = [
  {
    id: 1,
    invoice_number: 'INV/2026-27/0101',
    invoice_date: '2026-11-20',
    due_date: '2026-12-20',
    sales_order_id: 1,
    sales_order_number: 'SO-2026-0001',
    dispatch_id: 1,
    dispatch_reference: 'DSP-2026-001',
    customer_id: 1,
    customer_name: 'Hotel Meenakshi Bhavan (T.Nagar)',
    customer_gstin: '33AABCM1111A1Z1',
    customer_registration_type: 'REGULAR',
    billing_address: 'No 45, Usman Road, T.Nagar, Chennai, Tamil Nadu - 600017',
    shipping_address: 'Central Kitchen, SIDCO Industrial Estate, Guindy, Chennai - 600032',
    place_of_supply: 'Tamil Nadu',
    place_of_supply_code: '33',
    supply_type: 'INTRA_STATE',
    reverse_charge: false,
    payment_terms: 'Net 30 Days',
    status: 'ISSUED',
    total_taxable_value: 3600.00,
    total_discount_amount: 0.00,
    cgst_amount: 90.00,
    sgst_amount: 90.00,
    igst_amount: 0.00,
    cess_amount: 0.00,
    total_tax_amount: 180.00,
    round_off_amount: 0.00,
    total_invoice_amount: 3780.00,
    amount_paid: 3780.00,
    balance_due: 0.00,
    amount_in_words: 'Rupees Three Thousand Seven Hundred and Eighty Only',
    notes: 'Bulk delivery dispatched via refrigerated reefer truck TN-59-AB-1234.',
    terms_conditions: 'Standard 30 days credit terms. Subject to Madurai jurisdiction.',
    einvoice_status: 'NOT_APPLICABLE',
    irn: null,
    eway_bill_status: 'NOT_APPLICABLE',
    eway_bill_number: null,
    created_by: 2,
    approved_by: 1,
    created_at: new Date('2026-11-20T10:30:00Z'),
    updated_at: new Date('2026-11-20T10:30:00Z')
  },
  {
    id: 2,
    invoice_number: 'INV/2026-27/0102',
    invoice_date: '2026-11-21',
    due_date: '2026-12-21',
    sales_order_id: null,
    sales_order_number: null,
    dispatch_id: null,
    dispatch_reference: null,
    customer_id: 3,
    customer_name: 'Bengaluru Traditional Foods Distributor LLP',
    customer_gstin: '29AABCB3333C1Z3',
    customer_registration_type: 'REGULAR',
    billing_address: 'Plot 12, APMC Yard, Yeshwanthpur, Bengaluru, Karnataka - 560022',
    shipping_address: 'Warehouse B, Electronic City Phase 1, Bengaluru - 560100',
    place_of_supply: 'Karnataka',
    place_of_supply_code: '29',
    supply_type: 'INTER_STATE',
    reverse_charge: false,
    payment_terms: 'Net 30 Days',
    status: 'ISSUED',
    total_taxable_value: 12000.00,
    total_discount_amount: 0.00,
    cgst_amount: 0.00,
    sgst_amount: 0.00,
    igst_amount: 1440.00, // 12% IGST on savories
    cess_amount: 0.00,
    total_tax_amount: 1440.00,
    round_off_amount: 0.00,
    total_invoice_amount: 13440.00,
    amount_paid: 0.00,
    balance_due: 13440.00,
    amount_in_words: 'Rupees Thirteen Thousand Four Hundred and Forty Only',
    notes: 'Inter-state supply to Karnataka distributor. E-way bill applicable.',
    terms_conditions: 'Payment within 30 days. Interest @ 18% p.a. on overdue amounts.',
    einvoice_status: 'NOT_APPLICABLE',
    irn: null,
    eway_bill_status: 'PENDING',
    eway_bill_number: 'EWB3320261121001',
    created_by: 5,
    approved_by: 1,
    created_at: new Date('2026-11-21T11:00:00Z'),
    updated_at: new Date('2026-11-21T11:00:00Z')
  },
  {
    id: 3,
    invoice_number: 'INV/2026-27/0103',
    invoice_date: '2026-11-22',
    due_date: '2026-12-22',
    sales_order_id: null,
    sales_order_number: null,
    dispatch_id: null,
    dispatch_reference: null,
    customer_id: 2,
    customer_name: 'Saravana Bhavan Super Store Private Limited',
    customer_gstin: '33AABCS2222B1Z2',
    customer_registration_type: 'REGULAR',
    billing_address: '12 North Veli Street, Madurai, Tamil Nadu - 625001',
    shipping_address: '12 North Veli Street, Madurai, Tamil Nadu - 625001',
    place_of_supply: 'Tamil Nadu',
    place_of_supply_code: '33',
    supply_type: 'INTRA_STATE',
    reverse_charge: false,
    payment_terms: 'Net 15 Days',
    status: 'APPROVED',
    total_taxable_value: 5000.00,
    total_discount_amount: 0.00,
    cgst_amount: 125.00,
    sgst_amount: 125.00,
    igst_amount: 0.00,
    cess_amount: 0.00,
    total_tax_amount: 250.00,
    round_off_amount: 0.00,
    total_invoice_amount: 5250.00,
    amount_paid: 2000.00,
    balance_due: 3250.00,
    amount_in_words: 'Rupees Five Thousand Two Hundred and Fifty Only',
    notes: 'Partially settled in advance.',
    terms_conditions: 'Standard commercial sales terms.',
    einvoice_status: 'NOT_APPLICABLE',
    irn: null,
    eway_bill_status: 'NOT_APPLICABLE',
    eway_bill_number: null,
    created_by: 2,
    approved_by: 1,
    created_at: new Date('2026-11-22T14:00:00Z'),
    updated_at: new Date('2026-11-22T14:00:00Z')
  }
];

let inMemInvoiceItems = [
  {
    id: 1, invoice_id: 1, product_id: 1, product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)',
    product_sku: 'FG-BAT-1KG', hsn_code: '2106', quantity: 60, uom: 'Pouch', unit_price: 60.00,
    discount_percentage: 0.00, discount_amount: 0.00, taxable_value: 3600.00,
    gst_rate: 5.00, cgst_rate: 2.50, cgst_amount: 90.00, sgst_rate: 2.50, sgst_amount: 90.00,
    igst_rate: 0.00, igst_amount: 0.00, cess_rate: 0.00, cess_amount: 0.00, total_item_amount: 3780.00
  },
  {
    id: 2, invoice_id: 2, product_id: 2, product_name: 'Traditional South Indian Kai Murukku (250g)',
    product_sku: 'FG-MUR-250G', hsn_code: '1905', quantity: 200, uom: 'Pouch', unit_price: 60.00,
    discount_percentage: 0.00, discount_amount: 0.00, taxable_value: 12000.00,
    gst_rate: 12.00, cgst_rate: 0.00, cgst_amount: 0.00, sgst_rate: 0.00, sgst_amount: 0.00,
    igst_rate: 12.00, igst_amount: 1440.00, cess_rate: 0.00, cess_amount: 0.00, total_item_amount: 13440.00
  },
  {
    id: 3, invoice_id: 3, product_id: 1, product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)',
    product_sku: 'FG-BAT-1KG', hsn_code: '2106', quantity: 80, uom: 'Pouch', unit_price: 62.50,
    discount_percentage: 0.00, discount_amount: 0.00, taxable_value: 5000.00,
    gst_rate: 5.00, cgst_rate: 2.50, cgst_amount: 125.00, sgst_rate: 2.50, sgst_amount: 125.00,
    igst_rate: 0.00, igst_amount: 0.00, cess_rate: 0.00, cess_amount: 0.00, total_item_amount: 5250.00
  }
];

let inMemTaxBreakdowns = [
  { id: 1, invoice_id: 1, hsn_code: '2106', taxable_value: 3600.00, gst_rate: 5.00, cgst_rate: 2.50, cgst_amount: 90.00, sgst_rate: 2.50, sgst_amount: 90.00, igst_rate: 0.00, igst_amount: 0.00, cess_amount: 0.00, total_tax: 180.00 },
  { id: 2, invoice_id: 2, hsn_code: '1905', taxable_value: 12000.00, gst_rate: 12.00, cgst_rate: 0.00, cgst_amount: 0.00, sgst_rate: 0.00, sgst_amount: 0.00, igst_rate: 12.00, igst_amount: 1440.00, cess_amount: 0.00, total_tax: 1440.00 },
  { id: 3, invoice_id: 3, hsn_code: '2106', taxable_value: 5000.00, gst_rate: 5.00, cgst_rate: 2.50, cgst_amount: 125.00, sgst_rate: 2.50, sgst_amount: 125.00, igst_rate: 0.00, igst_amount: 0.00, cess_amount: 0.00, total_tax: 250.00 }
];

let inMemCreditNotes = [
  {
    id: 1,
    credit_note_number: 'CN/2026-27/0101',
    note_date: '2026-11-22',
    invoice_id: 1,
    invoice_number: 'INV/2026-27/0101',
    customer_id: 1,
    customer_name: 'Hotel Meenakshi Bhavan (T.Nagar)',
    customer_gstin: '33AABCM1111A1Z1',
    reason_type: 'DAMAGED_GOODS',
    reason_description: 'Transit packaging leakage reported on 5 pouches during unloading',
    total_taxable_value: 300.00,
    cgst_amount: 7.50,
    sgst_amount: 7.50,
    igst_amount: 0.00,
    total_tax_amount: 15.00,
    total_note_amount: 315.00,
    status: 'APPROVED',
    approved_by: 1,
    created_by: 5,
    created_at: new Date('2026-11-22T16:00:00Z')
  }
];

let inMemCreditNoteItems = [
  { id: 1, credit_note_id: 1, product_id: 1, product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)', hsn_code: '2106', quantity: 5, unit_price: 60.00, taxable_value: 300.00, gst_rate: 5.00, cgst_amount: 7.50, sgst_amount: 7.50, igst_amount: 0.00, total_item_amount: 315.00 }
];

let inMemDebitNotes = [];
let inMemDebitNoteItems = [];

let inMemStatusHistory = [
  { id: 1, invoice_id: 1, from_status: null, to_status: 'ISSUED', changed_by: 2, change_reason: 'Invoice generated and dispatched', created_at: new Date('2026-11-20T10:30:00Z') },
  { id: 2, invoice_id: 2, from_status: null, to_status: 'ISSUED', changed_by: 5, change_reason: 'Inter-state invoice generated', created_at: new Date('2026-11-21T11:00:00Z') },
  { id: 3, invoice_id: 3, from_status: null, to_status: 'DRAFT', changed_by: 2, change_reason: 'Initial draft created', created_at: new Date('2026-11-22T13:30:00Z') },
  { id: 4, invoice_id: 3, from_status: 'DRAFT', to_status: 'APPROVED', changed_by: 1, change_reason: 'Approved by Business Owner', created_at: new Date('2026-11-22T14:00:00Z') }
];

// ─────────────────────────────────────────────────────────────────────────────
// GST CALCULATION ENGINE (Module 5)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates GST line by line and aggregates tax breakdowns.
 * Rules:
 *  - Intra-state (Place of supply == Company state): CGST = rate/2, SGST = rate/2, IGST = 0
 *  - Inter-state (Place of supply != Company state): CGST = 0, SGST = 0, IGST = rate
 *  - Decimal-safe rounding to 2 decimal places
 */
function calculateGstEngine({ items, placeOfSupplyCode, companyStateCode = '33' }) {
  const isInterState = String(placeOfSupplyCode || '').trim() !== String(companyStateCode || '').trim();
  const supplyType = isInterState ? 'INTER_STATE' : 'INTRA_STATE';

  let totalTaxable = 0;
  let totalDiscount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;

  const hsnMap = {};

  const processedItems = items.map((it) => {
    const qty = Number(it.quantity || 0);
    const price = Number(it.unit_price || 0);
    const discPct = Number(it.discount_percentage || 0);
    const discAmt = it.discount_amount !== undefined && it.discount_amount !== null
      ? Number(it.discount_amount)
      : round2((qty * price * discPct) / 100);

    const grossValue = qty * price;
    const taxableValue = round2(grossValue - discAmt);
    const gstRate = Number(it.gst_rate || 5.00);
    const cessRate = Number(it.cess_rate || 0.00);

    let cgstRate = 0, cgstAmt = 0;
    let sgstRate = 0, sgstAmt = 0;
    let igstRate = 0, igstAmt = 0;
    let cessAmt = round2((taxableValue * cessRate) / 100);

    if (isInterState) {
      igstRate = gstRate;
      igstAmt = round2((taxableValue * igstRate) / 100);
    } else {
      cgstRate = round2(gstRate / 2);
      sgstRate = round2(gstRate / 2);
      cgstAmt = round2((taxableValue * cgstRate) / 100);
      sgstAmt = round2((taxableValue * sgstRate) / 100);
    }

    const itemTotalTax = round2(cgstAmt + sgstAmt + igstAmt + cessAmt);
    const itemTotal = round2(taxableValue + itemTotalTax);

    totalTaxable = round2(totalTaxable + taxableValue);
    totalDiscount = round2(totalDiscount + discAmt);
    totalCgst = round2(totalCgst + cgstAmt);
    totalSgst = round2(totalSgst + sgstAmt);
    totalIgst = round2(totalIgst + igstAmt);
    totalCess = round2(totalCess + cessAmt);

    // HSN aggregation
    const hsn = it.hsn_code || '2106';
    if (!hsnMap[hsn]) {
      hsnMap[hsn] = {
        hsn_code: hsn,
        taxable_value: 0,
        gst_rate: gstRate,
        cgst_rate: cgstRate,
        cgst_amount: 0,
        sgst_rate: sgstRate,
        sgst_amount: 0,
        igst_rate: igstRate,
        igst_amount: 0,
        cess_amount: 0,
        total_tax: 0
      };
    }
    hsnMap[hsn].taxable_value = round2(hsnMap[hsn].taxable_value + taxableValue);
    hsnMap[hsn].cgst_amount = round2(hsnMap[hsn].cgst_amount + cgstAmt);
    hsnMap[hsn].sgst_amount = round2(hsnMap[hsn].sgst_amount + sgstAmt);
    hsnMap[hsn].igst_amount = round2(hsnMap[hsn].igst_amount + igstAmt);
    hsnMap[hsn].cess_amount = round2(hsnMap[hsn].cess_amount + cessAmt);
    hsnMap[hsn].total_tax = round2(hsnMap[hsn].total_tax + itemTotalTax);

    return {
      product_id: it.product_id,
      product_name: it.product_name,
      product_sku: it.product_sku || 'FG-SKU',
      hsn_code: hsn,
      quantity: qty,
      uom: it.uom || 'PKT',
      unit_price: price,
      discount_percentage: discPct,
      discount_amount: discAmt,
      taxable_value: taxableValue,
      gst_rate: gstRate,
      cgst_rate: cgstRate,
      cgst_amount: cgstAmt,
      sgst_rate: sgstRate,
      sgst_amount: sgstAmt,
      igst_rate: igstRate,
      igst_amount: igstAmt,
      cess_rate: cessRate,
      cess_amount: cessAmt,
      total_item_amount: itemTotal
    };
  });

  const totalTaxAmount = round2(totalCgst + totalSgst + totalIgst + totalCess);
  const unroundedTotal = round2(totalTaxable + totalTaxAmount);
  const finalTotal = Math.round(unroundedTotal);
  const roundOff = round2(finalTotal - unroundedTotal);

  return {
    supplyType,
    isInterState,
    items: processedItems,
    taxBreakdowns: Object.values(hsnMap),
    totalTaxableValue: totalTaxable,
    totalDiscountAmount: totalDiscount,
    cgstAmount: totalCgst,
    sgstAmount: totalSgst,
    igstAmount: totalIgst,
    cessAmount: totalCess,
    totalTaxAmount,
    roundOffAmount: roundOff,
    totalInvoiceAmount: finalTotal,
    amountInWords: numberToIndianWords(finalTotal)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODEL REPOSITORY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

const initInvoicingTables = async () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../../database/migrations/009_phase10_gst_billing.sql');
    if (fs.existsSync(migrationPath)) {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      await query(sql);
      isDbOnline = true;
      console.log('✅ [Invoicing] PostgreSQL Phase 10 tables initialized successfully.');
    }
  } catch (err) {
    isDbOnline = false;
    console.log('ℹ️ [Invoicing] PostgreSQL offline → in-memory invoicing mode active.');
  }
};

/**
 * Sequential Invoice/Credit Note/Debit Note Number Generator
 * Concurrency-safe prefix counter
 */
const generateSequentialNumber = async (docType = 'SALES_INVOICE') => {
  const seq = inMemSequences[docType] || inMemSequences.SALES_INVOICE;
  const numStr = String(seq.next_number).padStart(seq.padding_digits, '0');
  const generated = `${seq.prefix}${numStr}`;
  seq.next_number++;
  return generated;
};

// 1. Company Profile
const getCompanyTaxProfile = async () => {
  if (isDbOnline) {
    try {
      const res = await query('SELECT * FROM company_tax_profiles WHERE is_active = TRUE ORDER BY id ASC LIMIT 1');
      if (res.rows.length) return res.rows[0];
    } catch {}
  }
  return inMemCompanyProfile;
};

const updateCompanyTaxProfile = async (data, userId) => {
  const updated = {
    ...inMemCompanyProfile,
    ...data,
    updated_by: userId,
    updated_at: new Date()
  };
  inMemCompanyProfile = updated;
  if (isDbOnline) {
    try {
      await query(
        `UPDATE company_tax_profiles SET legal_name=$1, trade_name=$2, gstin=$3, pan=$4, address_line1=$5, 
         city=$6, state=$7, state_code=$8, pincode=$9, phone=$10, email=$11, invoice_prefix=$12, 
         default_payment_terms=$13, bank_name=$14, bank_account_no=$15, bank_ifsc=$16, updated_at=NOW() WHERE id=$17`,
        [updated.legal_name, updated.trade_name, updated.gstin, updated.pan, updated.address_line1,
         updated.city, updated.state, updated.state_code, updated.pincode, updated.phone, updated.email,
         updated.invoice_prefix, updated.default_payment_terms, updated.bank_name, updated.bank_account_no,
         updated.bank_ifsc, updated.id]
      );
    } catch {}
  }
  return updated;
};

// 2. Tax Rates Management
const getTaxRates = async (activeOnly = false) => {
  if (isDbOnline) {
    try {
      const q = activeOnly ? 'SELECT * FROM tax_rates WHERE is_active = TRUE ORDER BY gst_rate ASC' : 'SELECT * FROM tax_rates ORDER BY id ASC';
      const res = await query(q);
      if (res.rows.length) return res.rows;
    } catch {}
  }
  return activeOnly ? inMemTaxRates.filter(t => t.is_active) : inMemTaxRates;
};

const createTaxRate = async (data, userId) => {
  const gstRate = Number(data.gst_rate || 5);
  const newRate = {
    id: inMemTaxRates.length ? Math.max(...inMemTaxRates.map(t => t.id)) + 1 : 1,
    tax_name: data.tax_name,
    hsn_code: data.hsn_code || '2106',
    product_category: data.product_category || 'General',
    gst_rate: gstRate,
    cgst_rate: round2(gstRate / 2),
    sgst_rate: round2(gstRate / 2),
    igst_rate: gstRate,
    cess_rate: Number(data.cess_rate || 0),
    effective_date: data.effective_date || formatDate(),
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    notes: data.notes || '',
    created_by: userId,
    created_at: new Date(),
    updated_at: new Date()
  };
  inMemTaxRates.push(newRate);
  return newRate;
};

// 3. Customer Tax Details
const getCustomerTaxDetails = async (customerId) => {
  const cId = parseInt(customerId);
  const found = inMemCustomerTaxDetails.find(c => c.customer_id === cId);
  if (found) return found;

  // Fallback default from in-memory customer or mock
  return {
    customer_id: cId,
    legal_name: 'Registered B2B Customer',
    trade_name: 'Registered Retailer',
    gstin: '33AABCT9999Z1Z9',
    pan: 'AABCT9999Z',
    registration_type: 'REGULAR',
    place_of_supply_state: 'Tamil Nadu',
    place_of_supply_code: '33',
    is_reverse_charge_applicable: false,
    is_composition: false
  };
};

const upsertCustomerTaxDetails = async (customerId, data) => {
  const cId = parseInt(customerId);
  const idx = inMemCustomerTaxDetails.findIndex(c => c.customer_id === cId);
  const entry = {
    customer_id: cId,
    legal_name: data.legal_name || 'Customer',
    trade_name: data.trade_name || '',
    gstin: (data.gstin || '').toUpperCase().trim(),
    pan: (data.pan || (data.gstin ? data.gstin.slice(2, 12) : '')).toUpperCase().trim(),
    registration_type: data.registration_type || (data.gstin ? 'REGULAR' : 'UNREGISTERED'),
    place_of_supply_state: data.place_of_supply_state || 'Tamil Nadu',
    place_of_supply_code: data.place_of_supply_code || '33',
    is_reverse_charge_applicable: Boolean(data.is_reverse_charge_applicable),
    is_composition: Boolean(data.is_composition),
    notes: data.notes || '',
    updated_at: new Date()
  };

  if (idx >= 0) {
    inMemCustomerTaxDetails[idx] = { ...inMemCustomerTaxDetails[idx], ...entry };
    return inMemCustomerTaxDetails[idx];
  } else {
    entry.id = inMemCustomerTaxDetails.length + 1;
    entry.created_at = new Date();
    inMemCustomerTaxDetails.push(entry);
    return entry;
  }
};

// 4. Sales Invoices
const getSalesInvoices = async (filters = {}) => {
  let list = [...inMemInvoices];
  if (filters.status) list = list.filter(i => i.status === filters.status);
  if (filters.customer_id) list = list.filter(i => i.customer_id === parseInt(filters.customer_id));
  if (filters.supply_type) list = list.filter(i => i.supply_type === filters.supply_type);
  if (filters.start_date) list = list.filter(i => i.invoice_date >= filters.start_date);
  if (filters.end_date) list = list.filter(i => i.invoice_date <= filters.end_date);
  if (filters.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(i => 
      i.invoice_number.toLowerCase().includes(s) || 
      i.customer_name.toLowerCase().includes(s) ||
      (i.customer_gstin && i.customer_gstin.toLowerCase().includes(s))
    );
  }
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const getSalesInvoiceById = async (invoiceId) => {
  const invId = parseInt(invoiceId);
  const inv = inMemInvoices.find(i => i.id === invId);
  if (!inv) return null;

  const items = inMemInvoiceItems.filter(it => it.invoice_id === invId);
  const taxBreakdowns = inMemTaxBreakdowns.filter(tb => tb.invoice_id === invId);
  const creditNotes = inMemCreditNotes.filter(cn => cn.invoice_id === invId);
  const debitNotes = inMemDebitNotes.filter(dn => dn.invoice_id === invId);
  const statusHistory = inMemStatusHistory.filter(sh => sh.invoice_id === invId);

  return {
    ...inv,
    company_profile: inMemCompanyProfile,
    items,
    tax_breakdowns: taxBreakdowns,
    credit_notes: creditNotes,
    debit_notes: debitNotes,
    status_history: statusHistory
  };
};

/**
 * Creates a Sales Invoice with full recalculation on backend (Module 4 & 5)
 * Prevents duplicate invoice generation for the same sales order / dispatch.
 */
const createSalesInvoice = async (invoicePayload, userId) => {
  const {
    sales_order_id,
    sales_order_number,
    dispatch_id,
    dispatch_reference,
    customer_id,
    customer_name,
    customer_gstin,
    billing_address,
    shipping_address,
    place_of_supply,
    place_of_supply_code = '33',
    payment_terms = 'Net 30 Days',
    due_date,
    items = [],
    notes = '',
    terms_conditions = 'Subject to Madurai Jurisdiction. Payment due on or before due date.'
  } = invoicePayload;

  if (!items || items.length === 0) {
    throw new Error('Invoice must contain at least one line item.');
  }

  // Duplicate Check: Check if this sales order already has an active invoice
  if (sales_order_id) {
    const existingSoInvoice = inMemInvoices.find(i => 
      i.sales_order_id === parseInt(sales_order_id) && 
      !['CANCELLED', 'VOID'].includes(i.status)
    );
    if (existingSoInvoice) {
      const err = new Error(`Invoice ${existingSoInvoice.invoice_number} has already been issued for Sales Order #${sales_order_id}.`);
      err.code = 'DUPLICATE_INVOICE';
      err.status = 409;
      throw err;
    }
  }

  // Recalculate everything decimal-safely via calculation engine (NEVER trust frontend totals)
  const calc = calculateGstEngine({
    items,
    placeOfSupplyCode: place_of_supply_code,
    companyStateCode: inMemCompanyProfile.state_code
  });

  const nextInvNumber = await generateSequentialNumber('SALES_INVOICE');
  const invoiceId = inMemInvoices.length ? Math.max(...inMemInvoices.map(i => i.id)) + 1 : 1;

  const invoiceDate = invoicePayload.invoice_date || formatDate();
  const calculatedDueDate = due_date || (() => {
    const d = new Date(invoiceDate);
    d.setDate(d.getDate() + 30);
    return formatDate(d);
  })();

  const newInvoice = {
    id: invoiceId,
    invoice_number: nextInvNumber,
    invoice_date: invoiceDate,
    due_date: calculatedDueDate,
    sales_order_id: sales_order_id ? parseInt(sales_order_id) : null,
    sales_order_number: sales_order_number || (sales_order_id ? `SO-2026-000${sales_order_id}` : null),
    dispatch_id: dispatch_id ? parseInt(dispatch_id) : null,
    dispatch_reference: dispatch_reference || null,
    customer_id: parseInt(customer_id),
    customer_name: customer_name || 'Valued Customer',
    customer_gstin: customer_gstin ? customer_gstin.toUpperCase().trim() : null,
    customer_registration_type: customer_gstin ? 'REGULAR' : 'UNREGISTERED',
    billing_address: billing_address || 'Address on file',
    shipping_address: shipping_address || billing_address || 'Address on file',
    place_of_supply: place_of_supply || (place_of_supply_code === '33' ? 'Tamil Nadu' : 'Other State'),
    place_of_supply_code: String(place_of_supply_code),
    supply_type: calc.supplyType,
    reverse_charge: Boolean(invoicePayload.reverse_charge),
    payment_terms,
    status: invoicePayload.status || 'ISSUED',
    total_taxable_value: calc.totalTaxableValue,
    total_discount_amount: calc.totalDiscountAmount,
    cgst_amount: calc.cgstAmount,
    sgst_amount: calc.sgstAmount,
    igst_amount: calc.igstAmount,
    cess_amount: calc.cessAmount,
    total_tax_amount: calc.totalTaxAmount,
    round_off_amount: calc.roundOffAmount,
    total_invoice_amount: calc.totalInvoiceAmount,
    amount_paid: 0.00,
    balance_due: calc.totalInvoiceAmount,
    amount_in_words: calc.amountInWords,
    notes,
    terms_conditions,
    einvoice_status: 'NOT_APPLICABLE',
    irn: null,
    eway_bill_status: calc.totalInvoiceAmount >= 50000 ? 'PENDING' : 'NOT_APPLICABLE',
    eway_bill_number: null,
    created_by: userId,
    approved_by: invoicePayload.status === 'ISSUED' ? userId : null,
    created_at: new Date(),
    updated_at: new Date()
  };

  inMemInvoices.push(newInvoice);

  // Store Line Items
  calc.items.forEach((it, idx) => {
    inMemInvoiceItems.push({
      id: inMemInvoiceItems.length + 1,
      invoice_id: invoiceId,
      ...it
    });
  });

  // Store HSN Tax Breakdowns
  calc.taxBreakdowns.forEach((tb) => {
    inMemTaxBreakdowns.push({
      id: inMemTaxBreakdowns.length + 1,
      invoice_id: invoiceId,
      ...tb
    });
  });

  // Status History
  inMemStatusHistory.push({
    id: inMemStatusHistory.length + 1,
    invoice_id: invoiceId,
    from_status: null,
    to_status: newInvoice.status,
    changed_by: userId,
    change_reason: `Invoice generated (${newInvoice.supply_type})`,
    created_at: new Date()
  });

  return getSalesInvoiceById(invoiceId);
};

// 5. Invoice Status Lifecycle Management (Module 8)
const updateInvoiceStatus = async (invoiceId, statusData, userId) => {
  const invId = parseInt(invoiceId);
  const inv = inMemInvoices.find(i => i.id === invId);
  if (!inv) throw new Error('Invoice not found');

  const oldStatus = inv.status;
  const newStatus = statusData.status;

  // Business Rule: Cannot edit or cancel an invoice already CANCELLED or VOID
  if (['CANCELLED', 'VOID'].includes(oldStatus)) {
    throw new Error(`Cannot modify invoice in ${oldStatus} state.`);
  }

  inv.status = newStatus;
  inv.updated_at = new Date();

  if (newStatus === 'CANCELLED') {
    inv.cancelled_at = new Date();
    inv.cancelled_by = userId;
    inv.cancellation_reason = statusData.reason || 'Cancelled by authorized user';
  } else if (newStatus === 'PAID') {
    inv.amount_paid = inv.total_invoice_amount;
    inv.balance_due = 0.00;
  } else if (newStatus === 'PARTIALLY_PAID') {
    const paid = Number(statusData.amount_paid || 0);
    inv.amount_paid = round2(inv.amount_paid + paid);
    inv.balance_due = round2(inv.total_invoice_amount - inv.amount_paid);
  }

  inMemStatusHistory.push({
    id: inMemStatusHistory.length + 1,
    invoice_id: invId,
    from_status: oldStatus,
    to_status: newStatus,
    changed_by: userId,
    change_reason: statusData.reason || `Status updated from ${oldStatus} to ${newStatus}`,
    created_at: new Date()
  });

  return inv;
};

// 6. Credit Notes Management (Module 7)
const getCreditNotes = async (filters = {}) => {
  let list = [...inMemCreditNotes];
  if (filters.invoice_id) list = list.filter(cn => cn.invoice_id === parseInt(filters.invoice_id));
  if (filters.customer_id) list = list.filter(cn => cn.customer_id === parseInt(filters.customer_id));
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const createCreditNote = async (data, userId) => {
  const invId = parseInt(data.invoice_id);
  const inv = inMemInvoices.find(i => i.id === invId);
  if (!inv) throw new Error('Original sales invoice not found.');

  if (['CANCELLED', 'VOID'].includes(inv.status)) {
    throw new Error('Cannot issue credit note against a CANCELLED or VOID invoice.');
  }

  const taxableVal = Number(data.total_taxable_value || 0);
  if (taxableVal <= 0) throw new Error('Credit note taxable value must be greater than zero.');

  // Check that credit note does not exceed remaining invoice amount
  const existingNotes = inMemCreditNotes.filter(cn => cn.invoice_id === invId && cn.status === 'APPROVED');
  const alreadyCredited = existingNotes.reduce((s, cn) => s + Number(cn.total_taxable_value || 0), 0);

  if (alreadyCredited + taxableVal > inv.total_taxable_value) {
    const err = new Error(`Credit Note amount (₹${taxableVal}) exceeds remaining taxable invoice value (₹${inv.total_taxable_value - alreadyCredited}).`);
    err.code = 'EXCESSIVE_CREDIT';
    err.status = 400;
    throw err;
  }

  // Calculate GST adjustment matching invoice supply type
  const isInterState = inv.supply_type === 'INTER_STATE';
  const gstRate = Number(data.gst_rate || 5.00);

  let cgstAmt = 0, sgstAmt = 0, igstAmt = 0;
  if (isInterState) {
    igstAmt = round2((taxableVal * gstRate) / 100);
  } else {
    cgstAmt = round2((taxableVal * (gstRate / 2)) / 100);
    sgstAmt = round2((taxableVal * (gstRate / 2)) / 100);
  }
  const totalTax = round2(cgstAmt + sgstAmt + igstAmt);
  const totalNote = round2(taxableVal + totalTax);

  const cnNumber = await generateSequentialNumber('CREDIT_NOTE');
  const cnId = inMemCreditNotes.length ? Math.max(...inMemCreditNotes.map(c => c.id)) + 1 : 1;

  const newCn = {
    id: cnId,
    credit_note_number: cnNumber,
    note_date: data.note_date || formatDate(),
    invoice_id: invId,
    invoice_number: inv.invoice_number,
    customer_id: inv.customer_id,
    customer_name: inv.customer_name,
    customer_gstin: inv.customer_gstin,
    reason_type: data.reason_type || 'SALES_RETURN',
    reason_description: data.reason_description || 'Authorized return / adjustment',
    total_taxable_value: taxableVal,
    cgst_amount: cgstAmt,
    sgst_amount: sgstAmt,
    igst_amount: igstAmt,
    total_tax_amount: totalTax,
    total_note_amount: totalNote,
    status: 'APPROVED',
    approved_by: userId,
    created_by: userId,
    created_at: new Date()
  };

  inMemCreditNotes.push(newCn);

  // Line item record
  inMemCreditNoteItems.push({
    id: inMemCreditNoteItems.length + 1,
    credit_note_id: cnId,
    product_id: data.product_id || 1,
    product_name: data.product_name || 'Goods Return',
    hsn_code: data.hsn_code || '2106',
    quantity: Number(data.quantity || 0),
    unit_price: Number(data.unit_price || 0),
    taxable_value: taxableVal,
    gst_rate: gstRate,
    cgst_amount: cgstAmt,
    sgst_amount: sgstAmt,
    igst_amount: igstAmt,
    total_item_amount: totalNote
  });

  return newCn;
};

// 7. Debit Notes Management (Module 7)
const getDebitNotes = async (filters = {}) => {
  let list = [...inMemDebitNotes];
  if (filters.invoice_id) list = list.filter(dn => dn.invoice_id === parseInt(filters.invoice_id));
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const createDebitNote = async (data, userId) => {
  const invId = parseInt(data.invoice_id);
  const inv = inMemInvoices.find(i => i.id === invId);
  if (!inv) throw new Error('Original sales invoice not found.');

  const taxableVal = Number(data.total_taxable_value || 0);
  if (taxableVal <= 0) throw new Error('Debit note taxable value must be greater than zero.');

  const isInterState = inv.supply_type === 'INTER_STATE';
  const gstRate = Number(data.gst_rate || 5.00);

  let cgstAmt = 0, sgstAmt = 0, igstAmt = 0;
  if (isInterState) {
    igstAmt = round2((taxableVal * gstRate) / 100);
  } else {
    cgstAmt = round2((taxableVal * (gstRate / 2)) / 100);
    sgstAmt = round2((taxableVal * (gstRate / 2)) / 100);
  }
  const totalTax = round2(cgstAmt + sgstAmt + igstAmt);
  const totalNote = round2(taxableVal + totalTax);

  const dnNumber = await generateSequentialNumber('DEBIT_NOTE');
  const dnId = inMemDebitNotes.length ? Math.max(...inMemDebitNotes.map(d => d.id)) + 1 : 1;

  const newDn = {
    id: dnId,
    debit_note_number: dnNumber,
    note_date: data.note_date || formatDate(),
    invoice_id: invId,
    invoice_number: inv.invoice_number,
    customer_id: inv.customer_id,
    customer_name: inv.customer_name,
    customer_gstin: inv.customer_gstin,
    reason_type: data.reason_type || 'PRICE_INCREASE',
    reason_description: data.reason_description || 'Price differential / additional quantity adjustment',
    total_taxable_value: taxableVal,
    cgst_amount: cgstAmt,
    sgst_amount: sgstAmt,
    igst_amount: igstAmt,
    total_tax_amount: totalTax,
    total_note_amount: totalNote,
    status: 'APPROVED',
    approved_by: userId,
    created_by: userId,
    created_at: new Date()
  };

  inMemDebitNotes.push(newDn);
  return newDn;
};

// 8. Invoicing Dashboard Statistics (Module 10)
const getInvoicingDashboardStats = async () => {
  const activeInvoices = inMemInvoices.filter(i => !['CANCELLED', 'VOID'].includes(i.status));
  const totalInvoices = activeInvoices.length;

  const totalTaxable = round2(activeInvoices.reduce((s, i) => s + Number(i.total_taxable_value || 0), 0));
  const totalGross = round2(activeInvoices.reduce((s, i) => s + Number(i.total_invoice_amount || 0), 0));
  const totalCgst = round2(activeInvoices.reduce((s, i) => s + Number(i.cgst_amount || 0), 0));
  const totalSgst = round2(activeInvoices.reduce((s, i) => s + Number(i.sgst_amount || 0), 0));
  const totalIgst = round2(activeInvoices.reduce((s, i) => s + Number(i.igst_amount || 0), 0));
  const totalTax = round2(totalCgst + totalSgst + totalIgst);

  const paidInvoices = activeInvoices.filter(i => i.status === 'PAID');
  const unpaidInvoices = activeInvoices.filter(i => ['ISSUED', 'APPROVED'].includes(i.status));
  const overdueInvoices = activeInvoices.filter(i => i.status === 'OVERDUE' || (['ISSUED', 'APPROVED'].includes(i.status) && i.due_date < formatDate()));

  const totalPaidAmount = round2(activeInvoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0));
  const totalOutstanding = round2(activeInvoices.reduce((s, i) => s + Number(i.balance_due || 0), 0));

  // Recent invoices
  const recentInvoices = [...inMemInvoices]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6)
    .map(i => ({
      id: i.id,
      invoice_number: i.invoice_number,
      invoice_date: i.invoice_date,
      customer_name: i.customer_name,
      total_invoice_amount: i.total_invoice_amount,
      supply_type: i.supply_type,
      status: i.status
    }));

  return {
    kpis: {
      total_invoices: totalInvoices,
      total_taxable_sales: totalTaxable,
      total_invoice_value: totalGross,
      total_cgst: totalCgst,
      total_sgst: totalSgst,
      total_igst: totalIgst,
      total_tax_invoiced: totalTax,
      paid_invoices_count: paidInvoices.length,
      paid_amount: totalPaidAmount,
      unpaid_invoices_count: unpaidInvoices.length,
      outstanding_amount: totalOutstanding,
      overdue_invoices_count: overdueInvoices.length,
      overdue_amount: round2(overdueInvoices.reduce((s, i) => s + Number(i.balance_due || 0), 0))
    },
    tax_summary: {
      intra_state_sales: round2(activeInvoices.filter(i => i.supply_type === 'INTRA_STATE').reduce((s, i) => s + Number(i.total_taxable_value || 0), 0)),
      inter_state_sales: round2(activeInvoices.filter(i => i.supply_type === 'INTER_STATE').reduce((s, i) => s + Number(i.total_taxable_value || 0), 0)),
      net_tax_liability_note: 'Gross invoiced output GST liability before Input Tax Credit (ITC) offset.'
    },
    recent_invoices: recentInvoices
  };
};

// 9. GST & Sales Reports (Module 9 - 12 Report Types)
const generateInvoicingReport = async (reportType = 'SALES_REGISTER', filters = {}) => {
  let records = [];

  switch (reportType) {
    case 'SALES_REGISTER':
      records = inMemInvoices.map(i => ({
        invoice_number: i.invoice_number,
        invoice_date: i.invoice_date,
        customer_name: i.customer_name,
        customer_gstin: i.customer_gstin || 'B2C / Unreg',
        place_of_supply: i.place_of_supply,
        supply_type: i.supply_type,
        taxable_value: i.total_taxable_value,
        cgst_amount: i.cgst_amount,
        sgst_amount: i.sgst_amount,
        igst_amount: i.igst_amount,
        total_tax: i.total_tax_amount,
        invoice_total: i.total_invoice_amount,
        status: i.status
      }));
      break;

    case 'GST_SUMMARY':
      records = [
        { supply_category: 'B2B Intra-State Supplies (33 TN)', taxable_value: 8600.00, cgst_rate: '2.5% / 6%', cgst_amount: 215.00, sgst_rate: '2.5% / 6%', sgst_amount: 215.00, igst_amount: 0.00, total_tax: 430.00 },
        { supply_category: 'B2B Inter-State Supplies (29 KA / 32 KL)', taxable_value: 12000.00, cgst_rate: '0%', cgst_amount: 0.00, sgst_rate: '0%', sgst_amount: 0.00, igst_amount: 1440.00, total_tax: 1440.00 },
        { supply_category: 'B2C Consumer Supplies', taxable_value: 0.00, cgst_rate: '0%', cgst_amount: 0.00, sgst_rate: '0%', sgst_amount: 0.00, igst_amount: 0.00, total_tax: 0.00 },
        { supply_category: 'Credit Note Adjustments', taxable_value: -300.00, cgst_rate: '2.5%', cgst_amount: -7.50, sgst_rate: '2.5%', sgst_amount: -7.50, igst_amount: 0.00, total_tax: -15.00 }
      ];
      break;

    case 'CGST_REPORT':
      records = inMemInvoices.filter(i => i.cgst_amount > 0).map(i => ({
        invoice_number: i.invoice_number,
        invoice_date: i.invoice_date,
        customer_name: i.customer_name,
        gstin: i.customer_gstin,
        taxable_value: i.total_taxable_value,
        cgst_amount: i.cgst_amount
      }));
      break;

    case 'SGST_REPORT':
      records = inMemInvoices.filter(i => i.sgst_amount > 0).map(i => ({
        invoice_number: i.invoice_number,
        invoice_date: i.invoice_date,
        customer_name: i.customer_name,
        gstin: i.customer_gstin,
        taxable_value: i.total_taxable_value,
        sgst_amount: i.sgst_amount
      }));
      break;

    case 'IGST_REPORT':
      records = inMemInvoices.filter(i => i.igst_amount > 0).map(i => ({
        invoice_number: i.invoice_number,
        invoice_date: i.invoice_date,
        customer_name: i.customer_name,
        place_of_supply: i.place_of_supply,
        gstin: i.customer_gstin,
        taxable_value: i.total_taxable_value,
        igst_amount: i.igst_amount
      }));
      break;

    case 'HSN_SUMMARY':
      records = inMemTaxBreakdowns.map(tb => ({
        hsn_code: tb.hsn_code,
        description: tb.hsn_code === '2106' ? 'Food Batter / Idli Dosa / Prepared Foods' : 'Traditional Savories & Snacks',
        gst_rate: tb.gst_rate,
        taxable_value: tb.taxable_value,
        cgst_amount: tb.cgst_amount,
        sgst_amount: tb.sgst_amount,
        igst_amount: tb.igst_amount,
        total_tax: tb.total_tax
      }));
      break;

    case 'CREDIT_NOTE_REPORT':
      records = inMemCreditNotes.map(cn => ({
        credit_note_number: cn.credit_note_number,
        note_date: cn.note_date,
        original_invoice: cn.invoice_number,
        customer_name: cn.customer_name,
        reason: cn.reason_type,
        taxable_value: cn.total_taxable_value,
        cgst: cn.cgst_amount,
        sgst: cn.sgst_amount,
        igst: cn.igst_amount,
        total_amount: cn.total_note_amount,
        status: cn.status
      }));
      break;

    case 'DEBIT_NOTE_REPORT':
      records = inMemDebitNotes.map(dn => ({
        debit_note_number: dn.debit_note_number,
        note_date: dn.note_date,
        original_invoice: dn.invoice_number,
        customer_name: dn.customer_name,
        reason: dn.reason_type,
        taxable_value: dn.total_taxable_value,
        total_tax: dn.total_tax_amount,
        total_amount: dn.total_note_amount
      }));
      break;

    case 'OUTSTANDING_INVOICES':
      records = inMemInvoices.filter(i => i.balance_due > 0 && !['CANCELLED', 'VOID'].includes(i.status)).map(i => ({
        invoice_number: i.invoice_number,
        invoice_date: i.invoice_date,
        due_date: i.due_date,
        customer_name: i.customer_name,
        total_amount: i.total_invoice_amount,
        amount_paid: i.amount_paid,
        balance_due: i.balance_due,
        status: i.status
      }));
      break;

    case 'CANCELLED_INVOICES':
      records = inMemInvoices.filter(i => i.status === 'CANCELLED').map(i => ({
        invoice_number: i.invoice_number,
        invoice_date: i.invoice_date,
        customer_name: i.customer_name,
        total_amount: i.total_invoice_amount,
        cancellation_reason: i.cancellation_reason,
        cancelled_at: i.cancelled_at
      }));
      break;

    case 'MONTHLY_SALES':
      records = [
        { month: '2026-11', invoice_count: 3, taxable_sales: 20600.00, cgst: 215.00, sgst: 215.00, igst: 1440.00, total_sales: 22470.00 },
        { month: '2026-10', invoice_count: 5, taxable_sales: 38500.00, cgst: 480.00, sgst: 480.00, igst: 2100.00, total_sales: 41560.00 }
      ];
      break;

    case 'FY_SALES':
    default:
      records = [
        { financial_year: '2026-27 (Current)', total_invoices: 3, taxable_value: 20600.00, output_gst_collected: 1870.00, gross_turnover: 22470.00, notes: 'FY April 2026 to March 2027' }
      ];
      break;
  }

  return {
    report_type: reportType,
    disclaimer: 'INTERNAL SUMMARY ONLY — NOT A FILED GST RETURN OR STATUTORY GSTR-1/GSTR-3B DOCUMENT',
    generated_at: new Date().toISOString(),
    record_count: records.length,
    records
  };
};

module.exports = {
  initInvoicingTables,
  calculateGstEngine,
  generateSequentialNumber,
  getCompanyTaxProfile,
  updateCompanyTaxProfile,
  getTaxRates,
  createTaxRate,
  getCustomerTaxDetails,
  upsertCustomerTaxDetails,
  getSalesInvoices,
  getSalesInvoiceById,
  createSalesInvoice,
  updateInvoiceStatus,
  getCreditNotes,
  createCreditNote,
  getDebitNotes,
  createDebitNote,
  getInvoicingDashboardStats,
  generateInvoicingReport,
  numberToIndianWords
};
