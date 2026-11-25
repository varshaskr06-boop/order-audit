import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeftRight,
  PlusCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Warehouse,
  ShieldCheck,
  History,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function StockTransferPage() {
  const { token, user, setActivePage } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Transfer Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    from_location_id: '1',
    to_location_id: '3',
    item_id: '1',
    batch_id: '',
    quantity: '',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trfRes, locRes, rmRes] = await Promise.all([
        fetch('/api/inventory/transfers', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/inventory/locations', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/inventory/raw-materials', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const trfData = await trfRes.json();
      const locData = await locRes.json();
      const rmData = await rmRes.json();

      if (trfData.success) setTransfers(trfData.data || []);
      if (locData.success) setLocations(locData.data || []);
      if (rmData.success) setRawMaterials(rmData.data || []);
    } catch (err) {
      setError(err.message || 'Error loading transfer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/inventory/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setShowModal(false);
        setForm({
          from_location_id: '1',
          to_location_id: '3',
          item_id: '1',
          batch_id: '',
          quantity: '',
          notes: ''
        });
        fetchData();
      } else {
        setError(json.message || 'Failed to complete transfer');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setSubmitting(false);
    }
  };

  const role = (user?.role || '').toUpperCase();
  const canTransfer = ['PRODUCTION', 'ADMIN', 'OWNER'].includes(role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
              Module 8 • Stock Transfer
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Warehouse Inter-Location Movement</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Storage Location Stock Transfers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transfer materials between warehouses & processing bays with total stock conservation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canTransfer && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition"
            >
              <PlusCircle className="h-4 w-4" /> New Stock Transfer
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className="h-4 w-4" />
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

      {/* Stock Conservation Rule Alert */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 text-xs flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
        <div>
          <span className="font-bold">Stock Conservation Guarantee:</span> Transfers automatically debit the source location and credit the destination location simultaneously within a single ledger transaction. Overall company stock balance remains constant.
        </div>
      </div>

      {/* Transfers Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
            <History className="h-4 w-4 text-amber-600" />
            <span>Stock Transfer Log & Location Movement History</span>
          </div>
          <span className="text-xs text-slate-400">{transfers.length} Transfers recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Transfer #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Material Code & Name</th>
                <th className="py-3.5 px-4">Source Location</th>
                <th className="py-3.5 px-4 text-center">Movement</th>
                <th className="py-3.5 px-4">Destination Location</th>
                <th className="py-3.5 px-4 text-right">Transferred Qty</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 text-amber-600 animate-spin mx-auto mb-2" />
                    Loading transfer history...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400">
                    No location transfers recorded yet.
                  </td>
                </tr>
              ) : (
                transfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {trf.transfer_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{trf.transfer_date}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{trf.item_name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{trf.item_code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">
                      {trf.from_location_name}
                    </td>
                    <td className="py-3.5 px-4 text-center text-amber-600 font-bold">
                      <ArrowRight className="h-4 w-4 mx-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">
                      {trf.to_location_name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {trf.quantity} {trf.uom}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {trf.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                  Location Movement
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">Transfer Stock Between Locations</h2>
                <p className="text-xs text-slate-500">Source location balance will be debited and destination credited</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Material *</label>
                <select
                  value={form.item_id}
                  onChange={(e) => setForm({ ...form, item_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  required
                >
                  {rawMaterials.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.item_name} ({rm.item_code}) — Total Avail: {rm.current_stock} {rm.uom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source Location *</label>
                  <select
                    value={form.from_location_id}
                    onChange={(e) => setForm({ ...form, from_location_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                    required
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.location_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination Location *</label>
                  <select
                    value={form.to_location_id}
                    onChange={(e) => setForm({ ...form, to_location_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                    required
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.location_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Transfer *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none"
                    placeholder="e.g. 50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Notes</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
                    placeholder="Transfer for morning grinding"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Transferring...' : 'Execute Location Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
