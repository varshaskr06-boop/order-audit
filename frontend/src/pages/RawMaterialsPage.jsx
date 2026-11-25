import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Wheat, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X,
  Truck,
  Scale,
  DollarSign
} from 'lucide-react';

const CATEGORIES = ['ALL', 'Grains & Pulses', 'Oils & Fats', 'Spices & Seasoning', 'Dairy & Fats', 'Seasoning', 'Sweeteners'];
const UNITS = ['kg', 'g', 'litre', 'ml', 'pieces'];

export default function RawMaterialsPage() {
  const { token, user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canModify = role === 'ADMIN' || role === 'OWNER';

  const [materials, setMaterials] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Form State
  const [form, setForm] = useState({
    code: '',
    name: '',
    category: 'Grains & Pulses',
    unit: 'kg',
    preferred_supplier_id: '',
    min_stock_alert: '10.00',
    reorder_level: '25.00',
    avg_unit_cost: '0.00',
    description: '',
  });
  const [formError, setFormError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      let url = `/api/master/raw-materials?search=${encodeURIComponent(search)}`;
      if (category !== 'ALL') url += `&category=${encodeURIComponent(category)}`;
      if (statusFilter !== 'ALL') url += `&is_active=${statusFilter === 'ACTIVE'}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch raw materials');
      setMaterials(data.items || []);
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
      // Ignore if user lacks permissions to view suppliers
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchSuppliers();
  }, [category, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMaterials();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.code || !form.name) {
      setFormError('Material Code and Name are required.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/master/raw-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Error creating raw material');

      setNotification({ type: 'success', message: `Raw material ${data.raw_material.name} added successfully.` });
      setShowAddModal(false);
      setForm({ code: '', name: '', category: 'Grains & Pulses', unit: 'kg', preferred_supplier_id: '', min_stock_alert: '10.00', reorder_level: '25.00', avg_unit_cost: '0.00', description: '' });
      fetchMaterials();
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
      const res = await fetch(`/api/master/raw-materials/${selectedMaterial.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Error updating material');

      setNotification({ type: 'success', message: `Material ${data.raw_material.name} updated successfully.` });
      setShowEditModal(false);
      setSelectedMaterial(null);
      fetchMaterials();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (rm) => {
    const nextState = !rm.is_active;
    if (!window.confirm(`${nextState ? 'Activate' : 'Deactivate'} ${rm.name}?`)) return;

    try {
      const res = await fetch(`/api/master/raw-materials/${rm.id}/status`, {
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
      fetchMaterials();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEdit = (rm) => {
    setSelectedMaterial(rm);
    setForm({
      code: rm.code,
      name: rm.name,
      category: rm.category,
      unit: rm.unit,
      preferred_supplier_id: rm.preferred_supplier_id || '',
      min_stock_alert: rm.min_stock_alert,
      reorder_level: rm.reorder_level,
      avg_unit_cost: rm.avg_unit_cost,
      description: rm.description || '',
    });
    setShowEditModal(true);
  };

  const openDetail = (rm) => {
    setSelectedMaterial(rm);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Module 4: Ingredients Catalog
            </span>
            <span className="text-xs text-slate-500">Agro Commodities & Spices</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Raw Material Management
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Maintain food grains (Ponni rice, urad dal, gram flour), spices, ghee, oil, units of measurement, and preferred millers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMaterials}
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
                setForm({ code: '', name: '', category: 'Grains & Pulses', unit: 'kg', preferred_supplier_id: '', min_stock_alert: '10.00', reorder_level: '25.00', avg_unit_cost: '0.00', description: '' });
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Raw Material
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
            placeholder="Search material code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </form>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Materials</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Deactivated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Raw Materials Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Material Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">UOM</th>
                <th className="py-3 px-4">Preferred Vendor</th>
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
                    <RefreshCw className="h-4 w-4 animate-spin inline mr-2 text-amber-500" />
                    Loading raw materials...
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-500">
                    No raw materials found.
                  </td>
                </tr>
              ) : (
                materials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{m.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {m.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold uppercase text-slate-700">{m.unit}</td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[180px]">
                      {m.preferred_supplier_name || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">{m.min_stock_alert} {m.unit}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">{m.reorder_level} {m.unit}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        m.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openDetail(m)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {canModify && (
                          <>
                            <button
                              onClick={() => openEdit(m)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                              title="Edit Material"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(m)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                                m.is_active ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {m.is_active ? 'Deactivate' : 'Activate'}
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

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wheat className="h-5 w-5 text-amber-600" />
                Add New Raw Material / Ingredient
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
                  <label className="block font-bold text-slate-700 uppercase mb-1">Material Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RM-012"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="Grains & Pulses">Grains & Pulses</option>
                    <option value="Oils & Fats">Oils & Fats</option>
                    <option value="Spices & Seasoning">Spices & Seasoning</option>
                    <option value="Dairy & Fats">Dairy & Fats</option>
                    <option value="Seasoning">Seasoning</option>
                    <option value="Sweeteners">Sweeteners</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kashmiri Chilli Powder"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Unit of Measurement (UOM) *</label>
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
                  <label className="block font-bold text-slate-700 uppercase mb-1">Preferred Supplier</label>
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
                  <label className="block font-bold text-slate-700 uppercase mb-1">Minimum Stock Level</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.min_stock_alert}
                    onChange={(e) => setForm({ ...form, min_stock_alert: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Reorder Level</label>
                  <input
                    type="number"
                    step="0.1"
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
                  placeholder="Grading, moisture specifications, storage guidelines..."
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
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Create Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-amber-600">{selectedMaterial.code}</span>
                <h3 className="text-base font-bold text-slate-900">{selectedMaterial.name}</h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800">{selectedMaterial.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Measurement Unit:</span>
                <span className="font-bold uppercase text-slate-800">{selectedMaterial.unit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Preferred Supplier:</span>
                <span className="font-semibold text-slate-800">{selectedMaterial.preferred_supplier_name || 'None designated'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Min Stock / Reorder Alert:</span>
                <span className="font-mono font-bold text-slate-900">{selectedMaterial.min_stock_alert} / {selectedMaterial.reorder_level} {selectedMaterial.unit}</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Specifications:</span>
                <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                  {selectedMaterial.description || 'No additional specifications registered.'}
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
