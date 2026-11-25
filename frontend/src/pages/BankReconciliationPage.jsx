import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRightLeft, Upload, RefreshCw, CheckCircle2, AlertTriangle,
  FileSpreadsheet, Filter, Search, X
} from 'lucide-react';

const API = '/api/payments';

export default function BankReconciliationPage() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('1');
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Import Modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [fileName, setFileName] = useState('HDFC_Statement_Nov2026.csv');
  const [csvContent, setCsvContent] = useState(`Date,Description,Reference,Type,Amount,Balance
2026-11-21,NEFT CR-HOTEL MEENAKSHI BHAVAN,NEFT-HDFC-9988112,CREDIT,3780.00,624500.00
2026-11-22,UPI CR-SARAVANA RETAIL MART,UPI-BHARATPE-776655,CREDIT,2000.00,626500.00
2026-11-23,RTGS DR-KAVERI DELTA AGRO MILLERS,RTGS-HDFC-4433221,DEBIT,35467.50,591032.50
2026-11-23,UNRECONCILED CHEQUE DEPOSIT,CHQ-DEP-112233,CREDIT,4500.00,595532.50`);

  // Reconcile Modal state
  const [reconModalOpen, setReconModalOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const [reconType, setReconType] = useState('CUSTOMER');
  const [reconPaymentId, setReconPaymentId] = useState('1');
  const [reconNotes, setReconNotes] = useState('');

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/accounts`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) {
        const banks = json.data.filter(a => a.account_type === 'BANK');
        setAccounts(banks);
        if (banks.length > 0 && !selectedAccountId) {
          setSelectedAccountId(String(banks[0].id));
        }
      }
    } catch (e) {
      console.error('Failed to load bank accounts');
    }
  }, [token, selectedAccountId]);

  const fetchLines = useCallback(async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    setError('');
    try {
      const url = statusFilter
        ? `${API}/accounts/${selectedAccountId}/statement-lines?status=${statusFilter}`
        : `${API}/accounts/${selectedAccountId}/statement-lines`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setLines(json.data);
      else setError(json.message || 'Failed to load statement lines');
    } catch (e) {
      setError('Network error fetching statement lines');
    } finally {
      setLoading(false);
    }
  }, [token, selectedAccountId, statusFilter]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { fetchLines(); }, [fetchLines]);

  const handleImport = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/accounts/${selectedAccountId}/import-statement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ file_name: fileName, csv_content: csvContent })
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(json.message);
        setImportModalOpen(false);
        fetchLines();
      } else {
        setError(json.message || 'Failed to import statement');
      }
    } catch (e) {
      setError('Network error during statement import');
    }
  };

  const handleReconcile = async (e) => {
    e.preventDefault();
    if (!selectedLine) return;
    try {
      const res = await fetch(`${API}/reconcile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          statement_line_id: selectedLine.id,
          payment_type: reconType,
          payment_id: reconPaymentId,
          matched_amount: selectedLine.amount,
          notes: reconNotes
        })
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Line #${selectedLine.id} reconciled successfully!`);
        setReconModalOpen(false);
        fetchLines();
      } else {
        setError(json.message || 'Failed to reconcile entry');
      }
    } catch (e) {
      setError('Network error processing reconciliation');
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bank Statement Reconciliation</h1>
          <p className="text-sm text-slate-500">
            Module 3: CSV Statement Imports, Transaction Matching &amp; Ledger Audit Trail
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLines}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={() => { setImportModalOpen(true); setError(''); setSuccess(''); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm transition"
          >
            <Upload className="h-4 w-4" /> Import Statement CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Account Selector & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600 uppercase">Bank Account:</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.account_name} ({fmt(a.current_balance)})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">All Transactions</option>
            <option value="UNMATCHED">Unmatched Only</option>
            <option value="MATCHED">Matched Only</option>
            <option value="PARTIALLY_MATCHED">Partially Matched</option>
          </select>
        </div>
      </div>

      {/* Statement Lines Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3">Txn Date</th>
                <th className="px-6 py-3">Description / Narration</th>
                <th className="px-6 py-3">Reference #</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-right">Running Balance</th>
                <th className="px-6 py-3">Reconciliation</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    Loading statement lines...
                  </td>
                </tr>
              ) : lines.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    No statement lines found. Import a CSV statement to begin reconciliation.
                  </td>
                </tr>
              ) : (
                lines.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 text-xs text-slate-600">{l.transaction_date}</td>
                    <td className="px-6 py-3 font-medium text-slate-900 max-w-sm truncate">{l.description}</td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">{l.reference_number || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        l.transaction_type === 'CREDIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {l.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-slate-900">{fmt(l.amount)}</td>
                    <td className="px-6 py-3 text-right text-xs text-slate-600">{fmt(l.balance_after)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        l.reconciliation_status === 'MATCHED' ? 'bg-emerald-100 text-emerald-800' :
                        l.reconciliation_status === 'PARTIALLY_MATCHED' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {l.reconciliation_status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      {l.reconciliation_status !== 'MATCHED' && (
                        <button
                          onClick={() => { setSelectedLine(l); setReconModalOpen(true); }}
                          className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded text-xs font-medium"
                        >
                          Match
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="h-5 w-5 text-cyan-600" />
                Import Bank Statement CSV
              </h3>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleImport} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Statement File Name *</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">CSV Content (Header: Date,Description,Reference,Type,Amount,Balance) *</label>
                <textarea
                  rows="6"
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Process CSV Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Reconcile Modal */}
      {reconModalOpen && selectedLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-cyan-600" />
                Match Statement Entry
              </h3>
              <button onClick={() => setReconModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReconcile} className="p-6 space-y-4 text-sm">
              <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                <p><span className="font-semibold text-slate-700">Line Narration:</span> {selectedLine.description}</p>
                <p><span className="font-semibold text-slate-700">Amount:</span> <b className="text-sm">{fmt(selectedLine.amount)}</b> ({selectedLine.transaction_type})</p>
                <p><span className="font-semibold text-slate-700">Ref:</span> {selectedLine.reference_number || 'None'}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Matching Payment Type</label>
                <select
                  value={reconType}
                  onChange={(e) => setReconType(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                >
                  <option value="CUSTOMER">Customer Receipt (Inward)</option>
                  <option value="SUPPLIER">Supplier Payment Voucher (Outward)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Payment Record ID *</label>
                <input
                  type="number"
                  value={reconPaymentId}
                  onChange={(e) => setReconPaymentId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reconciliation Notes</label>
                <input
                  type="text"
                  value={reconNotes}
                  onChange={(e) => setReconNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  placeholder="e.g. Verified with bank statement line"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReconModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Confirm Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
