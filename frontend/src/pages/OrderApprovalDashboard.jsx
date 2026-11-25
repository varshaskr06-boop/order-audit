import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  Package,
  Calendar,
  Layers,
  IndianRupee,
  Search,
  Filter
} from 'lucide-react';

export default function OrderApprovalDashboard() {
  const { user, token, setActivePage } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Active Tab: PENDING (SUBMITTED) or APPROVED or REJECTED
  const [activeTab, setActiveTab] = useState('SUBMITTED');

  // Rejection & Return modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState(null); // 'REJECT' | 'RETURN'
  const [modalReason, setModalReason] = useState('');

  const role = (user?.role || '').toUpperCase();
  const isAuthorized = ['ADMIN', 'OWNER'].includes(role);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sales/orders?status=${activeTab}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch orders.');
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab, token]);

  // Handle Approve
  const handleApprove = async (orderId) => {
    if (!window.confirm('Approve this sales order for manufacturing allocation?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/orders/${orderId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: 'Approved by manager via approval dashboard.' }),
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

  // Handle Reject / Return Submit
  const handleModalSubmit = async () => {
    if (!modalReason.trim()) {
      alert('A reason is mandatory.');
      return;
    }
    setActionLoading(true);
    try {
      const endpoint = modalType === 'REJECT' ? 'reject' : 'return';
      const res = await fetch(`/api/sales/orders/${selectedOrder.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: modalReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `Failed to ${endpoint} order.`);
      setSelectedOrder(null);
      setModalType(null);
      setModalReason('');
      fetchOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-rose-200 text-center shadow-md space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Access Restricted (Admin & Owner Only)</h3>
        <p className="text-xs text-slate-600">
          Order approval authority is restricted exclusively to Admin and Owner roles. Sales representatives and production staff cannot approve orders.
        </p>
        <button
          onClick={() => setActivePage('sales-orders')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          View Sales Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Admin & Owner Authorization Queue
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Sales Order Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review customer creditworthiness, check stock availability, verify GST compliance, and authorize manufacturing allocation.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('SUBMITTED')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'SUBMITTED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'APPROVED' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Recently Approved
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'REJECTED' ? 'bg-white text-rose-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rejected Orders
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Orders List / Cards */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading approval queue...</div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <div className="font-bold text-slate-700">No {activeTab} orders at this moment.</div>
          <p className="text-slate-500">
            {activeTab === 'SUBMITTED'
              ? 'All submitted sales orders have been reviewed and approved.'
              : `No orders in ${activeTab} status found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const isIntrastate = (ord.customer_state_code || '33') === '33';

            return (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-extrabold text-blue-700">
                      {ord.order_number}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-medium">Order Date: {ord.order_date}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600">Salesman: <strong className="text-slate-800">{ord.salesman_name}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {ord.status}
                    </span>
                    <button
                      onClick={() => {
                        window.selectedOrderId = ord.id;
                        setActivePage('sales-order-details');
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Inspect Complete Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Customer Information */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Customer Details</div>
                    <div className="font-bold text-slate-900">{ord.customer_name}</div>
                    <div className="text-slate-600">GSTIN: <span className="font-mono font-medium">{ord.customer_gstin}</span></div>
                    <div className="text-slate-600">
                      State: {ord.customer_state} ({ord.customer_state_code}) • {isIntrastate ? 'Intrastate TN' : 'Interstate'}
                    </div>
                  </div>

                  {/* Delivery & Logistics */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Logistics & Terms</div>
                    <div className="text-slate-700">Delivery By: <span className="font-bold text-slate-900">{ord.expected_delivery_date || 'Standard'}</span></div>
                    <div className="text-slate-700">Payment Terms: <span className="font-semibold">{ord.payment_terms || 'Net 15'}</span></div>
                    {ord.order_notes && (
                      <div className="text-slate-500 italic line-clamp-1">Notes: "{ord.order_notes}"</div>
                    )}
                  </div>

                  {/* Order Financials */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-right">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Order Value</div>
                    <div className="text-lg font-black font-mono text-slate-900">
                      ₹{parseFloat(ord.grand_total || 0).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Taxable: ₹{parseFloat(ord.taxable_amount || 0).toFixed(2)} • GST: ₹{parseFloat(ord.total_tax_amount || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Items preview table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                        <th className="py-1 px-2">Item</th>
                        <th className="py-1 px-2 text-right">Qty</th>
                        <th className="py-1 px-2 text-right">Unit Price</th>
                        <th className="py-1 px-2 text-right">Disc</th>
                        <th className="py-1 px-2 text-right">Taxable</th>
                        <th className="py-1 px-2 text-center">GST %</th>
                        <th className="py-1 px-2 text-right">Total</th>
                        <th className="py-1 px-2 text-center">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(ord.items || []).map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="py-1.5 px-2 font-semibold text-slate-800">{it.product_name}</td>
                          <td className="py-1.5 px-2 text-right font-bold">{parseFloat(it.quantity).toFixed(0)} {it.unit}</td>
                          <td className="py-1.5 px-2 text-right">₹{parseFloat(it.unit_price).toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-right text-rose-600">
                            {parseFloat(it.discount_amount || 0) > 0 ? `-₹${parseFloat(it.discount_amount).toFixed(0)}` : '—'}
                          </td>
                          <td className="py-1.5 px-2 text-right font-medium">₹{parseFloat(it.taxable_amount).toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-center font-mono">{parseFloat(it.gst_rate).toFixed(0)}%</td>
                          <td className="py-1.5 px-2 text-right font-extrabold text-slate-900">₹{parseFloat(it.total_amount).toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-center">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {it.stock_status || 'AVAILABLE'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons (For Pending SUBMITTED orders) */}
                {ord.status === 'SUBMITTED' && (
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedOrder(ord);
                        setModalType('RETURN');
                        setModalReason('');
                      }}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Return for Correction
                    </button>

                    <button
                      onClick={() => {
                        setSelectedOrder(ord);
                        setModalType('REJECT');
                        setModalReason('');
                      }}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition"
                    >
                      <XCircle className="w-3.5 h-3.5 inline mr-1" /> Reject Order
                    </button>

                    <button
                      onClick={() => handleApprove(ord.id)}
                      disabled={actionLoading}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Approve Order
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject / Return Modal */}
      {selectedOrder && modalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">
              {modalType === 'REJECT' ? 'Reject Sales Order' : 'Return Order for Correction'} #{selectedOrder.order_number}
            </h3>
            <p className="text-xs text-slate-500">
              {modalType === 'REJECT'
                ? 'Mandatory food manufacturing rejection justification is required:'
                : 'Provide remarks to the salesman on what needs correction:'}
            </p>
            <textarea
              rows="3"
              value={modalReason}
              onChange={(e) => setModalReason(e.target.value)}
              placeholder={modalType === 'REJECT' ? 'e.g. Overdue credit balance exceeds ₹50,000.' : 'e.g. Please update delivery address to South Masi branch.'}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setModalType(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={actionLoading || !modalReason.trim()}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white disabled:opacity-50 ${
                  modalType === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {modalType === 'REJECT' ? 'Confirm Rejection' : 'Return Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
