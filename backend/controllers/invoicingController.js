/**
 * ============================================================================
 * Phase 10: GST Billing and Invoicing Management Controller
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const invoicingModel = require('../models/invoicingModel');

// 1. Company Tax Profile
const getCompanyTaxProfile = async (req, res) => {
  try {
    const profile = await invoicingModel.getCompanyTaxProfile();
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateCompanyTaxProfile = async (req, res) => {
  try {
    const updated = await invoicingModel.updateCompanyTaxProfile(req.body, req.user?.id);
    res.json({ success: true, message: 'Company tax profile updated successfully', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 2. Tax Rates
const getTaxRates = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const rates = await invoicingModel.getTaxRates(activeOnly);
    res.json({ success: true, data: rates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createTaxRate = async (req, res) => {
  try {
    if (!req.body.tax_name || req.body.gst_rate === undefined) {
      return res.status(400).json({ success: false, message: 'Tax name and GST rate are required' });
    }
    const newRate = await invoicingModel.createTaxRate(req.body, req.user?.id);
    res.status(201).json({ success: true, message: 'Tax rate created successfully', data: newRate });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 3. Customer Tax Details
const getCustomerTaxDetails = async (req, res) => {
  try {
    const details = await invoicingModel.getCustomerTaxDetails(req.params.customerId);
    res.json({ success: true, data: details });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const upsertCustomerTaxDetails = async (req, res) => {
  try {
    const updated = await invoicingModel.upsertCustomerTaxDetails(req.params.customerId, req.body);
    res.json({ success: true, message: 'Customer GST details saved', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 4. Invoices
const getSalesInvoices = async (req, res) => {
  try {
    const invoices = await invoicingModel.getSalesInvoices(req.query);
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSalesInvoiceById = async (req, res) => {
  try {
    const invoice = await invoicingModel.getSalesInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createSalesInvoice = async (req, res) => {
  try {
    const invoice = await invoicingModel.createSalesInvoice(req.body, req.user?.id);
    res.status(201).json({ success: true, message: 'Tax invoice generated successfully', data: invoice });
  } catch (err) {
    const status = err.status || (err.code === 'DUPLICATE_INVOICE' ? 409 : 400);
    res.status(status).json({ success: false, message: err.message });
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const updated = await invoicingModel.updateInvoiceStatus(req.params.id, req.body, req.user?.id);
    res.json({ success: true, message: `Invoice status updated to ${updated.status}`, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 5. Tax Calculation Engine Preview
const previewTaxCalculation = async (req, res) => {
  try {
    const { items = [], place_of_supply_code = '33' } = req.body;
    const profile = await invoicingModel.getCompanyTaxProfile();
    const result = invoicingModel.calculateGstEngine({
      items,
      placeOfSupplyCode: place_of_supply_code,
      companyStateCode: profile.state_code
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 6. Credit Notes & Debit Notes
const getCreditNotes = async (req, res) => {
  try {
    const notes = await invoicingModel.getCreditNotes(req.query);
    res.json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createCreditNote = async (req, res) => {
  try {
    const note = await invoicingModel.createCreditNote(req.body, req.user?.id);
    res.status(201).json({ success: true, message: 'Credit Note issued successfully', data: note });
  } catch (err) {
    const status = err.status || (err.code === 'EXCESSIVE_CREDIT' ? 400 : 400);
    res.status(status).json({ success: false, message: err.message });
  }
};

const getDebitNotes = async (req, res) => {
  try {
    const notes = await invoicingModel.getDebitNotes(req.query);
    res.json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createDebitNote = async (req, res) => {
  try {
    const note = await invoicingModel.createDebitNote(req.body, req.user?.id);
    res.status(201).json({ success: true, message: 'Debit Note issued successfully', data: note });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 7. Dashboard & Reports
const getInvoicingDashboardStats = async (req, res) => {
  try {
    const stats = await invoicingModel.getInvoicingDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const generateInvoicingReport = async (req, res) => {
  try {
    const report = await invoicingModel.generateInvoicingReport(req.query.report_type, req.query);
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
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
  previewTaxCalculation,
  getCreditNotes,
  createCreditNote,
  getDebitNotes,
  createDebitNote,
  getInvoicingDashboardStats,
  generateInvoicingReport
};
