import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Boxes,
  Package,
  Layers,
  AlertTriangle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Calendar,
  Warehouse,
  ShieldCheck,
  CheckCircle2,
  FileText,
  DollarSign,
  Activity
} from 'lucide-react';

export default function InventoryDashboard() {
  const { token, user, setActivePage } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/inventory/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Failed to fetch inventory dashboard statistics');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching inventory dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [token]);

  const role = (user?.role || '').toUpperCase();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="h-8 w-8 text-amber-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading Central Inventory Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-rose-900">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading inventory dashboard</span>
        </div>
        <p className="text-xs">{error}</p>
        <button
          onClick={fetchDashboardStats}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const rm = data?.raw_materials || {};
  const pkg = data?.packaging || {};
  const fg = data?.finished_goods || {};
  const alerts = data?.alerts || {};
  const summary = data?.movements_summary || {};
  const fastMoving = data?.fast_moving_materials || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
              Phase 6 • Central Stock Ledger
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Real-time Valuation & Movement</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Inventory & Warehouse Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sri Meenakshi Agro & Traditional Foods Pvt Ltd • Central Stock Ledger Single Source of Truth
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardStats}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={() => setActivePage('inventory-reports')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition"
          >
            <FileText className="h-4 w-4" /> Valuation Reports
          </button>
        </div>
      </div>

      {/* Critical Alerts Banner (Low Stock & Expiry) */}
      {(alerts.expired_count > 0 || alerts.expiring_soon_count > 0 || alerts.total_low_stock_count > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Expired Stock Warning */}
          <div
            onClick={() => setActivePage('batch-expiry')}
            className={`p-4 rounded-2xl border cursor-pointer transition ${
              alerts.expired_count > 0
                ? 'bg-rose-50 border-rose-200 hover:bg-rose-100/70'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-rose-700 tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" /> Expired Stock
              </span>
              <span className="px-2 py-0.5 bg-rose-200 text-rose-800 rounded-full text-xs font-black">
                {alerts.expired_count} Batches
              </span>
            </div>
            <p className="text-xs text-rose-900 font-semibold mt-2">
              {alerts.expired_count > 0
                ? `${alerts.expired_count} batch(es) expired! Blocked from production. Click to view & adjust.`
                : 'Zero expired batches. Quality inspection optimal.'}
            </p>
          </div>

          {/* Expiring Within 30 Days Alert */}
          <div
            onClick={() => setActivePage('batch-expiry')}
            className={`p-4 rounded-2xl border cursor-pointer transition ${
              alerts.expiring_soon_count > 0
                ? 'bg-amber-50 border-amber-200 hover:bg-amber-100/70'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-600" /> Expiring Soon (30d)
              </span>
              <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-xs font-black">
                {alerts.expiring_soon_count} Batches
              </span>
            </div>
            <p className="text-xs text-amber-950 font-semibold mt-2">
              {alerts.expiring_soon_count > 0
                ? `${alerts.expiring_soon_count} near-expiry batch(es). Prioritize via FEFO consumption.`
                : 'No materials expiring in the next 30 days.'}
            </p>
          </div>

          {/* Low Stock Warning */}
          <div
            onClick={() => setActivePage('raw-materials-inventory')}
            className={`p-4 rounded-2xl border cursor-pointer transition ${
              alerts.total_low_stock_count > 0
                ? 'bg-orange-50 border-orange-200 hover:bg-orange-100/70'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-orange-800 tracking-wider flex items-center gap-1.5">
                <Boxes className="h-4 w-4 text-orange-600" /> Low Stock Warning
              </span>
              <span className="px-2 py-0.5 bg-orange-200 text-orange-900 rounded-full text-xs font-black">
                {alerts.total_low_stock_count} SKUs
              </span>
            </div>
            <p className="text-xs text-orange-950 font-semibold mt-2">
              {alerts.total_low_stock_count > 0
                ? `${alerts.total_low_stock_count} items below minimum safety threshold. PR reorder advised.`
                : 'All material inventories are above safety levels.'}
            </p>
          </div>
        </div>
      )}

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inventory Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Valuation</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{Number(data?.total_inventory_valuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Central Ledger Reconciled
            </p>
          </div>
        </div>

        {/* Raw Materials Total */}
        <div
          onClick={() => setActivePage('raw-materials-inventory')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Raw Materials</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{Number(rm.total_valuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {rm.total_count || 0} active materials • {rm.total_stock || 0} KG/LTR
            </p>
          </div>
        </div>

        {/* Packaging Materials Total */}
        <div
          onClick={() => setActivePage('packaging-inventory')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Packaging</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{Number(pkg.total_valuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {pkg.total_count || 0} packaging SKUs • {pkg.total_stock || 0} PCS
            </p>
          </div>
        </div>

        {/* Finished Goods Total */}
        <div
          onClick={() => setActivePage('finished-goods-inventory')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Finished Goods</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{Number(fg.total_valuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {fg.total_count || 0} product SKUs • {fg.total_stock || 0} PACKS
            </p>
          </div>
        </div>
      </div>

      {/* Fast Moving Raw Materials & Inward/Outward Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fast-Moving Materials */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Fast-Moving Raw Materials</h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">High Turnover</span>
          </div>

          <div className="divide-y divide-slate-100">
            {fastMoving.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No consumption logged yet.</p>
            ) : (
              fastMoving.map((item, idx) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-4 text-slate-400 font-mono text-[10px]">#{idx + 1}</span>
                      <span>{item.item_name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.item_code}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">
                      {item.total_consumed} {item.uom}
                    </div>
                    <div className="text-[10px] text-slate-500">Issued to Floor</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inward vs Outward Movement Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Inward vs. Outward Stock Movement Summary</h2>
            </div>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              Ledger Net: {summary.net_stock_variance > 0 ? `+${summary.net_stock_variance}` : summary.net_stock_variance} Units
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-800">Total Stock Inward</div>
                <div className="text-lg font-black text-emerald-950">
                  {summary.total_inward_quantity || 0} Units
                </div>
                <div className="text-[10px] text-emerald-700 mt-0.5">From GRNs & Production receipts</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-blue-800">Total Stock Outward</div>
                <div className="text-lg font-black text-blue-950">
                  {summary.total_outward_quantity || 0} Units
                </div>
                <div className="text-[10px] text-blue-700 mt-0.5">To Production floor & Dispatches</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Ledger Formula: <strong>Available = Inward - Outward + Adjustments</strong></span>
            </div>
            <button
              onClick={() => setActivePage('physical-stock')}
              className="text-amber-700 font-bold hover:underline"
            >
              Verify Physical Stock →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Stock Ledger Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Recent Stock Ledger Movements</h2>
          </div>
          <span className="text-xs text-slate-400">Last 10 central ledger transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Transaction Type</th>
                <th className="py-3 px-4">Item Code & Name</th>
                <th className="py-3 px-4">Batch / Ref</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {(summary.recent_movements || []).length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">
                    No ledger transactions recorded yet.
                  </td>
                </tr>
              ) : (
                summary.recent_movements.map((move) => {
                  const isPositive = move.quantity > 0;
                  return (
                    <tr key={move.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {move.entry_date ? new Date(move.entry_date).toLocaleString('en-IN') : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPositive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {move.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{move.item_name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{move.item_code}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs text-slate-700">{move.batch_number || '-'}</div>
                        <div className="text-[10px] text-slate-400">{move.reference_no}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{move.location_name || 'Central WH'}</td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span className={isPositive ? 'text-emerald-700' : 'text-blue-700'}>
                          {isPositive ? `+${move.quantity}` : move.quantity} {move.uom}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {move.running_balance} {move.uom}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
