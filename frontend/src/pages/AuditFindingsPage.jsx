import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle, Search, PlusCircle, RefreshCw, Eye, Edit,
  CheckCircle2, Clock, RotateCcw, X, ShieldAlert, ArrowRight,
  UserCheck, Calendar, ShieldCheck
} from 'lucide-react';

const API = '/api/audit';

export default function AuditFindingsPage() {
  const { token, user, setActivePage } = useAuth();
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [reopenReason, setReopenReason] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    department: 'QUALITY',
    category: 'QUALITY_AUDIT',
    description: '',
    related_transaction_type: 'OTHER',
    related_transaction_reference: '',
    root_cause: '',
    risk_level: 'MEDIUM',
    assigned_to_name: 'Production Supervisor Kumar',
    target_completion_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  });

  const role = (user?.role || '').toUpperCase();
  const canManage = ['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role);

  const fetchFindings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/findings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setFindings(json.data || []);
      else setError(json.message || 'Failed to load audit findings');
    } catch (e) {
      setError('Network error fetching findings');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFindings();
  }, [fetchFindings]);

  const handleCreateFinding = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/findings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Audit finding ${json.data.finding_number} logged!`);
        setCreateModalOpen(false);
        fetchFindings();
      } else {
        setError(json.message || 'Failed to create finding');
      }
    } catch (e) {
      setError('Error creating finding');
    }
  };

  const handleReopen = async (e) => {
    e.preventDefault();
    if (!selectedFinding) return;
    try {
      const res = await fetch(`${API}/findings/${selectedFinding.id}/reopen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reopen_reason: reopenReason })
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Finding ${selectedFinding.finding_number} reopened successfully!`);
        setReopenModalOpen(false);
        setReopenReason('');
        fetchFindings();
      } else {
        setError(json.message || 'Failed to reopen finding');
      }
    } catch (e) {
      setError('Error reopening finding');
    }
  };

  const filtered = findings.filter((f) => {
    if (riskFilter !== 'ALL' && f.risk_level !== riskFilter) return false;
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (deptFilter !== 'ALL' && f.department !== deptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchesNum = f.finding_number?.toLowerCase().includes(q);
      const matchesTitle = f.title?.toLowerCase().includes(q);
      const matchesRef = f.related_transaction_reference?.toLowerCase().includes(q);
      if (!matchesNum && !matchesTitle && !matchesRef) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            Audit Findings &amp; Non-Conformance Register
          </h1>
          <p className="text-sm text-slate-500">
            Log deviations, track root cause investigations, assign responsibilities, and oversee corrective action
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFindings}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canManage && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl transition shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              + Log Finding
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
          {success}
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search finding #, title, ref..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Risk Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-500">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ACTION_ASSIGNED">Action Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
            </select>
          </div>

          {/* Dept Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-500">Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Departments</option>
              <option value="QUALITY">Quality</option>
              <option value="PURCHASE">Procurement</option>
              <option value="INVENTORY">Inventory</option>
              <option value="PRODUCTION">Production</option>
              <option value="GST_INVOICING">GST Invoicing</option>
              <option value="PAYMENTS">Finance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Finding #</th>
                <th className="py-3 px-4">Title &amp; Root Cause</th>
                <th className="py-3 px-4">Department &amp; Ref</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Target Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    Loading audit findings...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No audit findings match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-rose-700">
                      {f.finding_number}
                      {f.reopen_count > 0 && (
                        <span className="block text-[9px] text-amber-700 font-normal">
                          (Reopened x{f.reopen_count})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800 text-xs">{f.title}</div>
                      {f.root_cause && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          Root Cause: {f.root_cause}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-semibold text-slate-700">{f.department}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {f.related_transaction_type}: {f.related_transaction_reference}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          f.risk_level === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : f.risk_level === 'HIGH'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {f.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-800">
                      {f.assigned_to_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {f.target_completion_date}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          f.status === 'CLOSED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : f.status === 'REOPENED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setActivePage('audit-capa')}
                          title="Manage CAPA"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                        >
                          CAPA
                        </button>
                        {canManage && f.status === 'CLOSED' && (
                          <button
                            onClick={() => {
                              setSelectedFinding(f);
                              setReopenModalOpen(true);
                            }}
                            title="Reopen Finding"
                            className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded-lg transition"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Finding Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Register New Audit Finding / Non-Conformance
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFinding} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Finding Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Temperature logging gap in Finished Goods cold room"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="QUALITY">Quality Control</option>
                    <option value="PURCHASE">Procurement</option>
                    <option value="INVENTORY">Inventory</option>
                    <option value="PRODUCTION">Production</option>
                    <option value="GST_INVOICING">GST Invoicing</option>
                    <option value="PAYMENTS">Finance</option>
                    <option value="SALES">Sales</option>
                    <option value="DISPATCH">Dispatch</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Risk Severity *</label>
                  <select
                    value={formData.risk_level}
                    onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Detailed Non-Conformance Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe observed deviation from SOP or statutory standard..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Related Transaction Type</label>
                  <select
                    value={formData.related_transaction_type}
                    onChange={(e) => setFormData({ ...formData, related_transaction_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="GRN">Goods Received Note (GRN)</option>
                    <option value="PURCHASE_ORDER">Purchase Order</option>
                    <option value="INVENTORY_BATCH">Inventory Batch</option>
                    <option value="PRODUCTION_ORDER">Production Order</option>
                    <option value="INSPECTION">Quality Inspection</option>
                    <option value="INVOICE">Tax Invoice</option>
                    <option value="PAYMENT">Payment Voucher / Receipt</option>
                    <option value="OTHER">Other / General Facility</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Related Doc Ref #</label>
                  <input
                    type="text"
                    value={formData.related_transaction_reference}
                    onChange={(e) => setFormData({ ...formData, related_transaction_reference: e.target.value })}
                    placeholder="e.g. GRN-2026-002, PO-2026-001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Root Cause Analysis</label>
                <input
                  type="text"
                  value={formData.root_cause}
                  onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
                  placeholder="Why did this deviation occur?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Assigned Person</label>
                  <input
                    type="text"
                    value={formData.assigned_to_name}
                    onChange={(e) => setFormData({ ...formData, assigned_to_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={formData.target_completion_date}
                    onChange={(e) => setFormData({ ...formData, target_completion_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm"
                >
                  Register Finding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Finding Modal */}
      {reopenModalOpen && selectedFinding && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-rose-600" />
                Reopen Audit Finding
              </h3>
              <button onClick={() => setReopenModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReopen} className="space-y-3 text-xs">
              <p className="text-slate-600">
                Reopening finding <strong className="text-slate-800">{selectedFinding.finding_number}</strong>. Documented reason is mandatory.
              </p>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Reopen Reason / New Evidence *</label>
                <textarea
                  required
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Non-conformance reoccurred or corrective action failed post-closure audit..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReopenModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Confirm Reopen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
