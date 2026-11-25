import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Scale,
  PlusCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function PhysicalStockVerificationPage() {
  const { token, user, setActivePage } = useAuth();
  const [counts, setCounts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New Count Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    location_id: '1',
    counted_by: user?.full_name || 'Inventory Auditor',
    notes: 'Quarterly physical stock audit'
  });
  const [creating, setCreating] = useState(false);

  // Count Sheet Entry / Review Modal
  const [activeCount, setActiveCount] = useState(null);
  const [editedItems, setEditedItems] = useState({});
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cntRes, locRes] = await Promise.all([
        fetch('/api/inventory/counts', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/inventory/locations', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const cntData = await cntRes.json();
      const locData = await locRes.json();

      if (cntData.success) setCounts(cntData.data || []);
      if (locData.success) setLocations(locData.data || []);
    } catch (err) {
      setError(err.message || 'Error loading stock count sheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreateCount = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/inventory/counts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(createForm)
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setShowCreateModal(false);
        fetchData();
      } else {
        setError(json.message || 'Failed to create count sheet');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenCountSheet = (count) => {
    setActiveCount(count);
    const initialMap = {};
    (count.items || []).forEach((item) => {
      initialMap[item.item_id] = {
        counted_quantity: item.counted_quantity,
        remarks: item.remarks || ''
      };
    });
    setEditedItems(initialMap);
  };

  const handleQuantityChange = (itemId, val) => {
    setEditedItems({
      ...editedItems,
      [itemId]: {
        ...editedItems[itemId],
        counted_quantity: val
      }
    });
  };

  const handleRemarksChange = (itemId, val) => {
    setEditedItems({
      ...editedItems,
      [itemId]: {
        ...editedItems[itemId],
        remarks: val
      }
    });
  };

  const handleSaveAndSubmitCount = async () => {
    setUpdating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const itemsPayload = Object.keys(editedItems).map((itemId) => ({
        item_id: Number(itemId),
        counted_quantity: Number(editedItems[itemId].counted_quantity),
        remarks: editedItems[itemId].remarks
      }));

      const res = await fetch(`/api/inventory/counts/${activeCount.id}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items: itemsPayload })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setActiveCount(null);
        fetchData();
      } else {
        setError(json.message || 'Failed to save count differences');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveCount = async (countId, decision) => {
    setUpdating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/inventory/counts/${countId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          decision,
          notes: 'Discrepancies reviewed and approved into stock ledger.'
        })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setActiveCount(null);
        fetchData();
      } else {
        setError(json.message || 'Failed to approve count');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setUpdating(false);
    }
  };

  const role = (user?.role || '').toUpperCase();
  const canApprove = ['ADMIN', 'OWNER'].includes(role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
              Module 9 • Physical Stock Verification
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Audits & Variance Reconciliations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Physical Stock Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare system ledger with physically counted stock • Post variance adjustments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" /> Start Physical Count
          </button>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Verification Sheets List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
            <Scale className="h-4 w-4 text-amber-600" />
            <span>Stock Count Sheets & Variance History</span>
          </div>
          <span className="text-xs text-slate-400">{counts.length} Audits</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Audit Count #</th>
                <th className="py-3.5 px-4">Audit Date</th>
                <th className="py-3.5 px-4">Warehouse Location</th>
                <th className="py-3.5 px-4">Audited / Counted By</th>
                <th className="py-3.5 px-4 text-center">Items Count</th>
                <th className="py-3.5 px-4 text-center">Variance Detected</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 text-amber-600 animate-spin mx-auto mb-2" />
                    Loading audit sheets...
                  </td>
                </tr>
              ) : counts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400">
                    No physical count audits generated yet. Click "Start Physical Count" above.
                  </td>
                </tr>
              ) : (
                counts.map((cnt) => (
                  <tr key={cnt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {cnt.count_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{cnt.count_date}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">{cnt.location_name}</td>
                    <td className="py-3.5 px-4 text-slate-800">{cnt.counted_by}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {cnt.items_count} SKUs
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {cnt.has_discrepancy ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          Discrepancies Found
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Matched 100%
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          cnt.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : cnt.status === 'SUBMITTED'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {cnt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenCountSheet(cnt)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition"
                      >
                        {cnt.status === 'DRAFT' ? 'Enter Physical Counts' : 'Review Count Sheet'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Count Sheet Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                  Audit Setup
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">Start Physical Stock Count</h2>
                <p className="text-xs text-slate-500">System baseline will be snapshotted automatically</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Storage Location *</label>
                <select
                  value={createForm.location_id}
                  onChange={(e) => setCreateForm({ ...createForm, location_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  required
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.location_name} ({loc.location_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Counted By (Auditor Name) *</label>
                <input
                  type="text"
                  value={createForm.counted_by}
                  onChange={(e) => setCreateForm({ ...createForm, counted_by: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Purpose / Notes</label>
                <textarea
                  rows="2"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  placeholder="e.g. End of month physical inventory reconciliation"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {creating ? 'Generating Sheet...' : 'Generate Count Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Count Sheet Entry & Review Modal */}
      {activeCount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                    Audit Count Sheet
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">#{activeCount.count_number}</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  Location: {activeCount.location_name}
                </h2>
                <p className="text-xs text-slate-500">
                  Auditor: {activeCount.counted_by} • Date: {activeCount.count_date}
                </p>
              </div>
              <button
                onClick={() => setActiveCount(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items Verification Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Item Name & Code</th>
                    <th className="py-2.5 px-3">UOM</th>
                    <th className="py-2.5 px-3 text-right">System Qty (Ledger)</th>
                    <th className="py-2.5 px-3 text-right">Counted Qty (Physical)</th>
                    <th className="py-2.5 px-3 text-right">Variance Difference</th>
                    <th className="py-2.5 px-3">Auditor Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(activeCount.items || []).map((item) => {
                    const currentVal =
                      editedItems[item.item_id]?.counted_quantity !== undefined
                        ? editedItems[item.item_id].counted_quantity
                        : item.counted_quantity;

                    const diff =
                      currentVal !== '' && !isNaN(Number(currentVal))
                        ? Math.round((Number(currentVal) - item.system_quantity) * 1000) / 1000
                        : item.difference_quantity;

                    const isEditable = activeCount.status === 'DRAFT';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{item.item_name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{item.item_code}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-600">{item.uom}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-600">
                          {item.system_quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isEditable ? (
                            <input
                              type="number"
                              step="0.01"
                              value={currentVal}
                              onChange={(e) => handleQuantityChange(item.item_id, e.target.value)}
                              className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-right font-black text-slate-900 focus:outline-none focus:border-amber-500"
                            />
                          ) : (
                            <span className="font-black text-slate-900">{item.counted_quantity}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {diff === 0 ? (
                            <span className="text-emerald-700">0.00 (Match)</span>
                          ) : diff > 0 ? (
                            <span className="text-emerald-800 font-mono">+{diff} (Excess)</span>
                          ) : (
                            <span className="text-rose-700 font-mono">{diff} (Shortage)</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isEditable ? (
                            <input
                              type="text"
                              value={editedItems[item.item_id]?.remarks || ''}
                              onChange={(e) => handleRemarksChange(item.item_id, e.target.value)}
                              placeholder="Reason for diff..."
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none"
                            />
                          ) : (
                            <span className="text-slate-500 text-[11px]">{item.remarks || '-'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveCount(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {activeCount.status === 'DRAFT' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={handleSaveAndSubmitCount}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Submit Physical Counts for Approval'}
                  </button>
                )}

                {activeCount.status === 'SUBMITTED' && canApprove && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleApproveCount(activeCount.id, 'REJECTED')}
                      className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold transition disabled:opacity-50"
                    >
                      Reject Audit
                    </button>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleApproveCount(activeCount.id, 'APPROVED')}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                    >
                      {updating ? 'Posting...' : 'Approve & Reconcile in Stock Ledger'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
