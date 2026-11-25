import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Scale,
  Award,
  Truck,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Filter,
  ArrowRight,
  TrendingDown,
  Layers,
  FileCheck
} from 'lucide-react';

export default function QuotationComparisonPage() {
  const { user, token, setActivePage } = useAuth();
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [itemType, setItemType] = useState('RAW_MATERIAL');
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Selection modal
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectionReason, setSelectionReason] = useState('');

  const role = (user?.role || '').toUpperCase();
  const canSelect = ['ADMIN', 'OWNER'].includes(role);

  // Load materials for selection dropdown
  useEffect(() => {
    fetch('/api/master/raw-materials', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.rawMaterials && data.rawMaterials.length > 0) {
          setRawMaterials(data.rawMaterials);
          setSelectedMaterialId(String(data.rawMaterials[0].id));
        }
      })
      .catch(() => {});
  }, [token]);

  // Fetch side-by-side comparison for selected material
  const fetchComparison = async (matId) => {
    if (!matId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/purchase/quotations/compare?material_id=${matId}&item_type=${itemType}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to compare quotations');
      setComparisonData(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMaterialId) {
      fetchComparison(selectedMaterialId);
    }
  }, [selectedMaterialId, itemType, token]);

  // Find lowest unit price
  const lowestPrice =
    comparisonData.length > 0
      ? Math.min(...comparisonData.map((c) => parseFloat(c.unit_price || 999999)))
      : null;

  const handleOpenSelect = (quote) => {
    setSelectedQuote(quote);
    setSelectionReason('');
    setShowSelectModal(true);
  };

  const handleConfirmSelect = async () => {
    if (!selectionReason.trim()) {
      setError('Please provide a mandatory selection justification.');
      return;
    }
    try {
      const res = await fetch(`/api/purchase/quotations/${selectedQuote.quotation_id}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: selectionReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to select quotation');

      setSuccessMsg(`Quotation ${selectedQuote.quotation_number} selected as preferred vendor.`);
      setShowSelectModal(false);
      fetchComparison(selectedMaterialId);
    } catch (err) {
      setError(err.message);
    }
  };

  const selectedMaterialObj = rawMaterials.find((m) => m.id === parseInt(selectedMaterialId));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold text-xs uppercase tracking-wider">
              Module 3
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Quotation Comparison (Side-by-Side)
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Compare material prices, discounts, GST, lead times, and terms across competing suppliers
          </p>
        </div>

        <button
          onClick={() => setActivePage('supplier-quotations')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
        >
          View All Quotations
        </button>
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

      {/* Material Selector Control */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block">Select Material to Compare:</label>
            <div className="text-[11px] text-slate-400">
              Pulls live quotes from all competing suppliers for this SKU
            </div>
          </div>
        </div>

        <div className="w-full sm:w-80">
          <select
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
          >
            {rawMaterials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.uom})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Grid */}
      {loading ? (
        <div className="bg-white p-12 text-center text-xs text-slate-400 rounded-2xl border border-slate-200">
          Loading competing supplier quotations...
        </div>
      ) : comparisonData.length === 0 ? (
        <div className="bg-white p-12 text-center text-xs text-slate-400 rounded-2xl border border-slate-200 space-y-2">
          <p>No supplier quotations found for "{selectedMaterialObj?.name || 'this item'}".</p>
          <button
            onClick={() => setActivePage('supplier-quotations')}
            className="text-amber-600 font-bold hover:underline"
          >
            Record quotations for this material first
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium px-1">
            <span>
              Comparing <strong className="text-slate-900">{comparisonData.length}</strong> supplier bids for{' '}
              <strong className="text-amber-700">{selectedMaterialObj?.name}</strong>:
            </span>
            <span className="text-slate-400 text-[11px]">
              * Lowest rate highlighted with badge. Selection is not automatic.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {comparisonData.map((quote) => {
              const isLowest = parseFloat(quote.unit_price) === lowestPrice;
              const isSelected = quote.quotation_status === 'SELECTED';

              return (
                <div
                  key={quote.quotation_id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 relative transition-all ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : isLowest
                      ? 'border-amber-400 ring-2 ring-amber-400/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Badges */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {quote.quotation_number}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isLowest && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" /> Lowest Rate
                        </span>
                      )}
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Award className="w-3 h-3" /> Selected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Supplier Header */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{quote.supplier_name}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>GSTIN: {quote.supplier_gstin || '33AAAAA...'}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">
                        {quote.supplier_state_code === '33' ? 'Tamil Nadu (Intrastate)' : 'Interstate'}
                      </span>
                    </div>
                  </div>

                  {/* Price Comparison Card */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-medium">Quoted Rate:</span>
                      <span className="text-2xl font-black text-slate-900">
                        ₹{parseFloat(quote.unit_price).toFixed(2)}{' '}
                        <span className="text-xs font-normal text-slate-500">/ {quote.uom}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                      <span>Discount:</span>
                      <span className="font-semibold text-slate-800">{quote.discount_pct}%</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>GST Rate:</span>
                      <span className="font-semibold text-slate-800">{quote.gst_rate}%</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Quantity:</span>
                      <span className="font-semibold text-slate-800">
                        {quote.required_qty} {quote.uom}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-700">Total Item Value:</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{parseFloat(quote.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Terms & Delivery */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Lead Time:</span>
                      <span className="font-semibold text-slate-800">
                        {quote.delivery_days ? `${quote.delivery_days} Days` : 'Not specified'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Payment Terms:</span>
                      <span className="font-semibold text-slate-800">{quote.payment_terms || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Delivery Terms:</span>
                      <span className="text-slate-700 truncate max-w-[170px]" title={quote.delivery_terms}>
                        {quote.delivery_terms || 'Factory delivery'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Valid Until:</span>
                      <span className="text-slate-700">{quote.valid_until || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-2">
                    {isSelected ? (
                      <div className="w-full py-2 bg-emerald-50 text-emerald-800 font-bold text-xs text-center rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Selected for Procurement
                      </div>
                    ) : canSelect ? (
                      <button
                        onClick={() => handleOpenSelect(quote)}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                          isLowest
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" /> Select This Supplier
                      </button>
                    ) : (
                      <div className="text-center text-[11px] text-slate-400 py-1">
                        Admin/Owner review required
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SELECTION MODAL */}
      {showSelectModal && selectedQuote && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <Award className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                Award Purchase to {selectedQuote.supplier_name}
              </h3>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>
                <span className="text-slate-500">Quotation #:</span>{' '}
                <strong className="text-slate-900">{selectedQuote.quotation_number}</strong>
              </div>
              <div>
                <span className="text-slate-500">Material:</span>{' '}
                <strong className="text-slate-900">{selectedQuote.material_name}</strong>
              </div>
              <div>
                <span className="text-slate-500">Quoted Rate:</span>{' '}
                <strong className="text-slate-900">₹{selectedQuote.unit_price} / {selectedQuote.uom}</strong>
              </div>
              <div>
                <span className="text-slate-500">Lead Time:</span>{' '}
                <strong className="text-slate-900">{selectedQuote.delivery_days} Days</strong>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Sri Meenakshi ERP compliance policy requires recording the reason for supplier selection (e.g. price competitiveness, quality consistency, shorter delivery lead time).
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700">Reason for Selection *</label>
              <textarea
                rows="3"
                required
                placeholder="Explain why this supplier is selected over competitors..."
                value={selectionReason}
                onChange={(e) => setSelectionReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-emerald-200 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSelectModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSelect}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Confirm Supplier Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
