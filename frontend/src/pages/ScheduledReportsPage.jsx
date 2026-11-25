import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Clock, Plus, Play, CheckCircle2, AlertTriangle, RefreshCw,
  Calendar, FileText, Send, UserCheck, AlertCircle
} from 'lucide-react';

export default function ScheduledReportsPage() {
  const { token } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [runningId, setRunningId] = useState(null);

  // New schedule form
  const [scheduleName, setScheduleName] = useState('');
  const [defId, setDefId] = useState('1');
  const [frequency, setFrequency] = useState('DAILY');
  const [format, setFormat] = useState('PDF');
  const [recipients, setRecipients] = useState('admin@meenakshifoods.in');
  const [saving, setSaving] = useState(false);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sRes, dRes] = await Promise.all([
        fetch('/api/analytics/schedules', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/analytics/definitions', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const sJson = await sRes.json();
      const dJson = await dRes.json();
      if (sJson.success) setSchedules(sJson.data);
      if (dJson.success) setDefinitions(dJson.data);
    } catch (e) {
      setError('Failed to load scheduled report automations');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!scheduleName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/analytics/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          schedule_name: scheduleName,
          report_definition_id: parseInt(defId),
          frequency,
          export_format: format,
          recipients
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setScheduleName('');
        fetchSchedules();
      } else {
        alert(json.error || 'Failed to create schedule');
      }
    } catch (e) {
      alert('Network error creating report schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleManualTrigger = async (id) => {
    setRunningId(id);
    try {
      const res = await fetch(`/api/analytics/schedules/${id}/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchSchedules();
      } else {
        alert(json.error || 'Failed to execute schedule');
      }
    } catch (e) {
      alert('Error triggering manual run');
    } finally {
      setRunningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          Loading Report Automation Schedules...
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
            <Clock className="h-6 w-6 text-emerald-600" />
            Scheduled Report Automations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated scheduled report generation and internal ERP execution logging
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Schedule Report
        </button>
      </div>

      {/* Info notice about email delivery / ERP logs */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold">Internal Distribution Note:</span> Scheduled reports generate snapshots
          directly into the ERP Execution Log. If an external SMTP mail server is not configured in environment variables,
          reports are securely stored for internal viewing and manual export.
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          {error}
        </div>
      )}

      {/* Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono">
                  {s.frequency}
                </span>
                <span className="text-xs font-semibold text-slate-500">{s.export_format} FORMAT</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base mt-2">{s.schedule_name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Target: {s.report_name}</p>

              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Time: {s.schedule_time}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Send className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">Recipients: {s.recipients}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Last run: {s.last_run_at ? new Date(s.last_run_at).toLocaleDateString() : 'Pending'}
              </span>
              <button
                disabled={runningId === s.id}
                onClick={() => handleManualTrigger(s.id)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-50"
              >
                <Play className="h-3 w-3 text-emerald-600" />
                {runningId === s.id ? 'Running...' : 'Run Now'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Create Scheduled Report Automation</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Schedule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Executive Morning Digest"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Report Definition</label>
                <select
                  value={defId}
                  onChange={(e) => setDefId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {definitions.map((d) => (
                    <option key={d.id} value={d.id}>
                      [{d.category}] {d.report_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="DAILY">Daily (Morning)</option>
                    <option value="WEEKLY">Weekly (Monday)</option>
                    <option value="MONTHLY">Monthly (End of month)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PDF">PDF Letterhead</option>
                    <option value="CSV">CSV Data File</option>
                    <option value="EXCEL">Excel Spreadsheet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Recipient Emails</label>
                <input
                  type="text"
                  required
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
