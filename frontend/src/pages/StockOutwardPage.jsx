import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowUpRight,
  PlusCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Clock,
  Layers,
  History,
  Trash2,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export default function StockOutwardPage() {
  const { token, user, setActivePage } = useAuth();
  const [issues, setIssues] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [packagingMaterials, setPackagingMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Issue Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    department: 'PRODUCTION',
    issued_to: '',
    bom_id: '1',
    production_batch_ref: '',
    notes: '',
    items: [
      {
        item_id: '1',
        batch_id: '1',
        location_id: '1',
        quantity: '',
        purpose: 'Daily batter grinding'
      }
    ]
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [issuesRes, rmRes, pkgRes] = await Promise.all([
        fetch('/api/inventory/outward/issues', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/inventory/raw-materials', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/inventory/packaging', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const issuesData = await issuesRes.json();
      const rmData = await rmRes.json();
      const pkgData = await pkgRes.json();

      if (issuesData.success) setIssues(issuesData.data || []);
      if (rmData.success) setRawMaterials(rmData.data || []);
      if (pkgData.success) setPackagingMaterials(pkgData.data || []);
    } catch (err) {
      setError(err.message || 'Error loading stock issue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          item_id: rawMaterials[0]?.id || '1',
          batch_id: '',
          location_id: '1',
          quantity: '',
          purpose: 'Production floor issue'
        }
      ]
    });
  };

  const handleRemoveItem = (index) => {
    const updated = [...formData.items];
    updated.splice(index, 1);
    setFormData({ ...formData, items: updated });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData({ ...formData, items: updated });
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/inventory/outward/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setShowModal(false);
        setFormData({
          department: 'PRODUCTION',
          issued_to: '',
          bom_id: '1',
          production_batch_ref: '',
          notes: '',
          items: [
            {
              item_id: '1',
              batch_id: '1',
              location_id: '1',
              quantity: '',
              purpose: 'Daily batter grinding'
            }
          ]
        });
        fetchData();
      } else {
        setError(json.message || 'Failed to issue material');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setSubmitting(false);
    }
  };

  const allAvailableItems = [...rawMaterials, ...packagingMaterials];

  const role = (user?.role || '').toUpperCase();
  const canIssue = ['PRODUCTION', 'ADMIN', 'OWNER'].includes(role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase">
              Module 5 • Stock Outward
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Material Issue to Production Floor</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Production Material Issues
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict over-issue prevention • Automated batch deductions & ledger debit entries
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canIssue && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
            >
              <PlusCircle className="h-4 w-4" /> Issue Materials to Floor
            </button>
          )}
          <button
            onClick={() => setActivePage('raw-materials-inventory')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <Layers className="h-4 w-4" /> Check RM Stock
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

      {/* Issues History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
            <History className="h-4 w-4 text-blue-600" />
            <span>Material Issue Slips & Floor Requisitions History</span>
          </div>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Issue Slip #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Issued To Employee</th>
                <th className="py-3.5 px-4">Production Ref</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mx-auto mb-2" />
                    Loading issue history...
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">
                    No material issues recorded yet.
                  </td>
                </tr>
              ) : (
                issues.map((iss) => (
                  <tr key={iss.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {iss.issue_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{iss.issue_date}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">{iss.department}</td>
                    <td className="py-3.5 px-4 text-slate-800">{iss.issued_to}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {iss.production_batch_ref || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {(iss.items || []).map((it, idx) => (
                          <div key={idx} className="text-[11px] text-slate-700 flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{it.item_name}</span>
                            <span className="text-blue-700 font-bold">({it.quantity} {it.uom})</span>
                            {it.batch_number && (
                              <span className="text-[10px] text-slate-400 font-mono">[{it.batch_number}]</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        POSTED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Issue Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                  Material Requisition Slip
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">Issue Material to Production Floor</h2>
                <p className="text-xs text-slate-500">Deduct raw materials from inventory and assign to batch</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIssue} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issued To Employee *</label>
                  <input
                    type="text"
                    value={formData.issued_to}
                    onChange={(e) => setFormData({ ...formData, issued_to: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                    placeholder="e.g. M. Arumugam (Grinder Lead)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="PRODUCTION">Batter Production Floor</option>
                    <option value="SNACK_PROCESSING">Murukku & Snack Unit</option>
                    <option value="PACKAGING_LINE">Automated Pouch Packing</option>
                    <option value="QC_LAB">Quality Control Sample</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Production Batch Ref</label>
                  <input
                    type="text"
                    value={formData.production_batch_ref}
                    onChange={(e) => setFormData({ ...formData, production_batch_ref: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none"
                    placeholder="e.g. PROD-BAT-2026-03-21"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issue Purpose</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
                    placeholder="Daily shift grinding"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Materials & Quantities to Issue
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Add Material
                  </button>
                </div>

                {formData.items.map((item, index) => {
                  const selectedMat = allAvailableItems.find((m) => m.id === Number(item.item_id));

                  return (
                    <div
                      key={index}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Material</label>
                        <select
                          value={item.item_id}
                          onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none"
                          required
                        >
                          {allAvailableItems.map((mat) => (
                            <option key={mat.id} value={mat.id}>
                              {mat.item_name} (Avail: {mat.current_stock} {mat.uom})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Batch (Optional)
                        </label>
                        <select
                          value={item.batch_id}
                          onChange={(e) => handleItemChange(index, 'batch_id', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none"
                        >
                          <option value="">Auto / Any</option>
                          {(selectedMat?.batches || []).map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.batch_number} ({b.current_quantity} {selectedMat.uom})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Quantity ({selectedMat?.uom || 'Unit'}) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          max={selectedMat?.current_stock}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                          placeholder="e.g. 50"
                          required
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-center pt-3 sm:pt-0">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0" />
                <span>
                  <strong>Strict Non-Negative Balance Guard:</strong> The server blocks any transaction attempting to issue more stock than currently available. Expired lots are automatically rejected.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Verifying & Posting...' : 'Approve & Issue to Floor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
