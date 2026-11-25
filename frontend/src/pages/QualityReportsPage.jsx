import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  Layers,
  Factory,
  ShieldCheck,
  TrendingUp,
  FileText
} from 'lucide-react';

const REPORT_TYPES = [
  { id: 'RAW_MATERIAL_INSPECTION', label: '1. Raw Material QC Log', desc: 'Inward lot inspections, acceptance rates & supplier lots' },
  { id: 'PACKAGING_INSPECTION', label: '2. Packaging Material QC', desc: 'Pouch thickness, leak tests & label print audits' },
  { id: 'IN_PROCESS_QUALITY', label: '3. In-Process Production QC', desc: 'Stage-wise temperature, moisture & mesh clearance' },
  { id: 'FINISHED_GOODS_QUALITY', label: '4. Finished Goods QC & Release', desc: 'Dispatch release certificates & analytical parameters' },
  { id: 'SUPPLIER_QUALITY', label: '5. Supplier Quality & Rejection Rate', desc: 'Vendor performance, lot pass % and debit notes' },
  { id: 'BATCH_QUALITY_HISTORY', label: '6. Batch QC History & Traceability', desc: 'Full lifecycle audit trail from RM to FG batch' },
  { id: 'REJECTIONS', label: '7. Rejections & Scrap Log', desc: 'Rejected lots, scrap disposition & salvage records' },
  { id: 'DEFECT_ANALYSIS', label: '8. Defect Frequency & Analysis', desc: 'Pareto breakdown by category and root cause' },
  { id: 'CAPA_SUMMARY', label: '9. CAPA Resolution & SLA', desc: 'Corrective action cycle time, owners & verification' },
  { id: 'QUALITY_PERFORMANCE', label: '10. Executive Quality KPIs', desc: 'Overall pass rate, First Time Right (FTR) & compliance' }
];

export default function QualityReportsPage() {
  const { token } = useAuth();
  const [selectedReport, setSelectedReport] = useState('RAW_MATERIAL_INSPECTION');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Date filters
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/quality/reports?report_type=${selectedReport}&start_date=${startDate}&end_date=${endDate}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);
      } else {
        setError(json.error?.message || 'Failed to generate report');
      }
    } catch (err) {
      setError(err.message || 'Error generating quality report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedReport]);

  const handleExportCSV = () => {
    if (!reportData || !reportData.records || reportData.records.length === 0) return;

    const records = reportData.records;
    const headers = Object.keys(records[0]).filter(k => typeof records[0][k] !== 'object');
    const csvRows = [];
    csvRows.push(headers.join(','));

    records.forEach(row => {
      const values = headers.map(header => {
        const val = row[header] === null || row[header] === undefined ? '' : row[header];
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedReport}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const records = reportData?.records || [];
  const filteredRecords = records.filter(row => {
    if (!searchTerm.trim()) return true;
    const str = JSON.stringify(row).toLowerCase();
    return str.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Quality Audit & Compliance Reports</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Module 9 • 10 Standard Food Safety, Supplier Quality, In-Process & CAPA Reports with CSV Export
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!records.length}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Date Filters & Report Picker */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Quality Report *</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-slate-800"
            >
              {REPORT_TYPES.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative pt-2 border-t border-slate-100">
          <Search className="h-4 w-4 absolute left-3 top-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search within report results..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      {reportData?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(reportData.summary).map(([key, val]) => (
            <div key={key} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {key.replace(/_/g, ' ')}
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {typeof val === 'number' ? val.toLocaleString() : val}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-900 text-white z-10">
              <tr className="uppercase tracking-wider text-[10px]">
                {records.length > 0 &&
                  Object.keys(records[0])
                    .filter(k => typeof records[0][k] !== 'object')
                    .map((header) => (
                      <th key={header} className="py-3 px-4 font-bold whitespace-nowrap">
                        {header.replace(/_/g, ' ')}
                      </th>
                    ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Generating {REPORT_TYPES.find(r => r.id === selectedReport)?.label}...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    No records found for the selected period.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    {Object.keys(row)
                      .filter(k => typeof row[k] !== 'object')
                      .map((k, colIdx) => {
                        const val = row[k];
                        let cellContent = String(val ?? '');
                        let isStatus = k.includes('status') || k.includes('verdict');

                        return (
                          <td key={colIdx} className="py-3 px-4 whitespace-nowrap">
                            {isStatus && val === 'PASSED' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {cellContent}
                              </span>
                            ) : isStatus && val === 'FAILED' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                {cellContent}
                              </span>
                            ) : typeof val === 'number' ? (
                              <span className="font-mono font-semibold text-slate-800">
                                {val.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-700">{cellContent}</span>
                            )}
                          </td>
                        );
                      })}
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
