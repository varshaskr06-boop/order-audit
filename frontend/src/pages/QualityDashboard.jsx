import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Sliders,
  CheckSquare,
  Activity
} from 'lucide-react';

export default function QualityDashboard() {
  const { token, user, setActivePage } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/quality/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      } else {
        setError(json.error?.message || 'Failed to load quality dashboard');
      }
    } catch (err) {
      setError(err.message || 'Network error loading quality dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  const kpis = [
    {
      label: 'Total Inspections',
      value: stats?.total_inspections || 0,
      icon: ShieldCheck,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      badge: 'All Audits'
    },
    {
      label: 'Passed (Clear)',
      value: stats?.passed_inspections || 0,
      icon: CheckCircle2,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      badge: 'Accepted'
    },
    {
      label: 'Failed (Rejected)',
      value: stats?.failed_inspections || 0,
      icon: XCircle,
      color: stats?.failed_inspections > 0 ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-700',
      badge: stats?.failed_inspections > 0 ? 'Quarantined' : 'Zero'
    },
    {
      label: 'Pending Review',
      value: stats?.pending_inspections || 0,
      icon: Clock,
      color: 'bg-amber-50 border-amber-200 text-amber-700',
      badge: 'In Lab'
    },
    {
      label: 'Open Incidents',
      value: stats?.open_incidents || 0,
      icon: AlertTriangle,
      color: stats?.open_incidents > 0 ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-700',
      badge: 'Investigating'
    },
    {
      label: 'Pending CAPA',
      value: stats?.pending_capa_actions || 0,
      icon: RotateCcw,
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      badge: 'Active SOPs'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-inner">
              🛡️
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Quality Assurance & Compliance Command
              </h1>
              <p className="text-xs text-slate-500">
                Phase 8 — Standards Enforcement, In-Process QC, Defect Logging & CAPA Governance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {['ADMIN', 'OWNER', 'PRODUCTION'].includes(user?.role?.toUpperCase()) && (
            <button
              onClick={() => setActivePage('qc-rm-inspection')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all"
            >
              <CheckSquare className="h-4 w-4" />
              Perform Inspection
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${kpi.color} flex flex-col justify-between transition-all hover:shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 opacity-80" />
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/70">
                  {kpi.badge}
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black">{kpi.value}</div>
                <div className="text-[11px] font-medium opacity-80">{kpi.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rejection Quantities by Material Category */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rejected Raw Materials</div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {(stats?.rejected_raw_materials || 0).toLocaleString()} <span className="text-xs font-semibold text-slate-500">KG</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Quarantined from production</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <XCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rejected Packaging</div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {(stats?.rejected_packaging || 0).toLocaleString()} <span className="text-xs font-semibold text-slate-500">PCS</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Defective pouch & carton rolls</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rejected Finished Goods</div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {(stats?.rejected_finished_goods || 0).toLocaleString()} <span className="text-xs font-semibold text-slate-500">Units</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Locked from dispatch warehouse</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Recent Inspection Activities */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Quality Audit Log</h2>
            <p className="text-xs text-slate-500">Live incoming, in-process & finished goods clearance records</p>
          </div>
          <button
            onClick={() => setActivePage('qc-reports')}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            Audit Reports <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Inspection #</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Decision Status</th>
                <th className="py-3 px-4">Audit Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {stats?.recent_inspections?.length > 0 ? (
                stats.recent_inspections.map((ins, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">{ins.inspection_number}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {ins.inspection_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{ins.item_name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">{ins.batch_number}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ins.status === 'PASSED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ins.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ins.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {ins.created_at ? new Date(ins.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No inspection logs recorded yet. Perform a quality check to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setActivePage('qc-standards')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all text-left flex flex-col justify-between"
        >
          <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Sliders className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-slate-900">Quality Standards</div>
            <div className="text-[11px] text-slate-500">Configure parameters & limits</div>
          </div>
        </button>

        <button
          onClick={() => setActivePage('qc-rm-inspection')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all text-left flex flex-col justify-between"
        >
          <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckSquare className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-slate-900">RM & PKG Clearance</div>
            <div className="text-[11px] text-slate-500">Inward quality clearance</div>
          </div>
        </button>

        <button
          onClick={() => setActivePage('qc-defects')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all text-left flex flex-col justify-between"
        >
          <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-slate-900">Defects & Rejections</div>
            <div className="text-[11px] text-slate-500">Supplier & floor deviations</div>
          </div>
        </button>

        <button
          onClick={() => setActivePage('qc-capa')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all text-left flex flex-col justify-between"
        >
          <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <RotateCcw className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-slate-900">CAPA Management</div>
            <div className="text-[11px] text-slate-500">Corrective action tracking</div>
          </div>
        </button>
      </div>
    </div>
  );
}
