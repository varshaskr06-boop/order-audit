import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle,
  Clock, DollarSign, X
} from 'lucide-react';

const API = '/api/payments';

export default function PaymentApprovalsPage() {
  const { token, user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  const role = (user?.role || '').toUpperCase();
  const canApprove = ['ADMIN', 'OWNER'].includes(role);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/supplier-payments?status=PENDING_APPROVAL`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setPayments(json.data);
      else setError(json.message || 'Failed to load pending approvals');
    } catch (e) {
      setError('Network error fetching approvals');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;

    try {
      const res = await fetch(`${API}/supplier-payments/${selectedPayment.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: approvalNotes || 'Approved by authorized management' })
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Payment Voucher ${selectedPayment.voucher_number} approved and released!`);
        setModalOpen(false);
        fetchPending();
      } else {
        setError(json.message || 'Failed to approve payment');
      }
    } catch (e) {
      setError('Network error approving payment');
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Authorization Queue</h1>
          <p className="text-sm text-slate-500">
            Module 2: High-Value Supplier Payments (&gt;₹50,000 Threshold) Requiring Admin/Owner Clearance
          </p>
        </div>
        <button
          onClick={fetchPending}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
        >
          <RefreshCw className="h-4 w-4" /> Refresh Queue
        </button>
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

      {/* Pending Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3">Voucher #</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Supplier Name</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Reference #</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    Loading pending payment approvals...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    No supplier payments currently awaiting authorization.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-semibold text-blue-700 font-mono text-xs">
                      {p.voucher_number}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {p.payment_date}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {p.supplier_name}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {p.payment_method?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">
                      {p.reference_number || '—'}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-slate-900 text-base">
                      {fmt(p.amount)}
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        PENDING APPROVAL
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      {canApprove ? (
                        <button
                          onClick={() => { setSelectedPayment(p); setModalOpen(true); }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition"
                        >
                          Review &amp; Approve
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Admin only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      {modalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                Authorize Supplier Payment
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApprove} className="p-6 space-y-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-lg space-y-1 text-xs">
                <p><span className="font-semibold text-slate-700">Voucher:</span> {selectedPayment.voucher_number}</p>
                <p><span className="font-semibold text-slate-700">Vendor:</span> {selectedPayment.supplier_name}</p>
                <p><span className="font-semibold text-slate-700">Amount:</span> <b className="text-sm text-blue-700">{fmt(selectedPayment.amount)}</b></p>
                <p><span className="font-semibold text-slate-700">Method:</span> {selectedPayment.payment_method}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Approval Notes / Authorization Remarks</label>
                <textarea
                  rows="2"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  placeholder="e.g. Checked invoice particulars; payment approved for release"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Approve &amp; Release Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
