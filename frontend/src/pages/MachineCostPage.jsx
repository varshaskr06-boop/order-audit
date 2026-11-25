import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, PlusCircle, X, RefreshCw } from 'lucide-react';

const API = '/api/costing';

const EMPTY_FORM = {
  production_order_id: '', production_order_number: '', batch_number: '',
  machine_id: '', machine_name: '', operating_hours: '',
  electricity_consumption_kwh: '', electricity_rate: '8.50',
  maintenance_cost: '0', other_machine_expenses: '0',
  expense_date: new Date().toISOString().split('T')[0]
};

export default function MachineCostPage() {
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
      const res = await fetch(`${API}/machines`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setRecords(json.data || []);
      else setError(json.message || 'Failed to load machine costs');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const electricityCost = parseFloat(form.electricity_consumption_kwh || 0) * parseFloat(form.electricity_rate || 0);
  const totalCost = electricityCost + parseFloat(form.maintenance_cost || 0) + parseFloat(form.other_machine_expenses || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/machines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          production_order_id: parseInt(form.production_order_id),
          operating_hours: parseFloat(form.operating_hours || 0),
          electricity_consumption_kwh: parseFloat(form.electricity_consumption_kwh || 0),
          electricity_rate: parseFloat(form.electricity_rate || 0),
          maintenance_cost: parseFloat(form.maintenance_cost || 0),
          other_machine_expenses: parseFloat(form.other_machine_expenses || 0),
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false); setForm(EMPTY_FORM); fetchRecords();
      } else if (res.status === 409) {
        setError(`⚠️ Duplicate: ${json.message || 'Machine cost already recorded for this order/machine/date combination.'}`);
      } else {
        setError(json.message || 'Failed to save machine cost');
      }
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="h-7 w-7 text-amber-500" /> Machine & Electricity Costs
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track machine operating hours, electricity consumption and maintenance costs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchRecords} className="flex items-center gap-1 px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          {canWrite && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl">
              <PlusCircle className="h-4 w-4" /> Add Machine Expense
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
                  {['Entry No.', 'Order No.', 'Machine', 'Op. Hours', 'kWh', 'Power Cost', 'Maint.', 'Other', 'Total', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wide text-[11px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-slate-400">No machine cost records found</td></tr>
                ) : records.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-700">{r.entry_number}</td>
                    <td className="px-4 py-3 text-slate-700">{r.production_order_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{r.machine_name}</div>
                      <div className="text-slate-400 font-mono">{r.machine_id}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{r.operating_hours}h</td>
                    <td className="px-4 py-3 text-right">{r.electricity_consumption_kwh} kWh</td>
                    <td className="px-4 py-3 text-right text-orange-700">{fmt(r.electricity_cost)}</td>
                    <td className="px-4 py-3 text-right">{fmt(r.maintenance_cost)}</td>
                    <td className="px-4 py-3 text-right">{fmt(r.other_machine_expenses)}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-700">{fmt(r.total_machine_cost)}</td>
                    <td className="px-4 py-3 text-slate-500">{r.expense_date?.split('T')[0]}</td>
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
              <h2 className="text-base font-bold text-slate-900">Record Machine & Electricity Expense</h2>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setError(''); }}>
                <X className="h-5 w-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Production Order ID *', key: 'production_order_id', type: 'number', required: true },
                  { label: 'Production Order No.', key: 'production_order_number', type: 'text' },
                  { label: 'Batch Number', key: 'batch_number', type: 'text' },
                  { label: 'Machine ID *', key: 'machine_id', type: 'text', required: true, placeholder: 'e.g. ROASTER-01' },
                  { label: 'Machine Name *', key: 'machine_name', type: 'text', required: true, colSpan: true },
                  { label: 'Operating Hours', key: 'operating_hours', type: 'number', step: '0.5' },
                  { label: 'Electricity (kWh)', key: 'electricity_consumption_kwh', type: 'number', step: '0.1' },
                  { label: 'Rate per kWh (₹)', key: 'electricity_rate', type: 'number', step: '0.01' },
                  { label: 'Maintenance Cost (₹)', key: 'maintenance_cost', type: 'number', step: '0.01' },
                  { label: 'Other Expenses (₹)', key: 'other_machine_expenses', type: 'number', step: '0.01' },
                  { label: 'Expense Date *', key: 'expense_date', type: 'date', required: true },
                ].map(f => (
                  <div key={f.key} className={f.colSpan ? 'col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{f.label}</label>
                    <input
                      type={f.type} step={f.step} required={f.required} placeholder={f.placeholder}
                      value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                ))}
              </div>

              {/* Auto-calculated preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Electricity Cost:</span>
                  <span className="font-bold text-orange-700">₹{electricityCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Maintenance + Other:</span>
                  <span className="font-semibold">₹{(parseFloat(form.maintenance_cost || 0) + parseFloat(form.other_machine_expenses || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                  <span className="font-bold text-slate-800">Total Machine Cost:</span>
                  <span className="font-bold text-amber-700">₹{totalCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setError(''); }}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl">
                  {saving ? 'Saving...' : 'Save Machine Cost'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
