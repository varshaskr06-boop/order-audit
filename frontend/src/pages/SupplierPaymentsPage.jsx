import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign, Search, PlusCircle, RefreshCw, Eye, RotateCcw,
  AlertTriangle, CheckCircle2, FileText, Printer, X, ShieldAlert
} from 'lucide-react';

const API = '/api/payments';

export default function SupplierPaymentsPage() {
  const { token, user, setActivePage } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [reverseModalOpen, setReverseModalOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState('FAILED_TRANSFER');
  const [reversalNotes, setReversalNotes] = useState('');

  const role = (user?.role || '').toUpperCase();
  const canReverse = ['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/supplier-payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setPayments(json.data);
      else setError(json.message || 'Failed to load supplier payment vouchers');
    } catch (e) {
      setError('Network error loading supplier payments');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const viewVoucher = async (id) => {
    try {
      const res = await fetch(`${API}/supplier-payments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setSelectedVoucher(json.data);
        setViewModalOpen(true);
      }
    } catch (e) {
      alert('Failed to retrieve voucher details');
    }
  };

  const handleReverse = async (e) => {
    e.preventDefault();
    if (!selectedVoucher) return;

    try {
      const res = await fetch(`${API}/supplier-payments/${selectedVoucher.id}/reverse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reversal_reason: reversalReason,
          notes: reversalNotes
        })
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Payment voucher ${selectedVoucher.voucher_number} reversed successfully!`);
        setReverseModalOpen(false);
        fetchPayments();
      } else {
        setError(json.message || 'Failed to reverse payment');
      }
    } catch (e) {
      setError('Network error processing reversal');
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const STATUS_BADGES = {
    PAID: 'bg-emerald-100 text-emerald-800',
    PENDING_APPROVAL: 'bg-purple-100 text-purple-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    REVERSED: 'bg-rose-100 text-rose-800'
  };

  const filtered = payments.filter(p =>
    p.voucher_number.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.reference_number && p.reference_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Supplier Payment Vouchers</h1>
          <p className="text-sm text-slate-500">
            Module 2: Procurement settlements, 3WM discrepancy protection, approval limits &amp; reversal audit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPayments}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role) && (
            <button
              onClick={() => setActivePage('record-supplier-payment')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
            >
              <PlusCircle className="h-4 w-4" /> Record Supplier Payment
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search voucher #, supplier, ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3">Voucher #</th>
                <th className="px-6 py-3">Payment Date</th>
                <th className="px-6 py-3">Supplier Name</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Ref / UTR</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-right">Allocated</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-500">
                    Loading supplier payment vouchers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-400">
                    No supplier payments recorded yet.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-semibold text-blue-700 font-mono text-xs">
                      {p.voucher_number}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {p.payment_date}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {p.supplier_name}
                      {p.discrepancy_override_reason && (
                        <span className="block text-[10px] text-amber-600 italic">3WM Override Authorized</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {p.payment_method?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">
                      {p.reference_number || '—'}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-slate-900">
                      {fmt(p.amount)}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-blue-600">
                      {fmt(p.allocated_amount)}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_BADGES[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right space-x-1">
                      <button
                        onClick={() => viewVoucher(p.id)}
                        className="p-1 text-slate-500 hover:text-slate-800"
                        title="View Voucher"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canReverse && p.status === 'PAID' && (
                        <button
                          onClick={() => { setSelectedVoucher(p); setReverseModalOpen(true); }}
                          className="p-1 text-rose-600 hover:text-rose-800"
                          title="Reverse Payment"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Voucher Modal */}
      {viewModalOpen && selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
              <span className="font-bold text-slate-800 text-sm">Supplier Payment Voucher Particulars</span>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="px-3 py-1 bg-blue-600 text-white rounded text-xs flex items-center gap-1">
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
                <button onClick={() => setViewModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 text-slate-900 text-sm bg-white">
              <div className="text-center border-b border-slate-300 pb-4">
                <h2 className="text-xl font-bold uppercase text-slate-900">Sri Meenakshi Agro &amp; Traditional Foods Pvt Ltd</h2>
                <p className="text-xs text-slate-500">SIPCOT Industrial Park, Kappalur, Madurai - 625008 | GSTIN: 33AAAAA0000A1Z5</p>
                <div className="inline-block mt-2 px-3 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-bold">
                  SUPPLIER DISBURSEMENT VOUCHER (ACCOUNT RECORD)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 p-4 rounded bg-slate-50/50">
                <div>
                  <p><span className="font-bold">Voucher Number:</span> {selectedVoucher.voucher_number}</p>
                  <p><span className="font-bold">Payment Date:</span> {selectedVoucher.payment_date}</p>
                  <p><span className="font-bold">Payment Method:</span> {selectedVoucher.payment_method}</p>
                  <p><span className="font-bold">Reference / UTR:</span> {selectedVoucher.reference_number || 'Cash'}</p>
                </div>
                <div>
                  <p><span className="font-bold">Paid To (Vendor):</span> {selectedVoucher.supplier_name}</p>
                  <p><span className="font-bold">Status:</span> {selectedVoucher.status}</p>
                  <p><span className="font-bold">Allocated Amount:</span> {fmt(selectedVoucher.allocated_amount)}</p>
                  <p><span className="font-bold">Advance Balance:</span> {fmt(selectedVoucher.unallocated_amount)}</p>
                </div>
              </div>

              {selectedVoucher.discrepancy_override_reason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
                  <p className="font-bold">3-WAY MATCHING EXCEPTION OVERRIDE:</p>
                  <p className="italic mt-0.5">{selectedVoucher.discrepancy_override_reason}</p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-xs uppercase text-slate-700 mb-2">Settled Supplier Bills</h4>
                <table className="min-w-full divide-y divide-slate-200 text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Bill / Invoice Number</th>
                      <th className="px-3 py-2 text-left">Allocation Date</th>
                      <th className="px-3 py-2 text-right">Settled Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedVoucher.allocations || []).map(a => (
                      <tr key={a.id}>
                        <td className="px-3 py-2 font-mono font-semibold">{a.invoice_number}</td>
                        <td className="px-3 py-2">{a.allocation_date}</td>
                        <td className="px-3 py-2 text-right font-bold">{fmt(a.allocated_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-slate-800">Authorized Signatory: A. Sundararajan (Finance Director / Admin)</p>
                  <p className="text-slate-400">Electronic verification generated by ERP</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Total Voucher Amount</p>
                  <p className="text-lg font-bold text-blue-700">{fmt(selectedVoucher.amount)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reverse Modal */}
      {reverseModalOpen && selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-rose-600" />
                Reverse Supplier Payment Voucher
              </h3>
              <button onClick={() => setReverseModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReverse} className="p-6 space-y-4 text-sm">
              <p className="text-xs text-slate-600">
                You are about to reverse voucher <b>{selectedVoucher.voucher_number}</b> for <b>{fmt(selectedVoucher.amount)}</b>. This will restore the vendor bill balance and credit back the bank account.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reversal Reason *</label>
                <select
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-sm"
                >
                  <option value="FAILED_TRANSFER">Failed Transfer / Bank UTR Rejection</option>
                  <option value="DATA_ENTRY_ERROR">Data Entry Error / Wrong Vendor Selected</option>
                  <option value="CUSTOMER_DISPUTE">Vendor Commercial Dispute</option>
                  <option value="BOUNCED_CHEQUE">Stop Payment / Cheque Cancellation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Audit Notes</label>
                <textarea
                  rows="2"
                  value={reversalNotes}
                  onChange={(e) => setReversalNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  placeholder="e.g. Bank memo of failed RTGS credit on 23-Nov-2026"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReverseModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Confirm Reversal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
