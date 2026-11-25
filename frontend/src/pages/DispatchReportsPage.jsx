import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileSpreadsheet, Download, RefreshCw, Filter, AlertTriangle,
  BarChart3, Calendar, Box, Truck
} from 'lucide-react';

const API = '/api/dispatch';

const REPORT_TYPES = [
  { id: 'DAILY_DISPATCH', name: '1. Daily Dispatch Register' },
  { id: 'MONTHLY_DISPATCH', name: '2. Monthly Dispatch Summary' },
  { id: 'CUSTOMER_WISE', name: '3. Customer-Wise Dispatch Report' },
  { id: 'PRODUCT_WISE', name: '4. Product-Wise Dispatch Report' },
  { id: 'BATCH_WISE', name: '5. Batch-Wise Dispatch Report' },
  { id: 'TRANSPORTER_PERFORMANCE', name: '6. Transporter Performance & Rating' },
  { id: 'DELIVERY_DELAY', name: '7. Delivery Delay & Lead Time Report' },
  { id: 'RETURNED_GOODS', name: '8. Returned & Damaged Goods Report' },
  { id: 'DELIVERY_COMPLETION', name: '9. Delivery Completion & POD Report' },
  { id: 'OUTSTANDING_DELIVERY', name: '10. Outstanding & Pending Delivery Report' }
];

export default function DispatchReportsPage() {
  const { token } = useAuth();
  const [selectedReport, setSelectedReport] = useState('DAILY_DISPATCH');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/reports?type=${selectedReport}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setReportData(json.data);
      else setError(json.message || 'Failed to generate report');
    } catch (e) {
      setError('Network error generating report');
    } finally {
      setLoading(false);
    }
  }, [token, selectedReport]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const exportToCsv = () => {
    if (!reportData || !reportData.records || reportData.records.length === 0) {
      alert('No records available to export.');
      return;
    }

    const records = reportData.records;
    const headers = Object.keys(records[0]);
    const csvRows = [
      headers.join(','),
      ...records.map(r =>
        headers.map(h => {
          const val = r[h] !== null && r[h] !== undefined ? String(r[h]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const records = reportData?.records || [];
  const columns = records.length > 0 ? Object.keys(records[0]) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dispatch &amp; Logistics Reports</h1>
          <p className="text-sm text-slate-500">
            Module 11: 10 Operational, Compliance &amp; Performance Audit Reports with CSV Export
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={exportToCsv}
            disabled={!records.length}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50"
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

      {/* Report Selector Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-96">
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Report Type</label>
          <select
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
          >
            {REPORT_TYPES.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 self-end sm:self-center">
          Generated At: <b>{reportData?.generated_at ? new Date(reportData.generated_at).toLocaleString() : '—'}</b> | Total Records: <b>{reportData?.record_count || 0}</b>
        </div>
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                {columns.map(col => (
                  <th key={col} className="px-6 py-3 whitespace-nowrap">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length || 1} className="px-6 py-12 text-center text-slate-500">
                    Generating report data...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={columns.length || 1} className="px-6 py-12 text-center text-slate-400">
                    No records found for the selected report criteria.
                  </td>
                </tr>
              ) : (
                records.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    {columns.map(col => (
                      <td key={col} className="px-6 py-3 whitespace-nowrap text-slate-800 text-xs">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                      </td>
                    ))}
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
