import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Truck, Search, Filter, RefreshCw, PlusCircle, Eye,
  CheckCircle2, Clock, Navigation, AlertTriangle, Box, X
} from 'lucide-react';

const API = '/api/dispatch';

export default function DispatchOrdersPage() {
  const { token, setActivePage } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = statusFilter ? `${API}/orders?status=${statusFilter}` : `${API}/orders`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setOrders(json.data);
      else setError(json.message || 'Failed to load dispatch orders');
    } catch (e) {
      setError('Network error connecting to backend API');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const viewOrderDetails = async (id) => {
    try {
      const res = await fetch(`${API}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setSelectedOrder(json.data);
        setModalOpen(true);
      }
    } catch (e) {
      alert('Failed to fetch detailed order information');
    }
  };

  const STATUS_BADGES = {
    PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
    PACKED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    READY_FOR_DISPATCH: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    DISPATCHED: 'bg-blue-100 text-blue-800 border-blue-200',
    IN_TRANSIT: 'bg-purple-100 text-purple-800 border-purple-200',
    OUT_FOR_DELIVERY: 'bg-teal-100 text-teal-800 border-teal-200',
    DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    PARTIALLY_DELIVERED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    DELIVERY_FAILED: 'bg-rose-100 text-rose-800 border-rose-200',
    RETURNED: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  const filtered = orders.filter(o =>
    o.dispatch_order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.sales_order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    (o.transporter_name && o.transporter_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dispatch Orders</h1>
          <p className="text-sm text-slate-500">
            Module 1: Monitor outward order fulfillments, remaining balances &amp; cold chain transit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={() => setActivePage('create-dispatch')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" /> New Dispatch Order
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search order #, customer, SO #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PACKED">Packed</option>
            <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="IN_TRANSIT">In-Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>
      </div>

      {/* Dispatch Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3">Order Number</th>
                <th className="px-6 py-3">Sales Order</th>
                <th className="px-6 py-3">Customer Details</th>
                <th className="px-6 py-3 text-right">Dispatched Qty</th>
                <th className="px-6 py-3">Transporter</th>
                <th className="px-6 py-3">Expected Delivery</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    Loading dispatch orders...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    No dispatch orders matched the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-semibold text-slate-900 font-mono text-xs">
                      {d.dispatch_order_number}
                    </td>
                    <td className="px-6 py-3 text-slate-600 font-mono text-xs">
                      {d.sales_order_number}
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-slate-900">{d.customer_name}</p>
                      <p className="text-xs text-slate-400 truncate max-w-xs">{d.delivery_address}</p>
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-800">
                      {Number(d.total_dispatched_quantity).toFixed(0)} PKT
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium text-slate-800">{d.transporter_name || 'In-house Fleet'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{d.vehicle_number || 'TN-59-AB-1234'}</p>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {d.expected_delivery_date || '—'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${STATUS_BADGES[d.status] || 'bg-slate-100 text-slate-700'}`}>
                        {d.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => viewOrderDetails(d.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition"
                      >
                        <Eye className="h-3.5 w-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedOrder.dispatch_order_number}
                </h3>
                <p className="text-xs text-slate-500">
                  Sales Order Reference: {selectedOrder.sales_order_number}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-sm">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500">Customer</p>
                  <p className="font-semibold text-slate-900">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${STATUS_BADGES[selectedOrder.status]}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Dispatched Quantity</p>
                  <p className="font-semibold text-slate-900">{selectedOrder.total_dispatched_quantity} PKT</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Delivered Quantity</p>
                  <p className="font-semibold text-emerald-600">{selectedOrder.total_delivered_quantity || 0} PKT</p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Dispatched Products &amp; Batches</h4>
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-left">Batch #</th>
                      <th className="px-3 py-2 text-right">Ordered</th>
                      <th className="px-3 py-2 text-right">Prev Dispatched</th>
                      <th className="px-3 py-2 text-right">This Dispatch</th>
                      <th className="px-3 py-2 text-right">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedOrder.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-medium text-slate-800">{it.product_name}</td>
                        <td className="px-3 py-2 font-mono text-emerald-700">{it.batch_number}</td>
                        <td className="px-3 py-2 text-right">{it.ordered_quantity}</td>
                        <td className="px-3 py-2 text-right">{it.previously_dispatched_quantity}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">{it.dispatch_quantity}</td>
                        <td className="px-3 py-2 text-right font-semibold text-amber-600">{it.remaining_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Transport & Challan Info */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-xs">
                <div>
                  <p className="font-semibold text-slate-700">Transporter Details</p>
                  <p className="text-slate-600 mt-1">{selectedOrder.transporter_name || 'In-House'}</p>
                  <p className="text-slate-500">Vehicle: {selectedOrder.vehicle_number || '—'}</p>
                  <p className="text-slate-500">Driver: {selectedOrder.driver_name || '—'} ({selectedOrder.driver_phone || '—'})</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Special Instructions</p>
                  <p className="text-slate-600 mt-1 italic">{selectedOrder.special_instructions || 'Standard refrigerated dispatch'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 text-sm font-medium transition"
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
