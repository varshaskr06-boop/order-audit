import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Eye,
  X,
  Wheat,
  ShieldCheck
} from 'lucide-react';

export default function RawMaterialInspectionPage() {
  const { token, user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [grns, setGrns] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Inspection Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState(null);
  const [formData, setFormData] = useState({
    grn_id: '',
    supplier_id: 1,
    supplier_name: 'Kaveri Delta Agro Millers',
    item_id: 1,
    item_name: 'Ponni Boiled Rice',
    item_code: 'RM-RICE-001',
    batch_number: 'RM-RICE-2026-B01',
    received_quantity: 500,
    inspected_quantity: 25,
    accepted_quantity: 500,
    rejected_quantity: 0,
    uom: 'KG',
    inspection_date: new Date().toISOString().split('T')[0],
    status: 'PASSED',
    remarks: 'Clear of stones and weevils. Moisture within 12%.',
    results: [
      { parameter_name: 'Colour & Appearance', measured_text_value: 'Clean White', acceptable_text_values: 'Clean White,Translucent' },
      { parameter_name: 'Moisture Content', measured_numeric_value: 11.4, min_limit: 10, max_limit: 14, uom: '%' },
      { parameter_name: 'Smell / Odour', measured_text_value: 'Fresh', acceptable_text_values: 'Fresh,Clean' },
      { parameter_name: 'Foreign Matter / Stones', measured_numeric_value: 0.1, min_limit: 0, max_limit: 0.5, uom: '%' }
    ]
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchInspections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/quality/inspections?inspection_type=RAW_MATERIAL', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setInspections(json.data || []);
      else setError(json.error?.message || 'Failed to load inspections');
    } catch (err) {
      setError(err.message || 'Network error fetching inspections');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [grnRes, stdRes] = await Promise.all([
        fetch('/api/purchase/grn', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/quality/standards?target_type=RAW_MATERIAL', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [grnJson, stdJson] = await Promise.all([grnRes.json(), stdRes.json()]);
      if (grnJson.success) setGrns(grnJson.data || []);
      if (stdJson.success) setStandards(stdJson.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchInspections();
    fetchMasterData();
  }, [token]);

  const handleSubmitInspection = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/quality/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          inspection_type: 'RAW_MATERIAL',
          stage: 'INCOMING'
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(
          json.data.status === 'PASSED'
            ? 'Raw material cleared and batch status set to PASS in Phase 6 inventory!'
            : 'Defective raw material rejected! Batch status set to REJECTED in inventory.'
        );
        setShowModal(false);
        fetchInspections();
      } else {
        alert(json.error?.message || 'Failed to submit inspection');
      }
    } catch (err) {
      alert(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
              🌾
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Raw Material Quality Inspection (GRN Clearance)
              </h1>
              <p className="text-xs text-slate-500">
                Module 1 — Inspect incoming grains, pulses & spices; enforce FSSAI food safety parameters
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInspections}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {['ADMIN', 'OWNER', 'PRODUCTION'].includes(user?.role?.toUpperCase()) && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              Perform RM Inspection
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Inspections Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Inspection #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Raw Material</th>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Received</th>
                <th className="py-3 px-4">Accepted</th>
                <th className="py-3 px-4">Rejected</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Inspector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {inspections.length > 0 ? (
                inspections.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">{ins.inspection_number}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{ins.inspection_date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{ins.item_name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">{ins.batch_number}</td>
                    <td className="py-3 px-4 text-slate-600">{ins.supplier_name || 'Agro Vendor'}</td>
                    <td className="py-3 px-4 font-mono">{ins.received_quantity} {ins.uom}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">{ins.accepted_quantity}</td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-600">{ins.rejected_quantity}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ins.status === 'PASSED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ins.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ins.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{ins.inspector_name || 'Inspector'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400">
                    No raw material inspections recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Perform RM Inspection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 space-y-4 text-xs my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Incoming Raw Material QC Clearance</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInspection} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Raw Material Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold text-purple-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Received Qty *</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={formData.received_quantity}
                    onChange={(e) => setFormData({ ...formData, received_quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Accepted Qty *</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={formData.accepted_quantity}
                    onChange={(e) => {
                      const acc = parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        accepted_quantity: acc,
                        rejected_quantity: Math.max(0, formData.received_quantity - acc),
                        status: acc === formData.received_quantity ? 'PASSED' : (acc === 0 ? 'FAILED' : 'PARTIALLY_ACCEPTED')
                      });
                    }}
                    className="w-full p-2 border rounded-lg font-mono font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rejected Qty</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.rejected_quantity}
                    onChange={(e) => setFormData({ ...formData, rejected_quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg font-mono font-bold text-rose-600"
                  />
                </div>
              </div>

              {/* Parameters Test Results */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">Quality Parameters Evaluated</h4>
                <div className="space-y-2">
                  {formData.results.map((r, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                      <div className="col-span-5 font-semibold text-slate-800">{r.parameter_name}</div>
                      <div className="col-span-4">
                        {r.measured_numeric_value !== undefined ? (
                          <input
                            type="number"
                            step="any"
                            placeholder={`Range: ${r.min_limit ?? ''} - ${r.max_limit ?? ''}`}
                            value={r.measured_numeric_value}
                            onChange={(e) => {
                              const updated = [...formData.results];
                              updated[idx].measured_numeric_value = parseFloat(e.target.value) || 0;
                              setFormData({ ...formData, results: updated });
                            }}
                            className="w-full p-1.5 border rounded text-xs font-mono font-bold text-amber-700"
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder="Reading (e.g. Fresh, Clean)"
                            value={r.measured_text_value}
                            onChange={(e) => {
                              const updated = [...formData.results];
                              updated[idx].measured_text_value = e.target.value;
                              setFormData({ ...formData, results: updated });
                            }}
                            className="w-full p-1.5 border rounded text-xs"
                          />
                        )}
                      </div>
                      <div className="col-span-3 text-[10px] text-slate-500 font-mono">
                        {r.uom ? `Tolerance in ${r.uom}` : 'Descriptive Spec'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inspection Decision *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2 border rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="PASSED">PASSED (Release into Usable Stock)</option>
                  <option value="FAILED">FAILED (Quarantine & Exclude from Stock)</option>
                  <option value="PARTIALLY_ACCEPTED">PARTIALLY_ACCEPTED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inspection Remarks & Lab Notes</label>
                <textarea
                  rows="2"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Organoleptic test cleared, moisture meter calibrated..."
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                >
                  {submitting ? 'Submitting...' : 'Submit Decision & Sync Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
