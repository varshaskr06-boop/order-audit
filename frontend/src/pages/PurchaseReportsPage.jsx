import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  Filter,
  Calendar,
  Truck,
  IndianRupee,
  Layers,
  Search,
  RefreshCw,
  Scale
} from 'lucide-react';

export default function PurchaseReportsPage() {
  const { user, token } = useAuth();
  const [reportType, setReportType] = useState('purchase_register');
  const [reportData, setReportData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [status, setStatus] = useState('');

  // Report Types definitions
  const REPORT_TYPES = [
    { id: 'purchase_register', label: '1. Purchase Register', desc: 'Chronological list of all purchase orders, tax splits, and grand totals' },
    { id: 'supplier_wise', label: '2. Supplier-Wise Purchase Report', desc: 'Total purchase commitments, received value, and pending orders per vendor' },
    { id: 'material_wise', label: '3. Material-Wise Purchase Report', desc: 'Cumulative quantities, received volumes, and total spend per material' },
    { id: 'po_status', label: '4. Purchase Order Status Report', desc: 'Count and aggregate financial volume by PO lifecycle status' },
    { id: 'goods_receipt', label: '5. Goods Receipt Report', desc: 'Accepted vs rejected vs damaged delivery inspection audit' },
    { id: 'price_comparison', label: '6. Purchase Price Comparison Report', desc: 'Supplier quotation comparison across materials and lead times' },
    { id: 'supplier_invoice', label: '7. Supplier Invoice Report', desc: 'Vendor tax invoices, taxable bases, and GST allocations' },
    { id: 'outstanding_invoices', label: '8. Outstanding Supplier Invoice Report', desc: 'Unpaid and partially paid invoices with payment due dates' },
    { id: 'matching_discrepancy', label: '9. 3-Way Matching Discrepancy Report', desc: 'Discrepancies identified between PO, GRN, and Invoices' }
  ];

  // Fetch initial master filters
  useEffect(() => {
    fetch('/api/master/suppliers', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.suppliers) setSuppliers(data.suppliers);
      })
      .catch(() => {});

    fetch('/api/master/raw-materials', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.rawMaterials) setRawMaterials(data.rawMaterials);
      })
      .catch(() => {});
  }, [token]);

  // Fetch report data
  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        type: reportType,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(supplierId && { supplierId }),
        ...(materialId && { materialId }),
        ...(status && { status })
      });

      const res = await fetch(`/api/purchase/reports?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch report data');
      setReportData(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate, supplierId, materialId, status, token]);

  // Export CSV
  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) return;
    const headers = Object.keys(reportData[0]);
    const csvRows = [
      headers.join(','),
      ...reportData.map((row) =>
        headers.map((h) => `"${(row[h] !== null && row[h] !== undefined ? row[h] : '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  const currentReportObj = REPORT_TYPES.find((r) => r.id === reportType);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold text-xs uppercase tracking-wider">
              Module 10
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Purchase & Procurement Reports
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise procurement reports with real-time database aggregation and CSV / PDF export
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={reportData.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel / CSV
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
          Select Procurement Report:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {REPORT_TYPES.map((rep) => {
            const isActive = reportType === rep.id;
            return (
              <button
                key={rep.id}
                onClick={() => setReportType(rep.id)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="text-xs">{rep.label}</div>
                <div className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                  {rep.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" /> Filter Criteria:
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-semibold">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-semibold">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-semibold">Supplier:</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {(startDate || endDate || supplierId || status) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setSupplierId('');
              setStatus('');
            }}
            className="text-xs text-rose-600 font-semibold hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Report Content Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">{currentReportObj?.label}</h2>
            <p className="text-xs text-slate-500">{currentReportObj?.desc}</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {reportData.length} records generated
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading procurement report data...</div>
          ) : reportData.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No data records found for the selected report filters.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  {Object.keys(reportData[0]).map((col) => (
                    <th key={col} className="px-5 py-3.5 capitalize">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    {Object.keys(row).map((col) => (
                      <td key={col} className="px-5 py-3.5 text-slate-800">
                        {typeof row[col] === 'number' && col.includes('amount') || col.includes('total') || col.includes('spend') || col.includes('tax')
                          ? `₹${row[col].toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                          : row[col] !== null && row[col] !== undefined
                          ? String(row[col])
                          : '—'}
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
