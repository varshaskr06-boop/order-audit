import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Tag,
  Search,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  QrCode,
  Calendar,
  Layers,
  X
} from 'lucide-react';

export default function ProductionBatchPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [batches, setBatches] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create Batch Form
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    mfg_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    produced_quantity: 100,
    accepted_quantity: 98,
    rejected_quantity: 2,
    batch_status: 'QC_PASSED',
    qc_remarks: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/production/orders', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setOrders(json.data || []);
    } catch (_) {}
  };

  const fetchBatches = async (orderId) => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const [bRes, ordRes] = await Promise.all([
        fetch(`/api/production/orders/${orderId}/batches`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/production/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [bJson, ordJson] = await Promise.all([bRes.json(), ordRes.json()]);
      if (bJson.success) setBatches(bJson.data || []);
      if (ordJson.success) {
        setSelectedOrder(ordJson.data);
        setFormData((prev) => ({
          ...prev,
          produced_quantity: ordJson.data.actual_quantity || ordJson.data.planned_quantity || 100,
          accepted_quantity: ordJson.data.accepted_quantity || ordJson.data.planned_quantity || 98,
          rejected_quantity: ordJson.data.rejected_quantity || 0
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  useEffect(() => {
    if (selectedOrderId) {
      fetchBatches(selectedOrderId);
    }
  }, [selectedOrderId]);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/production/orders/${selectedOrderId}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          product_id: selectedOrder.product_id,
          product_name: selectedOrder.product_name,
          product_sku: selectedOrder.product_sku
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchBatches(selectedOrderId);
      } else {
        alert(json.error?.message || 'Failed to create batch');
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
              🏷️
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Batch Traceability & QC Assignment
              </h1>
              <p className="text-xs text-slate-500">
                Module 8 — Auto-generate unique batch numbers, bind manufacturing & expiry dates, QC records
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchBatches(selectedOrderId)}
            disabled={!selectedOrderId || loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {selectedOrderId && ['ADMIN', 'OWNER', 'PRODUCTION'].includes(user?.role?.toUpperCase()) && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              Generate Production Batch
            </button>
          )}
        </div>
      </div>

      {/* Select Order */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
        <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Select Production Order *</label>
        <select
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          className="w-full sm:w-96 text-xs p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">-- Choose Production Order --</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.order_number} — {o.product_name} [{o.status}]
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

      {selectedOrderId && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Batches Generated for {selectedOrder?.order_number}</h2>
              <p className="text-xs text-slate-500">{selectedOrder?.product_name}</p>
            </div>
            <span className="text-xs font-mono font-bold text-purple-700">Total Batches: {batches.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Mfg Date</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Produced Qty</th>
                  <th className="py-3 px-4">Accepted Qty</th>
                  <th className="py-3 px-4">QC Status</th>
                  <th className="py-3 px-4">QC Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {batches.length > 0 ? (
                  batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-extrabold text-purple-700">{b.batch_number}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{b.mfg_date}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-rose-600">{b.expiry_date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.produced_quantity}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">{b.accepted_quantity}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.batch_status === 'QC_PASSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.batch_status === 'PENDING_QC'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {b.batch_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{b.qc_remarks || 'Quality cleared'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No batches assigned yet. Click "Generate Production Batch" to register.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Batch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Assign New Production Batch</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900">
                <div className="font-bold">Auto Batch Number Generation</div>
                <div className="text-[11px] font-mono text-purple-700">
                  Format: PB-{selectedOrder?.product_sku?.replace(/[^A-Z0-9]/gi, '')}-YYYYMMDD-XXX
                </div>
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
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-rose-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Accepted Finished Qty *</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.accepted_quantity}
                    onChange={(e) => setFormData({ ...formData, accepted_quantity: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">QC Decision *</label>
                  <select
                    value={formData.batch_status}
                    onChange={(e) => setFormData({ ...formData, batch_status: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                  >
                    <option value="QC_PASSED">QC Passed (Ready for Inward)</option>
                    <option value="PENDING_QC">Pending Lab Clearance</option>
                    <option value="QC_FAILED">QC Failed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">QC Remarks / Test Notes</label>
                <textarea
                  rows="2"
                  value={formData.qc_remarks}
                  onChange={(e) => setFormData({ ...formData, qc_remarks: e.target.value })}
                  placeholder="Passed sensory taste & batter fermentation acidity test..."
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold"
                >
                  {submitting ? 'Generating...' : 'Confirm & Register Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
