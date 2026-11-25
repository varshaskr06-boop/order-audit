import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function BatchExpiryManagementPage() {
  const { token, user, setActivePage } = useAuth();
  const [batches, setBatches] = useState([]);
  const [expiredBatches, setExpiredBatches] = useState([]);
  const [expiringSoonBatches, setExpiringSoonBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'EXPIRED', 'EXPIRING_SOON'
  const [searchTerm, setSearchTerm] = useState('');

  // FEFO Simulator State
  const [selectedItemId, setSelectedItemId] = useState('1');
  const [fefoQty, setFefoQty] = useState(100);
  const [fefoResult, setFefoResult] = useState(null);
  const [fefoLoading, setFefoLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allRes, expRes, soonRes] = await Promise.all([
        fetch('/api/inventory/batches', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/inventory/batches/expired', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/inventory/batches/expiring-soon?days=30', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const allData = await allRes.json();
      const expData = await expRes.json();
      const soonData = await soonRes.json();

      if (allData.success) setBatches(allData.data || []);
      if (expData.success) setExpiredBatches(expData.data || []);
      if (soonData.success) setExpiringSoonBatches(soonData.data || []);
    } catch (err) {
      setError(err.message || 'Error fetching batch and expiry data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSimulateFEFO = async () => {
    setFefoLoading(true);
    try {
      const res = await fetch(
        `/api/inventory/fefo-recommendation?item_id=${selectedItemId}&quantity=${fefoQty}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
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

  const filteredBatches = batches.filter((b) => {
    if (filterType === 'EXPIRED') return b.is_expired;
    if (filterType === 'EXPIRING_SOON') return b.is_expiring_soon;
    if (searchTerm) {
      return (
        b.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
              Module 7 • Batch & Expiry
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">FEFO Recommendation & Shelf-Life Guard</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Batch & Expiry Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sri Meenakshi Agro & Traditional Foods • Strict non-issuance rule for expired food materials
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePage('stock-adjustment')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition"
          >
            <AlertTriangle className="h-4 w-4" /> Discard Expired Stock
          </button>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Critical Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Expired Batches */}
        <div
          onClick={() => setFilterType('EXPIRED')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            filterType === 'EXPIRED'
              ? 'bg-rose-100/80 border-rose-400 ring-2 ring-rose-400'
              : 'bg-rose-50 border-rose-200 hover:bg-rose-100/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-rose-800 tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-rose-600" /> Expired Stock
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 font-black text-xs">
              {expiredBatches.length} Batches
            </span>
          </div>
          <p className="text-xs text-rose-950 mt-3 font-semibold">
            {expiredBatches.length > 0
              ? 'Expired materials are BLOCKED from production floor issue. Immediate quality write-off recommended.'
              : 'Zero expired batches. Quality inspection optimal.'}
          </p>
        </div>

        {/* Near Expiry (30 Days) */}
        <div
          onClick={() => setFilterType('EXPIRING_SOON')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            filterType === 'EXPIRING_SOON'
              ? 'bg-amber-100/80 border-amber-400 ring-2 ring-amber-400'
              : 'bg-amber-50 border-amber-200 hover:bg-amber-100/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-600" /> Expiring Soon (30 Days)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-black text-xs">
              {expiringSoonBatches.length} Batches
            </span>
          </div>
          <p className="text-xs text-amber-950 mt-3 font-semibold">
            {expiringSoonBatches.length > 0
              ? 'Prioritize these batches for current production batches via First-Expiry-First-Out (FEFO).'
              : 'No materials expiring in the next 30 days.'}
          </p>
        </div>

        {/* Total Active Batches */}
        <div
          onClick={() => setFilterType('ALL')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            filterType === 'ALL'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-slate-600" /> Total Active Batches
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-black text-xs">
              {batches.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-3">
            Click to view all inventory lots across raw materials, packaging, and finished goods.
          </p>
        </div>
      </div>

      {/* FEFO Recommendation Engine Simulator */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              FEFO (First Expiry, First Out) Allocation Simulator
            </h2>
          </div>
          <span className="text-xs text-amber-800 font-semibold bg-amber-100/80 px-2.5 py-0.5 rounded-full">
            Prevents Food Waste & Freshness Degradation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Material</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="1">Ponni Boiled Rice (RM-RICE-001)</option>
              <option value="2">Urad Dal Guntur (RM-DAL-002)</option>
              <option value="3">Fenugreek Seeds Small (RM-FEN-003)</option>
              <option value="6">BOPP Printed Pouch 250g (PKG-POUCH-250)</option>
              <option value="9">Fresh Idli & Dosa Batter 1kg (FG-BAT-1KG)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Required Quantity</label>
            <input
              type="number"
              min="1"
              value={fefoQty}
              onChange={(e) => setFefoQty(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSimulateFEFO}
              disabled={fefoLoading}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              {fefoLoading ? 'Calculating FEFO...' : 'Generate FEFO Pick Plan'}
            </button>
          </div>
        </div>

        {fefoResult && (
          <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">
                FEFO Picking Strategy ({fefoResult.recommendations?.length || 0} Batches allocated)
              </span>
              <span className={`font-bold ${fefoResult.is_fully_fulfillable ? 'text-emerald-700' : 'text-rose-700'}`}>
                {fefoResult.is_fully_fulfillable
                  ? '✓ 100% Demand Can Be Satisfied'
                  : `⚠ Shortfall: ${fefoResult.shortfall} Units`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fefoResult.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex justify-between items-center text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-slate-900">{rec.batch_number}</div>
                    <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                      Expiry: {rec.expiry_date} ({rec.days_until_expiry} days remaining)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-amber-900">
                      {rec.recommended_pick_quantity} {rec.uom}
                    </div>
                    <div className="text-[10px] text-slate-400">Available: {rec.available_in_batch}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search batch number or material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                filterType === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('EXPIRED')}
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                filterType === 'EXPIRED' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Expired Only
            </button>
            <button
              onClick={() => setFilterType('EXPIRING_SOON')}
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                filterType === 'EXPIRING_SOON' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Expiring &lt;30d
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Batch Number</th>
                <th className="py-3.5 px-4">Item Name & Code</th>
                <th className="py-3.5 px-4">Storage Location</th>
                <th className="py-3.5 px-4">Mfg Date</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4 text-center">Remaining Days</th>
                <th className="py-3.5 px-4 text-right">Available Qty</th>
                <th className="py-3.5 px-4 text-center">QC Status</th>
                <th className="py-3.5 px-4 text-center">Issuance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 text-amber-600 animate-spin mx-auto mb-2" />
                    Checking batch registry...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-10 text-center text-slate-400">
                    No batches match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {b.batch_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{b.item_name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{b.item_code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{b.location_name || 'Central WH'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{b.mfg_date}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{b.expiry_date}</td>
                    <td className="py-3.5 px-4 text-center">
                      {b.is_expired ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          {Math.abs(b.days_until_expiry)}d ago (EXPIRED)
                        </span>
                      ) : b.is_expiring_soon ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                          {b.days_until_expiry} days left
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">
                          {b.days_until_expiry} days
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {b.current_quantity} {b.uom}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {b.qc_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {b.is_expired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 border border-rose-300">
                          <XCircle className="h-3 w-3" /> BLOCKED (EXPIRED)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> APPROVED FOR ISSUE
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
