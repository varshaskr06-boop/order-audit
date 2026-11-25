import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign, ArrowLeft, CheckCircle2, AlertTriangle,
  Building2, PlusCircle, Truck, ShieldAlert
} from 'lucide-react';

const API = '/api/payments';

export default function RecordSupplierPaymentPage() {
  const { token, user, setActivePage } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [methods, setMethods] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const role = (user?.role || '').toUpperCase();
  const isManagement = ['ADMIN', 'OWNER'].includes(role);

  const [formData, setFormData] = useState({
    supplier_id: '1',
    supplier_name: 'Kaveri Delta Agro Millers',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'BANK_TRANSFER',
    cash_bank_account_id: '1',
    reference_number: '',
    notes: '',
    discrepancy_override_reason: ''
  });

  const [allocations, setAllocations] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [accRes, mRes, suppRes] = await Promise.all([
        fetch(`${API}/accounts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/methods`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/master/suppliers`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const accJson = await accRes.json();
      const mJson = await mRes.json();
      const suppJson = await suppRes.json();

      if (accJson.success) setAccounts(accJson.data);
      if (mJson.success) setMethods(mJson.data);
      if (suppJson.success && suppJson.data) {
        setSuppliers(suppJson.data);
        if (suppJson.data.length > 0) {
          loadSupplierInvoices(suppJson.data[0].id, suppJson.data[0].supplier_name);
        }
      } else {
        const mockSupp = [
          { id: 1, supplier_name: 'Kaveri Delta Agro Millers' },
          { id: 2, supplier_name: 'Guntur Dal Traders' },
          { id: 3, supplier_name: 'Sri Balaji Packaging' }
        ];
        setSuppliers(mockSupp);
        loadSupplierInvoices(1, 'Kaveri Delta Agro Millers');
      }
    } catch (e) {
      console.error('Failed to load supplier form dependencies');
    }
  };

  const loadSupplierInvoices = async (supplierId, supplierName) => {
    setFormData(prev => ({ ...prev, supplier_id: supplierId, supplier_name: supplierName }));
    setAllocations({});
    try {
      const res = await fetch(`${API}/suppliers/${supplierId}/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setInvoices(json.data);
    } catch (e) {
      console.error('Failed to load supplier invoices');
    }
  };

  const handleAllocationChange = (invId, val) => {
    setAllocations(prev => ({
      ...prev,
      [invId]: Number(val || 0)
    }));
  };

  const totalAllocated = Object.values(allocations).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const paymentAmount = Number(formData.amount || 0);
  const unallocatedAmount = Math.max(0, paymentAmount - totalAllocated);

  const hasAnyDiscrepancy = Object.entries(allocations).some(([invId, amt]) => {
    if (Number(amt) <= 0) return false;
    const inv = invoices.find(i => i.id === parseInt(invId));
    return inv && inv.has_discrepancy;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (totalAllocated > paymentAmount) {
      setError(`Allocated total (₹${totalAllocated}) cannot exceed payment amount (₹${paymentAmount}).`);
      setLoading(false);
      return;
    }

    if (hasAnyDiscrepancy && (!isManagement || !formData.discrepancy_override_reason)) {
      setError('Cannot proceed: Selected invoice has a Phase 5 Three-Way Matching DISCREPANCY. Management approval and explicit override reason required.');
      setLoading(false);
      return;
    }

    const allocList = Object.entries(allocations)
      .filter(([_, amt]) => Number(amt) > 0)
      .map(([invId, amt]) => {
        const inv = invoices.find(i => i.id === parseInt(invId));
        return {
          supplier_invoice_id: parseInt(invId),
          invoice_number: inv?.invoice_number || `INV-${invId}`,
          allocated_amount: Number(amt)
        };
      });

    try {
      const res = await fetch(`${API}/supplier-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          amount: paymentAmount,
          allocations: allocList,
          is_advance: unallocatedAmount > 0
        })
      });

      const json = await res.json();
      if (json.success) {
        setSuccess(`Supplier Payment Voucher ${json.data?.voucher_number} processed (${json.data?.status})!`);
        setTimeout(() => setActivePage('supplier-payments'), 1500);
      } else {
        setError(json.message || 'Failed to process supplier payment');
      }
    } catch (e) {
      setError('Network error processing supplier payment');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('supplier-payments')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Record Supplier Payment Voucher</h1>
            <p className="text-xs text-slate-500">
              Module 2: Procurement invoice settlements, 3WM discrepancy protection &amp; approval threshold (&gt;₹50k)
            </p>
          </div>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Supplier & Payment Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            1. Supplier &amp; Payment Particulars
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Select Supplier *</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => {
                  const s = suppliers.find(x => x.id === parseInt(e.target.value));
                  loadSupplierInvoices(e.target.value, s?.supplier_name || 'Supplier');
                }}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.supplier_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Disbursement Date *</label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white font-bold"
                placeholder="0.00"
                required
              />
              {Number(formData.amount) > 50000 && (
                <p className="text-[11px] text-purple-700 mt-1">
                  ℹ️ Payment exceeds ₹50,000 threshold and will require Admin/Owner approval before disbursement.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method *</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
              >
                {methods.map(m => (
                  <option key={m.id} value={m.method_code}>{m.method_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Source Bank / Cash A/C *</label>
              <select
                value={formData.cash_bank_account_id}
                onChange={(e) => setFormData({ ...formData, cash_bank_account_id: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.account_name} ({fmt(a.current_balance)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bank Reference / UTR Number</label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                placeholder="e.g. RTGS transaction number"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Multi-Bill Allocation & 3WM Matching Check */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              2. Settle Supplier Invoices
            </h2>
            <div className="text-xs">
              <span className="text-slate-500">Allocated: </span>
              <span className="font-bold text-blue-600">{fmt(totalAllocated)}</span>
              <span className="text-slate-400 mx-2">|</span>
              <span className="text-slate-500">Advance Balance: </span>
              <span className="font-bold text-purple-600">{fmt(unallocatedAmount)}</span>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
              No unpaid invoices found for this supplier. Total payment will be recorded as an <b>unallocated supplier advance</b>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">Bill #</th>
                    <th className="px-3 py-2 text-left">Supplier Invoice #</th>
                    <th className="px-3 py-2 text-left">3WM Status</th>
                    <th className="px-3 py-2 text-right">Bill Total</th>
                    <th className="px-3 py-2 text-right">Already Paid</th>
                    <th className="px-3 py-2 text-right">Balance Due</th>
                    <th className="px-3 py-2 text-right">Allocate Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map(inv => (
                    <tr key={inv.id} className={inv.has_discrepancy ? 'bg-amber-50/60' : ''}>
                      <td className="px-3 py-2 font-mono font-semibold text-slate-800">{inv.invoice_number}</td>
                      <td className="px-3 py-2 text-slate-600 font-mono">{inv.supplier_invoice_number}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          inv.match_status === 'MATCHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.match_status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">{fmt(inv.grand_total)}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{fmt(inv.amount_paid)}</td>
                      <td className="px-3 py-2 text-right font-bold text-blue-700">{fmt(inv.balance_due)}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          max={inv.balance_due}
                          value={allocations[inv.id] || ''}
                          onChange={(e) => handleAllocationChange(inv.id, e.target.value)}
                          className="w-32 border border-slate-300 rounded p-1 text-right text-xs"
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3WM Discrepancy Override Warning */}
          {hasAnyDiscrepancy && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-2 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <ShieldAlert className="h-4 w-4" />
                THREE-WAY MATCHING DISCREPANCY DETECTED
              </div>
              <p>
                One or more allocated invoices have price/quantity discrepancies from Phase 5 Three-Way Matching.
                Payment of discrepant supplier bills is blocked unless an authorized user (ADMIN/OWNER) provides an explicit exception reason.
              </p>
              <div>
                <label className="block font-semibold mb-1">Documented Management Exception Reason *</label>
                <input
                  type="text"
                  value={formData.discrepancy_override_reason}
                  onChange={(e) => setFormData({ ...formData, discrepancy_override_reason: e.target.value })}
                  placeholder="e.g. Price difference approved due to diesel surcharge"
                  className="w-full border border-amber-300 rounded p-2 text-xs bg-white text-slate-900"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setActivePage('supplier-payments')}
            className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Processing Payment...' : 'Generate Payment Voucher'}
          </button>
        </div>
      </form>
    </div>
  );
}
