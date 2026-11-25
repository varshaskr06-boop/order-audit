import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Download,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  Layers,
  Boxes,
  Package,
  AlertTriangle,
  Clock,
  Scale
} from 'lucide-react';

export default function InventoryReportsPage() {
  const { token, user } = useAuth();
  const [reportType, setReportType] = useState('current_stock');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const reportOptions = [
    { id: 'current_stock', label: '1. Current Stock & Inventory Valuation', icon: Layers },
    { id: 'stock_inward', label: '2. Stock Inward Register', icon: Boxes },
    { id: 'stock_outward', label: '3. Stock Outward Register', icon: Package },
    { id: 'movement_history', label: '4. Central Stock Movement Ledger', icon: FileText },
    { id: 'low_stock', label: '5. Low Stock & Reorder Warnings', icon: AlertTriangle },
    { id: 'expired_stock', label: '6. Expired Stock Audit Report', icon: AlertTriangle },
    { id: 'near_expiry', label: '7. Near-Expiry (Within 30 Days)', icon: Clock },
    { id: 'damaged_stock', label: '8. Damaged & Quality Write-offs', icon: AlertTriangle },
    { id: 'batch_wise', label: '9. Batch-Wise Inventory Breakdown', icon: Layers },
    { id: 'physical_variance', label: '10. Physical Stock Variance Report', icon: Scale }
  ];

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('type', reportType);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await fetch(`/api/inventory/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);
      } else {
        setError(json.message || 'Failed to fetch inventory report');
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

  const exportToCSV = () => {
    if (!reportData || !reportData.rows || reportData.rows.length === 0) return;

    const rows = reportData.rows;
    const headers = Object.keys(rows[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map((row) =>
          headers
            .map((h) => {
              const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
              return `"${val.replace(/"/g, '""')}"`;
            })
            .join(',')
        )
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rows = reportData?.rows || [];
  const filteredRows = rows.filter((row) => {
    if (!searchTerm) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
              Module 11 • Inventory Reports
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Valuation, Inward, Outward & Audits</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Inventory & Warehouse Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sri Meenakshi Agro & Traditional Foods • Central Stock Ledger Data Export
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={!reportData || rows.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={fetchReport}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Select Inventory Report Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
          {reportOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = reportType === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setReportType(opt.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition text-left border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-slate-950' : 'text-slate-400'}`} />
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search within report results..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-xs w-full sm:w-auto justify-end">
          <span className="text-slate-500 font-semibold">
            Records: <strong>{filteredRows.length}</strong> of {rows.length}
          </span>
        </div>
      </div>

      {/* Report Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
            <FileText className="h-4 w-4 text-amber-600" />
            <span>{reportData?.title || 'Report Output'}</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Generated: {reportData?.generated_at ? new Date(reportData.generated_at).toLocaleString('en-IN') : '-'}
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="h-6 w-6 text-amber-600 animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Generating report dataset from stock ledger...</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No records returned for the selected report filters.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  {Object.keys(filteredRows[0]).map((key) => (
                    <th key={key} className="py-3 px-4 capitalize">
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {Object.keys(row).map((key) => (
                      <td key={key} className="py-3 px-4 text-slate-800">
                        {row[key] !== null && row[key] !== undefined ? String(row[key]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
