import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2, PlusCircle, RefreshCw, AlertTriangle, CheckCircle2,
  DollarSign, X
} from 'lucide-react';

const API = '/api/payments';

export default function BankAccountsPage() {
  const { token, user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const role = (user?.role || '').toUpperCase();
  const canManage = ['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role);

  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type: 'BANK',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    branch_name: '',
    opening_balance: ''
  });

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setAccounts(json.data);
      else setError(json.message || 'Failed to load accounts');
    } catch (e) {
      setError('Network error fetching accounts');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Account ${json.data?.account_name} created successfully!`);
        setModalOpen(false);
        setFormData({
          account_code: '', account_name: '', account_type: 'BANK',
          bank_name: '', account_number: '', ifsc_code: '', branch_name: '', opening_balance: ''
        });
        fetchAccounts();
      } else {
        setError(json.message || 'Failed to create account');
      }
    } catch (e) {
      setError('Network error creating account');
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cash &amp; Bank Accounts Directory</h1>
          <p className="text-sm text-slate-500">
            Module 3: Commercial Banking Facilities, Petty Cash Desks &amp; Ledger Balances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAccounts}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {canManage && (
            <button
              onClick={() => { setModalOpen(true); setError(''); setSuccess(''); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
            >
              <PlusCircle className="h-4 w-4" /> Add Account
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Accounts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            Loading accounts...
          </div>
        ) : (
          accounts.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-emerald-300 transition">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`px-2 py-0.5 text-[11px] font-bold rounded ${a.account_type === 'BANK' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {a.account_type}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-2">{a.account_name}</h3>
                  <p className="text-xs font-mono text-slate-500">{a.account_code}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500">Current Ledger Balance</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{fmt(a.current_balance)}</p>
              </div>

              {a.account_type === 'BANK' && (
                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                  <p><span className="font-semibold text-slate-500">Bank:</span> {a.bank_name}</p>
                  <p><span className="font-semibold text-slate-500">A/C Number:</span> <span className="font-mono">{a.account_number}</span></p>
                  <p><span className="font-semibold text-slate-500">IFSC:</span> <span className="font-mono">{a.ifsc_code}</span></p>
                  <p><span className="font-semibold text-slate-500">Branch:</span> {a.branch_name}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Account Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Enroll Company Account
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Account Display Name *</label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  placeholder="e.g. HDFC Operations Current A/C"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Account Type *</label>
                  <select
                    value={formData.account_type}
                    onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                  >
                    <option value="BANK">Bank Account</option>
                    <option value="CASH">Cash Desk / Petty Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {formData.account_type === 'BANK' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={formData.ifsc_code}
                        onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Branch Name</label>
                      <input
                        type="text"
                        value={formData.branch_name}
                        onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
