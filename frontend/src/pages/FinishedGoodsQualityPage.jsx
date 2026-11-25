import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Eye,
  X,
  Truck,
  Lock,
  Unlock,
  Check,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';

export default function FinishedGoodsQualityPage() {
  const { token, user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dispatch Release Status Checker
  const [checkBatchNumber, setCheckBatchNumber] = useState('');
  const [checkingRelease, setCheckingRelease] = useState(false);
  const [releaseStatusResult, setReleaseStatusResult] = useState(null);

  // New Inspection Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [formData, setFormData] = useState({
    item_id: 1,
    item_name: 'Traditional Idli Podi (200g)',
    item_code: 'FG-IDL-200G',
    batch_number: 'PRD-IDL-2026-B01',
    production_order_number: 'PO-2026-0001',
    received_quantity: 2000,
    inspected_quantity: 50,
    accepted_quantity: 2000,
    rejected_quantity: 0,
    uom: 'PKT',
    inspection_date: new Date().toISOString().split('T')[0],
    status: 'PASSED',
    remarks: 'Sensory profile authentic. FSSAI microbial criteria cleared. Net weight exceeds 202g average.',
    results: [
      { parameter_name: 'Net Weight Compliance', measured_numeric_value: 203.5, min_limit: 200.0, max_limit: 208.0, uom: 'g' },
      { parameter_name: 'Moisture Content', measured_numeric_value: 4.8, min_limit: 3.5, max_limit: 6.5, uom: '%' },
      { parameter_name: 'Total Ash Content', measured_numeric_value: 6.2, min_limit: 5.0, max_limit: 8.0, uom: '%' },
      { parameter_name: 'Sensory Profile & Pungency', measured_text_value: 'Authentic Traditional Taste', acceptable_text_values: 'Authentic Traditional Taste,Balanced' },
      { parameter_name: 'FSSAI Microbial Clearance', measured_text_value: 'CLEARED - NIL CONTAMINATION', acceptable_text_values: 'CLEARED - NIL CONTAMINATION,PASS' },
      { parameter_name: 'Pouch Nitrogen Flush & Seal', measured_text_value: 'Zero Micro-leak Airtight', acceptable_text_values: 'Zero Micro-leak Airtight,Pass' }
    ]
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchInspections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/quality/inspections?inspection_type=FINISHED_GOODS', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setInspections(json.data || []);
      } else {
        setError(json.error?.message || 'Failed to fetch finished goods inspections');
      }
    } catch (err) {
      setError(err.message || 'Error fetching finished goods inspections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const handleCheckRelease = async (e) => {
    e.preventDefault();
    if (!checkBatchNumber.trim()) return;
    setCheckingRelease(true);
    setReleaseStatusResult(null);
    try {
      const res = await fetch(`/api/quality/batches/${encodeURIComponent(checkBatchNumber.trim())}/release-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setReleaseStatusResult(json.data);
      } else {
        setReleaseStatusResult({
          batch_number: checkBatchNumber,
          can_dispatch: false,
          reason: json.error?.message || 'Batch not found or not cleared by QC'
        });
      }
    } catch (err) {
      setReleaseStatusResult({
        batch_number: checkBatchNumber,
        can_dispatch: false,
        reason: 'Network error checking batch status'
      });
    } finally {
      setCheckingRelease(false);
    }
  };

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
        inspection_type: 'FINISHED_GOODS',
        item_id: formData.item_id ? Number(formData.item_id) : null,
        item_name: formData.item_name,
        item_code: formData.item_code,
        batch_number: formData.batch_number,
        production_order_number: formData.production_order_number,
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
        fetchInspections();
      } else {
        setError(json.error?.message || 'Failed to submit finished goods inspection');
      }
    } catch (err) {
      setError(err.message || 'Network error submitting finished goods QC');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = inspections.filter((ins) => {
    const matchesSearch =
      (ins.inspection_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ins.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ins.batch_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || ins.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canCreate = ['ADMIN', 'OWNER', 'PRODUCTION'].includes((user?.role || '').toUpperCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Finished Goods QC & Dispatch Release</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Module 5 • FSSAI Sensory, Moisture, Net Weight Audit & Batch Dispatch Clearance Lock
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchInspections}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
            >
              <PlusCircle className="h-4 w-4" />
              New Finished Goods QC
            </button>
          )}
        </div>
      </div>

      {/* Dispatch Release Verification Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Sales & Logistics Dispatch Gate Verification</h3>
              <p className="text-[11px] text-slate-400">
                Check whether a manufactured batch is released by QC before creating Sales Invoices or loading trucks.
              </p>
            </div>
          </div>

          <form onSubmit={handleCheckRelease} className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Enter FG Batch (e.g. PRD-IDL-2026-B01)"
              value={checkBatchNumber}
              onChange={(e) => setCheckBatchNumber(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-950/80 border border-slate-700 rounded-xl text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-64"
            />
            <button
              type="submit"
              disabled={checkingRelease}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shrink-0 flex items-center gap-1.5"
            >
              {checkingRelease ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              Verify Status
            </button>
          </form>
        </div>

        {releaseStatusResult && (
          <div className="mt-4 pt-4 border-t border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Batch:</span>
              <span className="font-mono font-bold text-amber-400">{releaseStatusResult.batch_number}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-slate-200">{releaseStatusResult.batch_status || 'UNKNOWN'}</span>
            </div>

            <div className="flex items-center gap-2">
              {releaseStatusResult.can_dispatch ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold text-xs">
                  <Unlock className="h-3.5 w-3.5" />
                  <span>QC PASSED — CLEARED FOR DISPATCH</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-lg font-bold text-xs">
                  <Lock className="h-3.5 w-3.5" />
                  <span>LOCKED — {releaseStatusResult.reason || 'DISPATCH PROHIBITED'}</span>
                </div>
              )}
            </div>
          </div>
        )}
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
            placeholder="Search by QC certificate, product, or batch number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium"
          >
            <option value="ALL">All Clearances</option>
            <option value="PASSED">Passed (Released)</option>
            <option value="FAILED">Failed (Quarantined)</option>
            <option value="PARTIALLY_ACCEPTED">Partially Cleared</option>
            <option value="UNDER_REVIEW">Under Review</option>
          </select>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">QC Release No</th>
                <th className="py-3 px-4">Finished Product</th>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4 text-right">Pack Size</th>
                <th className="py-3 px-4 text-right">Accepted / Released</th>
                <th className="py-3 px-4 text-center">Dispatch Status</th>
                <th className="py-3 px-4 text-center">Date & Signoff</th>
                <th className="py-3 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Loading finished goods inspections...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No finished goods inspections found.
                  </td>
                </tr>
              ) : (
                filtered.map((ins) => (
                  <tr key={ins.inspection_id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {ins.inspection_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{ins.item_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{ins.item_code}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {ins.batch_number}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-700">
                      {Number(ins.received_quantity).toLocaleString()} {ins.uom}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      <span className="text-emerald-700 font-bold">{Number(ins.accepted_quantity).toLocaleString()}</span>
                      {Number(ins.rejected_quantity) > 0 && (
                        <span className="text-rose-600 font-bold ml-1">/ -{Number(ins.rejected_quantity).toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {ins.status === 'PASSED' ? (
                        <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1 mx-auto w-fit">
                          <CheckCircle2 className="h-3 w-3" /> RELEASED
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 flex items-center justify-center gap-1 mx-auto w-fit">
                          <Lock className="h-3 w-3" /> {ins.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="text-slate-800">{ins.inspection_date?.split('T')[0]}</div>
                      <div className="text-[10px] text-slate-400">{ins.inspector_name || 'QC Manager'}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedInspection(ins)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
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

      {/* New FG Inspection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Issue Finished Goods Quality Clearance Certificate</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Finished Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Product SKU</label>
                  <input
                    type="text"
                    value={formData.item_code}
                    onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Finished Goods Batch No *</label>
                  <input
                    type="text"
                    required
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Production Run Ref</label>
                  <input
                    type="text"
                    value={formData.production_order_number}
                    onChange={(e) => setFormData({ ...formData, production_order_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Batch Output</label>
                  <input
                    type="number"
                    value={formData.received_quantity}
                    onChange={(e) => setFormData({ ...formData, received_quantity: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Sample Packs</label>
                  <input
                    type="number"
                    value={formData.inspected_quantity}
                    onChange={(e) => setFormData({ ...formData, inspected_quantity: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-emerald-700 font-semibold mb-1">Passed Packs</label>
                  <input
                    type="number"
                    value={formData.accepted_quantity}
                    onChange={(e) => setFormData({ ...formData, accepted_quantity: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded text-xs font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-rose-700 font-semibold mb-1">Rejected Packs</label>
                  <input
                    type="number"
                    value={formData.rejected_quantity}
                    onChange={(e) => setFormData({ ...formData, rejected_quantity: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-rose-300 rounded text-xs font-bold text-rose-700"
                  />
                </div>
              </div>

              {/* Parameter Checks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Finished Product Analytical & Sensory Specifications
                  </h4>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  {formData.results.map((param, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800">{param.parameter_name}</div>
                        <div className="text-[10px] text-slate-500">
                          {param.min_limit !== undefined
                            ? `Spec: ${param.min_limit} - ${param.max_limit} ${param.uom || ''}`
                            : `Expected: ${param.acceptable_text_values}`}
                        </div>
                      </div>

                      <div className="w-full sm:w-56">
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

              {/* Verdict */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Dispatch Release Verdict *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800"
                  >
                    <option value="PASSED">PASSED (Release Batch for Sales & Dispatch)</option>
                    <option value="FAILED">FAILED (Lock Batch / Prohibit Dispatch)</option>
                    <option value="PARTIALLY_ACCEPTED">PARTIALLY ACCEPTED</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW (Quarantined)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Inspection Signoff Date</label>
                  <input
                    type="date"
                    value={formData.inspection_date}
                    onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Quality Release Certificate Notes</label>
                <textarea
                  rows="2"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                  Signoff & Update Batch Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View */}
      {selectedInspection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-sm">{selectedInspection.inspection_number} - Release Certificate</h3>
              </div>
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
                  <div className="font-mono font-bold text-emerald-700">{selectedInspection.batch_number}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Cleared Quantity</div>
                  <div className="font-bold text-slate-800">
                    {Number(selectedInspection.accepted_quantity).toLocaleString()} {selectedInspection.uom}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Release Verdict</div>
                  <div className="font-bold text-emerald-700">{selectedInspection.status}</div>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 mb-2">Quality & Analytical Test Values:</h5>
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
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-emerald-900">
                  <div className="text-[10px] font-bold uppercase text-emerald-700">Audit Notes</div>
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
