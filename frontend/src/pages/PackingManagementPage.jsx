import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PackageCheck, Search, PlusCircle, RefreshCw, Box,
  AlertTriangle, CheckCircle2, FileText, X
} from 'lucide-react';

const API = '/api/dispatch';

export default function PackingManagementPage() {
  const { token } = useAuth();
  const [packingRecords, setPackingRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    dispatch_order_id: '',
    total_cartons: 5,
    total_gross_weight_kg: 52.5,
    total_net_weight_kg: 50.0,
    packing_remarks: 'Packed in corrugated 5-ply cartons with ice gel packs'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, oRes] = await Promise.all([
        fetch(`${API}/packing`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/orders?status=PENDING`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const pJson = await pRes.json();
      const oJson = await oRes.json();
      if (pJson.success) setPackingRecords(pJson.data);
      if (oJson.success) {
        setOrders(oJson.data);
        if (oJson.data.length > 0) {
          setFormData(prev => ({ ...prev, dispatch_order_id: oJson.data[0].id }));
        }
      }
    } catch (e) {
      setError('Network error fetching packing records');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dispatch_order_id) {
      setError('Please select an active dispatch order.');
      return;
    }

    try {
      const res = await fetch(`${API}/packing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          items: [
            {
              product_id: 1,
              product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)',
              carton_number: 'CTN-01 to CTN-' + formData.total_cartons,
              packed_quantity: 50,
              packets_per_carton: 10,
              gross_weight_kg: Number(formData.total_gross_weight_kg),
              net_weight_kg: Number(formData.total_net_weight_kg),
              uom: 'PKT'
            }
          ]
        })
      });

      const json = await res.json();
      if (json.success) {
        setSuccess(`Packing Slip ${json.data?.packing_slip_number} created successfully!`);
        setModalOpen(false);
        fetchData();
      } else {
        setError(json.message || 'Failed to record packing');
      }
    } catch (e) {
      setError('Network error recording packing');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Packing Management</h1>
          <p className="text-sm text-slate-500">
            Module 3: Secondary Packaging, Carton Assignments &amp; Packing Slips (PKG-YYYY-XXXX)
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" /> Record Packing Slip
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

      {/* Packing Slips Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3">Packing Slip #</th>
                <th className="px-6 py-3">Dispatch Order #</th>
                <th className="px-6 py-3 text-right">Cartons</th>
                <th className="px-6 py-3 text-right">Total Packages</th>
                <th className="px-6 py-3 text-right">Gross Wt (KG)</th>
                <th className="px-6 py-3 text-right">Net Wt (KG)</th>
                <th className="px-6 py-3">Packed By</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    Loading packing records...
                  </td>
                </tr>
              ) : packingRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    No packing records logged yet.
                  </td>
                </tr>
              ) : (
                packingRecords.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-semibold text-indigo-700 font-mono text-xs">
                      {p.packing_slip_number}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-700">
                      {p.dispatch_order_number}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-900">
                      {p.total_cartons}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-800">
                      {p.total_packages} PKT
                    </td>
                    <td className="px-6 py-3 text-right text-slate-700">
                      {Number(p.total_gross_weight_kg).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right text-slate-700">
                      {Number(p.total_net_weight_kg).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {p.packed_by_name || 'Warehouse Team'}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Packing Slip Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-indigo-600" />
                Record Secondary Packing Slip
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Dispatch Order *</label>
                <select
                  value={formData.dispatch_order_id}
                  onChange={(e) => setFormData({ ...formData, dispatch_order_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-sm"
                  required
                >
                  <option value="">-- Choose Order --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.dispatch_order_number} — {o.customer_name} ({o.total_dispatched_quantity} PKT)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Total Cartons *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_cartons}
                    onChange={(e) => setFormData({ ...formData, total_cartons: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Gross Weight (KG) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_gross_weight_kg}
                    onChange={(e) => setFormData({ ...formData, total_gross_weight_kg: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Net Weight (KG) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_net_weight_kg}
                  onChange={(e) => setFormData({ ...formData, total_net_weight_kg: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Packing Remarks</label>
                <input
                  type="text"
                  value={formData.packing_remarks}
                  onChange={(e) => setFormData({ ...formData, packing_remarks: e.target.value })}
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Generate Packing Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
