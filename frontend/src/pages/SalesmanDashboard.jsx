import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Receipt, 
  Store, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert,
  ShoppingBag,
  CreditCard
} from 'lucide-react';

export default function SalesmanDashboard() {
  const { user } = useAuth();

  const retailCustomers = [
    { name: 'Nilgiris Supermarket', area: 'Anna Nagar, Chennai', gst: '33AABCN4321B1Z9', status: 'Credit Approved' },
    { name: 'Kovai Pazhamudir Nilayam', area: 'RS Puram, Coimbatore', gst: '33AAACK7788P1Z6', status: 'Credit Approved' },
    { name: 'Madurai Pandian Provision', area: 'South Masi, Madurai', gst: '33AAAPP9988D1Z4', status: 'Active' },
    { name: 'MTR Distribution Hub', area: 'Koramangala, Bengaluru (KA)', gst: '29AABCM6655L1Z7', status: 'Interstate (IGST)' },
  ];

  const productPriceList = [
    { sku: 'FG-001', name: 'Fresh Idli & Dosa Batter (1 KG)', hsn: '2106', gst: '5%', price: '₹60.00' },
    { sku: 'FG-002', name: 'Madurai Special Madras Mixture (250g)', hsn: '2106', gst: '12%', price: '₹95.00' },
    { sku: 'FG-003', name: 'Traditional Kai Murukku (200g)', hsn: '2106', gst: '12%', price: '₹75.00' },
    { sku: 'FG-004', name: 'Pure Ghee Mysore Pak (250g)', hsn: '2106', gst: '5%', price: '₹180.00' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Salesman Portal
            </span>
            <span className="text-xs text-slate-500">Order Booking & Retail Accounts</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sales & Retail Distribution Workspace
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Welcome, <span className="font-semibold text-slate-900">{user.full_name}</span>. Track retail orders and customer credit balances.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          <ShieldAlert className="h-4 w-4 text-blue-600" />
          <span>Role Guard: Restricted to Sales Domain</span>
        </div>
      </div>

      {/* Sales KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Territory</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">Tamil Nadu Central</div>
          <p className="text-xs text-slate-500 mt-1">Madurai & Coimbatore Hubs</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Catalog</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">4 Core SKUs</div>
          <p className="text-xs text-slate-500 mt-1">Fresh Batter, Snacks & Sweets</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Status</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">Phase 4 Ready</div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Requires Admin Approval</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">GST Compliance</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">CGST/SGST 33</div>
          <p className="text-xs text-slate-500 mt-1">TN Intrastate / IGST Interstate</p>
        </div>

      </div>

      {/* Pricing & Customer Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Product Catalog */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-amber-600" />
            Standard Price Reference (Tamil Nadu Baseline)
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {productPriceList.map((p) => (
              <div key={p.sku} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{p.name}</div>
                  <div className="text-[11px] text-slate-500">HSN: {p.hsn} • GST: {p.gst}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{p.price}</div>
                  <span className="text-[10px] text-emerald-600 font-medium">B2B Wholesale</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned Customers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Store className="h-4 w-4 text-blue-600" />
            Key Retail Customers (Tamil Nadu & Interstate)
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {retailCustomers.map((c) => (
              <div key={c.name} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{c.name}</div>
                  <div className="text-[11px] text-slate-500">{c.area} • GSTIN: {c.gst}</div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
