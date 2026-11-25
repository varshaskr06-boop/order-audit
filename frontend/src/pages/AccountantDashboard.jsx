import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileSpreadsheet, 
  Receipt, 
  Download, 
  Eye, 
  ShieldCheck, 
  Building2, 
  FileText,
  DollarSign
} from 'lucide-react';

export default function AccountantDashboard() {
  const { user } = useAuth();

  const gstRegisterSample = [
    { inv: 'INV-2026-001', customer: 'Nilgiris Supermarket (Anna Nagar)', type: 'Intrastate (TN)', taxable: '₹12,000.00', cgst: '₹300.00', sgst: '₹300.00', igst: '₹0.00', total: '₹12,600.00' },
    { inv: 'INV-2026-002', customer: 'Kovai Pazhamudir Nilayam', type: 'Intrastate (TN)', taxable: '₹19,000.00', cgst: '₹475.00', sgst: '₹475.00', igst: '₹0.00', total: '₹19,950.00' },
    { inv: 'INV-2026-003', customer: 'MTR Distribution Hub (Bengaluru)', type: 'Interstate (KA)', taxable: '₹45,000.00', cgst: '₹0.00', sgst: '₹0.00', igst: '₹2,250.00', total: '₹47,250.00' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Accountant & Auditor Portal
            </span>
            <span className="text-xs text-slate-500">Financial Registers & Tamil Nadu GST Audits</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial & GST Audit Desk
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Auditor: <span className="font-semibold text-slate-900">{user.full_name}</span>. Access mode: <span className="font-bold text-emerald-700">READ-ONLY VERIFICATION</span>.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <Eye className="h-4 w-4 text-emerald-600" />
          <span>Read-Only Audit Mode Enforced</span>
        </div>
      </div>

      {/* Audit KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">GST Jurisdiction</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">Tamil Nadu (33)</div>
          <p className="text-xs text-slate-500 mt-1">Madurai SIDCO Circle</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Intrastate Rates</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">CGST + SGST</div>
          <p className="text-xs text-slate-500 mt-1">2.5% + 2.5% (Batter) / 6% + 6%</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interstate Rates</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">IGST (100%)</div>
          <p className="text-xs text-slate-500 mt-1">5.0% or 12.0% (Outside TN)</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Trail Status</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">100% Balanced</div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Immutable Stock Ledger</p>
        </div>

      </div>

      {/* GST Sales Register Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              GST Sales Register Preview (Benchmark Audit Sample)
            </h3>
            <p className="text-xs text-slate-500">Tamil Nadu Intrastate vs Interstate Tax Reconciliation</p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700">
              <Download className="h-3.5 w-3.5" /> Export Excel
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <FileText className="h-3.5 w-3.5" /> Export PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Invoice No</th>
                <th className="py-2.5 px-3">Customer Business Name</th>
                <th className="py-2.5 px-3">Supply Type</th>
                <th className="py-2.5 px-3 text-right">Taxable Value</th>
                <th className="py-2.5 px-3 text-right">CGST</th>
                <th className="py-2.5 px-3 text-right">SGST</th>
                <th className="py-2.5 px-3 text-right">IGST</th>
                <th className="py-2.5 px-3 text-right font-extrabold">Invoice Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {gstRegisterSample.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-800">{r.inv}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-700">{r.customer}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      r.type.includes('Intrastate') ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-800">{r.taxable}</td>
                  <td className="py-2.5 px-3 text-right text-slate-600">{r.cgst}</td>
                  <td className="py-2.5 px-3 text-right text-slate-600">{r.sgst}</td>
                  <td className="py-2.5 px-3 text-right text-slate-600">{r.igst}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
