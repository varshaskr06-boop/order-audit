import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  RotateCcw, Search, PlusCircle, RefreshCw, AlertTriangle,
  ShieldAlert, CheckCircle2, X, Box
} from 'lucide-react';

const API = '/api/dispatch';

export default function DeliveryReturnsPage() {
  const { token, user } = useAuth();
  const [returns, setReturns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const role = (user?.role || '').toUpperCase();
  const canCreateReturn = ['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role);

  const [formData, setFormData] = useState({
    dispatch_order_id: '',
    return_reason: 'TRANSIT_DAMAGE',
    reason_description: 'Outer carton crushed; product pouch seal punctured in transit',
    total_returned_quantity: 2,
    total_damaged_quantity: 2
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rRes, oRes] = await Promise.all([
        fetch(`${API}/returns`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const rJson = await rRes.json();
      const oJson = await oRes.json();
      if (rJson.success) setReturns(rJson.data);
      if (oJson.success) {
        setOrders(oJson.data);
        if (oJson.data.length > 0) {
          setFormData(prev => ({ ...prev, dispatch_order_id: oJson.data[0].id }));
        }
      }
    } catch (e) {
      setError('Network error loading returns');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dispatch_order_id) {
      setError('Please select an original dispatch order.');
      return;
    }

    try {
      const res = await fetch(`${API}/returns`, {
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
              batch_number: 'FG-BAT-260320-A',
              returned_quantity: Number(formData.total_returned_quantity),
              damaged_quantity: Number(formData.total_damaged_quantity),
              unit_price: 60.00
            }
          ]
        })
      });

      const json = await res.json();
      if (json.success) {
        setSuccess(`Return record ${json.data?.return_number} logged! Status: QUARANTINED (Pending QC Inspection).`);
        setModalOpen(false);
        fetchData();
      } else {
        setError(json.message || 'Failed to record return');
      }
    } catch (e) {
      setError('Network error recording return');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Returns &amp; Damaged Goods</h1>
          <p className="text-sm text-slate-500">
            Module 8: Reverse Logistics, Transit Damages, Quarantine Isolation &amp; QC Disposition
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {canCreateReturn && (
            <button
              onClick={() => { setModalOpen(true); setError(''); setSuccess(''); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition"
            >
              <PlusCircle className="h-4 w-4" /> Log Customer Return
            </button>
          )}
        </div>
      </div>

      {/* Safety Quarantine Banner */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
        <div className="text-xs text-orange-900 space-y-1">
          <p className="font-bold">FOOD SAFETY AUDIT DIRECTIVE: QUARANTINED ISOLATION REQUIRED</p>
          <p>
            All returned batches enter a strict <b>QUARANTINED</b> status. Under FSSAI standards, customer returns are <b>NEVER</b> restocked directly into usable inventory. Restocking requires prior Phase 8 Quality Control lab inspection and authorized microbiological clearance.
          </p>
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

      {/* Returns Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3">Return #</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Customer Name</th>
                <th className="px-6 py-3">Reason</th>
                <th className="px-6 py-3 text-right">Returned Qty</th>
                <th className="px-6 py-3 text-right">Damaged Qty</th>
                <th className="px-6 py-3">Inspection Status</th>
                <th className="px-6 py-3">Restocked?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    Loading return records...
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    No customer returns logged yet.
                  </td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-semibold text-orange-700 font-mono text-xs">
                      {r.return_number}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {r.return_date}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {r.customer_name}
                    </td>
                    <td className="px-6 py-3 text-xs">
                      <span className="font-semibold text-slate-800">{r.return_reason}</span>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">{r.reason_description}</p>
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-slate-900">
                      {r.total_returned_quantity} PKT
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-rose-600">
                      {r.total_damaged_quantity} PKT
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                        {r.inspection_status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs">
                      {r.restocked_to_inventory ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Yes (Approved)
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold">
                          No (Isolated)
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Return Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-orange-600" />
                Log Customer Return / Transit Damage
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Original Dispatch Order *</label>
                <select
                  value={formData.dispatch_order_id}
                  onChange={(e) => setFormData({ ...formData, dispatch_order_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-sm"
                  required
                >
                  <option value="">-- Choose Order --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.dispatch_order_number} — {o.customer_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Return Reason Code *</label>
                <select
                  value={formData.return_reason}
                  onChange={(e) => setFormData({ ...formData, return_reason: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-sm"
                >
                  <option value="TRANSIT_DAMAGE">TRANSIT DAMAGE (Outer package / pouch puncture)</option>
                  <option value="EXPIRED_SHELF_LIFE">EXPIRED SHELF LIFE (Short shelf life received)</option>
                  <option value="PACKAGING_LEAKAGE">PACKAGING LEAKAGE (Heat seal defect)</option>
                  <option value="CUSTOMER_REJECTION">CUSTOMER REJECTION (Over-ordered by buyer)</option>
                  <option value="TEMPERATURE_ABUSE">TEMPERATURE ABUSE (Cold chain break during transit)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Total Returned Qty (PKT) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_returned_quantity}
                    onChange={(e) => setFormData({ ...formData, total_returned_quantity: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Damaged Qty (PKT)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.total_damaged_quantity}
                    onChange={(e) => setFormData({ ...formData, total_damaged_quantity: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Damage Description / Root Cause</label>
                <textarea
                  rows="2"
                  value={formData.reason_description}
                  onChange={(e) => setFormData({ ...formData, reason_description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
                ⚠️ This item will be flagged as <b>QUARANTINED</b> upon creation. Stock is NOT restored to central inventory until Quality approves.
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
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Log Quarantined Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
