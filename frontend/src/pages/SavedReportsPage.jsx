import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BookmarkCheck, Plus, Trash2, Play, Download, RefreshCw,
  AlertTriangle, Filter, Calendar, FileText
} from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

export default function SavedReportsPage() {
  const { token, user } = useAuth();
  const [reports, setReports] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedDefId, setSelectedDefId] = useState('1');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rRes, dRes] = await Promise.all([
        fetch('/api/analytics/saved-reports', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/analytics/definitions', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const rJson = await rRes.json();
      const dJson = await dRes.json();
      if (rJson.success) setReports(rJson.data);
      if (dJson.success) setDefinitions(dJson.data);
    } catch (e) {
      setError('Failed to load saved report templates');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/analytics/saved-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          custom_title: newTitle,
          report_definition_id: parseInt(selectedDefId),
          saved_filters: { period: 'MONTHLY' }
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setNewTitle('');
        fetchData();
      } else {
        alert(json.error || 'Failed to save report configuration');
      }
    } catch (e) {
      alert('Network error creating saved report');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this saved report view?')) return;
    try {
      const res = await fetch(`/api/analytics/saved-reports/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) fetchData();
    } catch (e) {
      alert('Failed to delete report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          Loading Saved Custom Report Views...
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
            <BookmarkCheck className="h-6 w-6 text-emerald-600" />
            Saved Custom Report Views
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personalized report filter presets for fast repetitive one-click retrieval
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Save New Report View
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          {error}
        </div>
      )}

      {/* Grid of Saved Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <div key={r.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                  {r.category}
                </span>
                <span className="text-xs text-slate-400">ID #{r.id}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base mt-2">{r.custom_title}</h3>
              <p className="text-xs text-slate-500 mt-1">Base: {r.report_name}</p>
              <div className="mt-3 p-2 bg-slate-50 rounded text-[11px] font-mono text-slate-600">
                Filters: {JSON.stringify(r.saved_filters)}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => exportToCSV(r.custom_title, [r])}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <Download className="h-3.5 w-3.5" /> Export Data
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                className="text-slate-400 hover:text-red-600 p-1 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for saving report view */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Save Custom Report Configuration</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Preset Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q1 Sales Performance Filter"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Base Report Category</label>
                <select
                  value={selectedDefId}
                  onChange={(e) => setSelectedDefId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {definitions.map((d) => (
                    <option key={d.id} value={d.id}>
                      [{d.category}] {d.report_name}
                    </option>
                  ))}
                </select>
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
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
