import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Calendar,
  Truck,
  IndianRupee,
  Layers,
  Send,
  RotateCcw,
  AlertCircle,
  FileText,
  UserCheck,
  Check,
  Package,
  Activity
} from 'lucide-react';

export default function SalesOrderDetailsPage() {
  const { user, token, setActivePage } = useAuth();
  const orderId = window.selectedOrderId || 1;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Return for correction modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const role = (user?.role || '').toUpperCase();
  const canApprove = ['ADMIN', 'OWNER'].includes(role);
  const isProduction = ['PRODUCTION', 'ADMIN', 'OWNER'].includes(role);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sales/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to load order details.');
      setOrder(data.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId, token]);

  // Submit Order for Approval
  const handleSubmitForApproval = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/orders/${orderId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to submit order.');
      fetchOrderDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Order
  const handleApprove = async () => {
    if (!window.confirm('Approve this sales order for manufacturing allocation?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/orders/${orderId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: 'Approved by authorized manager.' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to approve order.');
      fetchOrderDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Order
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Mandatory rejection reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/orders/${orderId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to reject order.');
      setShowRejectModal(false);
      setRejectionReason('');
      fetchOrderDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Return Order for Correction
  const handleReturn = async () => {
    if (!returnReason.trim()) {
      alert('A reason is required when returning an order for correction.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/orders/${orderId}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: returnReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to return order.');
      setShowReturnModal(false);
      setReturnReason('');
      fetchOrderDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Update Status (IN_PRODUCTION, READY, DISPATCHED)
  const handleStatusTransition = async (nextStatus, message) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus, reason: message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to update order status.');
      fetchOrderDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-4 h-4" /> Approved</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800"><Clock className="w-4 h-4" /> Submitted</span>;
      case 'DRAFT':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Draft</span>;
      case 'IN_PRODUCTION':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><Activity className="w-4 h-4" /> In Production</span>;
      case 'READY':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800"><Package className="w-4 h-4" /> Ready for Dispatch</span>;
      case 'DISPATCHED':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800"><Truck className="w-4 h-4" /> Dispatched</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800"><XCircle className="w-4 h-4" /> Rejected</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading order details...</div>;
  }

  if (error || !order) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-3 max-w-xl mx-auto my-8">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600" /> Error Loading Order
        </div>
        <p>{error || 'Order record could not be found.'}</p>
        <button
          onClick={() => setActivePage('sales-orders')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-bold hover:bg-rose-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Orders List
        </button>
      </div>
    );
  }

  const isIntrastate = (order.customer_state_code || '33') === '33';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Navigation & Workflow Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <button
            onClick={() => setActivePage('sales-orders')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders Registry
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {order.order_number}
            </h1>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Order Date: <span className="font-semibold text-slate-700">{order.order_date}</span> • Created by <span className="font-semibold text-slate-700">{order.salesman_name}</span>
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Print Sales Order */}
          <a
            href={`/api/sales/orders/${order.id}/print`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition"
          >
            <Printer className="w-4 h-4 text-slate-600" /> Print Order Document
          </a>

          {/* DRAFT actions */}
          {order.status === 'DRAFT' && (
            <button
              onClick={handleSubmitForApproval}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-900/20 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> Submit for Approval
            </button>
          )}

          {/* SUBMITTED actions (Admin / Owner Only) */}
          {canApprove && order.status === 'SUBMITTED' && (
            <>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-900/20 active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Approve Order
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition"
              >
                <XCircle className="w-4 h-4" /> Reject Order
              </button>
              <button
                onClick={() => setShowReturnModal(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 transition"
              >
                <RotateCcw className="w-4 h-4" /> Return for Correction
              </button>
            </>
          )}

          {/* APPROVED actions (Send to Production) */}
          {isProduction && order.status === 'APPROVED' && (
            <button
              onClick={() => handleStatusTransition('IN_PRODUCTION', 'Manufacturing run initiated')}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-md active:scale-95 disabled:opacity-50"
            >
              <Activity className="w-4 h-4" /> Allocate to Production
            </button>
          )}

          {/* IN_PRODUCTION -> READY */}
          {isProduction && order.status === 'IN_PRODUCTION' && (
            <button
              onClick={() => handleStatusTransition('READY', 'Packaging and QC inspection complete')}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-md active:scale-95 disabled:opacity-50"
            >
              <Package className="w-4 h-4" /> Mark Ready for Dispatch
            </button>
          )}
        </div>
      </div>

      {/* Grid: Order Info & Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Customer Information Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" /> Customer Information (Bill To)
            </h3>
            <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              {order.customer_code}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="text-base font-black text-slate-900">{order.customer_name}</div>
            <div className="text-slate-600 flex justify-between">
              <span>GSTIN:</span>
              <span className="font-mono font-bold text-slate-800">{order.customer_gstin}</span>
            </div>
            <div className="text-slate-600 flex justify-between">
              <span>Contact Phone:</span>
              <span className="font-medium text-slate-800">{order.customer_phone}</span>
            </div>
            <div className="text-slate-600 flex justify-between">
              <span>State & Jurisdiction:</span>
              <span className={`font-semibold ${isIntrastate ? 'text-emerald-700' : 'text-blue-700'}`}>
                {order.customer_state} (State Code: {order.customer_state_code}) - {isIntrastate ? 'Intrastate TN' : 'Interstate'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 text-slate-600">
              <span className="block text-[11px] font-bold text-slate-400 uppercase">Delivery Address:</span>
              <p className="mt-0.5 text-slate-800 font-medium">{order.delivery_address || '—'}</p>
            </div>
          </div>
        </div>

        {/* Order Logistics Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-amber-600" /> Order Logistics & Approval
            </h3>
            <span className="text-[10px] font-bold uppercase text-slate-400">
              Terms: {order.payment_terms || 'Net 15'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Expected Delivery:</span>
              <span className="font-bold text-slate-900">{order.expected_delivery_date || 'Standard (3 Days)'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Assigned Salesman:</span>
              <span className="font-semibold text-slate-800">{order.salesman_name} ({order.salesman_email})</span>
            </div>
            {order.approved_by && (
              <div className="flex justify-between text-emerald-700 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                <span className="font-bold">Approved By:</span>
                <span className="font-bold">{order.approver_name || 'Admin'} ({order.approved_at ? new Date(order.approved_at).toLocaleDateString() : 'Yes'})</span>
              </div>
            )}
            {order.rejection_reason && (
              <div className="text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                <div className="font-bold text-[11px] uppercase tracking-wider">Rejection Reason:</div>
                <div className="mt-0.5 font-medium">{order.rejection_reason}</div>
              </div>
            )}
            {order.order_notes && (
              <div className="pt-2 border-t border-slate-100 text-slate-600">
                <span className="block text-[11px] font-bold text-slate-400 uppercase">Order Notes:</span>
                <p className="mt-0.5 text-slate-800 italic">"{order.order_notes}"</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Order Line Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-2">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" /> Ordered Food Products ({order.items?.length || 0} Line Items)
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">
            Stock Rule: Pre-production order. Inventory balances not yet deducted.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Product Description</th>
                <th className="py-2.5 px-2 text-center">HSN</th>
                <th className="py-2.5 px-2 text-right">Quantity</th>
                <th className="py-2.5 px-2 text-right">Master Price</th>
                <th className="py-2.5 px-2 text-right">Disc (₹)</th>
                <th className="py-2.5 px-2 text-right">Taxable</th>
                <th className="py-2.5 px-2 text-center">GST %</th>
                {isIntrastate ? (
                  <>
                    <th className="py-2.5 px-2 text-right">CGST</th>
                    <th className="py-2.5 px-2 text-right">SGST</th>
                  </>
                ) : (
                  <th className="py-2.5 px-2 text-right" colSpan="2">IGST</th>
                )}
                <th className="py-2.5 px-3 text-right">Line Total</th>
                <th className="py-2.5 px-3 text-center">Stock Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(order.items || []).map((it, idx) => (
                <tr key={it.id || idx} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 font-medium text-slate-400 text-center">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800">{it.product_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      SKU: {it.product_sku || '—'} | Pack: {it.pack_size || it.unit || 'Standard'}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-slate-500">{it.hsn_code || '2106'}</td>
                  <td className="py-3 px-2 text-right font-extrabold text-slate-900 whitespace-nowrap">
                    {parseFloat(it.quantity).toFixed(2)} {it.unit || ''}
                  </td>
                  <td className="py-3 px-2 text-right text-slate-600 whitespace-nowrap">
                    ₹{parseFloat(it.unit_price).toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-right text-rose-600 whitespace-nowrap">
                    {parseFloat(it.discount_amount || 0) > 0 ? `- ₹${parseFloat(it.discount_amount).toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3 px-2 text-right font-semibold text-slate-800 whitespace-nowrap">
                    ₹{parseFloat(it.taxable_amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-slate-600 whitespace-nowrap">
                    {parseFloat(it.gst_rate).toFixed(1)}%
                  </td>
                  {isIntrastate ? (
                    <>
                      <td className="py-3 px-2 text-right text-slate-600 whitespace-nowrap">
                        ₹{parseFloat(it.cgst_amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right text-slate-600 whitespace-nowrap">
                        ₹{parseFloat(it.sgst_amount || 0).toFixed(2)}
                      </td>
                    </>
                  ) : (
                    <td className="py-3 px-2 text-right text-slate-600 whitespace-nowrap" colSpan="2">
                      ₹{parseFloat(it.igst_amount || 0).toFixed(2)}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                    ₹{parseFloat(it.total_amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {it.stock_status || 'AVAILABLE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Totals Breakdown Bar */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-xs text-slate-500 space-y-2">
            <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">GST Calculation Summary:</div>
            <p>
              Buyer location: <strong className="text-slate-800">{order.customer_state} ({order.customer_state_code})</strong>.
              {isIntrastate
                ? ' Intrastate Tamil Nadu sale applies 50% CGST and 50% SGST on net taxable amounts.'
                : ' Interstate sale applies 100% IGST across state borders.'}
            </p>
            <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              ⚠️ Official GST Tax Invoice will be issued at the time of truck weigh-in and physical dispatch.
            </div>
          </div>

          <div className="space-y-2 text-xs bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between text-slate-600">
              <span>Gross Subtotal:</span>
              <span className="font-semibold text-slate-800">₹{parseFloat(order.subtotal_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Authorized Discounts:</span>
              <span className="font-semibold text-rose-600">- ₹{parseFloat(order.discount_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-slate-100">
              <span>Taxable Value:</span>
              <span>₹{parseFloat(order.taxable_amount || 0).toFixed(2)}</span>
            </div>
            {isIntrastate ? (
              <>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>CGST (Central Tax 50%):</span>
                  <span>₹{parseFloat(order.cgst_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>SGST (State Tax 50%):</span>
                  <span>₹{parseFloat(order.sgst_amount || 0).toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>IGST (Integrated Tax 100%):</span>
                <span>₹{parseFloat(order.igst_amount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-slate-100">
              <span>Total GST:</span>
              <span>₹{parseFloat(order.total_tax_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-900 text-slate-900">
              <span className="text-sm font-black uppercase">Grand Total:</span>
              <span className="text-xl font-black font-mono text-blue-700">₹{parseFloat(order.grand_total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit History Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" /> Order Status Audit Trail
        </h3>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {(order.history || []).map((h, i) => (
            <div key={h.id || i} className="relative flex items-start gap-4">
              <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100"></div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{h.to_status}</span>
                  <span className="text-[10px] text-slate-400">
                    {h.created_at ? new Date(h.created_at).toLocaleString() : 'Recent'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{h.reason || 'Status updated'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Reject Sales Order #{order.order_number}</h3>
            <p className="text-xs text-slate-500">Please provide a mandatory justification for rejecting this order:</p>
            <textarea
              rows="3"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Overdue outstanding balance of ₹45,000 pending clearance."
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return for Correction Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Return Order for Salesman Correction</h3>
            <p className="text-xs text-slate-500">Provide instructions to the salesman for updating this draft:</p>
            <textarea
              rows="3"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="e.g. Please verify delivery address and change payment terms to Net 15."
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 outline-none focus:border-amber-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReturn}
                disabled={actionLoading || !returnReason.trim()}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Return to Salesman
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
