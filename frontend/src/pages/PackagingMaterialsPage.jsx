import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X,
  Truck,
  Box
} from 'lucide-react';

const PACKAGING_TYPES = ['ALL', 'Pouch', 'Zip Bag', 'Box', 'Carton Box', 'Label', 'Sealing Tape'];
const UNITS = ['pieces', 'rolls', 'box'];

export default function PackagingMaterialsPage() {
  const { token, user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canModify = role === 'ADMIN' || role === 'OWNER';

  const [packaging, setPackaging] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form State
  const [form, setForm] = useState({
    code: '',
    name: '',
    packaging_type: 'Pouch',
    unit: 'pieces',
    preferred_supplier_id: '',
    min_stock_alert: '100.00',
    reorder_level: '250.00',
    avg_unit_cost: '0.00',
    description: '',
  });
  const [formError, setFormError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPackaging = async () => {
    setLoading(true);
    try {
      let url = `/api/master/packaging-materials?search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'ALL') url += `&is_active=${statusFilter === 'ACTIVE'}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch packaging materials');
      
      let items = data.items || [];
      if (typeFilter !== 'ALL') {
        items = items.filter((it) => it.packaging_type === typeFilter);
      }
      setPackaging(items);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/master/suppliers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setSuppliersList(data.items || []);
    } catch {
      // Ignore if user lacks permissions
    }
  };

  useEffect(() => {
    fetchPackaging();
    fetchSuppliers();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPackaging();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.code || !form.name) {
      setFormError('Packaging Code and Name are required.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/master/packaging-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Error creating packaging material');

      setNotification({ type: 'success', message: `Packaging material ${data.packaging_material.name} created successfully.` });
      setShowAddModal(false);
      setForm({ code: '', name: '', packaging_type: 'Pouch', unit: 'pieces', preferred_supplier_id: '', min_stock_alert: '100.00', reorder_level: '250.00', avg_unit_cost: '0.00', description: '' });
      fetchPackaging();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/master/packaging-materials/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Error updating packaging material');

      setNotification({ type: 'success', message: `Packaging material ${data.packaging_material.name} updated successfully.` });
      setShowEditModal(false);
      setSelectedItem(null);
      fetchPackaging();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextState = !item.is_active;
    if (!window.confirm(`${nextState ? 'Activate' : 'Deactivate'} ${item.name}?`)) return;

    try {
      const res = await fetch(`/api/master/packaging-materials/${item.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: nextState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Status toggle failed');
      setNotification({ type: 'success', message: data.message });
      fetchPackaging();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEdit = (pm) => {
    setSelectedItem(pm);
    setForm({
      code: pm.code,
      name: pm.name,
      packaging_type: pm.packaging_type,
      unit: pm.unit,
      preferred_supplier_id: pm.preferred_supplier_id || '',
      min_stock_alert: pm.min_stock_alert,
      reorder_level: pm.reorder_level,
      avg_unit_cost: pm.avg_unit_cost,
      description: pm.description || '',
    });
    setShowEditModal(true);
  };

  const openDetail = (pm) => {
    setSelectedItem(pm);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              Module 5: Packing Inventory
            </span>
            <span className="text-xs text-slate-500">Pouches, Boxes & Labels</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Packaging Material Management
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Maintain printed pouches, sweet boxes, corrugated master shippers, unit measurements, and packaging vendors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPackaging}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {canModify && (
            <button
              onClick={() => {
                setFormError(null);
                setForm({ code: '', name: '', packaging_type: 'Pouch', unit: 'pieces', preferred_supplier_id: '', min_stock_alert: '100.00', reorder_level: '250.00', avg_unit_cost: '0.00', description: '' });
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Packaging Material
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search code or packaging name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </form>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {PACKAGING_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Items</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Deactivated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Packaging Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Packaging Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">UOM</th>
                <th className="py-3 px-4">Preferred Supplier</th>
                <th className="py-3 px-4 text-right">Min Stock</th>
                <th className="py-3 px-4 text-right">Reorder Level</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-500">
                    <RefreshCw className="h-4 w-4 animate-spin inline mr-2 text-purple-500" />
                    Loading packaging materials...
                  </td>
                </tr>
              ) : packaging.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-500">
                    No packaging materials found.
                  </td>
                </tr>
              ) : (
                packaging.map((pm) => (
                  <tr key={pm.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{pm.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{pm.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-semibold">
                        {pm.packaging_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold uppercase text-slate-700">{pm.unit}</td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[180px]">
                      {pm.preferred_supplier_name || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">{pm.min_stock_alert} {pm.unit}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">{pm.reorder_level} {pm.unit}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        pm.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {pm.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openDetail(pm)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {canModify && (
                          <>
                            <button
                              onClick={() => openEdit(pm)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                              title="Edit Packaging"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(pm)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                                pm.is_active ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {pm.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PACKAGING MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                Add Packaging Material SKU
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Packaging Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PM-007"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Packaging Type *</label>
                  <select
                    value={form.packaging_type}
                    onChange={(e) => setForm({ ...form, packaging_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="Pouch">Pouch (100g, 200g, 500g, 1kg)</option>
                    <option value="Zip Bag">Zip Bag (Metallized)</option>
                    <option value="Box">Sweet Box (Rigid Board)</option>
                    <option value="Carton Box">Carton Box (Master Corrugated)</option>
                    <option value="Label">Product Label / Sticker</option>
                    <option value="Sealing Tape">Sealing Tape / Band</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Packaging Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500g Fresh Batter Multilayer Printed Pouch"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Unit *</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold uppercase"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Preferred Packaging Supplier</label>
                  <select
                    value={form.preferred_supplier_id}
                    onChange={(e) => setForm({ ...form, preferred_supplier_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50"
                  >
                    <option value="">-- No Preferred Supplier --</option>
                    {suppliersList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    value={form.min_stock_alert}
                    onChange={(e) => setForm({ ...form, min_stock_alert: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={form.reorder_level}
                    onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Micron thickness, barrier layer, printing cylinders..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Create Packaging'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-purple-600">{selectedItem.code}</span>
                <h3 className="text-base font-bold text-slate-900">{selectedItem.name}</h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Packaging Type:</span>
                <span className="font-semibold text-slate-800">{selectedItem.packaging_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Unit:</span>
                <span className="font-bold uppercase text-slate-800">{selectedItem.unit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Preferred Supplier:</span>
                <span className="font-semibold text-slate-800">{selectedItem.preferred_supplier_name || 'None designated'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Min Alert / Reorder Level:</span>
                <span className="font-mono font-bold text-slate-900">{selectedItem.min_stock_alert} / {selectedItem.reorder_level} {selectedItem.unit}</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Specifications:</span>
                <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                  {selectedItem.description || 'No additional specifications registered.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
