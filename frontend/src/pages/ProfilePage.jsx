import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserCheck, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Key, 
  Clock, 
  CheckCircle2, 
  Building2,
  Calendar
} from 'lucide-react';

export default function ProfilePage() {
  const { user, token } = useAuth();

  if (!user) return null;

  const role = (user.role || '').toUpperCase();

  const getRoleBadge = (r) => {
    switch (r) {
      case 'OWNER':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'PRODUCTION':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'ACCOUNTANT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'SALESMAN':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const rolePermissions = {
    ADMIN: ['User Management (Create, Edit, Deactivate)', 'Master Data Setup', 'Sales Order Approvals', 'System Health & Security Logs', 'Costing Master Configuration'],
    SALESMAN: ['Create Sales Orders', 'Customer Catalog & Credit Limits', 'Customer-Wise Order History', 'Stock Availability Verification'],
    PRODUCTION: ['Create Production Runs', 'Issue Raw Materials by BOM', 'Record Expected vs Actual Output', 'Calculate Wastage & Yield Variance', 'Auto-update Stock Ledger'],
    ACCOUNTANT: ['Sales Register (Read-Only)', 'Purchase Register (Read-Only)', 'GST Summary (TN CGST/SGST & IGST)', 'Stock Ledger Audit', 'Outstanding Payments Report'],
    OWNER: ['Full Executive Governance', 'Gross Profit Margin Analytics', 'Total Inventory Valuation', 'Staff Directory Oversight', 'Cost Per Packet Audit'],
  };

  const permissions = rolePermissions[role] || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {user.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{user.full_name}</h2>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getRoleBadge(role)}`}>
                  {role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Account Active
          </div>
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
          
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <Mail className="h-4 w-4 text-slate-500" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Email Address</div>
              <div className="font-semibold text-slate-800">{user.email}</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <Phone className="h-4 w-4 text-slate-500" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Phone Contact</div>
              <div className="font-semibold text-slate-800">{user.phone || 'Not configured'}</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <Key className="h-4 w-4 text-slate-500" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">User ID / Token Type</div>
              <div className="font-semibold text-slate-800">User #{user.id} • Bearer JWT (HS256)</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <Building2 className="h-4 w-4 text-slate-500" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Enterprise</div>
              <div className="font-semibold text-slate-800">Sri Meenakshi Agro & Foods (TN 33)</div>
            </div>
          </div>

        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Active Role Privileges & Access Boundaries ({role})
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Features enabled for your role in accordance with the Order-to-Audit RBAC policy.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {permissions.map((p, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-center gap-2 text-xs text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
