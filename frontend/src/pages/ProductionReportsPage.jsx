import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  Download,
  Filter,
  Search,
  RefreshCw,
  Calendar,
  Layers,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

export default function ProductionReportsPage() {
  const { token, user } = useAuth();
  const [reportType, setReportType] = useState('daily');
  const [reportData, setReportData] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reportTypes = [
    { id: 'daily', name: '1. Daily Production Report' },
    { id: 'monthly', name: '2. Monthly Production Report' },
    { id: 'product_wise', name: '3. Product-Wise Production' },
    { id: 'batch_wise', name: '4. Batch-Wise Production' },
    { id: 'raw_material_consumption', name: '5. RM Consumption' },
    { id: 'packaging_consumption', name: '6. Packaging Consumption' },
    { id: 'wastage', name: '7. Material Wastage' },
    { id: 'rejection', name: '8. Rejection Quantities' },
    { id: 'downtime', name: '9. Machine Downtime' },
    { id: 'completion', name: '10. Order Completion' }
  ];

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('type', reportType);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);

      const res = await fetch(`/api/production/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setReportData(json.data || []);
      } else {
        setError(json.error?.message || 'Failed to generate production report');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [token, reportType]);

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) {
      alert('No data available to export');
      return;
    }
    const headers = Object.keys(reportData[0]);
    const csvRows = [
      headers.join(','),
      ...reportData.map((row) =>
        headers.map((h) => `"${(row[h] !== null && row[h] !== undefined ? String(row[h]) : '').replace(/"/g, '""')}"`).join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Production_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredData = reportData.filter((row) => {
    if (!search) return true;
    const str = JSON.stringify(row).toLowerCase();
    return str.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
              📊
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Production Analytics & Compliance Reports
              </h1>
              <p className="text-xs text-slate-500">
                Module 11 — 10 report perspectives with date filtering, live aggregation & CSV export
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Select Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Report Category</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
            >
              {reportTypes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="self-end">
            <button
              onClick={fetchReport}
              className="px-3.5 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
            >
              Apply Filter
            </button>
          </div>
        </div>

        <div className="relative w-full sm:w-64 self-end">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search report rows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="text-xs font-bold text-slate-900">
            {reportTypes.find((r) => r.id === reportType)?.name}
          </div>
          <span className="text-xs font-mono text-slate-500">{filteredData.length} Records</span>
        </div>

        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                {filteredData.length > 0
                  ? Object.keys(filteredData[0]).map((h) => (
                      <th key={h} className="py-2.5 px-3 whitespace-nowrap">
                        {h.replace(/_/g, ' ')}
                      </th>
                    ))
                  : <th className="py-3 px-4">Result</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
              {filteredData.length > 0 ? (
                filteredData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    {Object.values(row).map((val, idx) => (
                      <td key={idx} className="py-2.5 px-3 whitespace-nowrap">
                        {val !== null && val !== undefined ? String(val) : '—'}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400 font-sans">
                    No data found for the selected report filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
