import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert, AlertTriangle, RefreshCw, Eye, ArrowRight,
  TrendingDown, CheckCircle2, ShieldCheck, Filter
} from 'lucide-react';

const API = '/api/audit';

export default function RiskAssessmentPage() {
  const { token, setActivePage } = useAuth();
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFindings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/findings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setFindings(json.data || []);
      else setError(json.message || 'Failed to load risk findings');
    } catch (e) {
      setError('Network error fetching risk data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFindings();
  }, [fetchFindings]);

  const criticalCount = findings.filter(f => f.risk_level === 'CRITICAL').length;
  const highCount = findings.filter(f => f.risk_level === 'HIGH').length;
  const mediumCount = findings.filter(f => f.risk_level === 'MEDIUM').length;
  const lowCount = findings.filter(f => f.risk_level === 'LOW').length;

  const highAndCriticalFindings = findings.filter(f => ['CRITICAL', 'HIGH'].includes(f.risk_level));

  // 5x5 Matrix levels
  const likelihoods = ['Almost Certain', 'Likely', 'Possible', 'Unlikely', 'Rare'];
  const impacts = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

  const getCellRisk = (lIdx, iIdx) => {
    // 0 = top, 4 = bottom for likelihood; 0 = left, 4 = right for impact
    const score = (5 - lIdx) * (iIdx + 1);
    if (score >= 15) return { level: 'CRITICAL', color: 'bg-rose-500/20 text-rose-800 border-rose-300' };
    if (score >= 10) return { level: 'HIGH', color: 'bg-amber-500/20 text-amber-800 border-amber-300' };
    if (score >= 5) return { level: 'MEDIUM', color: 'bg-yellow-400/20 text-yellow-800 border-yellow-300' };
    return { level: 'LOW', color: 'bg-emerald-500/15 text-emerald-800 border-emerald-300' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-rose-600" />
            Audit Risk Assessment &amp; 5x5 Heat Matrix
          </h1>
          <p className="text-sm text-slate-500">
            Likelihood vs Impact classification, critical vulnerability tracking, and mitigation controls
          </p>
        </div>
        <button
          onClick={fetchFindings}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Risk Level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm">
          <div className="text-xs font-bold text-rose-600 uppercase">Critical Severity</div>
          <div className="text-2xl font-black font-mono text-rose-700 mt-1">{criticalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Immediate closure mandate</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-xs font-bold text-amber-600 uppercase">High Risk</div>
          <div className="text-2xl font-black font-mono text-amber-700 mt-1">{highCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">CAPA plan required</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-yellow-200 shadow-sm">
          <div className="text-xs font-bold text-yellow-700 uppercase">Medium Risk</div>
          <div className="text-2xl font-black font-mono text-yellow-800 mt-1">{mediumCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Process adjustment</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="text-xs font-bold text-emerald-600 uppercase">Low Risk</div>
          <div className="text-2xl font-black font-mono text-emerald-700 mt-1">{lowCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Routine observation</div>
        </div>
      </div>

      {/* 5x5 Risk Matrix Canvas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">5x5 Risk Evaluation Heat Map</h2>
          <p className="text-xs text-slate-500">Impact (X-Axis) vs Likelihood (Y-Axis) distribution of audit findings</p>
        </div>

        <div className="overflow-x-auto pt-2">
          <div className="min-w-[600px]">
            {/* Table Matrix */}
            <div className="grid grid-cols-6 gap-2 text-center text-xs">
              {/* Header row: Impact labels */}
              <div className="p-2 font-bold text-slate-400 text-[10px] uppercase flex items-center justify-center">
                Likelihood \ Impact
              </div>
              {impacts.map((imp) => (
                <div key={imp} className="p-2 bg-slate-100 font-bold text-slate-700 rounded-lg text-[11px]">
                  {imp}
                </div>
              ))}

              {/* Matrix rows */}
              {likelihoods.map((lh, lIdx) => (
                <React.Fragment key={lh}>
                  {/* Row header: Likelihood label */}
                  <div className="p-2 bg-slate-100 font-bold text-slate-700 rounded-lg flex items-center justify-center text-[11px]">
                    {lh}
                  </div>
                  {/* 5 Impact Cells */}
                  {impacts.map((imp, iIdx) => {
                    const cellInfo = getCellRisk(lIdx, iIdx);
                    // Match findings in this cell
                    const matches = findings.filter(f => f.risk_level === cellInfo.level);
                    return (
                      <div
                        key={imp}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center transition ${cellInfo.color}`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider">{cellInfo.level}</span>
                        {matches.length > 0 && cellInfo.level === 'CRITICAL' && (
                          <span className="mt-1 px-1.5 py-0.2 bg-rose-700 text-white font-mono font-bold text-[10px] rounded-full">
                            {matches.length}
                          </span>
                        )}
                        {matches.length > 0 && cellInfo.level === 'HIGH' && (
                          <span className="mt-1 px-1.5 py-0.2 bg-amber-600 text-white font-mono font-bold text-[10px] rounded-full">
                            {matches.length}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Critical & High Risk Mitigation Tracker */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">Critical &amp; High-Risk Mitigation Controls</h2>
            <p className="text-xs text-slate-500">Track containment actions and assigned managers for top vulnerabilities</p>
          </div>
          <button
            onClick={() => setActivePage('audit-capa')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700"
          >
            Manage CAPA →
          </button>
        </div>

        <div className="space-y-3">
          {highAndCriticalFindings.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No open high or critical risk findings recorded.
            </div>
          ) : (
            highAndCriticalFindings.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-rose-700">{f.finding_number}</span>
                    <h3 className="font-bold text-slate-800 text-sm mt-0.5">{f.title}</h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      f.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {f.risk_level}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{f.description}</p>
                {f.risk_assessment && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 block mb-0.5">Mitigation Strategy:</span>
                    <span className="text-slate-600">{f.risk_assessment.mitigation_strategy}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-500 pt-1">
                  <span>Assigned: <strong>{f.assigned_to_name}</strong></span>
                  <span>Target: <strong>{f.target_completion_date}</strong></span>
                  <span className="font-semibold text-slate-700">{f.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
