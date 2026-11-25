import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare, PlusCircle, Search, RefreshCw, Eye, Edit,
  ShieldCheck, AlertTriangle, X, Check, FileText
} from 'lucide-react';

const API = '/api/audit';

export default function ChecklistTemplatesPage() {
  const { token, user } = useAuth();
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected template & question modal
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [addQuestionModalOpen, setAddQuestionModalOpen] = useState(false);
  const [createTemplateModalOpen, setCreateTemplateModalOpen] = useState(false);

  // New question form
  const [questionForm, setQuestionForm] = useState({
    question: '',
    requirement_standard: '',
    compliance_guidance: '',
    severity: 'MEDIUM'
  });

  // New template form
  const [templateForm, setTemplateForm] = useState({
    template_name: '',
    category: 'QUALITY_AUDIT',
    department: 'QUALITY',
    description: '',
    version: '1.0'
  });

  const role = (user?.role || '').toUpperCase();
  const canManage = ['ADMIN', 'OWNER'].includes(role);

  const fetchChecklists = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/checklists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setChecklists(json.data || []);
      else setError(json.message || 'Failed to load checklists');
    } catch (e) {
      setError('Network error fetching checklist templates');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);

  const openTemplateDetails = async (id) => {
    try {
      const res = await fetch(`${API}/checklists/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setSelectedTemplate(json.data);
        setViewModalOpen(true);
      }
    } catch (e) {
      alert('Failed to load template questions');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    try {
      const res = await fetch(`${API}/checklists/${selectedTemplate.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(questionForm)
      });
      const json = await res.json();
      if (json.success) {
        setSuccess('Checklist question added successfully!');
        setAddQuestionModalOpen(false);
        setQuestionForm({ question: '', requirement_standard: '', compliance_guidance: '', severity: 'MEDIUM' });
        openTemplateDetails(selectedTemplate.id);
        fetchChecklists();
      } else {
        setError(json.message || 'Failed to add checklist item');
      }
    } catch (e) {
      setError('Error adding question item');
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/checklists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(templateForm)
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Checklist template ${json.data.template_code} created!`);
        setCreateTemplateModalOpen(false);
        fetchChecklists();
      } else {
        setError(json.message || 'Failed to create checklist template');
      }
    } catch (e) {
      setError('Error creating template');
    }
  };

  const toggleItemActive = async (itemId, currentStatus) => {
    try {
      const res = await fetch(`${API}/checklists/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      const json = await res.json();
      if (json.success && selectedTemplate) {
        openTemplateDetails(selectedTemplate.id);
      }
    } catch (e) {
      alert('Failed to update question status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-amber-600" />
            Configurable Audit Checklist Templates
          </h1>
          <p className="text-sm text-slate-500">
            Pre-seeded and custom compliance question banks with statutory FSSAI, GST, and ISO references
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchChecklists}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canManage && (
            <button
              onClick={() => setCreateTemplateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl transition shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              New Template
            </button>
          )}
        </div>
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

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {checklists.map((chk) => (
          <div
            key={chk.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-1">
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {chk.template_code}
                </span>
                <span className="text-[10px] font-mono text-slate-400">v{chk.version}</span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm leading-snug mt-1">{chk.template_name}</h3>
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{chk.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Dept: <strong className="text-slate-700">{chk.department}</strong></span>
                <span className="font-semibold text-slate-700">{chk.items_count || 0} Criteria / Questions</span>
              </div>
              <button
                onClick={() => openTemplateDetails(chk.id)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" />
                Manage Questions &amp; Standards
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Template Questions Modal */}
      {viewModalOpen && selectedTemplate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {selectedTemplate.template_code}
                </span>
                <h3 className="font-bold text-slate-800 text-lg mt-1">{selectedTemplate.template_name}</h3>
                <p className="text-xs text-slate-500">{selectedTemplate.description}</p>
              </div>
              <button onClick={() => setViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Questions Header with Add Button */}
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-bold text-slate-700 uppercase">
                Checklist Criteria ({selectedTemplate.items?.length || 0})
              </span>
              {canManage && (
                <button
                  onClick={() => setAddQuestionModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Add Question
                </button>
              )}
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              {selectedTemplate.items && selectedTemplate.items.length > 0 ? (
                selectedTemplate.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition ${
                      item.is_active ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-100/50 border-slate-200/50 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] font-bold text-slate-600">
                            #{idx + 1} {item.item_code}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              item.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800'
                                : item.severity === 'HIGH'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.severity}
                          </span>
                          {item.requirement_standard && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                              {item.requirement_standard}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-800">{item.question}</p>
                        {item.compliance_guidance && (
                          <p className="text-[11px] text-slate-500 mt-1 italic">
                            Guidance: {item.compliance_guidance}
                          </p>
                        )}
                      </div>

                      {canManage && (
                        <button
                          onClick={() => toggleItemActive(item.id, item.is_active)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border transition ${
                            item.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          {item.is_active ? 'Active' : 'Disabled'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No questions added to this checklist template yet.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {addQuestionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 text-base">Add New Checklist Question</h3>
              <button onClick={() => setAddQuestionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Question / Audit Check Criteria *</label>
                <textarea
                  required
                  rows={3}
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                  placeholder="e.g. Are cold room temperature logs digitally synced without gaps?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Requirement / Standard Reference</label>
                <input
                  type="text"
                  value={questionForm.requirement_standard}
                  onChange={(e) => setQuestionForm({ ...questionForm, requirement_standard: e.target.value })}
                  placeholder="e.g. FSSAI Act 2006, GST Rule 46, ISO 22000 Section 8.4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Compliance &amp; Verification Guidance</label>
                <input
                  type="text"
                  value={questionForm.compliance_guidance}
                  onChange={(e) => setQuestionForm({ ...questionForm, compliance_guidance: e.target.value })}
                  placeholder="Auditor guidance on how to evaluate evidence..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Severity / Non-Conformance Impact</label>
                <select
                  value={questionForm.severity}
                  onChange={(e) => setQuestionForm({ ...questionForm, severity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk</option>
                  <option value="CRITICAL">Critical Non-Conformance</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddQuestionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm"
                >
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {createTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 text-base">Create Checklist Template</h3>
              <button onClick={() => setCreateTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  value={templateForm.template_name}
                  onChange={(e) => setTemplateForm({ ...templateForm, template_name: e.target.value })}
                  placeholder="e.g. Water Treatment & RO Filter Quality Audit"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Department</label>
                  <select
                    value={templateForm.department}
                    onChange={(e) => setTemplateForm({ ...templateForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="QUALITY">Quality Control</option>
                    <option value="PRODUCTION">Production</option>
                    <option value="PURCHASE">Procurement</option>
                    <option value="INVENTORY">Inventory</option>
                    <option value="SALES">Sales</option>
                    <option value="GST_INVOICING">GST Invoicing</option>
                    <option value="DISPATCH">Dispatch</option>
                    <option value="PAYMENTS">Finance</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Category</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="QUALITY_AUDIT">Quality Audit</option>
                    <option value="PRODUCTION_AUDIT">Production Audit</option>
                    <option value="PURCHASE_AUDIT">Purchase Audit</option>
                    <option value="INVENTORY_AUDIT">Inventory Audit</option>
                    <option value="SALES_AUDIT">Sales Audit</option>
                    <option value="GST_INVOICE_AUDIT">GST Audit</option>
                    <option value="PAYMENT_AUDIT">Payment Audit</option>
                    <option value="GENERAL_INTERNAL_AUDIT">General Audit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Purpose and regulatory scope of this checklist..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateTemplateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
