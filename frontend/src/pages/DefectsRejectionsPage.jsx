import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  XCircle,
  Search,
  Filter,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Truck,
  Factory,
  Layers,
  ArrowRight,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';

export default function DefectsRejectionsPage() {
  const { token, user } = useAuth();
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [originFilter, setOriginFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    defect_origin: 'SUPPLIER', // SUPPLIER, PRODUCTION, STORAGE
    defect_category: 'MOISTURE_EXCESS',
    severity: 'MAJOR', // CRITICAL, MAJOR, MINOR
    item_type: 'RAW_MATERIAL',
    item_id: 1,
    item_name: 'Ponni Boiled Rice',
    item_code: 'RM-RICE-001',
    batch_number: 'RM-RICE-2026-B02',
    supplier_name: 'Kaveri Delta Agro Millers',
    defective_quantity: 45,
    uom: 'KG',
    disposition_action: 'REJECT_RETURN_TO_VENDOR', // REJECT_RETURN_TO_VENDOR, SCRAP, REWORK, DOWNGRADE, ACCEPT_CONCESSION
    root_cause: 'Moisture reached 15.2% during transit due to torn tarpaulin in lorry.',
    corrective_action_required: true,
    defect_date: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDefects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/quality/defects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setDefects(json.data || []);
      } else {
        setError(json.error?.message || 'Failed to fetch defects');
      }
    } catch (err) {
      setError(err.message || 'Error fetching defects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/quality/defects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          defective_quantity: Number(formData.defective_quantity)
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchDefects();
      } else {
        setError(json.error?.message || 'Failed to record defect');
      }
    } catch (err) {
      setError(err.message || 'Network error recording defect');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDefects = defects.filter((d) => {
    const matchesSearch =
      (d.defect_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.batch_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.root_cause || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrigin = originFilter === 'ALL' || d.defect_origin === originFilter;
    const matchesCat = categoryFilter === 'ALL' || d.defect_category === categoryFilter;
    return matchesSearch && matchesOrigin && matchesCat;
  });

  const totalDefects = defects.length;
  const supplierDefects = defects.filter((d) => d.defect_origin === 'SUPPLIER').length;
  const productionDefects = defects.filter((d) => d.defect_origin === 'PRODUCTION').length;
  const criticalDefects = defects.filter((d) => d.severity === 'CRITICAL').length;

  const canCreate = ['ADMIN', 'OWNER', 'PRODUCTION'].includes((user?.role || '').toUpperCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Defects & Rejections Log</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Module 6 • Supplier Inward Rejections, Production Waste, Scrap & Quarantine Tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDefects}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition"
            >
              <PlusCircle className="h-4 w-4" />
              Log Defect / Rejection
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium">Total Defects Logged</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalDefects}</div>
          <div className="text-[10px] text-slate-400 mt-1">Across all procurement & lines</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-gradient-to-br from-amber-50/50 to-white">
          <div className="text-amber-800 text-xs font-medium flex items-center gap-1">
            <Truck className="h-3.5 w-3.5 text-amber-600" />
            Supplier Rejections
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">{supplierDefects}</div>
          <div className="text-[10px] text-amber-700 mt-1">Returned or debit note flagged</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm bg-gradient-to-br from-rose-50/50 to-white">
          <div className="text-rose-800 text-xs font-medium flex items-center gap-1">
            <Factory className="h-3.5 w-3.5 text-rose-600" />
            Production Waste / Scrap
          </div>
          <div className="text-2xl font-bold text-rose-900 mt-1">{productionDefects}</div>
          <div className="text-[10px] text-rose-700 mt-1">In-process milling/packing loss</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-300 shadow-sm bg-gradient-to-br from-red-100/50 to-white">
          <div className="text-red-800 text-xs font-medium flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            Critical Severity
          </div>
          <div className="text-2xl font-bold text-red-900 mt-1">{criticalDefects}</div>
          <div className="text-[10px] text-red-700 mt-1">Immediate CAPA mandatory</div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by defect ID, material name, batch, or cause..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-700 font-medium"
          >
            <option value="ALL">All Origins</option>
            <option value="SUPPLIER">Supplier Lots</option>
            <option value="PRODUCTION">Production Line</option>
            <option value="STORAGE">Storage / Warehouse</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-700 font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="FOREIGN_MATTER">Foreign Matter</option>
            <option value="PACKAGING_DAMAGE">Packaging Damage</option>
            <option value="MOISTURE_EXCESS">Excess Moisture</option>
            <option value="SEAL_DEFECT">Seal Defect</option>
            <option value="CONTAMINATION">Contamination</option>
            <option value="SENSORY_OFF">Sensory / Off-Odour</option>
          </select>
        </div>
      </div>

      {/* Defects Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Defect No</th>
                <th className="py-3 px-4">Origin & Category</th>
                <th className="py-3 px-4">Item & Batch</th>
                <th className="py-3 px-4 text-right">Defective Qty</th>
                <th className="py-3 px-4 text-center">Severity</th>
                <th className="py-3 px-4">Disposition Action</th>
                <th className="py-3 px-4">Root Cause & Action</th>
                <th className="py-3 px-4 text-center">Logged On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-rose-500" />
                    Loading defects...
                  </td>
                </tr>
              ) : filteredDefects.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No defect records found.
                  </td>
                </tr>
              ) : (
                filteredDefects.map((d) => {
                  let severityBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {d.severity}
                    </span>
                  );
                  if (d.severity === 'CRITICAL') {
                    severityBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        CRITICAL
                      </span>
                    );
                  } else if (d.severity === 'MAJOR') {
                    severityBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        MAJOR
                      </span>
                    );
                  }

                  return (
                    <tr key={d.defect_id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-rose-700">
                        {d.defect_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{d.defect_origin}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{d.defect_category}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{d.item_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Batch: {d.batch_number}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-700">
                        {Number(d.defective_quantity).toLocaleString()} {d.uom}
                      </td>
                      <td className="py-3 px-4 text-center">{severityBadge}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 font-mono">
                          {d.disposition_action}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="truncate text-slate-700 font-medium" title={d.root_cause}>
                          {d.root_cause || 'Under investigation'}
                        </div>
                        {d.corrective_action_required && (
                          <div className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="h-2.5 w-2.5" /> CAPA Required
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {d.defect_date?.split('T')[0]}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Defect Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-rose-400" />
                <h3 className="font-bold text-sm">Log Defect & Material Disposition</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Origin *</label>
                  <select
                    value={formData.defect_origin}
                    onChange={(e) => setFormData({ ...formData, defect_origin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 font-bold"
                  >
                    <option value="SUPPLIER">SUPPLIER (Inward Lot)</option>
                    <option value="PRODUCTION">PRODUCTION (Line Loss)</option>
                    <option value="STORAGE">STORAGE (Warehouse)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Severity *</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 font-bold"
                  >
                    <option value="MINOR">MINOR</option>
                    <option value="MAJOR">MAJOR</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category *</label>
                  <select
                    value={formData.defect_category}
                    onChange={(e) => setFormData({ ...formData, defect_category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 font-medium"
                  >
                    <option value="FOREIGN_MATTER">FOREIGN MATTER / STONES</option>
                    <option value="PACKAGING_DAMAGE">PACKAGING DAMAGE / BURST</option>
                    <option value="MOISTURE_EXCESS">EXCESS MOISTURE</option>
                    <option value="SEAL_DEFECT">SEAL DEFECT / LEAKAGE</option>
                    <option value="CONTAMINATION">CONTAMINATION</option>
                    <option value="SENSORY_OFF">SENSORY OFF-TASTE / AROMA</option>
                    <option value="WEIGHT_DEFECT">WEIGHT UNDERFILL</option>
                    <option value="OTHER">OTHER DEFECT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Defect Date</label>
                  <input
                    type="date"
                    value={formData.defect_date}
                    onChange={(e) => setFormData({ ...formData, defect_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Material / Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Defective Qty ({formData.uom}) *</label>
                  <input
                    type="number"
                    required
                    value={formData.defective_quantity}
                    onChange={(e) => setFormData({ ...formData, defective_quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-bold text-rose-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Disposition Action *</label>
                <select
                  value={formData.disposition_action}
                  onChange={(e) => setFormData({ ...formData, disposition_action: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 font-bold"
                >
                  <option value="REJECT_RETURN_TO_VENDOR">REJECT & RETURN TO VENDOR (Debit Note)</option>
                  <option value="SCRAP">SCRAP & WRITE OFF</option>
                  <option value="REWORK">REWORK / RE-PROCESS</option>
                  <option value="DOWNGRADE">DOWNGRADE GRADE B</option>
                  <option value="ACCEPT_CONCESSION">ACCEPT UNDER CONCESSION</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Root Cause / Inspection Observations *</label>
                <textarea
                  rows="3"
                  required
                  value={formData.root_cause}
                  onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="capaReq"
                  checked={formData.corrective_action_required}
                  onChange={(e) => setFormData({ ...formData, corrective_action_required: e.target.checked })}
                  className="h-4 w-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <label htmlFor="capaReq" className="text-slate-800 font-bold cursor-pointer">
                  Trigger mandatory CAPA investigation
                </label>
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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                  Record Defect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
