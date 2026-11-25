import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Navigation, Search, RefreshCw, CheckCircle2, Clock,
  AlertTriangle, Truck, MapPin, PlusCircle, X
} from 'lucide-react';

const API = '/api/dispatch';

export default function ShipmentTrackingPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [formData, setFormData] = useState({
    status: 'IN_TRANSIT',
    location: 'Madurai Outer Ring Road Toll Plaza',
    remarks: 'Cold chain verified at 4.0°C; moving smoothly'
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setOrders(json.data);
      else setError(json.message || 'Failed to load shipment data');
    } catch (e) {
      setError('Network error fetching shipment tracking');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openStatusModal = (orderId, currentStatus) => {
    setSelectedOrderId(orderId);
    setFormData({
      status: currentStatus === 'DISPATCHED' ? 'IN_TRANSIT' :
              currentStatus === 'IN_TRANSIT' ? 'OUT_FOR_DELIVERY' :
              currentStatus === 'OUT_FOR_DELIVERY' ? 'DELIVERED' : 'IN_TRANSIT',
      location: 'Madurai Transit Hub Gate',
      remarks: 'Cold chain verified intact'
    });
    setModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/orders/${selectedOrderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Shipment status updated to ${formData.status}!`);
        setModalOpen(false);
        fetchOrders();
      } else {
        setError(json.message || 'Failed to update tracking milestone');
      }
    } catch (e) {
      setError('Network error updating status');
    }
  };

  const STATUS_STEPS = ['PENDING', 'PACKED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shipment &amp; Milestone Tracking</h1>
          <p className="text-sm text-slate-500">
            Module 6: Live Transit Status, Cold Chain Integrity &amp; GPS Waypoint Milestone Tracking
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
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

      {/* Active Shipments Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center text-slate-500 rounded-xl border border-slate-200">
            Loading shipments...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
            No active shipments found.
          </div>
        ) : (
          orders.map((o) => {
            const currentIdx = STATUS_STEPS.indexOf(o.status);

            return (
              <div key={o.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{o.dispatch_order_number}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600 font-mono">SO: {o.sales_order_number}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-800">{o.customer_name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Carrier: <b>{o.transporter_name || 'In-House'}</b> | Vehicle: <b>{o.vehicle_number || 'TN-59-AB-1234'}</b> | Expected: <b>{o.expected_delivery_date || '—'}</b>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      {o.status.replace(/_/g, ' ')}
                    </span>
                    {o.status !== 'DELIVERED' && (
                      <button
                        onClick={() => openStatusModal(o.id, o.status)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition"
                      >
                        Update Milestone
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="grid grid-cols-7 gap-2 pt-2 text-center">
                  {STATUS_STEPS.map((step, idx) => {
                    const isDone = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;

                    return (
                      <div key={step} className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition ${
                          isCurrent ? 'bg-purple-600 text-white ring-4 ring-purple-100' :
                          isDone ? 'bg-emerald-500 text-white' :
                          'bg-slate-100 text-slate-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className={`text-[10px] leading-tight font-medium ${isCurrent ? 'text-purple-700 font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                          {step.replace(/_/g, ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Update Milestone Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Navigation className="h-5 w-5 text-purple-600" />
                Update Shipment Milestone
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Milestone Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-sm"
                  required
                >
                  <option value="PACKED">PACKED (Secondary Packaging Done)</option>
                  <option value="READY_FOR_DISPATCH">READY FOR DISPATCH (Challan Issued)</option>
                  <option value="DISPATCHED">DISPATCHED (Left Factory Gate - Deducts Stock)</option>
                  <option value="IN_TRANSIT">IN TRANSIT (On Highway)</option>
                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY (Local Customer Hub)</option>
                  <option value="DELIVERED">DELIVERED (Completed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Current Waypoint / Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  placeholder="e.g. NH-44 Toll Plaza / Customer Gate"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Carrier Remarks &amp; Temperature Log</label>
                <textarea
                  rows="2"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
