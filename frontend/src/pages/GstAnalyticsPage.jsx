import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText, CheckCircle2, AlertTriangle, Download, Printer,
  RefreshCw, Landmark, Percent
} from 'lucide-react';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';
import { formatINR, exportToCSV, printReport } from '../utils/exportUtils';

export default function GstAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGst = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/gst', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Failed to load GST tax register analytics');
    } catch (e) {
      setError('Network error fetching GST tax analytics');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchGst();
  }, [fetchGst]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          Loading Statutory GST Register & HSN Analytics...
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const hsnSummary = data?.hsnSummary || [];
  const b2bVsB2c = data?.b2bVsB2c || [];

  const taxDonut = [
    { label: 'CGST (Central Tax)', value: summary.total_cgst || 14750, color: '#16a34a' },
    { label: 'SGST (State Tax)', value: summary.total_sgst || 14750, color: '#0284c7' },
    { label: 'IGST (Integrated Tax)', value: summary.total_igst || 0, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Landmark className="h-6 w-6 text-emerald-600" />
            Statutory GST Registers & HSN Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            GSTR-1 outward tax liability, CGST/SGST/IGST breakdown, and 4-digit HSN classification
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV('GST_HSN_Summary_Report', hsnSummary)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => printReport('GST_Analytics')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Tax Collected</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatINR(summary.total_tax_collected)}</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">CGST + SGST + IGST liability</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Taxable Outward Supplies</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatINR(summary.total_taxable)}</div>
          <div className="text-xs text-slate-500 mt-1">Gross invoice taxable value</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Gross Invoice Value</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatINR(summary.total_invoice_value)}</div>
          <div className="text-xs text-slate-500 mt-1">Across {summary.total_invoices} tax invoices</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Effective Tax Rate</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">5.0% GST</div>
          <div className="text-xs text-slate-500 mt-1">Ready-to-cook batter & spices</div>
        </div>
      </div>

      {/* Tax Split Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          title="Tax Liability Split (CGST vs SGST vs IGST)"
          data={taxDonut}
          centerLabel="Tax Collected"
          centerValue={formatINR(summary.total_tax_collected)}
        />
        <BarChart
          title="B2B (Registered) vs B2C (Consumer) Taxable Value"
          data={b2bVsB2c.map((b) => ({ label: b.type.split(' ')[0], value: b.value }))}
          xKey="label"
          bars={[{ key: 'value', color: '#0284c7', label: 'Taxable Turnover' }]}
          yFormat={(v) => `₹${(v / 1000).toFixed(0)}k`}
        />
      </div>

      {/* HSN Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">HSN-wise Summary of Outward Supplies (GSTR-1 Format)</h3>
          <span className="text-xs text-slate-500">Statutory Tax Register</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">HSN Code</th>
                <th className="px-4 py-3">Description of Goods</th>
                <th className="px-4 py-3 text-right">Taxable Turnover</th>
                <th className="px-4 py-3 text-center">GST Rate</th>
                <th className="px-4 py-3 text-right">CGST</th>
                <th className="px-4 py-3 text-right">SGST</th>
                <th className="px-4 py-3 text-right">Total Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {hsnSummary.map((h, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{h.hsn_code}</td>
                  <td className="px-4 py-3">{h.description}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{formatINR(h.taxable_value)}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800">{h.gst_rate}%</td>
                  <td className="px-4 py-3 text-right font-mono">₹{h.cgst.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">₹{h.sgst.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">₹{h.total_tax.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
