import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Truck, PackageCheck, Navigation, Clock, AlertTriangle, CheckCircle2,
  RotateCcw, RefreshCw, PlusCircle, ArrowUpRight, ShieldCheck, Box,
  FileCheck2, Search, ExternalLink
} from 'lucide-react';

const API = '/api/dispatch';

export default function DispatchDashboard() {
  const { token, setActivePage } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || 'Failed to load dispatch statistics');
    } catch (e) {
      setError('Network error connecting to backend API');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

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
    RETURNED: 'bg-orange-100 text-orange-800 border-orange-200',
    CANCELLED: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading dispatch & logistics overview...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const recent = data?.recent_activities || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dispatch & Delivery Management</h1>
              <p className="text-sm text-slate-500">
                Phase 11: Real-time Outward Fulfillment, Cold Chain Tracking, Packing Slips & Challans
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={() => setActivePage('create-dispatch')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" /> Create Dispatch Order
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>TOTAL DISPATCHES</span>
            <Box className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{kpis.total_dispatch_orders || 0}</p>
          <p className="text-xs text-slate-500 mt-1">All outward orders</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>PENDING DISPATCH</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{kpis.pending_dispatches || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Awaiting packing/release</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>READY FOR DISPATCH</span>
            <PackageCheck className="h-4 w-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-bold text-cyan-600">{kpis.ready_for_dispatch || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Challan printed & loaded</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>IN-TRANSIT FLEET</span>
            <Navigation className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{kpis.in_transit_shipments || 0}</p>
          <p className="text-xs text-slate-500 mt-1">En route to customers</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>DELIVERED (POD)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{kpis.delivered_shipments || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Acknowledged by store</p>
        </div>
      </div>

      {/* Secondary Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">DELAYED DELIVERIES</p>
            <p className="text-xl font-bold text-rose-600 mt-1">{kpis.delayed_deliveries || 0}</p>
            <p className="text-xs text-slate-400">Past expected delivery date</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">QUARANTINED RETURNS</p>
            <p className="text-xl font-bold text-orange-600 mt-1">{kpis.returned_products_count || 0}</p>
            <p className="text-xs text-slate-400">Transit damage / inspection pending</p>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
            <RotateCcw className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">ACTIVE TRANSPORTERS</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{data?.transporters_count || 3}</p>
            <p className="text-xs text-slate-400">Cold chain road freight fleet</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg">
            <Truck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Quick Navigation Action Grid */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Dispatch Operations Workflow</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setActivePage('dispatch-orders')}
            className="p-3 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-left transition"
          >
            <Box className="h-5 w-5 text-emerald-600 mb-1" />
            <p className="text-xs font-semibold text-slate-800">Dispatch Orders</p>
            <p className="text-[11px] text-slate-500">Order fulfillment queue</p>
          </button>

          <button
            onClick={() => setActivePage('packing-management')}
            className="p-3 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-left transition"
          >
            <PackageCheck className="h-5 w-5 text-indigo-600 mb-1" />
            <p className="text-xs font-semibold text-slate-800">Packing Management</p>
            <p className="text-[11px] text-slate-500">Cartons &amp; packing slips</p>
          </button>

          <button
            onClick={() => setActivePage('delivery-challans')}
            className="p-3 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-left transition"
          >
            <FileCheck2 className="h-5 w-5 text-cyan-600 mb-1" />
            <p className="text-xs font-semibold text-slate-800">Delivery Challans</p>
            <p className="text-[11px] text-slate-500">Print transit documents</p>
          </button>

          <button
            onClick={() => setActivePage('shipment-tracking')}
            className="p-3 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-left transition"
          >
            <Navigation className="h-5 w-5 text-purple-600 mb-1" />
            <p className="text-xs font-semibold text-slate-800">Shipment Tracking</p>
            <p className="text-[11px] text-slate-500">Live milestones &amp; waypoints</p>
          </button>

          <button
            onClick={() => setActivePage('proof-of-delivery')}
            className="p-3 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-left transition"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mb-1" />
            <p className="text-xs font-semibold text-slate-800">Proof of Delivery</p>
            <p className="text-[11px] text-slate-500">POD signatures &amp; stamps</p>
          </button>

          <button
            onClick={() => setActivePage('delivery-returns')}
            className="p-3 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-left transition"
          >
            <RotateCcw className="h-5 w-5 text-orange-600 mb-1" />
            <p className="text-xs font-semibold text-slate-800">Customer Returns</p>
            <p className="text-[11px] text-slate-500">Damaged &amp; quarantine</p>
          </button>
        </div>
      </div>

      {/* Recent Dispatches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-slate-700" />
            <h2 className="text-base font-semibold text-slate-800">Recent Dispatch Shipments</h2>
          </div>
          <button
            onClick={() => setActivePage('dispatch-orders')}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            View All Dispatches <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3">Dispatch Order #</th>
                <th className="px-6 py-3">Sales Order</th>
                <th className="px-6 py-3">Customer Name</th>
                <th className="px-6 py-3 text-right">Qty (PKT)</th>
                <th className="px-6 py-3">Expected Date</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                    No dispatch orders created yet.
                  </td>
                </tr>
              ) : (
                recent.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-semibold text-slate-800 font-mono text-xs">
                      {d.dispatch_order_number}
                    </td>
                    <td className="px-6 py-3 text-slate-600 font-mono text-xs">
                      {d.sales_order_number}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {d.customer_name}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-800">
                      {Number(d.total_dispatched_quantity).toFixed(0)}
                    </td>
                    <td className="px-6 py-3 text-slate-600 text-xs">
                      {d.expected_delivery_date || '—'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                        d.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                        d.priority === 'EXPRESS' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {d.priority}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${STATUS_BADGES[d.status] || 'bg-slate-100 text-slate-700'}`}>
                        {d.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => setActivePage('dispatch-orders')}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Inspect
                      </button>
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
