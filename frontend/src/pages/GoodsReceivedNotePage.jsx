import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  PlusCircle,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Send,
  Trash2,
  X,
  History,
  ShieldCheck,
  Layers,
  Calendar,
  FileText
} from 'lucide-react';

export default function GoodsReceivedNotePage() {
  const { user, token, setActivePage } = useAuth();
  const [grns, setGrns] = useState([]);
  const [approvedPOs, setApprovedPOs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Selected
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [grnHistory, setGrnHistory] = useState([]);

  // Create Form State
  const initialForm = {
    po_id: '',
    grn_date: new Date().toISOString().slice(0, 10),
    challan_number: '',
    vehicle_number: '',
    notes: '',
    items: []
  };
  const [formData, setFormData] = useState(initialForm);

  const role = (user?.role || '').toUpperCase();
  const canReceive = ['PRODUCTION', 'ADMIN', 'OWNER'].includes(role);

  const fetchGRNs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [grnRes, posRes, supRes] = await Promise.all([
        fetch('/api/purchase/grns', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/purchase/orders', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/master/suppliers', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ json: () => ({ suppliers: [] }) }))
      ]);

      const grnData = await grnRes.json();
      const posData = await posRes.json();
      const supData = await supRes.json();

      if (grnData.success) setGrns(grnData.data || []);
      if (posData.success) {
        // Only POs that are APPROVED, SENT, or PARTIALLY_RECEIVED can receive GRNs
        const receivable = (posData.data || []).filter((p) =>
          ['APPROVED', 'SENT', 'PARTIALLY_RECEIVED'].includes(p.status)
        );
        setApprovedPOs(receivable);
      }
      if (supData.suppliers) setSuppliers(supData.suppliers);
    } catch (err) {
      setError('Failed to fetch Goods Receipts (GRN). Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGRNs();
  }, [token]);

  const getSupplierName = (id) => {
    const s = suppliers.find((sup) => sup.id === parseInt(id));
    return s ? s.name : `Supplier #${id}`;
  };

  // When PO is selected in form, populate its line items
  const handleSelectPO = (poId) => {
    setFormData({ ...formData, po_id: poId, items: [] });
    if (!poId) return;

    const po = approvedPOs.find((p) => p.id === parseInt(poId));
    if (po && po.items) {
      const items = po.items.map((pi) => {
        const remaining = (pi.ordered_qty || 0) - (pi.received_qty || 0);
        return {
          po_item_id: pi.id,
          material_name: pi.material_name,
          uom: pi.uom,
          ordered_qty: pi.ordered_qty,
          prev_received_qty: pi.received_qty || 0,
          current_received_qty: remaining > 0 ? remaining : 0,
          accepted_qty: remaining > 0 ? remaining : 0,
          rejected_qty: 0,
          damaged_qty: 0,
          batch_number: `BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          mfg_date: new Date().toISOString().slice(0, 10),
          expiry_date: '',
          quality_result: 'PASS',
          remarks: 'Goods received in good condition.'
        };
      });
      setFormData((prev) => ({ ...prev, po_id: poId, items }));
    }
  };

  const handleItemFieldChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;

    // Recalculate accepted if received changes
    if (field === 'current_received_qty') {
      const rec = parseFloat(value) || 0;
      const rej = parseFloat(updated[index].rejected_qty) || 0;
      const dam = parseFloat(updated[index].damaged_qty) || 0;
      updated[index].accepted_qty = Math.max(0, rec - rej - dam);
    }

    if (field === 'rejected_qty' || field === 'damaged_qty') {
      const rec = parseFloat(updated[index].current_received_qty) || 0;
      const rej = parseFloat(field === 'rejected_qty' ? value : updated[index].rejected_qty) || 0;
      const dam = parseFloat(field === 'damaged_qty' ? value : updated[index].damaged_qty) || 0;
      updated[index].accepted_qty = Math.max(0, rec - rej - dam);
    }

    setFormData({ ...formData, items: updated });
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formData.po_id) {
      setError('Please select an approved Purchase Order.');
      return;
    }

    // Validation: current_received_qty > 0
    if (formData.items.some((i) => parseFloat(i.current_received_qty) <= 0)) {
      setError('Current received quantity must be greater than 0 for all items.');
      return;
    }

    // Validation: accepted + rejected + damaged <= current_received
    for (const item of formData.items) {
      const rec = parseFloat(item.current_received_qty) || 0;
      const acc = parseFloat(item.accepted_qty) || 0;
      const rej = parseFloat(item.rejected_qty) || 0;
      const dam = parseFloat(item.damaged_qty) || 0;
      if (acc + rej + dam > rec) {
        setError(`Item "${item.material_name}": Accepted (${acc}) + Rejected (${rej}) + Damaged (${dam}) cannot exceed Received (${rec}).`);
        return;
      }
    }

    try {
      const res = await fetch('/api/purchase/grns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create GRN');

      setSuccessMsg(`GRN ${data.data.grn_number} created in DRAFT status.`);
      setShowCreateModal(false);
      setFormData(initialForm);
      fetchGRNs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePostGRN = async (id, num) => {
    if (!window.confirm(`Post Goods Receipt Note ${num}? This confirms physical material inspection and updates the PO received quantity.`)) return;
    try {
      const res = await fetch(`/api/purchase/grns/${id}/post`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to post GRN');

      setSuccessMsg(`GRN ${num} posted successfully. PO cumulative delivery updated.`);
      fetchGRNs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewHistory = async (grn) => {
    setSelectedGRN(grn);
    try {
      const res = await fetch(`/api/purchase/history?entity_type=GRN&entity_id=${grn.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setGrnHistory(data.data || []);
    } catch {
      setGrnHistory([]);
    }
    setShowHistoryModal(true);
  };

  const filteredGRNs = grns.filter((g) => {
    const matchesSearch =
      g.grn_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.challan_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.vehicle_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus ? g.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'POSTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5" /> Posted (Inspected)</span>;
      case 'DRAFT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><Clock className="w-3.5 h-3.5" /> Draft (Pending Inspection)</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold text-xs uppercase tracking-wider">
              Module 6
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Goods Received Note (GRN)
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Physical receipt, batch allocation, and quality inspection against approved purchase orders
          </p>
        </div>

        {canReceive && (
          <button
            onClick={() => {
              setFormData(initialForm);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Receive Material Delivery (GRN)
          </button>
        )}
      </div>

      {/* Integration Architectural Callout */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-3">
        <PackageCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-900">Inventory Integration Notice:</strong> In accordance with Sri Meenakshi ERP ERP rules, Goods Receipts record physical delivery verification, batch numbers, and QA results. Stock ledger movements will seamlessly integrate through the central Phase 6 Inventory Ledger without creating duplicate stock balance tables.
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search GRNs by #, challan #, vehicle #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-semibold">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft (Pending Post)</option>
            <option value="POSTED">Posted (Received)</option>
          </select>
        </div>
      </div>

      {/* GRN Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">GRN Number</th>
                <th className="px-5 py-3.5">Linked PO #</th>
                <th className="px-5 py-3.5">Receipt Date</th>
                <th className="px-5 py-3.5">Delivery Challan</th>
                <th className="px-5 py-3.5">Vehicle #</th>
                <th className="px-5 py-3.5">Materials Received</th>
                <th className="px-5 py-3.5">Accepted Qty</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-5 py-8 text-center text-slate-400">
                    Loading goods receipt notes...
                  </td>
                </tr>
              ) : filteredGRNs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-8 text-center text-slate-400">
                    No Goods Receipt Notes found.
                  </td>
                </tr>
              ) : (
                filteredGRNs.map((grn) => {
                  const totalAccepted = grn.items?.reduce((s, i) => s + (i.accepted_qty || 0), 0) || 0;
                  const totalRejected = grn.items?.reduce((s, i) => s + (i.rejected_qty || 0), 0) || 0;

                  return (
                    <tr key={grn.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{grn.grn_number}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">PO #{grn.po_id}</td>
                      <td className="px-5 py-3.5 text-slate-500">{grn.grn_date}</td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {grn.challan_number || 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">
                        {grn.vehicle_number || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {grn.items?.length || 0} materials
                        {totalRejected > 0 && (
                          <span className="ml-1 text-rose-600 font-bold">({totalRejected} rej)</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-emerald-700">{totalAccepted} units</td>
                      <td className="px-5 py-3.5">{getStatusBadge(grn.status)}</td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedGRN(grn);
                            setShowViewModal(true);
                          }}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleViewHistory(grn)}
                          title="Audit Trail"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {grn.status === 'DRAFT' && canReceive && (
                          <button
                            onClick={() => handlePostGRN(grn.id, grn.grn_number)}
                            title="Post GRN (Confirm Receipt & QA)"
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-sm"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Post
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE GRN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">Record Material Receipt (GRN)</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Select Approved Purchase Order *</label>
                  <select
                    required
                    value={formData.po_id}
                    onChange={(e) => handleSelectPO(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Choose Approved PO --</option>
                    {approvedPOs.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.po_number} ({getSupplierName(po.supplier_id)}) — ₹{po.grand_total} [{po.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Receipt Date</label>
                  <input
                    type="date"
                    required
                    value={formData.grn_date}
                    onChange={(e) => setFormData({ ...formData, grn_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Supplier Delivery Challan #</label>
                  <input
                    type="text"
                    placeholder="e.g. DC-2026-0044"
                    value={formData.challan_number}
                    onChange={(e) => setFormData({ ...formData, challan_number: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Vehicle / Transport #</label>
                  <input
                    type="text"
                    placeholder="e.g. TN59 BK 5678"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Material Line Inspections ({formData.items.length})
                </span>

                {formData.items.length === 0 ? (
                  <div className="text-xs text-slate-400 p-4 text-center bg-slate-50 rounded-xl">
                    Select an approved purchase order above to automatically load items for inspection.
                  </div>
                ) : (
                  formData.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="text-xs text-slate-900">{item.material_name}</strong>
                          <span className="text-xs text-slate-500 ml-2">
                            (Ordered: {item.ordered_qty} {item.uom} | Prev Received: {item.prev_received_qty} {item.uom})
                          </span>
                        </div>
                        <span className="text-xs font-bold text-indigo-700">
                          Remaining to receive: {Math.max(0, item.ordered_qty - item.prev_received_qty)} {item.uom}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Current Received Qty *</label>
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            required
                            value={item.current_received_qty}
                            onChange={(e) => handleItemFieldChange(idx, 'current_received_qty', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Accepted Qty</label>
                          <input
                            type="number"
                            step="0.001"
                            value={item.accepted_qty}
                            onChange={(e) => handleItemFieldChange(idx, 'accepted_qty', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Rejected Qty</label>
                          <input
                            type="number"
                            step="0.001"
                            value={item.rejected_qty}
                            onChange={(e) => handleItemFieldChange(idx, 'rejected_qty', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Damaged Qty</label>
                          <input
                            type="number"
                            step="0.001"
                            value={item.damaged_qty}
                            onChange={(e) => handleItemFieldChange(idx, 'damaged_qty', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Batch Number *</label>
                          <input
                            type="text"
                            required
                            value={item.batch_number}
                            onChange={(e) => handleItemFieldChange(idx, 'batch_number', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Expiry Date</label>
                          <input
                            type="date"
                            value={item.expiry_date}
                            onChange={(e) => handleItemFieldChange(idx, 'expiry_date', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">QC Result</label>
                          <select
                            value={item.quality_result}
                            onChange={(e) => handleItemFieldChange(idx, 'quality_result', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-bold"
                          >
                            <option value="PASS">PASS (Quality Approved)</option>
                            <option value="FAIL">FAIL (Quality Rejected)</option>
                            <option value="PENDING">PENDING (Lab Testing)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">QC Remarks</label>
                          <input
                            type="text"
                            value={item.remarks}
                            onChange={(e) => handleItemFieldChange(idx, 'remarks', e.target.value)}
                            placeholder="e.g. Moisture 13.5% OK"
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formData.items.length === 0}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Save Goods Receipt Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW GRN MODAL */}
      {showViewModal && selectedGRN && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-amber-600">{selectedGRN.grn_number}</span>
                <h3 className="text-base font-black text-slate-900">Goods Receipt Details</h3>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium">Linked PO:</span>{' '}
                <span className="font-bold text-slate-900">PO #{selectedGRN.po_id}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Receipt Date:</span>{' '}
                <span className="font-bold text-slate-800">{selectedGRN.grn_date}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Challan #:</span>{' '}
                <span className="font-bold text-slate-800">{selectedGRN.challan_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Vehicle #:</span>{' '}
                <span className="font-bold text-slate-800 font-mono">{selectedGRN.vehicle_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Status:</span> {getStatusBadge(selectedGRN.status)}
              </div>
              <div>
                <span className="text-slate-400 font-medium">QC Notes:</span>{' '}
                <span className="text-slate-700">{selectedGRN.notes || 'Normal delivery.'}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">Inspected Items & Batches</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Material</th>
                      <th className="px-3 py-2">Received</th>
                      <th className="px-3 py-2">Accepted</th>
                      <th className="px-3 py-2">Rejected</th>
                      <th className="px-3 py-2">Batch #</th>
                      <th className="px-3 py-2">QC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedGRN.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">{item.material_name}</td>
                        <td className="px-3 py-2 font-bold text-slate-800">
                          {item.current_received_qty} {item.uom}
                        </td>
                        <td className="px-3 py-2 font-bold text-emerald-700">
                          {item.accepted_qty} {item.uom}
                        </td>
                        <td className="px-3 py-2 text-rose-600 font-semibold">
                          {item.rejected_qty} {item.uom}
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{item.batch_number}</td>
                        <td className="px-3 py-2 font-bold text-slate-800">{item.quality_result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && selectedGRN && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Audit Trail: {selectedGRN.grn_number}
                </h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {grnHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No status changes recorded yet.</div>
              ) : (
                grnHistory.map((h, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {h.from_status ? `${h.from_status} → ${h.to_status}` : h.to_status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>
                    {h.reason && <p className="text-[11px] text-slate-600">Note: {h.reason}</p>}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
