import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function LoginPage() {
  const { login, loading, authError, setAuthError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Quick Demo Credentials chips for testing all 5 roles
  const demoAccounts = [
    { label: 'Admin', email: 'admin@meenakshifoods.in', pass: 'Admin@123', role: 'ADMIN', color: 'hover:border-purple-400' },
    { label: 'Salesman', email: 'sales@meenakshifoods.in', pass: 'Sales@123', role: 'SALESMAN', color: 'hover:border-blue-400' },
    { label: 'Production', email: 'production@meenakshifoods.in', pass: 'Production@123', role: 'PRODUCTION', color: 'hover:border-amber-400' },
    { label: 'Accountant', email: 'auditor@meenakshifoods.in', pass: 'Auditor@123', role: 'ACCOUNTANT', color: 'hover:border-emerald-400' },
    { label: 'Owner', email: 'owner@meenakshifoods.in', pass: 'Owner@123', role: 'OWNER', color: 'hover:border-rose-400' },
  ];

  const handleQuickFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setValidationErrors({});
    if (setAuthError) setAuthError(null);
  };

  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email format (e.g. name@company.in).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await login(email.trim(), password);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-3xl shadow-lg border border-amber-400/40">
          🍛
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
          Sri Meenakshi Agro & Traditional Foods
        </h1>
        <p className="mt-1 text-xs text-slate-600 font-medium">
          Order-to-Audit Management System • Tamil Nadu (GSTIN: 33AAAAA0000A1Z5)
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200">
          
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your corporate credentials to access your designated workspace.
            </p>
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Authentication failed: </span>
                <span>{authError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) setValidationErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="admin@meenakshifoods.in"
                  className={`block w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    validationErrors.email
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-300 focus:ring-amber-500'
                  }`}
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{validationErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) setValidationErrors((prev) => ({ ...prev, password: null }));
                  }}
                  placeholder="••••••••"
                  className={`block w-full pl-9 pr-10 py-2 text-sm rounded-lg border bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    validationErrors.password
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-300 focus:ring-amber-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{validationErrors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Login Chips */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Quick Test Credentials (5 Roles):
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickFill(acc)}
                  className={`text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 ${acc.color} transition-all`}
                >
                  <div className="text-xs font-bold text-slate-800">{acc.label}</div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">{acc.pass}</div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Security Footer Notice */}
        <div className="mt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Protected with bcrypt password hashing & JWT token security</span>
        </div>
      </div>

    </div>
  );
}
