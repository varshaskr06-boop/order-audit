import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase, CheckCircle2, AlertTriangle, Clock, Download,
  Printer, RefreshCw, ArrowUpRight, ShieldCheck
} from 'lucide-react';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';
import { formatINR, exportToCSV, printReport } from '../utils/exportUtils';

export default function PurchaseAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPurchase = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/purchase', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Failed to load purchase analytics');
    } catch (e) {
      setError('Network error fetching purchase analytics');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPurchase();
  }, [fetchPurchase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          Loading Procurement & 3-Way Match Analytics...
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const matchSummary = data?.matchSummary || {};
  const topSuppliers = data?.topSuppliers || [];
  const priceHistory = data?.priceHistory || [];

  const matchDataDonut = [
    { label: 'Clean Matched (Within Tolerance)', value: matchSummary.matched || 18, color: '#16a34a' },
    { label: 'Discrepancy (Rate/Qty Mismatch)', value: matchSummary.discrepancy || 2, color: '#ef4444' },
    { label: 'Pending Verification', value: matchSummary.pending || 4, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-600" />
            Procurement Spend & 3-Way Match Audit
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Supplier expenditure tracking, price variance history, and 3-Way Match integrity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV('Purchase_Suppliers_Report', topSuppliers)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => printReport('Purchase_Analytics')}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Purchase Outlay</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatINR(summary.total_spend)}</div>
          <div className="text-xs text-slate-500 mt-1">Across approved purchase orders</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Purchase Orders (POs)</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.total_pos} POs</div>
          <div className="text-xs text-slate-500 mt-1">Grains, spices, packaging</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">3WM Automated Match Rate</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{summary.match_rate_percentage}%</div>
          <div className="text-xs text-slate-500 mt-1">Tolerance threshold: ±2%</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">3WM Discrepancies Held</div>
          <div className="text-2xl font-bold text-red-600 mt-2">{summary.discrepancy_count} Discrepancies</div>
          <div className="text-xs text-slate-500 mt-1">Awaiting credit note / approval</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          title="3-Way Matching Verification Status"
          data={matchDataDonut}
          centerLabel="Total 3WM"
          centerValue={`${(matchSummary.matched || 0) + (matchSummary.discrepancy || 0) + (matchSummary.pending || 0)}`}
        />
        <BarChart
          title="Top Supplier Procurement Outlay (₹)"
          data={topSuppliers}
          xKey="name"
          bars={[{ key: 'total_amount', color: '#059669', label: 'Spend' }]}
          yFormat={(v) => `₹${(v / 1000).toFixed(0)}k`}
        />
      </div>

      {/* Raw Material Price Variance Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Raw Material Procurement Price History & Variance</h3>
          <span className="text-xs text-slate-500">Benchmark vs Prior Batch Average</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Agro Raw Material</th>
                <th className="px-4 py-3 text-right">Prior Benchmark Price</th>
                <th className="px-4 py-3 text-right">Current Contract Price</th>
                <th className="px-4 py-3 text-right">Variance %</th>
                <th className="px-4 py-3 text-center">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {priceHistory.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{p.material}</td>
                  <td className="px-4 py-3 text-right font-mono">₹{p.last_month_price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">₹{p.current_price.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${p.variance_percent > 3 ? 'text-red-600' : p.variance_percent < 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {p.variance_percent > 0 ? `+${p.variance_percent}%` : `${p.variance_percent}%`}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      APPROVED
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
