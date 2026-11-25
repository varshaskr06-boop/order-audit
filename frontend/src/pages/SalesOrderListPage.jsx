import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  PlusCircle,
  ExternalLink,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  FileText,
  Calendar,
  AlertCircle,
  Send,
  Edit3
} from 'lucide-react';

export default function SalesOrderListPage() {
  const { user, token, setActivePage } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Rejection modal state
  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const role = (user?.role || '').toUpperCase();
  const canApprove = ['ADMIN', 'OWNER'].includes(role);
  const canCreate = ['SALESMAN', 'ADMIN', 'OWNER'].includes(role);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const res = await fetch(`/api/sales/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch sales orders.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, token]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  // Quick Approve Order (Admin / Owner)
  const handleQuickApprove = async (orderId) => {
    if (!window.confirm('Are you sure you want to approve this order for production allocation?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/orders/${orderId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: 'Quick approved from sales orders list.' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to approve order.');
      fetchOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Draft Order
  const handleQuickSubmit = async (orderId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/orders/${orderId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to submit order.');
      fetchOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Order with reason
  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Mandatory rejection reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/orders/${rejectModalOrder.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to reject order.');
      setRejectModalOrder(null);
      setRejectionReason('');
      fetchOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

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
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800">Dispatched</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Orders Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage sales pipeline, approve B2B orders, view tax calculation details, and print internal sales orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canApprove && (
            <button
              onClick={() => setActivePage('order-approvals')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 transition"
            >
              <Clock className="w-4 h-4" /> Approval Queue
            </button>
          )}

          {canCreate && (
            <button
              onClick={() => setActivePage('create-sales-order')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-orange-900/20 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" /> New Sales Order
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Order #, customer name, delivery address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Date Range From */}
          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-none"
              title="From Order Date"
            />
          </div>

          {/* Date Range To & Action */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-none"
              title="To Order Date"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
            >
              Filter
            </button>
          </div>
        </form>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {['ALL', 'SUBMITTED', 'APPROVED', 'IN_PRODUCTION', 'READY', 'DRAFT', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
          {(search || dateFrom || dateTo || statusFilter !== 'ALL') && (
            <button
              onClick={handleClearFilters}
              className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 font-semibold transition"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading sales orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <div>No sales orders match your search criteria.</div>
            {canCreate && (
              <button
                onClick={() => setActivePage('create-sales-order')}
                className="text-xs font-bold text-amber-600 hover:underline"
              >
                + Create the first sales order
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50/80">
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Salesman</th>
                  <th className="py-3 px-3 text-right">Taxable (₹)</th>
                  <th className="py-3 px-3 text-right">Tax (₹)</th>
                  <th className="py-3 px-3 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
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

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 line-clamp-1">{ord.customer_name}</div>
                      <div className="text-[10px] text-slate-400">
                        {ord.customer_state} ({ord.customer_state_code}) | GSTIN: {ord.customer_gstin || 'None'}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {ord.salesman_name}
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

                    {/* Actions */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => {
                            window.selectedOrderId = ord.id;
                            setActivePage('sales-order-details');
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="View Full Order Details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {/* Print Document */}
                        <a
                          href={`/api/sales/orders/${ord.id}/print`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 transition"
                          title="Print Sales Order"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </a>

                        {/* Submit draft */}
                        {ord.status === 'DRAFT' && (
                          <button
                            onClick={() => handleQuickSubmit(ord.id)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                            title="Submit for Manager Approval"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Admin / Owner Approve & Reject */}
                        {canApprove && ord.status === 'SUBMITTED' && (
                          <>
                            <button
                              onClick={() => handleQuickApprove(ord.id)}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                              title="Approve Order"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalOrder(ord);
                                setRejectionReason('');
                              }}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                              title="Reject Order with mandatory reason"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold">{orders.length}</span> of <span className="font-semibold">{totalCount}</span> orders
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50 transition font-medium"
            >
              Previous
            </button>
            <span className="font-bold text-slate-800">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50 transition font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory Rejection Reason Modal */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900">Reject Sales Order</h3>
                <p className="text-xs text-slate-500 font-mono">#{rejectModalOrder.order_number}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Food manufacturing policy requires a mandatory justification to reject an order (e.g. overdue credit balance, raw material stock shortage, transport capacity limits).
            </p>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Rejection Reason <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Buyer exceeded 45-day credit limit; ₹65,000 pending payment."
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOrder(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !rejectionReason.trim()}
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
