import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Scale, Download, RefreshCw, AlertTriangle, Users, Truck
} from 'lucide-react';

const API = '/api/payments';

export default function AgingReportsPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState('CUSTOMERS');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAging = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = tab === 'CUSTOMERS' ? 'customer-aging' : 'supplier-aging';
      const res = await fetch(`${API}/reports/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || 'Failed to load aging data');
    } catch (e) {
      setError('Network error loading aging reports');
    } finally {
      setLoading(false);
    }
  }, [token, tab]);

  useEffect(() => { fetchAging(); }, [fetchAging]);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalOverdue = data.reduce((s, d) => s + (d.bucket_0_30 + d.bucket_31_60 + d.bucket_61_90 + d.bucket_90_plus), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aging Schedule Analysis</h1>
          <p className="text-sm text-slate-500">
            Module 5: 30 / 60 / 90 / 90+ Day Aging Buckets calculated strictly from Invoice Due Dates
          </p>
        </div>
        <button
          onClick={fetchAging}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('CUSTOMERS')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition ${
              tab === 'CUSTOMERS' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="h-4 w-4" /> Customer Receivables Aging
          </button>
          <button
            onClick={() => setTab('SUPPLIERS')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition ${
              tab === 'SUPPLIERS' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Truck className="h-4 w-4" /> Supplier Payables Aging
          </button>
        </div>
        <div className="px-4 text-xs font-semibold text-rose-700">
          Total Overdue Debt: <span className="text-base font-bold">{fmt(totalOverdue)}</span>
        </div>
      </div>

      {/* Aging Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-semibold">Current (Not Due)</p>
          <p className="text-xl font-bold text-slate-800 mt-1">
            {fmt(data.reduce((s, d) => s + (d.not_due || 0), 0))}
          </p>
          <p className="text-[11px] text-slate-400">Within payment credit terms</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-emerald-600 uppercase font-semibold">1 – 30 Days Overdue</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            {fmt(data.reduce((s, d) => s + (d.bucket_0_30 || 0), 0))}
          </p>
          <p className="text-[11px] text-slate-400">Mild overdue</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-amber-600 uppercase font-semibold">31 – 60 Days Overdue</p>
          <p className="text-xl font-bold text-amber-700 mt-1">
            {fmt(data.reduce((s, d) => s + (d.bucket_31_60 || 0), 0))}
          </p>
          <p className="text-[11px] text-slate-400">Follow-up reminder sent</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-orange-600 uppercase font-semibold">61 – 90 Days Overdue</p>
          <p className="text-xl font-bold text-orange-700 mt-1">
            {fmt(data.reduce((s, d) => s + (d.bucket_61_90 || 0), 0))}
          </p>
          <p className="text-[11px] text-slate-400">Critical credit review</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-rose-600 uppercase font-semibold">&gt; 90 Days (Default Risk)</p>
          <p className="text-xl font-bold text-rose-700 mt-1">
            {fmt(data.reduce((s, d) => s + (d.bucket_90_plus || 0), 0))}
          </p>
          <p className="text-[11px] text-slate-400">Dispatch hold triggered</p>
        </div>
      </div>

      {/* Aging Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3">{tab === 'CUSTOMERS' ? 'Customer Account' : 'Supplier Account'}</th>
                <th className="px-6 py-3 text-right">Not Due</th>
                <th className="px-6 py-3 text-right text-emerald-700">1–30 Days</th>
                <th className="px-6 py-3 text-right text-amber-700">31–60 Days</th>
                <th className="px-6 py-3 text-right text-orange-700">61–90 Days</th>
                <th className="px-6 py-3 text-right text-rose-700">&gt;90 Days</th>
                <th className="px-6 py-3 text-right font-bold">Total Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    Computing aging buckets...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    No overdue accounts in this category.
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-semibold text-slate-900">
                      {tab === 'CUSTOMERS' ? row.customer_name : row.supplier_name}
                    </td>
                    <td className="px-6 py-3 text-right text-slate-600">{fmt(row.not_due)}</td>
                    <td className="px-6 py-3 text-right text-emerald-700 font-medium">{fmt(row.bucket_0_30)}</td>
                    <td className="px-6 py-3 text-right text-amber-700 font-medium">{fmt(row.bucket_31_60)}</td>
                    <td className="px-6 py-3 text-right text-orange-700 font-semibold">{fmt(row.bucket_61_90)}</td>
                    <td className="px-6 py-3 text-right text-rose-700 font-bold">{fmt(row.bucket_90_plus)}</td>
                    <td className="px-6 py-3 text-right font-bold text-slate-900 text-base">{fmt(row.total_outstanding)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
