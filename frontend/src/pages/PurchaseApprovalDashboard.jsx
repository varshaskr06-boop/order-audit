import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  X,
  Truck,
  IndianRupee,
  Search,
  Eye,
  RotateCcw,
  ShieldCheck,
  Package,
  Calendar,
  History
} from 'lucide-react';

export default function PurchaseApprovalDashboard() {
  const { user, token, setActivePage } = useAuth();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Selected for action
  const [selectedPO, setSelectedPO] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [actionReason, setActionReason] = useState('');

  const role = (user?.role || '').toUpperCase();
  const isAuthorized = ['ADMIN', 'OWNER'].includes(role);

  const fetchPendingPOs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [posRes, supRes] = await Promise.all([
        fetch('/api/purchase/orders?status=SUBMITTED', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/master/suppliers', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ json: () => ({ suppliers: [] }) }))
      ]);

      const posData = await posRes.json();
      const supData = await supRes.json();

      if (posData.success) setPendingOrders(posData.data || []);
      if (supData.suppliers) setSuppliers(supData.suppliers);
    } catch (err) {
      setError('Failed to fetch pending purchase orders for approval.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPOs();
  }, [token]);

  const getSupplierName = (id) => {
    const s = suppliers.find((sup) => sup.id === parseInt(id));
    return s ? `${s.name} (${s.state_code === '33' ? 'Tamil Nadu' : 'Interstate AP/KL'})` : `Supplier #${id}`;
  };

  const handleApprove = async (po) => {
    if (!window.confirm(`Approve Purchase Order ${po.po_number} for ₹${po.grand_total}?`)) return;
    try {
      const res = await fetch(`/api/purchase/orders/${po.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: `Approved by ${user?.full_name || role}` })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to approve PO');

      setSuccessMsg(`PO ${po.po_number} successfully approved!`);
      fetchPendingPOs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirmReject = async () => {
    if (!actionReason.trim()) {
      setError('A mandatory rejection reason is required.');
      return;
    }
    try {
      const res = await fetch(`/api/purchase/orders/${selectedPO.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: actionReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to reject PO');

      setSuccessMsg(`PO ${selectedPO.po_number} rejected.`);
      setShowRejectModal(false);
      fetchPendingPOs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirmReturn = async () => {
    if (!actionReason.trim()) {
      setError('A mandatory reason is required to return order for correction.');
      return;
    }
    try {
      const res = await fetch(`/api/purchase/orders/${selectedPO.id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: actionReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to return PO');

      setSuccessMsg(`PO ${selectedPO.po_number} returned to draft for corrections.`);
      setShowReturnModal(false);
      fetchPendingPOs();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold text-xs uppercase tracking-wider">
              Module 5
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Purchase Approval Dashboard
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Executive approval workflow for Admin and Owner to review, approve, return, or reject vendor purchase orders
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          <span>Role Authorization: ADMIN / OWNER Only</span>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Stat Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight">
              {pendingOrders.length} Purchase Orders Awaiting Executive Approval
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Total commitment value:{' '}
              <strong className="text-amber-400">
                ₹{pendingOrders.reduce((s, p) => s + (p.grand_total || 0), 0).toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>

        <button
          onClick={fetchPendingPOs}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all border border-slate-700 self-start sm:self-auto"
        >
          Refresh Queue
        </button>
      </div>

      {/* Pending Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center text-xs text-slate-400 rounded-2xl border border-slate-200">
            Checking pending purchase orders...
          </div>
        ) : pendingOrders.length === 0 ? (
          <div className="bg-white p-12 text-center text-xs text-slate-400 rounded-2xl border border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <div className="text-sm font-bold text-slate-800">No Pending Approvals</div>
            <p>All purchase orders have been reviewed and approved or returned.</p>
          </div>
        ) : (
          pendingOrders.map((po) => (
            <div
              key={po.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{po.po_number}</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      <Clock className="w-3 h-3" /> Submitted for Approval
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Order Date: <strong className="text-slate-700">{po.po_date}</strong> | Expected Delivery:{' '}
                    <strong className="text-slate-700">{po.expected_delivery_date || 'TBD'}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Purchase Value</div>
                  <div className="text-2xl font-black text-slate-900">
                    ₹{(po.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Supplier & Delivery info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium">Supplier:</span>{' '}
                  <span className="font-bold text-slate-800">{getSupplierName(po.supplier_id)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Payment Terms:</span>{' '}
                  <span className="font-bold text-slate-800">{po.payment_terms || 'Net 15'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Tax Treatment:</span>{' '}
                  <span className="font-bold text-slate-800">
                    {po.igst_amount > 0 ? 'Interstate (IGST)' : 'Intrastate (CGST + SGST)'}
                  </span>
                </div>
                {po.notes && (
                  <div className="sm:col-span-3 text-slate-600">
                    <span className="text-slate-400 font-medium">Notes:</span> {po.notes}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Material</th>
                      <th className="px-4 py-2.5">Type</th>
                      <th className="px-4 py-2.5">Quantity</th>
                      <th className="px-4 py-2.5">Unit Rate</th>
                      <th className="px-4 py-2.5">Disc%</th>
                      <th className="px-4 py-2.5">GST%</th>
                      <th className="px-4 py-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {po.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2.5 font-semibold text-slate-900">{item.material_name}</td>
                        <td className="px-4 py-2.5 text-slate-500">{item.item_type}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-800">
                          {item.ordered_qty} {item.uom}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">₹{item.unit_price}</td>
                        <td className="px-4 py-2.5 text-slate-500">{item.discount_pct}%</td>
                        <td className="px-4 py-2.5 text-slate-500">{item.gst_rate}%</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900 text-right">
                          ₹{(item.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedPO(po);
                    setShowInspectModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                >
                  Inspect Full PO Details
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedPO(po);
                      setActionReason('');
                      setShowReturnModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Return for Correction
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPO(po);
                      setActionReason('');
                      setShowRejectModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-all inline-flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject Order
                  </button>

                  <button
                    onClick={() => handleApprove(po)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve Purchase Order
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* REJECT MODAL */}
      {showRejectModal && selectedPO && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <XCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                Reject Purchase Order {selectedPO.po_number}
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Sri Meenakshi ERP audit compliance mandates recording an explicit reason when rejecting a purchase order.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700">Rejection Reason *</label>
              <textarea
                rows="3"
                required
                placeholder="Explain why this PO is rejected (e.g. Rate higher than prevailing market, alternative supplier preferred)..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-rose-200 text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN FOR CORRECTION MODAL */}
      {showReturnModal && selectedPO && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <RotateCcw className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                Return PO {selectedPO.po_number} for Correction
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              This will return the purchase order to <strong>DRAFT</strong> status so the procurement officer can adjust quantities or negotiated terms.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700">Correction Instructions *</label>
              <textarea
                rows="3"
                required
                placeholder="Specify what needs correction (e.g. Adjust delivery date to Feb 10, negotiate 2% cash discount)..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Return to Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT MODAL */}
      {showInspectModal && selectedPO && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">PO Full Breakdown</h3>
              <button onClick={() => setShowInspectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Subtotal (Gross):</span>
                <span className="font-bold text-slate-900">₹{(selectedPO.subtotal_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Discount:</span>
                <span className="text-rose-600 font-bold">- ₹{(selectedPO.discount_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 font-bold">
                <span className="text-slate-700">Taxable Base:</span>
                <span className="text-slate-900">₹{(selectedPO.taxable_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>CGST (Intrastate):</span>
                <span>₹{(selectedPO.cgst_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>SGST (Intrastate):</span>
                <span>₹{(selectedPO.sgst_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>IGST (Interstate):</span>
                <span>₹{(selectedPO.igst_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-black text-slate-900 pt-2 border-t-2 border-slate-200">
                <span>Grand Total:</span>
                <span>₹{(selectedPO.grand_total || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowInspectModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
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
