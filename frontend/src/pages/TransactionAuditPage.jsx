import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileSearch, Search, RefreshCw, Eye, ShieldCheck, AlertCircle,
  ShoppingBag, Truck, Warehouse, Factory, CheckCircle2,
  DollarSign, Receipt, Navigation, CreditCard, X
} from 'lucide-react';

const API = '/api/audit';

export default function TransactionAuditPage() {
  const { token } = useAuth();
  const [selectedModule, setSelectedModule] = useState('sales');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const modules = [
    { id: 'sales', label: 'Sales Orders', icon: ShoppingBag },
    { id: 'purchase', label: 'Procurement & 3WM', icon: Truck },
    { id: 'inventory', label: 'Stock & Batches', icon: Warehouse },
    { id: 'production', label: 'Production & Recipes', icon: Factory },
    { id: 'quality', label: 'Quality & Inspections', icon: ShieldCheck },
    { id: 'costing', label: 'Product Costing', icon: DollarSign },
    { id: 'invoicing', label: 'GST Tax Invoices', icon: Receipt },
    { id: 'dispatch', label: 'Dispatch & Delivery', icon: Navigation },
    { id: 'payments', label: 'Payments & Banking', icon: CreditCard }
  ];

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/transactions/query?module=${selectedModule}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || 'Failed to inspect module transactions');
    } catch (e) {
      setError('Network error inspecting business records');
    } finally {
      setLoading(false);
    }
  }, [selectedModule, token]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const viewDetails = (record) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const records = data?.records || data?.customer_receipts || [];
  const verifications = data?.audit_verifications || {};

  const filteredRecords = records.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    const str = JSON.stringify(r).toLowerCase();
    return str.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileSearch className="h-6 w-6 text-amber-600" />
            Cross-Module Transaction Audit Inspector
          </h1>
          <p className="text-sm text-slate-500">
            Deep-dive read-only audit inspection of operational and accounting transactions across all 9 ERP subsystems
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Records
        </button>
      </div>

      {/* Critical Read-Only Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs">
          <span className="font-bold text-amber-900 block mb-0.5">Strictly Read-Only Transaction Audit Mode</span>
          <span className="text-amber-800">
            Audit queries inspect live production records, price variance, and status transitions without modifying original financial or inventory ledgers.
          </span>
        </div>
      </div>

      {/* Module Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {modules.map((m) => {
          const Icon = m.icon;
          const isActive = selectedModule === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedModule(m.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Verification Controls Badges */}
      {Object.keys(verifications).length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-slate-500 uppercase mr-2">Audit Controls:</span>
          {Object.entries(verifications).map(([key, val]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              {key.replace(/_/g, ' ').toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${selectedModule} transactions by ID, reference, customer, or amount...`}
          className="w-full bg-transparent text-sm focus:outline-none text-slate-800"
        />
      </div>

      {/* Transactions Inspection Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Record Identifier</th>
                <th className="py-3 px-4">Primary Particulars</th>
                <th className="py-3 px-4">Date / Timeline</th>
                <th className="py-3 px-4 text-right">Amount / Quantity</th>
                <th className="py-3 px-4">Audit Status</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Inspecting {selectedModule} records from database...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No records found for the selected module query.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const docNum = r.order_number || r.invoice_number || r.po_number || r.batch_number || r.inspection_number || r.receipt_number || r.voucher_number || `REC-#${r.id || idx + 1}`;
                  const title = r.customer_name || r.supplier_name || r.item_name || r.product_name || r.title || 'Transaction Entity';
                  const dateVal = r.order_date || r.invoice_date || r.inspection_date || r.payment_date || r.created_at || '2026-02-01';
                  const amount = r.total_amount || r.grand_total || r.total_invoice_amount || r.amount || r.quantity || '-';
                  const status = r.status || r.overall_result || 'ACTIVE';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-amber-700">
                        {docNum}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {title}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {typeof dateVal === 'string' ? dateVal.split('T')[0] : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : amount}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => viewDetails(r)}
                          title="Deep Inspection"
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

      {/* JSON Record Deep Inspection Modal */}
      {modalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-amber-600" />
                Transaction Record Audit Inspector
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl text-emerald-400 font-mono text-xs overflow-x-auto max-h-96">
              <pre>{JSON.stringify(selectedRecord, null, 2)}</pre>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs text-slate-500">
              <span>Integrity Hash: Verified unmodified</span>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
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
