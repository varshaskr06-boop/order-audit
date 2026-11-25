import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  PlusCircle,
  X
} from 'lucide-react';

export default function MaterialIssuePage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [requirements, setRequirements] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [batches, setBatches] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form for Issue Slip
  const [issueItems, setIssueItems] = useState([]);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedBy, setReceivedBy] = useState('Floor Lead');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/production/orders', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) {
        // Only APPROVED or IN_PROGRESS orders can receive material issues
        setOrders(json.data.filter(o => ['APPROVED', 'IN_PROGRESS'].includes(o.status)));
      }
    } catch (_) {}
  };

  const fetchOrderDetails = async (orderId) => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const [reqRes, avRes, issRes, bRes] = await Promise.all([
        fetch(`/api/production/orders/${orderId}/requirements`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/production/orders/${orderId}/availability`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/production/orders/${orderId}/issues`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/inventory/batches', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [reqJson, avJson, issJson, bJson] = await Promise.all([
        reqRes.json(), avRes.json(), issRes.json(), bRes.json()
      ]);

      if (reqJson.success) {
        setRequirements(reqJson.data || []);
        // Pre-fill form items based on pending requirements
        setIssueItems(
          (reqJson.data || []).map(r => ({
            requirement_id: r.id,
            material_type: r.material_type,
            material_id: r.material_id,
            material_name: r.material_name,
            inventory_item_id: r.material_type === 'RAW_MATERIAL' ? r.material_id : r.material_id + 5,
            inventory_batch_id: null,
            batch_number: '',
            issued_quantity: Math.max(0, r.required_quantity - (r.issued_quantity || 0)),
            unit: r.unit,
            unit_rate: 0
          }))
        );
      }
      if (avJson.success) setAvailability(avJson.data);
      if (issJson.success) setIssues(issJson.data || []);
      if (bJson.success) setBatches(bJson.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load order requirements');
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

  const handlePostIssue = async (e) => {
    e.preventDefault();
    const validItems = issueItems.filter(i => Number(i.issued_quantity) > 0);
    if (validItems.length === 0) {
      alert('Enter issued quantities for at least one material');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/production/orders/${selectedOrderId}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          issue_date: issueDate,
          received_by: receivedBy,
          notes,
          items: validItems
        })
      });
      const json = await res.json();
      if (json.success) {
        alert('Material issue slip posted and Phase 6 stock ledger debited!');
        fetchOrderDetails(selectedOrderId);
      } else {
        alert(json.error?.message || 'Failed to post material issue');
      }
    } catch (err) {
      alert(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
              📤
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Material Issue to Production
              </h1>
              <p className="text-xs text-slate-500">
                Module 5 — Allocate inventory batches and record outward movement in Phase 6 stock ledger
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
          className="w-full sm:w-96 text-xs p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">-- Choose Approved / In Progress Order --</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.order_number} — {o.product_name} ({o.planned_quantity} units) [{o.status}]
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

      {selectedOrderId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issue Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Prepare Material Issue Slip</h2>

            <form onSubmit={handlePostIssue} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Received By (Floor Lead)</label>
                  <input
                    type="text"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    required
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                      <th className="py-2.5 px-3">Material</th>
                      <th className="py-2.5 px-3">Req Qty</th>
                      <th className="py-2.5 px-3">Batch #</th>
                      <th className="py-2.5 px-3">Issue Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {issueItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{item.material_name}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{item.material_type}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-600">
                          {requirements.find(r => r.id === item.requirement_id)?.required_quantity || '—'} {item.unit}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            placeholder="e.g. RM-RICE-2026-B01"
                            value={item.batch_number}
                            onChange={(e) => {
                              const updated = [...issueItems];
                              updated[idx].batch_number = e.target.value;
                              setIssueItems(updated);
                            }}
                            className="w-36 p-1.5 border rounded text-xs font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={item.issued_quantity}
                            onChange={(e) => {
                              const updated = [...issueItems];
                              updated[idx].issued_quantity = parseFloat(e.target.value) || 0;
                              setIssueItems(updated);
                            }}
                            className="w-24 p-1.5 border rounded text-xs font-mono font-bold text-amber-700"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Remarks</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes about weight check, moisture content, etc."
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm transition-all"
              >
                {submitting ? 'Posting Issue...' : 'Post Material Issue & Deduct Stock'}
              </button>
            </form>
          </div>

          {/* Issue History for this Order */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Issue History (Posted Slips)</h2>
            {issues.length > 0 ? (
              <div className="space-y-3">
                {issues.map((iss) => (
                  <div key={iss.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-amber-700 font-mono">{iss.issue_number}</span>
                      <span className="text-[10px] text-slate-400">{iss.issue_date}</span>
                    </div>
                    <div className="text-slate-600">
                      Received by: <span className="font-semibold text-slate-800">{iss.received_by || 'Staff'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Line items: {iss.items?.length || 0} materials
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No previous issue slips posted for this order.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
