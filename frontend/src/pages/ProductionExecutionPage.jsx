import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  Activity,
  PlusCircle,
  X
} from 'lucide-react';

export default function ProductionExecutionPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [downtimeList, setDowntimeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Execution Quantities Form
  const [execForm, setExecForm] = useState({
    actual_quantity: 0,
    accepted_quantity: 0,
    rejected_quantity: 0,
    wastage_quantity: 0,
    supervisor_name: user?.name || user?.username || 'Production Supervisor',
    notes: ''
  });
  const [updating, setUpdating] = useState(false);

  // Downtime Modal Form
  const [showDowntimeModal, setShowDowntimeModal] = useState(false);
  const [dtForm, setDtForm] = useState({
    downtime_start: new Date().toISOString().slice(0, 16),
    duration_minutes: 15,
    reason_category: 'MACHINE',
    reason_description: '',
    machine_or_line: 'Packaging Machine Line #1'
  });

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/production/orders', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setOrders(json.data || []);
    } catch (_) {}
  };

  const fetchOrderDetails = async (orderId) => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const [ordRes, dtRes] = await Promise.all([
        fetch(`/api/production/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/production/orders/${orderId}/downtime`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [ordJson, dtJson] = await Promise.all([ordRes.json(), dtRes.json()]);
      if (ordJson.success) {
        setSelectedOrder(ordJson.data);
        setExecForm({
          actual_quantity: ordJson.data.actual_quantity || 0,
          accepted_quantity: ordJson.data.accepted_quantity || 0,
          rejected_quantity: ordJson.data.rejected_quantity || 0,
          wastage_quantity: ordJson.data.wastage_quantity || 0,
          supervisor_name: ordJson.data.supervisor_name || user?.name || '',
          notes: ordJson.data.notes || ''
        });
      }
      if (dtJson.success) setDowntimeList(dtJson.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load order execution data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetails(selectedOrderId);
    }
  }, [selectedOrderId]);

  const handleUpdateStatus = async (newStatus) => {
    const reason = prompt(`Enter reason for updating status to ${newStatus}:`, `${newStatus} by shift lead`);
    if (reason === null) return;
    try {
      const res = await fetch(`/api/production/orders/${selectedOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, reason })
      });
      const json = await res.json();
      if (json.success) {
        fetchOrderDetails(selectedOrderId);
        fetchOrders();
      } else {
        alert(json.error?.message || 'Status transition failed');
      }
    } catch (err) {
      alert(err.message || 'Network error');
    }
  };

  const handleSaveExecution = async (e) => {
    e.preventDefault();
    if (Number(execForm.rejected_quantity) > Number(execForm.actual_quantity)) {
      alert('Rejected quantity cannot exceed actual produced quantity');
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/production/orders/${selectedOrderId}/execution`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(execForm)
      });
      const json = await res.json();
      if (json.success) {
        alert('Execution progress and quantities saved successfully!');
        fetchOrderDetails(selectedOrderId);
      } else {
        alert(json.error?.message || 'Failed to update execution');
      }
    } catch (err) {
      alert(err.message || 'Network error');
    } finally {
      setUpdating(false);
    }
  };

  const handleRecordDowntime = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/production/orders/${selectedOrderId}/downtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(dtForm)
      });
      const json = await res.json();
      if (json.success) {
        setShowDowntimeModal(false);
        fetchOrderDetails(selectedOrderId);
      } else {
        alert(json.error?.message || 'Failed to record downtime');
      }
    } catch (err) {
      alert(err.message || 'Network error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
              ⚙️
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Shop Floor Execution & Downtime
              </h1>
              <p className="text-xs text-slate-500">
                Module 7 — Live machine run monitoring, output logging, rejection recording & downtime tracking
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchOrderDetails(selectedOrderId)}
          disabled={!selectedOrderId || loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Select Order */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
        <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Select Production Order *</label>
        <select
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          className="w-full sm:w-96 text-xs p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">-- Choose Order to Run or Monitor --</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.order_number} — {o.product_name} [{o.status}]
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {selectedOrder && (
        <div className="space-y-6">
          {/* Order Lifecycle Control Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold text-indigo-700">{selectedOrder.order_number}</span>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-800">
                  {selectedOrder.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {selectedOrder.product_name} • Planned: <span className="font-bold">{selectedOrder.planned_quantity}</span> units
              </p>
            </div>

            {/* State Transition Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedOrder.status === 'APPROVED' && (
                <button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="h-3.5 w-3.5" /> Start Production
                </button>
              )}

              {selectedOrder.status === 'IN_PROGRESS' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus('ON_HOLD')}
                    className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Pause className="h-3.5 w-3.5" /> Pause Run
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Finalize & Complete
                  </button>
                </>
              )}

              {selectedOrder.status === 'ON_HOLD' && (
                <button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5" /> Resume Production
                </button>
              )}

              <button
                onClick={() => setShowDowntimeModal(true)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Activity className="h-3.5 w-3.5" /> Log Downtime
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Output Progress & Rejection Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Output Quantities & Quality Counts</h2>

              <form onSubmit={handleSaveExecution} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Actual Output Produced *</label>
                    <input
                      type="number"
                      step="0.001"
                      value={execForm.actual_quantity}
                      onChange={(e) => setExecForm({ ...execForm, actual_quantity: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold font-mono text-indigo-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Accepted Finished Goods *</label>
                    <input
                      type="number"
                      step="0.001"
                      value={execForm.accepted_quantity}
                      onChange={(e) => setExecForm({ ...execForm, accepted_quantity: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold font-mono text-emerald-600 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">QC Rejected Quantity</label>
                    <input
                      type="number"
                      step="0.001"
                      value={execForm.rejected_quantity}
                      onChange={(e) => setExecForm({ ...execForm, rejected_quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold font-mono text-rose-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Process Wastage (KG/Units)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={execForm.wastage_quantity}
                      onChange={(e) => setExecForm({ ...execForm, wastage_quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supervisor Remarks</label>
                  <textarea
                    rows="2"
                    value={execForm.notes}
                    onChange={(e) => setExecForm({ ...execForm, notes: e.target.value })}
                    placeholder="Batch viscosity, fermentation timing notes..."
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all"
                >
                  {updating ? 'Saving...' : 'Update Execution Progress'}
                </button>
              </form>
            </div>

            {/* Machine Downtime Records */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-slate-900">Machine Downtime Logs</h2>
                <button
                  onClick={() => setShowDowntimeModal(true)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Add Log
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                {downtimeList.length > 0 ? (
                  downtimeList.map((dt) => (
                    <div key={dt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800">
                            {dt.reason_category}
                          </span>
                          <span>{dt.machine_or_line || 'Machine Line'}</span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{dt.reason_description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-rose-600">{dt.duration_minutes || 0} mins</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {dt.downtime_start ? new Date(dt.downtime_start).toLocaleTimeString() : ''}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">Zero downtime recorded for this cycle.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Downtime Modal */}
      {showDowntimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Record Machine Downtime</h3>
              <button onClick={() => setShowDowntimeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordDowntime} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason Category *</label>
                <select
                  value={dtForm.reason_category}
                  onChange={(e) => setDtForm({ ...dtForm, reason_category: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="MACHINE">Machine Breakdown / Jam</option>
                  <option value="POWER">Power Outage / Generator Switch</option>
                  <option value="MATERIAL">Material Starvation</option>
                  <option value="MANPOWER">Operator Shift Change</option>
                  <option value="QUALITY">Quality Pause</option>
                  <option value="OTHER">Other Reason</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Machine / Equipment Line</label>
                <input
                  type="text"
                  value={dtForm.machine_or_line}
                  onChange={(e) => setDtForm({ ...dtForm, machine_or_line: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Downtime Timestamp</label>
                  <input
                    type="datetime-local"
                    value={dtForm.downtime_start}
                    onChange={(e) => setDtForm({ ...dtForm, downtime_start: e.target.value })}
                    required
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Minutes) *</label>
                  <input
                    type="number"
                    min="1"
                    value={dtForm.duration_minutes}
                    onChange={(e) => setDtForm({ ...dtForm, duration_minutes: parseInt(e.target.value) || 0 })}
                    required
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Reason Description</label>
                <textarea
                  rows="2"
                  value={dtForm.reason_description}
                  onChange={(e) => setDtForm({ ...dtForm, reason_description: e.target.value })}
                  placeholder="e.g. Belt slipped on packaging motor..."
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowDowntimeModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
                >
                  Save Downtime Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
