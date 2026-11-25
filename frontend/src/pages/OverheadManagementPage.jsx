import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Gauge, PlusCircle, X, RefreshCw, ChevronRight } from 'lucide-react';

const API = '/api/costing';

const EMPTY_OVH = {
  category: 'FACTORY_RENT', description: '', expense_period_month: new Date().toISOString().slice(0, 7),
  amount: '', default_allocation_method: 'PER_UNIT_PRODUCED'
};
const EMPTY_ALLOC = {
  production_order_id: '', batch_number: '', overhead_category: 'FACTORY_RENT',
  allocation_method: 'PER_UNIT_PRODUCED', basis_value: '', allocation_rate: ''
};

export default function OverheadManagementPage() {
  const { token, user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canWrite = ['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role);

  const [overheads, setOverheads] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOvhModal, setShowOvhModal] = useState(false);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [ovhForm, setOvhForm] = useState(EMPTY_OVH);
  const [allocForm, setAllocForm] = useState(EMPTY_ALLOC);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [oRes, aRes] = await Promise.all([
        fetch(`${API}/overheads`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/allocations`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [oJson, aJson] = await Promise.all([oRes.json(), aRes.json()]);
      if (oJson.success) setOverheads(oJson.data || []);
      if (aJson.success) setAllocations(aJson.data || []);
      if (!oJson.success) setError(oJson.message || 'Failed to load overheads');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleOvhSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/overheads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...ovhForm, amount: parseFloat(ovhForm.amount) })
      });
      const json = await res.json();
      if (json.success) { setShowOvhModal(false); setOvhForm(EMPTY_OVH); fetchAll(); }
      else setError(json.message || 'Failed to save overhead');
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const handleAllocSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...allocForm,
          production_order_id: parseInt(allocForm.production_order_id),
          basis_value: parseFloat(allocForm.basis_value),
          allocation_rate: parseFloat(allocForm.allocation_rate),
        })
      });
      const json = await res.json();
      if (json.success) { setShowAllocModal(false); setAllocForm(EMPTY_ALLOC); fetchAll(); }
      else setError(json.message || 'Failed to save allocation');
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const allocPreview = allocForm.basis_value && allocForm.allocation_rate
    ? (parseFloat(allocForm.basis_value) * parseFloat(allocForm.allocation_rate)).toFixed(2) : null;

  const OVH_CATS = ['FACTORY_RENT', 'UTILITIES', 'MAINTENANCE', 'INDIRECT_LABOUR', 'OTHER'];
  const ALLOC_METHODS = ['PER_UNIT_PRODUCED', 'PER_MACHINE_HOUR', 'PERCENTAGE_OF_MATERIAL', 'DIRECT_ALLOCATION'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Gauge className="h-7 w-7 text-amber-500" /> Overhead & Allocation Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Configure manufacturing overhead pool and allocate to production orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="flex items-center gap-1 px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          {canWrite && (
            <>
              <button onClick={() => setShowOvhModal(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl">
                <PlusCircle className="h-4 w-4" /> Add Overhead
              </button>
              <button onClick={() => setShowAllocModal(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl">
                <ChevronRight className="h-4 w-4" /> Allocate
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overhead Pool */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-bold text-slate-700">Manufacturing Overhead Pool</h2>
          </div>
          {loading ? <div className="flex justify-center py-10"><div className="h-6 w-6 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div> : (
            <div className="divide-y divide-slate-50">
              {overheads.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-xs">No overhead entries found</p>
              ) : overheads.map((o, i) => (
                <div key={i} className="px-5 py-3 hover:bg-slate-50 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">{o.category}</span>
                    <div className="text-sm font-semibold text-slate-900 mt-1">{o.description}</div>
                    <div className="text-xs text-slate-400">{o.expense_period_month}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-amber-700">{fmt(o.amount)}</div>
                    <div className="text-[10px] text-slate-400">{o.default_allocation_method?.replace(/_/g, ' ')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Allocations */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-bold text-slate-700">Overhead Allocations (per Order)</h2>
          </div>
          {loading ? <div className="flex justify-center py-10"><div className="h-6 w-6 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-slate-100">
                  <tr>
                    {['Alloc No.', 'Category', 'Method', 'Basis × Rate', 'Allocated'].map(h => (
                      <th key={h} className="px-4 py-2 text-left font-bold text-slate-500 uppercase text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allocations.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-400">No allocations found</td></tr>
                  ) : allocations.map((a, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono text-slate-600">{a.allocation_number}</td>
                      <td className="px-4 py-2">
                        <span className="text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded">
                          {a.overhead_category}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-600">{a.allocation_method?.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2 text-slate-700">{a.basis_value} × ₹{a.allocation_rate}</td>
                      <td className="px-4 py-2 font-bold text-amber-700">{fmt(a.allocated_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Overhead Modal */}
      {showOvhModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-bold text-slate-900">Add Overhead Expense</h2>
              <button onClick={() => { setShowOvhModal(false); setOvhForm(EMPTY_OVH); setError(''); }}>
                <X className="h-5 w-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>
            <form onSubmit={handleOvhSubmit} className="p-6 space-y-4">
              {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs">{error}</div>}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select value={ovhForm.category} onChange={e => setOvhForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {OVH_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <input type="text" required value={ovhForm.description} onChange={e => setOvhForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Period (YYYY-MM) *</label>
                  <input type="month" required value={ovhForm.expense_period_month} onChange={e => setOvhForm(p => ({ ...p, expense_period_month: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input type="number" step="0.01" required value={ovhForm.amount} onChange={e => setOvhForm(p => ({ ...p, amount: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Allocation Method</label>
                <select value={ovhForm.default_allocation_method} onChange={e => setOvhForm(p => ({ ...p, default_allocation_method: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {ALLOC_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowOvhModal(false); setOvhForm(EMPTY_OVH); setError(''); }}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl">
                  {saving ? 'Saving...' : 'Add Overhead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Overhead Modal */}
      {showAllocModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-bold text-slate-900">Allocate Overhead to Order</h2>
              <button onClick={() => { setShowAllocModal(false); setAllocForm(EMPTY_ALLOC); setError(''); }}>
                <X className="h-5 w-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>
            <form onSubmit={handleAllocSubmit} className="p-6 space-y-4">
              {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Production Order ID *</label>
                  <input type="number" required value={allocForm.production_order_id} onChange={e => setAllocForm(p => ({ ...p, production_order_id: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number</label>
                  <input type="text" value={allocForm.batch_number} onChange={e => setAllocForm(p => ({ ...p, batch_number: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Overhead Category *</label>
                <select value={allocForm.overhead_category} onChange={e => setAllocForm(p => ({ ...p, overhead_category: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {OVH_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Allocation Method *</label>
                <select value={allocForm.allocation_method} onChange={e => setAllocForm(p => ({ ...p, allocation_method: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {ALLOC_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Basis Value *</label>
                  <input type="number" step="0.01" required value={allocForm.basis_value} onChange={e => setAllocForm(p => ({ ...p, basis_value: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. 3.5 (machine hrs)" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Allocation Rate (₹) *</label>
                  <input type="number" step="0.01" required value={allocForm.allocation_rate} onChange={e => setAllocForm(p => ({ ...p, allocation_rate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. 25.00 per hr" />
                </div>
              </div>
              {allocPreview && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs">
                  <span className="font-semibold text-amber-800">Allocated Amount: </span>
                  <span className="font-bold text-amber-900 text-sm">₹{allocPreview}</span>
                  <span className="text-amber-600 ml-2">({allocForm.basis_value} × ₹{allocForm.allocation_rate})</span>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowAllocModal(false); setAllocForm(EMPTY_ALLOC); setError(''); }}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl">
                  {saving ? 'Saving...' : 'Allocate Overhead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
