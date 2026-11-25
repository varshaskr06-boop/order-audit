import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Scale,
  PlusCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  ShieldCheck,
  UserCheck,
  Clock,
  Layers,
  FileText
} from 'lucide-react';

export default function StockAdjustmentPage() {
  const { token, user, setActivePage } = useAuth();
  const [adjustments, setAdjustments] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Request Adjustment Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    item_id: '1',
    adjustment_type: 'EXCESS',
    quantity: '',
    location_id: '1',
    reason: ''
  });

  // Approval Modal (For Admin/Owner)
  const [selectedAdj, setSelectedAdj] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approving, setApproving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [adjRes, rmRes] = await Promise.all([
        fetch('/api/inventory/adjustments', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/inventory/raw-materials', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const adjData = await adjRes.json();
      const rmData = await rmRes.json();

      if (adjData.success) setAdjustments(adjData.data || []);
      if (rmData.success) setRawMaterials(rmData.data || []);
    } catch (err) {
      setError(err.message || 'Error fetching stock adjustments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/inventory/adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setShowRequestModal(false);
        setForm({
          item_id: '1',
          adjustment_type: 'EXCESS',
          quantity: '',
          location_id: '1',
          reason: ''
        });
        fetchData();
      } else {
        setError(json.message || 'Failed to submit adjustment request');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id, decision) => {
    setApproving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/inventory/adjustments/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          decision,
          notes: approvalNotes
        })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setSelectedAdj(null);
        setApprovalNotes('');
        fetchData();
      } else {
        setError(json.message || 'Failed to process approval');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setApproving(false);
    }
  };

  const role = (user?.role || '').toUpperCase();
  const canApprove = ['ADMIN', 'OWNER'].includes(role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
              Module 6 • Stock Adjustments
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Damage, Expired & Physical Reconciliations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Stock Adjustment & Audit Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin/Owner 2-Step Approval Workflow • Central Stock Ledger Reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" /> Request Stock Adjustment
          </button>
          <button
            onClick={() => setActivePage('physical-stock')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <Scale className="h-4 w-4" /> Physical Verification Sheet
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Adjustments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
            <Scale className="h-4 w-4 text-amber-600" />
            <span>Stock Adjustment Requests & Approvals Audit Queue</span>
          </div>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Adjustment #</th>
                <th className="py-3.5 px-4">Item Name & Code</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4 text-right">Adjustment Qty</th>
                <th className="py-3.5 px-4">Reason / Notes</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Approval Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 text-amber-600 animate-spin mx-auto mb-2" />
                    Loading adjustments...
                  </td>
                </tr>
              ) : adjustments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">
                    No stock adjustments recorded. All physical stock matches ledger.
                  </td>
                </tr>
              ) : (
                adjustments.map((adj) => {
                  const isPending = adj.status === 'PENDING';
                  const isApproved = adj.status === 'APPROVED';

                  return (
                    <tr key={adj.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {adj.adjustment_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{adj.item_name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{adj.item_code}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            adj.adjustment_type === 'EXCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : adj.adjustment_type === 'DAMAGED'
                              ? 'bg-rose-100 text-rose-800'
                              : adj.adjustment_type === 'EXPIRED'
                              ? 'bg-red-100 text-red-900'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {adj.adjustment_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-sm text-slate-900">
                        {adj.adjustment_type === 'EXCESS' ? `+${adj.quantity}` : `-${adj.quantity}`} {adj.uom}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={adj.reason}>
                        {adj.reason}
                        {adj.approval_notes && (
                          <div className="text-[10px] text-slate-400 mt-0.5 italic">
                            Note: {adj.approval_notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {adj.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isPending && canApprove ? (
                          <button
                            onClick={() => setSelectedAdj(adj)}
                            className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] shadow-sm transition"
                          >
                            Review & Decide
                          </button>
                        ) : isPending ? (
                          <span className="text-[11px] text-slate-400">Awaiting Admin</span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-500 flex items-center justify-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Decided
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Adjustment Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                  Physical Verification
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">Request Stock Adjustment</h2>
                <p className="text-xs text-slate-500">Record missing, damaged, expired or excess stock</p>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Material *</label>
                <select
                  value={form.item_id}
                  onChange={(e) => setForm({ ...form, item_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  required
                >
                  {rawMaterials.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.item_name} ({rm.item_code}) — Current: {rm.current_stock} {rm.uom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Type *</label>
                  <select
                    value={form.adjustment_type}
                    onChange={(e) => setForm({ ...form, adjustment_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="EXCESS">EXCESS (Counted more than system)</option>
                    <option value="SHORTAGE">SHORTAGE (Missing / Discrepancy)</option>
                    <option value="DAMAGED">DAMAGED (Physical Bag Damage)</option>
                    <option value="EXPIRED">EXPIRED (Shelf Life Overrun)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none"
                    placeholder="e.g. 5"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Reason / Justification *</label>
                <textarea
                  rows="3"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  placeholder="e.g. Physical stock count showed 5 kg torn bag moisture absorption. Scrap scrap-bay write-off recommended."
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin/Owner Decision Modal */}
      {selectedAdj && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                  Executive Approval
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">Review Stock Adjustment</h2>
                <p className="text-xs text-slate-500">Ref: {selectedAdj.adjustment_number}</p>
              </div>
              <button
                onClick={() => setSelectedAdj(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Material:</span>
                <span className="font-bold text-slate-900">{selectedAdj.item_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Adjustment Type:</span>
                <span className="font-bold text-slate-900">{selectedAdj.adjustment_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantity:</span>
                <span className="font-bold text-amber-900">
                  {selectedAdj.adjustment_type === 'EXCESS' ? `+${selectedAdj.quantity}` : `-${selectedAdj.quantity}`} {selectedAdj.uom}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500">Requester Reason:</span>
                <p className="text-slate-800 font-medium mt-0.5 italic">"{selectedAdj.reason}"</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Approval Notes / Decision Remarks</label>
              <textarea
                rows="2"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
                placeholder="Confirmed with warehouse supervisor, adjustment approved to balance ledger."
              ></textarea>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={approving}
                onClick={() => handleApprove(selectedAdj.id, 'REJECTED')}
                className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Reject Adjustment
              </button>
              <button
                type="button"
                disabled={approving}
                onClick={() => handleApprove(selectedAdj.id, 'APPROVED')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {approving ? 'Processing...' : 'Approve & Update Ledger'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
