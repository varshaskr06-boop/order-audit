import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert, CheckCircle2, AlertTriangle, Download, Printer,
  RefreshCw, CheckSquare, Clock
} from 'lucide-react';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';
import { exportToCSV, printReport } from '../utils/exportUtils';

export default function AuditAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/audit', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Failed to load audit analytics');
    } catch (e) {
      setError('Network error fetching audit analytics');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          Loading Audit Intelligence & Risk Heatmap...
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const risk = data?.riskDistribution || {};
  const closure = data?.findingsClosure || {};
  const departmentalScores = data?.departmentalScores || [];

  const riskDonut = [
    { label: 'Critical Risk', value: risk.CRITICAL || 1, color: '#dc2626' },
    { label: 'High Risk', value: risk.HIGH || 1, color: '#ea580c' },
    { label: 'Medium Risk', value: risk.MEDIUM || 1, color: '#f59e0b' },
    { label: 'Low Risk', value: risk.LOW || 1, color: '#16a34a' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-emerald-600" />
            Internal Audit Findings & Risk Heatmap
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Departmental compliance scoring, 5x5 risk breakdown, and findings remediation velocity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV('Audit_Departmental_Scores', departmentalScores)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => printReport('Audit_Analytics')}
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
          <div className="text-xs font-semibold text-slate-500 uppercase">Findings Closure Rate</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{summary.closure_rate_percent}%</div>
          <div className="text-xs text-slate-500 mt-1">Remediated & verified findings</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Audit Plans Active</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.total_audits} Plans</div>
          <div className="text-xs text-slate-500 mt-1">Covering 10 audit categories</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Audit Findings</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.total_findings} Recorded</div>
          <div className="text-xs text-amber-600 mt-1 font-medium">{closure.open} require action</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Avg Resolution Turnaround</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.avg_resolution_days} Days</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">Under 7-day target SLA</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          title="Audit Findings Risk Severity Distribution"
          data={riskDonut}
          centerLabel="Findings"
          centerValue={`${summary.total_findings}`}
        />
        <BarChart
          title="Departmental Compliance Scores (%)"
          data={departmentalScores.map((d) => ({
            label: d.department.split(' ')[0] + ' ' + (d.department.split(' ')[1] || ''),
            score: d.score
          }))}
          xKey="label"
          bars={[{ key: 'score', color: '#16a34a', label: 'Compliance Score %' }]}
          yFormat={(v) => `${v}%`}
        />
      </div>

      {/* Department Score Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Operational Audit Compliance Matrix</h3>
          <span className="text-xs text-slate-500">Evaluated Across Pre-seeded Checklists</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Audit Domain / Department</th>
                <th className="px-4 py-3 text-center">Audit Score</th>
                <th className="px-4 py-3 text-center">Compliance Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {departmentalScores.map((d, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{d.department}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900 text-sm">{d.score}%</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        d.status === 'EXCELLENT'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {d.status}
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
