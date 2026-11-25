import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileSpreadsheet, Download, RefreshCw, AlertTriangle, ShieldAlert
} from 'lucide-react';

const API = '/api/invoicing';

const REPORT_OPTIONS = [
  { value: 'SALES_REGISTER', label: '1. Sales Register (Comprehensive Detailed Invoices)' },
  { value: 'GST_SUMMARY', label: '2. GST Summary Report (B2B, B2C, Inward/Outward Tax Overview)' },
  { value: 'CGST_REPORT', label: '3. CGST Output Liability Report (Intra-State Central GST)' },
  { value: 'SGST_REPORT', label: '4. SGST Output Liability Report (Intra-State State GST)' },
  { value: 'IGST_REPORT', label: '5. IGST Output Liability Report (Inter-State Integrated GST)' },
  { value: 'HSN_SUMMARY', label: '6. HSN-Wise Sales Report (Product Chapter Classification)' },
  { value: 'CREDIT_NOTE_REPORT', label: '7. Credit Note & Sales Return Report' },
  { value: 'DEBIT_NOTE_REPORT', label: '8. Debit Note & Price Increase Report' },
  { value: 'OUTSTANDING_INVOICES', label: '9. Outstanding Invoices & Receivables Aging Report' },
  { value: 'CANCELLED_INVOICES', label: '10. Cancelled Invoices Audit Trail Report' },
  { value: 'MONTHLY_SALES', label: '11. Monthly Sales & Tax Realization Summary' },
  { value: 'FY_SALES', label: '12. Financial-Year Gross Sales & Tax Collection' }
];

export default function GstReportsPage() {
  const { token } = useAuth();
  const [reportType, setReportType] = useState('SALES_REGISTER');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ report_type: reportType });
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const res = await fetch(`${API}/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setResults(json.data);
      else setError(json.message || 'Failed to generate report');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [token, reportType, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const exportCSV = () => {
    if (!results?.records?.length) return;
    const records = results.records;
    const headers = Object.keys(records[0]);
    const csv = [
      headers.join(','),
      ...records.map(r => headers.map(h => {
        const v = r[h] ?? '';
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const records = results?.records || [];
  const columns = records.length > 0 ? Object.keys(records[0]) : [];

  const fmtCell = (key, value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') {
      const lk = key.toLowerCase();
      if (lk.includes('value') || lk.includes('amount') || lk.includes('total') || lk.includes('cgst') || lk.includes('sgst') || lk.includes('igst') || lk.includes('tax')) {
        return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      }
      return Number(value).toLocaleString('en-IN');
    }
    return String(value);
  };

  const formatHeader = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-7 w-7 text-amber-500" /> GST Billing & Statutory Sales Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">12 Analytical GST Reports with date filtering, CSV export and compliance summaries</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {records.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Mandatory Statutory Notice */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Statutory Disclaimer:</strong> All reports generated herein are <strong>internal management summaries</strong> based on entered invoice records. They are intended for internal accounts review, bookkeeping and reconciliation, and do NOT constitute filed statutory GST returns (GSTR-1, GSTR-3B, or GSTR-9). Statutory filing requires certified verification by your authorized chartered accountant.
        </div>
      </div>

      {/* Filter Parameters Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Report Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Report Type *</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white font-medium focus:ring-2 focus:ring-amber-400"
            >
              {REPORT_OPTIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                {REPORT_OPTIONS.find(r => r.value === results.report_type)?.label || results.report_type}
              </h2>
              <div className="text-[11px] text-slate-400">
                {records.length} records • Generated {new Date(results.generated_at).toLocaleTimeString()}
              </div>
            </div>
            {records.length > 0 && (
              <button
                onClick={exportCSV}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            )}
          </div>

          {records.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              No records found for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    {columns.map(col => (
                      <th key={col} className="px-4 py-2.5 text-left font-bold text-slate-600 uppercase text-[10px] whitespace-nowrap">
                        {formatHeader(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      {columns.map(col => (
                        <td key={col} className="px-4 py-2.5 whitespace-nowrap">
                          {fmtCell(col, row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
