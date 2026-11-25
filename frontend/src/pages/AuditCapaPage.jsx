import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  PlusCircle, Search, Eye, RotateCcw, X, Clock, FileCheck
} from 'lucide-react';

const API = '/api/audit';

export default function AuditCapaPage() {
  const { token, user } = useAuth();
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState(null);

  // Link CAPA form
  const [capaForm, setCapaForm] = useState({
    corrective_action: '',
    preventive_action: '',
    root_cause_analysis: ''
  });

  // Verification form
  const [verifForm, setVerifForm] = useState({
    is_effective: true,
    verification_notes: '',
    reopen_reason: ''
  });

  const role = (user?.role || '').toUpperCase();
  const canVerify = ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'].includes(role);

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
      setError('Network error fetching findings for CAPA management');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFindings();
  }, [fetchFindings]);

  const handleLinkCapa = async (e) => {
    e.preventDefault();
    if (!selectedFinding) return;
    try {
      const res = await fetch(`${API}/findings/${selectedFinding.id}/capa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(capaForm)
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Corrective & Preventive Action linked to ${selectedFinding.finding_number}!`);
        setLinkModalOpen(false);
        fetchFindings();
      } else {
        setError(json.message || 'Failed to link CAPA');
      }
    } catch (e) {
      setError('Error linking CAPA');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!selectedFinding) return;
    try {
      const res = await fetch(`${API}/findings/${selectedFinding.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(verifForm)
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Verification logged: ${verifForm.is_effective ? 'Finding closed!' : 'Finding reopened for rework.'}`);
        setVerifyModalOpen(false);
        fetchFindings();
      } else {
        setError(json.message || 'Verification rejected');
      }
    } catch (e) {
      setError('Error processing verification');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            Audit Corrective &amp; Preventive Actions (CAPA)
          </h1>
          <p className="text-sm text-slate-500">
            Phase 8 integrated CAPA lifecycle, independent auditor verification, and closure gating
          </p>
        </div>
        <button
          onClick={fetchFindings}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
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

      {/* Findings with CAPA Register */}
      <div className="space-y-4">
        {findings.map((f) => {
          const hasCapa = Boolean(f.capa_id);
          const isClosed = f.status === 'CLOSED';
          return (
            <div
              key={f.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                    {f.finding_number}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      f.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {f.risk_level}
                  </span>
                  {hasCapa && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                      CAPA LINKED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Status:</span>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                    isClosed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {f.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-base">{f.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{f.description}</p>
              </div>

              {/* Action and Verification Toolbar */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div className="flex gap-4 text-slate-500">
                  <span>Assigned: <strong className="text-slate-800">{f.assigned_to_name}</strong></span>
                  <span>Target Date: <strong className="text-slate-800 font-mono">{f.target_completion_date}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {!hasCapa && !isClosed && (
                    <button
                      onClick={() => {
                        setSelectedFinding(f);
                        setLinkModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition shadow-sm"
                    >
                      + Create CAPA Plan
                    </button>
                  )}
                  {canVerify && !isClosed && (
                    <button
                      onClick={() => {
                        setSelectedFinding(f);
                        setVerifyModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                    >
                      <FileCheck className="h-3.5 w-3.5" />
                      Verify &amp; Close Finding
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Link CAPA Modal */}
      {linkModalOpen && selectedFinding && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Define Corrective &amp; Preventive Action (CAPA)
              </h3>
              <button onClick={() => setLinkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLinkCapa} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Root Cause Analysis</label>
                <textarea
                  rows={2}
                  value={capaForm.root_cause_analysis}
                  onChange={(e) => setCapaForm({ ...capaForm, root_cause_analysis: e.target.value })}
                  placeholder="Root cause identified during audit..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Corrective Action (Immediate Containment) *</label>
                <textarea
                  required
                  rows={2}
                  value={capaForm.corrective_action}
                  onChange={(e) => setCapaForm({ ...capaForm, corrective_action: e.target.value })}
                  placeholder="What immediate correction is being executed?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Preventive Action (Systemic Fix) *</label>
                <textarea
                  required
                  rows={2}
                  value={capaForm.preventive_action}
                  onChange={(e) => setCapaForm({ ...capaForm, preventive_action: e.target.value })}
                  placeholder="What SOP, rule, or system change prevents recurrence?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Submit CAPA Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify & Close Modal */}
      {verifyModalOpen && selectedFinding && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                Formal Effectiveness Verification
              </h3>
              <button onClick={() => setVerifyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleVerify} className="space-y-3 text-xs">
              <p className="text-slate-600">
                Auditor sign-off for <strong className="text-slate-800">{selectedFinding.finding_number}</strong>.
              </p>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Is Corrective Action Effective? *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 font-bold text-emerald-700 cursor-pointer">
                    <input
                      type="radio"
                      name="effective"
                      checked={verifForm.is_effective === true}
                      onChange={() => setVerifForm({ ...verifForm, is_effective: true })}
                    />
                    Yes - Effective (Close Finding)
                  </label>
                  <label className="flex items-center gap-2 font-bold text-rose-700 cursor-pointer">
                    <input
                      type="radio"
                      name="effective"
                      checked={verifForm.is_effective === false}
                      onChange={() => setVerifForm({ ...verifForm, is_effective: false })}
                    />
                    No - Ineffective (Reopen Finding)
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Independent Verification Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={verifForm.verification_notes}
                  onChange={(e) => setVerifForm({ ...verifForm, verification_notes: e.target.value })}
                  placeholder="Detail test results, physical check observations, or calibration certs..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {!verifForm.is_effective && (
                <div>
                  <label className="block font-semibold text-rose-700 mb-1">Reopen Rework Reason *</label>
                  <input
                    type="text"
                    required
                    value={verifForm.reopen_reason}
                    onChange={(e) => setVerifForm({ ...verifForm, reopen_reason: e.target.value })}
                    placeholder="Why did the action fail effectiveness testing?"
                    className="w-full px-3 py-2 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 font-bold rounded-xl shadow-sm text-white ${
                    verifForm.is_effective ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {verifForm.is_effective ? 'Approve Closure' : 'Reopen for Rework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
