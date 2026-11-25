import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calculator, TrendingUp, TrendingDown, AlertTriangle, Package,
  Users, Zap, Gauge, BarChart2, RefreshCw, DollarSign, PieChart
} from 'lucide-react';

const API = '/api/costing';

export default function CostingDashboard() {
  const { token } = useAuth();
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
      else setError(json.message || 'Failed to load dashboard');
    } catch (e) {
      setError('Network error. Please check server connection.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtPct = (n) => `${Number(n || 0).toFixed(1)}%`;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Loading costing data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl text-sm">
      {error}
    </div>
  );

  const kpis = data?.kpis || {};
  const dist = data?.cost_distribution_pct || {};
  const profitable = data?.most_profitable_products || [];
  const highCost = data?.highest_cost_products || [];
  const lowMargin = data?.low_margin_alerts || [];
  const recentBatches = data?.recent_batch_costs || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="h-7 w-7 text-amber-500" />
            Costing Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">Phase 9 — Product Cost Analysis & Profitability Overview</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Mfg Cost', value: fmt(kpis.total_manufacturing_cost), icon: Calculator, color: 'amber' },
          { label: 'Avg Unit Cost', value: fmt(kpis.avg_unit_cost), icon: DollarSign, color: 'blue' },
          { label: 'RM Cost', value: fmt(kpis.total_rm_cost), icon: Package, color: 'emerald' },
          { label: 'Labour Cost', value: fmt(kpis.total_labour_cost), icon: Users, color: 'violet' },
          { label: 'Machine+Power', value: fmt(kpis.total_machine_cost), icon: Zap, color: 'orange' },
          { label: 'Overhead', value: fmt(kpis.total_overhead_cost), icon: Gauge, color: 'rose' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          const colors = {
            amber: 'bg-amber-50 border-amber-200 text-amber-700',
            blue: 'bg-blue-50 border-blue-200 text-blue-700',
            emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
            violet: 'bg-violet-50 border-violet-200 text-violet-700',
            orange: 'bg-orange-50 border-orange-200 text-orange-700',
            rose: 'bg-rose-50 border-rose-200 text-rose-700',
          };
          return (
            <div key={kpi.label} className={`rounded-2xl border p-4 ${colors[kpi.color]}`}>
              <Icon className="h-5 w-5 mb-2 opacity-70" />
              <div className="text-lg font-bold">{kpi.value}</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide mt-1 opacity-80">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Cost Distribution */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <PieChart className="h-4 w-4 text-amber-500" /> Cost Distribution (% of Total Manufacturing Cost)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Raw Materials', pct: dist.raw_materials, color: 'bg-emerald-500' },
            { label: 'Packaging', pct: dist.packaging, color: 'bg-blue-500' },
            { label: 'Labour', pct: dist.labour, color: 'bg-violet-500' },
            { label: 'Machine+Power', pct: dist.machine_electricity, color: 'bg-orange-500' },
            { label: 'Overhead', pct: dist.overhead, color: 'bg-rose-500' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-2xl font-bold text-slate-900">{fmtPct(item.pct)}</div>
              <div className={`h-2 rounded-full mt-2 ${item.color}`} style={{ opacity: Math.max(0.3, (item.pct || 0) / 100) + 0.3 }} />
              <div className="text-[11px] text-slate-500 mt-1 font-medium">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Low Margin Alerts */}
      {lowMargin.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Low Margin Alerts (Margin &lt; 25%)
          </h2>
          <div className="space-y-2">
            {lowMargin.map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-2 border border-amber-100 text-xs">
                <span className="font-semibold text-slate-800">{p.product_name}</span>
                <span className="text-rose-600 font-bold">{fmtPct(p.profit_margin_pct)} margin</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Profitable */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> Most Profitable Products
          </h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-2 text-slate-500 font-semibold">Product</th>
                <th className="text-right pb-2 text-slate-500 font-semibold">Margin %</th>
                <th className="text-right pb-2 text-slate-500 font-semibold">Profit/Unit</th>
              </tr>
            </thead>
            <tbody>
              {profitable.map((p, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2 font-medium text-slate-800">{p.product_name}</td>
                  <td className="py-2 text-right font-bold text-emerald-600">{fmtPct(p.profit_margin_pct)}</td>
                  <td className="py-2 text-right text-slate-700">{fmt(p.profit_per_unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Highest Cost */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-rose-500" /> Highest Unit Cost Products
          </h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-2 text-slate-500 font-semibold">Product</th>
                <th className="text-right pb-2 text-slate-500 font-semibold">Unit Cost</th>
                <th className="text-right pb-2 text-slate-500 font-semibold">Batches</th>
              </tr>
            </thead>
            <tbody>
              {highCost.map((p, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2 font-medium text-slate-800">{p.product_name}</td>
                  <td className="py-2 text-right font-bold text-rose-600">{fmt(p.avg_unit_cost)}</td>
                  <td className="py-2 text-right text-slate-500">{p.batch_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Batch Costs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-blue-500" /> Recent Batch Cost Records
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-2 text-slate-500 font-semibold">Batch</th>
                <th className="text-left pb-2 text-slate-500 font-semibold">Product</th>
                <th className="text-right pb-2 text-slate-500 font-semibold">Total Cost</th>
                <th className="text-right pb-2 text-slate-500 font-semibold">Cost/Unit</th>
                <th className="text-right pb-2 text-slate-500 font-semibold">Accepted</th>
              </tr>
            </thead>
            <tbody>
              {recentBatches.map((b, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 font-mono text-slate-700">{b.batch_number}</td>
                  <td className="py-2 text-slate-800">{b.product_name}</td>
                  <td className="py-2 text-right font-bold text-slate-900">{fmt(b.total_batch_cost)}</td>
                  <td className="py-2 text-right text-blue-700 font-semibold">{fmt(b.cost_per_accepted_unit)}</td>
                  <td className="py-2 text-right text-emerald-700">{b.accepted_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
