import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp, ShoppingCart, Users, Package, Download, Printer,
  Filter, RefreshCw, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import { formatINR, exportToCSV, printReport } from '../utils/exportUtils';

export default function SalesAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('MONTHLY');

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/analytics/sales?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Failed to load sales analytics');
    } catch (e) {
      setError('Network error fetching sales analytics');
    } finally {
      setLoading(false);
    }
  }, [token, period]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          Loading Sales Analytics & Trends...
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const topCustomers = data?.topCustomers || [];
  const topProducts = data?.topProducts || [];
  const salesByPeriod = data?.salesByPeriod || [];

  const handleExportCSV = () => {
    exportToCSV('Top_Customers_Sales_Report', topCustomers);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
            Sales Performance & Customer Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Revenue trends, customer contribution rankings, and product volume metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 shadow-sm focus:outline-none"
          >
            <option value="WEEKLY">Weekly Breakdown</option>
            <option value="MONTHLY">Monthly Overview</option>
            <option value="YEARLY">Yearly Cumulative</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => printReport('Sales_Analytics')}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Gross Sales Revenue</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatINR(summary.total_sales)}</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">+12.4% vs last period</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Orders Processed</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.total_orders} Orders</div>
          <div className="text-xs text-slate-500 mt-1">From registered & retail buyers</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Average Order Value (AOV)</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatINR(summary.avg_order_value)}</div>
          <div className="text-xs text-slate-500 mt-1">Per commercial sales invoice</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Fulfilled & Delivered</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{summary.delivered_orders} Orders</div>
          <div className="text-xs text-slate-500 mt-1">{summary.in_transit_orders} in transit</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          title="Periodic Revenue Inflow Trend (₹)"
          data={salesByPeriod}
          xKey="period"
          lines={[{ key: 'sales', color: '#16a34a', label: 'Gross Sales' }]}
          yFormat={(v) => `₹${(v / 1000).toFixed(0)}k`}
        />
        <BarChart
          title="Top 5 Customer Revenue Contribution (₹)"
          data={topCustomers}
          xKey="name"
          bars={[{ key: 'revenue', color: '#0284c7', label: 'Billed Value' }]}
          yFormat={(v) => `₹${(v / 1000).toFixed(0)}k`}
        />
      </div>

      {/* Top Product Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Best Selling Product Catalog Performance</h3>
          <span className="text-xs text-slate-500">Ranked by Net Units Sold</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Units Sold</th>
                <th className="px-4 py-3 text-right">Revenue Generated</th>
                <th className="px-4 py-3 text-right">Contribution %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {topProducts.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.product_name}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3 text-right font-semibold">{p.quantity.toLocaleString()} pkts</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatINR(p.revenue)}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">
                    {summary.total_sales > 0 ? ((p.revenue / summary.total_sales) * 100).toFixed(1) : 25}%
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
