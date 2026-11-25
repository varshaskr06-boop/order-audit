import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PackageCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Eye,
  X,
  Package,
  Layers,
  ShieldCheck,
  FileText
} from 'lucide-react';

export default function PackagingInspectionPage() {
  const { token, user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New Inspection Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: 2,
    supplier_name: 'Supreme Poly & Flexible Packagers',
    item_id: 2,
    item_name: 'Standup Zipper Pouch (500g)',
    item_code: 'PKG-POUCH-500G',
    batch_number: 'PKG-POUCH-2026-B02',
    received_quantity: 10000,
    inspected_quantity: 200,
    accepted_quantity: 10000,
    rejected_quantity: 0,
    uom: 'PCS',
    inspection_date: new Date().toISOString().split('T')[0],
    status: 'PASSED',
    remarks: 'Sealing test passed at 180°C. Label barcoding scanned 100% successfully.',
    results: [
      { parameter_name: 'Pouch Thickness', measured_numeric_value: 102, min_limit: 95, max_limit: 110, uom: 'Microns' },
      { parameter_name: 'Sealing Integrity / Leak Test', measured_text_value: 'Zero Leakage', acceptable_text_values: 'Zero Leakage,Pass' },
      { parameter_name: 'Barcode & Print Legibility', measured_text_value: 'High Contrast Clear', acceptable_text_values: 'High Contrast Clear,Legible' },
      { parameter_name: 'Dimension (W x H)', measured_text_value: '160x240mm', acceptable_text_values: '160x240mm' },
      { parameter_name: 'Bursting Strength', measured_numeric_value: 8.5, min_limit: 7.0, max_limit: 12.0, uom: 'kg/cm2' }
    ]
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchInspections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/quality/inspections?inspection_type=PACKAGING', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setInspections(json.data || []);
      } else {
        setError(json.error?.message || 'Failed to load packaging inspections');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching packaging inspections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const handleNumericParamChange = (index, val) => {
    const updated = [...formData.results];
    const num = parseFloat(val) || 0;
    updated[index].measured_numeric_value = num;
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
        inspection_type: 'PACKAGING',
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null,
        supplier_name: formData.supplier_name,
        item_id: formData.item_id ? Number(formData.item_id) : null,
        item_name: formData.item_name,
        item_code: formData.item_code,
        batch_number: formData.batch_number,
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
        setError(json.error?.message || 'Failed to record inspection');
      }
    } catch (err) {
      setError(err.message || 'Error submitting packaging inspection');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInspections = inspections.filter((ins) => {
    const matchesSearch =
      (ins.inspection_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ins.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ins.batch_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ins.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || ins.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canCreate = ['ADMIN', 'OWNER', 'PRODUCTION'].includes((user?.role || '').toUpperCase());

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md">
            <PackageCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Packaging Material QC Inspection</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Module 2 • Pouch Thickness, Leak Test, Bursting Strength, Seal Integrity & Barcode Audit
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
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition"
            >
              <PlusCircle className="h-4 w-4" />
              New Packaging QC
            </button>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by lot number, pouch, supplier or batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed / Rejected</option>
            <option value="PARTIALLY_ACCEPTED">Partially Accepted</option>
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
                <th className="py-3 px-4">QC Number</th>
                <th className="py-3 px-4">Packaging Material</th>
                <th className="py-3 px-4">Supplier & Batch</th>
                <th className="py-3 px-4 text-right">Received</th>
                <th className="py-3 px-4 text-right">Inspected</th>
                <th className="py-3 px-4 text-right">Accepted / Rejected</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Date & Inspector</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading packaging inspections...
                  </td>
                </tr>
              ) : filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    No packaging inspections found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredInspections.map((ins) => {
                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700">
                      {ins.status}
                    </span>
                  );
                  if (ins.status === 'PASSED') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 flex items-center gap-1 justify-center">
                        <CheckCircle2 className="h-3 w-3" /> PASSED
                      </span>
                    );
                  } else if (ins.status === 'FAILED') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 flex items-center gap-1 justify-center">
                        <XCircle className="h-3 w-3" /> FAILED
                      </span>
                    );
                  } else if (ins.status === 'PARTIALLY_ACCEPTED') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 flex items-center gap-1 justify-center">
                        <AlertTriangle className="h-3 w-3" /> PARTIAL
                      </span>
                    );
                  }

                  return (
                    <tr key={ins.inspection_id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-amber-600">
                        {ins.inspection_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-amber-600" />
                          <span>{ins.item_name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{ins.item_code}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{ins.supplier_name || 'Vendor N/A'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Batch: {ins.batch_number}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-700">
                        {Number(ins.received_quantity).toLocaleString()} {ins.uom}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600">
                        {Number(ins.inspected_quantity).toLocaleString()} {ins.uom}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        <span className="text-emerald-700 font-bold">{Number(ins.accepted_quantity).toLocaleString()}</span>
                        {Number(ins.rejected_quantity) > 0 && (
                          <span className="text-rose-600 font-bold ml-1">/ -{Number(ins.rejected_quantity).toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">{statusBadge}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="text-slate-800">{ins.inspection_date?.split('T')[0]}</div>
                        <div className="text-[10px] text-slate-400">{ins.inspector_name || 'Inspector'}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedInspection(ins)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="View Test Parameters & Audit"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Packaging QC Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-sm">Record Packaging QC Inspection</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Packaging Material Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Material SKU / Code</label>
                  <input
                    type="text"
                    value={formData.item_code}
                    onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Packaging Vendor / Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Packaging Batch / Reel No *</label>
                  <input
                    type="text"
                    required
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Received Qty</label>
                  <input
                    type="number"
                    value={formData.received_quantity}
                    onChange={(e) => setFormData({ ...formData, received_quantity: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Sample Tested</label>
                  <input
                    type="number"
                    value={formData.inspected_quantity}
                    onChange={(e) => setFormData({ ...formData, inspected_quantity: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-emerald-700 font-semibold mb-1">Accepted Qty</label>
                  <input
                    type="number"
                    value={formData.accepted_quantity}
                    onChange={(e) => setFormData({ ...formData, accepted_quantity: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-md text-xs font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-rose-700 font-semibold mb-1">Rejected Qty</label>
                  <input
                    type="number"
                    value={formData.rejected_quantity}
                    onChange={(e) => setFormData({ ...formData, rejected_quantity: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-rose-300 rounded-md text-xs font-bold text-rose-700"
                  />
                </div>
              </div>

              {/* Test Parameters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    Packaging Parameter Quality Checks
                  </h4>
                  <span className="text-[10px] text-slate-500">Auto-validates tolerance limits</span>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  {formData.results.map((param, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800">{param.parameter_name}</div>
                        <div className="text-[10px] text-slate-500">
                          {param.min_limit !== undefined
                            ? `Spec Range: ${param.min_limit} - ${param.max_limit} ${param.uom || ''}`
                            : `Acceptable: ${param.acceptable_text_values}`}
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

              {/* Status and Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Final Inspection Verdict *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold"
                  >
                    <option value="PASSED">PASSED (Release for Packing)</option>
                    <option value="FAILED">FAILED (Lock & Quarantine Batch)</option>
                    <option value="PARTIALLY_ACCEPTED">PARTIALLY ACCEPTED</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Inspection Date</label>
                  <input
                    type="date"
                    value={formData.inspection_date}
                    onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">QC Remarks / Sealing Audit Notes</label>
                <textarea
                  rows="2"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md shadow-amber-600/20 transition flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                  Save Inspection & Update Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-sm">{selectedInspection.inspection_number} - Audit Details</h3>
              </div>
              <button onClick={() => setSelectedInspection(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-400">Packaging Material</div>
                  <div className="font-bold text-slate-800">{selectedInspection.item_name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Batch Number</div>
                  <div className="font-mono font-bold text-amber-600">{selectedInspection.batch_number}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Supplier</div>
                  <div className="font-semibold text-slate-800">{selectedInspection.supplier_name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Verdict</div>
                  <div className="font-bold text-emerald-700">{selectedInspection.status}</div>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 mb-2">Parameter Measurements:</h5>
                <div className="space-y-1.5 border border-slate-200 rounded-lg p-2.5">
                  {(selectedInspection.results || []).length === 0 ? (
                    <div className="text-slate-400 italic">No parameter checks recorded</div>
                  ) : (
                    selectedInspection.results.map((r, i) => (
                      <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                        <span className="font-medium text-slate-700">{r.parameter_name}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {r.measured_numeric_value !== null ? `${r.measured_numeric_value} ${r.uom || ''}` : r.measured_text_value}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {selectedInspection.remarks && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900">
                  <div className="text-[10px] font-bold uppercase text-amber-700">Auditor Notes</div>
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
