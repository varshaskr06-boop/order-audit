import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingDown, PlusCircle, X, RefreshCw } from 'lucide-react';

const API = '/api/costing';

const EMPTY_FORM = {
  production_order_id: '', batch_number: '',
  planned_material_cost: '', actual_material_cost: '',
  planned_labour_cost: '', actual_labour_cost: '',
  planned_overhead_cost: '', actual_overhead_cost: '',
  investigation_notes: ''
};

export default function CostVariancePage() {
  const { token, user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canWrite = ['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterOrder, setFilterOrder] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const qs = filterOrder ? `?production_order_id=${filterOrder}` : '';
      const res = await fetch(`${API}/variances${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setRecords(json.data || []);
      else setError(json.message || 'Failed to load variances');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [token, filterOrder]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const f = form;
  const matVar = (parseFloat(f.actual_material_cost || 0) - parseFloat(f.planned_material_cost || 0));
  const labVar = (parseFloat(f.actual_labour_cost || 0) - parseFloat(f.planned_labour_cost || 0));
  const ovhVar = (parseFloat(f.actual_overhead_cost || 0) - parseFloat(f.planned_overhead_cost || 0));
  const totalVar = matVar + labVar + ovhVar;

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/variances/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          production_order_id: parseInt(form.production_order_id),
          batch_number: form.batch_number,
          planned_material_cost: parseFloat(form.planned_material_cost || 0),
          actual_material_cost: parseFloat(form.actual_material_cost || 0),
          planned_labour_cost: parseFloat(form.planned_labour_cost || 0),
          actual_labour_cost: parseFloat(form.actual_labour_cost || 0),
          planned_overhead_cost: parseFloat(form.planned_overhead_cost || 0),
          actual_overhead_cost: parseFloat(form.actual_overhead_cost || 0),
          investigation_notes: form.investigation_notes,
        })
      });
      const json = await res.json();
      if (json.success) { setShowModal(false); setForm(EMPTY_FORM); fetchRecords(); }
      else setError(json.message || 'Failed to calculate variance');
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const varColor = (v) => v > 0 ? 'text-rose-600' : v < 0 ? 'text-emerald-600' : 'text-slate-500';
  const varLabel = (v) => v > 0 ? '▲ Unfav.' : v < 0 ? '▼ Fav.' : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingDown className="h-7 w-7 text-amber-500" /> Planned vs Actual Cost Variance
          </h1>
          <p className="text-sm text-slate-500 mt-1">Analyze deviations between standard and actual manufacturing costs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchRecords} className="flex items-center gap-1 px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          {canWrite && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl">
              <PlusCircle className="h-4 w-4" /> Calculate Variance
            </button>
          )}
        </div>
      </div>

      {error && !showModal && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <input type="number" placeholder="Filter by Order ID..." value={filterOrder}
          onChange={e => setFilterOrder(e.target.value)}
          className="border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 w-48" />
        {filterOrder && <button onClick={() => setFilterOrder('')} className="text-xs text-slate-500 hover:text-slate-800">Clear</button>}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase">Order / Batch</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-600 uppercase">Planned Mat.</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-600 uppercase">Actual Mat.</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-600 uppercase">Mat. Var.</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-600 uppercase">Planned Lab.</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-600 uppercase">Actual Lab.</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-600 uppercase">Lab. Var.</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-600 uppercase">Total Var.</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-slate-400">No variance records found</td></tr>
                ) : records.map((r, i) => (
                  <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50 ${r.variance_status === 'UNFAVORABLE' ? 'bg-rose-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">Order #{r.production_order_id}</div>
                      <div className="text-slate-400 font-mono">{r.batch_number}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{fmt(r.planned_material_cost)}</td>
                    <td className="px-4 py-3 text-right">{fmt(r.actual_material_cost)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${varColor(r.material_variance)}`}>
                      {fmt(Math.abs(r.material_variance))} <span className="text-[10px]">{varLabel(r.material_variance)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{fmt(r.planned_labour_cost)}</td>
                    <td className="px-4 py-3 text-right">{fmt(r.actual_labour_cost)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${varColor(r.labour_variance)}`}>
                      {fmt(Math.abs(r.labour_variance))} <span className="text-[10px]">{varLabel(r.labour_variance)}</span>
                    </td>
                    <td className={`px-4 py-3 text-right font-bold text-sm ${varColor(r.total_cost_variance)}`}>
                      {fmt(Math.abs(r.total_cost_variance))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${r.variance_status === 'UNFAVORABLE' ? 'bg-rose-100 text-rose-700' : r.variance_status === 'FAVORABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {r.variance_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-bold text-slate-900">Calculate Cost Variance</h2>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setError(''); }}>
                <X className="h-5 w-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Production Order ID *</label>
                  <input type="number" required value={form.production_order_id} onChange={e => setForm(p => ({ ...p, production_order_id: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number *</label>
                  <input type="text" required value={form.batch_number} onChange={e => setForm(p => ({ ...p, batch_number: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>

              {/* Planned vs Actual side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 space-y-3">
                  <h3 className="text-xs font-bold text-slate-600">📋 Planned Costs</h3>
                  {[{ label: 'Material', key: 'planned_material_cost' }, { label: 'Labour', key: 'planned_labour_cost' }, { label: 'Overhead', key: 'planned_overhead_cost' }].map(fi => (
                    <div key={fi.key}>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">{fi.label} (₹)</label>
                      <input type="number" step="0.01" value={form[fi.key]} onChange={e => setForm(p => ({ ...p, [fi.key]: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="0.00" />
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 rounded-xl p-3 space-y-3">
                  <h3 className="text-xs font-bold text-amber-800">✅ Actual Costs</h3>
                  {[{ label: 'Material', key: 'actual_material_cost' }, { label: 'Labour', key: 'actual_labour_cost' }, { label: 'Overhead', key: 'actual_overhead_cost' }].map(fi => (
                    <div key={fi.key}>
                      <label className="block text-[11px] font-semibold text-amber-700 mb-1">{fi.label} (₹)</label>
                      <input type="number" step="0.01" value={form[fi.key]} onChange={e => setForm(p => ({ ...p, [fi.key]: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="0.00" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Live variance preview */}
              {(form.planned_material_cost || form.actual_material_cost) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Material Variance:</span>
                    <span className={`font-bold ${varColor(matVar)}`}>{matVar >= 0 ? '+' : ''}{fmt(matVar)} {varLabel(matVar)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Labour Variance:</span>
                    <span className={`font-bold ${varColor(labVar)}`}>{labVar >= 0 ? '+' : ''}{fmt(labVar)} {varLabel(labVar)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overhead Variance:</span>
                    <span className={`font-bold ${varColor(ovhVar)}`}>{ovhVar >= 0 ? '+' : ''}{fmt(ovhVar)} {varLabel(ovhVar)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-bold">
                    <span>Total Variance:</span>
                    <span className={`text-sm ${varColor(totalVar)}`}>{totalVar >= 0 ? '+' : ''}{fmt(totalVar)} — {totalVar > 0 ? '⚠️ UNFAVORABLE' : totalVar < 0 ? '✅ FAVORABLE' : 'ON BUDGET'}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Investigation Notes</label>
                <textarea rows={2} value={form.investigation_notes} onChange={e => setForm(p => ({ ...p, investigation_notes: e.target.value }))}
                  placeholder="Root cause, corrective actions..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setError(''); }}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl">
                  {saving ? 'Calculating...' : 'Calculate Variance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
