import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Play, CheckCircle2, XCircle, AlertTriangle, ShieldCheck,
  RefreshCw, Save, ArrowRight, FileText, CheckSquare, Clock, PlusCircle
} from 'lucide-react';

const API = '/api/audit';

export default function ConductAuditPage() {
  const { token, user, setActivePage } = useAuth();
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [checklists, setChecklists] = useState([]);
  const [selectedChecklistId, setSelectedChecklistId] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({}); // { [itemId]: { response_status, auditor_comments, evidence_notes } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch active and planned audit plans
  useEffect(() => {
    const fetchPlansAndChecklists = async () => {
      try {
        const [resP, resC] = await Promise.all([
          fetch(`${API}/plans`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/checklists`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const jsonP = await resP.json();
        const jsonC = await resC.json();

        if (jsonP.success && jsonP.data.length > 0) {
          setPlans(jsonP.data);
          const active = jsonP.data.find(p => p.status === 'ACTIVE') || jsonP.data[0];
          setSelectedPlanId(active.id.toString());
        }
        if (jsonC.success && jsonC.data.length > 0) {
          setChecklists(jsonC.data);
          setSelectedChecklistId(jsonC.data[0].id.toString());
        }
      } catch (e) {
        setError('Failed to load audit plans or checklists');
      }
    };
    fetchPlansAndChecklists();
  }, [token]);

  // Load questions when selectedChecklistId changes
  useEffect(() => {
    if (!selectedChecklistId) return;
    const loadQuestions = async () => {
      try {
        const res = await fetch(`${API}/checklists/${selectedChecklistId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data.items) {
          setQuestions(json.data.items.filter(i => i.is_active));
          // Pre-populate responses map
          const initial = {};
          json.data.items.forEach(i => {
            initial[i.id] = {
              checklist_item_id: i.id,
              response_status: 'PENDING',
              auditor_comments: '',
              evidence_notes: ''
            };
          });
          setResponses(initial);
        }
      } catch (e) {
        console.error('Failed to load checklist questions', e);
      }
    };
    loadQuestions();
  }, [selectedChecklistId, token]);

  const handleStartSession = async () => {
    if (!selectedPlanId || !selectedChecklistId) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API}/plans/${selectedPlanId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          checklist_id: parseInt(selectedChecklistId),
          auditee_representative: 'Department Operations Lead',
          summary: 'Audit evaluation in progress'
        })
      });
      const json = await res.json();
      if (json.success) {
        setActiveSession(json.data);
        setSuccess(`Audit session ${json.data.audit_number} initialized!`);
      } else {
        setError(json.message || 'Failed to start audit session');
      }
    } catch (e) {
      setError('Error initiating audit session');
    } finally {
      setLoading(false);
    }
  };

  const updateResponse = (itemId, field, value) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { checklist_item_id: itemId, response_status: 'PENDING' }),
        [field]: value
      }
    }));
  };

  const handleSaveResponses = async () => {
    if (!activeSession) {
      alert('Please start or select an active audit session first.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        responses: Object.values(responses)
      };
      const res = await fetch(`${API}/records/${activeSession.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setActiveSession(json.data);
        setSuccess(`Checklist responses saved! Compliance Score: ${json.data.compliance_score_pct}%`);
      } else {
        setError(json.message || 'Failed to save responses');
      }
    } catch (e) {
      setError('Error saving responses');
    } finally {
      setLoading(false);
    }
  };

  // Live Score Calculator
  const responseArray = Object.values(responses);
  const totalItems = responseArray.length;
  const passedItems = responseArray.filter(r => r.response_status === 'PASS').length;
  const failedItems = responseArray.filter(r => r.response_status === 'FAIL').length;
  const naItems = responseArray.filter(r => r.response_status === 'NOT_APPLICABLE').length;
  const scorable = totalItems - naItems;
  const liveScore = scorable > 0 ? Math.round((passedItems / scorable) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Play className="h-6 w-6 text-amber-600" />
            Conduct Active Audit &amp; Record Responses
          </h1>
          <p className="text-sm text-slate-500">
            Evaluate live checklist criteria, record PASS/FAIL dispositions, and calculate real-time compliance score
          </p>
        </div>
        {activeSession && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveResponses}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-sm"
            >
              <Save className="h-4 w-4" />
              Save Responses
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
          {success}
        </div>
      )}

      {/* Audit Setup Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Audit Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              disabled={Boolean(activeSession)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.plan_number} - {p.title} ({p.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Checklist Template</label>
            <select
              value={selectedChecklistId}
              onChange={(e) => setSelectedChecklistId(e.target.value)}
              disabled={Boolean(activeSession)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {checklists.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.template_code} - {c.template_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            {!activeSession ? (
              <button
                onClick={handleStartSession}
                disabled={loading || !selectedPlanId}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Audit Execution Session
              </button>
            ) : (
              <div className="w-full bg-slate-100 p-2 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Active Audit Session</span>
                <span className="font-mono text-xs font-bold text-blue-700">{activeSession.audit_number}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Compliance Score Gauge */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase">Live Compliance Score</div>
          <div className={`text-2xl font-black font-mono mt-1 ${liveScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {liveScore}%
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase">Passed Criteria</div>
          <div className="text-2xl font-black font-mono text-emerald-600 mt-1">{passedItems}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase">Failed Non-Conformances</div>
          <div className="text-2xl font-black font-mono text-rose-600 mt-1">{failedItems}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase">Pending Review</div>
          <div className="text-2xl font-black font-mono text-slate-500 mt-1">
            {responseArray.filter(r => r.response_status === 'PENDING').length}
          </div>
        </div>
      </div>

      {/* Checklist Evaluation Questions */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
            Select a checklist template above to load evaluation criteria.
          </div>
        ) : (
          questions.map((q, idx) => {
            const resp = responses[q.id] || { response_status: 'PENDING', auditor_comments: '', evidence_notes: '' };
            return (
              <div
                key={q.id}
                className={`bg-white p-5 rounded-2xl border transition space-y-3 ${
                  resp.response_status === 'FAIL'
                    ? 'border-rose-300 bg-rose-50/20'
                    : resp.response_status === 'PASS'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600">#{idx + 1}</span>
                    <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {q.item_code}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        q.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : q.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {q.severity}
                    </span>
                    {q.requirement_standard && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold text-[10px] rounded">
                        {q.requirement_standard}
                      </span>
                    )}
                  </div>

                  {/* Disposition Radio Buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    {[
                      { status: 'PASS', label: 'Pass', color: 'bg-emerald-600 text-white' },
                      { status: 'FAIL', label: 'Fail', color: 'bg-rose-600 text-white' },
                      { status: 'NOT_APPLICABLE', label: 'N/A', color: 'bg-slate-700 text-white' },
                      { status: 'PENDING', label: 'Pending', color: 'bg-amber-500 text-slate-950 font-bold' }
                    ].map(opt => (
                      <button
                        key={opt.status}
                        type="button"
                        onClick={() => updateResponse(q.id, 'response_status', opt.status)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          resp.response_status === opt.status ? opt.color : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-sm font-semibold text-slate-800">{q.question}</div>
                {q.compliance_guidance && (
                  <p className="text-xs text-slate-500 italic">Guidance: {q.compliance_guidance}</p>
                )}

                {/* Comments & Evidence Notes Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Auditor Evaluation Comments</label>
                    <input
                      type="text"
                      value={resp.auditor_comments || ''}
                      onChange={(e) => updateResponse(q.id, 'auditor_comments', e.target.value)}
                      placeholder="e.g. Sample verified; parameters conform to specification."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Evidence / Batch Reference Notes</label>
                    <input
                      type="text"
                      value={resp.evidence_notes || ''}
                      onChange={(e) => updateResponse(q.id, 'evidence_notes', e.target.value)}
                      placeholder="e.g. GRN #2026-002, CoA verified."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* If FAIL, show Log Finding shortcut */}
                {resp.response_status === 'FAIL' && (
                  <div className="pt-2 flex justify-between items-center text-xs bg-rose-50/70 p-2.5 rounded-xl border border-rose-200/80">
                    <span className="text-rose-700 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" /> Non-conformance logged. Create formal finding to track root cause &amp; CAPA.
                    </span>
                    <button
                      onClick={() => setActivePage('audit-findings')}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition"
                    >
                      + Log Audit Finding
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
