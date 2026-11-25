import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, PlusCircle, X, RefreshCw } from 'lucide-react';

const API = '/api/costing';

const EMPTY_FORM = {
  production_order_id: '', production_order_number: '', batch_number: '',
  worker_name: '', labour_category: 'DIRECT', operation_name: '',
  working_hours: '', hourly_rate: '', work_date: new Date().toISOString().split('T')[0], shift: 'MORNING'
};

export default function LabourCostPage() {
  const { token, user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canWrite = ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');

  const fetchRecords = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/labour`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setRecords(json.data || []);
      else setError(json.message || 'Failed to load labour costs');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/labour`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          production_order_id: parseInt(form.production_order_id),
          working_hours: parseFloat(form.working_hours),
          hourly_rate: parseFloat(form.hourly_rate),
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false); setForm(EMPTY_FORM); fetchRecords();
      } else {
        setError(json.message || 'Failed to save labour cost');
      }
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const filtered = filterCategory === 'ALL' ? records : records.filter(r => r.labour_category === filterCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-amber-500" /> Labour Cost Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track direct & indirect labour costs for each production order</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchRecords} className="flex items-center gap-1 px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          {canWrite && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl">
              <PlusCircle className="h-4 w-4" /> Log Labour Cost
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      {/* Filter */}
      <div className="flex gap-2">
        {['ALL', 'DIRECT', 'INDIRECT'].map(cat => (
          <button key={cat} onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg ${filterCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {cat}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Entry No.', 'Order No.', 'Worker', 'Category', 'Operation', 'Hours', 'Rate/Hr', 'Total Cost', 'Date', 'Shift'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wide text-[11px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-slate-400">No labour cost records found</td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-700">{r.entry_number}</td>
                    <td className="px-4 py-3 text-slate-700">{r.production_order_number}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.worker_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${r.labour_category === 'DIRECT' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>
                        {r.labour_category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.operation_name}</td>
                    <td className="px-4 py-3 text-right font-mono">{r.working_hours}h</td>
                    <td className="px-4 py-3 text-right">{fmt(r.hourly_rate)}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-700">{fmt(r.total_labour_cost)}</td>
                    <td className="px-4 py-3 text-slate-500">{r.work_date?.split('T')[0]}</td>
                    <td className="px-4 py-3 text-slate-500">{r.shift}</td>
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Log Labour Cost Entry</h2>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setError(''); }}>
                <X className="h-5 w-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Production Order ID', key: 'production_order_id', type: 'number', required: true },
                  { label: 'Production Order No.', key: 'production_order_number', type: 'text' },
                  { label: 'Batch Number', key: 'batch_number', type: 'text' },
                  { label: 'Worker Name', key: 'worker_name', type: 'text', required: true },
                  { label: 'Operation', key: 'operation_name', type: 'text', required: true },
                  { label: 'Working Hours', key: 'working_hours', type: 'number', step: '0.5', required: true },
                  { label: 'Hourly Rate (₹)', key: 'hourly_rate', type: 'number', step: '0.01', required: true },
                  { label: 'Work Date', key: 'work_date', type: 'date', required: true },
                ].map(f => (
                  <div key={f.key} className={f.key === 'worker_name' || f.key === 'operation_name' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{f.label}{f.required && ' *'}</label>
                    <input
                      type={f.type} step={f.step} required={f.required}
                      value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Labour Category *</label>
                  <select value={form.labour_category} onChange={e => setForm(p => ({ ...p, labour_category: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="DIRECT">DIRECT</option>
                    <option value="INDIRECT">INDIRECT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shift</label>
                  <select value={form.shift} onChange={e => setForm(p => ({ ...p, shift: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {form.working_hours && form.hourly_rate && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
                  <span className="font-semibold text-amber-800">Estimated Cost: </span>
                  <span className="font-bold text-amber-900">₹{(parseFloat(form.working_hours) * parseFloat(form.hourly_rate)).toFixed(2)}</span>
                  <span className="text-amber-600 text-xs ml-2">({form.working_hours}h × ₹{form.hourly_rate}/hr)</span>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setError(''); }}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl">
                  {saving ? 'Saving...' : 'Log Labour Cost'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
