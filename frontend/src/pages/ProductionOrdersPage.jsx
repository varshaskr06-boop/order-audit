import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Factory,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Eye,
  Layers,
  ChevronRight,
  X,
  Play,
  RotateCcw,
  Check
} from 'lucide-react';

export default function ProductionOrdersPage() {
  const { token, user, setActivePage } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Create Order Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    product_id: '',
    bom_id: '',
    planned_quantity: 100,
    planned_start_date: new Date().toISOString().split('T')[0],
    planned_end_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    priority: 'NORMAL',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Details Modal (BOM snapshot + Availability)
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [history, setHistory] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/production/orders';
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setOrders(json.data || []);
      else setError(json.error?.message || 'Failed to load production orders');
    } catch (err) {
      setError(err.message || 'Network error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [pRes, bRes] = await Promise.all([
        fetch('/api/master/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/master/boms', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [pJson, bJson] = await Promise.all([pRes.json(), bRes.json()]);
      if (pJson.success) setProducts(pJson.data || []);
      if (bJson.success) setBoms(bJson.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchOrders();
    fetchMasterData();
  }, [token, statusFilter]);

  const handleOpenDetails = async (order) => {
    setSelectedOrder(order);
    setDetailsLoading(true);
    try {
      const [reqRes, avRes, histRes] = await Promise.all([
        fetch(`/api/production/orders/${order.id}/requirements`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/production/orders/${order.id}/availability`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/production/orders/${order.id}/history`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [reqJson, avJson, histJson] = await Promise.all([reqRes.json(), avRes.json(), histRes.json()]);
      if (reqJson.success) setRequirements(reqJson.data || []);
      if (avJson.success) setAvailability(avJson.data || null);
      if (histJson.success) setHistory(histJson.data || []);
    } catch (_) {}
    finally {
      setDetailsLoading(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!createForm.product_id || !createForm.bom_id || !createForm.planned_quantity) {
      alert('Product, BOM and Planned Quantity are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/production/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(createForm)
      });
      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        fetchOrders();
      } else {
        alert(json.error?.message || 'Failed to create order');
      }
    } catch (err) {
      alert(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const reason = prompt(`Enter reason for updating status to ${newStatus}:`, 'Approved for processing');
    if (reason === null) return;
    try {
      const res = await fetch(`/api/production/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, reason })
      });
      const json = await res.json();
      if (json.success) {
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        alert(json.error?.message || 'Status transition failed');
      }
    } catch (err) {
      alert(err.message || 'Network error');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        o.order_number?.toLowerCase().includes(q) ||
        o.product_name?.toLowerCase().includes(q) ||
        o.product_sku?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
              📋
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Production Order Management
              </h1>
              <p className="text-xs text-slate-500">
                Module 2, 3 & 4 — Lifecycle tracking, BOM material calculations & stock availability guards
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {['ADMIN', 'OWNER', 'PRODUCTION'].includes(user?.role?.toUpperCase()) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              Create Production Order
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search order #, product SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="APPROVED">Approved</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">BOM Vers</th>
                <th className="py-3 px-4">Planned Qty</th>
                <th className="py-3 px-4">Actual Output</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Materials Issued</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">{order.order_number}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{order.product_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{order.product_sku}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{order.bom_version || 'v1.0'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{order.planned_quantity}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-600">
                      {order.actual_quantity || 0}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.status === 'COMPLETED'
                            ? 'bg-teal-100 text-teal-800'
                            : order.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800'
                            : order.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'PLANNED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {order.materials_issued ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Issued
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetails(order)}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" /> Details
                      </button>

                      {order.status === 'PLANNED' && ['ADMIN', 'OWNER'].includes(user?.role?.toUpperCase()) && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'APPROVED')}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                      )}

                      {order.status === 'APPROVED' && ['ADMIN', 'OWNER', 'PRODUCTION'].includes(user?.role?.toUpperCase()) && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'IN_PROGRESS')}
                          className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                        >
                          Start
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No production orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Create New Production Order</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product to Manufacture *</label>
                <select
                  value={createForm.product_id}
                  onChange={(e) => setCreateForm({ ...createForm, product_id: e.target.value })}
                  required
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select a Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select BOM (Recipe Version) *</label>
                <select
                  value={createForm.bom_id}
                  onChange={(e) => setCreateForm({ ...createForm, bom_id: e.target.value })}
                  required
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select Bill of Materials</option>
                  {boms.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.recipe_name} ({b.bom_version})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Planned Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.planned_quantity}
                    onChange={(e) => setCreateForm({ ...createForm, planned_quantity: e.target.value })}
                    required
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Planned Start Date *</label>
                  <input
                    type="date"
                    value={createForm.planned_start_date}
                    onChange={(e) => setCreateForm({ ...createForm, planned_start_date: e.target.value })}
                    required
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Planned End Date *</label>
                  <input
                    type="date"
                    value={createForm.planned_end_date}
                    onChange={(e) => setCreateForm({ ...createForm, planned_end_date: e.target.value })}
                    required
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Order Notes</label>
                <textarea
                  rows="2"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  placeholder="e.g. Prioritize morning production for fresh delivery..."
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                >
                  {submitting ? 'Creating...' : 'Snapshot BOM & Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedOrder.order_number} Details</h3>
                <p className="text-xs text-slate-500">{selectedOrder.product_name} ({selectedOrder.product_sku})</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Availability Check Summary */}
            {availability && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  availability.overall_status === 'ALL_AVAILABLE'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {availability.overall_status === 'ALL_AVAILABLE' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                  )}
                  <span>
                    Stock Status: {availability.overall_status === 'ALL_AVAILABLE' ? 'Sufficient for Production' : 'Shortage Detected in Phase 6 Inventory'}
                  </span>
                </div>
              </div>
            )}

            {/* Calculated BOM Requirements Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Calculated Material Requirements (Snapshot)
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Material</th>
                      <th className="py-2 px-3">Required</th>
                      <th className="py-2 px-3">Wastage %</th>
                      <th className="py-2 px-3">Issued</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {requirements.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2 px-3 text-[10px] font-bold text-slate-400">{r.material_type}</td>
                        <td className="py-2 px-3 font-semibold">{r.material_name}</td>
                        <td className="py-2 px-3 font-mono font-bold text-amber-700">
                          {r.required_quantity} {r.unit}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">{r.wastage_percentage}%</td>
                        <td className="py-2 px-3 font-mono text-emerald-600 font-bold">{r.issued_quantity || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status History */}
            {history.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Status Transition Audit Trail
                </h4>
                <div className="space-y-1.5 text-xs">
                  {history.map((h) => (
                    <div key={h.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-900">{h.old_status || 'INIT'} → {h.new_status}</span>
                        <span className="text-slate-500 text-[11px] ml-2 font-normal">({h.reason || 'No remarks'})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {h.changed_at ? new Date(h.changed_at).toLocaleString() : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
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
