import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2, Save, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck
} from 'lucide-react';

const API = '/api/invoicing';

export default function CompanyTaxProfilePage() {
  const { token, user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canEdit = ['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role);

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/company-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setForm(json.data);
      else setError(json.message || 'Failed to fetch company profile');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API}/company-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        setSuccess('Company GST Tax Profile updated successfully');
        setForm(json.data);
      } else {
        setError(json.message || 'Failed to update profile');
      }
    } catch {
      setError('Network error saving profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-7 w-7 text-amber-500" /> Company GST Profile & Statutory Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">Configurable enterprise identity, GSTIN, invoice sequence prefix and bank particulars</p>
        </div>
        <button
          onClick={fetchProfile}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reload
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
        {/* Business Identity */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">
            1. Registered Enterprise Identity
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Entity Name *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={form.legal_name || ''}
                onChange={e => setForm(p => ({ ...p, legal_name: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trade Name *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={form.trade_name || ''}
                onChange={e => setForm(p => ({ ...p, trade_name: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN (15 Digits) *</label>
              <input
                type="text"
                required
                maxLength="15"
                disabled={!canEdit}
                value={form.gstin || ''}
                onChange={e => setForm(p => ({ ...p, gstin: e.target.value.toUpperCase() }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Permanent Account Number (PAN) *</label>
              <input
                type="text"
                required
                maxLength="10"
                disabled={!canEdit}
                value={form.pan || ''}
                onChange={e => setForm(p => ({ ...p, pan: e.target.value.toUpperCase() }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Registered Address */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">
            2. Registered Business Address
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address Line 1 *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={form.address_line1 || ''}
                onChange={e => setForm(p => ({ ...p, address_line1: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={form.city || ''}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={form.state || ''}
                onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State Code (2 Digits) *</label>
              <input
                type="text"
                required
                maxLength="2"
                disabled={!canEdit}
                value={form.state_code || ''}
                onChange={e => setForm(p => ({ ...p, state_code: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={form.pincode || ''}
                onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Invoice & Bank Particulars */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">
            3. Invoicing Series & Bank Particulars
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Prefix</label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.invoice_prefix || ''}
                onChange={e => setForm(p => ({ ...p, invoice_prefix: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Financial Year</label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.financial_year || ''}
                onChange={e => setForm(p => ({ ...p, financial_year: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Terms</label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.default_payment_terms || ''}
                onChange={e => setForm(p => ({ ...p, default_payment_terms: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.bank_name || ''}
                onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account Number</label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.bank_account_no || ''}
                onChange={e => setForm(p => ({ ...p, bank_account_no: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank IFSC Code</label>
              <input
                type="text"
                disabled={!canEdit}
                value={form.bank_ifsc || ''}
                onChange={e => setForm(p => ({ ...p, bank_ifsc: e.target.value.toUpperCase() }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl flex items-center gap-2 shadow-sm"
            >
              <Save className="h-4 w-4" /> {saving ? 'Saving Changes...' : 'Save Company Profile'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
