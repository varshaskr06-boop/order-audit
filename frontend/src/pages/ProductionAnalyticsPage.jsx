import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Factory, CheckCircle2, AlertTriangle, Clock, Download,
  Printer, RefreshCw, BarChart2, Gauge
} from 'lucide-react';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import DonutChart from '../components/charts/DonutChart';
import { exportToCSV, printReport } from '../utils/exportUtils';

export default function ProductionAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProduction = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/production', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Failed to load production analytics');
    } catch (e) {
      setError('Network error fetching production analytics');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProduction();
  }, [fetchProduction]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          Loading Manufacturing Yield & Efficiency Analytics...
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const dailyProduction = data?.dailyProduction || [];
  const downtimeBreakdown = data?.downtimeBreakdown || [];

  const downtimeDonut = downtimeBreakdown.map((d, idx) => ({
    label: d.reason.split(' ').slice(0, 3).join(' '),
    value: d.hours,
    color: ['#0284c7', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 4]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Factory className="h-6 w-6 text-emerald-600" />
            Manufacturing Output & Yield Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Planned vs actual production volumes, standard recipe BOM variance, and downtime analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV('Daily_Production_Output', dailyProduction)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => printReport('Production_Analytics')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Batch Yield Efficiency</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{summary.yield_efficiency}%</div>
          <div className="text-xs text-slate-500 mt-1">Actual vs standard BOM output</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Produced Volume (Actual)</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.produced_quantity_kg.toLocaleString()} kg</div>
          <div className="text-xs text-slate-500 mt-1">Planned: {summary.planned_quantity_kg.toLocaleString()} kg</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Batches Executed</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.total_batches} Batches</div>
          <div className="text-xs text-slate-500 mt-1">Batter, podis, masalas, oils</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Machine Downtime Incurred</div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{summary.total_downtime_hours} Hours</div>
          <div className="text-xs text-slate-500 mt-1">Sanitization & maintenance</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Daily Planned vs Actual Production (KG)"
          data={dailyProduction}
          xKey="date"
          bars={[
            { key: 'planned_kg', color: '#94a3b8', label: 'Planned Target' },
            { key: 'produced_kg', color: '#16a34a', label: 'Actual Output' }
          ]}
          yFormat={(v) => `${v} kg`}
        />
        <DonutChart
          title="Downtime Root Cause Distribution (Hours)"
          data={downtimeDonut}
          centerLabel="Downtime"
          centerValue={`${summary.total_downtime_hours}h`}
        />
      </div>

      {/* Downtime Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Production Machine Downtime & Line Stoppage Log</h3>
          <span className="text-xs text-slate-500">Preventive Maintenance Priority</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Stoppage Reason / Line Activity</th>
                <th className="px-4 py-3 text-right">Downtime Duration</th>
                <th className="px-4 py-3 text-right">Share of Stoppage %</th>
                <th className="px-4 py-3 text-center">Corrective Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {downtimeBreakdown.map((d, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">{d.reason}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{d.hours} hrs</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-600">{d.percentage}%</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      LOGGED & AUDITED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
