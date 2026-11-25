import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Truck, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck,
  Package, PlusCircle, RefreshCw, Box
} from 'lucide-react';

const API = '/api/dispatch';

export default function CreateDispatchPage() {
  const { token, setActivePage } = useAuth();
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qcStatus, setQcStatus] = useState({});

  // Mock approved sales orders available for dispatch
  const availableSalesOrders = [
    {
      id: 1,
      sales_order_number: 'SO-2026-0001',
      customer_id: 1,
      customer_name: 'Hotel Meenakshi Bhavan (T.Nagar)',
      delivery_address: 'No 45, Usman Road, T.Nagar, Chennai, Tamil Nadu - 600017',
      items: [
        { product_id: 1, product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)', product_sku: 'FG-BAT-1KG', ordered_quantity: 100, previously_dispatched_quantity: 40, uom: 'PKT' }
      ]
    },
    {
      id: 2,
      sales_order_number: 'SO-2026-0002',
      customer_id: 2,
      customer_name: 'Ananda Traditional Supermarket (Madurai)',
      delivery_address: '12 West Masi Street, Madurai, Tamil Nadu - 625001',
      items: [
        { product_id: 1, product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)', product_sku: 'FG-BAT-1KG', ordered_quantity: 100, previously_dispatched_quantity: 0, uom: 'PKT' }
      ]
    },
    {
      id: 3,
      sales_order_number: 'SO-2026-0003',
      customer_id: 3,
      customer_name: 'Karpagam Chettinad Mess (Madurai Bypass)',
      delivery_address: 'Plot 88, Madurai Ring Road, Madurai - 625016',
      items: [
        { product_id: 2, product_name: 'Traditional Murukku (200g)', product_sku: 'FG-MUR-200G', ordered_quantity: 150, previously_dispatched_quantity: 50, uom: 'PKT' }
      ]
    }
  ];

  const [selectedSoId, setSelectedSoId] = useState(2);
  const [formData, setFormData] = useState({
    dispatch_priority: 'HIGH',
    expected_delivery_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    transporter_id: '1',
    special_instructions: 'Keep chilled in insulated thermal cartons at 4°C'
  });

  const [items, setItems] = useState([
    {
      product_id: 1,
      product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)',
      product_sku: 'FG-BAT-1KG',
      ordered_quantity: 100,
      previously_dispatched_quantity: 0,
      dispatch_quantity: 50,
      batch_number: 'FG-BAT-260320-A',
      expiry_date: '2026-12-30',
      uom: 'PKT'
    }
  ]);

  useEffect(() => {
    fetchTransporters();
  }, []);

  const fetchTransporters = async () => {
    try {
      const res = await fetch(`${API}/transporters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setTransporters(json.data);
    } catch (e) {
      console.error('Failed to load transporters');
    }
  };

  const handleSoChange = (soId) => {
    const so = availableSalesOrders.find(s => s.id === parseInt(soId));
    if (!so) return;
    setSelectedSoId(so.id);
    const newItems = so.items.map(it => {
      const remaining = it.ordered_quantity - it.previously_dispatched_quantity;
      return {
        product_id: it.product_id,
        product_name: it.product_name,
        product_sku: it.product_sku,
        ordered_quantity: it.ordered_quantity,
        previously_dispatched_quantity: it.previously_dispatched_quantity,
        dispatch_quantity: remaining,
        batch_number: 'FG-BAT-260320-A',
        expiry_date: '2026-12-30',
        uom: it.uom
      };
    });
    setItems(newItems);
    setQcStatus({});
  };

  const verifyBatch = async (index, batchNum, productId, qty) => {
    try {
      const res = await fetch(`${API}/verify-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId, batch_number: batchNum, quantity: qty })
      });
      const json = await res.json();
      if (json.success) {
        setQcStatus(prev => ({ ...prev, [index]: { verified: true, message: 'QC PASSED & Released' } }));
      } else {
        setQcStatus(prev => ({ ...prev, [index]: { verified: false, message: json.message } }));
      }
    } catch (e) {
      setQcStatus(prev => ({ ...prev, [index]: { verified: false, message: 'Network check failed' } }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const currentSo = availableSalesOrders.find(s => s.id === parseInt(selectedSoId));

    try {
      const payload = {
        sales_order_id: currentSo.id,
        sales_order_number: currentSo.sales_order_number,
        customer_id: currentSo.customer_id,
        customer_name: currentSo.customer_name,
        delivery_address: currentSo.delivery_address,
        expected_delivery_date: formData.expected_delivery_date,
        dispatch_priority: formData.dispatch_priority,
        transporter_id: formData.transporter_id,
        special_instructions: formData.special_instructions,
        items
      };

      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        setSuccess(`Dispatch Order ${json.data?.dispatch_order_number} created successfully!`);
        setTimeout(() => setActivePage('dispatch-orders'), 1500);
      } else {
        setError(json.message || 'Failed to create dispatch order');
      }
    } catch (e) {
      setError('Network error connecting to backend API');
    } finally {
      setLoading(false);
    }
  };

  const currentSo = availableSalesOrders.find(s => s.id === parseInt(selectedSoId));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('dispatch-orders')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create Outward Dispatch Order</h1>
            <p className="text-xs text-slate-500">
              Module 1 &amp; 2: Sales Order Verification, QC Release Check &amp; Partial Dispatch Support
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Sales Order Selection */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Box className="h-5 w-5 text-emerald-600" />
            1. Select Approved Sales Order
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Sales Order Reference *</label>
              <select
                value={selectedSoId}
                onChange={(e) => handleSoChange(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {availableSalesOrders.map(so => (
                  <option key={so.id} value={so.id}>
                    {so.sales_order_number} — {so.customer_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Dispatch Priority</label>
              <select
                value={formData.dispatch_priority}
                onChange={(e) => setFormData({ ...formData, dispatch_priority: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="STANDARD">Standard</option>
                <option value="HIGH">High Priority</option>
                <option value="EXPRESS">Express Cold Chain (Same Day)</option>
              </select>
            </div>
          </div>

          {currentSo && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <p><span className="font-semibold text-slate-700">Customer:</span> {currentSo.customer_name}</p>
              <p><span className="font-semibold text-slate-700">Delivery Address:</span> {currentSo.delivery_address}</p>
            </div>
          )}
        </div>

        {/* Step 2: Finished Goods Items & QC Release Gate */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            2. Finished Goods Verification &amp; QC Gate (Module 2)
          </h2>
          <p className="text-xs text-slate-500">
            Finished Goods batches are gated by Phase 8 Quality Release. Expired or unreleased batches cannot be dispatched.
          </p>

          <div className="space-y-4">
            {items.map((it, idx) => {
              const remaining = it.ordered_quantity - it.previously_dispatched_quantity;
              const isOver = Number(it.dispatch_quantity) > remaining;
              const qc = qcStatus[idx];

              return (
                <div key={idx} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{it.product_name}</p>
                      <p className="text-xs text-slate-500">SKU: {it.product_sku}</p>
                    </div>
                    <div className="text-xs text-right">
                      <span className="text-slate-500">Ordered: <b>{it.ordered_quantity}</b> | Dispatched: <b>{it.previously_dispatched_quantity}</b> | Remaining: </span>
                      <span className="font-bold text-emerald-700">{remaining} {it.uom}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Batch Number *</label>
                      <select
                        value={it.batch_number}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItems(items.map((x, i) => i === idx ? { ...x, batch_number: val } : x));
                        }}
                        className="w-full border border-slate-300 rounded p-2 bg-white"
                      >
                        <option value="FG-BAT-260320-A">FG-BAT-260320-A (QC PASSED - Fresh Batter)</option>
                        <option value="FG-MUR-260321-B">FG-MUR-260321-B (QC PASSED - Murukku)</option>
                        <option value="FG-BAT-FAILED-01">FG-BAT-FAILED-01 (QC REJECTED - Leakage)</option>
                        <option value="FG-BAT-EXPIRED-01">FG-BAT-EXPIRED-01 (EXPIRED Batch)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Dispatch Quantity ({it.uom}) *</label>
                      <input
                        type="number"
                        min="1"
                        max={remaining}
                        value={it.dispatch_quantity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setItems(items.map((x, i) => i === idx ? { ...x, dispatch_quantity: val } : x));
                        }}
                        className={`w-full border rounded p-2 bg-white ${isOver ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'}`}
                      />
                      {isOver && (
                        <p className="text-[11px] text-rose-600 mt-0.5">Cannot exceed remaining {remaining} {it.uom}</p>
                      )}
                    </div>

                    <div className="flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={() => verifyBatch(idx, it.batch_number, it.product_id, it.dispatch_quantity)}
                        className="px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded border border-emerald-300 transition flex items-center justify-center gap-1"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Verify QC Release Gate
                      </button>
                    </div>
                  </div>

                  {qc && (
                    <div className={`p-2 rounded text-xs flex items-center gap-1.5 ${qc.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {qc.verified ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      <span>{qc.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Transporter & Delivery Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-600" />
            3. Logistics &amp; Transport Selection (Module 5)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Approved Transporter *</label>
              <select
                value={formData.transporter_id}
                onChange={(e) => setFormData({ ...formData, transporter_id: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {transporters.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.vehicle_number || 'Road Freight'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Expected Delivery Date *</label>
              <input
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Special Cold Chain &amp; Handling Instructions</label>
              <input
                type="text"
                value={formData.special_instructions}
                onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Maintain cold chain at 4°C, handle with care"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setActivePage('dispatch-orders')}
            className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Creating Order...' : 'Confirm & Create Dispatch Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
