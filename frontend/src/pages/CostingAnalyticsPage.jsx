import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calculator, CheckCircle2, AlertTriangle, TrendingUp, Download,
  Printer, RefreshCw, DollarSign, PieChart
} from 'lucide-react';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';
import { formatINR, exportToCSV, printReport } from '../utils/exportUtils';

export default function CostingAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCosting = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/costing', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Failed to load product costing analytics');
    } catch (e) {
      setError('Network error fetching costing analytics');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCosting();
  }, [fetchCosting]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          Loading Product Costing & Margin Analytics...
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const costBreakdown = data?.costBreakdown || [];
  const productMargins = data?.productMargins || [];

  const costDonut = costBreakdown.map((c, idx) => ({
    label: c.component.split(' ').slice(0, 3).join(' '),
    value: c.cost_per_unit,
    color: ['#16a34a', '#0284c7', '#f59e0b', '#8b5cf6', '#ec4899'][idx % 5]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="h-6 w-6 text-emerald-600" />
            Manufacturing Cost & Profit Margin Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Unit cost absorption breakdown, planned vs actual variance, and gross margins (Statutory GST Excluded)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV('Product_Margins_Report', productMargins)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => printReport('Costing_Analytics')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Average Unit Manufacturing Cost</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">₹{summary.average_mfg_cost_unit?.toFixed(2)} / unit</div>
          <div className="text-xs text-slate-500 mt-1">Direct material, labour & utilities (Excl. GST)</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Average Gross Profit Margin</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{summary.average_gross_margin_percent}%</div>
          <div className="text-xs text-slate-500 mt-1">Selling price ex-GST vs manufacturing cost</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">BOM Standard vs Actual Variance</div>
          <div className="text-2xl font-bold text-amber-600 mt-2">+{summary.cost_variance_percent}%</div>
          <div className="text-xs text-slate-500 mt-1">Within standard acceptable tolerance (±3%)</div>
        </div>
      </div>

      {/* Cost Absorption Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          title="Unit Cost Absorption Structure (₹ / Unit)"
          data={costDonut}
          centerLabel="Mfg Cost"
          centerValue={`₹${summary.average_mfg_cost_unit?.toFixed(2)}`}
        />
        <BarChart
          title="Product Unit Profit Margins (%)"
          data={productMargins.map((p) => ({
            label: p.product_name.split(' ').slice(0, 2).join(' '),
            margin: p.gross_margin_percent
          }))}
          xKey="label"
          bars={[{ key: 'margin', color: '#16a34a', label: 'Gross Margin %' }]}
          yFormat={(v) => `${v}%`}
        />
      </div>

      {/* Product Margin Catalog Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Finished Goods Unit Economics & Contribution Margins</h3>
          <span className="text-xs text-slate-500">Excludes GST from Cost and Revenue Base</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3 text-right">Manufacturing Cost</th>
                <th className="px-4 py-3 text-right">Selling Price (Ex-GST)</th>
                <th className="px-4 py-3 text-right">Unit Gross Profit</th>
                <th className="px-4 py-3 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {productMargins.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{p.product_name}</td>
                  <td className="px-4 py-3 text-right font-mono">₹{p.mfg_cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">₹{p.selling_price_ex_gst.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600">
                    ₹{(p.selling_price_ex_gst - p.mfg_cost).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700">{p.gross_margin_percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
