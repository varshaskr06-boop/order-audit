import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  PlusCircle,
  Truck,
  IndianRupee,
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
  Scale,
  Award,
  ChevronRight
} from 'lucide-react';

export default function SupplierQuotationPage() {
  const { user, token, setActivePage } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [packagingMaterials, setPackagingMaterials] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedQT, setSelectedQT] = useState(null);
  const [selectionReason, setSelectionReason] = useState('');

  // Form State
  const initialForm = {
    supplier_id: '',
    requisition_id: '',
    quotation_date: new Date().toISOString().slice(0, 10),
    valid_until: '',
    payment_terms: 'Net 15',
    delivery_terms: 'Delivery at Factory, Kappalur',
    notes: '',
    items: [
      {
        item_type: 'RAW_MATERIAL',
        material_id: '',
        material_name: '',
        uom: 'KG',
        required_qty: 100,
        unit_price: '',
        discount_pct: 0,
        gst_rate: 5,
        delivery_days: 3
      }
    ]
  };
  const [formData, setFormData] = useState(initialForm);

  const role = (user?.role || '').toUpperCase();
  const canManage = ['ADMIN', 'OWNER'].includes(role);

  const fetchQuotations = async () => {
    setLoading(true);
    setError(null);
    try {
      const [qtRes, supRes, rmRes, pkgRes, prRes] = await Promise.all([
        fetch('/api/purchase/quotations', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/master/suppliers', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ json: () => ({ suppliers: [] }) })),
        fetch('/api/master/raw-materials', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ json: () => ({ rawMaterials: [] }) })),
        fetch('/api/master/packaging-materials', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ json: () => ({ packagingMaterials: [] }) })),
        fetch('/api/purchase/requisitions?status=APPROVED', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ json: () => ({ data: [] }) }))
      ]);

      const qtData = await qtRes.json();
      const supData = await supRes.json();
      const rmData = await rmRes.json();
      const pkgData = await pkgRes.json();
      const prData = await prRes.json();

      if (qtData.success) setQuotations(qtData.data || []);
      if (supData.suppliers) setSuppliers(supData.suppliers);
      if (rmData.rawMaterials) setRawMaterials(rmData.rawMaterials);
      if (pkgData.packagingMaterials) setPackagingMaterials(pkgData.packagingMaterials);
      if (prData.data) setRequisitions(prData.data);
    } catch (err) {
      setError('Failed to fetch quotations. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [token]);

  const getSupplierName = (id) => {
    const s = suppliers.find((sup) => sup.id === parseInt(id));
    return s ? `${s.name} (${s.state_code === '33' ? 'TN' : 'Interstate'})` : `Supplier #${id}`;
  };

  // Line item helpers
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          item_type: 'RAW_MATERIAL',
          material_id: '',
          material_name: '',
          uom: 'KG',
          required_qty: 100,
          unit_price: '',
          discount_pct: 0,
          gst_rate: 5,
          delivery_days: 3
        }
      ]
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
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
        if (found.gst_rate !== undefined) updated[index].gst_rate = found.gst_rate;
      }
    }

    setFormData({ ...formData, items: updated });
  };

  // Populate from approved PR
  const handleSelectPR = (prId) => {
    setFormData({ ...formData, requisition_id: prId });
    if (!prId) return;

    const pr = requisitions.find((r) => r.id === parseInt(prId));
    if (pr && pr.items?.length > 0) {
      const items = pr.items.map((i) => ({
        item_type: i.item_type,
        material_id: i.material_id,
        material_name: i.material_name,
        uom: i.uom,
        required_qty: i.required_qty,
        unit_price: '',
        discount_pct: 0,
        gst_rate: 5,
        delivery_days: 3
      }));
      setFormData((prev) => ({ ...prev, requisition_id: prId, items }));
    }
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formData.supplier_id) {
      setError('Please select a supplier.');
      return;
    }

    if (formData.items.some((i) => !i.material_id || !i.unit_price || parseFloat(i.unit_price) <= 0)) {
      setError('Please fill in valid material selections and unit prices greater than ₹0 for all items.');
      return;
    }

    try {
      const res = await fetch('/api/purchase/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to record quotation');

      setSuccessMsg(`Quotation ${data.data.quotation_number} recorded successfully.`);
      setShowCreateModal(false);
      setFormData(initialForm);
      fetchQuotations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenEdit = (qt) => {
    setSelectedQT(qt);
    setFormData({
      supplier_id: qt.supplier_id,
      requisition_id: qt.requisition_id || '',
      quotation_date: qt.quotation_date,
      valid_until: qt.valid_until || '',
      payment_terms: qt.payment_terms || '',
      delivery_terms: qt.delivery_terms || '',
      notes: qt.notes || '',
      items: qt.items.map((i) => ({
        item_type: i.item_type,
        material_id: i.material_id,
        material_name: i.material_name,
        uom: i.uom,
        required_qty: i.required_qty,
        unit_price: i.unit_price,
        discount_pct: i.discount_pct || 0,
        gst_rate: i.gst_rate || 0,
        delivery_days: i.delivery_days || 3
      }))
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/purchase/quotations/${selectedQT.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to update quotation');

      setSuccessMsg(`Quotation ${data.data.quotation_number} updated.`);
      setShowEditModal(false);
      fetchQuotations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitQuotation = async (id, num) => {
    if (!window.confirm(`Submit quotation ${num} for comparison & review?`)) return;
    try {
      const res = await fetch(`/api/purchase/quotations/${id}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to submit quotation');

      setSuccessMsg(`Quotation ${num} submitted.`);
      fetchQuotations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenSelect = (qt) => {
    setSelectedQT(qt);
    setSelectionReason('');
    setShowSelectModal(true);
  };

  const handleConfirmSelect = async () => {
    if (!selectionReason.trim()) {
      setError('Please provide a mandatory selection justification.');
      return;
    }
    try {
      const res = await fetch(`/api/purchase/quotations/${selectedQT.id}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: selectionReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to select quotation');

      setSuccessMsg(`Quotation ${selectedQT.quotation_number} selected as preferred offer.`);
      setShowSelectModal(false);
      fetchQuotations();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredQuotes = quotations.filter((qt) => {
    const matchesSearch =
      qt.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSupplierName(qt.supplier_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (qt.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSupplier = filterSupplier ? qt.supplier_id === parseInt(filterSupplier) : true;
    const matchesStatus = filterStatus ? qt.status === filterStatus : true;
    return matchesSearch && matchesSupplier && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SELECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><Award className="w-3.5 h-3.5" /> Selected</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800"><Clock className="w-3.5 h-3.5" /> Submitted</span>;
      case 'DRAFT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Draft</span>;
      case 'EXPIRED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Expired</span>;
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
              Module 2
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Supplier Quotations Management
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Capture, compare, and select competitive vendor price bids for raw agro & packaging items
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('quotation-comparison')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-sm"
          >
            <Scale className="w-4 h-4 text-amber-600" /> Compare Quotations
          </button>
          {canManage && (
            <button
              onClick={() => {
                setFormData(initialForm);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Record New Quotation
            </button>
          )}
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
            placeholder="Search quotations by quote #, supplier, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500 font-semibold">Supplier:</label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
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
              <option value="SELECTED">Selected</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Quotation #</th>
                <th className="px-5 py-3.5">Supplier</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Valid Until</th>
                <th className="px-5 py-3.5">Payment Terms</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Total Value</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-5 py-8 text-center text-slate-400">
                    Loading supplier quotations...
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-8 text-center text-slate-400">
                    No supplier quotations recorded yet.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((qt) => {
                  const quoteTotal = qt.items?.reduce((s, i) => s + (i.total_amount || 0), 0) || 0;
                  return (
                    <tr key={qt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{qt.quotation_number}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {getSupplierName(qt.supplier_id)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{qt.quotation_date}</td>
                      <td className="px-5 py-3.5 text-slate-500">{qt.valid_until || 'N/A'}</td>
                      <td className="px-5 py-3.5 text-slate-600">{qt.payment_terms || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-600 font-semibold">
                        {qt.items?.length || 0} materials
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        ₹{quoteTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5">{getStatusBadge(qt.status)}</td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedQT(qt);
                            setShowViewModal(true);
                          }}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {qt.status === 'DRAFT' && canManage && (
                          <button
                            onClick={() => handleOpenEdit(qt)}
                            title="Edit Quotation"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 inline-flex items-center"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {qt.status === 'DRAFT' && canManage && (
                          <button
                            onClick={() => handleSubmitQuotation(qt.id, qt.quotation_number)}
                            title="Submit Quotation"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 inline-flex items-center"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {qt.status === 'SUBMITTED' && canManage && (
                          <button
                            onClick={() => handleOpenSelect(qt)}
                            title="Select as Preferred Quotation"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 inline-flex items-center"
                          >
                            <Award className="w-3.5 h-3.5" />
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

      {/* CREATE QUOTATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">Record Supplier Quotation</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Select Supplier *</label>
                  <select
                    required
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.state_code === '33' ? 'Tamil Nadu' : 'Interstate AP/KL'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Link PR (Optional)</label>
                  <select
                    value={formData.requisition_id}
                    onChange={(e) => handleSelectPR(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Standalone Quote --</option>
                    {requisitions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.requisition_number} ({r.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Quotation Date</label>
                  <input
                    type="date"
                    required
                    value={formData.quotation_date}
                    onChange={(e) => setFormData({ ...formData, quotation_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Valid Until</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Payment Terms</label>
                  <select
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Advance">100% Advance</option>
                    <option value="Net 7">Net 7 Days</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Delivery Terms & Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Delivery at Factory Kappalur; moisture test required"
                  value={formData.delivery_terms}
                  onChange={(e) => setFormData({ ...formData, delivery_terms: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Quoted Materials & Prices ({formData.items.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-amber-600 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Material Line
                  </button>
                </div>

                {formData.items.map((item, idx) => {
                  const list = item.item_type === 'RAW_MATERIAL' ? rawMaterials : packagingMaterials;
                  const lineSubtotal = (parseFloat(item.required_qty) || 0) * (parseFloat(item.unit_price) || 0);
                  const lineDisc = lineSubtotal * ((parseFloat(item.discount_pct) || 0) / 100);
                  const lineTaxable = lineSubtotal - lineDisc;
                  const lineTotal = lineTaxable * (1 + (parseFloat(item.gst_rate) || 0) / 100);

                  return (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>Quotation Line #{idx + 1}</span>
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

                      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Type</label>
                          <select
                            value={item.item_type}
                            onChange={(e) => handleItemChange(idx, 'item_type', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          >
                            <option value="RAW_MATERIAL">Raw Material</option>
                            <option value="PACKAGING">Packaging</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-500 font-semibold">Material *</label>
                          <select
                            required
                            value={item.material_id}
                            onChange={(e) => handleItemChange(idx, 'material_id', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
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
                          <label className="text-[10px] text-slate-500 font-semibold">Qty ({item.uom})</label>
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            required
                            value={item.required_qty}
                            onChange={(e) => handleItemChange(idx, 'required_qty', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Unit Price (₹) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            placeholder="0.00"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Lead Time</label>
                          <input
                            type="number"
                            placeholder="Days"
                            value={item.delivery_days}
                            onChange={(e) => handleItemChange(idx, 'delivery_days', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 px-1 text-slate-600">
                        <div className="flex items-center gap-3">
                          <span>
                            Disc%: 
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount_pct}
                              onChange={(e) => handleItemChange(idx, 'discount_pct', e.target.value)}
                              className="w-14 ml-1 px-1 py-0.5 rounded border border-slate-200 text-xs"
                            />
                          </span>
                          <span>
                            GST%: 
                            <select
                              value={item.gst_rate}
                              onChange={(e) => handleItemChange(idx, 'gst_rate', e.target.value)}
                              className="ml-1 px-1 py-0.5 rounded border border-slate-200 text-xs bg-white"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                            </select>
                          </span>
                        </div>
                        <div className="font-bold text-slate-900">
                          Total: ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
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
                  Save Supplier Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW QUOTATION DETAILS MODAL */}
      {showViewModal && selectedQT && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-amber-600">{selectedQT.quotation_number}</span>
                <h3 className="text-base font-black text-slate-900">Quotation Details</h3>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium">Supplier:</span>{' '}
                <span className="font-bold text-slate-900">{getSupplierName(selectedQT.supplier_id)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Status:</span> {getStatusBadge(selectedQT.status)}
              </div>
              <div>
                <span className="text-slate-400 font-medium">Quote Date:</span>{' '}
                <span className="font-bold text-slate-800">{selectedQT.quotation_date}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Valid Until:</span>{' '}
                <span className="font-bold text-slate-800">{selectedQT.valid_until || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Payment Terms:</span>{' '}
                <span className="text-slate-800 font-semibold">{selectedQT.payment_terms || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Delivery Terms:</span>{' '}
                <span className="text-slate-800">{selectedQT.delivery_terms || 'N/A'}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">Quoted Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Material</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Rate (₹)</th>
                      <th className="px-3 py-2">Disc%</th>
                      <th className="px-3 py-2">GST%</th>
                      <th className="px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedQT.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">{item.material_name}</td>
                        <td className="px-3 py-2">
                          {item.required_qty} {item.uom}
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-800">₹{item.unit_price}</td>
                        <td className="px-3 py-2 text-slate-500">{item.discount_pct}%</td>
                        <td className="px-3 py-2 text-slate-500">{item.gst_rate}%</td>
                        <td className="px-3 py-2 font-bold text-slate-900">
                          ₹{(item.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
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

      {/* SELECT PREFERRED QUOTATION MODAL */}
      {showSelectModal && selectedQT && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <Award className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                Select Preferred Quotation: {selectedQT.quotation_number}
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Sri Meenakshi ERP procurement policy requires recording a reasoned justification before awarding purchase orders.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700">Selection Reason *</label>
              <textarea
                rows="3"
                required
                placeholder="Explain selection (e.g. Competitive rate ₹43/kg, 2-day delivery lead time, verified moisture test history)..."
                value={selectionReason}
                onChange={(e) => setSelectionReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-emerald-200 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSelectModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSelect}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Confirm Preferred Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
