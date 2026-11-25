import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard, Search, PlusCircle, RefreshCw, Eye, RotateCcw,
  AlertTriangle, CheckCircle2, FileText, Printer, X
} from 'lucide-react';

const API = '/api/payments';

export default function CustomerReceiptsPage() {
  const { token, user, setActivePage } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [reverseModalOpen, setReverseModalOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState('BOUNCED_CHEQUE');
  const [reversalNotes, setReversalNotes] = useState('');

  const role = (user?.role || '').toUpperCase();
  const canReverse = ['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/customer-payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setPayments(json.data);
      else setError(json.message || 'Failed to load customer receipts');
    } catch (e) {
      setError('Network error fetching customer receipts');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const viewReceipt = async (id) => {
    try {
      const res = await fetch(`${API}/customer-payments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setSelectedReceipt(json.data);
        setViewModalOpen(true);
      }
    } catch (e) {
      alert('Failed to retrieve receipt details');
    }
  };

  const handleReverse = async (e) => {
    e.preventDefault();
    if (!selectedReceipt) return;

    try {
      const res = await fetch(`${API}/customer-payments/${selectedReceipt.id}/reverse`, {
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
        setSuccess(`Receipt ${selectedReceipt.receipt_number} reversed successfully!`);
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
    RECEIVED: 'bg-blue-100 text-blue-800',
    ALLOCATED: 'bg-emerald-100 text-emerald-800',
    PARTIALLY_ALLOCATED: 'bg-amber-100 text-amber-800',
    REVERSED: 'bg-rose-100 text-rose-800'
  };

  const filtered = payments.filter(p =>
    p.receipt_number.toLowerCase().includes(search.toLowerCase()) ||
    p.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.reference_number && p.reference_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Payment Receipts</h1>
          <p className="text-sm text-slate-500">
            Module 1: Inward collections, multi-invoice allocations, advance receipts &amp; reversal audit
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
              onClick={() => setActivePage('record-customer-payment')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
            >
              <PlusCircle className="h-4 w-4" /> Record New Receipt
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search receipt #, customer, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3">Receipt Number</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Customer Name</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Reference #</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-right">Allocated</th>
                <th className="px-6 py-3 text-right">Advance Credit</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-slate-500">
                    Loading customer receipts...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-slate-400">
                    No customer payment receipts found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-semibold text-emerald-700 font-mono text-xs">
                      {p.receipt_number}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {p.payment_date}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {p.customer_name}
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
                    <td className="px-6 py-3 text-right font-semibold text-emerald-600">
                      {fmt(p.allocated_amount)}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-purple-600">
                      {fmt(p.unallocated_amount)}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_BADGES[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right space-x-1">
                      <button
                        onClick={() => viewReceipt(p.id)}
                        className="p-1 text-slate-500 hover:text-slate-800"
                        title="View Receipt"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canReverse && p.status !== 'REVERSED' && (
                        <button
                          onClick={() => { setSelectedReceipt(p); setReverseModalOpen(true); }}
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

      {/* Printable Receipt Modal */}
      {viewModalOpen && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
              <span className="font-bold text-slate-800 text-sm">Customer Payment Receipt Record</span>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs flex items-center gap-1">
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
                  OFFICIAL PAYMENT RECEIPT (NOT A TAX INVOICE)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 p-4 rounded bg-slate-50/50">
                <div>
                  <p><span className="font-bold">Receipt Number:</span> {selectedReceipt.receipt_number}</p>
                  <p><span className="font-bold">Receipt Date:</span> {selectedReceipt.payment_date}</p>
                  <p><span className="font-bold">Payment Method:</span> {selectedReceipt.payment_method}</p>
                  <p><span className="font-bold">Reference / UTR:</span> {selectedReceipt.reference_number || 'Cash'}</p>
                </div>
                <div>
                  <p><span className="font-bold">Received From:</span> {selectedReceipt.customer_name}</p>
                  <p><span className="font-bold">Status:</span> {selectedReceipt.status}</p>
                  <p><span className="font-bold">Allocated Amount:</span> {fmt(selectedReceipt.allocated_amount)}</p>
                  <p><span className="font-bold">Advance Credit:</span> {fmt(selectedReceipt.unallocated_amount)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase text-slate-700 mb-2">Invoice Allocations</h4>
                <table className="min-w-full divide-y divide-slate-200 text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Invoice Number</th>
                      <th className="px-3 py-2 text-left">Allocation Date</th>
                      <th className="px-3 py-2 text-right">Settled Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedReceipt.allocations || []).map(a => (
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
                  <p className="font-semibold text-slate-800">Received By: M. Sridhar (Senior Accountant)</p>
                  <p className="text-slate-400">Electronic verification generated by ERP</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Total Receipt Amount</p>
                  <p className="text-lg font-bold text-emerald-700">{fmt(selectedReceipt.amount)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reverse Modal */}
      {reverseModalOpen && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-rose-600" />
                Reverse Payment Receipt
              </h3>
              <button onClick={() => setReverseModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReverse} className="p-6 space-y-4 text-sm">
              <p className="text-xs text-slate-600">
                You are about to reverse receipt <b>{selectedReceipt.receipt_number}</b> of amount <b>{fmt(selectedReceipt.amount)}</b>. This will restore the balances of all allocated invoices and deduct from bank balance.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reversal Reason *</label>
                <select
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-sm"
                >
                  <option value="BOUNCED_CHEQUE">Bounced Cheque / Returned Unpaid</option>
                  <option value="FAILED_TRANSFER">Failed Electronic Transfer / Chargeback</option>
                  <option value="DATA_ENTRY_ERROR">Data Entry Error / Wrong Amount</option>
                  <option value="CUSTOMER_DISPUTE">Customer Settlement Dispute</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reversal Notes &amp; Bank Memo</label>
                <textarea
                  rows="2"
                  value={reversalNotes}
                  onChange={(e) => setReversalNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  placeholder="e.g. Return memo received from HDFC on 23-Nov-2026"
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
