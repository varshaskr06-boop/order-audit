import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  FileText,
  X,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export default function RawMaterialInventoryPage() {
  const { token, user, setActivePage } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modal for Batch Details & FEFO Lookup
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [fefoQty, setFefoQty] = useState(50);
  const [fefoResult, setFefoResult] = useState(null);
  const [fefoLoading, setFefoLoading] = useState(false);

  const fetchMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/inventory/raw-materials';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (onlyLowStock) params.append('low_stock', 'true');
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setMaterials(json.data || []);
      } else {
        setError(json.message || 'Failed to fetch raw materials inventory');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching raw materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [token, onlyLowStock]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMaterials();
  };

  const handleFEFOLookup = async (materialId, qty) => {
    setFefoLoading(true);
    try {
      const res = await fetch(`/api/inventory/fefo-recommendation?item_id=${materialId}&quantity=${qty}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setFefoResult(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFefoLoading(false);
    }
  };

  const role = (user?.role || '').toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
              Module 1 • Raw Materials
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Available Stock & Reorder Levels</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Raw Material Stock Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rice, Urad Dal, Fenugreek, Spices & Oils • Madurai Food Processing Unit
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePage('stock-outward')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
          >
            <ArrowUpRight className="h-4 w-4" /> Issue to Production
          </button>
          <button
            onClick={() => setActivePage('stock-inward')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition"
          >
            <ArrowDownLeft className="h-4 w-4" /> Receive Inward (GRN)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search raw material name or code..."
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
            onClick={fetchMaterials}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Refresh List"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Material Code & Name</th>
                <th className="py-3.5 px-4">UOM</th>
                <th className="py-3.5 px-4 text-right">Available Stock</th>
                <th className="py-3.5 px-4 text-right">Min Level</th>
                <th className="py-3.5 px-4 text-right">Reorder Level</th>
                <th className="py-3.5 px-4 text-right">Unit Rate</th>
                <th className="py-3.5 px-4 text-right">Total Valuation</th>
                <th className="py-3.5 px-4 text-center">Stock Status</th>
                <th className="py-3.5 px-4 text-center">Active Batches</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 text-amber-600 animate-spin mx-auto mb-2" />
                    Loading raw materials stock...
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-10 text-center text-slate-400">
                    No raw materials match the current filters.
                  </td>
                </tr>
              ) : (
                materials.map((mat) => {
                  const isLow = mat.is_low_stock;
                  const isReorder = mat.is_reorder_level;

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{mat.item_name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{mat.item_code}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{mat.uom}</td>
                      <td className="py-3.5 px-4 text-right font-black text-sm text-slate-900">
                        {mat.current_stock}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                        {mat.min_stock_level}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                        {mat.reorder_level}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                        ₹{Number(mat.valuation_rate || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-800 font-mono">
                        ₹{Number(mat.total_valuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="h-3 w-3" /> CRITICAL LOW
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
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-[11px]">
                          {mat.active_batches_count || 0} Batches
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedMaterial(mat);
                            setFefoResult(null);
                            handleFEFOLookup(mat.id, 50);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition"
                        >
                          Batches & FEFO
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Material Detail & FEFO Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                  Batch Breakdown & FEFO
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">{selectedMaterial.item_name}</h2>
                <p className="text-xs text-slate-500 font-mono">{selectedMaterial.item_code} • {selectedMaterial.uom}</p>
              </div>
              <button
                onClick={() => setSelectedMaterial(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Batch Inventory Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Active Storage Batches ({selectedMaterial.batches?.length || 0})
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Batch Number</th>
                      <th className="py-2.5 px-3">Mfg Date</th>
                      <th className="py-2.5 px-3">Expiry Date</th>
                      <th className="py-2.5 px-3 text-right">Available Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedMaterial.batches || []).length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-slate-400 text-xs">
                          No active batches for this material.
                        </td>
                      </tr>
                    ) : (
                      selectedMaterial.batches.map((b) => (
                        <tr key={b.id}>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{b.batch_number}</td>
                          <td className="py-2.5 px-3 text-slate-500">{b.mfg_date}</td>
                          <td className="py-2.5 px-3 font-bold text-amber-700">{b.expiry_date}</td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900">
                            {b.current_quantity} {selectedMaterial.uom}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FEFO Recommendation Calculator */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>FEFO (First Expiry, First Out) Recommendation Engine</span>
                </span>
                <span className="text-[10px] text-slate-500">Auto-prioritizes earliest expiry</span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  value={fefoQty}
                  onChange={(e) => setFefoQty(Number(e.target.value))}
                  className="w-32 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:outline-none"
                  placeholder="Quantity to issue"
                />
                <button
                  onClick={() => handleFEFOLookup(selectedMaterial.id, fefoQty)}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition"
                >
                  Calculate Pick
                </button>
              </div>

              {fefoResult && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] text-slate-600 flex justify-between font-semibold">
                    <span>Requested: {fefoResult.requested_quantity} {selectedMaterial.uom}</span>
                    <span className={fefoResult.is_fully_fulfillable ? 'text-emerald-700' : 'text-rose-700'}>
                      {fefoResult.is_fully_fulfillable ? '✓ 100% Fulfillable' : `⚠ Shortfall: ${fefoResult.shortfall} ${selectedMaterial.uom}`}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {fefoResult.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-900">{rec.batch_number}</span>
                          <span className="text-[10px] text-amber-700 ml-2 font-semibold">
                            Expires: {rec.expiry_date} ({rec.days_until_expiry}d left)
                          </span>
                        </div>
                        <div className="font-black text-amber-900">
                          Pick: {rec.recommended_pick_quantity} {rec.uom}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedMaterial(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
