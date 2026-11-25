import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  ShieldCheck, 
  Server, 
  Database, 
  UserPlus, 
  Key, 
  Activity, 
  ArrowRight,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, setActivePage } = useAuth();

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              Admin Workspace
            </span>
            <span className="text-xs text-slate-500">Full System Governance</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            System Administration & User Governance
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Logged in as <span className="font-semibold text-slate-900">{user.full_name}</span> ({user.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('users')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <UserPlus className="h-4 w-4" />
            Manage Users
          </button>
        </div>
      </div>

      {/* Admin KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Roles</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Key className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">5 Roles</div>
          <p className="text-xs text-slate-500 mt-1">Admin, Salesman, Prod, Acct, Owner</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Authentication</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">JWT + bcrypt</div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">10 Salt Rounds Active</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Backend Service</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Server className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">Port 5000</div>
          <p className="text-xs text-slate-500 mt-1">Express API Active</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Database Mode</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">PostgreSQL</div>
          <p className="text-xs text-slate-500 mt-1">Transactional Pool Configured</p>
        </div>

      </div>

      {/* Admin Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">User & RBAC Management</h3>
              <p className="text-xs text-slate-500">Create new staff, edit credentials, or toggle active status.</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            As an Administrator, you possess privileges to provision new accounts across all five roles.
            Passwords are encrypted using bcrypt prior to database persistence.
          </p>

          <button
            onClick={() => setActivePage('users')}
            className="w-full py-2.5 px-4 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            Open User Directory <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Security & Session Health</h3>
              <p className="text-xs text-slate-500">Session validity and role authorization guards.</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Current Token Expiry:</span>
              <span className="font-semibold text-slate-800">24 Hours (Rolling)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Role Restriction Check:</span>
              <span className="font-semibold text-emerald-700">Strict Enforcement</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Deactivated Account Login:</span>
              <span className="font-semibold text-rose-700">Blocked (HTTP 403)</span>
            </div>
          </div>

          <button
            onClick={() => setActivePage('profile')}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            View Your Profile & Claims <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
