import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Factory, 
  Layers, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  Flame,
  Wheat
} from 'lucide-react';

export default function ProductionDashboard() {
  const { user } = useAuth();

  const standardBOM = [
    { item: 'Ponni Idli Rice', required: '65.0 kg', category: 'Raw Material', batch: '100 Packs Batter' },
    { item: 'Guntur Urad Dal', required: '16.25 kg', category: 'Raw Material', batch: '100 Packs Batter' },
    { item: 'Vendhayam / Methi', required: '0.5 kg', category: 'Raw Material', batch: '100 Packs Batter' },
    { item: 'Besan (Gram Flour)', required: '14.0 kg', category: 'Raw Material', batch: '100 Packs Mixture' },
    { item: 'Sunflower Oil', required: '8.0 Liters', category: 'Raw Material', batch: '100 Packs Mixture' },
    { item: '1 KG Printed Pouch', required: '100 pcs', category: 'Packaging', batch: '100 Packs Batter' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Production Floor
            </span>
            <span className="text-xs text-slate-500">Batch Runs & Yield Variance Monitoring</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Production & BOM Issuance Workspace
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Supervisor: <span className="font-semibold text-slate-900">{user.full_name}</span>. Maintain zero-wastage compliance.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <span>Role Guard: Production Operations Only</span>
        </div>
      </div>

      {/* Production Floor KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Batch</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Factory className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">RUN-2026-B01</div>
          <p className="text-xs text-slate-500 mt-1">Fresh Idli/Dosa Batter (100 Pkts)</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Yield Variance Rule</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">± 2.0% Tolerance</div>
          <p className="text-xs text-slate-500 mt-1">Automatic Stock Ledger Sync</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stone Grinding Unit</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Wheat className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">Ready</div>
          <p className="text-xs text-slate-500 mt-1">45 Min Cycle / Natural Fermentation</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deep Frying Station</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">Murukku & Mixture</div>
          <p className="text-xs text-slate-500 mt-1">Sunflower Oil Gas Fuel Costed</p>
        </div>

      </div>

      {/* Bill of Materials Reference Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-600" />
            Bill of Materials (BOM) Standard Issuance Standards
          </h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Immutable Audit Trail Rule
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Material / Ingredient</th>
                <th className="py-2.5 px-3">Standard Qty Required</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Target Batch</th>
                <th className="py-2.5 px-3">Ledger Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {standardBOM.map((b, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{b.item}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-900">{b.required}</td>
                  <td className="py-2.5 px-3 text-slate-600">{b.category}</td>
                  <td className="py-2.5 px-3 text-slate-700">{b.batch}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      - PRODUCTION_ISSUE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
