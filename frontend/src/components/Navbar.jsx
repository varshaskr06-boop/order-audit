import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  LayoutDashboard, 
  UserCheck, 
  LogOut, 
  ShieldAlert, 
  Factory, 
  Receipt, 
  FileSpreadsheet, 
  Crown,
  Building2
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, activePage, setActivePage } = useAuth();

  if (!user) return null;

  const role = (user.role || '').toUpperCase();

  // Role badges styling
  const getRoleBadge = (r) => {
    switch (r) {
      case 'OWNER':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'PRODUCTION':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'ACCOUNTANT':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'SALESMAN':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['SALESMAN', 'ADMIN', 'PRODUCTION', 'ACCOUNTANT', 'OWNER'],
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      roles: ['ADMIN', 'OWNER'],
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: UserCheck,
      roles: ['SALESMAN', 'ADMIN', 'PRODUCTION', 'ACCOUNTANT', 'OWNER'],
    },
  ];

  const visibleNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Company Title */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-xl shadow-inner cursor-pointer" onClick={() => setActivePage('dashboard')}>
              🍛
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white hover:text-amber-300 cursor-pointer transition-colors" onClick={() => setActivePage('dashboard')}>
                  Sri Meenakshi Agro & Foods
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getRoleBadge(role)}`}>
                  {role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Order-to-Audit ERP • Madurai, TN (33)
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-100">{user.full_name}</div>
              <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{user.email}</div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
