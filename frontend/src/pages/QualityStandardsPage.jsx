import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sliders,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  X,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function QualityStandardsPage() {
  const { token, user } = useAuth();
  const [standards, setStandards] = useState([]);
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Standard Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    standard_name: '',
    target_type: 'RAW_MATERIAL',
    target_id: 1,
    target_name: 'Ponni Boiled Rice',
    standard_version: 'v1.0',
    description: '',
    effective_date: new Date().toISOString().split('T')[0],
    parameters: [
      { parameter_name: 'Moisture Content', parameter_type: 'NUMERIC', uom: '%', min_value: 10, max_value: 14, target_value: 12, stage: 'INCOMING' },
      { parameter_name: 'Aroma / Odour', parameter_type: 'TEXT', uom: 'Descriptive', acceptable_text_values: 'Fresh,Clean,Normal', stage: 'INCOMING' }
    ]
  });
  const [submitting, setSubmitting] = useState(false);

  // Selected Standard Details Modal
  const [selectedStandard, setSelectedStandard] = useState(null);

  const fetchStandards = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/quality/standards';
      const params = new URLSearchParams();
      if (targetTypeFilter) params.append('target_type', targetTypeFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setStandards(json.data || []);
      else setError(json.error?.message || 'Failed to load standards');
    } catch (err) {
      setError(err.message || 'Network error fetching standards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandards();
  }, [token, targetTypeFilter]);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/quality/standards/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      const json = await res.json();
      if (json.success) fetchStandards();
    } catch (_) {}
  };

  const handleAddParam = () => {
    setFormData({
      ...formData,
      parameters: [
        ...formData.parameters,
        { parameter_name: '', parameter_type: 'NUMERIC', uom: '', min_value: '', max_value: '', target_value: '', stage: 'INCOMING' }
      ]
    });
  };

  const handleRemoveParam = (index) => {
    setFormData({
      ...formData,
      parameters: formData.parameters.filter((_, i) => i !== index)
    });
  };

  const handleCreateStandard = async (e) => {
    e.preventDefault();
    if (!formData.standard_name || formData.parameters.length === 0) {
      alert('Standard name and at least one parameter are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/quality/standards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchStandards();
      } else {
        alert(json.error?.message || 'Failed to create standard');
      }
    } catch (err) {
      alert(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = standards.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.standard_name.toLowerCase().includes(q) || s.standard_code.toLowerCase().includes(q) || s.target_name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
              ⚙️
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Quality Standards & Specifications
              </h1>
              <p className="text-xs text-slate-500">
                Module 3 — Configurable food safety, raw material, packaging, and finished product quality parameters
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStandards}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {['ADMIN', 'OWNER'].includes(user?.role?.toUpperCase()) && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              New Quality Standard
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search standard code, name, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="text-xs py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Material Types</option>
            <option value="RAW_MATERIAL">Raw Materials</option>
            <option value="PACKAGING">Packaging Materials</option>
            <option value="FINISHED_GOOD">Finished Products</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          {error}
        </div>
      )}

      {/* Standards List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Standard Code</th>
                <th className="py-3 px-4">Specification Name</th>
                <th className="py-3 px-4">Target Category</th>
                <th className="py-3 px-4">Associated Target</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Parameters Count</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length > 0 ? (
                filtered.map((std) => (
                  <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{std.standard_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{std.standard_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {std.target_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{std.target_name}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{std.standard_version}</td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">
                      {std.parameters?.length || 0} specs
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(std.id, std.is_active)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          std.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {std.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedStandard(std)}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" /> View Specs
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No quality standards found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Parameters Modal */}
      {selectedStandard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedStandard.standard_name}</h3>
                <p className="text-[11px] font-mono text-slate-500">{selectedStandard.standard_code} ({selectedStandard.standard_version})</p>
              </div>
              <button onClick={() => setSelectedStandard(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-slate-600">{selectedStandard.description || 'No detailed description provided.'}</p>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                    <th className="py-2.5 px-3">Parameter Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">UOM</th>
                    <th className="py-2.5 px-3">Min</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Max</th>
                    <th className="py-2.5 px-3">Acceptable Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedStandard.parameters?.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{p.parameter_name}</td>
                      <td className="py-2.5 px-3 font-mono text-[10px]">{p.parameter_type}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{p.uom || '—'}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{p.min_value ?? '—'}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600 font-bold">{p.target_value ?? '—'}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{p.max_value ?? '—'}</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600">{p.acceptable_text_values || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setSelectedStandard(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Standard Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-100 space-y-4 text-xs my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Define Quality Standard & Parameters</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStandard} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Standard Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.standard_name}
                    onChange={(e) => setFormData({ ...formData, standard_name: e.target.value })}
                    placeholder="e.g. Moisture & Granulation Spec"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category Target *</label>
                  <select
                    value={formData.target_type}
                    onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="RAW_MATERIAL">Raw Material</option>
                    <option value="PACKAGING">Packaging Material</option>
                    <option value="FINISHED_GOOD">Finished Product</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Associated Material / Product Name</label>
                  <input
                    type="text"
                    value={formData.target_name}
                    onChange={(e) => setFormData({ ...formData, target_name: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Dynamic Parameters List */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Inspection Parameters</h4>
                  <button
                    type="button"
                    onClick={handleAddParam}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Add Parameter
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {formData.parameters.map((param, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3">
                        <input
                          type="text"
                          required
                          placeholder="Parameter Name"
                          value={param.parameter_name}
                          onChange={(e) => {
                            const updated = [...formData.parameters];
                            updated[idx].parameter_name = e.target.value;
                            setFormData({ ...formData, parameters: updated });
                          }}
                          className="w-full p-1.5 border rounded text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={param.parameter_type}
                          onChange={(e) => {
                            const updated = [...formData.parameters];
                            updated[idx].parameter_type = e.target.value;
                            setFormData({ ...formData, parameters: updated });
                          }}
                          className="w-full p-1.5 border rounded text-xs"
                        >
                          <option value="NUMERIC">Numeric</option>
                          <option value="TEXT">Text</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="UOM (%, cP)"
                          value={param.uom}
                          onChange={(e) => {
                            const updated = [...formData.parameters];
                            updated[idx].uom = e.target.value;
                            setFormData({ ...formData, parameters: updated });
                          }}
                          className="w-full p-1.5 border rounded text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="any"
                          placeholder="Min"
                          value={param.min_value}
                          onChange={(e) => {
                            const updated = [...formData.parameters];
                            updated[idx].min_value = e.target.value;
                            setFormData({ ...formData, parameters: updated });
                          }}
                          className="w-full p-1.5 border rounded text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="any"
                          placeholder="Max"
                          value={param.max_value}
                          onChange={(e) => {
                            const updated = [...formData.parameters];
                            updated[idx].max_value = e.target.value;
                            setFormData({ ...formData, parameters: updated });
                          }}
                          className="w-full p-1.5 border rounded text-xs"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveParam(idx)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  {submitting ? 'Saving...' : 'Save Quality Standard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
