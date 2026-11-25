import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  History, Search, Filter, Download, RefreshCw, Eye,
  ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, RotateCcw,
  CreditCard, DollarSign, X, Printer
} from 'lucide-react';

const API = '/api/payments';

export default function PaymentHistoryPage() {
  const { token, setActivePage } = useAuth();
  const [customerPayments, setCustomerPayments] = useState([]);
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, CUSTOMER_RECEIPT, SUPPLIER_PAYMENT
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, COMPLETED/PAID, PENDING_APPROVAL, REVERSED
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Detail Modal
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [resC, resS] = await Promise.all([
        fetch(`${API}/customer-payments`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/supplier-payments`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const jsonC = await resC.json();
      const jsonS = await resS.json();

      if (jsonC.success) setCustomerPayments(jsonC.data || []);
      if (jsonS.success) setSupplierPayments(jsonS.data || []);
    } catch (e) {
      setError('Network error fetching payment history transactions');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Combine and normalize both types of transactions
  const combinedTransactions = useMemo(() => {
    const list = [];

    // Map customer payments
    customerPayments.forEach((cp) => {
      list.push({
        id: `cp-${cp.id}`,
        rawId: cp.id,
        category: 'CUSTOMER_RECEIPT',
        categoryLabel: 'Customer Receipt',
        docNumber: cp.receipt_number,
        date: cp.payment_date,
        partyName: cp.customer_name || `Customer #${cp.customer_id}`,
        partyType: 'Customer',
        amount: parseFloat(cp.amount || 0),
        isInflow: true,
        paymentMethod: cp.payment_method,
        accountName: cp.account_name,
        referenceNumber: cp.reference_number || 'N/A',
        status: cp.status || 'COMPLETED',
        notes: cp.notes,
        raw: cp
      });
    });

    // Map supplier payments
    supplierPayments.forEach((sp) => {
      list.push({
        id: `sp-${sp.id}`,
        rawId: sp.id,
        category: 'SUPPLIER_PAYMENT',
        categoryLabel: 'Supplier Payment',
        docNumber: sp.voucher_number,
        date: sp.payment_date,
        partyName: sp.supplier_name || `Supplier #${sp.supplier_id}`,
        partyType: 'Supplier',
        amount: parseFloat(sp.amount || 0),
        isInflow: false,
        paymentMethod: sp.payment_method,
        accountName: sp.account_name,
        referenceNumber: sp.reference_number || 'N/A',
        status: sp.status || 'PAID',
        notes: sp.notes,
        raw: sp
      });
    });

    // Sort newest first
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [customerPayments, supplierPayments]);

  // Filter transactions
  const filtered = useMemo(() => {
    return combinedTransactions.filter((txn) => {
      if (typeFilter !== 'ALL' && txn.category !== typeFilter) return false;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'COMPLETED' && !['COMPLETED', 'PAID'].includes(txn.status)) return false;
        if (statusFilter === 'PENDING_APPROVAL' && txn.status !== 'PENDING_APPROVAL') return false;
        if (statusFilter === 'REVERSED' && txn.status !== 'REVERSED') return false;
      }
      if (methodFilter !== 'ALL' && txn.paymentMethod !== methodFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesDoc = txn.docNumber?.toLowerCase().includes(q);
        const matchesParty = txn.partyName?.toLowerCase().includes(q);
        const matchesRef = txn.referenceNumber?.toLowerCase().includes(q);
        const matchesMethod = txn.paymentMethod?.toLowerCase().includes(q);
        if (!matchesDoc && !matchesParty && !matchesRef && !matchesMethod) return false;
      }
      return true;
    });
  }, [combinedTransactions, typeFilter, statusFilter, methodFilter, searchTerm]);

  // Calculate summary metrics
  const totalInflow = useMemo(() => {
    return combinedTransactions
      .filter((t) => t.category === 'CUSTOMER_RECEIPT' && t.status !== 'REVERSED')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [combinedTransactions]);

  const totalOutflow = useMemo(() => {
    return combinedTransactions
      .filter((t) => t.category === 'SUPPLIER_PAYMENT' && t.status !== 'REVERSED')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [combinedTransactions]);

  const netCashFlow = totalInflow - totalOutflow;

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      alert('No records to export');
      return;
    }
    const headers = [
      'Date', 'Type', 'Voucher/Receipt Ref', 'Party Name', 'Amount (INR)',
      'Flow Type', 'Method', 'Bank/Cash Account', 'Transaction UTR/Ref', 'Status'
    ];
    const rows = filtered.map((t) => [
      `"${t.date || ''}"`,
      `"${t.categoryLabel || ''}"`,
      `"${t.docNumber || ''}"`,
      `"${(t.partyName || '').replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.isInflow ? 'INFLOW' : 'OUTFLOW',
      `"${t.paymentMethod || ''}"`,
      `"${(t.accountName || '').replace(/"/g, '""')}"`,
      `"${(t.referenceNumber || '').replace(/"/g, '""')}"`,
      `"${t.status || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payment_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openTxnDetails = (txn) => {
    setSelectedTxn(txn);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="h-6 w-6 text-amber-600" />
            Payment Transaction History
          </h1>
          <p className="text-sm text-slate-500">
            Unified ledger of customer receipts and supplier disbursements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Customer Receipts (In)</span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            ₹{totalInflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total active receipts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Supplier Payments (Out)</span>
            <ArrowUpRight className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 font-mono">
            ₹{totalOutflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total active disbursements</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Net Settled Cash Flow</span>
            <DollarSign className={`h-4 w-4 ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            ₹{netCashFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{netCashFlow >= 0 ? 'Net Cash Surplus' : 'Net Cash Deficit'}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Filtered Transactions</span>
            <History className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 font-mono">
            {filtered.length} / {combinedTransactions.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Records displayed</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search party, doc #, UTR ref..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Type Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-500">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Types</option>
              <option value="CUSTOMER_RECEIPT">Customer Receipts</option>
              <option value="SUPPLIER_PAYMENT">Supplier Payments</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed / Paid</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="REVERSED">Reversed</option>
            </select>
          </div>

          {/* Method Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-500">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Methods</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
              <option value="UPI">UPI</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CASH">Cash</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Doc #</th>
                <th className="py-3 px-4">Party</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4">Method &amp; Account</th>
                <th className="py-3 px-4">Ref / UTR</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    No payment transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((txn) => {
                  return (
                    <tr key={txn.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{txn.date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded ${
                            txn.category === 'CUSTOMER_RECEIPT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {txn.isInflow ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {txn.categoryLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-xs text-slate-800">
                        {txn.docNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {txn.partyName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={txn.isInflow ? 'text-emerald-600' : 'text-rose-600'}>
                          {txn.isInflow ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-semibold text-slate-800">{txn.paymentMethod}</div>
                        <div className="text-[10px] text-slate-500">{txn.accountName || 'Primary Account'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {txn.referenceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            ['COMPLETED', 'PAID'].includes(txn.status)
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : txn.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => openTxnDetails(txn)}
                          title="View Details"
                          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {modalOpen && selectedTxn && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                  {selectedTxn.categoryLabel} Details
                </h3>
                <p className="text-xs text-slate-500 font-mono">{selectedTxn.docNumber}</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Party</div>
                  <div className="font-bold text-slate-800 text-base">{selectedTxn.partyName}</div>
                  <div className="text-xs text-slate-500">{selectedTxn.partyType}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400 uppercase">Total Transaction Amount</div>
                  <div className={`text-xl font-black font-mono ${selectedTxn.isInflow ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ₹{selectedTxn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500">{selectedTxn.status}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block font-semibold">Payment Date</span>
                  <span className="font-bold text-slate-800">{selectedTxn.date}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block font-semibold">Payment Method</span>
                  <span className="font-bold text-slate-800">{selectedTxn.paymentMethod}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block font-semibold">Settlement Account</span>
                  <span className="font-bold text-slate-800">{selectedTxn.accountName || 'Primary Account'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block font-semibold">Transaction / UTR Reference</span>
                  <span className="font-bold font-mono text-slate-800">{selectedTxn.referenceNumber}</span>
                </div>
              </div>

              {selectedTxn.notes && (
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs">
                  <span className="font-bold text-amber-800 block mb-0.5">Notes / Memo:</span>
                  <span className="text-slate-700">{selectedTxn.notes}</span>
                </div>
              )}

              {/* Allocations breakdown if present */}
              {selectedTxn.raw?.allocations && selectedTxn.raw.allocations.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-600 uppercase mb-1">Invoice Allocations</div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Invoice #</th>
                          <th className="py-2 px-3 text-right">Allocated (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedTxn.raw.allocations.map((a, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-mono">{a.invoice_number}</td>
                            <td className="py-2 px-3 text-right font-mono font-semibold">
                              ₹{parseFloat(a.allocated_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
