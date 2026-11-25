import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText, TrendingUp, DollarSign, CheckCircle2, Clock, AlertTriangle,
  RefreshCw, PlusCircle, ArrowUpRight, ArrowDownRight, Scale, ShieldCheck
} from 'lucide-react';

const API = '/api/invoicing';

export default function InvoiceDashboard() {
  const { token, setActivePage } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || 'Failed to load dashboard statistics');
    } catch (e) {
      setError('Network error connecting to backend API');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const STATUS_BADGES = {
    ISSUED: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    PAID: 'bg-emerald-100 text-emerald-800',
    PARTIALLY_PAID: 'bg-amber-100 text-amber-800',
    OVERDUE: 'bg-rose-100 text-rose-800',
    CANCELLED: 'bg-slate-100 text-slate-600',
    DRAFT: 'bg-slate-100 text-slate-700'
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Loading GST billing overview...</p>
      </div>
    </div>
  );

  const kpis = data?.kpis || {};
  const tax = data?.tax_summary || {};
  const recent = data?.recent_invoices || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-amber-500" /> GST Billing & Invoicing Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">Phase 10 — Statutory Invoicing, Tax Calculations, and Ledger Tracking</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            onClick={() => setActivePage('create-invoice')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            <PlusCircle className="h-4 w-4" /> New Tax Invoice
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoices', value: kpis.total_invoices || 0, sub: 'Active tax invoices', icon: FileText, color: 'blue' },
          { label: 'Taxable Turnover', value: fmt(kpis.total_taxable_sales), sub: 'Gross taxable base', icon: TrendingUp, color: 'emerald' },
          { label: 'Total Invoiced GST', value: fmt(kpis.total_tax_invoiced), sub: 'CGST + SGST + IGST', icon: Scale, color: 'amber' },
          { label: 'Gross Invoice Value', value: fmt(kpis.total_invoice_value), sub: 'Total receivables', icon: DollarSign, color: 'violet' }
        ].map((k) => {
          const Icon = k.icon;
          const styles = {
            blue: 'bg-blue-50/60 border-blue-200 text-blue-900',
            emerald: 'bg-emerald-50/60 border-emerald-200 text-emerald-900',
            amber: 'bg-amber-50/60 border-amber-200 text-amber-900',
            violet: 'bg-violet-50/60 border-violet-200 text-violet-900'
          };
          return (
            <div key={k.label} className={`rounded-2xl border p-4 ${styles[k.color]}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{k.label}</span>
                <Icon className="h-4 w-4 opacity-70" />
              </div>
              <div className="text-xl font-black">{k.value}</div>
              <div className="text-[10px] text-slate-500 mt-1">{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Tax Component Breakdown & Receivables Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Output Tax Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Scale className="h-4 w-4 text-amber-500" /> Output GST Classification
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">CGST (Intra-state)</div>
              <div className="text-base font-bold text-slate-900 mt-1">{fmt(kpis.total_cgst)}</div>
              <div className="text-[10px] text-slate-400">Tamil Nadu (33)</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">SGST (Intra-state)</div>
              <div className="text-base font-bold text-slate-900 mt-1">{fmt(kpis.total_sgst)}</div>
              <div className="text-[10px] text-slate-400">Tamil Nadu (33)</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <div className="text-[11px] font-semibold text-amber-800">IGST (Inter-state)</div>
              <div className="text-base font-bold text-amber-900 mt-1">{fmt(kpis.total_igst)}</div>
              <div className="text-[10px] text-amber-600">KA, KL & Other</div>
            </div>
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100">
            <strong>Supply Distribution:</strong> Intra-State: {fmt(tax.intra_state_sales)} • Inter-State: {fmt(tax.inter_state_sales)}
            <div className="text-[11px] text-slate-400 mt-1">⚠️ {tax.net_tax_liability_note}</div>
          </div>
        </div>

        {/* Collections & Aging */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Invoice Realization & Outstanding
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <div className="text-[11px] font-semibold text-emerald-800">Paid Amount</div>
              <div className="text-base font-bold text-emerald-900 mt-1">{fmt(kpis.paid_amount)}</div>
              <div className="text-[10px] text-emerald-600">{kpis.paid_invoices_count} invoices</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <div className="text-[11px] font-semibold text-amber-800">Outstanding</div>
              <div className="text-base font-bold text-amber-900 mt-1">{fmt(kpis.outstanding_amount)}</div>
              <div className="text-[10px] text-amber-600">{kpis.unpaid_invoices_count} pending</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
              <div className="text-[11px] font-semibold text-rose-800">Overdue</div>
              <div className="text-base font-bold text-rose-900 mt-1">{fmt(kpis.overdue_amount)}</div>
              <div className="text-[10px] text-rose-600">{kpis.overdue_invoices_count} overdue</div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setActivePage('invoices')}
              className="flex-1 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors"
            >
              View Invoices Registry →
            </button>
            <button
              onClick={() => setActivePage('credit-debit-notes')}
              className="py-2 px-4 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors"
            >
              Credit/Debit Notes
            </button>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Recent Invoices Generated</h2>
          <button
            onClick={() => setActivePage('invoices')}
            className="text-xs font-bold text-amber-600 hover:text-amber-800"
          >
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-5 py-2.5 text-left">Invoice No</th>
                <th className="px-5 py-2.5 text-left">Date</th>
                <th className="px-5 py-2.5 text-left">Customer</th>
                <th className="px-5 py-2.5 text-left">Supply Type</th>
                <th className="px-5 py-2.5 text-right">Invoice Total</th>
                <th className="px-5 py-2.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recent.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">No invoices found</td></tr>
              ) : recent.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-slate-900">{r.invoice_number}</td>
                  <td className="px-5 py-3 text-slate-600">{r.invoice_date}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{r.customer_name}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${r.supply_type === 'INTER_STATE' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                      {r.supply_type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-black text-slate-900">{fmt(r.total_invoice_amount)}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${STATUS_BADGES[r.status] || 'bg-slate-100 text-slate-700'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
