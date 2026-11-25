import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users, Search, RefreshCw, Edit, X, Save, AlertTriangle, ShieldCheck
} from 'lucide-react';

const API = '/api/invoicing';

export default function CustomerGstPage() {
  const { token, user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canEdit = ['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'].includes(role);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editingCust, setEditingCust] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/master/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setCustomers(json.data || []);
      else setError(json.message || 'Failed to fetch customers');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleEditClick = (cust) => {
    setEditingCust({
      id: cust.id,
      legal_name: cust.business_name,
      trade_name: cust.business_name,
      gstin: cust.gstin || '',
      place_of_supply_state: cust.state || 'Tamil Nadu',
      place_of_supply_code: cust.state_code || '33',
      registration_type: cust.gstin ? 'REGULAR' : 'UNREGISTERED'
    });
  };

  const handleSaveTaxDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/customers/${editingCust.id}/tax-details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingCust)
      });
      const json = await res.json();
      if (json.success) {
        setEditingCust(null);
        fetchCustomers();
      } else {
        setError(json.message || 'Error updating tax details');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = customers.filter(c =>
    c.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.gstin?.toLowerCase().includes(search.toLowerCase()) ||
    c.state?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-amber-500" /> Customer GST & Place of Supply Registry
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage B2B Buyer GSTINs, State Codes, Place of Supply and Registration Types</p>
        </div>
        <button
          onClick={fetchCustomers}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 w-80">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by customer name, GSTIN, or State..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} customers registered</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3 text-left">Customer Code</th>
                  <th className="px-5 py-3 text-left">Trade / Legal Name</th>
                  <th className="px-5 py-3 text-left">GSTIN</th>
                  <th className="px-5 py-3 text-left">Place of Supply State</th>
                  <th className="px-5 py-3 text-left">State Code</th>
                  <th className="px-5 py-3 text-left">Supply Type</th>
                  <th className="px-5 py-3 text-left">Registration</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => {
                  const isInter = c.state_code && c.state_code !== '33';
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono font-bold text-slate-900">{c.code}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{c.business_name}</td>
                      <td className="px-5 py-3 font-mono text-slate-700">
                        {c.gstin ? (
                          <span className="font-bold text-amber-700">{c.gstin}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unregistered / B2C</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{c.state || 'Tamil Nadu'}</td>
                      <td className="px-5 py-3 font-mono font-bold text-slate-900">{c.state_code || '33'}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isInter ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                          {isInter ? 'INTER-STATE (IGST)' : 'INTRA-STATE (CGST+SGST)'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700">
                          {c.gstin ? 'REGULAR' : 'UNREGISTERED'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {canEdit && (
                          <button
                            onClick={() => handleEditClick(c)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                            title="Edit Tax Details"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCust && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-bold text-slate-900">Configure Customer GST & POS</h2>
              <button onClick={() => setEditingCust(null)}>
                <X className="h-5 w-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>
            <form onSubmit={handleSaveTaxDetails} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  disabled
                  value={editingCust.legal_name}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer GSTIN (15 Digits)</label>
                <input
                  type="text"
                  maxLength="15"
                  placeholder="e.g. 33AABCT9999Z1Z9"
                  value={editingCust.gstin}
                  onChange={e => setEditingCust(p => ({ ...p, gstin: e.target.value.toUpperCase() }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Place of Supply State *</label>
                  <input
                    type="text"
                    required
                    value={editingCust.place_of_supply_state}
                    onChange={e => setEditingCust(p => ({ ...p, place_of_supply_state: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State Code (2 Digits) *</label>
                  <input
                    type="text"
                    maxLength="2"
                    required
                    value={editingCust.place_of_supply_code}
                    onChange={e => setEditingCust(p => ({ ...p, place_of_supply_code: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Type *</label>
                <select
                  value={editingCust.registration_type}
                  onChange={e => setEditingCust(p => ({ ...p, registration_type: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                >
                  <option value="REGULAR">Regular Taxpayer (B2B)</option>
                  <option value="COMPOSITION">Composition Scheme</option>
                  <option value="UNREGISTERED">Unregistered / Consumer (B2C)</option>
                  <option value="SEZ">Special Economic Zone (SEZ)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCust(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl"
                >
                  {saving ? 'Saving...' : 'Save GST Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
