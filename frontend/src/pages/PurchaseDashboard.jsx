import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  IndianRupee,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Filter,
  PlusCircle,
  Layers,
  Scale,
  Receipt,
  BarChart3,
  Search,
  Package
} from 'lucide-react';

export default function PurchaseDashboard() {
  const { user, token, setActivePage } = useAuth();
  const [stats, setStats] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [recentPOs, setRecentPOs] = useState([]);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const role = (user?.role || '').toUpperCase();
  const canApprove = ['ADMIN', 'OWNER'].includes(role);
  const canCreatePR = ['PRODUCTION', 'ADMIN', 'OWNER'].includes(role);
  const canCreatePO = ['ADMIN', 'OWNER'].includes(role);
  const canInvoice = ['ACCOUNTANT', 'ADMIN', 'OWNER'].includes(role);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filterSupplier) queryParams.append('supplierId', filterSupplier);
      if (filterStatus) queryParams.append('status', filterStatus);

      const [statsRes, posRes, suppliersRes, matchRes] = await Promise.all([
        fetch(`/api/purchase/stats?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/purchase/orders', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/master/suppliers', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ json: () => ({ suppliers: [] }) })),
        fetch('/api/purchase/matching', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ json: () => ({ data: [] }) })),
      ]);

      const statsData = await statsRes.json();
      const posData = await posRes.json();
      const supData = await suppliersRes.json();
      const matchData = await matchRes.json();

      if (statsData.success) setStats(statsData.data);
      if (posData.success) setRecentPOs(posData.data?.slice(0, 5) || []);
      if (supData.suppliers) setSuppliers(supData.suppliers);
      if (matchData.success) {
        setDiscrepancies(
          (matchData.data || []).filter((m) =>
            ['DISCREPANCY', 'PARTIALLY_MATCHED'].includes(m.match_status)
          )
        );
      }
    } catch (err) {
      setError('Failed to fetch procurement dashboard data. Verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token, filterSupplier, filterStatus]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5" /> Pending Approval
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Draft
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
            Received
          </span>
        );
      case 'PARTIALLY_RECEIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            Partial Receipt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getSupplierName = (id) => {
    const s = suppliers.find((sup) => sup.id === parseInt(id));
    return s ? s.name : `Supplier #${id}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold text-xs uppercase tracking-wider">
              Phase 5
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Purchase & Procurement Dashboard
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time material procurement, supplier orders, deliveries, and invoice matching
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {canCreatePR && (
            <button
              onClick={() => setActivePage('purchase-requisitions')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" /> + New PR
            </button>
          )}
          {canCreatePO && (
            <button
              onClick={() => setActivePage('purchase-orders')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" /> + New PO
            </button>
          )}
        </div>
      </div>

      {/* Discrepancy Alert Banner */}
      {discrepancies.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-rose-900">
                {discrepancies.length} Three-Way Matching Discrepancies Require Review
              </div>
              <div className="text-xs text-rose-700">
                Price or quantity mismatch detected between PO, Goods Receipt, and Supplier Invoice. Review before approving payment.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActivePage('three-way-matching')}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 transition-colors"
          >
            Review Discrepancies
          </button>
        </div>
      )}

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" /> Filters:
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Supplier:</label>
          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.state_code === '33' ? 'Tamil Nadu' : 'Interstate'})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">PO Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="RECEIVED">Received</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        {(filterSupplier || filterStatus) && (
          <button
            onClick={() => {
              setFilterSupplier('');
              setFilterStatus('');
            }}
            className="text-xs text-rose-600 font-semibold hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Requisitions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Purchase Requisitions
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <FileText className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {stats?.requisitions?.total || 0}
            </span>
            <span className="text-xs text-amber-600 font-bold">
              ({stats?.requisitions?.pending_approval || 0} pending)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>Approved: {stats?.requisitions?.total_approved || 0}</span>
            <button
              onClick={() => setActivePage('purchase-requisitions')}
              className="text-amber-600 font-bold hover:underline inline-flex items-center gap-1"
            >
              View PRs <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Purchase Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Purchase Orders
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Package className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {stats?.purchase_orders?.total || 0}
            </span>
            <span className="text-xs text-blue-600 font-bold">
              ({stats?.purchase_orders?.pending_approval || 0} pending)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>Approved: {stats?.purchase_orders?.total_approved || 0}</span>
            <button
              onClick={() => setActivePage('purchase-orders')}
              className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
            >
              View POs <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 3: Goods Receipts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Goods Receipts (GRN)
            </span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Truck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {stats?.goods_receipts?.total || 0}
            </span>
            <span className="text-xs text-purple-600 font-bold">
              ({stats?.goods_receipts?.total_posted || 0} posted)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>Total Qty: {stats?.goods_receipts?.total_received_qty || 0} units</span>
            <button
              onClick={() => setActivePage('goods-receipts')}
              className="text-purple-600 font-bold hover:underline inline-flex items-center gap-1"
            >
              View GRNs <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 4: Supplier Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Unpaid Invoices
            </span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <IndianRupee className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ₹{(stats?.invoices?.total_payable || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-rose-600 font-bold">
              ({stats?.invoices?.unpaid || 0} unpaid)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>Discrepancies: {stats?.three_way_matching?.discrepancies_pending_review || 0}</span>
            <button
              onClick={() => setActivePage('supplier-invoices')}
              className="text-rose-600 font-bold hover:underline inline-flex items-center gap-1"
            >
              View Invoices <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Procurement Process Quick Navigation */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold tracking-wide uppercase text-amber-400">
            Procurement Lifecycle Modules
          </div>
          <div className="text-xs text-slate-400">Sri Meenakshi ERP Standard Workflow</div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <button
            onClick={() => setActivePage('purchase-requisitions')}
            className="p-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-left transition-all border border-slate-700"
          >
            <div className="text-[10px] text-amber-400 font-bold">1. Requisition</div>
            <div className="text-xs font-bold mt-1">Purchase PRs</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Production needs</div>
          </button>

          <button
            onClick={() => setActivePage('supplier-quotations')}
            className="p-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-left transition-all border border-slate-700"
          >
            <div className="text-[10px] text-amber-400 font-bold">2. Quotation</div>
            <div className="text-xs font-bold mt-1">Supplier Quotes</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Price & terms</div>
          </button>

          <button
            onClick={() => setActivePage('quotation-comparison')}
            className="p-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-left transition-all border border-slate-700"
          >
            <div className="text-[10px] text-amber-400 font-bold">3. Compare</div>
            <div className="text-xs font-bold mt-1">Side-by-Side</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Lowest price badge</div>
          </button>

          <button
            onClick={() => setActivePage('purchase-orders')}
            className="p-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-left transition-all border border-slate-700"
          >
            <div className="text-[10px] text-amber-400 font-bold">4. Orders</div>
            <div className="text-xs font-bold mt-1">Purchase Orders</div>
            <div className="text-[10px] text-slate-400 mt-0.5">GST auto-split</div>
          </button>

          <button
            onClick={() => setActivePage('purchase-approvals')}
            className="p-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-left transition-all border border-slate-700"
          >
            <div className="text-[10px] text-amber-400 font-bold">5. Approval</div>
            <div className="text-xs font-bold mt-1">PO Approvals</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Admin & Owner</div>
          </button>

          <button
            onClick={() => setActivePage('goods-receipts')}
            className="p-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-left transition-all border border-slate-700"
          >
            <div className="text-[10px] text-amber-400 font-bold">6. Receipts</div>
            <div className="text-xs font-bold mt-1">Goods Receipts</div>
            <div className="text-[10px] text-slate-400 mt-0.5">QC & Batch tracking</div>
          </button>

          <button
            onClick={() => setActivePage('supplier-invoices')}
            className="p-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-left transition-all border border-slate-700"
          >
            <div className="text-[10px] text-amber-400 font-bold">7. Invoices</div>
            <div className="text-xs font-bold mt-1">Supplier Invoices</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tax ledger</div>
          </button>

          <button
            onClick={() => setActivePage('three-way-matching')}
            className="p-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-left transition-all border border-slate-700"
          >
            <div className="text-[10px] text-amber-400 font-bold">8. Verification</div>
            <div className="text-xs font-bold mt-1">3-Way Matching</div>
            <div className="text-[10px] text-slate-400 mt-0.5">PO ↔ GRN ↔ Invoice</div>
          </button>

          <button
            onClick={() => setActivePage('purchase-reports')}
            className="p-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-left transition-all border border-slate-700"
          >
            <div className="text-[10px] text-amber-400 font-bold">9. Reports</div>
            <div className="text-xs font-bold mt-1">Purchase Reports</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Export PDF & Excel</div>
          </button>

          {canApprove && (
            <button
              onClick={() => setActivePage('purchase-approvals')}
              className="p-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-left transition-all border border-amber-500/40"
            >
              <div className="text-[10px] font-bold uppercase">Executive Queue</div>
              <div className="text-xs font-bold mt-1 text-white">Approve Purchases</div>
              <div className="text-[10px] text-amber-200 mt-0.5">Review pending POs</div>
            </button>
          )}
        </div>
      </div>

      {/* Recent Purchase Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Purchase Orders</h2>
            <p className="text-xs text-slate-500">Latest orders placed with agro suppliers and packagers</p>
          </div>
          <button
            onClick={() => setActivePage('purchase-orders')}
            className="text-xs font-bold text-slate-900 hover:text-amber-600 inline-flex items-center gap-1"
          >
            View All ({stats?.purchase_orders?.total || 0}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">PO Number</th>
                <th className="px-5 py-3.5">Supplier</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Expected Delivery</th>
                <th className="px-5 py-3.5">Taxable Value</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPOs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-slate-400">
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                recentPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{po.po_number}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {getSupplierName(po.supplier_id)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{po.po_date}</td>
                    <td className="px-5 py-3.5 text-slate-500">{po.expected_delivery_date || 'TBD'}</td>
                    <td className="px-5 py-3.5 text-slate-700">₹{(po.taxable_amount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      ₹{(po.grand_total || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(po.status)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setActivePage('purchase-orders')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
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
