import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  PlusCircle,
  X
} from 'lucide-react';

export default function MaterialReturnPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [returns, setReturns] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Return Form
  const [formData, setFormData] = useState({
    material_id: '',
    material_type: 'RAW_MATERIAL',
    material_name: '',
    inventory_item_id: 1,
    returned_quantity: '',
    unit: 'KG',
    condition: 'GOOD',
    return_reason: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/production/orders', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setOrders(json.data || []);
    } catch (_) {}
  };

  const fetchReturns = async (orderId) => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const [retRes, reqRes] = await Promise.all([
        fetch(`/api/production/orders/${orderId}/returns`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/production/orders/${orderId}/requirements`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [retJson, reqJson] = await Promise.all([retRes.json(), reqRes.json()]);
      if (retJson.success) setReturns(retJson.data || []);
      if (reqJson.success) setRequirements(reqJson.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load material returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  useEffect(() => {
    if (selectedOrderId) {
      fetchReturns(selectedOrderId);
    }
  }, [selectedOrderId]);

  const handlePostReturn = async (e) => {
    e.preventDefault();
    if (!formData.material_id || !formData.returned_quantity) {
      alert('Material and Returned Quantity are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/production/orders/${selectedOrderId}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        alert(
          json.data.return_to_stock
            ? 'Material accepted in GOOD condition and returned to Phase 6 stock ledger!'
            : 'Material flagged as DAMAGED/CONTAMINATED and isolated from usable stock.'
        );
        setFormData({
          material_id: '',
          material_type: 'RAW_MATERIAL',
          material_name: '',
          inventory_item_id: 1,
          returned_quantity: '',
          unit: 'KG',
          condition: 'GOOD',
          return_reason: '',
          notes: ''
        });
        fetchReturns(selectedOrderId);
      } else {
        alert(json.error?.message || 'Failed to post return');
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
            <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
              🔄
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Material Returns Management
              </h1>
              <p className="text-xs text-slate-500">
                Module 6 — Return unused surplus back to inventory; quarantine damaged materials
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchReturns(selectedOrderId)}
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
          className="w-full sm:w-96 text-xs p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Return Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Record Material Return</h2>

            <form onSubmit={handlePostReturn} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Issued Material *</label>
                <select
                  value={formData.material_id}
                  onChange={(e) => {
                    const req = requirements.find(r => r.material_id === Number(e.target.value));
                    setFormData({
                      ...formData,
                      material_id: e.target.value,
                      material_type: req?.material_type || 'RAW_MATERIAL',
                      material_name: req?.material_name || '',
                      inventory_item_id: req?.material_type === 'RAW_MATERIAL' ? req.material_id : req.material_id + 5,
                      unit: req?.unit || 'KG'
                    });
                  }}
                  required
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Choose Material from BOM --</option>
                  {requirements.map((r) => (
                    <option key={r.id} value={r.material_id}>
                      {r.material_name} ({r.material_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Return Quantity *</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={formData.returned_quantity}
                    onChange={(e) => setFormData({ ...formData, returned_quantity: e.target.value })}
                    required
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={formData.unit}
                    readOnly
                    className="w-full p-2 border rounded-lg bg-slate-50 text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Material Condition *</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                >
                  <option value="GOOD">Good (Reusable - Return to Usable Stock)</option>
                  <option value="DAMAGED">Damaged (Exclude from Usable Stock)</option>
                  <option value="CONTAMINATED">Contaminated (Exclude from Usable Stock)</option>
                  <option value="EXPIRED">Expired (Exclude from Usable Stock)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Return</label>
                <input
                  type="text"
                  placeholder="e.g. Excess unopened pouch roll"
                  value={formData.return_reason}
                  onChange={(e) => setFormData({ ...formData, return_reason: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-sm transition-all"
              >
                {submitting ? 'Posting Return...' : 'Record Material Return'}
              </button>
            </form>
          </div>

          {/* Return History Table */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Return Slips History</h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                    <th className="py-2.5 px-3">Return #</th>
                    <th className="py-2.5 px-3">Material</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Condition</th>
                    <th className="py-2.5 px-3">Stock Impact</th>
                    <th className="py-2.5 px-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {returns.length > 0 ? (
                    returns.map((ret) => (
                      <tr key={ret.id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-teal-700">{ret.return_number}</td>
                        <td className="py-2.5 px-3 font-semibold">{ret.material_name}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">{ret.returned_quantity} {ret.unit}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ret.condition === 'GOOD'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {ret.condition}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {ret.return_to_stock ? (
                            <span className="text-[10px] font-bold text-emerald-700">Credited to Ledger</span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-600">Isolated (No Stock Credit)</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{ret.return_reason || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-slate-400">
                        No material returns logged for this order.
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
