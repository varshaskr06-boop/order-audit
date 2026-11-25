import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText, ArrowLeft, Printer, Download, CheckCircle2,
  XCircle, AlertTriangle, ShieldCheck, DollarSign
} from 'lucide-react';

const API = '/api/invoicing';

export default function InvoiceDetailsPage() {
  const { token, user, setActivePage } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canManage = ['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role);

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const invoiceId = sessionStorage.getItem('selectedInvoiceId') || 1;

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setInvoice(json.data);
      else setError(json.message || 'Invoice not found');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [invoiceId, token]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  const handlePrint = () => {
    window.print();
  };

  const handleStatusUpdate = async (status) => {
    const reason = prompt(`Enter reason for marking as ${status}:`);
    if (!reason) return;
    try {
      const res = await fetch(`${API}/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, reason })
      });
      const json = await res.json();
      if (json.success) fetchInvoice();
      else alert(json.message);
    } catch {
      alert('Error updating status');
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !invoice) return (
    <div className="p-8 text-center space-y-3">
      <div className="text-rose-600 font-bold">{error || 'Invoice not found'}</div>
      <button onClick={() => setActivePage('invoices')} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
        Back to Invoices
      </button>
    </div>
  );

  const comp = invoice.company_profile || {};
  const items = invoice.items || [];
  const hsnList = invoice.tax_breakdowns || [];

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="print:hidden flex items-center justify-between">
        <button
          onClick={() => setActivePage('invoices')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </button>
        <div className="flex items-center gap-2">
          {canManage && !['PAID', 'CANCELLED', 'VOID'].includes(invoice.status) && (
            <button
              onClick={() => handleStatusUpdate('PAID')}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              Mark as Paid
            </button>
          )}
          {canManage && !['CANCELLED', 'VOID'].includes(invoice.status) && (
            <button
              onClick={() => handleStatusUpdate('CANCELLED')}
              className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
            >
              Cancel Invoice
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm"
          >
            <Printer className="h-4 w-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* STATUTORY GST TAX INVOICE PRINTABLE DOCUMENT (Module 6) */}
      <div className="bg-white border border-slate-300 rounded-2xl p-8 max-w-4xl mx-auto text-slate-800 text-xs shadow-md print:shadow-none print:border-none print:p-0">
        
        {/* Document Header */}
        <div className="text-center border-b border-slate-300 pb-4 mb-4">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Tax Invoice</div>
          <div className="text-lg font-black text-slate-950 uppercase tracking-tight">{comp.legal_name}</div>
          <div className="text-slate-600 mt-0.5">{comp.address_line1}, {comp.address_line2}, {comp.city} - {comp.pincode}, {comp.state}</div>
          <div className="font-mono text-slate-700 font-bold mt-1">
            GSTIN: <span className="text-slate-900">{comp.gstin}</span> • State Code: <span>{comp.state_code}</span> • PAN: <span>{comp.pan}</span>
          </div>
          <div className="text-[10px] text-slate-500">Phone: {comp.phone} • Email: {comp.email}</div>
        </div>

        {/* Invoice Metadata & Customer B2B Details */}
        <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-xl p-4 mb-4 bg-slate-50/50">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Invoice Particulars</div>
            <div className="font-bold text-slate-900 text-sm font-mono">{invoice.invoice_number}</div>
            <div className="mt-1"><strong>Invoice Date:</strong> {invoice.invoice_date}</div>
            <div><strong>Payment Due Date:</strong> {invoice.due_date || 'On Receipt'}</div>
            <div><strong>Payment Terms:</strong> {invoice.payment_terms}</div>
            {invoice.sales_order_number && (
              <div><strong>Sales Order Ref:</strong> {invoice.sales_order_number}</div>
            )}
            <div><strong>Reverse Charge:</strong> {invoice.reverse_charge ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Billed To (Recipient)</div>
            <div className="font-bold text-slate-900 text-sm">{invoice.customer_name}</div>
            <div className="text-slate-600 whitespace-pre-line mt-0.5">{invoice.billing_address}</div>
            <div className="mt-1 font-mono"><strong>Customer GSTIN:</strong> {invoice.customer_gstin || 'Unregistered / B2C'}</div>
            <div><strong>Place of Supply:</strong> {invoice.place_of_supply} (State Code: {invoice.place_of_supply_code})</div>
            <div>
              <strong>Supply Classification:</strong>{' '}
              <span className="font-bold">{invoice.supply_type === 'INTRA_STATE' ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-3 py-2 text-center w-8">#</th>
                <th className="px-3 py-2 text-left">Description of Goods</th>
                <th className="px-3 py-2 text-left w-16">HSN</th>
                <th className="px-3 py-2 text-right w-16">Qty</th>
                <th className="px-3 py-2 text-left w-12">Unit</th>
                <th className="px-3 py-2 text-right w-20">Rate (₹)</th>
                <th className="px-3 py-2 text-right w-20">Taxable</th>
                {invoice.supply_type === 'INTRA_STATE' ? (
                  <>
                    <th className="px-3 py-2 text-right w-16">CGST</th>
                    <th className="px-3 py-2 text-right w-16">SGST</th>
                  </>
                ) : (
                  <th className="px-3 py-2 text-right w-20">IGST</th>
                )}
                <th className="px-3 py-2 text-right w-24">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {it.product_name}
                    <div className="text-[10px] text-slate-400 font-mono">{it.product_sku}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-600">{it.hsn_code}</td>
                  <td className="px-3 py-2 text-right font-semibold">{it.quantity}</td>
                  <td className="px-3 py-2 text-slate-600">{it.uom}</td>
                  <td className="px-3 py-2 text-right">{fmt(it.unit_price)}</td>
                  <td className="px-3 py-2 text-right font-medium">{fmt(it.taxable_value)}</td>
                  {invoice.supply_type === 'INTRA_STATE' ? (
                    <>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {fmt(it.cgst_amount)}
                        <div className="text-[9px] text-slate-400">{it.cgst_rate}%</div>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {fmt(it.sgst_amount)}
                        <div className="text-[9px] text-slate-400">{it.sgst_rate}%</div>
                      </td>
                    </>
                  ) : (
                    <td className="px-3 py-2 text-right text-amber-800 font-semibold">
                      {fmt(it.igst_amount)}
                      <div className="text-[9px] text-slate-400">{it.igst_rate}%</div>
                    </td>
                  )}
                  <td className="px-3 py-2 text-right font-bold text-slate-900">{fmt(it.total_item_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* HSN Summary & Tax Breakdown Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="border border-slate-200 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase text-slate-500 mb-2">HSN / Tax Specification Summary</div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                  <th className="text-left pb-1">HSN</th>
                  <th className="text-right pb-1">Taxable</th>
                  <th className="text-right pb-1">Rate</th>
                  <th className="text-right pb-1">Tax Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hsnList.map((h, i) => (
                  <tr key={i}>
                    <td className="py-1 font-mono">{h.hsn_code}</td>
                    <td className="py-1 text-right">{fmt(h.taxable_value)}</td>
                    <td className="py-1 text-right">{h.gst_rate}%</td>
                    <td className="py-1 text-right font-bold">{fmt(h.total_tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Amount Totals Box */}
          <div className="border border-slate-200 rounded-xl p-3 space-y-1.5 bg-slate-50/50">
            <div className="flex justify-between text-slate-600">
              <span>Total Taxable Amount:</span>
              <span className="font-semibold text-slate-900">{fmt(invoice.total_taxable_value)}</span>
            </div>
            {invoice.supply_type === 'INTRA_STATE' ? (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Central GST (CGST):</span>
                  <span>{fmt(invoice.cgst_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>State GST (SGST):</span>
                  <span>{fmt(invoice.sgst_amount)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-amber-800 font-semibold">
                <span>Integrated GST (IGST):</span>
                <span>{fmt(invoice.igst_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Total Tax Amount:</span>
              <span className="font-semibold">{fmt(invoice.total_tax_amount)}</span>
            </div>
            {invoice.round_off_amount !== 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Round Off:</span>
                <span>{fmt(invoice.round_off_amount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-black text-slate-950">
              <span>Total Invoice Amount (INR):</span>
              <span className="text-base text-amber-700">{fmt(invoice.total_invoice_amount)}</span>
            </div>
          </div>
        </div>

        {/* Amount in words */}
        <div className="border border-slate-200 rounded-xl p-3 mb-4 bg-slate-50/30">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Amount Chargeable (in words):</span>
          <div className="font-bold text-slate-900 mt-0.5">{invoice.amount_in_words}</div>
        </div>

        {/* Bank Details & Terms & Signature */}
        <div className="grid grid-cols-2 gap-4 border-t border-slate-300 pt-4">
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase text-slate-400">Electronic Bank Transfer Particulars</div>
            <div><strong>Bank:</strong> {comp.bank_name}</div>
            <div><strong>A/C No:</strong> <span className="font-mono font-bold">{comp.bank_account_no}</span></div>
            <div><strong>IFSC:</strong> <span className="font-mono font-bold">{comp.bank_ifsc}</span></div>
            <div><strong>Branch:</strong> {comp.bank_branch}</div>
            <div className="text-[10px] text-slate-500 mt-2">
              <strong>Terms:</strong> {invoice.terms_conditions}
            </div>
          </div>

          <div className="text-right flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-900">For {comp.legal_name}</div>
              <div className="text-[10px] text-slate-400 mt-1">Computer Generated Tax Invoice</div>
            </div>
            <div className="mt-8 border-t border-slate-300 inline-block w-48 ml-auto pt-1 text-[11px] font-semibold text-slate-600">
              Authorized Signatory
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
