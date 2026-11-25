import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Eye,
  X,
  FileCheck,
  Check,
  ArrowRight,
  ClipboardList,
  Sparkles,
  UserCheck
} from 'lucide-react';

export default function CapaManagementPage() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('capa'); // 'capa' or 'incidents'
  const [capas, setCapas] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showCapaModal, setShowCapaModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedCapa, setSelectedCapa] = useState(null);

  // Form states
  const [incidentForm, setIncidentForm] = useState({
    incident_title: 'Excess moisture detected in Ponni Rice lot',
    category: 'RAW_MATERIAL',
    severity: 'MAJOR',
    root_cause_summary: 'Rain ingress during transport from Thanjavur mill.',
    immediate_containment_action: 'Batch RM-RICE-2026-B02 quarantined in Bay 3. Supplier notified.'
  });

  const [capaForm, setCapaForm] = useState({
    incident_id: '',
    title: 'Moisture ingress prevention in paddy transport',
    problem_description: 'Transit tarp failed during heavy monsoon rainfall, elevating moisture from 12% to 15.2%.',
    root_cause_analysis: 'Supplier third-party transport used single-ply torn canvas tarp without water-resistant sealing.',
    corrective_action: 'Replace all transit tarpaulins with heavy-duty 400 GSM PVC waterproof covers.',
    preventive_action: 'Mandate digital moisture checks at loading point before dispatch with driver signoff.',
    assigned_to_name: 'Production & Logistics Lead',
    assigned_to_role: 'PRODUCTION',
    target_completion_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  });

  const [verifyForm, setVerifyForm] = useState({
    verification_method: 'FOLLOW_UP_AUDIT',
    verification_comments: 'Audited next 3 incoming consignments; all tarpaulins waterproofed and moisture < 11.8%.',
    effectiveness_verified: true
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [capaRes, incRes] = await Promise.all([
        fetch('/api/quality/capa', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/quality/incidents', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const capaJson = await capaRes.json();
      const incJson = await incRes.json();

      if (capaJson.success) setCapas(capaJson.data || []);
      if (incJson.success) setIncidents(incJson.data || []);
    } catch (err) {
      setError(err.message || 'Error loading CAPA and incident data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/quality/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(incidentForm)
      });
      const json = await res.json();
      if (json.success) {
        setShowIncidentModal(false);
        fetchData();
      } else {
        setError(json.error?.message || 'Failed to create incident');
      }
    } catch (err) {
      setError(err.message || 'Network error creating incident');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCapa = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...capaForm,
        incident_id: capaForm.incident_id ? Number(capaForm.incident_id) : null
      };
      const res = await fetch('/api/quality/capa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setShowCapaModal(false);
        fetchData();
      } else {
        setError(json.error?.message || 'Failed to create CAPA');
      }
    } catch (err) {
      setError(err.message || 'Network error creating CAPA');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (capaId, newStatus) => {
    try {
      const res = await fetch(`/api/quality/capa/${capaId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, comments: `Status transitioned to ${newStatus}` })
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      } else {
        setError(json.error?.message || 'Failed to update CAPA status');
      }
    } catch (err) {
      setError(err.message || 'Error updating status');
    }
  };

  const handleVerifyCapa = async (e) => {
    e.preventDefault();
    if (!selectedCapa) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/quality/capa/${selectedCapa.capa_id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(verifyForm)
      });
      const json = await res.json();
      if (json.success) {
        setShowVerifyModal(false);
        setSelectedCapa(null);
        fetchData();
      } else {
        setError(json.error?.message || 'Failed to verify and close CAPA');
      }
    } catch (err) {
      setError(err.message || 'Error verifying CAPA');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCapas = capas.filter((c) => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  const canCreate = ['ADMIN', 'OWNER', 'PRODUCTION'].includes((user?.role || '').toUpperCase());
  const canVerify = ['ADMIN', 'OWNER'].includes((user?.role || '').toUpperCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">CAPA & Quality Incidents</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Module 7 • Root Cause Analysis, Corrective & Preventive Action Tracking & Closure
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canCreate && (
            <>
              <button
                onClick={() => setShowIncidentModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Log Incident
              </button>
              <button
                onClick={() => setShowCapaModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
              >
                <PlusCircle className="h-4 w-4" />
                Initiate CAPA
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('capa')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'capa'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          CAPA Records ({capas.length})
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'incidents'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Quality Incidents ({incidents.length})
        </button>
      </div>

      {activeTab === 'capa' && (
        <div className="space-y-4">
          {/* Status filter bar */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Filter by Action State:</div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-700 font-bold"
            >
              <option value="ALL">All CAPAs</option>
              <option value="OPEN">OPEN</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          {/* CAPA Cards / Table */}
          <div className="grid grid-cols-1 gap-4">
            {filteredCapas.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                No CAPA records found.
              </div>
            ) : (
              filteredCapas.map((capa) => {
                let badgeClass = 'bg-slate-100 text-slate-700';
                if (capa.status === 'CLOSED') badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                else if (capa.status === 'IN_PROGRESS') badgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
                else if (capa.status === 'PENDING_VERIFICATION') badgeClass = 'bg-purple-100 text-purple-800 border-purple-300';
                else if (capa.status === 'OPEN') badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';

                return (
                  <div
                    key={capa.capa_id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                          {capa.capa_number}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900">{capa.title}</h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                        {capa.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Problem & Root Cause</div>
                        <p className="text-slate-700">{capa.problem_description}</p>
                        <div className="text-amber-800 bg-amber-50 p-2 rounded-lg text-[11px] border border-amber-200 font-medium">
                          <strong>5-Whys Root Cause:</strong> {capa.root_cause_analysis}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Corrective & Preventive Plan</div>
                        <div className="text-slate-700 bg-slate-50 p-2 rounded-lg text-[11px] border border-slate-200 space-y-1">
                          <div><strong>Corrective:</strong> {capa.corrective_action}</div>
                          <div><strong>Preventive:</strong> {capa.preventive_action}</div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>Owner: <strong>{capa.assigned_to_name}</strong></span>
                          <span>Target: <strong>{capa.target_completion_date}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
                      {capa.status === 'OPEN' && canCreate && (
                        <button
                          onClick={() => handleUpdateStatus(capa.capa_id, 'IN_PROGRESS')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                        >
                          Mark In-Progress
                        </button>
                      )}
                      {capa.status === 'IN_PROGRESS' && canCreate && (
                        <button
                          onClick={() => handleUpdateStatus(capa.capa_id, 'PENDING_VERIFICATION')}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold"
                        >
                          Submit For Verification
                        </button>
                      )}
                      {capa.status === 'PENDING_VERIFICATION' && canVerify && (
                        <button
                          onClick={() => {
                            setSelectedCapa(capa);
                            setShowVerifyModal(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verify & Close CAPA
                        </button>
                      )}
                      {capa.status === 'CLOSED' && (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Closed & Verified on {capa.closure_date || 'Schedule'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Title & Category</th>
                <th className="py-3 px-4 text-center">Severity</th>
                <th className="py-3 px-4">Immediate Containment</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Reported On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No quality incidents recorded.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc.incident_id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">{inc.incident_number}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{inc.incident_title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inc.category}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={inc.immediate_containment_action}>
                      {inc.immediate_containment_action || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{inc.status}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{inc.incident_date?.split('T')[0]}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm">Log Food Safety / Quality Incident</h3>
              <button onClick={() => setShowIncidentModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateIncident} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Incident Title *</label>
                <input
                  type="text"
                  required
                  value={incidentForm.incident_title}
                  onChange={(e) => setIncidentForm({ ...incidentForm, incident_title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={incidentForm.category}
                    onChange={(e) => setIncidentForm({ ...incidentForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 font-medium"
                  >
                    <option value="RAW_MATERIAL">RAW_MATERIAL</option>
                    <option value="PACKAGING">PACKAGING</option>
                    <option value="PRODUCTION">PRODUCTION</option>
                    <option value="STORAGE">STORAGE</option>
                    <option value="CUSTOMER_COMPLAINT">CUSTOMER COMPLAINT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Severity</label>
                  <select
                    value={incidentForm.severity}
                    onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 font-bold"
                  >
                    <option value="MINOR">MINOR</option>
                    <option value="MAJOR">MAJOR</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Root Cause Summary</label>
                <textarea
                  rows="2"
                  value={incidentForm.root_cause_summary}
                  onChange={(e) => setIncidentForm({ ...incidentForm, root_cause_summary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Immediate Containment Action Taken *</label>
                <textarea
                  rows="2"
                  required
                  value={incidentForm.immediate_containment_action}
                  onChange={(e) => setIncidentForm({ ...incidentForm, immediate_containment_action: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
                >
                  Save Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create CAPA Modal */}
      {showCapaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm">Initiate CAPA Corrective & Preventive Action</h3>
              <button onClick={() => setShowCapaModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCapa} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">CAPA Action Title *</label>
                <input
                  type="text"
                  required
                  value={capaForm.title}
                  onChange={(e) => setCapaForm({ ...capaForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Problem Description *</label>
                <textarea
                  rows="2"
                  required
                  value={capaForm.problem_description}
                  onChange={(e) => setCapaForm({ ...capaForm, problem_description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Root Cause Analysis (5-Whys / Fishbone) *</label>
                <textarea
                  rows="2"
                  required
                  value={capaForm.root_cause_analysis}
                  onChange={(e) => setCapaForm({ ...capaForm, root_cause_analysis: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Corrective Action (Immediate Fix) *</label>
                <textarea
                  rows="2"
                  required
                  value={capaForm.corrective_action}
                  onChange={(e) => setCapaForm({ ...capaForm, corrective_action: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Preventive Action (Systemic Recurrence Prevention) *</label>
                <textarea
                  rows="2"
                  required
                  value={capaForm.preventive_action}
                  onChange={(e) => setCapaForm({ ...capaForm, preventive_action: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assignee Name</label>
                  <input
                    type="text"
                    value={capaForm.assigned_to_name}
                    onChange={(e) => setCapaForm({ ...capaForm, assigned_to_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={capaForm.target_completion_date}
                    onChange={(e) => setCapaForm({ ...capaForm, target_completion_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCapaModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20"
                >
                  Create CAPA Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify & Close Modal */}
      {showVerifyModal && selectedCapa && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm">Verify Effectiveness & Close CAPA</h3>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleVerifyCapa} className="p-6 space-y-4 text-xs">
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                <div className="text-[10px] text-indigo-700 font-bold uppercase">CAPA Target</div>
                <div className="font-bold text-slate-800">{selectedCapa.title}</div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Verification Method *</label>
                <select
                  value={verifyForm.verification_method}
                  onChange={(e) => setVerifyForm({ ...verifyForm, verification_method: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="FOLLOW_UP_AUDIT">FOLLOW UP AUDIT & INSPECTION</option>
                  <option value="PROCESS_METRICS_REVIEW">PROCESS METRICS REVIEW (ZERO RECURRENCE)</option>
                  <option value="LAB_TEST_CONFIRMATION">LAB TEST CONFIRMATION</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Verification Comments & Evidence *</label>
                <textarea
                  rows="3"
                  required
                  value={verifyForm.verification_comments}
                  onChange={(e) => setVerifyForm({ ...verifyForm, verification_comments: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="effCheck"
                  checked={verifyForm.effectiveness_verified}
                  onChange={(e) => setVerifyForm({ ...verifyForm, effectiveness_verified: e.target.checked })}
                  className="h-4 w-4 text-emerald-600 rounded border-slate-300"
                />
                <label htmlFor="effCheck" className="text-slate-800 font-bold cursor-pointer">
                  Corrective action has been confirmed 100% effective
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20"
                >
                  Confirm & Close CAPA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
