import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Download, RefreshCw, Filter, AlertTriangle,
  Users, Truck, CheckCircle2
} from 'lucide-react';

const API = '/api/payments';

export default function OutstandingReportsPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState('CUSTOMERS'); // CUSTOMERS or SUPPLIERS
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOutstanding = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'CUSTOMERS') {
        const res = await fetch(`${API}/reports/customer-aging`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.success) setData(json.data);
      } else {
        const res = await fetch(`${API}/reports/supplier-aging`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.success) setData(json.data);
      }
    } catch (e) {
      setError('Network error fetching outstanding reports');
    } finally {
      setLoading(false);
    }
  }, [token, tab]);

  useEffect(() => { fetchOutstanding(); }, [fetchOutstanding]);

  const exportCsv = () => {
    if (!data.length) return;
    const headers = tab === 'CUSTOMERS'
      ? ['Customer Name', 'Total Outstanding', 'Not Due', '0-30 Days', '31-60 Days', '61-90 Days', '90+ Days']
      : ['Supplier Name', 'Total Outstanding', 'Not Due', '0-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];

    const rows = data.map(d => [
      `"${tab === 'CUSTOMERS' ? d.customer_name : d.supplier_name}"`,
      d.total_outstanding,
      d.not_due,
      d.bucket_0_30,
      d.bucket_31_60,
      d.bucket_61_90,
      d.bucket_90_plus
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tab}_Outstanding_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalOutstanding = data.reduce((s, d) => s + (d.total_outstanding || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Outstanding Balances Report</h1>
          <p className="text-sm text-slate-500">
            Module 5: Party-wise Receivable &amp; Payable Balances with Due Dates Analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOutstanding}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={!data.length}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
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
            <Users className="h-4 w-4" /> Customer Receivables
          </button>
          <button
            onClick={() => setTab('SUPPLIERS')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition ${
              tab === 'SUPPLIERS' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Truck className="h-4 w-4" /> Supplier Payables
          </button>
        </div>

        <div className="px-4 text-xs font-semibold text-slate-700">
          Total Net Outstanding: <span className="text-base font-bold text-amber-700">{fmt(totalOutstanding)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3">{tab === 'CUSTOMERS' ? 'Customer Name' : 'Supplier Name'}</th>
                <th className="px-6 py-3 text-right">Not Due</th>
                <th className="px-6 py-3 text-right">0–30 Days</th>
                <th className="px-6 py-3 text-right">31–60 Days</th>
                <th className="px-6 py-3 text-right">61–90 Days</th>
                <th className="px-6 py-3 text-right">90+ Days</th>
                <th className="px-6 py-3 text-right">Total Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    Calculating balances...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    No outstanding balance records found.
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-semibold text-slate-900">
                      {tab === 'CUSTOMERS' ? row.customer_name : row.supplier_name}
                    </td>
                    <td className="px-6 py-3 text-right text-slate-600">{fmt(row.not_due)}</td>
                    <td className="px-6 py-3 text-right text-emerald-600 font-medium">{fmt(row.bucket_0_30)}</td>
                    <td className="px-6 py-3 text-right text-amber-600 font-medium">{fmt(row.bucket_31_60)}</td>
                    <td className="px-6 py-3 text-right text-orange-600 font-semibold">{fmt(row.bucket_61_90)}</td>
                    <td className="px-6 py-3 text-right text-rose-600 font-bold">{fmt(row.bucket_90_plus)}</td>
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
