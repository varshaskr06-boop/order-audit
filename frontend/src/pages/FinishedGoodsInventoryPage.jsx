import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  Search,
  PlusCircle,
  RefreshCw,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Truck,
  ArrowDownLeft,
  Calendar
} from 'lucide-react';

export default function FinishedGoodsInventoryPage() {
  const { token, user, setActivePage } = useAuth();
  const [goods, setGoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [search, setSearch] = useState('');

  // Production FG Receipt Modal
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [inwardForm, setInwardForm] = useState({
    product_id: '1',
    quantity: '',
    batch_number: '',
    mfg_date: new Date().toISOString().slice(0, 10),
    expiry_date: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchFinishedGoods = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/inventory/finished-goods';
      if (search) url += `?search=${encodeURIComponent(search)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setGoods(json.data || []);
      } else {
        setError(json.message || 'Failed to fetch finished goods inventory');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching finished goods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinishedGoods();
  }, [token]);

  const handleInwardSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/inventory/inward/production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(inwardForm)
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setShowInwardModal(false);
        setInwardForm({
          product_id: '1',
          quantity: '',
          batch_number: '',
          mfg_date: new Date().toISOString().slice(0, 10),
          expiry_date: '',
          notes: ''
        });
        fetchFinishedGoods();
      } else {
        setError(json.message || 'Failed to record production inward');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setSubmitting(false);
    }
  };

  const role = (user?.role || '').toUpperCase();
  const canReceiveFromProd = ['PRODUCTION', 'ADMIN', 'OWNER'].includes(role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 uppercase">
              Module 3 • Finished Goods
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Live Saleable Stock Availability</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Finished Goods Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Idli & Dosa Batter Packs, Murukku, Madras Mixture • Cold Storage & Dispatch Bay
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canReceiveFromProd && (
            <button
              onClick={() => setShowInwardModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition"
            >
              <ArrowDownLeft className="h-4 w-4" /> Receive from Production
            </button>
          )}
          {['SALESMAN', 'ADMIN', 'OWNER'].includes(role) && (
            <button
              onClick={() => setActivePage('create-sales-order')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition"
            >
              <ShoppingBag className="h-4 w-4" /> Book Sales Order
            </button>
          )}
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

      {/* Finished Goods Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-80">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product SKU or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>
          <button
            onClick={fetchFinishedGoods}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Product SKU & Name</th>
                <th className="py-3.5 px-4">UOM</th>
                <th className="py-3.5 px-4 text-right">Available Stock</th>
                <th className="py-3.5 px-4 text-right">Production Inward</th>
                <th className="py-3.5 px-4 text-right">Dispatches</th>
                <th className="py-3.5 px-4 text-right">Min Stock</th>
                <th className="py-3.5 px-4 text-right">Reorder Level</th>
                <th className="py-3.5 px-4 text-right">MRP / Rate</th>
                <th className="py-3.5 px-4 text-right">Total Valuation</th>
                <th className="py-3.5 px-4 text-center">Saleable Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 text-purple-600 animate-spin mx-auto mb-2" />
                    Checking finished goods availability...
                  </td>
                </tr>
              ) : goods.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-10 text-center text-slate-400">
                    No finished products found.
                  </td>
                </tr>
              ) : (
                goods.map((fg) => {
                  const isAvailable = fg.current_stock > 0;
                  return (
                    <tr key={fg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{fg.item_name}</div>
                        <div className="text-[10px] font-mono text-purple-700 font-semibold">{fg.item_code}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{fg.uom}</td>
                      <td className="py-3.5 px-4 text-right font-black text-sm text-purple-950">
                        {fg.current_stock}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-700 font-mono">
                        +{fg.total_inward}
                      </td>
                      <td className="py-3.5 px-4 text-right text-blue-700 font-mono">
                        -{fg.total_outward}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                        {fg.min_stock_level}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                        {fg.reorder_level}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                        ₹{Number(fg.valuation_rate || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                        ₹{Number(fg.total_valuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isAvailable ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> READY TO DISPATCH
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            OUT OF STOCK
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

      {/* Receive from Production Modal */}
      {showInwardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 uppercase">
                  Production Inward Receipt
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">Receive Finished Goods</h2>
                <p className="text-xs text-slate-500">Record packed goods transferred into warehouse</p>
              </div>
              <button
                onClick={() => setShowInwardModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleInwardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Finished Product *</label>
                <select
                  value={inwardForm.product_id}
                  onChange={(e) => setInwardForm({ ...inwardForm, product_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  required
                >
                  <option value="1">Fresh Idli & Dosa Batter 1kg (FG-BAT-1KG)</option>
                  <option value="2">Traditional Madras Mixture 200g (FG-MIX-200G)</option>
                  <option value="3">Butter Murukku Crunch 200g (FG-MUR-200G)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity (Packs) *</label>
                  <input
                    type="number"
                    min="1"
                    value={inwardForm.quantity}
                    onChange={(e) => setInwardForm({ ...inwardForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                    placeholder="e.g. 200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={inwardForm.batch_number}
                    onChange={(e) => setInwardForm({ ...inwardForm, batch_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none"
                    placeholder="e.g. FG-BAT-260321-A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mfg Date *</label>
                  <input
                    type="date"
                    value={inwardForm.mfg_date}
                    onChange={(e) => setInwardForm({ ...inwardForm, mfg_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={inwardForm.expiry_date}
                    onChange={(e) => setInwardForm({ ...inwardForm, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Production Shift Notes</label>
                <textarea
                  rows="2"
                  value={inwardForm.notes}
                  onChange={(e) => setInwardForm({ ...inwardForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  placeholder="Morning stone grinding batch, cold stored at 4°C"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Recording Inward...' : 'Post to Stock Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
