import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  PlusCircle,
  FileText,
  Users,
  Search,
  ExternalLink,
  IndianRupee,
  Calendar,
  AlertCircle,
  RefreshCw,
  Printer
} from 'lucide-react';

export default function SalesOrderDashboard() {
  const { user, token, setActivePage } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const role = (user?.role || '').toUpperCase();
  const canApprove = ['ADMIN', 'OWNER'].includes(role);
  const canCreate = ['SALESMAN', 'ADMIN', 'OWNER'].includes(role);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/sales/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/sales/orders?limit=6', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();

      if (statsData.success) {
        setStats(statsData.stats);
      }
      if (ordersData.success) {
        setRecentOrders(ordersData.orders || []);
      }
    } catch (err) {
      setError('Failed to fetch sales dashboard data. Verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><Clock className="w-3.5 h-3.5" /> Submitted</span>;
      case 'DRAFT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Draft</span>;
      case 'IN_PRODUCTION':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">In Production</span>;
      case 'READY':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Ready</span>;
      case 'DISPATCHED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800">Dispatched</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-lg border border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              Phase 4: Sales Management
            </span>
            <span className="text-slate-400 text-xs">• Sri Meenakshi Agro & Traditional Foods</span>
          </div>
          <h1 className="text-2xl font-black mt-1 tracking-tight">Sales Order Dashboard</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Create B2B sales orders, verify GST rules (Tamil Nadu CGST/SGST vs Interstate IGST), monitor production approvals, and manage customer credit limits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-600 transition"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>

          {canCreate && (
            <button
              onClick={() => setActivePage('create-sales-order')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-orange-900/30 transition transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" /> New Sales Order
            </button>
          )}

          {canApprove && (
            <button
              onClick={() => setActivePage('order-approvals')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition transform active:scale-95"
            >
              <Clock className="w-4 h-4" /> Pending Approvals
            </button>
          )}

          <button
            onClick={() => setActivePage('sales-orders')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-600 transition"
          >
            <FileText className="w-3.5 h-3.5" /> All Orders
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setActivePage('sales-orders')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {loading ? '...' : stats?.totalOrders || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-slate-700">{stats?.draftOrders || 0} Draft</span> • 
            <span className="font-semibold text-blue-600">{stats?.submittedOrders || 0} Submitted</span>
          </div>
        </div>

        <div 
          onClick={() => setActivePage('order-approvals')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Review</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {loading ? '...' : stats?.submittedOrders || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Awaiting Manager Approval
          </div>
        </div>

        <div 
          onClick={() => setActivePage('sales-orders')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Orders</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {loading ? '...' : stats?.approvedOrders || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Cleared for Production / Ready
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Value (₹)</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{loading ? '...' : (stats?.totalOrderValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            ₹{(stats?.approvedOrderValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} Approved
          </div>
        </div>
      </div>

      {/* Grid: Benchmark Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* South Indian Food Manufacturing Product Mix */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Core Product Catalog</h2>
            <button 
              onClick={() => setActivePage('products')} 
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Master Catalog →
            </button>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Fresh Wet Idli/Dosa Batter (1kg)', sku: 'FG-001', gst: '5%', hsn: '2106', price: '₹60.00', shelf: '5 Days (Cold)' },
              { name: 'Traditional Madras Mixture (250g)', sku: 'FG-002', gst: '12%', hsn: '2106', price: '₹95.00', shelf: '60 Days' },
              { name: 'Handmade Kai Murukku (200g)', sku: 'FG-003', gst: '12%', hsn: '1905', price: '₹75.00', shelf: '45 Days' },
              { name: 'Pure Ghee Mysore Pak (250g)', sku: 'FG-004', gst: '5%', hsn: '2106', price: '₹180.00', shelf: '30 Days' },
              { name: 'Garlic & Cumin Crisp Appalam (100g)', sku: 'FG-005', gst: '5%', hsn: '1905', price: '₹35.00', shelf: '90 Days' },
            ].map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition text-xs">
                <div>
                  <div className="font-bold text-slate-800">{p.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">SKU: {p.sku} | HSN: {p.hsn} | GST: {p.gst}</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-slate-900">{p.price}</div>
                  <div className="text-[10px] text-amber-700 font-medium">{p.shelf}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-slate-500 bg-amber-50/70 p-3 rounded-xl border border-amber-200/60 text-amber-900">
            💡 <strong>Tamil Nadu Food GST:</strong> Wet batter & traditional milk/ghee sweets attract 5% GST; roasted snacks & savouries attract 12% GST.
          </div>
        </div>

        {/* Recent Sales Orders Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Recent Sales Orders</h2>
              <p className="text-xs text-slate-500">Live order pipeline and dispatch status</p>
            </div>
            <button
              onClick={() => setActivePage('sales-orders')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              View All Orders →
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading orders...</div>
          ) : recentOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No sales orders found. Click "New Sales Order" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/60">
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Taxable</th>
                    <th className="py-2.5 px-3 text-right">Grand Total</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">
                        {ord.order_number}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 line-clamp-1">{ord.customer_name}</div>
                        <div className="text-[10px] text-slate-400">State: {ord.customer_state} ({ord.customer_state_code})</div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {ord.order_date}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        ₹{parseFloat(ord.taxable_amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        ₹{parseFloat(ord.grand_total || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(ord.status)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              window.selectedOrderId = ord.id;
                              setActivePage('sales-order-details');
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="View Order Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`/api/sales/orders/${ord.id}/print`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 transition"
                            title="Print Sales Order"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
