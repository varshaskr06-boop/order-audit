import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Package, AlertTriangle, Clock, Download, Printer, RefreshCw,
  Layers, ShieldCheck, ArrowRight
} from 'lucide-react';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';
import { formatINR, exportToCSV, printReport } from '../utils/exportUtils';

export default function InventoryAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Failed to load inventory analytics');
    } catch (e) {
      setError('Network error fetching inventory analytics');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          Loading Inventory Valuation & Batch Ledger...
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const categoryValuation = data?.categoryValuation || [];
  const stockAlerts = data?.stockAlerts || [];
  const batchExpiryRisk = data?.batchExpiryRisk || [];

  const donutData = categoryValuation.map((c, idx) => ({
    label: c.category.split(' ')[0] + ' ' + (c.category.split(' ')[1] || ''),
    value: c.value,
    color: ['#16a34a', '#0284c7', '#f59e0b'][idx % 3]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="h-6 w-6 text-emerald-600" />
            Inventory Valuation & Stock Aging Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Single Source of Truth: Phase 6 Perpetual Stock Ledger with FIFO/FEFO expiry tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV('Inventory_Valuation_Report', categoryValuation)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => printReport('Inventory_Analytics')}
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
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Inventory Valuation</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatINR(summary.total_valuation)}</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">Reconciled with balance sheet</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Active Stock Items (SKUs)</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.total_skus} SKUs</div>
          <div className="text-xs text-slate-500 mt-1">Grains, pulses, spices, films</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Low Stock / Reorder Triggers</div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{summary.low_stock_items} Items</div>
          <div className="text-xs text-amber-700 mt-1 font-medium">Requires replenishment PO</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Near Expiry Risk (&lt;30 Days)</div>
          <div className="text-2xl font-bold text-red-600 mt-2">{summary.expiring_soon_count} Batches</div>
          <div className="text-xs text-slate-500 mt-1">Prioritized for FEFO dispatch</div>
        </div>
      </div>

      {/* Valuation Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          title="Stock Ledger Valuation by Item Category"
          data={donutData}
          centerLabel="Valuation"
          centerValue={formatINR(summary.total_valuation)}
        />
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Low Stock Alerts & Minimum Stock Thresholds
          </h3>
          <div className="space-y-3">
            {stockAlerts.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{item.item_name}</div>
                  <div className="text-slate-500 mt-0.5">Category: {item.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">{item.current_stock}</div>
                  <div className="text-slate-400 text-[10px]">Reorder at: {item.reorder_level}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEFO Batch Expiry Risk Schedule */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">FEFO Expiry Risk & Rotation Schedule</h3>
          <span className="text-xs text-slate-500">First-Expiry First-Out Enforced</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Batch Number</th>
                <th className="px-4 py-3">Product / Material</th>
                <th className="px-4 py-3 text-right">Available Qty</th>
                <th className="px-4 py-3 text-right">Expiry Date</th>
                <th className="px-4 py-3 text-right">Days Remaining</th>
                <th className="px-4 py-3 text-center">FEFO Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {batchExpiryRisk.map((b, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">{b.batch_number}</td>
                  <td className="px-4 py-3 font-medium">{b.product_name}</td>
                  <td className="px-4 py-3 text-right font-semibold">{b.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono">{b.expiry_date}</td>
                  <td className={`px-4 py-3 text-right font-bold ${b.days_left < 15 ? 'text-red-600' : 'text-slate-700'}`}>
                    {b.days_left} days
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        b.status === 'EXPIRING_SOON' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {b.status === 'EXPIRING_SOON' ? 'HIGH PRIORITY' : 'NORMAL'}
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
