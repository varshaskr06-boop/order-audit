import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Percent, PlusCircle, RefreshCw, X, AlertTriangle, ShieldCheck
} from 'lucide-react';

const API = '/api/invoicing';

export default function TaxRatesPage() {
  const { token, user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canEdit = ['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role);

  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    tax_name: '',
    hsn_code: '2106',
    product_category: 'Fresh Batter',
    gst_rate: '5',
    cess_rate: '0',
    notes: ''
  });

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/tax-rates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setRates(json.data || []);
      else setError(json.message || 'Failed to fetch tax rates');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/tax-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          gst_rate: parseFloat(form.gst_rate),
          cess_rate: parseFloat(form.cess_rate || 0)
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setForm({ tax_name: '', hsn_code: '2106', product_category: 'Fresh Batter', gst_rate: '5', cess_rate: '0', notes: '' });
        fetchRates();
      } else {
        setError(json.message || 'Failed to save tax rate');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Percent className="h-7 w-7 text-amber-500" /> GST Tax Rates Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">Configurable Indian GST rates per HSN chapter with automated CGST/SGST/IGST splitting</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchRates}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          {canEdit && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm"
            >
              <PlusCircle className="h-4 w-4" /> Add Tax Rate
            </button>
          )}
        </div>
      </div>

      {error && !showModal && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Notice box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong>Statutory Rate Splitting Policy:</strong> In accordance with the Central GST Act, intra-state supplies automatically divide the total GST rate equally between <strong>CGST (50%)</strong> and <strong>SGST (50%)</strong>, whereas inter-state supplies assess the integrated <strong>IGST (100%)</strong>. Rates must reflect the food product category classification.
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3 text-left">Tax Configuration Name</th>
                  <th className="px-5 py-3 text-left">HSN Code</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-right">GST Rate</th>
                  <th className="px-5 py-3 text-right">CGST</th>
                  <th className="px-5 py-3 text-right">SGST</th>
                  <th className="px-5 py-3 text-right">IGST</th>
                  <th className="px-5 py-3 text-left">Effective Date</th>
                  <th className="px-5 py-3 text-left">Audit Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rates.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-semibold text-slate-900">{r.tax_name}</td>
                    <td className="px-5 py-3 font-mono font-bold text-amber-700">{r.hsn_code}</td>
                    <td className="px-5 py-3 text-slate-600">{r.product_category}</td>
                    <td className="px-5 py-3 text-right font-black text-slate-900">{r.gst_rate}%</td>
                    <td className="px-5 py-3 text-right text-slate-700">{r.cgst_rate}%</td>
                    <td className="px-5 py-3 text-right text-slate-700">{r.sgst_rate}%</td>
                    <td className="px-5 py-3 text-right font-bold text-amber-800">{r.igst_rate}%</td>
                    <td className="px-5 py-3 text-slate-500">{r.effective_date?.split('T')[0]}</td>
                    <td className="px-5 py-3 text-slate-500 italic">{r.notes || '—'}</td>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-bold text-slate-900">Add Tax Rate Configuration</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Configuration Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Food Batter (5%)"
                  value={form.tax_name}
                  onChange={e => setForm(p => ({ ...p, tax_name: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HSN Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2106"
                    value={form.hsn_code}
                    onChange={e => setForm(p => ({ ...p, hsn_code: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Rate % *</label>
                  <select
                    value={form.gst_rate}
                    onChange={e => setForm(p => ({ ...p, gst_rate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% (Batter, Basic Foods)</option>
                    <option value="12">12% (Savories, Namkeen)</option>
                    <option value="18">18% (Branded Packaging)</option>
                    <option value="28">28% (Luxury / Aerated)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Category</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Batter, Traditional Savories"
                  value={form.product_category}
                  onChange={e => setForm(p => ({ ...p, product_category: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Notes / Legal Ref</label>
                <textarea
                  rows="2"
                  placeholder="Notification details or FSSAI exemption rationale..."
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl"
                >
                  {saving ? 'Saving...' : 'Save Tax Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
