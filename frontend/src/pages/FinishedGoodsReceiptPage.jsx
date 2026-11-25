import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Warehouse,
  Calendar,
  X
} from 'lucide-react';

export default function FinishedGoodsReceiptPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inward Form
  const [formData, setFormData] = useState({
    batch_id: '',
    batch_number: '',
    mfg_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    accepted_quantity: 0,
    rejected_quantity: 0,
    warehouse_location_id: 4,
    warehouse_location_name: 'Finished Goods Cold Storage',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/production/orders', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) {
        // Can post FG receipts for COMPLETED or IN_PROGRESS orders
        setOrders(json.data.filter(o => ['COMPLETED', 'IN_PROGRESS'].includes(o.status)));
      }
    } catch (_) {}
  };

  const fetchOrderDetails = async (orderId) => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const [ordRes, fgrRes, bRes, locRes] = await Promise.all([
        fetch(`/api/production/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/production/orders/${orderId}/fg-receipts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/production/orders/${orderId}/batches`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/inventory/locations', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [ordJson, fgrJson, bJson, locJson] = await Promise.all([
        ordRes.json(), fgrRes.json(), bRes.json(), locJson.json()
      ]);

      if (ordJson.success) {
        setSelectedOrder(ordJson.data);
        setFormData((prev) => ({
          ...prev,
          accepted_quantity: ordJson.data.accepted_quantity || ordJson.data.actual_quantity || 0,
          rejected_quantity: ordJson.data.rejected_quantity || 0
        }));
      }
      if (fgrJson.success) setReceipts(fgrJson.data || []);
      if (bJson.success && bJson.data?.length > 0) {
        setBatches(bJson.data);
        const firstBatch = bJson.data[0];
        setFormData((prev) => ({
          ...prev,
          batch_id: firstBatch.id,
          batch_number: firstBatch.batch_number,
          mfg_date: firstBatch.mfg_date,
          expiry_date: firstBatch.expiry_date
        }));
      }
      if (locJson.success) setLocations(locJson.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load order finished goods receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetails(selectedOrderId);
    }
  }, [selectedOrderId]);

  const handlePostFGReceipt = async (e) => {
    e.preventDefault();
    if (!formData.accepted_quantity || Number(formData.accepted_quantity) <= 0) {
      alert('Accepted quantity must be greater than zero');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/production/orders/${selectedOrderId}/fg-receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        alert('Accepted finished goods posted to Phase 6 stock ledger & inventory!');
        fetchOrderDetails(selectedOrderId);
        fetchOrders();
      } else {
        alert(json.error?.message || 'Failed to post finished goods receipt');
      }
    } catch (err) {
      alert(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
              📦
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Finished Goods Inward & Stock Receipt
              </h1>
              <p className="text-xs text-slate-500">
                Module 9 — Transfer accepted production output into Phase 6 finished goods inventory & stock ledger
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchOrderDetails(selectedOrderId)}
          disabled={!selectedOrderId || loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Select Order */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
        <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Select Production Order *</label>
        <select
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          className="w-full sm:w-96 text-xs p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">-- Choose Completed or In-Progress Order --</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.order_number} — {o.product_name} ({o.actual_quantity || o.planned_quantity} units) [{o.status}]
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {selectedOrderId && selectedOrder && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Post FG Receipt Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-900">Post Receipt to Inventory</h2>
              {selectedOrder.fg_receipt_posted && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Already Posted
                </span>
              )}
            </div>

            {selectedOrder.fg_receipt_posted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Finished Goods Receipt Posted</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Stock has already been transferred to Phase 6 Finished Goods inventory. Duplicate postings are blocked to prevent phantom balances.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePostFGReceipt} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    required
                    placeholder="e.g. PB-FG001-20261125-001"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold text-purple-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mfg Date *</label>
                    <input
                      type="date"
                      value={formData.mfg_date}
                      onChange={(e) => setFormData({ ...formData, mfg_date: e.target.value })}
                      required
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      required
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-rose-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Accepted Finished Qty *</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={formData.accepted_quantity}
                      onChange={(e) => setFormData({ ...formData, accepted_quantity: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold font-mono text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Rejected Qty (Not for Stock)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.rejected_quantity}
                      onChange={(e) => setFormData({ ...formData, rejected_quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold font-mono text-rose-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Storage Location *</label>
                  <select
                    value={formData.warehouse_location_id}
                    onChange={(e) => {
                      const loc = locations.find(l => l.id === Number(e.target.value));
                      setFormData({
                        ...formData,
                        warehouse_location_id: e.target.value,
                        warehouse_location_name: loc?.location_name || 'Warehouse'
                      });
                    }}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.location_name} ({l.location_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Receipt Notes</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Pallet count, cooling bay number..."
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-sm transition-all"
                >
                  {submitting ? 'Posting Inward...' : 'Post Inward Movement to Stock'}
                </button>
              </form>
            )}
          </div>

          {/* Receipts History */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Finished Goods Inward History</h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                    <th className="py-2.5 px-3">Receipt #</th>
                    <th className="py-2.5 px-3">Batch Number</th>
                    <th className="py-2.5 px-3">Accepted Qty</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Posted By</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {receipts.length > 0 ? (
                    receipts.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-purple-700">{r.receipt_number}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold">{r.batch_number}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">{r.accepted_quantity} units</td>
                        <td className="py-2.5 px-3 text-slate-600">{r.warehouse_location_name}</td>
                        <td className="py-2.5 px-3 text-slate-700">{r.posted_by_name || 'Supervisor'}</td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                          {r.posted_at ? new Date(r.posted_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-slate-400">
                        No finished goods receipt slips posted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
