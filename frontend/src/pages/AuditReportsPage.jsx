import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileSpreadsheet, Download, Printer, Search, RefreshCw,
  Filter, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';

const API = '/api/audit';

export default function AuditReportsPage() {
  const { token } = useAuth();
  const [reportType, setReportType] = useState('individual_audit');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reportTypes = [
    { id: 'individual_audit', label: 'Individual Audit Engagements' },
    { id: 'department_wise', label: 'Department-wise Compliance Matrix' },
    { id: 'findings_register', label: 'Findings & Non-Conformance Register' },
    { id: 'overdue_findings', label: 'Overdue Findings Escalation Report' },
    { id: 'capa_status', label: 'CAPA Implementation Status' },
    { id: 'checklist_analysis', label: 'Checklist Criteria Failure Analysis' }
  ];

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/reports?type=${reportType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setReportData(json.data);
      else setError(json.message || 'Failed to generate audit report');
    } catch (e) {
      setError('Network error generating audit report');
    } finally {
      setLoading(false);
    }
  }, [reportType, token]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) {
      alert('No report records to export');
      return;
    }
    const items = reportData.data;
    const keys = Object.keys(items[0]);
    const headers = keys.join(',');
    const rows = items.map(item => {
      return keys.map(k => `"${String(item[k] ?? '').replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rows = reportData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-amber-600" />
            Audit &amp; Statutory Compliance Reports
          </h1>
          <p className="text-sm text-slate-500">
            Exportable operational audits, department compliance ratings, and non-conformance logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCsv}
            disabled={rows.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            disabled={rows.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl transition shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 print:hidden">
        {reportTypes.map((t) => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              reportType === t.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Report Printable Canvas */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none space-y-6">
        {/* Letterhead */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🍛</span>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                Sri Meenakshi Agro &amp; Traditional Foods Pvt Ltd
              </span>
            </div>
            <p className="text-xs text-slate-500">12, Traditional Foods Highway, Madurai, Tamil Nadu 625001</p>
            <p className="text-xs text-slate-500">FSSAI Lic: 12423000000123 • GSTIN: 33AAAAA0000A1Z5</p>
          </div>
          <div className="text-right">
            <h2 className="text-base font-black text-amber-700 uppercase tracking-wider">
              {reportTypes.find(r => r.id === reportType)?.label || 'Audit Report'}
            </h2>
            <div className="text-xs text-slate-500 mt-1">Generated: {new Date().toLocaleDateString('en-IN')}</div>
            <div className="text-xs text-slate-400">Total Records: {rows.length}</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                {rows.length > 0 &&
                  Object.keys(rows[0]).map((key) => (
                    <th key={key} className="py-2.5 px-3 whitespace-nowrap">
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Compiling report data...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No records found for this report criteria.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    {Object.values(row).map((val, cIdx) => (
                      <td key={cIdx} className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                        {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures Footer */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
          <div>
            <div className="font-bold text-slate-700 mb-1">Audit Authority Notice:</div>
            <p>Internal controls certified in compliance with FSSAI Food Safety Act 2006 and Section 143(3) of Companies Act 2013.</p>
          </div>
          <div className="text-right flex flex-col justify-end">
            <div className="h-10 border-b border-slate-300 border-dashed w-48 ml-auto mb-1"></div>
            <div className="font-bold text-slate-700">Chief Internal Auditor / Director</div>
            <div className="text-[10px] text-slate-400">Sri Meenakshi Agro &amp; Traditional Foods Pvt Ltd</div>
          </div>
        </div>
      </div>
    </div>
  );
}
