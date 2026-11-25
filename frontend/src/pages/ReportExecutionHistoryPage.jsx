import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  History, CheckCircle2, AlertTriangle, RefreshCw, Clock,
  FileText, Download, Filter
} from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

export default function ReportExecutionHistoryPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/execution-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setLogs(json.data);
      else setError(json.error || 'Failed to load report execution logs');
    } catch (e) {
      setError('Network error fetching execution history');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          Loading Report Generation History & Audit Trail...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="h-6 w-6 text-emerald-600" />
            Report Execution History & Audit Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete audit trail of all manual and automated scheduled report runs
          </p>
        </div>
        <button
          onClick={() => exportToCSV('Report_Execution_Logs', logs)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          <Download className="h-4 w-4 text-slate-500" />
          Export Audit Log
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          {error}
        </div>
      )}

      {/* Execution Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Historical Report Execution Audit Trail</h3>
          <span className="text-xs text-slate-500">{logs.length} Total Runs Tracked</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Log ID</th>
                <th className="px-4 py-3">Report Name</th>
                <th className="px-4 py-3">Schedule / Trigger</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Records</th>
                <th className="px-4 py-3 text-right">Execution Time</th>
                <th className="px-4 py-3 text-right">Executed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-500">#{l.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{l.report_name}</td>
                  <td className="px-4 py-3 text-slate-600">{l.schedule_name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {l.execution_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium">{l.record_count}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">{l.execution_time_ms} ms</td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {new Date(l.executed_at).toLocaleString()}
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
