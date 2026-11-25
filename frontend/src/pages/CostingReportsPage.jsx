import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart2, Download, RefreshCw } from 'lucide-react';

const API = '/api/costing';

const REPORT_TYPES = [
  { value: 'PRODUCT_WISE_COSTING', label: 'Product-Wise Costing' },
  { value: 'BATCH_WISE_COSTING', label: 'Batch-Wise Costing' },
  { value: 'RAW_MATERIAL_COST', label: 'Raw Material Costs' },
  { value: 'PACKAGING_COST', label: 'Packaging Material Costs' },
  { value: 'LABOUR_COST', label: 'Labour Cost Analysis' },
  { value: 'MACHINE_ELECTRICITY_COST', label: 'Machine & Electricity Costs' },
  { value: 'MANUFACTURING_OVERHEAD', label: 'Manufacturing Overhead' },
  { value: 'PLANNED_VS_ACTUAL', label: 'Planned vs Actual Summary' },
  { value: 'COST_VARIANCE', label: 'Cost Variance Report' },
  { value: 'PRODUCT_PROFITABILITY', label: 'Product Profitability' },
];

export default function CostingReportsPage() {
  const { token } = useAuth();
  const [reportType, setReportType] = useState('PRODUCT_WISE_COSTING');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productId, setProductId] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true); setError(''); setResults(null);
    try {
      const params = new URLSearchParams({ report_type: reportType });
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      if (productId) params.set('product_id', productId);

      const res = await fetch(`${API}/reports?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setResults(json.data);
      else setError(json.message || 'Failed to generate report');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [token, reportType, startDate, endDate, productId]);

  // Auto-fetch when report type changes
  useEffect(() => { fetchReport(); }, [reportType]);

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
      if (lk.includes('cost') || lk.includes('price') || lk.includes('profit') || lk.includes('amount')) {
        return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      }
      if (lk.includes('pct') || lk.includes('margin') || lk.includes('percent')) {
        return `${Number(value).toFixed(2)}%`;
      }
      return Number(value).toLocaleString('en-IN');
    }
    if (typeof value === 'string' && value.includes('T') && value.length > 10) {
      return value.split('T')[0]; // date only
    }
    return String(value);
  };

  const formatHeader = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="h-7 w-7 text-amber-500" /> Costing Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">Generate, analyse and export 10 types of manufacturing cost reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchReport} disabled={loading}
            className="flex items-center gap-1 px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {records.length > 0 && (
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Report Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Report Type *</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400">
              {REPORT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product ID (optional)</label>
            <input type="number" placeholder="All products" value={productId} onChange={e => setProductId(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div className="flex items-end">
            <button onClick={fetchReport} disabled={loading}
              className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</> : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      {/* Results */}
      {results && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                {REPORT_TYPES.find(r => r.value === results.report_type)?.label || results.report_type}
              </h2>
              <p className="text-xs text-slate-500">
                {records.length} record{records.length !== 1 ? 's' : ''} found
                {results.generated_at && ` • Generated at ${new Date(results.generated_at).toLocaleTimeString()}`}
              </p>
            </div>
            {records.length > 0 && (
              <button onClick={exportCSV}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            )}
          </div>

          {records.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No data found for the selected parameters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-slate-200">
                  <tr>
                    {columns.map(col => (
                      <th key={col} className="px-4 py-2.5 text-left font-bold text-slate-600 uppercase tracking-wide text-[10px] bg-slate-50 whitespace-nowrap">
                        {formatHeader(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-50 hover:bg-amber-50/30 ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
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
