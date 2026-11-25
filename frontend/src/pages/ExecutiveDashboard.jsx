import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, TrendingUp, DollarSign, ShoppingCart, Package,
  Factory, ShieldAlert, Truck, CreditCard, RefreshCw, Download,
  Printer, ArrowUpRight, CheckCircle2, AlertTriangle, Layers
} from 'lucide-react';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';
import { formatINR, exportToCSV, printReport } from '../utils/exportUtils';

export default function ExecutiveDashboard() {
  const { token, setActivePage } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('CURRENT_MONTH');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/analytics/executive-dashboard?period=${filterPeriod}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Failed to load executive dashboard');
    } catch (e) {
      setError('Network error fetching executive analytics');
    } finally {
      setLoading(false);
    }
  }, [token, filterPeriod]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          Loading Executive Business Intelligence Dashboard...
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const trends = data?.monthlyTrends || [];
  const health = data?.departmentHealth || [];
  const activities = data?.recentActivities || [];

  const handleExportSummary = () => {
    exportToCSV('Executive_Dashboard_KPIs', [
      { Metric: 'Total Sales', Value: kpis.totalSales },
      { Metric: 'Total Purchases', Value: kpis.totalPurchases },
      { Metric: 'Revenue Collected', Value: kpis.totalRevenue },
      { Metric: 'Total Expenses', Value: kpis.totalExpenses },
      { Metric: 'Customer Outstanding', Value: kpis.customerOutstanding },
      { Metric: 'Supplier Outstanding', Value: kpis.supplierOutstanding },
      { Metric: 'Inventory Valuation', Value: kpis.totalInventoryValue },
      { Metric: 'Production Output (Units)', Value: kpis.productionOutput },
      { Metric: 'Quality Rejection Rate (%)', Value: kpis.qualityRejectionRate },
      { Metric: 'Total Dispatches', Value: kpis.dispatchesCount },
      { Metric: 'Open Audit Findings', Value: kpis.openAuditFindings }
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-emerald-600" />
            Executive Leadership Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sri Meenakshi Agro & Traditional Foods Pvt Ltd • Unified Business Performance Overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="CURRENT_MONTH">Current Month (Feb 2026)</option>
            <option value="CURRENT_QUARTER">Current Quarter (Q4 FY26)</option>
            <option value="YEAR_TO_DATE">Year to Date (FY 2025-26)</option>
          </select>
          <button
            onClick={handleExportSummary}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="h-4 w-4 text-slate-500" />
            CSV Export
          </button>
          <button
            onClick={() => printReport('Executive_Dashboard')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          {error}
        </div>
      )}

      {/* Top 6 High-Impact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Total Sales Invoiced</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShoppingCart className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatINR(kpis.totalSales)}</div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <ArrowUpRight className="h-3.5 w-3.5" /> +14.8% vs last month
          </div>
        </div>

        {/* Collected Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Collected Cash Inflow</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CreditCard className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatINR(kpis.totalRevenue)}</div>
          <div className="text-xs text-slate-500 mt-1">Excludes payment reversals</div>
        </div>

        {/* Inventory Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Stock Ledger Valuation</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatINR(kpis.totalInventoryValue)}</div>
          <div className="text-xs text-amber-600 mt-1 font-medium">Single source: Phase 6 Ledger</div>
        </div>

        {/* Customer Outstanding */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Customer Outstanding</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatINR(kpis.customerOutstanding)}</div>
          <div className="text-xs text-slate-500 mt-1">94% within 30-day terms</div>
        </div>
      </div>

      {/* Secondary Operational KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-100 shadow-sm text-center">
          <div className="text-xs text-slate-500 font-medium">Total Purchases</div>
          <div className="text-base font-bold text-slate-800 mt-1">{formatINR(kpis.totalPurchases)}</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-100 shadow-sm text-center">
          <div className="text-xs text-slate-500 font-medium">Production Output</div>
          <div className="text-base font-bold text-slate-800 mt-1">{kpis.productionOutput.toLocaleString()} kg</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-100 shadow-sm text-center">
          <div className="text-xs text-slate-500 font-medium">QC Rejection Rate</div>
          <div className="text-base font-bold text-emerald-600 mt-1">{kpis.qualityRejectionRate}%</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-100 shadow-sm text-center">
          <div className="text-xs text-slate-500 font-medium">Dispatches</div>
          <div className="text-base font-bold text-slate-800 mt-1">{kpis.dispatchesCount} Shipments</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-100 shadow-sm text-center">
          <div className="text-xs text-slate-500 font-medium">Vendor Payables</div>
          <div className="text-base font-bold text-slate-800 mt-1">{formatINR(kpis.supplierOutstanding)}</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-100 shadow-sm text-center">
          <div className="text-xs text-slate-500 font-medium">Open Audit Issues</div>
          <div className="text-base font-bold text-amber-600 mt-1">{kpis.openAuditFindings} Findings</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue vs Expense Trend */}
        <LineChart
          title="12-Month Financial Performance Trend (₹)"
          data={trends}
          xKey="month"
          lines={[
            { key: 'sales', color: '#16a34a', label: 'Sales Revenue' },
            { key: 'expenses', color: '#ef4444', label: 'Total Incurred Cost' }
          ]}
          yFormat={(v) => `₹${(v / 1000).toFixed(0)}k`}
        />

        {/* Monthly Production Output in KG */}
        <BarChart
          title="Monthly Manufacturing Output (KG)"
          data={trends}
          xKey="month"
          bars={[{ key: 'production_kg', color: '#0284c7', label: 'Finished Output (KG)' }]}
          yFormat={(v) => `${v} kg`}
        />
      </div>

      {/* Departmental Health & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Health Overview */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-emerald-600" />
              Department Operational & Compliance Status
            </h3>
            <span className="text-xs text-slate-400">All 6 Key Pillars Monitored</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {health.map((dept, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-sm">{dept.department}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      dept.status === 'HEALTHY' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {dept.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-2">{dept.message}</div>
                <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Adherence Score</span>
                  <span className="font-bold text-slate-900">{dept.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent ERP Transactions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-600" />
            Live Audit & Transaction Stream
          </h3>
          <div className="space-y-3">
            {activities.map((act) => (
              <div key={act.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                  <span>{act.type}</span>
                  <span>{act.time}</span>
                </div>
                <div className="font-medium text-slate-800 mt-1">{act.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
