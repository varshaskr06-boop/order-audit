import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Clock, Calendar,
  TrendingUp, BarChart3, Search, RefreshCw, Eye, ArrowUpRight,
  ClipboardList, AlertCircle, FileText, CheckSquare, XCircle
} from 'lucide-react';

const API = '/api/audit';

export default function AuditDashboard() {
  const { token, user, setActivePage } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || 'Failed to load audit dashboard');
    } catch (e) {
      setError('Network error fetching audit dashboard data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-amber-500" />
          Loading Audit Intelligence Dashboard...
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const departmentScores = data?.department_scores || [];
  const recentFindings = data?.recent_findings || [];
  const recentHistory = data?.recent_status_history || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-600" />
            Audit &amp; Compliance Management Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Real-time internal controls, food safety assurance, risk matrix, and statutory audit integrity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setActivePage('audit-planning')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl transition shadow-sm"
          >
            + New Audit Plan
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total & Active Audits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Audit Engagements</span>
            <ClipboardList className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 font-mono">
            {kpis.total_audits || 0}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">{kpis.active_audits || 0} Active</span>
            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded">{kpis.completed_audits || 0} Done</span>
            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-semibold rounded">{kpis.planned_audits || 0} Planned</span>
          </div>
        </div>

        {/* Findings & Risk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Audit Findings</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 font-mono">
            {kpis.total_findings || 0}
          </div>
          <div className="flex items-center gap-2 text-[11px] mt-2">
            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 font-bold rounded">{kpis.critical_findings || 0} Critical</span>
            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 font-bold rounded">{kpis.high_risk_findings || 0} High Risk</span>
            <span className="text-slate-400 font-mono">{kpis.open_findings || 0} Open</span>
          </div>
        </div>

        {/* Checklist Evaluation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Checklist Evaluations</span>
            <CheckSquare className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 font-mono">
            {(kpis.passed_checklist_items || 0) + (kpis.failed_checklist_items || 0)}
          </div>
          <div className="flex items-center gap-2 text-[11px] mt-2">
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {kpis.passed_checklist_items || 0} Passed
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-600 font-semibold flex items-center gap-1">
              <XCircle className="h-3 w-3" /> {kpis.failed_checklist_items || 0} Failed
            </span>
          </div>
        </div>

        {/* Overall Compliance Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Closure &amp; Resolution Rate</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {kpis.overall_compliance_pct || 100}%
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {kpis.closed_findings || 0} of {kpis.total_findings || 0} findings verified &amp; closed
          </div>
        </div>
      </div>

      {/* Department Compliance Scores Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">Operational Department Compliance Matrix</h2>
            <p className="text-xs text-slate-500">Live compliance indices across all 9 manufacturing and accounting functions</p>
          </div>
          <button
            onClick={() => setActivePage('audit-reports')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700"
          >
            Detailed Report →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {departmentScores.map((dept) => {
            const score = dept.compliance_score_pct;
            const isGood = score >= 85;
            const isWarning = score >= 60 && score < 85;
            return (
              <div
                key={dept.department}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-sm transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-xs text-slate-700 tracking-wide">
                    {dept.department.replace('_', ' ')}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      isGood
                        ? 'bg-emerald-100 text-emerald-800'
                        : isWarning
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {score}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>{dept.audit_count} Audits</span>
                  <span className={dept.open_findings > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}>
                    {dept.open_findings} Open Finding{dept.open_findings === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Recent Findings & Audit Status Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Findings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">Critical &amp; High-Risk Findings</h2>
              <p className="text-xs text-slate-500">Active non-conformances requiring corrective action</p>
            </div>
            <button
              onClick={() => setActivePage('audit-findings')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              View All ({kpis.total_findings || 0}) →
            </button>
          </div>

          <div className="space-y-3">
            {recentFindings.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No active audit findings recorded.
              </div>
            ) : (
              recentFindings.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50/60 transition space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">{f.finding_number}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          f.risk_level === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : f.risk_level === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {f.risk_level}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {f.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-800">{f.title}</div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Dept: {f.department}</span>
                    <span>Target: {f.target_completion_date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status Transition History Log */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">Immutable Audit Trail Log</h2>
              <p className="text-xs text-slate-500">Chronological history of plan, finding, and CAPA transitions</p>
            </div>
            <button
              onClick={() => setActivePage('audit-history')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              Full Trail →
            </button>
          </div>

          <div className="space-y-3">
            {recentHistory.map((h) => (
              <div key={h.id} className="flex items-start gap-3 text-xs border-b border-slate-100 pb-2.5 last:border-none">
                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-800">
                      {h.entity_number || h.entity_type} → {h.new_status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(h.changed_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{h.reason}</p>
                  <span className="text-[10px] text-slate-400">By {h.changed_by_name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
