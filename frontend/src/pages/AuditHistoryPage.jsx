import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  History, Search, RefreshCw, Filter, ShieldCheck,
  CheckCircle2, Clock, RotateCcw, AlertTriangle
} from 'lucide-react';

const API = '/api/audit';

export default function AuditHistoryPage() {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setHistory(json.data || []);
      else setError(json.message || 'Failed to load audit trail history');
    } catch (e) {
      setError('Network error fetching audit trail history');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filtered = history.filter((h) => {
    if (entityFilter !== 'ALL' && h.entity_type !== entityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchesNum = h.entity_number?.toLowerCase().includes(q);
      const matchesReason = h.reason?.toLowerCase().includes(q);
      const matchesUser = h.changed_by_name?.toLowerCase().includes(q);
      if (!matchesNum && !matchesReason && !matchesUser) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="h-6 w-6 text-amber-600" />
            Immutable Audit Trail &amp; Status Transition Log
          </h1>
          <p className="text-sm text-slate-500">
            Cryptographically stamped chronological audit log of all plan, finding, and CAPA lifecycle events
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref #, reason, or user..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Entity Scope:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Event Types</option>
            <option value="AUDIT_PLAN">Audit Plans</option>
            <option value="AUDIT_RECORD">Audit Sessions</option>
            <option value="AUDIT_FINDING">Audit Findings</option>
            <option value="AUDIT_ACTION">CAPA Actions</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Audit Log Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Identifier / Ref</th>
                <th className="py-3 px-4">Status Transition</th>
                <th className="py-3 px-4">Documented Justification</th>
                <th className="py-3 px-4">Action Taken By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Loading immutable audit trail...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No audit trail transitions recorded for this query.
                  </td>
                </tr>
              ) : (
                filtered.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {new Date(h.changed_at).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {h.entity_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-amber-700">
                      {h.entity_number || `#${h.entity_id}`}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-800">
                      <span className="text-slate-400">{h.old_status || 'INIT'}</span> →{' '}
                      <span className="font-bold text-slate-900">{h.new_status}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-sm">
                      {h.reason || 'Routine status progression'}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-800">
                      {h.changed_by_name || 'System Operator'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
