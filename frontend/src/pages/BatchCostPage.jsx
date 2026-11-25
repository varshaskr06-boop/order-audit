import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, PlusCircle, X, RefreshCw, AlertTriangle } from 'lucide-react';

const API = '/api/costing';

const EMPTY_FORM = {
  production_order_id: '', production_order_number: '', batch_number: '',
  product_id: '', product_sku: '', product_name: '', uom: 'Kg',
  raw_material_cost: '', packaging_material_cost: '',
  direct_labour_cost: '', machine_cost: '', electricity_cost: '', overhead_cost: '',
  produced_quantity: '', accepted_quantity: '', rejected_quantity: ''
};

export default function BatchCostPage() {
  const { token, user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canWrite = ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/batches`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setRecords(json.data || []);
      else setError(json.message || 'Failed to load batch costs');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const f = form;
  const totalCost = [f.raw_material_cost, f.packaging_material_cost, f.direct_labour_cost, f.machine_cost, f.electricity_cost, f.overhead_cost]
    .reduce((s, v) => s + parseFloat(v || 0), 0);
  const unitCost = f.accepted_quantity > 0 ? totalCost / parseFloat(f.accepted_quantity) : 0;
  const rejCost = f.produced_quantity > 0 ? (totalCost / parseFloat(f.produced_quantity)) * parseFloat(f.rejected_quantity || 0) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/batches/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          production_order_id: parseInt(form.production_order_id),
          product_id: parseInt(form.product_id),
          raw_material_cost: parseFloat(form.raw_material_cost || 0),
          packaging_material_cost: parseFloat(form.packaging_material_cost || 0),
          direct_labour_cost: parseFloat(form.direct_labour_cost || 0),
          machine_cost: parseFloat(form.machine_cost || 0),
          electricity_cost: parseFloat(form.electricity_cost || 0),
          overhead_cost: parseFloat(form.overhead_cost || 0),
          produced_quantity: parseFloat(form.produced_quantity),
          accepted_quantity: parseFloat(form.accepted_quantity),
          rejected_quantity: parseFloat(form.rejected_quantity || 0),
        })
      });
      const json = await res.json();
      if (json.success) { setShowModal(false); setForm(EMPTY_FORM); fetchRecords(); }
      else if (res.status === 409) setError(`⚠️ Duplicate: ${json.message}`);
      else setError(json.message || 'Failed to calculate batch cost');
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const costItems = [
    { label: 'Raw Materials', key: 'raw_material_cost', color: 'bg-emerald-500' },
    { label: 'Packaging', key: 'packaging_material_cost', color: 'bg-blue-500' },
    { label: 'Labour', key: 'direct_labour_cost', color: 'bg-violet-500' },
    { label: 'Machine', key: 'machine_cost', color: 'bg-orange-500' },
    { label: 'Electricity', key: 'electricity_cost', color: 'bg-yellow-500' },
    { label: 'Overhead', key: 'overhead_cost', color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-7 w-7 text-amber-500" /> Batch Cost Calculation
          </h1>
          <p className="text-sm text-slate-500 mt-1">Calculate total manufacturing cost per production batch including all 6 cost components</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchRecords} className="flex items-center gap-1 px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          {canWrite && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl">
              <PlusCircle className="h-4 w-4" /> Calculate Batch Cost
            </button>
          )}
        </div>
      </div>

      {error && !showModal && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Batch No.', 'Product', 'RM+PKG', 'Labour', 'Mach+Power', 'Overhead', 'Total Cost', 'Produced', 'Accepted', 'Cost/Unit', 'Rej. Waste'].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-bold text-slate-600 uppercase tracking-wide text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-12 text-slate-400">No batch cost records found</td></tr>
                ) : records.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-3 py-3 font-mono text-slate-700 text-[10px]">{r.batch_number}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900">{r.product_name}</td>
                    <td className="px-3 py-3 text-right">{fmt((r.raw_material_cost || 0) + (r.packaging_material_cost || 0))}</td>
                    <td className="px-3 py-3 text-right">{fmt(r.direct_labour_cost)}</td>
                    <td className="px-3 py-3 text-right">{fmt((r.machine_cost || 0) + (r.electricity_cost || 0))}</td>
                    <td className="px-3 py-3 text-right">{fmt(r.overhead_cost)}</td>
                    <td className="px-3 py-3 text-right font-bold text-amber-700">{fmt(r.total_batch_cost)}</td>
                    <td className="px-3 py-3 text-right">{r.produced_quantity}</td>
                    <td className="px-3 py-3 text-right text-emerald-700 font-semibold">{r.accepted_quantity}</td>
                    <td className="px-3 py-3 text-right font-bold text-blue-700">{fmt(r.cost_per_accepted_unit)}</td>
                    <td className="px-3 py-3 text-right text-rose-600">{fmt(r.rejection_wastage_cost)}</td>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-bold text-slate-900">Calculate Total Batch Production Cost</h2>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setError(''); }}>
                <X className="h-5 w-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}

              {/* Identification */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Batch Identification</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Production Order ID *', key: 'production_order_id', type: 'number' },
                    { label: 'Order No.', key: 'production_order_number', type: 'text' },
                    { label: 'Batch Number *', key: 'batch_number', type: 'text' },
                    { label: 'Product ID *', key: 'product_id', type: 'number' },
                    { label: 'Product SKU', key: 'product_sku', type: 'text' },
                    { label: 'UOM', key: 'uom', type: 'text' },
                  ].map(fi => (
                    <div key={fi.key}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">{fi.label}</label>
                      <input type={fi.type} value={form[fi.key]}
                        required={fi.label.includes('*')}
                        onChange={e => setForm(p => ({ ...p, [fi.key]: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                  ))}
                  <div className="col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
                    <input type="text" required value={form.product_name}
                      onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                </div>
              </div>

              {/* Cost Components */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Cost Components (₹)</h3>
                <div className="grid grid-cols-3 gap-3">
                  {costItems.map(c => (
                    <div key={c.key}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full ${c.color}`} />{c.label}
                      </label>
                      <input type="number" step="0.01" min="0" value={form[c.key]}
                        onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="0.00" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantities */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Production Quantities</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Produced Qty *', key: 'produced_quantity' },
                    { label: 'Accepted Qty *', key: 'accepted_quantity' },
                    { label: 'Rejected Qty', key: 'rejected_quantity' },
                  ].map(q => (
                    <div key={q.key}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">{q.label}</label>
                      <input type="number" step="0.01" min="0" required={q.label.includes('*')} value={form[q.key]}
                        onChange={e => setForm(p => ({ ...p, [q.key]: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {totalCost > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-800 text-sm border-b pb-2">
                    <span>Total Batch Cost</span><span className="text-amber-700">₹{totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cost per Accepted Unit</span>
                    <span className="font-bold text-blue-700">₹{unitCost.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Rejection Wastage Cost</span>
                    <span className="font-bold text-rose-600">₹{rejCost.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setError(''); }}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl">
                  {saving ? 'Calculating...' : 'Calculate & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
