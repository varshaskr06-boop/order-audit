import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Search, Printer, Download, Calendar, User,
  ArrowUpRight, ArrowDownLeft, DollarSign, RefreshCw, CheckCircle2
} from 'lucide-react';

const API = '/api/payments';

export default function CustomerStatementsPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/master/customers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setCustomers(json.data);
          setSelectedCustomerId(json.data[0].id.toString());
        }
      } catch (e) {
        console.error('Failed to load customers', e);
      }
    };
    fetchCustomers();
  }, [token]);

  const fetchStatement = useCallback(async () => {
    if (!selectedCustomerId) return;
    setLoading(true);
    setError('');
    try {
      let url = `${API}/customers/${selectedCustomerId}/statement?`;
      if (fromDate) url += `from_date=${fromDate}&`;
      if (toDate) url += `to_date=${toDate}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setStatement(json.data);
      } else {
        setError(json.message || 'Failed to generate customer statement');
      }
    } catch (e) {
      setError('Network error generating customer statement');
    } finally {
      setLoading(false);
    }
  }, [selectedCustomerId, fromDate, toDate, token]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchStatement();
    }
  }, [selectedCustomerId, fetchStatement]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!statement || !statement.ledger || statement.ledger.length === 0) {
      alert('No ledger records to export');
      return;
    }
    const headers = ['Date', 'Type', 'Reference', 'Description', 'Debit (INR)', 'Credit (INR)', 'Running Balance (INR)'];
    const rows = statement.ledger.map(row => [
      `"${row.date || ''}"`,
      `"${row.type || ''}"`,
      `"${row.reference || ''}"`,
      `"${(row.description || '').replace(/"/g, '""')}"`,
      row.debit.toFixed(2),
      row.credit.toFixed(2),
      row.running_balance.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer_statement_${statement.customer_id}_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-6 w-6 text-amber-600" />
            Customer Statement of Account
          </h1>
          <p className="text-sm text-slate-500">
            Real-time debit/credit customer ledger with verified running balances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatement}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCsv}
            disabled={!statement || !statement.ledger?.length}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            disabled={!statement}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl transition shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print Statement
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Customer</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name} ({c.city || 'TN'})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Printable Statement Canvas */}
      {statement && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none space-y-6">
          {/* Statement Header / Letterhead */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🍛</span>
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  Sri Meenakshi Agro &amp; Traditional Foods Pvt Ltd
                </span>
              </div>
              <p className="text-xs text-slate-500">12, Traditional Foods Highway, Madurai, Tamil Nadu 625001</p>
              <p className="text-xs text-slate-500">GSTIN: 33AAAAA0000A1Z5 | FSSAI Lic: 12423000000123</p>
              <p className="text-xs text-slate-500">Email: accounts@srimeenakshiagro.com | Phone: +91 452 2345678</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-black text-amber-600 uppercase tracking-wider">Statement of Account</h2>
              <div className="text-xs text-slate-500 mt-1">Period: {statement.statement_period?.from} to {statement.statement_period?.to}</div>
              <div className="text-xs text-slate-400">Generated: {new Date().toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          {/* Customer Info & Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div>
              <div className="text-xs font-bold uppercase text-slate-400 mb-1">Customer / Debtor Details</div>
              <div className="text-base font-bold text-slate-800">{statement.customer_name}</div>
              <div className="text-xs text-slate-600 mt-1">Customer ID: CUST-{statement.customer_id}</div>
              <div className="text-xs text-slate-500 mt-0.5">Account Status: Active B2B Partner</div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center sm:text-right">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-500">Total Billed (Dr)</div>
                <div className="text-sm font-extrabold text-blue-600">₹{statement.total_invoiced?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-500">Total Paid (Cr)</div>
                <div className="text-sm font-extrabold text-emerald-600">₹{statement.total_paid?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <div className="text-[10px] font-bold uppercase text-amber-800">Closing Balance</div>
                <div className="text-sm font-black text-amber-700">₹{statement.closing_balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>

          {/* Running Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Particulars / Details</th>
                  <th className="py-3 px-4 text-right">Debit (₹)</th>
                  <th className="py-3 px-4 text-right">Credit (₹)</th>
                  <th className="py-3 px-4 text-right">Running Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statement.ledger && statement.ledger.length > 0 ? (
                  statement.ledger.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{row.date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            row.type === 'INVOICE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-xs text-slate-800">{row.reference}</td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">{row.description}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        {row.debit > 0 ? `₹${row.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600">
                        {row.credit > 0 ? `₹${row.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{row.running_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No transaction entries found for the selected customer and period.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-xs">
                <tr>
                  <td colSpan="4" className="py-3 px-4 text-right text-slate-700 uppercase">Period Totals &amp; Closing Balance</td>
                  <td className="py-3 px-4 text-right font-mono text-blue-700">
                    ₹{statement.total_invoiced?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700">
                    ₹{statement.total_paid?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-amber-700 text-sm">
                    ₹{statement.closing_balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Terms & Signatures */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <div className="font-bold text-slate-700 mb-1">Notes &amp; Banking Instructions:</div>
              <p>Please remit outstanding balance via RTGS/NEFT or IMPS to our primary current account.</p>
              <p className="mt-1 font-mono text-[11px] text-slate-600">
                A/C: 50200012345678 • HDFC Bank • IFSC: HDFC0000123 • Madurai Branch
              </p>
            </div>
            <div className="text-right flex flex-col justify-end">
              <div className="h-10 border-b border-slate-300 border-dashed w-48 ml-auto mb-1"></div>
              <div className="font-bold text-slate-700">Authorized Finance Signatory</div>
              <div className="text-[10px] text-slate-400">Sri Meenakshi Agro &amp; Traditional Foods Pvt Ltd</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
