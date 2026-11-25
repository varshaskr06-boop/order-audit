import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowDownLeft,
  Truck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  PackageCheck,
  ShieldCheck,
  Layers,
  X,
  Calendar,
  FileText
} from 'lucide-react';

export default function StockInwardPage() {
  const { token, user, setActivePage } = useAuth();
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Selected GRN for Inward Modal
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [posting, setPosting] = useState(false);

  const fetchGRNs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/purchase/grns', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setGrns(json.data || []);
      } else {
        setError(json.message || 'Failed to fetch goods received notes');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching GRNs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGRNs();
  }, [token]);

  const handlePostInward = async (grnId) => {
    setPosting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/inventory/inward/grn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ grn_id: grnId })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setSelectedGRN(null);
        fetchGRNs();
      } else {
        setError(json.message || 'Failed to post inward to stock ledger');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with inventory server');
    } finally {
      setPosting(false);
    }
  };

  const role = (user?.role || '').toUpperCase();
  const canPostInward = ['PRODUCTION', 'ADMIN', 'OWNER'].includes(role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
              Module 4 • Stock Inward
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">GRN to Central Ledger Posting</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Goods Receipt Stock Inward
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Post inspected raw materials & packaging into inventory batches with duplicate protection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePage('goods-receipts')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <PackageCheck className="h-4 w-4" /> View Phase 5 GRNs
          </button>
          <button
            onClick={() => setActivePage('raw-materials-inventory')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition"
          >
            <Layers className="h-4 w-4" /> View Updated Stock
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* GRN Inward Eligible List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
            <Truck className="h-4 w-4 text-emerald-600" />
            <span>Posted Goods Received Notes (Eligible for Inward Ledger Update)</span>
          </div>
          <button
            onClick={fetchGRNs}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">GRN Number</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Receipt Date</th>
                <th className="py-3.5 px-4">Challan / Vehicle</th>
                <th className="py-3.5 px-4 text-center">Items Count</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin mx-auto mb-2" />
                    Loading GRNs...
                  </td>
                </tr>
              ) : grns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">
                    No Goods Received Notes found. Create and post a GRN in Phase 5 first.
                  </td>
                </tr>
              ) : (
                grns.map((grn) => (
                  <tr key={grn.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {grn.grn_number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {grn.supplier_name || 'Kaveri Delta Agro'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{grn.grn_date}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800">{grn.challan_number || '-'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{grn.vehicle_number || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {grn.items?.length || 0} Materials
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {grn.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedGRN(grn)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm transition"
                      >
                        Inspect & Post Inward
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect & Post Modal */}
      {selectedGRN && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                  Central Stock Ledger Inward
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  Post GRN #{selectedGRN.grn_number}
                </h2>
                <p className="text-xs text-slate-500">
                  Supplier: {selectedGRN.supplier_name || 'Kaveri Delta Agro'} • Challan: {selectedGRN.challan_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedGRN(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Accepted Materials & Batches to Post
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Material</th>
                      <th className="py-2.5 px-3">Batch Number</th>
                      <th className="py-2.5 px-3 text-right">Received</th>
                      <th className="py-2.5 px-3 text-right">Accepted (Inward)</th>
                      <th className="py-2.5 px-3 text-right">Rejected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedGRN.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{item.material_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.uom}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          {item.batch_number || 'AUTO-BATCH'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                          {item.current_received_qty || item.received_quantity || 0}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700 font-mono">
                          {item.accepted_qty || item.accepted_quantity || 0}
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-600 font-mono">
                          {item.rejected_qty || item.rejected_quantity || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0" />
              <span>
                <strong>Controlled Transaction Rule:</strong> Only accepted quantities are credited to the stock ledger. Rejected quantities are excluded. Duplicate postings are strictly blocked.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedGRN(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              {canPostInward && (
                <button
                  type="button"
                  disabled={posting}
                  onClick={() => handlePostInward(selectedGRN.id)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {posting ? 'Posting to Ledger...' : 'Confirm Stock Inward'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
