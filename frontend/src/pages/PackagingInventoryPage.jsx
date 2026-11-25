import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Search,
  AlertTriangle,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Layers,
  CheckCircle2
} from 'lucide-react';

export default function PackagingInventoryPage() {
  const { token, user, setActivePage } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const fetchPackaging = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/inventory/packaging';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (onlyLowStock) params.append('low_stock', 'true');
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
      } else {
        setError(json.message || 'Failed to fetch packaging materials');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching packaging');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackaging();
  }, [token, onlyLowStock]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPackaging();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase">
              Module 2 • Packaging
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Pouches, Cartons & Rolls</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Packaging Material Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            BOPP Food Grade Pouches, 20kg Corrugated Master Cartons, Printed Rolls & Labels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePage('stock-outward')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
          >
            <ArrowUpRight className="h-4 w-4" /> Issue to Floor
          </button>
          <button
            onClick={() => setActivePage('stock-inward')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition"
          >
            <ArrowDownLeft className="h-4 w-4" /> Receive Inward
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search packaging material name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              onlyLowStock
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>Only Low Stock Items</span>
          </button>

          <button
            onClick={fetchPackaging}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Refresh List"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Packaging Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Item Code & Name</th>
                <th className="py-3.5 px-4">UOM</th>
                <th className="py-3.5 px-4 text-right">Available Stock</th>
                <th className="py-3.5 px-4 text-right">Inward Total</th>
                <th className="py-3.5 px-4 text-right">Issued Total</th>
                <th className="py-3.5 px-4 text-right">Min Stock</th>
                <th className="py-3.5 px-4 text-right">Reorder Level</th>
                <th className="py-3.5 px-4 text-right">Valuation Rate</th>
                <th className="py-3.5 px-4 text-right">Total Valuation</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 text-amber-600 animate-spin mx-auto mb-2" />
                    Loading packaging inventory...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-10 text-center text-slate-400">
                    No packaging materials match the current filters.
                  </td>
                </tr>
              ) : (
                items.map((pkg) => {
                  const isLow = pkg.is_low_stock;
                  const isReorder = pkg.is_reorder_level;

                  return (
                    <tr key={pkg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{pkg.item_name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{pkg.item_code}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{pkg.uom}</td>
                      <td className="py-3.5 px-4 text-right font-black text-sm text-slate-900">
                        {pkg.current_stock}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-700 font-mono">
                        +{pkg.total_inward}
                      </td>
                      <td className="py-3.5 px-4 text-right text-blue-700 font-mono">
                        -{pkg.total_outward}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                        {pkg.min_stock_level}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                        {pkg.reorder_level}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                        ₹{Number(pkg.valuation_rate || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                        ₹{Number(pkg.total_valuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="h-3 w-3" /> LOW STOCK
                          </span>
                        ) : isReorder ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            REORDER
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            OPTIMAL
                          </span>
                        )}
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
