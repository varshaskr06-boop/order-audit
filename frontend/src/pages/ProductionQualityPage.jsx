import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Factory,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Eye,
  X,
  PlaySquare,
  Thermometer,
  Layers,
  FileCheck2,
  ShieldCheck
} from 'lucide-react';

export default function ProductionQualityPage() {
  const { token, user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [productionOrders, setProductionOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stageFilter, setStageFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Inspection Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [formData, setFormData] = useState({
    production_order_id: '',
    production_order_number: 'PO-2026-0001',
    item_id: 1,
    item_name: 'Traditional Idli Podi (200g)',
    item_code: 'FG-IDL-200G',
    batch_number: 'PRD-IDL-2026-B01',
    production_stage: 'IN_PROCESS', // INCOMING, IN_PROCESS, FINAL
    received_quantity: 400,
    inspected_quantity: 10,
    accepted_quantity: 400,
    rejected_quantity: 0,
    uom: 'KG',
    inspection_date: new Date().toISOString().split('T')[0],
    status: 'PASSED',
    remarks: 'Roasting temperature held at 145°C. Mesh sieving clean without clumps.',
    results: [
      { parameter_name: 'Roasting Temperature', measured_numeric_value: 145, min_limit: 140, max_limit: 155, uom: '°C' },
      { parameter_name: 'Particle Mesh Size', measured_numeric_value: 60, min_limit: 50, max_limit: 80, uom: 'Mesh' },
      { parameter_name: 'Moisture Post-Grind', measured_numeric_value: 4.2, min_limit: 3.0, max_limit: 6.0, uom: '%' },
      { parameter_name: 'Sensory / Aroma Profile', measured_text_value: 'Typical Roasted Aroma', acceptable_text_values: 'Typical Roasted Aroma,Aromatic' },
      { parameter_name: 'Metal Detector Clearance', measured_text_value: 'PASSED', acceptable_text_values: 'PASSED,CLEARED' }
    ]
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [inspRes, ordersRes] = await Promise.all([
        fetch('/api/quality/inspections?inspection_type=IN_PROCESS', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/production/orders', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ json: () => ({ success: false }) }))
      ]);

      const inspData = await inspRes.json();
      if (inspData.success) {
        setInspections(inspData.data || []);
      } else {
        setError(inspData.error?.message || 'Failed to fetch in-process inspections');
      }

      try {
        const ordData = await ordersRes.json();
        if (ordData.success && Array.isArray(ordData.data)) {
          setProductionOrders(ordData.data);
        }
      } catch (e) {
        // Fallback production orders
      }
    } catch (err) {
      setError(err.message || 'Error fetching production quality records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNumericParamChange = (index, val) => {
    const updated = [...formData.results];
    updated[index].measured_numeric_value = parseFloat(val) || 0;
    setFormData({ ...formData, results: updated });
  };

  const handleTextParamChange = (index, val) => {
    const updated = [...formData.results];
    updated[index].measured_text_value = val;
    setFormData({ ...formData, results: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        inspection_type: 'IN_PROCESS',
        production_order_id: formData.production_order_id ? Number(formData.production_order_id) : null,
        production_order_number: formData.production_order_number,
        item_id: formData.item_id ? Number(formData.item_id) : null,
        item_name: formData.item_name,
        item_code: formData.item_code,
        batch_number: formData.batch_number,
        production_stage: formData.production_stage,
        received_quantity: Number(formData.received_quantity),
        inspected_quantity: Number(formData.inspected_quantity),
        accepted_quantity: Number(formData.accepted_quantity),
        rejected_quantity: Number(formData.rejected_quantity),
        uom: formData.uom,
        inspection_date: formData.inspection_date,
        status: formData.status,
        remarks: formData.remarks,
        results: formData.results
      };

      const res = await fetch('/api/quality/inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchData();
      } else {
        setError(json.error?.message || 'Failed to submit in-process inspection');
      }
    } catch (err) {
      setError(err.message || 'Network error submitting production QC');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = inspections.filter((ins) => {
    const matchesSearch =
      (ins.inspection_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ins.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ins.batch_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ins.production_order_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'ALL' || ins.production_stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const canCreate = ['ADMIN', 'OWNER', 'PRODUCTION'].includes((user?.role || '').toUpperCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-md">
            <Factory className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">In-Process Production Quality</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Module 4 • Temperature, Grinding Granularity, Moisture & In-Line Food Safety Checks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 transition"
            >
              <PlusCircle className="h-4 w-4" />
              New In-Process QC Check
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by QC number, product, batch or production order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-700 font-medium"
          >
            <option value="ALL">All Production Stages</option>
            <option value="INCOMING">Incoming Premix</option>
            <option value="IN_PROCESS">In-Process Roasting & Grinding</option>
            <option value="FINAL">Pre-Packaging Blend</option>
          </select>
        </div>
      </div>

      {/* In-Process Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">QC Check ID</th>
                <th className="py-3 px-4">Product & Production Order</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4 text-right">Inspected Lot</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Date & Inspector</th>
                <th className="py-3 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-cyan-500" />
                    Loading in-process quality records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No in-process inspection records found.
                  </td>
                </tr>
              ) : (
                filtered.map((ins) => (
                  <tr key={ins.inspection_id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-700">
                      {ins.inspection_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{ins.item_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        PO: {ins.production_order_number || 'Internal Batch'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                        {ins.production_stage || 'IN_PROCESS'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800 font-medium">
                      {ins.batch_number}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-700">
                      {Number(ins.inspected_quantity).toLocaleString()} / {Number(ins.received_quantity).toLocaleString()} {ins.uom}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {ins.status === 'PASSED' ? (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> PASSED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 flex items-center justify-center gap-1">
                          <XCircle className="h-3 w-3" /> {ins.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="text-slate-800">{ins.inspection_date?.split('T')[0]}</div>
                      <div className="text-[10px] text-slate-400">{ins.inspector_name || 'QC Lead'}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedInspection(ins)}
                        className="p-1.5 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Inspection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold text-sm">Log In-Process Quality Inspection</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Production Order Reference</label>
                  <input
                    type="text"
                    value={formData.production_order_number}
                    onChange={(e) => setFormData({ ...formData, production_order_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 font-mono"
                    placeholder="e.g. PO-2026-0001"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Production Stage *</label>
                  <select
                    value={formData.production_stage}
                    onChange={(e) => setFormData({ ...formData, production_stage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 font-bold"
                  >
                    <option value="INCOMING">INCOMING (Raw Ingredient Staging)</option>
                    <option value="IN_PROCESS">IN_PROCESS (Roasting / Milling / Mixing)</option>
                    <option value="FINAL">FINAL (Bulk Granulate Pre-Packaging)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Product Being Manufactured *</label>
                  <input
                    type="text"
                    required
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Production Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 font-mono"
                  />
                </div>
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Batch Size ({formData.uom})</label>
                  <input
                    type="number"
                    value={formData.received_quantity}
                    onChange={(e) => setFormData({ ...formData, received_quantity: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Sample Drawn ({formData.uom})</label>
                  <input
                    type="number"
                    value={formData.inspected_quantity}
                    onChange={(e) => setFormData({ ...formData, inspected_quantity: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-emerald-700 font-semibold mb-1">Approved Sub-batch</label>
                  <input
                    type="number"
                    value={formData.accepted_quantity}
                    onChange={(e) => setFormData({ ...formData, accepted_quantity: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-emerald-300 rounded text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* Parameters */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-cyan-600" />
                  In-Line Quality & Process Parameters
                </h4>
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  {formData.results.map((param, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800">{param.parameter_name}</div>
                        <div className="text-[10px] text-slate-500">
                          {param.min_limit !== undefined
                            ? `Acceptable: ${param.min_limit} - ${param.max_limit} ${param.uom || ''}`
                            : `Allowed: ${param.acceptable_text_values}`}
                        </div>
                      </div>

                      <div className="w-full sm:w-48">
                        {param.min_limit !== undefined ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={param.measured_numeric_value}
                              onChange={(e) => handleNumericParamChange(idx, e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-right"
                            />
                            <span className="text-[10px] text-slate-500">{param.uom}</span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={param.measured_text_value}
                            onChange={(e) => handleTextParamChange(idx, e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Process Inspection Verdict *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 font-bold"
                  >
                    <option value="PASSED">PASSED (Proceed to Next Stage)</option>
                    <option value="FAILED">FAILED (Halt Line & Quarantine)</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW (Re-check Sample)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Inspection Date</label>
                  <input
                    type="date"
                    value={formData.inspection_date}
                    onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Supervisor / QC Operator Notes</label>
                <textarea
                  rows="2"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-md shadow-cyan-600/20 flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                  Submit In-Process Check
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm">{selectedInspection.inspection_number} - Parameter Details</h3>
              <button onClick={() => setSelectedInspection(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-400">Product</div>
                  <div className="font-bold text-slate-800">{selectedInspection.item_name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Batch Number</div>
                  <div className="font-mono font-bold text-cyan-700">{selectedInspection.batch_number}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Stage</div>
                  <div className="font-semibold text-slate-800">{selectedInspection.production_stage}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Verdict</div>
                  <div className="font-bold text-emerald-700">{selectedInspection.status}</div>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 mb-2">Measured Process Values:</h5>
                <div className="space-y-1.5 border border-slate-200 rounded-lg p-2.5">
                  {(selectedInspection.results || []).map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                      <span className="font-medium text-slate-700">{r.parameter_name}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {r.measured_numeric_value !== null ? `${r.measured_numeric_value} ${r.uom || ''}` : r.measured_text_value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedInspection.remarks && (
                <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200 text-cyan-900">
                  <div className="text-[10px] font-bold uppercase text-cyan-700">Remarks</div>
                  <p className="mt-0.5">{selectedInspection.remarks}</p>
                </div>
              )}

              <div className="text-right pt-2">
                <button
                  onClick={() => setSelectedInspection(null)}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
