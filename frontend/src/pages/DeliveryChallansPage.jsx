import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileCheck2, Search, PlusCircle, RefreshCw, Printer,
  Eye, Truck, CheckCircle2, AlertTriangle, X
} from 'lucide-react';

const API = '/api/dispatch';

export default function DeliveryChallansPage() {
  const { token } = useAuth();
  const [challans, setChallans] = useState([]);
  const [packedOrders, setPackedOrders] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    dispatch_order_id: '',
    transporter_name: 'Kaveri Cold Logistics Private Limited',
    vehicle_number: 'TN-59-AB-1234',
    driver_name: 'M. Murugan',
    driver_phone: '+91 98421 12345',
    lr_number: 'LR-2026-8801',
    authorized_signatory: 'Warehouse & Dispatch Lead'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cRes, oRes, tRes] = await Promise.all([
        fetch(`${API}/challans`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/orders?status=PACKED`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/transporters`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const cJson = await cRes.json();
      const oJson = await oRes.json();
      const tJson = await tRes.json();
      if (cJson.success) setChallans(cJson.data);
      if (oJson.success) {
        setPackedOrders(oJson.data);
        if (oJson.data.length > 0) {
          setFormData(prev => ({ ...prev, dispatch_order_id: oJson.data[0].id }));
        }
      }
      if (tJson.success) setTransporters(tJson.data);
    } catch (e) {
      setError('Network error loading delivery challans');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const viewChallan = async (id) => {
    try {
      const res = await fetch(`${API}/challans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setSelectedChallan(json.data);
        setPrintModalOpen(true);
      }
    } catch (e) {
      alert('Failed to retrieve delivery challan details');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.dispatch_order_id) {
      setError('Please select a packed dispatch order.');
      return;
    }

    try {
      const res = await fetch(`${API}/challans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Delivery Challan ${json.data?.challan_number} generated!`);
        setCreateModalOpen(false);
        fetchData();
      } else {
        setError(json.message || 'Failed to generate Delivery Challan');
      }
    } catch (e) {
      setError('Network error generating delivery challan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Delivery Challans (DC)</h1>
          <p className="text-sm text-slate-500">
            Module 4: Statutory Transit Documents (DC/YYYY-YY/XXXX), Transporter Lorry Receipts &amp; Gate Passes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={() => { setCreateModalOpen(true); setError(''); setSuccess(''); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" /> Generate Delivery Challan
          </button>
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

      {/* Challans Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3">Challan Number</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Dispatch Order</th>
                <th className="px-6 py-3">Customer Details</th>
                <th className="px-6 py-3">Transporter</th>
                <th className="px-6 py-3">Vehicle #</th>
                <th className="px-6 py-3">LR Number</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    Loading delivery challans...
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    No delivery challans issued yet.
                  </td>
                </tr>
              ) : (
                challans.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-semibold text-cyan-700 font-mono text-xs">
                      {c.challan_number}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {c.challan_date}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-700">
                      {c.dispatch_order_number}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {c.customer_name}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-800">
                      {c.transporter_name}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-700">
                      {c.vehicle_number}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-600">
                      {c.lr_number || '—'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => viewChallan(c.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded border border-cyan-200 transition"
                      >
                        <Printer className="h-3.5 w-3.5" /> View / Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Delivery Challan Modal */}
      {printModalOpen && selectedChallan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Action Bar */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-cyan-600" />
                <span className="font-bold text-slate-800 text-sm">Delivery Challan Transit Document</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs font-medium flex items-center gap-1"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Challan
                </button>
                <button
                  onClick={() => setPrintModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Formatted Layout */}
            <div className="p-8 space-y-6 text-slate-900 text-sm bg-white print:p-0">
              {/* Company Header */}
              <div className="text-center border-b border-slate-300 pb-4">
                <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900">
                  Sri Meenakshi Agro &amp; Traditional Foods Pvt Ltd
                </h2>
                <p className="text-xs text-slate-500">
                  Plot 45, SIPCOT Industrial Park, Kappalur, Madurai, Tamil Nadu - 625008
                </p>
                <p className="text-xs font-mono font-semibold text-slate-700 mt-1">
                  GSTIN: 33AAAAA0000A1Z5 • FSSAI Lic No: 12423008000451
                </p>
                <div className="inline-block mt-2 px-3 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-bold text-slate-800">
                  DELIVERY CHALLAN (RULE 55 - TRANSIT GOODS)
                </div>
              </div>

              {/* Document Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 p-4 rounded bg-slate-50/50">
                <div>
                  <p><span className="font-bold">Challan Number:</span> {selectedChallan.challan_number}</p>
                  <p><span className="font-bold">Challan Date:</span> {selectedChallan.challan_date}</p>
                  <p><span className="font-bold">Dispatch Order #:</span> {selectedChallan.dispatch_order_number}</p>
                  <p><span className="font-bold">Sales Order #:</span> {selectedChallan.sales_order_number}</p>
                </div>
                <div>
                  <p><span className="font-bold">Transporter:</span> {selectedChallan.transporter_name}</p>
                  <p><span className="font-bold">Vehicle Number:</span> {selectedChallan.vehicle_number}</p>
                  <p><span className="font-bold">Driver:</span> {selectedChallan.driver_name} ({selectedChallan.driver_phone})</p>
                  <p><span className="font-bold">LR / GR Number:</span> {selectedChallan.lr_number || '—'}</p>
                </div>
              </div>

              {/* Consignee */}
              <div className="border border-slate-200 p-4 rounded text-xs">
                <p className="font-bold uppercase text-slate-700">Consignee (Deliver To):</p>
                <p className="font-semibold text-slate-900 text-sm mt-1">{selectedChallan.customer_name}</p>
                <p className="text-slate-600">{selectedChallan.delivery_address}</p>
                <p className="text-slate-600 mt-1"><span className="font-semibold">Customer GSTIN:</span> {selectedChallan.customer_gstin || '33AABCM1111A1Z1'}</p>
              </div>

              {/* Items Table */}
              <table className="min-w-full divide-y divide-slate-300 text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="px-3 py-2 text-left">Sl</th>
                    <th className="px-3 py-2 text-left">Item Description</th>
                    <th className="px-3 py-2 text-left">Batch Number</th>
                    <th className="px-3 py-2 text-right">Packages</th>
                    <th className="px-3 py-2 text-right">UOM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(selectedChallan.items || [
                    { product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)', batch_number: 'FG-BAT-260320-A', dispatch_quantity: selectedChallan.total_packages || 50, uom: 'PKT' }
                  ]).map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium">{it.product_name}</td>
                      <td className="px-3 py-2 font-mono text-emerald-800">{it.batch_number}</td>
                      <td className="px-3 py-2 text-right font-bold">{it.dispatch_quantity}</td>
                      <td className="px-3 py-2 text-right">{it.uom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Terms & Signatures */}
              <div className="pt-4 border-t border-slate-200 text-xs space-y-4">
                <p className="italic text-slate-500">
                  Note: This delivery challan is issued for transportation of goods only. Not a tax invoice. Cold chain temperature must be maintained during transit.
                </p>

                <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs">
                  <div className="border-t border-slate-300 pt-2">
                    <p className="font-semibold">Driver's Signature</p>
                    <p className="text-slate-400 text-[10px]">Goods Received in Good Order</p>
                  </div>
                  <div className="border-t border-slate-300 pt-2">
                    <p className="font-semibold">Authorized Signatory</p>
                    <p className="text-slate-400 text-[10px]">Sri Meenakshi Agro &amp; Traditional Foods</p>
                  </div>
                  <div className="border-t border-slate-300 pt-2">
                    <p className="font-semibold">Customer Receiver's Stamp</p>
                    <p className="text-slate-400 text-[10px]">Subject to Physical Count Verification</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Challan Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-cyan-600" />
                Issue Delivery Challan
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Packed Dispatch Order *</label>
                <select
                  value={formData.dispatch_order_id}
                  onChange={(e) => setFormData({ ...formData, dispatch_order_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-sm"
                  required
                >
                  <option value="">-- Choose Packed Order --</option>
                  {packedOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.dispatch_order_number} — {o.customer_name} ({o.total_dispatched_quantity} PKT)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Transporter Name *</label>
                <select
                  value={formData.transporter_name}
                  onChange={(e) => {
                    const t = transporters.find(x => x.name === e.target.value);
                    setFormData({
                      ...formData,
                      transporter_name: e.target.value,
                      vehicle_number: t?.vehicle_number || formData.vehicle_number,
                      driver_name: t?.driver_name || formData.driver_name,
                      driver_phone: t?.driver_phone || formData.driver_phone
                    });
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-sm"
                >
                  {transporters.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle Number *</label>
                  <input
                    type="text"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">LR / GR Number</label>
                  <input
                    type="text"
                    value={formData.lr_number}
                    onChange={(e) => setFormData({ ...formData, lr_number: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Driver Name *</label>
                  <input
                    type="text"
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Driver Phone *</label>
                  <input
                    type="text"
                    value={formData.driver_phone}
                    onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Issue Challan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
