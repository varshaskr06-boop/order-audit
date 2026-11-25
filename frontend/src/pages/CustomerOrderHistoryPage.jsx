import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Calendar,
  IndianRupee,
  ShoppingCart,
  ExternalLink,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Building2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  FileText
} from 'lucide-react';

export default function CustomerOrderHistoryPage() {
  const { user, token, setActivePage } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchOrder, setSearchOrder] = useState('');

  // Fetch customers list
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/master/customers?limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.customers?.length > 0) {
          setCustomers(data.customers);
          setSelectedCustomerId(data.customers[0].id);
        }
      } catch (err) {
        setError('Failed to fetch customer directory.');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [token]);

  // Fetch customer order history whenever selected customer changes
  useEffect(() => {
    if (!selectedCustomerId) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
        if (searchOrder.trim()) params.append('search', searchOrder.trim());

        const res = await fetch(
          `/api/sales/customers/${selectedCustomerId}/history?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (data.success) {
          setHistoryData(data);
        } else {
          throw new Error(data.error?.message || 'Failed to fetch customer history.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedCustomerId, statusFilter, searchOrder, token]);

  const customer = historyData?.customer;
  const orders = historyData?.orders || [];
  const totalSpend = historyData?.totalSpend || 0;
  const avgOrderValue = orders.length > 0 ? (totalSpend / orders.length).toFixed(2) : '0.00';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><Clock className="w-3.5 h-3.5" /> Submitted</span>;
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Draft</span>;
      case 'IN_PRODUCTION':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">In Production</span>;
      case 'READY':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Ready</span>;
      case 'DISPATCHED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800"><Truck className="w-3.5 h-3.5" /> Dispatched</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Order History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit customer purchasing patterns, cumulative spend, repeat order frequencies, and past invoices.
          </p>
        </div>

        <button
          onClick={() => setActivePage('create-sales-order')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-orange-900/20 transition active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" /> Place New Order
        </button>
      </div>

      {/* Customer Selector Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:w-1/3">
          <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">
            Select Customer Account:
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-white"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.business_name} ({c.code}) - {c.state}
              </option>
            ))}
          </select>
        </div>

        {/* Filter controls */}
        <div className="w-full md:w-2/3 flex flex-wrap items-center gap-3 pt-4 md:pt-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Order #..."
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-none"
            />
          </div>

          <div className="w-36">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 outline-none bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_PRODUCTION">In Production</option>
              <option value="READY">Ready</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="DRAFT">Draft</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Profile Banner & Lifetime Spend KPIs */}
      {customer && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Customer Profile Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider">
                Account Summary
              </span>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {customer.code}
              </span>
            </div>
            <h2 className="text-base font-black text-slate-900">{customer.business_name}</h2>
            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.shipping_address || customer.billing_address}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-500">
                <span>GSTIN: <strong className="font-mono text-slate-800">{customer.gstin || 'None'}</strong></span>
                <span>State Code: <strong className="text-slate-800">{customer.state_code}</strong></span>
              </div>
            </div>
          </div>

          {/* KPI 1: Lifetime Orders */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {historyData?.totalOrders || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Lifetime Transactions</div>
          </div>

          {/* KPI 2: Total Cumulative Spend */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Spend (₹)</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2">
              ₹{parseFloat(totalSpend).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Avg Order: ₹{parseFloat(avgOrderValue).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

      {/* Orders History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-2">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Past Orders & Line Items History
          </h2>
          <span className="text-xs text-slate-500 font-medium">{orders.length} order(s) listed</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading order records...</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No sales orders found for this customer matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Items Summary</th>
                  <th className="py-2.5 px-3 text-right">Taxable</th>
                  <th className="py-2.5 px-3 text-right">Tax</th>
                  <th className="py-2.5 px-3 text-right">Grand Total (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      <button
                        onClick={() => {
                          window.selectedOrderId = ord.id;
                          setActivePage('sales-order-details');
                        }}
                        className="hover:underline"
                      >
                        {ord.order_number}
                      </button>
                    </td>

                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {ord.order_date}
                    </td>

                    <td className="py-3 px-3 text-slate-700">
                      <div className="line-clamp-1 font-medium">
                        {(ord.items || []).map((it) => `${it.product_name} (${parseFloat(it.quantity).toFixed(0)})`).join(', ') || 'No items'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {ord.items?.length || 0} product(s) ordered
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                      ₹{parseFloat(ord.taxable_amount || 0).toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-right font-medium text-slate-500 whitespace-nowrap">
                      ₹{parseFloat(ord.total_tax_amount || 0).toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                      ₹{parseFloat(ord.grand_total || 0).toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(ord.status)}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
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
                          title="Print Document"
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
  );
}
