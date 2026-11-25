import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Factory,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  ArrowRight,
  RefreshCw,
  Calendar,
  PackageCheck
} from 'lucide-react';

export default function ProductionManagementDashboard() {
  const { token, user, setActivePage } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/production/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      } else {
        setError(json.error?.message || 'Failed to load production dashboard');
      }
    } catch (err) {
      setError(err.message || 'Network error loading production dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  const kpis = [
    {
      label: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: Factory,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      badge: 'All Cycles'
    },
    {
      label: 'Planned',
      value: stats?.planned || 0,
      icon: Calendar,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      badge: 'Scheduled'
    },
    {
      label: 'Approved',
      value: stats?.approved || 0,
      icon: CheckCircle2,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      badge: 'Ready to Run'
    },
    {
      label: 'In Progress',
      value: stats?.in_progress || 0,
      icon: Play,
      color: 'bg-amber-50 border-amber-200 text-amber-700',
      badge: 'On Floor'
    },
    {
      label: 'Completed',
      value: stats?.completed || 0,
      icon: PackageCheck,
      color: 'bg-teal-50 border-teal-200 text-teal-700',
      badge: 'Finished'
    },
    {
      label: 'Delayed',
      value: stats?.delayed || 0,
      icon: AlertTriangle,
      color: stats?.delayed > 0 ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-700',
      badge: stats?.delayed > 0 ? 'Action Req' : 'On Time'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-xl shadow-inner">
              🏭
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Production Control Center
              </h1>
              <p className="text-xs text-slate-500">
                Phase 7 — Shop Floor Execution, Material Balancing & Quality Traceability
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
              onClick={() => setActivePage('production-orders')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all"
            >
              <Factory className="h-4 w-4" />
              Manage Orders
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

      {/* Output Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Output Produced</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {(stats?.total_produced || 0).toLocaleString()} <span className="text-xs font-semibold text-slate-500">Units</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accepted for Storage</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {(stats?.total_accepted || 0).toLocaleString()} <span className="text-xs font-semibold text-slate-500">Units</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rejected & Wastage</div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {(stats?.total_rejected || 0).toLocaleString()} <span className="text-xs font-semibold text-slate-500">Units</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Recent Production Activities Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Shop Floor Activity</h2>
            <p className="text-xs text-slate-500">Latest production orders and status updates</p>
          </div>
          <button
            onClick={() => setActivePage('production-orders')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            View All Orders <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Planned Qty</th>
                <th className="py-3 px-4">Produced Qty</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {stats?.recent_activities?.length > 0 ? (
                stats.recent_activities.map((act, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">{act.order_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{act.product_name}</td>
                    <td className="py-3 px-4 font-mono">{act.planned_quantity}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">{act.actual_quantity || 0}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          act.status === 'COMPLETED'
                            ? 'bg-teal-100 text-teal-800'
                            : act.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800'
                            : act.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {act.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {act.updated_at ? new Date(act.updated_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No production activity recorded yet. Create an order to begin.
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
          onClick={() => setActivePage('production-planning')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all text-left flex flex-col justify-between"
        >
          <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-slate-900">Planning & Demand</div>
            <div className="text-[11px] text-slate-500">Plan batches vs sales orders</div>
          </div>
        </button>

        <button
          onClick={() => setActivePage('material-issue')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all text-left flex flex-col justify-between"
        >
          <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Layers className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-slate-900">Material Issue</div>
            <div className="text-[11px] text-slate-500">Issue RM & PKG to production</div>
          </div>
        </button>

        <button
          onClick={() => setActivePage('production-execution')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all text-left flex flex-col justify-between"
        >
          <div className="h-8 w-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            <Play className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-slate-900">Execution & Downtime</div>
            <div className="text-[11px] text-slate-500">Record machine progress</div>
          </div>
        </button>

        <button
          onClick={() => setActivePage('fg-receipt')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all text-left flex flex-col justify-between"
        >
          <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <PackageCheck className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-slate-900">Finished Goods Inward</div>
            <div className="text-[11px] text-slate-500">Post accepted batches to stock</div>
          </div>
        </button>
      </div>
    </div>
  );
}
