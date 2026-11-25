import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Scale,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Eye,
  FileText,
  RotateCcw,
  CheckSquare,
  X,
  History,
  TrendingDown,
  Building2,
  Package,
  Receipt
} from 'lucide-react';

export default function ThreeWayMatchingPage() {
  const { user, token } = useAuth();
  const [matches, setMatches] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [explanationText, setExplanationText] = useState('');

  const role = (user?.role || '').toUpperCase();
  const canReview = ['ACCOUNTANT', 'ADMIN', 'OWNER'].includes(role);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, invRes, poRes, grnRes] = await Promise.all([
        fetch('/api/purchase/matching', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/purchase/invoices', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/purchase/orders', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/purchase/grns', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const mData = await mRes.json();
      const invData = await invRes.json();
      const poData = await poRes.json();
      const grnData = await grnRes.json();

      if (mData.success) setMatches(mData.data || []);
      if (invData.success) setInvoices(invData.data || []);
      if (poData.success) setOrders(poData.data || []);
      if (grnData.success) setGrns(grnData.data || []);
    } catch (err) {
      setError('Failed to fetch three-way matching records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [token]);

  const getInvoice = (id) => invoices.find((i) => i.id === parseInt(id));
  const getPO = (id) => orders.find((p) => p.id === parseInt(id));
  const getGRN = (id) => grns.find((g) => g.id === parseInt(id));

  const handleRunMatch = async (invoiceId) => {
    try {
      const res = await fetch(`/api/purchase/invoices/${invoiceId}/match`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to match invoice');

      setSuccessMsg(`Three-way match updated: ${data.data.match_status}`);
      fetchMatches();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenExplain = (match) => {
    setSelectedMatch(match);
    setExplanationText(match.review_explanation || '');
    setShowExplainModal(true);
  };

  const handleConfirmExplain = async () => {
    if (!explanationText.trim()) {
      setError('An explanation is mandatory for resolving or approving discrepant matches.');
      return;
    }
    try {
      const res = await fetch(`/api/purchase/invoices/${selectedMatch.invoice_id}/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ explanation: explanationText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to record explanation');

      setSuccessMsg(`Accountant explanation recorded for Match Record #${selectedMatch.id}.`);
      setShowExplainModal(false);
      fetchMatches();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredMatches = matches.filter((m) => {
    const inv = getInvoice(m.invoice_id);
    const po = getPO(m.po_id);
    const text = `${m.id} ${inv?.invoice_number || ''} ${inv?.supplier_invoice_number || ''} ${po?.po_number || ''}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus ? m.match_status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  const getMatchStatusBadge = (status) => {
    switch (status) {
      case 'MATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Matched (0 Discrepancy)
          </span>
        );
      case 'PARTIALLY_MATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Minor Variance
          </span>
        );
      case 'DISCREPANCY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Discrepancy Found
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold text-xs uppercase tracking-wider">
              Module 8
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Three-Way Matching System
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Automated financial verification: Purchase Order (PO) ↔ Goods Received Note (GRN) ↔ Supplier Invoice
          </p>
        </div>

        <button
          onClick={fetchMatches}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
        >
          Re-evaluate Matches
        </button>
      </div>

      {/* Rules Notice */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
        <Scale className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Three-Way Matching Policy:</strong> Never automatically mark a discrepant invoice as approved for payment. Any discrepancy in ordered vs accepted vs invoiced quantities, or PO rates vs billed invoice rates, requires recorded accountant justification before disbursement.
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, PO #, match ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-semibold">Match Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
          >
            <option value="">All Match Results</option>
            <option value="MATCHED">Matched (0 Variance)</option>
            <option value="PARTIALLY_MATCHED">Partially Matched</option>
            <option value="DISCREPANCY">Discrepancy (Requires Review)</option>
            <option value="PENDING_REVIEW">Pending Review</option>
          </select>
        </div>
      </div>

      {/* Matching Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Match ID</th>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">PO Value</th>
                <th className="px-5 py-3.5">GRN Accepted Qty</th>
                <th className="px-5 py-3.5">Invoice Value</th>
                <th className="px-5 py-3.5">Qty Diff</th>
                <th className="px-5 py-3.5">Price Diff</th>
                <th className="px-5 py-3.5">Match Result</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-5 py-8 text-center text-slate-400">
                    Evaluating three-way matching records...
                  </td>
                </tr>
              ) : filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-8 text-center text-slate-400">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((m) => {
                  const inv = getInvoice(m.invoice_id);
                  const po = getPO(m.po_id);
                  const hasDiscrepancy = ['DISCREPANCY', 'PARTIALLY_MATCHED'].includes(m.match_status);

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        m.match_status === 'DISCREPANCY' ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 font-bold text-slate-900">3WM #{m.id}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-800">{inv?.invoice_number || `INV #${m.invoice_id}`}</div>
                        <div className="text-[10px] font-mono text-slate-400">{inv?.supplier_invoice_number}</div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        ₹{(m.po_grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {m.grn_accepted_qty_total !== null ? `${m.grn_accepted_qty_total} units` : 'No GRN linked'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        ₹{(m.invoice_grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5">
                        {Math.abs(m.qty_variance || 0) > 0.001 ? (
                          <span className="font-bold text-rose-600">
                            {m.qty_variance > 0 ? `+${m.qty_variance}` : m.qty_variance}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">0</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {Math.abs(m.price_variance || 0) > 0.01 ? (
                          <span className="font-bold text-rose-600">
                            {m.price_variance > 0 ? `+₹${m.price_variance}` : `-₹${Math.abs(m.price_variance)}`}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">₹0.00</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">{getMatchStatusBadge(m.match_status)}</td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedMatch(m);
                            setShowDetailModal(true);
                          }}
                          title="Inspect 3WM Comparison Details"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {hasDiscrepancy && canReview && (
                          <button
                            onClick={() => handleOpenExplain(m)}
                            title="Record Accountant Explanation"
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] inline-flex items-center gap-1 border border-amber-200"
                          >
                            <FileText className="w-3 h-3" /> Explain
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT COMPARISON MODAL */}
      {showDetailModal && selectedMatch && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">
                  Three-Way Matching Comparison (Record #{selectedMatch.id})
                </h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Columns Comparison */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              {/* PO Card */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                <div className="text-[10px] font-bold uppercase text-blue-700">1. Purchase Order</div>
                <div className="font-bold text-slate-900">PO #{selectedMatch.po_id}</div>
                <div className="text-slate-600">
                  Ordered Total: <strong className="text-slate-900">₹{selectedMatch.po_grand_total}</strong>
                </div>
              </div>

              {/* GRN Card */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1.5">
                <div className="text-[10px] font-bold uppercase text-purple-700">2. Goods Receipt</div>
                <div className="font-bold text-slate-900">
                  {selectedMatch.grn_id ? `GRN #${selectedMatch.grn_id}` : 'No GRN Linked'}
                </div>
                <div className="text-slate-600">
                  Accepted Qty:{' '}
                  <strong className="text-slate-900">{selectedMatch.grn_accepted_qty_total || 0} units</strong>
                </div>
              </div>

              {/* Invoice Card */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="text-[10px] font-bold uppercase text-emerald-700">3. Supplier Invoice</div>
                <div className="font-bold text-slate-900">INV #{selectedMatch.invoice_id}</div>
                <div className="text-slate-600">
                  Billed Total: <strong className="text-slate-900">₹{selectedMatch.invoice_grand_total}</strong>
                </div>
              </div>
            </div>

            {/* Discrepancy Breakdown */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Match Status:</span>
                {getMatchStatusBadge(selectedMatch.match_status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Quantity Variance (Billed vs Received):</span>
                <span className={`font-bold ${selectedMatch.qty_variance !== 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {selectedMatch.qty_variance || 0} units
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Price Variance (Invoice vs PO Total):</span>
                <span className={`font-bold ${selectedMatch.price_variance !== 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  ₹{selectedMatch.price_variance || 0}
                </span>
              </div>
              {selectedMatch.discrepancy_details && (
                <div className="pt-2 border-t border-slate-200 text-rose-700">
                  <strong>Detected Issues:</strong> {selectedMatch.discrepancy_details}
                </div>
              )}
            </div>

            {/* Existing Explanation */}
            {selectedMatch.review_explanation && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <strong>Accountant Review Explanation:</strong>
                <p className="text-slate-700 italic">"{selectedMatch.review_explanation}"</p>
                <div className="text-[10px] text-amber-700">
                  Reviewed at: {new Date(selectedMatch.reviewed_at || selectedMatch.updated_at).toLocaleString()}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPLANATION MODAL */}
      {showExplainModal && selectedMatch && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <FileText className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                Accountant Explanation: Match #{selectedMatch.id}
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Provide formal accounting justification for variances between Purchase Order, Goods Receipt, and Vendor Invoice.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>
                <span className="text-slate-400">Issues:</span>{' '}
                <span className="text-rose-700 font-semibold">{selectedMatch.discrepancy_details || 'Variances detected'}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Accounting Explanation *</label>
              <textarea
                rows="3"
                required
                placeholder="e.g. 2 kg rejected due to moisture; supplier agreed to credit note; payment authorized for 398 kg only..."
                value={explanationText}
                onChange={(e) => setExplanationText(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExplainModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmExplain}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Save Review Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
