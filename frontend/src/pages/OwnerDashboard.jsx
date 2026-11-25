import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Crown, 
  TrendingUp, 
  Factory, 
  Users, 
  DollarSign, 
  ShieldCheck, 
  ArrowRight,
  PieChart,
  Building2
} from 'lucide-react';

export default function OwnerDashboard() {
  const { user, setActivePage } = useAuth();

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
              <Crown className="h-3 w-3" /> Owner Executive Room
            </span>
            <span className="text-xs text-slate-500">Enterprise High-Level Governance</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sri Meenakshi Agro & Traditional Foods Executive Command
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Executive Owner: <span className="font-semibold text-slate-900">{user.full_name}</span>. Full end-to-end visibility across manufacturing and finances.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActivePage('users')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
          >
            <Users className="h-3.5 w-3.5" /> Staff Directory
          </button>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Margin Target</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">35.8%</div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">+2.4% vs last month</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory Asset Value</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Factory className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">₹2,48,230</div>
          <p className="text-xs text-slate-500 mt-1">Raw Material + Finished Stock</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Staff & Reps</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">5 Corporate Roles</div>
          <p className="text-xs text-slate-500 mt-1">Sales, Prod, Acct, Admin, Owner</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">GST Compliance</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">100% Valid</div>
          <p className="text-xs text-slate-500 mt-1">Tamil Nadu GSTIN: 33AAAAA0000A1Z5</p>
        </div>

      </div>

      {/* Executive Highlights & Next Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-rose-600" />
            Costing & Batch Margin Framework (Phase 8 Preview)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            In food manufacturing, true profitability is achieved by accounting for all four direct cost components:
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">1. Raw Materials:</span>
              <span className="font-semibold text-slate-900">Ponni Rice, Guntur Urad Dal, Spices, Ghee</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">2. Packaging:</span>
              <span className="font-semibold text-slate-900">Food-grade Printed Pouches, Zip Bags, Cartons</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">3. Direct Labour:</span>
              <span className="font-semibold text-slate-900">Grinding, Frying, Pouch Sealing Operators</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">4. Fuel & Electricity:</span>
              <span className="font-semibold text-slate-900">Commercial LPG Gas & Grinding Motor Power</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Audit & Stock Integrity Guarantee
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sri Meenakshi ERP enforces a strict audit rule: <strong>Stock balances can never be directly overwritten.</strong> Every gram of rice or packet of batter that enters or leaves the factory creates a verifiable entry in the immutable Stock Ledger.
          </p>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-800">Current Phase Status:</div>
            <p className="text-slate-600">Phase 2: Authentication & RBAC verified.</p>
            <p className="text-slate-600">Phase 3: Master Data catalogs next in line.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
