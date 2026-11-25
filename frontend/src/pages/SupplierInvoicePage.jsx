import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Receipt,
  PlusCircle,
  Truck,
  IndianRupee,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Trash2,
  X,
  History,
  Scale,
  CreditCard,
  FileText
} from 'lucide-react';

export default function SupplierInvoicePage() {
  const { user, token, setActivePage } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Selected
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invHistory, setInvHistory] = useState([]);

  // Form State
  const initialForm = {
    supplier_id: '',
    po_id: '',
    grn_id: '',
    supplier_invoice_number: '',
    invoice_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    notes: '',
    items: []
  };
  const [formData, setFormData] = useState(initialForm);

  const role = (user?.role || '').toUpperCase();
  const canRecord = ['ACCOUNTANT', 'ADMIN', 'OWNER'].includes(role);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, supRes, poRes, grnRes] = await Promise.all([
        fetch('/api/purchase/invoices', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/master/suppliers', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ json: () => ({ suppliers: [] }) })),
        fetch('/api/purchase/orders', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/purchase/grns?status=POSTED', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const invData = await invRes.json();
      const supData = await supRes.json();
      const poData = await poRes.json();
      const grnData = await grnRes.json();

      if (invData.success) setInvoices(invData.data || []);
      if (supData.suppliers) setSuppliers(supData.suppliers);
      if (poData.success) setOrders(poData.data || []);
      if (grnData.success) setGrns(grnData.data || []);
    } catch (err) {
      setError('Failed to fetch supplier invoices. Verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [token]);

  const getSupplierName = (id) => {
    const s = suppliers.find((sup) => sup.id === parseInt(id));
    return s ? `${s.name} (${s.state_code === '33' ? 'Tamil Nadu' : 'Interstate AP/KL'})` : `Supplier #${id}`;
  };

  // When PO is chosen, auto-fill supplier and items
  const handleSelectPO = (poId) => {
    setFormData({ ...formData, po_id: poId, items: [] });
    if (!poId) return;

    const po = orders.find((p) => p.id === parseInt(poId));
    if (po) {
      // Find matching GRN for this PO if available
      const matchingGRN = grns.find((g) => g.po_id === po.id);
      const items = po.items.map((pi) => ({
        po_item_id: pi.id,
        item_type: pi.item_type,
        material_id: pi.material_id,
        material_name: pi.material_name,
        uom: pi.uom,
        invoiced_qty: pi.received_qty > 0 ? pi.received_qty : pi.ordered_qty,
        unit_price: pi.unit_price,
        gst_rate: pi.gst_rate
      }));

      setFormData((prev) => ({
        ...prev,
        po_id: poId,
        supplier_id: po.supplier_id,
        grn_id: matchingGRN ? String(matchingGRN.id) : '',
        items
      }));
    }
  };

  const handleItemFieldChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData({ ...formData, items: updated });
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formData.supplier_id || !formData.po_id) {
      setError('Please select both a supplier and purchase order.');
      return;
    }

    if (!formData.supplier_invoice_number.trim()) {
      setError('Supplier invoice number is mandatory.');
      return;
    }

    if (formData.items.some((i) => !i.invoiced_qty || parseFloat(i.invoiced_qty) <= 0 || parseFloat(i.unit_price) <= 0)) {
      setError('Please verify quantities and unit prices for all invoice items.');
      return;
    }

    try {
      const res = await fetch('/api/purchase/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to record invoice');

      setSuccessMsg(`Supplier Invoice ${data.data.invoice_number} recorded successfully.`);
      setShowCreateModal(false);
      setFormData(initialForm);
      fetchInvoices();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRunMatch = async (inv) => {
    try {
      const res = await fetch(`/api/purchase/invoices/${inv.id}/match`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to run matching');

      setSuccessMsg(`Three-way match completed for Invoice ${inv.invoice_number}: ${data.data.match_status}`);
      setActivePage('three-way-matching');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewHistory = async (inv) => {
    setSelectedInvoice(inv);
    try {
      const res = await fetch(`/api/purchase/history?entity_type=INV&entity_id=${inv.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setInvHistory(data.data || []);
    } catch {
      setInvHistory([]);
    }
    setShowHistoryModal(true);
  };

  const filteredInvoices = invoices.filter((i) => {
    const matchesSearch =
      i.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.supplier_invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSupplierName(i.supplier_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSupplier = filterSupplier ? i.supplier_id === parseInt(filterSupplier) : true;
    const matchesPayment = filterPayment ? i.payment_status === filterPayment : true;
    return matchesSearch && matchesSupplier && matchesPayment;
  });

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5" /> Paid</span>;
      case 'PARTIALLY_PAID':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Partially Paid</span>;
      case 'UNPAID':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Unpaid</span>;
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
              Module 7
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Supplier Invoice Management
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Capture vendor GST tax invoices against Purchase Orders and GRNs with duplicate check protection
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('three-way-matching')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-sm"
          >
            <Scale className="w-4 h-4 text-amber-600" /> 3-Way Match Verification
          </button>
          {canRecord && (
            <button
              onClick={() => {
                setFormData(initialForm);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Record Supplier Invoice
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
            placeholder="Search invoices by internal #, vendor inv #, supplier..."
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
            <label className="text-xs text-slate-500 font-semibold">Payment Status:</label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
            >
              <option value="">All Statuses</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Internal Inv #</th>
                <th className="px-5 py-3.5">Vendor Invoice #</th>
                <th className="px-5 py-3.5">Supplier</th>
                <th className="px-5 py-3.5">PO / GRN</th>
                <th className="px-5 py-3.5">Invoice Date</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5">Taxable Base</th>
                <th className="px-5 py-3.5">Grand Total</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-5 py-8 text-center text-slate-400">
                    Loading supplier invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-5 py-8 text-center text-slate-400">
                    No supplier invoices recorded yet.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-700 font-bold">
                      {inv.supplier_invoice_number}
                    </td>
                    <td className="px-5 py-3.5 text-slate-800 font-medium">
                      {getSupplierName(inv.supplier_id)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                      PO #{inv.po_id} {inv.grn_id ? `| GRN #${inv.grn_id}` : ''}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{inv.invoice_date}</td>
                    <td className="px-5 py-3.5 text-slate-500">{inv.due_date || 'N/A'}</td>
                    <td className="px-5 py-3.5 text-slate-700">
                      ₹{(inv.taxable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 font-black text-slate-900">
                      ₹{(inv.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5">{getPaymentBadge(inv.payment_status)}</td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setShowViewModal(true);
                        }}
                        title="View Details"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleRunMatch(inv)}
                        title="Run 3-Way Match"
                        className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        <Scale className="w-3 h-3" /> Match
                      </button>

                      <button
                        onClick={() => handleViewHistory(inv)}
                        title="Audit Trail"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">Record Vendor Tax Invoice</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Link Purchase Order *</label>
                  <select
                    required
                    value={formData.po_id}
                    onChange={(e) => handleSelectPO(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Choose PO --</option>
                    {orders.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.po_number} ({getSupplierName(po.supplier_id)}) — ₹{po.grand_total}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Link Goods Receipt (GRN)</label>
                  <select
                    value={formData.grn_id}
                    onChange={(e) => setFormData({ ...formData, grn_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="">-- Select GRN (Optional) --</option>
                    {grns
                      .filter((g) => !formData.po_id || g.po_id === parseInt(formData.po_id))
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.grn_number} (Challan: {g.challan_number || 'N/A'})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Vendor Invoice # *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KDA/2026/00147"
                    value={formData.supplier_invoice_number}
                    onChange={(e) => setFormData({ ...formData, supplier_invoice_number: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Billed Invoice Line Items ({formData.items.length})
                </span>

                {formData.items.length === 0 ? (
                  <div className="text-xs text-slate-400 p-4 text-center bg-slate-50 rounded-xl">
                    Select a Purchase Order above to automatically load invoice line items.
                  </div>
                ) : (
                  formData.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs text-slate-900">{item.material_name}</strong>
                        <span className="text-xs text-slate-500 font-semibold">{item.item_type}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Invoiced Qty ({item.uom}) *</label>
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            required
                            value={item.invoiced_qty}
                            onChange={(e) => handleItemFieldChange(idx, 'invoiced_qty', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Billed Unit Price (₹) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={item.unit_price}
                            onChange={(e) => handleItemFieldChange(idx, 'unit_price', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">GST Rate (%)</label>
                          <select
                            value={item.gst_rate}
                            onChange={(e) => handleItemFieldChange(idx, 'gst_rate', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Estimated Line Total</label>
                          <div className="mt-1 text-xs font-bold text-slate-800">
                            ₹{(
                              (parseFloat(item.invoiced_qty) || 0) *
                              (parseFloat(item.unit_price) || 0) *
                              (1 + (parseFloat(item.gst_rate) || 0) / 100)
                            ).toFixed(2)}
                          </div>
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
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Save Supplier Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW INVOICE MODAL */}
      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-amber-600">{selectedInvoice.invoice_number}</span>
                <h3 className="text-base font-black text-slate-900">Supplier Tax Invoice</h3>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium">Vendor Invoice #:</span>{' '}
                <span className="font-bold text-slate-900 font-mono">{selectedInvoice.supplier_invoice_number}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Supplier:</span>{' '}
                <span className="font-bold text-slate-900">{getSupplierName(selectedInvoice.supplier_id)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Invoice Date:</span>{' '}
                <span className="font-bold text-slate-800">{selectedInvoice.invoice_date}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Payment Due Date:</span>{' '}
                <span className="font-bold text-slate-800">{selectedInvoice.due_date}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Payment Status:</span>{' '}
                {getPaymentBadge(selectedInvoice.payment_status)}
              </div>
              <div>
                <span className="text-slate-400 font-medium">Reference:</span>{' '}
                <span className="font-semibold text-slate-800">
                  PO #{selectedInvoice.po_id} {selectedInvoice.grn_id ? `| GRN #${selectedInvoice.grn_id}` : ''}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">Billed Line Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Material</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Rate</th>
                      <th className="px-3 py-2">Taxable</th>
                      <th className="px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">{item.material_name}</td>
                        <td className="px-3 py-2 font-bold text-slate-800">
                          {item.invoiced_qty} {item.uom}
                        </td>
                        <td className="px-3 py-2 text-slate-700">₹{item.unit_price}</td>
                        <td className="px-3 py-2 text-slate-700">₹{item.taxable_amount}</td>
                        <td className="px-3 py-2 font-bold text-slate-900">₹{item.total_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Taxable Base:</span>
                <span>₹{(selectedInvoice.taxable_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST Tax (CGST + SGST + IGST):</span>
                <span>₹{(selectedInvoice.total_tax_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold text-sm pt-1 border-t border-slate-800">
                <span>Grand Total:</span>
                <span>₹{(selectedInvoice.grand_total || 0).toLocaleString('en-IN')}</span>
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
      {showHistoryModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Audit Trail: {selectedInvoice.invoice_number}
                </h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {invHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No status changes recorded yet.</div>
              ) : (
                invHistory.map((h, i) => (
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
