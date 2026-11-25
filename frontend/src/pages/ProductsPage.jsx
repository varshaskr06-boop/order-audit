import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  X,
  Tag,
  DollarSign
} from 'lucide-react';

const CATEGORIES = ['ALL', 'Fresh Batter', 'Snacks & Savouries', 'Traditional Sweets', 'Appalam & Papads'];

export default function ProductsPage() {
  const { token, user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canModify = role === 'ADMIN' || role === 'OWNER';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form State
  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: 'Fresh Batter',
    pack_size: '1 KG Pouch',
    unit: 'PKT',
    selling_price: '',
    gst_rate: '5.00',
    hsn_code: '2106',
    description: '',
  });
  const [formError, setFormError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/master/products?search=${encodeURIComponent(search)}`;
      if (category !== 'ALL') url += `&category=${encodeURIComponent(category)}`;
      if (statusFilter !== 'ALL') url += `&is_active=${statusFilter === 'ACTIVE'}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch products');
      setProducts(data.items || []);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.sku || !form.name || !form.selling_price) {
      setFormError('Product SKU, Name, and Selling Price are required.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/master/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Error creating product');

      setNotification({ type: 'success', message: `Product ${data.product.name} created successfully.` });
      setShowAddModal(false);
      setForm({ sku: '', name: '', category: 'Fresh Batter', pack_size: '1 KG Pouch', unit: 'PKT', selling_price: '', gst_rate: '5.00', hsn_code: '2106', description: '' });
      fetchProducts();
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
      const res = await fetch(`/api/master/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Error updating product');

      setNotification({ type: 'success', message: `Product ${data.product.name} updated successfully.` });
      setShowEditModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (prod) => {
    const nextState = !prod.is_active;
    if (!window.confirm(`${nextState ? 'Activate' : 'Deactivate'} ${prod.name}?`)) return;

    try {
      const res = await fetch(`/api/master/products/${prod.id}/status`, {
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
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEdit = (p) => {
    setSelectedProduct(p);
    setForm({
      sku: p.sku,
      name: p.name,
      category: p.category,
      pack_size: p.pack_size,
      unit: p.unit,
      selling_price: p.selling_price,
      gst_rate: p.gst_rate,
      hsn_code: p.hsn_code,
      description: p.description || '',
    });
    setShowEditModal(true);
  };

  const openDetail = (p) => {
    setSelectedProduct(p);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Module 1: Finished Goods
            </span>
            <span className="text-xs text-slate-500">Master Catalog</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Product Management
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Maintain manufactured South Indian food SKUs, HSN codes, packet sizes, and GST tax brackets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
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
                setForm({ sku: '', name: '', category: 'Fresh Batter', pack_size: '1 KG Pouch', unit: 'PKT', selling_price: '', gst_rate: '5.00', hsn_code: '2106', description: '' });
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
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
            placeholder="Search by SKU or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 text-xs">
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
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Deactivated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Pack Size</th>
                <th className="py-3 px-4">HSN</th>
                <th className="py-3 px-4">GST Rate</th>
                <th className="py-3 px-4 text-right">Price (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-500">
                    <RefreshCw className="h-4 w-4 animate-spin inline mr-2 text-amber-500" />
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-500">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.sku}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.pack_size}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.hsn_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{p.gst_rate}%</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{parseFloat(p.selling_price).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openDetail(p)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {canModify && (
                          <>
                            <button
                              onClick={() => openEdit(p)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                              title="Edit Product"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(p)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                                p.is_active ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {p.is_active ? 'Deactivate' : 'Activate'}
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

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-amber-600" />
                Add New Product SKU
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
                  <label className="block font-bold text-slate-700 uppercase mb-1">Product SKU / Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FG-006"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 focus:bg-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 focus:bg-white font-bold"
                  >
                    <option value="Fresh Batter">Fresh Batter</option>
                    <option value="Snacks & Savouries">Snacks & Savouries</option>
                    <option value="Traditional Sweets">Traditional Sweets</option>
                    <option value="Appalam & Papads">Appalam & Papads</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Garlic & Pepper Kai Murukku (200g)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 focus:bg-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Pack Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 200g Packet"
                    value={form.pack_size}
                    onChange={(e) => setForm({ ...form, pack_size: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="PKT">PKT (Packet)</option>
                    <option value="BOX">BOX (Box)</option>
                    <option value="TUB">TUB (Tub)</option>
                    <option value="KG">KG (Kilogram)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="75.00"
                    value={form.selling_price}
                    onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">HSN Code</label>
                  <input
                    type="text"
                    placeholder="2106"
                    value={form.hsn_code}
                    onChange={(e) => setForm({ ...form, hsn_code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">GST Rate (%)</label>
                  <select
                    value={form.gst_rate}
                    onChange={(e) => setForm({ ...form, gst_rate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="0.00">0% (Nil)</option>
                    <option value="5.00">5% (CGST 2.5% + SGST 2.5%)</option>
                    <option value="12.00">12% (CGST 6% + SGST 6%)</option>
                    <option value="18.00">18% (CGST 9% + SGST 9%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Ingredients, manufacturing process, storage instructions..."
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
                  {actionLoading ? 'Saving...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit className="h-5 w-5 text-amber-600" />
                Edit Product: {selectedProduct.sku}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="Fresh Batter">Fresh Batter</option>
                    <option value="Snacks & Savouries">Snacks & Savouries</option>
                    <option value="Traditional Sweets">Traditional Sweets</option>
                    <option value="Appalam & Papads">Appalam & Papads</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.selling_price}
                    onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Pack Size</label>
                  <input
                    type="text"
                    value={form.pack_size}
                    onChange={(e) => setForm({ ...form, pack_size: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">GST Rate (%)</label>
                  <select
                    value={form.gst_rate}
                    onChange={(e) => setForm({ ...form, gst_rate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="0.00">0%</option>
                    <option value="5.00">5%</option>
                    <option value="12.00">12%</option>
                    <option value="18.00">18%</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows="2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-amber-600">{selectedProduct.sku}</span>
                <h3 className="text-base font-bold text-slate-900">{selectedProduct.name}</h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800">{selectedProduct.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Pack Size / Unit:</span>
                <span className="font-semibold text-slate-800">{selectedProduct.pack_size} ({selectedProduct.unit})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Selling Price:</span>
                <span className="font-mono font-bold text-slate-900">₹{parseFloat(selectedProduct.selling_price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">HSN & GST Bracket:</span>
                <span className="font-semibold text-slate-800">{selectedProduct.hsn_code} ({selectedProduct.gst_rate}%)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Status:</span>
                <span className={`font-bold ${selectedProduct.is_active ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {selectedProduct.is_active ? 'Active for Sales & Production' : 'Deactivated'}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Description:</span>
                <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedProduct.description || 'No description provided.'}
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
