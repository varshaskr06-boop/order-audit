import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Trash2,
  Save,
  Send,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Building2,
  Calendar,
  Truck,
  IndianRupee,
  Layers,
  Info,
  PackageCheck
} from 'lucide-react';

export default function CreateSalesOrderPage() {
  const { user, token, setActivePage } = useAuth();

  // Master data lists
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 15');
  const [orderNotes, setOrderNotes] = useState('');

  // Line items state
  const [items, setItems] = useState([
    { product_id: '', quantity: 10, discount_percentage: 0, discount_amount: 0 },
  ]);

  // Live preview calculation state
  const [pricingPreview, setPricingPreview] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Selected customer object
  const selectedCustomer = customers.find((c) => String(c.id) === String(selectedCustomerId));
  const isIntrastate = selectedCustomer ? (selectedCustomer.state_code || '33') === '33' : true;

  // Load Customers & Products on mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingMasters(true);
      try {
        const [custRes, prodRes] = await Promise.all([
          fetch('/api/master/customers?is_active=true&limit=100', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/master/products?is_active=true&limit=100', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const custData = await custRes.json();
        const prodData = await prodRes.json();

        if (custData.success) {
          setCustomers(custData.customers || []);
          if (custData.customers && custData.customers.length > 0) {
            const first = custData.customers[0];
            setSelectedCustomerId(first.id);
            setDeliveryAddress(first.shipping_address || first.billing_address || '');
          }
        }
        if (prodData.success) {
          setProducts(prodData.products || []);
          if (prodData.products && prodData.products.length > 0) {
            setItems([
              { product_id: prodData.products[0].id, quantity: 20, discount_percentage: 0, discount_amount: 0 },
            ]);
          }
        }
      } catch (err) {
        setErrorMessage('Failed to load customers and products catalog.');
      } finally {
        setLoadingMasters(false);
      }
    };

    loadData();
  }, [token]);

  // Handle Customer Selection Change
  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    const cust = customers.find((c) => String(c.id) === String(custId));
    if (cust) {
      setDeliveryAddress(cust.shipping_address || cust.billing_address || '');
    }
  };

  // Add Item Line
  const handleAddItem = () => {
    const defaultProdId = products.length > 0 ? products[0].id : '';
    setItems([
      ...items,
      { product_id: defaultProdId, quantity: 10, discount_percentage: 0, discount_amount: 0 },
    ]);
  };

  // Remove Item Line
  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      alert('Order must contain at least one line item.');
      return;
    }
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
  };

  // Update item field
  const handleItemFieldChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Debounced / Real-time pricing calculation from backend
  useEffect(() => {
    if (!selectedCustomerId || items.length === 0) return;

    // Filter valid items
    const validItems = items.filter(
      (it) => it.product_id && parseFloat(it.quantity) > 0
    );
    if (validItems.length === 0) return;

    let isMounted = true;
    setCalculating(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/sales/orders/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customer_id: selectedCustomerId,
            items: validItems,
          }),
        });

        const data = await res.json();
        if (isMounted) {
          if (data.success && data.pricing) {
            setPricingPreview(data.pricing);
            setErrorMessage(null);
          } else {
            setPricingPreview(null);
          }
        }
      } catch (err) {
        // quiet error on preview
      } finally {
        if (isMounted) setCalculating(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedCustomerId, items, token]);

  // Submit Order (DRAFT or SUBMITTED)
  const handleSubmitOrder = async (targetStatus) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedCustomerId) {
      setErrorMessage('Please select a customer for this order.');
      return;
    }

    if (!deliveryAddress.trim()) {
      setErrorMessage('Delivery address is required for food safety and dispatch routing.');
      return;
    }

    const validItems = items.filter(
      (it) => it.product_id && parseFloat(it.quantity) > 0
    );
    if (validItems.length === 0) {
      setErrorMessage('Please add at least one product with quantity greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_id: selectedCustomerId,
        order_number: orderNumber ? orderNumber.trim() : undefined,
        expected_delivery_date: expectedDeliveryDate || undefined,
        delivery_address: deliveryAddress.trim(),
        payment_terms: paymentTerms,
        order_notes: orderNotes.trim(),
        status: targetStatus,
        items: validItems.map((it) => ({
          product_id: Number(it.product_id),
          quantity: parseFloat(it.quantity),
          discount_percentage: parseFloat(it.discount_percentage || 0),
          discount_amount: parseFloat(it.discount_amount || 0),
        })),
      };

      const res = await fetch('/api/sales/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to create sales order.');
      }

      setSuccessMessage(
        `Sales order ${data.order?.order_number} created successfully (${targetStatus})!`
      );

      setTimeout(() => {
        if (data.order?.id) {
          window.selectedOrderId = data.order.id;
          setActivePage('sales-order-details');
        } else {
          setActivePage('sales-orders');
        }
      }, 1200);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <button
            onClick={() => setActivePage('sales-orders')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Sales Order</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Prices and GST are automatically calculated server-side based on the client master catalog and GST jurisdiction.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmitOrder('DRAFT')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmitOrder('SUBMITTED')}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition active:scale-95 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Submit for Approval
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Order & Customer Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Customer & Logistics Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" /> Customer & Dispatch Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Select Customer <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={handleCustomerChange}
                  disabled={loadingMasters}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-white font-medium"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.business_name} ({c.code}) - {c.state} [{c.state_code}]
                    </option>
                  ))}
                </select>

                {selectedCustomer && (
                  <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex justify-between">
                      <span>GSTIN:</span> <span className="font-mono font-semibold text-slate-800">{selectedCustomer.gstin || 'Unregistered'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jurisdiction:</span> 
                      <span className={`font-semibold ${isIntrastate ? 'text-emerald-700' : 'text-blue-700'}`}>
                        {isIntrastate ? 'Intrastate (Tamil Nadu 33 - CGST+SGST)' : `Interstate (${selectedCustomer.state} ${selectedCustomer.state_code} - IGST)`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credit Limit:</span> 
                      <span className="font-bold text-slate-800">₹{parseFloat(selectedCustomer.credit_limit || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Number & Delivery Date */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Sales Order # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated e.g. SO-2026-003"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Leave blank to auto-generate unique sequence.</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address & Payment Terms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Delivery / Dispatch Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="2"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Complete shipping address for cold van / transport dispatch..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-white"
                >
                  <option value="Net 7">Net 7 Days</option>
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 45">Net 45 Days</option>
                  <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                  <option value="Advance 100%">100% Advance Payment</option>
                </select>

                <div className="mt-2">
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Sales Notes / Special Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Early morning 6 AM gate delivery"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Line Items Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-600" /> Order Products & Quantities
                </h2>
                <p className="text-[11px] text-slate-500">Add products, quantities, and authorized line discounts.</p>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition border border-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50">
                    <th className="py-2.5 px-3">Product Description</th>
                    <th className="py-2.5 px-2 text-right">Master Price</th>
                    <th className="py-2.5 px-2 text-right">Quantity</th>
                    <th className="py-2.5 px-2 text-right">Disc %</th>
                    <th className="py-2.5 px-2 text-right">Taxable</th>
                    <th className="py-2.5 px-2 text-center">GST</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                    <th className="py-2.5 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => {
                    const prod = products.find((p) => String(p.id) === String(item.product_id));
                    const previewItem = pricingPreview?.items?.[index];

                    return (
                      <tr key={index} className="hover:bg-slate-50/60 transition">
                        {/* Product Selector */}
                        <td className="py-2.5 px-3">
                          <select
                            value={item.product_id}
                            onChange={(e) => handleItemFieldChange(index, 'product_id', e.target.value)}
                            className="w-full text-xs font-semibold rounded-lg border border-slate-300 p-1.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-white"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} [{p.sku}] - ₹{parseFloat(p.selling_price).toFixed(2)}
                              </option>
                            ))}
                          </select>
                          {prod && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Pack: {prod.pack_size || prod.unit} | HSN: {prod.hsn_code} | Cat: {prod.category}
                            </div>
                          )}
                        </td>

                        {/* Price */}
                        <td className="py-2.5 px-2 text-right font-medium text-slate-700 whitespace-nowrap">
                          ₹{prod ? parseFloat(prod.selling_price).toFixed(2) : '0.00'}
                        </td>

                        {/* Quantity */}
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => handleItemFieldChange(index, 'quantity', e.target.value)}
                            className="w-20 text-xs text-right font-bold rounded-lg border border-slate-300 p-1.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                        </td>

                        {/* Discount % */}
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={item.discount_percentage}
                            onChange={(e) => handleItemFieldChange(index, 'discount_percentage', e.target.value)}
                            className="w-16 text-xs text-right rounded-lg border border-slate-300 p-1.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                        </td>

                        {/* Taxable */}
                        <td className="py-2.5 px-2 text-right font-semibold text-slate-800 whitespace-nowrap">
                          ₹{previewItem ? previewItem.taxable_amount.toFixed(2) : '—'}
                        </td>

                        {/* GST % */}
                        <td className="py-2.5 px-2 text-center text-[11px] font-mono whitespace-nowrap">
                          {prod ? `${parseFloat(prod.gst_rate).toFixed(0)}%` : '—'}
                        </td>

                        {/* Total */}
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                          ₹{previewItem ? previewItem.total_amount.toFixed(2) : '—'}
                        </td>

                        {/* Remove */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Remove line item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-between items-center text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                Line item prices cannot be tampered with; they are fetched directly from the database.
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                + Add another item
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Server Pricing Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-lg border border-slate-700 space-y-5 sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <IndianRupee className="w-4 h-4" /> Order Financial Summary
              </h3>
              {calculating && <span className="text-[10px] text-slate-400 animate-pulse">Calculating...</span>}
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Gross Subtotal:</span>
                <span className="font-mono font-medium">
                  ₹{pricingPreview ? pricingPreview.subtotal_amount.toFixed(2) : '0.00'}
                </span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Total Line Discounts:</span>
                <span className="font-mono font-medium text-amber-400">
                  - ₹{pricingPreview ? pricingPreview.discount_amount.toFixed(2) : '0.00'}
                </span>
              </div>

              <div className="flex justify-between font-bold text-white pt-2 border-t border-slate-700">
                <span>Taxable Amount:</span>
                <span className="font-mono">
                  ₹{pricingPreview ? pricingPreview.taxable_amount.toFixed(2) : '0.00'}
                </span>
              </div>

              {/* Tax Splits */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1.5 text-[11px]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  GST Breakdown ({isIntrastate ? 'Tamil Nadu Intrastate' : 'Interstate Sales'})
                </div>
                {isIntrastate ? (
                  <>
                    <div className="flex justify-between text-slate-300">
                      <span>CGST (Central Tax 50%):</span>
                      <span className="font-mono">₹{pricingPreview ? pricingPreview.cgst_amount.toFixed(2) : '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>SGST (State Tax 50%):</span>
                      <span className="font-mono">₹{pricingPreview ? pricingPreview.sgst_amount.toFixed(2) : '0.00'}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-300">
                    <span>IGST (Integrated Tax 100%):</span>
                    <span className="font-mono">₹{pricingPreview ? pricingPreview.igst_amount.toFixed(2) : '0.00'}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-slate-200 pt-1 border-t border-slate-700/60">
                  <span>Total Tax:</span>
                  <span className="font-mono">₹{pricingPreview ? pricingPreview.total_tax_amount.toFixed(2) : '0.00'}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-slate-700 flex justify-between items-baseline">
                <div>
                  <div className="text-[10px] uppercase font-black text-amber-400">Total Payable Amount</div>
                  <div className="text-[10px] text-slate-400">Inclusive of all taxes</div>
                </div>
                <div className="text-2xl font-black text-white font-mono tracking-tight text-right">
                  ₹{pricingPreview ? pricingPreview.grand_total.toFixed(2) : '0.00'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-700/80 space-y-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmitOrder('SUBMITTED')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-extrabold shadow-lg shadow-orange-900/30 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit for Manager Approval
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmitOrder('DRAFT')}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-600 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save as Draft
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
