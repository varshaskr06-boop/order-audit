/**
 * ============================================================================
 * Phase 12: Payment Management System Controller
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const paymentModel = require('../models/paymentModel');

// 1. Payment Methods & Cash/Bank Accounts
const getPaymentMethods = async (req, res) => {
  try {
    const methods = await paymentModel.getPaymentMethods();
    res.json({ success: true, data: methods });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCashBankAccounts = async (req, res) => {
  try {
    const accounts = await paymentModel.getCashBankAccounts();
    res.json({ success: true, data: accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createCashBankAccount = async (req, res) => {
  try {
    if (!req.body.account_name) {
      return res.status(400).json({ success: false, message: 'Account name is required' });
    }
    const acc = await paymentModel.createCashBankAccount(req.body);
    res.status(201).json({ success: true, message: 'Account created successfully', data: acc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 2. Customer Payments & Receipts
const getCustomerPayments = async (req, res) => {
  try {
    const payments = await paymentModel.getCustomerPayments(req.query);
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCustomerPaymentById = async (req, res) => {
  try {
    const payment = await paymentModel.getCustomerPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Customer payment not found' });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCustomerInvoicesForPayment = async (req, res) => {
  try {
    const invoices = await paymentModel.getCustomerInvoicesForPayment(req.params.id);
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const recordCustomerPayment = async (req, res) => {
  try {
    const { customer_id, amount, payment_method } = req.body;
    if (!customer_id || !amount || !payment_method) {
      return res.status(400).json({ success: false, message: 'Customer ID, amount and payment method are required.' });
    }
    const payment = await paymentModel.recordCustomerPayment(req.body, req.user?.id);
    res.status(201).json({
      success: true,
      message: `Customer payment receipt ${payment.receipt_number} recorded successfully`,
      data: payment
    });
  } catch (err) {
    const status = err.status || (err.code === 'OVER_ALLOCATION' || err.code === 'DUPLICATE_REFERENCE' ? 400 : 500);
    res.status(status).json({ success: false, code: err.code, message: err.message });
  }
};

const reverseCustomerPayment = async (req, res) => {
  try {
    const result = await paymentModel.reverseCustomerPayment(req.params.id, req.body, req.user?.id);
    res.json(result);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, code: err.code, message: err.message });
  }
};

const getCustomerStatement = async (req, res) => {
  try {
    const statement = await paymentModel.getCustomerStatement(req.params.id, req.query.from_date, req.query.to_date);
    res.json({ success: true, data: statement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Supplier Payments & Vouchers
const getSupplierPayments = async (req, res) => {
  try {
    const payments = await paymentModel.getSupplierPayments(req.query);
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSupplierPaymentById = async (req, res) => {
  try {
    const payment = await paymentModel.getSupplierPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Supplier payment not found' });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSupplierInvoicesForPayment = async (req, res) => {
  try {
    const invoices = await paymentModel.getSupplierInvoicesForPayment(req.params.id);
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const recordSupplierPayment = async (req, res) => {
  try {
    const { supplier_id, amount, payment_method } = req.body;
    if (!supplier_id || !amount || !payment_method) {
      return res.status(400).json({ success: false, message: 'Supplier ID, amount and payment method are required.' });
    }
    const payment = await paymentModel.recordSupplierPayment(req.body, req.user?.role, req.user?.id);
    res.status(201).json({
      success: true,
      message: `Supplier payment voucher ${payment.voucher_number} processed (${payment.status})`,
      data: payment
    });
  } catch (err) {
    const status = err.status || (err.code === 'THREE_WAY_MATCH_DISCREPANCY' || err.code === 'OVER_ALLOCATION' || err.code === 'DUPLICATE_REFERENCE' ? 400 : 500);
    res.status(status).json({ success: false, code: err.code, message: err.message });
  }
};

const approveSupplierPayment = async (req, res) => {
  try {
    const payment = await paymentModel.approveSupplierPayment(req.params.id, req.body.notes, req.user?.id);
    res.json({ success: true, message: `Payment ${payment.voucher_number} approved successfully`, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const reverseSupplierPayment = async (req, res) => {
  try {
    const result = await paymentModel.reverseSupplierPayment(req.params.id, req.body, req.user?.id);
    res.json(result);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, code: err.code, message: err.message });
  }
};

const getSupplierStatement = async (req, res) => {
  try {
    const statement = await paymentModel.getSupplierStatement(req.params.id, req.query.from_date, req.query.to_date);
    res.json({ success: true, data: statement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Bank Statement Import & Reconciliation
const getBankStatementLines = async (req, res) => {
  try {
    const lines = await paymentModel.getBankStatementLines(req.params.id, req.query.status);
    res.json({ success: true, data: lines });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const importBankStatementCsv = async (req, res) => {
  try {
    const { csv_content, file_name } = req.body;
    if (!csv_content || !file_name) {
      return res.status(400).json({ success: false, message: 'CSV content and file name are required.' });
    }
    const result = await paymentModel.importBankStatementCsv({
      account_id: req.params.id,
      csv_content,
      file_name
    }, req.user?.id);
    res.status(201).json(result);
  } catch (err) {
    const status = err.status || (err.code === 'DUPLICATE_IMPORT' ? 409 : 400);
    res.status(status).json({ success: false, code: err.code, message: err.message });
  }
};

const reconcileStatementLine = async (req, res) => {
  try {
    const { statement_line_id, payment_type, payment_id } = req.body;
    if (!statement_line_id || !payment_type || !payment_id) {
      return res.status(400).json({ success: false, message: 'statement_line_id, payment_type, and payment_id are required' });
    }
    const result = await paymentModel.reconcileStatementLine(req.body, req.user?.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 5. Dashboard & Reports
const getPaymentDashboardStats = async (req, res) => {
  try {
    const stats = await paymentModel.getPaymentDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCustomerAgingReport = async (req, res) => {
  try {
    const report = await paymentModel.getCustomerAgingReport();
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSupplierAgingReport = async (req, res) => {
  try {
    const report = await paymentModel.getSupplierAgingReport();
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getPaymentMethods,
  getCashBankAccounts,
  createCashBankAccount,
  getCustomerPayments,
  getCustomerPaymentById,
  getCustomerInvoicesForPayment,
  recordCustomerPayment,
  reverseCustomerPayment,
  getCustomerStatement,
  getSupplierPayments,
  getSupplierPaymentById,
  getSupplierInvoicesForPayment,
  recordSupplierPayment,
  approveSupplierPayment,
  reverseSupplierPayment,
  getSupplierStatement,
  getBankStatementLines,
  importBankStatementCsv,
  reconcileStatementLine,
  getPaymentDashboardStats,
  getCustomerAgingReport,
  getSupplierAgingReport
};
