import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText, PlusCircle, Search, RefreshCw, Eye, CheckCircle2,
  XCircle, AlertTriangle, Download, ArrowUpRight
} from 'lucide-react';

const API = '/api/invoicing';

export default function InvoiceListPage() {
  const { token, user, setActivePage } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canCreate = ['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [supplyFilter, setSupplyFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (supplyFilter !== 'ALL') params.set('supply_type', supplyFilter);
      if (search) params.set('search', search);

      const res = await fetch(`${API}/invoices?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setInvoices(json.data || []);
      else setError(json.message || 'Failed to fetch invoices');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, supplyFilter, search]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleStatusChange = async (id, newStatus) => {
    const reason = newStatus === 'CANCELLED' 
      ? prompt('Enter cancellation reason:') 
      : `Status changed to ${newStatus}`;
    if (newStatus === 'CANCELLED' && !reason) return;

    try {
      const res = await fetch(`${API}/invoices/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, reason })
      });
      const json = await res.json();
      if (json.success) fetchInvoices();
      else alert(json.message || 'Error updating status');
    } catch {
      alert('Network error');
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const STATUS_BADGES = {
    ISSUED: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    PAID: 'bg-emerald-100 text-emerald-800',
    PARTIALLY_PAID: 'bg-amber-100 text-amber-800',
    OVERDUE: 'bg-rose-100 text-rose-800',
    CANCELLED: 'bg-slate-100 text-slate-500 line-through',
    DRAFT: 'bg-slate-100 text-slate-700'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-amber-500" /> Sales Tax Invoices Registry
          </h1>
          <p className="text-sm text-slate-500 mt-1">Official GST Tax Invoices generated for domestic B2B and B2C sales</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchInvoices}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          {canCreate && (
            <button
              onClick={() => setActivePage('create-invoice')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              <PlusCircle className="h-4 w-4" /> Create Invoice
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-80">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search invoice #, customer name, GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ISSUED">ISSUED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PAID">PAID</option>
            <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
            <option value="OVERDUE">OVERDUE</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="DRAFT">DRAFT</option>
          </select>

          <select
            value={supplyFilter}
            onChange={(e) => setSupplyFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="ALL">All Supply Types</option>
            <option value="INTRA_STATE">Intra-State (TN 33)</option>
            <option value="INTER_STATE">Inter-State (IGST)</option>
          </select>

          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
            {invoices.length} invoices
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Invoice No</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">GSTIN</th>
                  <th className="px-4 py-3 text-left">POS</th>
                  <th className="px-4 py-3 text-right">Taxable</th>
                  <th className="px-4 py-3 text-right">CGST</th>
                  <th className="px-4 py-3 text-right">SGST</th>
                  <th className="px-4 py-3 text-right">IGST</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-12 text-slate-400">
                      No invoices found matching criteria
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-slate-600">{inv.invoice_date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {inv.customer_name}
                        {inv.sales_order_number && (
                          <div className="text-[10px] text-slate-400 font-mono">{inv.sales_order_number}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">{inv.customer_gstin || 'B2C'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="font-semibold">{inv.place_of_supply_code}</span> ({inv.place_of_supply})
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">{fmt(inv.total_taxable_value)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{fmt(inv.cgst_amount)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{fmt(inv.sgst_amount)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-800">{fmt(inv.igst_amount)}</td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">{fmt(inv.total_invoice_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${STATUS_BADGES[inv.status] || 'bg-slate-100 text-slate-700'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              sessionStorage.setItem('selectedInvoiceId', inv.id);
                              setActivePage('invoice-details');
                            }}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                            title="View / Print Tax Invoice"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {canCreate && !['PAID', 'CANCELLED', 'VOID'].includes(inv.status) && (
                            <button
                              onClick={() => handleStatusChange(inv.id, 'PAID')}
                              className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold"
                              title="Mark as Paid"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canCreate && !['CANCELLED', 'VOID'].includes(inv.status) && (
                            <button
                              onClick={() => handleStatusChange(inv.id, 'CANCELLED')}
                              className="p-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold"
                              title="Cancel Invoice"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
