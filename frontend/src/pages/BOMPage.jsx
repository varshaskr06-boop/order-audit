import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X,
  GitBranch, 
  Trash2,
  Wheat,
  Package,
  Clock,
  Sparkles
} from 'lucide-react';

export default function BOMPage() {
  const { token, user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canModify = role === 'ADMIN' || role === 'OWNER';

  const [boms, setBoms] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [rawMaterialsList, setRawMaterialsList] = useState([]);
  const [packagingList, setPackagingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBom, setSelectedBom] = useState(null);

  // BOM Header Form
  const [headerForm, setHeaderForm] = useState({
    product_id: '',
    recipe_name: '',
    bom_version: 'v1.0',
    batch_output_qty: '100.00',
    output_unit: 'PKT',
    effective_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // BOM Items State
  const [itemsForm, setItemsForm] = useState([
    { material_type: 'RAW_MATERIAL', material_id: '', quantity_required: '1.0', unit: 'kg', wastage_percentage: '0.0', notes: '' },
  ]);

  // Versioning Form
  const [versionForm, setVersionForm] = useState({
    new_version: 'v1.1',
    notes: 'Updated recipe proportions',
    batch_output_qty: '100.00',
    output_unit: 'PKT',
  });
  const [versionItems, setVersionItems] = useState([]);

  const [formError, setFormError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBoms = async () => {
    setLoading(true);
    try {
      let url = '/api/master/boms';
      if (statusFilter !== 'ALL') url += `?status=${statusFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch BOM recipes');
      
      let list = data.items || [];
      if (search) {
        const q = search.toLowerCase();
        list = list.filter((b) => 
          (b.recipe_name && b.recipe_name.toLowerCase().includes(q)) ||
          (b.product_name && b.product_name.toLowerCase().includes(q)) ||
          (b.bom_version && b.bom_version.toLowerCase().includes(q))
        );
      }
      setBoms(list);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterDependencies = async () => {
    try {
      const [pRes, rmRes, pmRes] = await Promise.all([
        fetch('/api/master/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/master/raw-materials', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch('/api/master/packaging-materials', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ]);

      if (pRes && pRes.ok) {
        const pData = await pRes.json();
        setProductsList(pData.items || []);
      }
      if (rmRes && rmRes.ok) {
        const rmData = await rmRes.json();
        setRawMaterialsList(rmData.items || []);
      }
      if (pmRes && pmRes.ok) {
        const pmData = await pmRes.json();
        setPackagingList(pmData.items || []);
      }
    } catch (e) {
      console.warn('Failed loading dependency lists:', e);
    }
  };

  useEffect(() => {
    fetchBoms();
    fetchMasterDependencies();
  }, [statusFilter]);

  const handleAddItemRow = (isVersion = false) => {
    const newRow = {
      material_type: 'RAW_MATERIAL',
      material_id: '',
      quantity_required: '1.0',
      unit: 'kg',
      wastage_percentage: '0.0',
      notes: '',
    };
    if (isVersion) {
      setVersionItems([...versionItems, newRow]);
    } else {
      setItemsForm([...itemsForm, newRow]);
    }
  };

  const handleRemoveItemRow = (index, isVersion = false) => {
    if (isVersion) {
      if (versionItems.length <= 1) return;
      setVersionItems(versionItems.filter((_, i) => i !== index));
    } else {
      if (itemsForm.length <= 1) return;
      setItemsForm(itemsForm.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value, isVersion = false) => {
    const targetList = isVersion ? [...versionItems] : [...itemsForm];
    targetList[index][field] = value;

    // Auto set default unit if changing material_id
    if (field === 'material_id') {
      const numId = Number(value);
      if (targetList[index].material_type === 'RAW_MATERIAL') {
        const rm = rawMaterialsList.find((r) => r.id === numId);
        if (rm) targetList[index].unit = rm.unit;
      } else {
        const pm = packagingList.find((p) => p.id === numId);
        if (pm) targetList[index].unit = pm.unit;
      }
    }

    if (isVersion) {
      setVersionItems(targetList);
    } else {
      setItemsForm(targetList);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!headerForm.product_id || !headerForm.recipe_name) {
      setFormError('Finished Product and Recipe Name are required.');
      return;
    }

    // Validate items
    for (const it of itemsForm) {
      if (!it.material_id) {
        setFormError('Please select a material for all items in the list.');
        return;
      }
      if (parseFloat(it.quantity_required) <= 0) {
        setFormError('Quantity required must be greater than zero for all items.');
        return;
      }
    }

    setActionLoading(true);
    try {
      const payload = {
        ...headerForm,
        items: itemsForm,
      };

      const res = await fetch('/api/master/boms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create BOM');

      setNotification({ type: 'success', message: `BOM "${data.bom.recipe_name}" created successfully.` });
      setShowAddModal(false);
      fetchBoms();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openVersionModal = async (bom) => {
    try {
      const res = await fetch(`/api/master/boms/${bom.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const detailedBom = data.bom;

      setSelectedBom(detailedBom);
      setVersionForm({
        new_version: `${detailedBom.bom_version}.1`,
        notes: `Refined recipe formula from ${detailedBom.bom_version}`,
        batch_output_qty: detailedBom.batch_output_qty,
        output_unit: detailedBom.output_unit,
      });
      setVersionItems(detailedBom.items || []);
      setShowVersionModal(true);
    } catch (err) {
      alert(`Could not load BOM details: ${err.message}`);
    }
  };

  const handleVersionSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...versionForm,
        items: versionItems,
      };

      const res = await fetch(`/api/master/boms/${selectedBom.id}/version`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Versioning failed');

      setNotification({ type: 'success', message: data.message });
      setShowVersionModal(false);
      setSelectedBom(null);
      fetchBoms();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = async (bom) => {
    try {
      const res = await fetch(`/api/master/boms/${bom.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSelectedBom(data.bom);
      setShowDetailModal(true);
    } catch (err) {
      alert(`Could not load details: ${err.message}`);
    }
  };

  const handleToggleStatus = async (bom, newStatus) => {
    try {
      const res = await fetch(`/api/master/boms/${bom.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, is_active: newStatus === 'ACTIVE' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Status toggle failed');
      setNotification({ type: 'success', message: data.message });
      fetchBoms();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Module 6: Standard Recipes
            </span>
            <span className="text-xs text-slate-500">Bill of Materials (BOM)</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Bill of Materials (BOM) Management
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Standard production batch formulas linking raw materials, packaging, and expected wastage percentages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBoms}
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
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Create BOM Recipe
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

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search recipe or finished good..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Versions</option>
            <option value="ACTIVE">Active Versions</option>
            <option value="DRAFT">Drafts</option>
            <option value="SUPERSEDED">Superseded / History</option>
            <option value="INACTIVE">Deactivated</option>
          </select>
        </div>
      </div>

      {/* BOM Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">BOM ID</th>
                <th className="py-3 px-4">Recipe Formula Name</th>
                <th className="py-3 px-4">Finished Good (SKU)</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Batch Output</th>
                <th className="py-3 px-4 text-center">Items Count</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">
                    <RefreshCw className="h-4 w-4 animate-spin inline mr-2 text-amber-500" />
                    Loading BOM recipes...
                  </td>
                </tr>
              ) : boms.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">
                    No BOM recipes found.
                  </td>
                </tr>
              ) : (
                boms.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">BOM-00{b.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{b.recipe_name}</td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-semibold">{b.product_name}</div>
                      <span className="font-mono text-[10px] text-slate-400">{b.product_sku}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-mono font-bold text-slate-800 text-[10px]">
                        {b.bom_version}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {b.batch_output_qty} {b.output_unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-[10px]">
                        {b.items_count} materials
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        b.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : b.status === 'SUPERSEDED'
                          ? 'bg-slate-100 text-slate-600 border-slate-300'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openDetail(b)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="View Full Ingredients"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {canModify && (
                          <>
                            <button
                              onClick={() => openVersionModal(b)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 inline-flex items-center gap-1"
                              title="Create New Version"
                            >
                              <GitBranch className="h-3 w-3" />
                              New Version
                            </button>

                            {b.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleToggleStatus(b, 'INACTIVE')}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(b, 'ACTIVE')}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                              >
                                Activate
                              </button>
                            )}
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

      {/* CREATE BOM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-amber-600" />
                Create Standard Bill of Materials (BOM)
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

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              
              {/* Header Fields */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Finished Good (Product) *</label>
                  <select
                    required
                    value={headerForm.product_id}
                    onChange={(e) => setHeaderForm({ ...headerForm, product_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-bold"
                  >
                    <option value="">-- Select Product SKU --</option>
                    {productsList.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Recipe Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard 100-Pack Fresh Batter Batch"
                    value={headerForm.recipe_name}
                    onChange={(e) => setHeaderForm({ ...headerForm, recipe_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">BOM Version</label>
                  <input
                    type="text"
                    value={headerForm.bom_version}
                    onChange={(e) => setHeaderForm({ ...headerForm, bom_version: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Standard Output Quantity</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="1"
                      value={headerForm.batch_output_qty}
                      onChange={(e) => setHeaderForm({ ...headerForm, batch_output_qty: e.target.value })}
                      className="w-2/3 px-3 py-2 border rounded-lg bg-white font-mono font-bold"
                    />
                    <select
                      value={headerForm.output_unit}
                      onChange={(e) => setHeaderForm({ ...headerForm, output_unit: e.target.value })}
                      className="w-1/3 px-2 py-2 border rounded-lg bg-white font-bold"
                    >
                      <option value="PKT">PKT</option>
                      <option value="BOX">BOX</option>
                      <option value="KG">KG</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Wheat className="h-4 w-4 text-amber-600" />
                    Required Ingredients & Packaging Materials
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAddItemRow(false)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] inline-flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Material
                  </button>
                </div>

                <div className="space-y-2">
                  {itemsForm.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      
                      {/* Type selector */}
                      <div className="col-span-3">
                        <select
                          value={item.material_type}
                          onChange={(e) => {
                            handleItemChange(index, 'material_type', e.target.value, false);
                            handleItemChange(index, 'material_id', '', false);
                          }}
                          className="w-full px-2 py-1.5 border rounded-lg bg-white font-semibold text-[11px]"
                        >
                          <option value="RAW_MATERIAL">Raw Material</option>
                          <option value="PACKAGING">Packaging</option>
                        </select>
                      </div>

                      {/* Material selector */}
                      <div className="col-span-4">
                        <select
                          required
                          value={item.material_id}
                          onChange={(e) => handleItemChange(index, 'material_id', e.target.value, false)}
                          className="w-full px-2 py-1.5 border rounded-lg bg-white font-bold text-[11px]"
                        >
                          <option value="">-- Choose Item --</option>
                          {item.material_type === 'RAW_MATERIAL'
                            ? rawMaterialsList.map((rm) => (
                                <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                              ))
                            : packagingList.map((pm) => (
                                <option key={pm.id} value={pm.id}>{pm.name} ({pm.unit})</option>
                              ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.001"
                          required
                          placeholder="Qty"
                          value={item.quantity_required}
                          onChange={(e) => handleItemChange(index, 'quantity_required', e.target.value, false)}
                          className="w-full px-2 py-1.5 border rounded-lg bg-white font-mono font-bold text-[11px]"
                        />
                      </div>

                      {/* Unit */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          readOnly
                          value={item.unit}
                          className="w-full px-1 py-1.5 border rounded-lg bg-slate-100 font-bold uppercase text-[10px] text-center"
                        />
                      </div>

                      {/* Wastage % */}
                      <div className="col-span-1">
                        <input
                          type="number"
                          step="0.5"
                          title="Expected Wastage %"
                          placeholder="Wastage%"
                          value={item.wastage_percentage}
                          onChange={(e) => handleItemChange(index, 'wastage_percentage', e.target.value, false)}
                          className="w-full px-1 py-1.5 border rounded-lg bg-white font-mono text-[11px] text-center"
                        />
                      </div>

                      {/* Remove */}
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index, false)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Process Instructions & Recipe Notes</label>
                <textarea
                  rows="2"
                  placeholder="Soaking hours, grinding parameters, baking temperatures, hygiene checklist..."
                  value={headerForm.notes}
                  onChange={(e) => setHeaderForm({ ...headerForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
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
                  {actionLoading ? 'Saving BOM...' : 'Save BOM Recipe'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VERSIONING MODAL */}
      {showVersionModal && selectedBom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-purple-600" />
                Create New Version from {selectedBom.bom_version}
              </h3>
              <button onClick={() => setShowVersionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs">
              <p className="font-bold">Historical Integrity Guarantee:</p>
              <p>Creating this version will preserve version {selectedBom.bom_version} as <strong>SUPERSEDED</strong> for auditing. The new version will be set to <strong>ACTIVE</strong>.</p>
            </div>

            <form onSubmit={handleVersionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">New Version Label *</label>
                  <input
                    type="text"
                    required
                    value={versionForm.new_version}
                    onChange={(e) => setVersionForm({ ...versionForm, new_version: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Batch Output Qty</label>
                  <input
                    type="number"
                    value={versionForm.batch_output_qty}
                    onChange={(e) => setVersionForm({ ...versionForm, batch_output_qty: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Output Unit</label>
                  <input
                    type="text"
                    value={versionForm.output_unit}
                    onChange={(e) => setVersionForm({ ...versionForm, output_unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold uppercase"
                  />
                </div>
              </div>

              {/* Version Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 uppercase text-[11px]">Formula Adjustments</span>
                  <button
                    type="button"
                    onClick={() => handleAddItemRow(true)}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold text-[11px] inline-flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {versionItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="col-span-3">
                        <select
                          value={item.material_type}
                          onChange={(e) => {
                            handleItemChange(index, 'material_type', e.target.value, true);
                            handleItemChange(index, 'material_id', '', true);
                          }}
                          className="w-full px-2 py-1.5 border rounded-lg bg-white font-semibold text-[11px]"
                        >
                          <option value="RAW_MATERIAL">Raw Material</option>
                          <option value="PACKAGING">Packaging</option>
                        </select>
                      </div>
                      <div className="col-span-4">
                        <select
                          required
                          value={item.material_id}
                          onChange={(e) => handleItemChange(index, 'material_id', e.target.value, true)}
                          className="w-full px-2 py-1.5 border rounded-lg bg-white font-bold text-[11px]"
                        >
                          <option value="">-- Choose Item --</option>
                          {item.material_type === 'RAW_MATERIAL'
                            ? rawMaterialsList.map((rm) => (
                                <option key={rm.id} value={rm.id}>{rm.name}</option>
                              ))
                            : packagingList.map((pm) => (
                                <option key={pm.id} value={pm.id}>{pm.name}</option>
                              ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.001"
                          required
                          value={item.quantity_required}
                          onChange={(e) => handleItemChange(index, 'quantity_required', e.target.value, true)}
                          className="w-full px-2 py-1.5 border rounded-lg bg-white font-mono font-bold text-[11px]"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="text"
                          readOnly
                          value={item.unit}
                          className="w-full px-1 py-1.5 border rounded-lg bg-slate-100 font-bold uppercase text-[10px] text-center"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          step="0.5"
                          value={item.wastage_percentage}
                          onChange={(e) => handleItemChange(index, 'wastage_percentage', e.target.value, true)}
                          className="w-full px-1 py-1.5 border rounded-lg bg-white font-mono text-[11px] text-center"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index, true)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Reason for New Version / Engineering Change Note</label>
                <textarea
                  rows="2"
                  value={versionForm.notes}
                  onChange={(e) => setVersionForm({ ...versionForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVersionModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Creating Version...' : 'Deploy Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedBom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-600">BOM-00{selectedBom.id}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 font-mono font-bold text-[10px] text-slate-800">
                    {selectedBom.bom_version}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedBom.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedBom.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedBom.recipe_name}</h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Target Finished Good:</span>
                  <div className="font-bold text-slate-900">{selectedBom.product_name} ({selectedBom.product_sku})</div>
                </div>
                <div>
                  <span className="text-slate-500">Standard Batch Output:</span>
                  <div className="font-mono font-bold text-slate-900">{selectedBom.batch_output_qty} {selectedBom.output_unit}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-2">Ingredients & Packaging Breakdown</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase">
                      <tr>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Material Name</th>
                        <th className="py-2 px-3 text-right">Required Qty</th>
                        <th className="py-2 px-3 text-right">Wastage %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedBom.items || []).map((it) => (
                        <tr key={it.id}>
                          <td className="py-2 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              it.material_type === 'RAW_MATERIAL' ? 'bg-amber-50 text-amber-800' : 'bg-purple-50 text-purple-800'
                            }`}>
                              {it.material_type === 'RAW_MATERIAL' ? 'Raw Mat' : 'Packaging'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {it.material_name}
                            <div className="font-mono text-[10px] text-slate-400">{it.material_code}</div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {it.quantity_required} {it.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {it.wastage_percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedBom.notes && (
                <div>
                  <span className="text-slate-500 block mb-1">Recipe / Production Notes:</span>
                  <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                    {selectedBom.notes}
                  </p>
                </div>
              )}
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
