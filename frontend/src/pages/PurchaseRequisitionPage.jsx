import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Edit2,
  Send,
  Trash2,
  History,
  X,
  Package,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';

export default function PurchaseRequisitionPage() {
  const { user, token } = useAuth();
  const [requisitions, setRequisitions] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [packagingMaterials, setPackagingMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Current selected PR
  const [selectedPR, setSelectedPR] = useState(null);
  const [prHistory, setPrHistory] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form State
  const initialFormState = {
    department: 'Production',
    required_delivery_date: '',
    priority: 'MEDIUM',
    reason_for_purchase: '',
    items: [
      { item_type: 'RAW_MATERIAL', material_id: '', material_name: '', required_qty: '', uom: 'KG', remarks: '' }
    ]
  };
  const [formData, setFormData] = useState(initialFormState);

  const role = (user?.role || '').toUpperCase();
  const canCreate = ['PRODUCTION', 'ADMIN', 'OWNER'].includes(role);
  const canApprove = ['ADMIN', 'OWNER'].includes(role);

  const fetchPRs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prsRes, rmRes, pkgRes] = await Promise.all([
        fetch('/api/purchase/requisitions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/master/raw-materials', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ json: () => ({ rawMaterials: [] }) })),
        fetch('/api/master/packaging-materials', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ json: () => ({ packagingMaterials: [] }) }))
      ]);

      const prsData = await prsRes.json();
      const rmData = await rmRes.json();
      const pkgData = await pkgRes.json();

      if (prsData.success) setRequisitions(prsData.data || []);
      if (rmData.rawMaterials) setRawMaterials(rmData.rawMaterials);
      if (pkgData.packagingMaterials) setPackagingMaterials(pkgData.packagingMaterials);
    } catch (err) {
      setError('Failed to fetch purchase requisitions. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPRs();
  }, [token]);

  // Form Item Helpers
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { item_type: 'RAW_MATERIAL', material_id: '', material_name: '', required_qty: '', uom: 'KG', remarks: '' }
      ]
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;

    if (field === 'item_type') {
      updated[index].material_id = '';
      updated[index].material_name = '';
      updated[index].uom = value === 'RAW_MATERIAL' ? 'KG' : 'PCS';
    }

    if (field === 'material_id') {
      const isRM = updated[index].item_type === 'RAW_MATERIAL';
      const list = isRM ? rawMaterials : packagingMaterials;
      const found = list.find((m) => m.id === parseInt(value));
      if (found) {
        updated[index].material_name = found.name;
        updated[index].uom = found.uom || (isRM ? 'KG' : 'PCS');
      }
    }

    setFormData({ ...formData, items: updated });
  };

  const handleSubmitPRCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validate
    if (formData.items.some((i) => !i.material_id || !i.required_qty || parseFloat(i.required_qty) <= 0)) {
      setError('Please select materials and provide valid quantities greater than 0 for all line items.');
      return;
    }

    try {
      const res = await fetch('/api/purchase/requisitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create requisition');

      setSuccessMsg(`Purchase Requisition ${data.data.requisition_number} created successfully.`);
      setShowCreateModal(false);
      setFormData(initialFormState);
      fetchPRs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenEdit = (pr) => {
    setSelectedPR(pr);
    setFormData({
      department: pr.department,
      required_delivery_date: pr.required_delivery_date || '',
      priority: pr.priority,
      reason_for_purchase: pr.reason_for_purchase || '',
      items: pr.items.map((i) => ({
        item_type: i.item_type,
        material_id: i.material_id,
        material_name: i.material_name,
        required_qty: i.required_qty,
        uom: i.uom,
        remarks: i.remarks || ''
      }))
    });
    setShowEditModal(true);
  };

  const handleUpdatePR = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/purchase/requisitions/${selectedPR.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to update requisition');

      setSuccessMsg(`PR ${data.data.requisition_number} updated successfully.`);
      setShowEditModal(false);
      fetchPRs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitForApproval = async (id, prNum) => {
    if (!window.confirm(`Submit Requisition ${prNum} for management approval?`)) return;
    try {
      const res = await fetch(`/api/purchase/requisitions/${id}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to submit PR');

      setSuccessMsg(`PR ${prNum} submitted for approval.`);
      fetchPRs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApprovePR = async (id, prNum) => {
    if (!window.confirm(`Approve Purchase Requisition ${prNum}?`)) return;
    try {
      const res = await fetch(`/api/purchase/requisitions/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: 'Approved for supplier procurement.' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to approve PR');

      setSuccessMsg(`PR ${prNum} approved.`);
      fetchPRs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenReject = (pr) => {
    setSelectedPR(pr);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is mandatory.');
      return;
    }
    try {
      const res = await fetch(`/api/purchase/requisitions/${selectedPR.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectionReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to reject PR');

      setSuccessMsg(`PR ${selectedPR.requisition_number} rejected.`);
      setShowRejectModal(false);
      fetchPRs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewHistory = async (pr) => {
    setSelectedPR(pr);
    try {
      const res = await fetch(`/api/purchase/history?entity_type=PR&entity_id=${pr.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPrHistory(data.data || []);
      }
    } catch {
      setPrHistory([]);
    }
    setShowHistoryModal(true);
  };

  // Filtered List
  const filteredPRs = requisitions.filter((pr) => {
    const matchesSearch =
      pr.requisition_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pr.reason_for_purchase || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus ? pr.status === filterStatus : true;
    const matchesPriority = filterPriority ? pr.priority === filterPriority : true;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">LOW</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800"><Clock className="w-3.5 h-3.5" /> Submitted</span>;
      case 'DRAFT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Draft</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold text-xs uppercase tracking-wider">
              Module 1
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Purchase Requisitions (PR)
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Internal material requests raised by Production for raw ingredients and packaging
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => {
              setFormData(initialFormState);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Create Purchase Requisition
          </button>
        )}
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

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by PR #, department, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500 font-semibold">Priority:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500 font-semibold">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* PR Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">PR Number</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Required Date</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-slate-400">
                    Loading purchase requisitions...
                  </td>
                </tr>
              ) : filteredPRs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-slate-400">
                    No purchase requisitions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredPRs.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{pr.requisition_number}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">{pr.department}</td>
                    <td className="px-5 py-3.5 text-slate-500">{pr.required_delivery_date || 'N/A'}</td>
                    <td className="px-5 py-3.5">{getPriorityBadge(pr.priority)}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <span className="font-semibold text-slate-800">{pr.items?.length || 0} materials</span>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {pr.items?.map((i) => i.material_name).join(', ')}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-[200px] truncate">
                      {pr.reason_for_purchase || '—'}
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(pr.status)}</td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      {/* Inspect details */}
                      <button
                        onClick={() => {
                          setSelectedPR(pr);
                          setShowViewModal(true);
                        }}
                        title="View Requisition Details"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* History */}
                      <button
                        onClick={() => handleViewHistory(pr)}
                        title="View Status History"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit (Draft only) */}
                      {pr.status === 'DRAFT' && canCreate && (
                        <button
                          onClick={() => handleOpenEdit(pr)}
                          title="Edit Draft Requisition"
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 inline-flex items-center"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Submit (Draft only) */}
                      {pr.status === 'DRAFT' && canCreate && (
                        <button
                          onClick={() => handleSubmitForApproval(pr.id, pr.requisition_number)}
                          title="Submit for Approval"
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 inline-flex items-center"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Approve / Reject (Submitted only, Admin/Owner) */}
                      {pr.status === 'SUBMITTED' && canApprove && (
                        <>
                          <button
                            onClick={() => handleApprovePR(pr.id, pr.requisition_number)}
                            title="Approve Requisition"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 inline-flex items-center"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenReject(pr)}
                            title="Reject Requisition"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 inline-flex items-center"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PR MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">Create Purchase Requisition</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPRCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Department</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Required Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={formData.required_delivery_date}
                    onChange={(e) => setFormData({ ...formData, required_delivery_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Reason for Purchase</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Replenishment for upcoming batch production of Idli Batter..."
                  value={formData.reason_for_purchase}
                  onChange={(e) => setFormData({ ...formData, reason_for_purchase: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Materials Requested ({formData.items.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-amber-600 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Material
                  </button>
                </div>

                {formData.items.map((item, idx) => {
                  const list = item.item_type === 'RAW_MATERIAL' ? rawMaterials : packagingMaterials;
                  return (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>Item #{idx + 1}</span>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-600 hover:text-rose-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Category</label>
                          <select
                            value={item.item_type}
                            onChange={(e) => handleItemChange(idx, 'item_type', e.target.value)}
                            className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          >
                            <option value="RAW_MATERIAL">Raw Material</option>
                            <option value="PACKAGING">Packaging</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-500 font-semibold">Select Material</label>
                          <select
                            required
                            value={item.material_id}
                            onChange={(e) => handleItemChange(idx, 'material_id', e.target.value)}
                            className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          >
                            <option value="">-- Choose Item --</option>
                            {list.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.uom})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">
                            Req Qty ({item.uom})
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            required
                            placeholder="Qty"
                            value={item.required_qty}
                            onChange={(e) => handleItemChange(idx, 'required_qty', e.target.value)}
                            className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Line item remarks (e.g. check moisture < 14%, prefer Guntur grade)"
                          value={item.remarks}
                          onChange={(e) => handleItemChange(idx, 'remarks', e.target.value)}
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] bg-white"
                        />
                      </div>
                    </div>
                  );
                })}
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
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Save Draft Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW REQUISITION DETAILS MODAL */}
      {showViewModal && selectedPR && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-amber-600">{selectedPR.requisition_number}</span>
                <h3 className="text-base font-black text-slate-900">Requisition Details</h3>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium">Department:</span>{' '}
                <span className="font-bold text-slate-800">{selectedPR.department}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Status:</span> {getStatusBadge(selectedPR.status)}
              </div>
              <div>
                <span className="text-slate-400 font-medium">Required Date:</span>{' '}
                <span className="font-bold text-slate-800">{selectedPR.required_delivery_date || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Priority:</span> {getPriorityBadge(selectedPR.priority)}
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 font-medium">Reason:</span>{' '}
                <span className="text-slate-700">{selectedPR.reason_for_purchase || 'No description entered.'}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">Requested Materials</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Material</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Quantity</th>
                      <th className="px-3 py-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPR.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">{item.material_name}</td>
                        <td className="px-3 py-2 text-slate-500">{item.item_type}</td>
                        <td className="px-3 py-2 font-bold text-slate-800">
                          {item.required_qty} {item.uom}
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-[11px]">{item.remarks || '—'}</td>
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
      {showHistoryModal && selectedPR && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Audit Trail: {selectedPR.requisition_number}
                </h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {prHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No status changes recorded yet.</div>
              ) : (
                prHistory.map((h, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {h.from_status ? `${h.from_status} → ${h.to_status}` : h.to_status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>
                    {h.reason && <p className="text-[11px] text-slate-600">Reason: {h.reason}</p>}
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

      {/* REJECT MODAL */}
      {showRejectModal && selectedPR && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <XCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                Reject PR {selectedPR.requisition_number}
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Please provide a mandatory reason for rejecting this purchase requisition. The requesting department will see this explanation.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700">Rejection Reason *</label>
              <textarea
                rows="3"
                required
                placeholder="Explain why this requisition is rejected (e.g. Existing stock sufficient, budget constraints)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-rose-200 text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
