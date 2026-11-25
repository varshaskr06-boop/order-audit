import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { PieChart, RefreshCw, Info } from 'lucide-react';

const API = '/api/costing';

const HEALTH_STYLES = {
  EXCELLENT: 'bg-emerald-100 text-emerald-800',
  GOOD: 'bg-blue-100 text-blue-800',
  AVERAGE: 'bg-amber-100 text-amber-800',
  POOR: 'bg-rose-100 text-rose-800',
};

export default function ProductProfitabilityPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssumptions, setShowAssumptions] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/profitability`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || 'Failed to load profitability data');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const fmtPct = (n) => `${Number(n || 0).toFixed(2)}%`;

  const items = data?.items || [];
  const assumptions = data?.assumptions || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="h-7 w-7 text-amber-500" /> Product Profitability Analysis
          </h1>
          <p className="text-sm text-slate-500 mt-1">Product-wise margin rankings based on latest selling prices and batch costs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAssumptions(!showAssumptions)}
            className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold border border-blue-200">
            <Info className="h-3.5 w-3.5" /> Assumptions
          </button>
          <button onClick={fetchData} className="flex items-center gap-1 px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      {/* Assumptions */}
      {showAssumptions && assumptions && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-xs space-y-2">
          <h2 className="font-bold text-blue-900 text-sm mb-3">📌 Methodology & Assumptions</h2>
          {Object.entries(assumptions).map(([k, v]) => (
            <div key={k} className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <div>
                <span className="font-semibold text-blue-800 capitalize">{k.replace(/_/g, ' ')}: </span>
                <span className="text-blue-700">{String(v)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary cards */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <div className="text-xs font-bold text-emerald-700 mb-1">Most Profitable</div>
            <div className="text-base font-bold text-emerald-900">{items[0]?.product_name}</div>
            <div className="text-2xl font-black text-emerald-700">{fmtPct(items[0]?.profit_margin_pct)}</div>
            <div className="text-xs text-emerald-600">margin</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
            <div className="text-xs font-bold text-slate-600 mb-1">Total Products</div>
            <div className="text-3xl font-black text-slate-900">{items.length}</div>
            <div className="text-xs text-slate-500">products analysed</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
            <div className="text-xs font-bold text-rose-700 mb-1">Lowest Margin</div>
            <div className="text-base font-bold text-rose-900">{items[items.length - 1]?.product_name}</div>
            <div className="text-2xl font-black text-rose-700">{fmtPct(items[items.length - 1]?.profit_margin_pct)}</div>
            <div className="text-xs text-rose-600">margin</div>
          </div>
        </div>
      )}

      {/* Main table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase">Product</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-600 uppercase">Mfg Cost</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-600 uppercase">Selling Price</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-600 uppercase">Profit/Unit</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-600 uppercase">Margin %</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-600 uppercase">Monthly Vol.</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-600 uppercase">Total Profit</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase">Health</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-slate-400">No profitability data available. Ensure batch costs and selling prices are configured.</td></tr>
                ) : items.map((item, i) => (
                  <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50 ${i === 0 ? 'bg-emerald-50/30' : ''}`}>
                    <td className="px-4 py-3 font-bold text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.product_name}</div>
                      <div className="text-slate-400 font-mono text-[10px]">{item.product_sku}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{fmt(item.unit_manufacturing_cost)}</td>
                    <td className="px-4 py-3 text-right">{fmt(item.approved_selling_price)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmt(item.profit_per_unit)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-black text-sm"
                        style={{ color: item.profit_margin_pct >= 30 ? '#16a34a' : item.profit_margin_pct >= 20 ? '#d97706' : '#dc2626' }}>
                        {fmtPct(item.profit_margin_pct)}
                      </div>
                      {/* Mini bar */}
                      <div className="h-1 rounded bg-slate-100 mt-1">
                        <div className="h-1 rounded"
                          style={{
                            width: `${Math.min(100, item.profit_margin_pct)}%`,
                            backgroundColor: item.profit_margin_pct >= 30 ? '#16a34a' : item.profit_margin_pct >= 20 ? '#d97706' : '#dc2626'
                          }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{item.monthly_volume?.toLocaleString() || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">{item.total_monthly_profit ? fmt(item.total_monthly_profit) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${HEALTH_STYLES[item.profitability_health] || 'bg-slate-100 text-slate-600'}`}>
                        {item.profitability_health}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
