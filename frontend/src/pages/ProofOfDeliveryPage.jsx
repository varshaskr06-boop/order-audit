import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2, Search, PlusCircle, RefreshCw, AlertTriangle,
  FileText, ShieldCheck, X, User
} from 'lucide-react';

const API = '/api/dispatch';

export default function ProofOfDeliveryPage() {
  const { token } = useAuth();
  const [pods, setPods] = useState([]);
  const [dispatchedOrders, setDispatchedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    dispatch_order_id: '',
    delivered_quantity: 50,
    receiver_name: 'K. Venkatesh',
    receiver_phone: '+91 98422 33445',
    receiver_designation: 'Inventory Receiving Head',
    acknowledgement_type: 'SIGNATURE_AND_STAMP',
    delivery_remarks: 'All cartons received intact and cold temperature verified'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, oRes] = await Promise.all([
        fetch(`${API}/pod`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const pJson = await pRes.json();
      const oJson = await oRes.json();
      if (pJson.success) setPods(pJson.data);
      if (oJson.success) {
        const eligible = oJson.data.filter(d => ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(d.status));
        setDispatchedOrders(eligible);
        if (eligible.length > 0) {
          setFormData(prev => ({
            ...prev,
            dispatch_order_id: eligible[0].id,
            delivered_quantity: eligible[0].total_dispatched_quantity
          }));
        }
      }
    } catch (e) {
      setError('Network error fetching proof of delivery records');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dispatch_order_id) {
      setError('Please choose an in-transit or dispatched order.');
      return;
    }

    try {
      const res = await fetch(`${API}/pod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setSuccess('Proof of Delivery recorded and order marked as DELIVERED!');
        setModalOpen(false);
        fetchData();
      } else {
        setError(json.message || 'Failed to record POD');
      }
    } catch (e) {
      setError('Network error recording POD');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proof of Delivery (POD)</h1>
          <p className="text-sm text-slate-500">
            Module 7: Store In-Charge Signatures, Receiving Stamps, Digital Sign-offs &amp; Delivery Reconciliation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={() => { setModalOpen(true); setError(''); setSuccess(''); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" /> Record POD
          </button>
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

      {/* POD Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3">POD ID</th>
                <th className="px-6 py-3">Dispatch Order #</th>
                <th className="px-6 py-3 text-right">Delivered Qty</th>
                <th className="px-6 py-3">Receiver Name</th>
                <th className="px-6 py-3">Designation</th>
                <th className="px-6 py-3">Acknowledgement</th>
                <th className="px-6 py-3">Delivery Date</th>
                <th className="px-6 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    Loading POD records...
                  </td>
                </tr>
              ) : pods.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    No Proof of Delivery records submitted yet.
                  </td>
                </tr>
              ) : (
                pods.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-semibold text-emerald-700 font-mono text-xs">
                      POD-{p.id}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-800">
                      DSP-2026-000{p.dispatch_order_id}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-slate-900">
                      {p.delivered_quantity} PKT
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {p.receiver_name}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {p.receiver_designation}
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded">
                        {p.acknowledgement_type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {new Date(p.delivery_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500 max-w-xs truncate">
                      {p.delivery_remarks}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record POD Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Record Proof of Delivery (POD)
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Order to Deliver *</label>
                <select
                  value={formData.dispatch_order_id}
                  onChange={(e) => {
                    const sel = dispatchedOrders.find(d => d.id === parseInt(e.target.value));
                    setFormData({
                      ...formData,
                      dispatch_order_id: e.target.value,
                      delivered_quantity: sel ? sel.total_dispatched_quantity : formData.delivered_quantity
                    });
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-sm"
                  required
                >
                  <option value="">-- Choose Order --</option>
                  {dispatchedOrders.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.dispatch_order_number} — {d.customer_name} ({d.total_dispatched_quantity} PKT)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Delivered Quantity (PKT) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.delivered_quantity}
                    onChange={(e) => setFormData({ ...formData, delivered_quantity: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Acknowledgement Type</label>
                  <select
                    value={formData.acknowledgement_type}
                    onChange={(e) => setFormData({ ...formData, acknowledgement_type: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-sm"
                  >
                    <option value="SIGNATURE_AND_STAMP">Signature &amp; Store Stamp</option>
                    <option value="DIGITAL_OTP">Digital OTP Verification</option>
                    <option value="PHYSICAL_SIGNATURE">Physical Paper Signature</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Receiver Person Name *</label>
                  <input
                    type="text"
                    value={formData.receiver_name}
                    onChange={(e) => setFormData({ ...formData, receiver_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Receiver Phone</label>
                  <input
                    type="text"
                    value={formData.receiver_phone}
                    onChange={(e) => setFormData({ ...formData, receiver_phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Receiver Designation</label>
                <input
                  type="text"
                  value={formData.receiver_designation}
                  onChange={(e) => setFormData({ ...formData, receiver_designation: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  placeholder="e.g. Store Manager / Head Chef"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Delivery Condition Remarks</label>
                <textarea
                  rows="2"
                  value={formData.delivery_remarks}
                  onChange={(e) => setFormData({ ...formData, delivery_remarks: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Confirm Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
