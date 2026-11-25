import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Package,
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
  Printer,
  History,
  X,
  FileText,
  FileCheck,
  Building2,
  Scale
} from 'lucide-react';

export default function PurchaseOrderPage() {
  const { user, token, setActivePage } = useAuth();
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [packagingMaterials, setPackagingMaterials] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [quotations, setQuotations] = useState([]);
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
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Selection states
  const [selectedPO, setSelectedPO] = useState(null);
  const [poHistory, setPoHistory] = useState([]);
  const [printHtml, setPrintHtml] = useState('');

  // Form
  const initialForm = {
    supplier_id: '',
    requisition_id: '',
    quotation_id: '',
    po_date: new Date().toISOString().slice(0, 10),
    expected_delivery_date: '',
    delivery_address: 'Plot No. 42-B, SIDCO Industrial Estate, Kappalur, Madurai, TN - 625008',
    payment_terms: 'Net 15',
    notes: '',
    items: [
      {
        item_type: 'RAW_MATERIAL',
        material_id: '',
        material_name: '',
        uom: 'KG',
        ordered_qty: 100,
        unit_price: 45,
        discount_pct: 0,
        gst_rate: 5
      }
    ]
  };
  const [formData, setFormData] = useState(initialForm);

  const role = (user?.role || '').toUpperCase();
  const canManage = ['ADMIN', 'OWNER'].includes(role);

  const fetchPOs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [posRes, supRes, rmRes, pkgRes, prRes, qtRes] = await Promise.all([
        fetch('/api/purchase/orders', {
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
        }).catch(() => ({ json: () => ({ data: [] }) })),
        fetch('/api/purchase/quotations', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ json: () => ({ data: [] }) }))
      ]);

      const posData = await posRes.json();
      const supData = await supRes.json();
      const rmData = await rmRes.json();
      const pkgData = await pkgRes.json();
      const prData = await prRes.json();
      const qtData = await qtRes.json();

      if (posData.success) setOrders(posData.data || []);
      if (supData.suppliers) setSuppliers(supData.suppliers);
      if (rmData.rawMaterials) setRawMaterials(rmData.rawMaterials);
      if (pkgData.packagingMaterials) setPackagingMaterials(pkgData.packagingMaterials);
      if (prData.data) setRequisitions(prData.data);
      if (qtData.data) setQuotations(qtData.data);
    } catch (err) {
      setError('Failed to fetch purchase orders. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, [token]);

  const getSupplier = (id) => suppliers.find((s) => s.id === parseInt(id));
  const getSupplierName = (id) => {
    const s = getSupplier(id);
    return s ? `${s.name} (${s.state_code === '33' ? 'Tamil Nadu' : 'Interstate AP/KL'})` : `Supplier #${id}`;
  };

  // Calculations
  const calculateTotals = (items, supplierId) => {
    const sup = getSupplier(supplierId);
    const isIntrastate = !sup || sup.state_code === '33';

    let subtotal = 0, discount = 0, taxable = 0;
    let cgst = 0, sgst = 0, igst = 0;

    items.forEach((item) => {
      const q = parseFloat(item.ordered_qty) || 0;
      const p = parseFloat(item.unit_price) || 0;
      const dPct = parseFloat(item.discount_pct) || 0;
      const gRate = parseFloat(item.gst_rate) || 0;

      const lineSubtotal = q * p;
      const lineDisc = lineSubtotal * (dPct / 100);
      const lineTaxable = lineSubtotal - lineDisc;
      const lineTax = lineTaxable * (gRate / 100);

      subtotal += lineSubtotal;
      discount += lineDisc;
      taxable += lineTaxable;

      if (isIntrastate) {
        cgst += lineTax / 2;
        sgst += lineTax / 2;
      } else {
        igst += lineTax;
      }
    });

    const totalTax = cgst + sgst + igst;
    const grandTotal = taxable + totalTax;

    return { subtotal, discount, taxable, cgst, sgst, igst, totalTax, grandTotal, isIntrastate };
  };

  // Form Item Helpers
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
          ordered_qty: 100,
          unit_price: 45,
          discount_pct: 0,
          gst_rate: 5
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
        if (found.unit_cost !== undefined) updated[index].unit_price = found.unit_cost;
        if (found.gst_rate !== undefined) updated[index].gst_rate = found.gst_rate;
      }
    }

    setFormData({ ...formData, items: updated });
  };

  // Populate from Quotation
  const handleSelectQuotation = (quotationId) => {
    setFormData({ ...formData, quotation_id: quotationId });
    if (!quotationId) return;

    const qt = quotations.find((q) => q.id === parseInt(quotationId));
    if (qt) {
      setFormData((prev) => ({
        ...prev,
        quotation_id: quotationId,
        supplier_id: qt.supplier_id,
        payment_terms: qt.payment_terms || prev.payment_terms,
        items: qt.items.map((i) => ({
          item_type: i.item_type,
          material_id: i.material_id,
          material_name: i.material_name,
          uom: i.uom,
          ordered_qty: i.required_qty,
          unit_price: i.unit_price,
          discount_pct: i.discount_pct || 0,
          gst_rate: i.gst_rate || 0
        }))
      }));
    }
  };

  // Populate from approved PR
  const handleSelectPR = (prId) => {
    setFormData({ ...formData, requisition_id: prId });
    if (!prId) return;

    const pr = requisitions.find((r) => r.id === parseInt(prId));
    if (pr) {
      setFormData((prev) => ({
        ...prev,
        requisition_id: prId,
        items: pr.items.map((i) => ({
          item_type: i.item_type,
          material_id: i.material_id,
          material_name: i.material_name,
          uom: i.uom,
          ordered_qty: i.required_qty,
          unit_price: 45,
          discount_pct: 0,
          gst_rate: 5
        }))
      }));
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

    if (formData.items.some((i) => !i.material_id || !i.ordered_qty || parseFloat(i.ordered_qty) <= 0)) {
      setError('Please select valid materials and provide quantities greater than 0.');
      return;
    }

    try {
      const res = await fetch('/api/purchase/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create purchase order');

      setSuccessMsg(`Purchase Order ${data.data.po_number} created in DRAFT status.`);
      setShowCreateModal(false);
      setFormData(initialForm);
      fetchPOs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenEdit = (po) => {
    setSelectedPO(po);
    setFormData({
      supplier_id: po.supplier_id,
      requisition_id: po.requisition_id || '',
      quotation_id: po.quotation_id || '',
      po_date: po.po_date,
      expected_delivery_date: po.expected_delivery_date || '',
      delivery_address: po.delivery_address || '',
      payment_terms: po.payment_terms || '',
      notes: po.notes || '',
      items: po.items.map((i) => ({
        id: i.id,
        item_type: i.item_type,
        material_id: i.material_id,
        material_name: i.material_name,
        uom: i.uom,
        ordered_qty: i.ordered_qty,
        unit_price: i.unit_price,
        discount_pct: i.discount_pct || 0,
        gst_rate: i.gst_rate || 0,
        received_qty: i.received_qty || 0
      }))
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/purchase/orders/${selectedPO.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to update PO');

      setSuccessMsg(`PO ${data.data.po_number} updated.`);
      setShowEditModal(false);
      fetchPOs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitForApproval = async (id, num) => {
    if (!window.confirm(`Submit PO ${num} for management approval?`)) return;
    try {
      const res = await fetch(`/api/purchase/orders/${id}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to submit PO');

      setSuccessMsg(`PO ${num} submitted for approval.`);
      fetchPOs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePrint = async (po) => {
    setSelectedPO(po);
    try {
      const res = await fetch(`/api/purchase/orders/${po.id}/print`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data?.html) {
        setPrintHtml(data.data.html);
        setShowPrintModal(true);
      }
    } catch {
      setError('Could not generate printable PO.');
    }
  };

  const handleViewHistory = async (po) => {
    setSelectedPO(po);
    try {
      const res = await fetch(`/api/purchase/history?entity_type=PO&entity_id=${po.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setPoHistory(data.data || []);
    } catch {
      setPoHistory([]);
    }
    setShowHistoryModal(true);
  };

  const filteredOrders = orders.filter((po) => {
    const matchesSearch =
      po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSupplierName(po.supplier_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSupplier = filterSupplier ? po.supplier_id === parseInt(filterSupplier) : true;
    const matchesStatus = filterStatus ? po.status === filterStatus : true;
    return matchesSearch && matchesSupplier && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800"><Clock className="w-3.5 h-3.5" /> Pending Approval</span>;
      case 'DRAFT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Draft</span>;
      case 'RECEIVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">Received</span>;
      case 'PARTIALLY_RECEIVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Partially Received</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const preview = calculateTotals(formData.items, formData.supplier_id);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold text-xs uppercase tracking-wider">
              Module 4
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Purchase Order Management (PO)
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative purchase agreements with automatic GST calculation, approved quotes, and printable POs
          </p>
        </div>

        <div className="flex items-center gap-3">
          {['ADMIN', 'OWNER'].includes(role) && (
            <button
              onClick={() => setActivePage('purchase-approvals')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all shadow-sm"
            >
              <FileCheck className="w-4 h-4 text-amber-700" /> Approval Queue
            </button>
          )}
          {canManage && (
            <button
              onClick={() => {
                setFormData(initialForm);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Create Purchase Order
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
            placeholder="Search POs by #, supplier, notes..."
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
              <option value="SUBMITTED">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="PARTIALLY_RECEIVED">Partially Received</option>
              <option value="RECEIVED">Received</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">PO Number</th>
                <th className="px-5 py-3.5">Supplier</th>
                <th className="px-5 py-3.5">PO Date</th>
                <th className="px-5 py-3.5">Expected Delivery</th>
                <th className="px-5 py-3.5">Taxable Value</th>
                <th className="px-5 py-3.5">GST Split</th>
                <th className="px-5 py-3.5">Grand Total</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-5 py-8 text-center text-slate-400">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-8 text-center text-slate-400">
                    No purchase orders found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((po) => {
                  const isTN = (po.igst_amount || 0) === 0;
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{po.po_number}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {getSupplierName(po.supplier_id)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{po.po_date}</td>
                      <td className="px-5 py-3.5 text-slate-500">{po.expected_delivery_date || 'TBD'}</td>
                      <td className="px-5 py-3.5 text-slate-700">
                        ₹{(po.taxable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-[11px] text-slate-500">
                        {isTN ? (
                          <span>CGST ₹{po.cgst_amount} | SGST ₹{po.sgst_amount}</span>
                        ) : (
                          <span className="text-purple-700 font-semibold">IGST ₹{po.igst_amount}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-black text-slate-900">
                        ₹{(po.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5">{getStatusBadge(po.status)}</td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedPO(po);
                            setShowViewModal(true);
                          }}
                          title="Inspect Details"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handlePrint(po)}
                          title="Generate Printable PO"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleViewHistory(po)}
                          title="Audit Trail"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit DRAFT only */}
                        {po.status === 'DRAFT' && canManage && (
                          <button
                            onClick={() => handleOpenEdit(po)}
                            title="Edit Draft PO"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 inline-flex items-center"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Submit DRAFT only */}
                        {po.status === 'DRAFT' && canManage && (
                          <button
                            onClick={() => handleSubmitForApproval(po.id, po.po_number)}
                            title="Submit for Approval"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 inline-flex items-center"
                          >
                            <Send className="w-3.5 h-3.5" />
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

      {/* CREATE PO MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">Create Purchase Order (PO)</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
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
                        {s.name} ({s.state_code === '33' ? 'Tamil Nadu - 33' : 'Interstate AP/KL'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">From Quotation (Optional)</label>
                  <select
                    value={formData.quotation_id}
                    onChange={(e) => handleSelectQuotation(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="">-- Manual / Direct PO --</option>
                    {quotations.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.quotation_number} ({q.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">From PR (Optional)</label>
                  <select
                    value={formData.requisition_id}
                    onChange={(e) => handleSelectPR(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="">-- None --</option>
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
                  <label className="text-xs font-semibold text-slate-700">PO Date</label>
                  <input
                    type="date"
                    required
                    value={formData.po_date}
                    onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Expected Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
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
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 7">Net 7 Days</option>
                    <option value="Advance">100% Advance</option>
                    <option value="COD">Cash on Delivery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Delivery Address</label>
                <input
                  type="text"
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              {/* Items Table */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Ordered Materials & Prices ({formData.items.length})
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
                  const lineSubtotal = (parseFloat(item.ordered_qty) || 0) * (parseFloat(item.unit_price) || 0);
                  const lineDisc = lineSubtotal * ((parseFloat(item.discount_pct) || 0) / 100);
                  const lineTaxable = lineSubtotal - lineDisc;
                  const lineTax = lineTaxable * ((parseFloat(item.gst_rate) || 0) / 100);
                  const lineTotal = lineTaxable + lineTax;

                  return (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>PO Line #{idx + 1}</span>
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
                            value={item.ordered_qty}
                            onChange={(e) => handleItemChange(idx, 'ordered_qty', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Price (₹) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Disc% / GST%</label>
                          <div className="flex gap-1 mt-0.5">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount_pct}
                              onChange={(e) => handleItemChange(idx, 'discount_pct', e.target.value)}
                              className="w-1/2 px-1 py-1.5 rounded-lg border border-slate-200 text-xs"
                            />
                            <select
                              value={item.gst_rate}
                              onChange={(e) => handleItemChange(idx, 'gst_rate', e.target.value)}
                              className="w-1/2 px-1 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 px-1 text-slate-600">
                        <div>
                          Taxable: ₹{lineTaxable.toFixed(2)} | Tax: ₹{lineTax.toFixed(2)}
                        </div>
                        <div className="font-bold text-slate-900">
                          Line Total: ₹{lineTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Calculations Summary Box */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>₹{preview.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Discount Total:</span>
                  <span>- ₹{preview.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-200">
                  <span>Taxable Value:</span>
                  <span>₹{preview.taxable.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>
                    GST Treatment: {preview.isIntrastate ? 'Intrastate (TN)' : 'Interstate (AP/KL)'}
                  </span>
                  <span>
                    {preview.isIntrastate
                      ? `CGST: ₹${preview.cgst.toFixed(2)} | SGST: ₹${preview.sgst.toFixed(2)}`
                      : `IGST: ₹${preview.igst.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between font-black text-sm text-amber-400 pt-2 border-t border-slate-800">
                  <span>Grand Total (Payable):</span>
                  <span>₹{preview.grandTotal.toFixed(2)}</span>
                </div>
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
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Save Draft Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PO MODAL */}
      {showViewModal && selectedPO && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-amber-600">{selectedPO.po_number}</span>
                <h3 className="text-base font-black text-slate-900">Purchase Order Details</h3>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium">Supplier:</span>{' '}
                <span className="font-bold text-slate-900">{getSupplierName(selectedPO.supplier_id)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Status:</span> {getStatusBadge(selectedPO.status)}
              </div>
              <div>
                <span className="text-slate-400 font-medium">PO Date:</span>{' '}
                <span className="font-bold text-slate-800">{selectedPO.po_date}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Expected Delivery:</span>{' '}
                <span className="font-bold text-slate-800">{selectedPO.expected_delivery_date || 'TBD'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Payment Terms:</span>{' '}
                <span className="text-slate-800">{selectedPO.payment_terms || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Delivery Address:</span>{' '}
                <span className="text-slate-700 truncate block">{selectedPO.delivery_address}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">Order Line Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Material</th>
                      <th className="px-3 py-2">Ordered</th>
                      <th className="px-3 py-2">Received</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">GST%</th>
                      <th className="px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPO.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">{item.material_name}</td>
                        <td className="px-3 py-2 font-bold text-slate-800">
                          {item.ordered_qty} {item.uom}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {item.received_qty || 0} {item.uom}
                        </td>
                        <td className="px-3 py-2 text-slate-700">₹{item.unit_price}</td>
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

            {/* Financial summary */}
            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Taxable Amount:</span>
                <span>₹{(selectedPO.taxable_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Tax (CGST + SGST + IGST):</span>
                <span>₹{(selectedPO.total_tax_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold text-sm pt-1 border-t border-slate-800">
                <span>Grand Total:</span>
                <span>₹{(selectedPO.grand_total || 0).toLocaleString('en-IN')}</span>
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

      {/* PRINT PO MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Print Purchase Order: {selectedPO?.po_number}
                </h3>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rendered HTML document */}
            <div
              className="border border-slate-200 p-6 rounded-xl bg-white shadow-inner"
              dangerouslySetInnerHTML={{ __html: printHtml }}
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Official document for vendor communication and GST compliance.
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(printHtml);
                    printWindow.document.close();
                    printWindow.print();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Document
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && selectedPO && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Audit Trail: {selectedPO.po_number}
                </h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {poHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No status changes recorded yet.</div>
              ) : (
                poHistory.map((h, i) => (
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
