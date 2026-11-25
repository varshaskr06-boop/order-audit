import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { DollarSign, PlusCircle, X, RefreshCw, CheckCircle, XCircle, Calculator } from 'lucide-react';

const API = '/api/costing';

const EMPTY_FORM = {
  product_id: '', product_sku: '', product_name: '', uom: '',
  unit_manufacturing_cost: '', target_profit_margin_pct: '30',
  approved_selling_price: '', gst_rate_pct: '5',
  notes: ''
};

const STATUS_STYLES = {
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
};

export default function SellingPricePage() {
  const { token, user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canCreate = ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'].includes(role);
  const canApprove = ['ADMIN', 'OWNER'].includes(role);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [suggested, setSuggested] = useState(null);
  const [sugLoading, setSugLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/selling-prices`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setRecords(json.data || []);
      else setError(json.message || 'Failed to load selling prices');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const fetchSuggested = async () => {
    if (!form.product_id || !form.target_profit_margin_pct) return;
    setSugLoading(true); setSuggested(null);
    try {
      const res = await fetch(`${API}/selling-prices/suggested/${form.product_id}?target_margin_pct=${form.target_profit_margin_pct}`,
        { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setSuggested(json.data);
    } catch {}
    finally { setSugLoading(false); }
  };

  const gstAmount = form.approved_selling_price && form.gst_rate_pct
    ? (parseFloat(form.approved_selling_price) * parseFloat(form.gst_rate_pct) / 100).toFixed(2) : null;
  const finalPrice = gstAmount
    ? (parseFloat(form.approved_selling_price) + parseFloat(gstAmount)).toFixed(2) : null;
  const profit = form.approved_selling_price && form.unit_manufacturing_cost
    ? (parseFloat(form.approved_selling_price) - parseFloat(form.unit_manufacturing_cost)).toFixed(2) : null;

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/selling-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          product_id: parseInt(form.product_id),
          unit_manufacturing_cost: parseFloat(form.unit_manufacturing_cost),
          target_profit_margin_pct: parseFloat(form.target_profit_margin_pct),
          approved_selling_price: parseFloat(form.approved_selling_price),
          gst_rate_pct: parseFloat(form.gst_rate_pct),
        })
      });
      const json = await res.json();
      if (json.success) { setShowModal(false); setForm(EMPTY_FORM); setSuggested(null); fetchRecords(); }
      else setError(json.message || 'Failed to save selling price');
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (id, status) => {
    const notes = status === 'REJECTED' ? prompt('Reason for rejection (optional):') : 'Approved';
    try {
      const res = await fetch(`${API}/selling-prices/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, notes: notes || '' })
      });
      const json = await res.json();
      if (json.success) fetchRecords();
      else alert(json.message || 'Failed to update status');
    } catch { alert('Network error'); }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-amber-500" /> Selling Price & GST Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Configure product selling prices with GST separation and approval workflow</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchRecords} className="flex items-center gap-1 px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          {canCreate && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl">
              <PlusCircle className="h-4 w-4" /> New Selling Price
            </button>
          )}
        </div>
      </div>

      {error && !showModal && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800">
        <strong>GST is excluded from manufacturing cost.</strong> GST is a statutory pass-through shown separately for reference only.
        {!canApprove && <span className="ml-2 text-blue-600">Prices created by you will be in <strong>PENDING_APPROVAL</strong> status until approved by ADMIN or OWNER.</span>}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Product', 'Mfg Cost', 'Selling Price', 'GST%', 'GST Amt', 'Final Price', 'Profit/Unit', 'Margin%', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wide text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-slate-400">No selling price records found</td></tr>
                ) : records.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{r.product_name}</div>
                      <div className="text-slate-400 font-mono">{r.product_sku}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{fmt(r.unit_manufacturing_cost)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{fmt(r.approved_selling_price)}</td>
                    <td className="px-4 py-3 text-right">{r.gst_rate_pct}%</td>
                    <td className="px-4 py-3 text-right text-slate-500">{fmt(r.gst_amount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">{fmt(r.final_price_with_gst)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmt(r.expected_profit_per_unit)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${r.target_profit_margin_pct < 15 ? 'text-rose-600' : r.target_profit_margin_pct < 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {r.target_profit_margin_pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${STATUS_STYLES[r.status] || 'bg-slate-100 text-slate-600'}`}>
                        {r.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canApprove && r.status === 'PENDING_APPROVAL' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleStatusChange(r.id, 'APPROVED')}
                            className="p-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700" title="Approve">
                            <CheckCircle className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleStatusChange(r.id, 'REJECTED')}
                            className="p-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700" title="Reject">
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
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
              <h2 className="text-base font-bold text-slate-900">Configure Selling Price</h2>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setSuggested(null); setError(''); }}>
                <X className="h-5 w-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Product ID *', key: 'product_id', type: 'number', required: true },
                  { label: 'Product SKU', key: 'product_sku', type: 'text' },
                  { label: 'Product Name *', key: 'product_name', type: 'text', required: true, colSpan: true },
                  { label: 'UOM', key: 'uom', type: 'text', placeholder: 'e.g. Pouch, Kg' },
                  { label: 'Mfg Cost (₹) *', key: 'unit_manufacturing_cost', type: 'number', step: '0.01', required: true },
                  { label: 'Target Margin %', key: 'target_profit_margin_pct', type: 'number', step: '0.01' },
                ].map(fi => (
                  <div key={fi.key} className={fi.colSpan ? 'col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{fi.label}</label>
                    <input type={fi.type} step={fi.step} required={fi.required} placeholder={fi.placeholder}
                      value={form[fi.key]} onChange={e => setForm(p => ({ ...p, [fi.key]: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                ))}
              </div>

              {/* Suggested Price Calculator */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1"><Calculator className="h-3.5 w-3.5" /> Suggested Price Calculator</span>
                  <button type="button" onClick={fetchSuggested} disabled={sugLoading}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 disabled:opacity-50">
                    {sugLoading ? 'Calculating...' : 'Calculate'}
                  </button>
                </div>
                {suggested && (
                  <div className="text-xs text-slate-700 space-y-1">
                    <div>Suggested Price: <span className="font-bold text-amber-800">₹{suggested.suggested_selling_price}</span></div>
                    <div>Expected Profit: <span className="font-bold text-emerald-700">₹{suggested.expected_profit_per_unit}</span></div>
                    <button type="button" onClick={() => setForm(p => ({ ...p, approved_selling_price: suggested.suggested_selling_price }))}
                      className="text-xs text-blue-600 hover:underline">Use this price →</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Approved Selling Price (₹) *</label>
                  <input type="number" step="0.01" required value={form.approved_selling_price}
                    onChange={e => setForm(p => ({ ...p, approved_selling_price: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Rate %</label>
                  <input type="number" step="0.01" value={form.gst_rate_pct}
                    onChange={e => setForm(p => ({ ...p, gst_rate_pct: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>

              {/* GST Live Preview */}
              {gstAmount && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs space-y-1">
                  <div className="flex justify-between"><span>Selling Price (excl. GST):</span><span className="font-bold">₹{parseFloat(form.approved_selling_price).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>GST ({form.gst_rate_pct}%):</span><span className="font-bold text-blue-700">₹{gstAmount}</span></div>
                  <div className="flex justify-between border-t pt-1"><span className="font-bold">Final Price (with GST):</span><span className="font-bold text-blue-800">₹{finalPrice}</span></div>
                  {profit && <div className="flex justify-between"><span>Expected Profit/Unit:</span><span className="font-bold text-emerald-700">₹{profit}</span></div>}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setSuggested(null); setError(''); }}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl">
                  {saving ? 'Saving...' : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
