import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText, PlusCircle, RefreshCw, X, AlertTriangle, Scale, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';

const API = '/api/invoicing';

export default function CreditDebitNotesPage() {
  const { token, user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canCreate = ['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role);

  const [activeTab, setActiveTab] = useState('CREDIT'); // 'CREDIT' | 'DEBIT'
  const [creditNotes, setCreditNotes] = useState([]);
  const [debitNotes, setDebitNotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    invoice_id: '',
    reason_type: 'SALES_RETURN',
    reason_description: '',
    total_taxable_value: '',
    gst_rate: '5',
    product_name: 'Goods Return Adjustment',
    quantity: '1',
    unit_price: '0'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cnRes, dnRes, invRes] = await Promise.all([
        fetch(`${API}/credit-notes`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/debit-notes`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/invoices?status=ISSUED`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [cnJson, dnJson, invJson] = await Promise.all([cnRes.json(), dnRes.json(), invRes.json()]);

      if (cnJson.success) setCreditNotes(cnJson.data || []);
      if (dnJson.success) setDebitNotes(dnJson.data || []);
      if (invJson.success) setInvoices(invJson.data || []);
    } catch {
      setError('Network error fetching notes');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const endpoint = activeTab === 'CREDIT' ? `${API}/credit-notes` : `${API}/debit-notes`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          invoice_id: parseInt(form.invoice_id),
          reason_type: form.reason_type,
          reason_description: form.reason_description,
          total_taxable_value: parseFloat(form.total_taxable_value),
          gst_rate: parseFloat(form.gst_rate),
          product_name: form.product_name,
          quantity: parseFloat(form.quantity || 1),
          unit_price: parseFloat(form.unit_price || 0)
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setForm({
          invoice_id: '',
          reason_type: activeTab === 'CREDIT' ? 'SALES_RETURN' : 'PRICE_INCREASE',
          reason_description: '',
          total_taxable_value: '',
          gst_rate: '5',
          product_name: '',
          quantity: '1',
          unit_price: '0'
        });
        fetchData();
      } else {
        setError(json.message || 'Error issuing note');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Scale className="h-7 w-7 text-amber-500" /> Credit Notes & Debit Notes
          </h1>
          <p className="text-sm text-slate-500 mt-1">Formal tax adjustments, sales returns, price corrections and damage write-offs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          {canCreate && (
            <button
              onClick={() => {
                setForm(p => ({
                  ...p,
                  reason_type: activeTab === 'CREDIT' ? 'SALES_RETURN' : 'PRICE_INCREASE'
                }));
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm"
            >
              <PlusCircle className="h-4 w-4" /> Issue {activeTab === 'CREDIT' ? 'Credit Note' : 'Debit Note'}
            </button>
          )}
        </div>
      </div>

      {error && !showModal && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('CREDIT')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'CREDIT' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowDownLeft className="h-4 w-4 text-emerald-400" /> Credit Notes ({creditNotes.length})
        </button>
        <button
          onClick={() => setActiveTab('DEBIT')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'DEBIT' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowUpRight className="h-4 w-4 text-amber-400" /> Debit Notes ({debitNotes.length})
        </button>
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
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3 text-left">Note Number</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Original Invoice</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-right">Taxable</th>
                  <th className="px-4 py-3 text-right">CGST</th>
                  <th className="px-4 py-3 text-right">SGST</th>
                  <th className="px-4 py-3 text-right">IGST</th>
                  <th className="px-4 py-3 text-right">Total Note</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeTab === 'CREDIT' ? creditNotes : debitNotes).length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-slate-400">
                      No {activeTab.toLowerCase()} notes issued yet
                    </td>
                  </tr>
                ) : (
                  (activeTab === 'CREDIT' ? creditNotes : debitNotes).map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {n.credit_note_number || n.debit_note_number}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{n.note_date}</td>
                      <td className="px-4 py-3 font-mono text-slate-700 font-semibold">{n.invoice_number}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{n.customer_name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                          {n.reason_type?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{fmt(n.total_taxable_value)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{fmt(n.cgst_amount)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{fmt(n.sgst_amount)}</td>
                      <td className="px-4 py-3 text-right font-medium text-amber-800">{fmt(n.igst_amount)}</td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">{fmt(n.total_note_amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                          {n.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-bold text-slate-900">
                Issue {activeTab === 'CREDIT' ? 'Credit Note (CN)' : 'Debit Note (DN)'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Original Invoice *</label>
                <select
                  required
                  value={form.invoice_id}
                  onChange={e => setForm(p => ({ ...p, invoice_id: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                >
                  <option value="">-- Choose Invoice to Adjust --</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} ({inv.customer_name}) - Total: {fmt(inv.total_invoice_amount)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason Code *</label>
                  <select
                    value={form.reason_type}
                    onChange={e => setForm(p => ({ ...p, reason_type: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                  >
                    {activeTab === 'CREDIT' ? (
                      <>
                        <option value="SALES_RETURN">Sales Return</option>
                        <option value="DAMAGED_GOODS">Damaged Goods / Leakage</option>
                        <option value="PRICE_ADJUSTMENT">Price Adjustment / Discount</option>
                        <option value="DEFICIENCY_OF_SERVICE">Deficiency of Service</option>
                        <option value="QUANTITY_CORRECTION">Quantity Correction</option>
                        <option value="OTHER">Other Reason</option>
                      </>
                    ) : (
                      <>
                        <option value="PRICE_INCREASE">Price Increase / Differential</option>
                        <option value="ADDITIONAL_QUANTITY">Additional Quantity</option>
                        <option value="OTHER_EXPENSES">Other Expenses Surcharge</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Applicable GST Rate % *</label>
                  <select
                    value={form.gst_rate}
                    onChange={e => setForm(p => ({ ...p, gst_rate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Taxable Adjustment Value (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  value={form.total_taxable_value}
                  onChange={e => setForm(p => ({ ...p, total_taxable_value: e.target.value }))}
                  placeholder="e.g. 500.00"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Reason / Audit Remarks</label>
                <textarea
                  rows="2"
                  value={form.reason_description}
                  onChange={e => setForm(p => ({ ...p, reason_description: e.target.value }))}
                  placeholder="Specify root cause for tax auditor verification..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              {form.total_taxable_value && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Base:</span>
                    <span className="font-semibold">{fmt(form.total_taxable_value)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST ({form.gst_rate}%):</span>
                    <span className="font-semibold">{fmt((Number(form.total_taxable_value) * Number(form.gst_rate)) / 100)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-bold text-slate-900">
                    <span>Total Note Amount:</span>
                    <span className="text-amber-700">
                      {fmt(Number(form.total_taxable_value) * (1 + Number(form.gst_rate) / 100))}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl"
                >
                  {submitting ? 'Issuing Note...' : 'Issue Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
