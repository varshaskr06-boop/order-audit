import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard, TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle,
  RefreshCw, PlusCircle, ArrowUpRight, ArrowDownRight, Scale, ShieldCheck,
  Building2, CheckCircle2, FileText, ArrowRightLeft, Users, Truck
} from 'lucide-react';

const API = '/api/payments';

export default function PaymentDashboard() {
  const { token, setActivePage } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || 'Failed to load payment overview');
    } catch (e) {
      setError('Network error connecting to backend API');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const STATUS_BADGES = {
    RECEIVED: 'bg-blue-100 text-blue-800',
    ALLOCATED: 'bg-emerald-100 text-emerald-800',
    PARTIALLY_ALLOCATED: 'bg-amber-100 text-amber-800',
    PAID: 'bg-emerald-100 text-emerald-800',
    PENDING_APPROVAL: 'bg-purple-100 text-purple-800',
    REVERSED: 'bg-rose-100 text-rose-800'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading payment & cash management overview...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const recent = data?.recent_transactions || [];
  const accounts = data?.accounts_overview || [];
  const methods = data?.payment_methods_summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Payment &amp; Treasury Management</h1>
              <p className="text-sm text-slate-500">
                Phase 12: Customer Receipts, Vendor Settlements, Bank Reconciliation &amp; Aging Control
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
            onClick={() => setActivePage('record-customer-payment')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" /> + Customer Receipt
          </button>
          <button
            onClick={() => setActivePage('record-supplier-payment')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" /> + Vendor Payment
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>CUSTOMER RECEIPTS</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{fmt(kpis.total_customer_received)}</p>
          <p className="text-xs text-slate-500 mt-1">Today: {fmt(kpis.today_receipts)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>VENDOR PAYMENTS</span>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{fmt(kpis.total_supplier_paid)}</p>
          <p className="text-xs text-slate-500 mt-1">Today: {fmt(kpis.today_payments)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>CUSTOMER RECEIVABLES</span>
            <Users className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{fmt(kpis.customer_outstanding)}</p>
          <p className="text-xs text-rose-600 font-semibold mt-1">Overdue: {fmt(kpis.overdue_customer_amount)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>SUPPLIER PAYABLES</span>
            <Truck className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{fmt(kpis.supplier_outstanding)}</p>
          <p className="text-xs text-rose-600 font-semibold mt-1">Overdue: {fmt(kpis.overdue_supplier_amount)}</p>
        </div>
      </div>

      {/* Cash & Bank Balances Grid */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-600" />
            Cash &amp; Bank Account Balances
          </h3>
          <button
            onClick={() => setActivePage('bank-accounts')}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
          >
            Manage Accounts <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {accounts.map(acc => (
            <div key={acc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${acc.type === 'BANK' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {acc.type}
              </span>
              <p className="text-xs font-semibold text-slate-900 mt-1 truncate">{acc.name}</p>
              <p className="text-base font-bold text-slate-800 mt-1">{fmt(acc.current_balance)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Treasury Workflow Modules</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setActivePage('customer-receipts')}
            className="p-3 bg-white hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg text-left transition"
          >
            <CreditCard className="h-5 w-5 text-emerald-600 mb-1" />
            <p className="text-xs font-semibold text-slate-800">Customer Receipts</p>
            <p className="text-[11px] text-slate-500">Inward collections &amp; advances</p>
          </button>

          <button
            onClick={() => setActivePage('supplier-payments')}
            className="p-3 bg-white hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg text-left transition"
          >
            <DollarSign className="h-5 w-5 text-blue-600 mb-1" />
            <p className="text-xs font-semibold text-slate-800">Supplier Payments</p>
            <p className="text-[11px] text-slate-500">Procurement vouchers &amp; bills</p>
          </button>

          <button
            onClick={() => setActivePage('payment-approvals')}
            className="p-3 bg-white hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg text-left transition"
          >
            <ShieldCheck className="h-5 w-5 text-purple-600 mb-1" />
            <p className="text-xs font-semibold text-slate-800">Payment Approvals</p>
            <p className="text-[11px] text-slate-500">Threshold (&gt;₹50k) audit queue</p>
          </button>

          <button
            onClick={() => setActivePage('bank-reconciliation')}
            className="p-3 bg-white hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg text-left transition"
          >
            <ArrowRightLeft className="h-5 w-5 text-cyan-600 mb-1" />
            <p className="text-xs font-semibold text-slate-800">Bank Reconciliation</p>
            <p className="text-[11px] text-slate-500">CSV import &amp; matching</p>
          </button>

          <button
            onClick={() => setActivePage('outstanding-reports')}
            className="p-3 bg-white hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg text-left transition"
          >
            <FileText className="h-5 w-5 text-amber-600 mb-1" />
            <p className="text-xs font-semibold text-slate-800">Outstanding Reports</p>
            <p className="text-[11px] text-slate-500">Receivables &amp; payables</p>
          </button>

          <button
            onClick={() => setActivePage('aging-reports')}
            className="p-3 bg-white hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg text-left transition"
          >
            <Scale className="h-5 w-5 text-rose-600 mb-1" />
            <p className="text-xs font-semibold text-slate-800">Aging Reports</p>
            <p className="text-[11px] text-slate-500">30/60/90+ day buckets</p>
          </button>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-700" />
            <h2 className="text-base font-semibold text-slate-800">Recent Payment Transactions</h2>
          </div>
          <button
            onClick={() => setActivePage('payment-history')}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
          >
            Full Transaction History <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3">Doc Reference</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Party Name</th>
                <th className="px-6 py-3">Payment Method</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                recent.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-semibold text-slate-800 font-mono text-xs">
                      {tx.reference}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {tx.date}
                    </td>
                    <td className="px-6 py-3 text-xs">
                      <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                        tx.type === 'CUSTOMER_RECEIPT' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {tx.type === 'CUSTOMER_RECEIPT' ? 'RECEIPT' : 'PAYMENT'}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {tx.party}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {tx.method?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-slate-900">
                      {fmt(tx.amount)}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_BADGES[tx.status] || 'bg-slate-100 text-slate-700'}`}>
                        {tx.status}
                      </span>
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
