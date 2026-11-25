import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Clock, CheckCircle2, AlertCircle, RefreshCw,
  Search, Play, ShieldAlert, ArrowRight, Filter, ChevronRight
} from 'lucide-react';

const API = '/api/audit';

export default function AuditSchedulePage() {
  const { token, setActivePage } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setPlans(json.data || []);
      else setError(json.message || 'Failed to load audit schedule');
    } catch (e) {
      setError('Network error fetching audit schedule');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const filtered = plans.filter((p) => {
    if (selectedFrequency !== 'ALL' && p.frequency !== selectedFrequency) return false;
    if (selectedDept !== 'ALL' && p.department !== selectedDept) return false;
    return true;
  });

  // Segregate by status
  const activeAudits = filtered.filter((p) => p.status === 'ACTIVE');
  const upcomingAudits = filtered.filter((p) => p.status === 'PLANNED');
  const completedAudits = filtered.filter((p) => p.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-amber-600" />
            Audit Schedule &amp; Execution Timeline
          </h1>
          <p className="text-sm text-slate-500">
            Chronological calendar of scheduled quality, financial, and operational audit milestones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSchedule}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setActivePage('conduct-audit')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl transition shadow-sm"
          >
            <Play className="h-4 w-4" />
            Conduct Active Audit
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase">Frequency:</span>
          {['ALL', 'MONTHLY', 'QUARTERLY', 'BI_ANNUAL', 'ANNUAL'].map((freq) => (
            <button
              key={freq}
              onClick={() => setSelectedFrequency(freq)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedFrequency === freq
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {freq.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Departments</option>
            <option value="QUALITY">Quality Control</option>
            <option value="PURCHASE">Procurement</option>
            <option value="GST_INVOICING">GST Invoicing</option>
            <option value="INVENTORY">Inventory</option>
            <option value="PRODUCTION">Production</option>
            <option value="PAYMENTS">Finance</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Active In-Progress Audits */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          Active &amp; In-Progress Audit Sessions ({activeAudits.length})
        </h2>
        {activeAudits.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            No audit sessions are currently in active progress.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAudits.map((plan) => (
              <div
                key={plan.id}
                className="bg-white p-5 rounded-2xl border-2 border-blue-200/80 shadow-sm space-y-3 hover:border-blue-300 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {plan.plan_number}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm mt-1">{plan.title}</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded uppercase">
                    ACTIVE
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-semibold">Department</span>
                    <span className="font-bold text-slate-800">{plan.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Lead Auditor</span>
                    <span className="font-bold text-slate-800">{plan.lead_auditor_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Target Timeline</span>
                    <span className="font-bold text-slate-800">{plan.start_date} → {plan.end_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Priority</span>
                    <span className="font-bold text-rose-600">{plan.priority}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActivePage('conduct-audit')}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
                >
                  <Play className="h-3.5 w-3.5" />
                  Continue Audit Checklist
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Planned Audits */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          Upcoming Scheduled Audits ({upcomingAudits.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingAudits.map((plan) => (
            <div
              key={plan.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {plan.plan_number}
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                  {plan.frequency}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm">{plan.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{plan.scope}</p>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-mono">Starts {plan.start_date}</span>
                <span className="font-bold text-amber-600">{plan.department}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Audits Archive */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Completed Audit Sessions ({completedAudits.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completedAudits.map((plan) => (
            <div
              key={plan.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="font-mono text-xs font-bold text-slate-600">{plan.plan_number}</span>
                <div className="font-semibold text-xs text-slate-800 truncate max-w-xs">{plan.title}</div>
                <div className="text-[10px] text-slate-400">Completed on schedule</div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded">
                PASSED
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
