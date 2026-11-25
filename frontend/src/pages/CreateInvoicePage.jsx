import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Plus, Trash2, ArrowLeft, RefreshCw, Calculator,
  AlertTriangle, CheckCircle2, DollarSign
} from 'lucide-react';

const API = '/api/invoicing';

export default function CreateInvoicePage() {
  const { token, setActivePage } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [selectedSoId, setSelectedSoId] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [form, setForm] = useState({
    customer_id: '',
    customer_name: '',
    customer_gstin: '',
    billing_address: '',
    shipping_address: '',
    place_of_supply: 'Tamil Nadu',
    place_of_supply_code: '33',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split('T')[0];
    })(),
    payment_terms: 'Net 30 Days',
    notes: '',
    terms_conditions: 'Payment due on delivery or per agreed terms. Subject to Madurai jurisdiction.'
  });

  const [items, setItems] = useState([
    {
      product_id: '',
      product_name: '',
      product_sku: '',
      hsn_code: '2106',
      quantity: 10,
      uom: 'PKT',
      unit_price: 60.00,
      discount_percentage: 0,
      discount_amount: 0,
      gst_rate: 5.00
    }
  ]);

  const [preview, setPreview] = useState(null);

  // Load master data
  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, pRes, soRes] = await Promise.all([
          fetch('/api/master/customers', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/master/products', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/sales/orders', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const [cJson, pJson, soJson] = await Promise.all([cRes.json(), pRes.json(), soRes.json()]);

        if (cJson.success) setCustomers(cJson.data || []);
        if (pJson.success) setProducts(pJson.data || []);
        if (soJson.success) setSalesOrders(soJson.data || []);
      } catch (err) {
        setError('Failed to fetch reference master data');
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, [token]);

  // Handle Sales Order selection (Module 4: Generate from SO)
  const handleSoSelect = (soId) => {
    setSelectedSoId(soId);
    if (!soId) return;

    const so = salesOrders.find(o => o.id === parseInt(soId));
    if (!so) return;

    const cust = customers.find(c => c.id === so.customer_id) || {};
    setForm(p => ({
      ...p,
      customer_id: so.customer_id,
      customer_name: cust.business_name || so.customer_name || 'Customer',
      customer_gstin: cust.gstin || '',
      billing_address: so.delivery_address || cust.billing_address || '',
      shipping_address: so.delivery_address || cust.shipping_address || '',
      place_of_supply: cust.state || 'Tamil Nadu',
      place_of_supply_code: cust.state_code || '33',
      payment_terms: so.payment_terms || 'Net 30 Days'
    }));

    if (so.items && so.items.length) {
      setItems(so.items.map(it => ({
        product_id: it.product_id,
        product_name: it.product_name,
        product_sku: it.product_sku || 'FG-SKU',
        hsn_code: it.hsn_code || '2106',
        quantity: it.quantity,
        uom: it.uom || 'PKT',
        unit_price: it.unit_price,
        discount_percentage: it.discount_percentage || 0,
        discount_amount: it.discount_amount || 0,
        gst_rate: it.gst_rate || 5.00
      })));
    }
  };

  // Handle Customer Selection
  const handleCustomerSelect = (cId) => {
    const cust = customers.find(c => c.id === parseInt(cId));
    if (!cust) return;

    setForm(p => ({
      ...p,
      customer_id: cust.id,
      customer_name: cust.business_name,
      customer_gstin: cust.gstin || '',
      billing_address: cust.billing_address,
      shipping_address: cust.shipping_address || cust.billing_address,
      place_of_supply: cust.state || 'Tamil Nadu',
      place_of_supply_code: cust.state_code || '33'
    }));
  };

  // Handle Product Selection on item row
  const handleProductSelect = (index, pId) => {
    const prod = products.find(p => p.id === parseInt(pId));
    if (!prod) return;

    setItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        product_id: prod.id,
        product_name: prod.name,
        product_sku: prod.sku,
        hsn_code: prod.hsn_code || '2106',
        unit_price: Number(prod.selling_price || 0),
        gst_rate: Number(prod.gst_rate || 5.00)
      };
      return copy;
    });
  };

  const updateItem = (index, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        product_id: '',
        product_name: '',
        product_sku: '',
        hsn_code: '2106',
        quantity: 1,
        uom: 'PKT',
        unit_price: 0,
        discount_percentage: 0,
        discount_amount: 0,
        gst_rate: 5.00
      }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Live tax preview calculation (Module 5)
  const triggerTaxPreview = useCallback(async () => {
    try {
      const validItems = items.filter(it => it.quantity > 0 && it.unit_price >= 0);
      if (!validItems.length) return;

      const res = await fetch(`${API}/calculate-tax`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          place_of_supply_code: form.place_of_supply_code || '33',
          items: validItems
        })
      });
      const json = await res.json();
      if (json.success) setPreview(json.data);
    } catch {}
  }, [items, form.place_of_supply_code, token]);

  useEffect(() => {
    triggerTaxPreview();
  }, [triggerTaxPreview]);

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!form.customer_id) {
      setError('Please select a customer');
      setSubmitting(false);
      return;
    }

    const validItems = items.filter(it => it.product_id && it.quantity > 0);
    if (!validItems.length) {
      setError('Please add at least one valid product line item with quantity > 0');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...form,
        sales_order_id: selectedSoId ? parseInt(selectedSoId) : null,
        items: validItems
      };

      const res = await fetch(`${API}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        sessionStorage.setItem('selectedInvoiceId', json.data?.id);
        setActivePage('invoice-details');
      } else {
        setError(json.message || 'Failed to create invoice');
      }
    } catch (err) {
      setError('Network error creating invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('invoices')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-amber-500" /> Generate Sales Tax Invoice
            </h1>
            <p className="text-xs text-slate-500">Statutory Tax Invoice with live Indian GST engine calculation</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sales Order Reference / Source Selection */}
        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900">Generate From Approved Sales Order?</span>
            <span className="text-[10px] text-amber-700">(Auto-populates items, customer & taxes)</span>
          </div>
          <select
            value={selectedSoId}
            onChange={(e) => handleSoSelect(e.target.value)}
            className="text-xs border border-amber-300 rounded-xl px-3 py-1.5 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">-- Direct / Ad-hoc Tax Invoice --</option>
            {salesOrders.filter(o => ['APPROVED', 'DISPATCHED', 'PARTIALLY_DISPATCHED'].includes(o.status)).map(so => (
              <option key={so.id} value={so.id}>
                {so.order_number} ({so.customer_name}) - {fmt(so.grand_total)}
              </option>
            ))}
          </select>
        </div>

        {/* Customer & Billing Particulars */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. Customer & Place of Supply Particulars
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer *</label>
              <select
                required
                value={form.customer_id}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.business_name} ({c.gstin || 'Unreg'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer GSTIN</label>
              <input
                type="text"
                placeholder="e.g. 33AAAAA0000A1Z5"
                value={form.customer_gstin}
                onChange={e => setForm(p => ({ ...p, customer_gstin: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Place of Supply State *</label>
              <input
                type="text"
                required
                value={form.place_of_supply}
                onChange={e => setForm(p => ({ ...p, place_of_supply: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State Code (2 digits) *</label>
              <input
                type="text"
                maxLength="2"
                required
                value={form.place_of_supply_code}
                onChange={e => setForm(p => ({ ...p, place_of_supply_code: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <span className="text-[10px] text-slate-400">33 = TN (Intra-state). Other = Inter-state (IGST).</span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Address *</label>
              <textarea
                rows="2"
                required
                value={form.billing_address}
                onChange={e => setForm(p => ({ ...p, billing_address: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shipping Address</label>
              <textarea
                rows="2"
                value={form.shipping_address}
                onChange={e => setForm(p => ({ ...p, shipping_address: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Date *</label>
              <input
                type="date"
                required
                value={form.invoice_date}
                onChange={e => setForm(p => ({ ...p, invoice_date: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
              <input
                type="text"
                value={form.payment_terms}
                onChange={e => setForm(p => ({ ...p, payment_terms: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Goods & Taxable Line Items
            </h2>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-800"
            >
              <Plus className="h-3.5 w-3.5" /> Add Product Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2 text-left">Product / SKU</th>
                  <th className="px-3 py-2 text-left w-24">HSN</th>
                  <th className="px-3 py-2 text-right w-20">Qty</th>
                  <th className="px-3 py-2 text-left w-20">Unit</th>
                  <th className="px-3 py-2 text-right w-28">Price (₹)</th>
                  <th className="px-3 py-2 text-right w-24">Disc (₹)</th>
                  <th className="px-3 py-2 text-right w-24">GST %</th>
                  <th className="px-3 py-2 text-right w-28">Taxable</th>
                  <th className="px-3 py-2 text-center w-12">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2">
                      <select
                        value={item.product_id}
                        onChange={e => handleProductSelect(idx, e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                      >
                        <option value="">-- Select Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.hsn_code}
                        onChange={e => updateItem(idx, 'hsn_code', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.uom}
                        onChange={e => updateItem(idx, 'uom', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.discount_amount}
                        onChange={e => updateItem(idx, 'discount_amount', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={item.gst_rate}
                        onChange={e => updateItem(idx, 'gst_rate', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white text-right"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-800">
                      {fmt((Number(item.quantity) * Number(item.unit_price)) - Number(item.discount_amount || 0))}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Calculation Preview & Totals */}
        {preview && (
          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-bold">GST Engine Calculation Summary</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-amber-400 text-xs font-bold font-mono">
                {preview.supplyType} ({preview.isInterState ? 'IGST Applicable' : 'CGST + SGST Applicable'})
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-800/60 rounded-xl p-3">
                <span className="text-slate-400">Total Taxable Value</span>
                <div className="text-lg font-bold mt-1">{fmt(preview.totalTaxableValue)}</div>
              </div>
              {preview.isInterState ? (
                <div className="bg-amber-900/40 rounded-xl p-3 border border-amber-800/40">
                  <span className="text-amber-400">Total IGST (Inter-State)</span>
                  <div className="text-lg font-bold text-amber-300 mt-1">{fmt(preview.igstAmount)}</div>
                </div>
              ) : (
                <>
                  <div className="bg-slate-800/60 rounded-xl p-3">
                    <span className="text-slate-400">CGST (Intra-State)</span>
                    <div className="text-lg font-bold mt-1">{fmt(preview.cgstAmount)}</div>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-3">
                    <span className="text-slate-400">SGST (Intra-State)</span>
                    <div className="text-lg font-bold mt-1">{fmt(preview.sgstAmount)}</div>
                  </div>
                </>
              )}
              <div className="bg-emerald-900/40 rounded-xl p-3 border border-emerald-800/40">
                <span className="text-emerald-400">Grand Total (with GST)</span>
                <div className="text-xl font-black text-emerald-300 mt-1">{fmt(preview.totalInvoiceAmount)}</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
              <strong>Amount in Words:</strong> {preview.amountInWords}
            </div>
          </div>
        )}

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActivePage('invoices')}
            className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl flex items-center gap-2 shadow-sm"
          >
            {submitting ? 'Generating Invoice...' : 'Generate & Issue Tax Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
