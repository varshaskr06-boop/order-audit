import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Search, PlusCircle, RefreshCw, Eye, Edit,
  CheckCircle2, Clock, XCircle, AlertCircle, ShieldAlert,
  ClipboardList, X, Play
} from 'lucide-react';

const API = '/api/audit';

export default function AuditPlanningPage() {
  const { token, user, setActivePage } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    department: 'QUALITY',
    category: 'QUALITY_AUDIT',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    frequency: 'QUARTERLY',
    priority: 'HIGH',
    scope: '',
    objectives: ''
  });

  const role = (user?.role || '').toUpperCase();
  const canCreate = ['ADMIN', 'OWNER'].includes(role);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API}/plans`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setPlans(json.data || []);
      else setError(json.message || 'Failed to load audit plans');
    } catch (e) {
      setError('Network error fetching audit plans');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API}/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Audit plan ${json.data.plan_number} created successfully!`);
        setCreateModalOpen(false);
        setFormData({
          title: '',
          department: 'QUALITY',
          category: 'QUALITY_AUDIT',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          frequency: 'QUARTERLY',
          priority: 'HIGH',
          scope: '',
          objectives: ''
        });
        fetchPlans();
      } else {
        setError(json.message || 'Failed to create audit plan');
      }
    } catch (err) {
      setError('Network error creating audit plan');
    }
  };

  const handleStatusChange = async (planId, newStatus) => {
    try {
      const res = await fetch(`${API}/plans/${planId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, reason: `Status manually updated to ${newStatus}` })
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Plan status updated to ${newStatus}`);
        fetchPlans();
      } else {
        setError(json.message || 'Failed to update plan status');
      }
    } catch (e) {
      setError('Error updating plan status');
    }
  };

  const openViewModal = async (planId) => {
    try {
      const res = await fetch(`${API}/plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setSelectedPlan(json.data);
        setViewModalOpen(true);
      }
    } catch (e) {
      alert('Failed to load plan details');
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (deptFilter !== 'ALL' && p.department !== deptFilter) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchesNum = p.plan_number?.toLowerCase().includes(q);
      const matchesTitle = p.title?.toLowerCase().includes(q);
      if (!matchesNum && !matchesTitle) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-amber-600" />
            Audit Planning &amp; Program Management
          </h1>
          <p className="text-sm text-slate-500">
            Define audit scope, assigned lead auditors, recurrence frequencies, and statutory priorities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPlans}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canCreate && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl transition shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              New Audit Plan
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plan # or title..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Dept Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-500">Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Departments</option>
              <option value="QUALITY">Quality Control</option>
              <option value="SALES">Sales</option>
              <option value="PURCHASE">Procurement</option>
              <option value="INVENTORY">Inventory</option>
              <option value="PRODUCTION">Production</option>
              <option value="COSTING">Costing</option>
              <option value="GST_INVOICING">GST Invoicing</option>
              <option value="DISPATCH">Dispatch</option>
              <option value="PAYMENTS">Finance / Payments</option>
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
              <option value="PLANNED">Planned</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Plans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Plan #</th>
                <th className="py-3 px-4">Plan Title &amp; Department</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Schedule Window</th>
                <th className="py-3 px-4">Lead Auditor</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    Loading audit plans...
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No audit plans match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-amber-700">
                      {plan.plan_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{plan.title}</div>
                      <div className="text-[11px] text-slate-500">{plan.department.replace('_', ' ')} • {plan.frequency}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                      {plan.category.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {plan.start_date} to {plan.end_date}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-800">
                      {plan.lead_auditor_name || 'System Lead'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          plan.priority === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : plan.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {plan.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          plan.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : plan.status === 'ACTIVE'
                            ? 'bg-blue-100 text-blue-800'
                            : plan.status === 'PLANNED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {plan.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openViewModal(plan.id)}
                          title="View Plan Details"
                          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canCreate && plan.status === 'PLANNED' && (
                          <button
                            onClick={() => handleStatusChange(plan.id, 'ACTIVE')}
                            title="Activate Audit Session"
                            className="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-800 rounded-lg transition"
                          >
                            <Play className="h-4 w-4" />
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

      {/* Create Audit Plan Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-amber-600" />
                Register New Audit Plan
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Audit Plan Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Q2 Spices Hygiene & Supplier CoA Traceability Audit"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="QUALITY">Quality Control (FSSAI)</option>
                    <option value="SALES">Sales &amp; Customer Orders</option>
                    <option value="PURCHASE">Procurement &amp; 3WM</option>
                    <option value="INVENTORY">Inventory &amp; Warehousing</option>
                    <option value="PRODUCTION">Production &amp; Recipes</option>
                    <option value="COSTING">Product Costing</option>
                    <option value="GST_INVOICING">GST Billing &amp; Tax</option>
                    <option value="DISPATCH">Dispatch &amp; Delivery</option>
                    <option value="PAYMENTS">Finance &amp; Banking</option>
                    <option value="GENERAL">General Internal Controls</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Audit Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="QUALITY_AUDIT">Quality Audit</option>
                    <option value="SALES_AUDIT">Sales Audit</option>
                    <option value="PURCHASE_AUDIT">Purchase Audit</option>
                    <option value="INVENTORY_AUDIT">Inventory Audit</option>
                    <option value="PRODUCTION_AUDIT">Production Audit</option>
                    <option value="COSTING_AUDIT">Product Costing Audit</option>
                    <option value="GST_INVOICE_AUDIT">GST Invoice Audit</option>
                    <option value="DISPATCH_AUDIT">Dispatch Audit</option>
                    <option value="PAYMENT_AUDIT">Payment Audit</option>
                    <option value="GENERAL_INTERNAL_AUDIT">General Internal Audit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ONE_TIME">One-Time / Ad-Hoc</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="BI_ANNUAL">Bi-Annual</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Statutory Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Audit Scope *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  placeholder="Define physical facilities, batch series, and record types in scope..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Objectives &amp; Standards *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.objectives}
                  onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                  placeholder="Specify regulatory benchmarks (FSSAI, ISO 22000, CGST Act)..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-sm"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Plan Details Modal */}
      {viewModalOpen && selectedPlan && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{selectedPlan.title}</h3>
                <span className="font-mono text-xs text-amber-700 font-bold">{selectedPlan.plan_number}</span>
              </div>
              <button onClick={() => setViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">Department</span>
                  <span className="font-bold text-slate-800">{selectedPlan.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Priority</span>
                  <span className="font-bold text-rose-600">{selectedPlan.priority}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Schedule Period</span>
                  <span className="font-bold text-slate-800">{selectedPlan.start_date} to {selectedPlan.end_date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Lead Auditor</span>
                  <span className="font-bold text-slate-800">{selectedPlan.lead_auditor_name}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-0.5">Audit Scope:</span>
                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">{selectedPlan.scope}</p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-0.5">Objectives &amp; Regulatory Mandate:</span>
                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">{selectedPlan.objectives}</p>
              </div>

              {selectedPlan.findings && selectedPlan.findings.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Associated Findings ({selectedPlan.findings.length}):</span>
                  <div className="space-y-1">
                    {selectedPlan.findings.map(f => (
                      <div key={f.id} className="p-2 bg-rose-50/50 border border-rose-200/60 rounded-lg flex justify-between">
                        <span className="font-mono font-bold text-rose-700">{f.finding_number}</span>
                        <span className="font-semibold text-slate-700 truncate max-w-xs">{f.title}</span>
                        <span className="font-bold text-[10px] text-rose-600">{f.risk_level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
