import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X,
  CreditCard,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

export default function CustomersPage() {
  const { token, user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canModify = role === 'ADMIN' || role === 'OWNER';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form State
  const [form, setForm] = useState({
    code: '',
    business_name: '',
    contact_person: '',
    phone: '',
    email: '',
    billing_address: '',
    shipping_address: '',
    state: 'Tamil Nadu',
    state_code: '33',
    gstin: '',
    customer_type: 'Supermarket Retailer',
    credit_limit: '50000.00',
  });
  const [formError, setFormError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let url = `/api/master/customers?search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'ALL') url += `&is_active=${statusFilter === 'ACTIVE'}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch customers');
      setCustomers(data.items || []);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.code || !form.business_name) {
      setFormError('Customer Code and Business Name are required.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/master/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Error creating customer');

      setNotification({ type: 'success', message: `Customer ${data.customer.business_name} created successfully.` });
      setShowAddModal(false);
      setForm({ code: '', business_name: '', contact_person: '', phone: '', email: '', billing_address: '', shipping_address: '', state: 'Tamil Nadu', state_code: '33', gstin: '', customer_type: 'Supermarket Retailer', credit_limit: '50000.00' });
      fetchCustomers();
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
      const res = await fetch(`/api/master/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Error updating customer');

      setNotification({ type: 'success', message: `Customer ${data.customer.business_name} updated successfully.` });
      setShowEditModal(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (cust) => {
    const nextState = !cust.is_active;
    if (!window.confirm(`${nextState ? 'Activate' : 'Deactivate'} ${cust.business_name}?`)) return;

    try {
      const res = await fetch(`/api/master/customers/${cust.id}/status`, {
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
      fetchCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEdit = (c) => {
    setSelectedCustomer(c);
    setForm({
      code: c.code,
      business_name: c.business_name,
      contact_person: c.contact_person || '',
      phone: c.phone || '',
      email: c.email || '',
      billing_address: c.billing_address || '',
      shipping_address: c.shipping_address || '',
      state: c.state || 'Tamil Nadu',
      state_code: c.state_code || '33',
      gstin: c.gstin || '',
      customer_type: c.customer_type || 'Supermarket Retailer',
      credit_limit: c.credit_limit || '50000.00',
    });
    setShowEditModal(true);
  };

  const openDetail = (c) => {
    setSelectedCustomer(c);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Module 2: B2B Accounts
            </span>
            <span className="text-xs text-slate-500">Retailers & Distributors</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Customer Management
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Maintain supermarket accounts, provision stores, state jurisdiction codes (TN 33 vs Interstate), and credit limits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCustomers}
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
                setForm({ code: '', business_name: '', contact_person: '', phone: '', email: '', billing_address: '', shipping_address: '', state: 'Tamil Nadu', state_code: '33', gstin: '', customer_type: 'Supermarket Retailer', credit_limit: '50000.00' });
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Customer
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
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Accounts</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Customer Business Name</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">State Jurisdiction</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4 text-right">Credit Limit (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-500">
                    <RefreshCw className="h-4 w-4 animate-spin inline mr-2 text-blue-500" />
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-500">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.business_name}</td>
                    <td className="py-3 px-4 text-slate-600">{c.contact_person || '—'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{c.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.state_code === '33' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {c.state} ({c.state_code})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 font-semibold">{c.gstin || 'Unregistered'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      ₹{parseFloat(c.credit_limit || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        c.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openDetail(c)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {canModify && (
                          <>
                            <button
                              onClick={() => openEdit(c)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                              title="Edit Customer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(c)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                                c.is_active ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {c.is_active ? 'Deactivate' : 'Activate'}
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

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Add New Retail / Wholesale Customer
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
                  <label className="block font-bold text-slate-700 uppercase mb-1">Customer Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CUST-005"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Customer Type</label>
                  <select
                    value={form.customer_type}
                    onChange={(e) => setForm({ ...form, customer_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="Supermarket Retailer">Supermarket Retailer</option>
                    <option value="Wholesale Distributor">Wholesale Distributor</option>
                    <option value="Provision Store">Provision Store</option>
                    <option value="Interstate Buyer">Interstate Buyer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nellai Grand Supermarket"
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. R. Chelladurai"
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 94433 55555"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">GSTIN (15 Digits)</label>
                  <input
                    type="text"
                    placeholder="33AABCN9988E1Z2"
                    value={form.gstin}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    step="1000"
                    placeholder="50000"
                    value={form.credit_limit}
                    onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">State</label>
                  <select
                    value={form.state}
                    onChange={(e) => {
                      const st = e.target.value;
                      let code = '33';
                      if (st === 'Karnataka') code = '29';
                      if (st === 'Kerala') code = '32';
                      if (st === 'Andhra Pradesh') code = '37';
                      setForm({ ...form, state: st, state_code: code });
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-semibold"
                  >
                    <option value="Tamil Nadu">Tamil Nadu (33 - CGST/SGST)</option>
                    <option value="Karnataka">Karnataka (29 - IGST)</option>
                    <option value="Kerala">Kerala (32 - IGST)</option>
                    <option value="Andhra Pradesh">Andhra Pradesh (37 - IGST)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">State Code</label>
                  <input
                    type="text"
                    readOnly
                    value={form.state_code}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-100 font-mono font-bold text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Billing Address</label>
                <textarea
                  rows="2"
                  placeholder="Street, Landmark, District, Pincode"
                  value={form.billing_address}
                  onChange={(e) => setForm({ ...form, billing_address: e.target.value })}
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
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Edit Customer: {selectedCustomer.code}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={form.gstin}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={form.credit_limit}
                    onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Billing Address</label>
                <textarea
                  rows="2"
                  value={form.billing_address}
                  onChange={(e) => setForm({ ...form, billing_address: e.target.value })}
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
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{selectedCustomer.code}</span>
                <h3 className="text-base font-bold text-slate-900">{selectedCustomer.business_name}</h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Contact Person:</span>
                <span className="font-semibold text-slate-800">{selectedCustomer.contact_person || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono font-semibold text-slate-800">{selectedCustomer.phone || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">GSTIN:</span>
                <span className="font-mono font-bold text-slate-900">{selectedCustomer.gstin || 'Unregistered'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tax Type:</span>
                <span className="font-bold text-blue-700">
                  {selectedCustomer.state_code === '33' ? 'Tamil Nadu Intrastate (CGST + SGST)' : 'Interstate Supply (IGST)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Credit Limit:</span>
                <span className="font-mono font-bold text-slate-900">₹{parseFloat(selectedCustomer.credit_limit).toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Billing & Delivery Address:</span>
                <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                  {selectedCustomer.billing_address}
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
