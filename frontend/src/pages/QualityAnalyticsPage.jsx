import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Download,
  Printer, RefreshCw, Layers
} from 'lucide-react';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';
import { exportToCSV, printReport } from '../utils/exportUtils';

export default function QualityAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQuality = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/quality', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Failed to load quality analytics');
    } catch (e) {
      setError('Network error fetching quality analytics');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchQuality();
  }, [fetchQuality]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          Loading Quality Yield & CAPA Analytics...
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const defectPareto = data?.defectPareto || [];
  const capaMetrics = data?.capaMetrics || {};

  const inspectionDonut = [
    { label: 'Passed Cleanly', value: Math.round(((summary.overall_pass_rate || 95) / 100) * (summary.total_inspections || 48)), color: '#16a34a' },
    { label: 'Failed (Quarantined)', value: summary.failed_inspections || 2, color: '#ef4444' },
    { label: 'Conditionally Passed', value: summary.conditional_inspections || 0, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            Quality Assurance & CAPA Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            FSSAI compliance adherence, inspection yield rates, defect Pareto curves, and corrective action status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV('Defect_Pareto_Report', defectPareto)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => printReport('Quality_Analytics')}
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
          <div className="text-xs font-semibold text-slate-500 uppercase">Overall Inspection Pass Rate</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{summary.overall_pass_rate}%</div>
          <div className="text-xs text-slate-500 mt-1">Raw material, in-process & FG</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Quality Inspections</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.total_inspections} Audited</div>
          <div className="text-xs text-slate-500 mt-1">Conforming to FSSAI norms</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Rejected / Quarantined Lots</div>
          <div className="text-2xl font-bold text-red-600 mt-2">{summary.failed_inspections} Lots</div>
          <div className="text-xs text-red-700 mt-1 font-medium">Auto-locked in Phase 6 stock</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Open CAPA Actions</div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{capaMetrics.open_capas} Open</div>
          <div className="text-xs text-slate-500 mt-1">{capaMetrics.closed_capas} closed & verified</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          title="Inspection Outcome Distribution"
          data={inspectionDonut}
          centerLabel="Yield"
          centerValue={`${summary.overall_pass_rate}%`}
        />
        <BarChart
          title="Defect Pareto Analysis (Occurrences)"
          data={defectPareto.map((d) => ({
            label: d.defect_type.split(' ').slice(0, 3).join(' '),
            value: d.occurrences
          }))}
          xKey="label"
          bars={[{ key: 'value', color: '#dc2626', label: 'Defect Frequency' }]}
          yFormat={(v) => `${v} times`}
        />
      </div>

      {/* Defect Pareto Details Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Defect Root-Cause Categorization & Cumulative Curve</h3>
          <span className="text-xs text-slate-500">80/20 Rule for Quality Improvement</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Identified Defect Type</th>
                <th className="px-4 py-3 text-right">Occurrence Count</th>
                <th className="px-4 py-3 text-right">Cumulative Percentage</th>
                <th className="px-4 py-3 text-center">Corrective Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {defectPareto.map((d, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{d.defect_type}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{d.occurrences}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600">{d.cumulative_percent}%</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Phase 8 CAPA Linked
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
