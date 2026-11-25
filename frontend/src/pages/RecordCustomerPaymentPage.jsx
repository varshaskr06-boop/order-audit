import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard, ArrowLeft, CheckCircle2, AlertTriangle,
  Building2, PlusCircle, Users
} from 'lucide-react';

const API = '/api/payments';

export default function RecordCustomerPaymentPage() {
  const { token, setActivePage } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [methods, setMethods] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    customer_id: '1',
    customer_name: 'Hotel Meenakshi Bhavan (T.Nagar)',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'BANK_TRANSFER',
    cash_bank_account_id: '1',
    reference_number: '',
    notes: '',
    is_advance: false
  });

  const [allocations, setAllocations] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [accRes, mRes, custRes] = await Promise.all([
        fetch(`${API}/accounts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/methods`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/master/customers`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const accJson = await accRes.json();
      const mJson = await mRes.json();
      const custJson = await custRes.json();

      if (accJson.success) setAccounts(accJson.data);
      if (mJson.success) setMethods(mJson.data);
      if (custJson.success && custJson.data) {
        setCustomers(custJson.data);
        if (custJson.data.length > 0) {
          loadCustomerInvoices(custJson.data[0].id, custJson.data[0].customer_name);
        }
      } else {
        // Fallback default customers
        const mockCust = [
          { id: 1, customer_name: 'Hotel Meenakshi Bhavan (T.Nagar)' },
          { id: 2, customer_name: 'Saravana Bhavan Super Store Private Limited' },
          { id: 3, customer_name: 'Bengaluru Traditional Foods Distributor LLP' }
        ];
        setCustomers(mockCust);
        loadCustomerInvoices(1, 'Hotel Meenakshi Bhavan (T.Nagar)');
      }
    } catch (e) {
      console.error('Failed to load initial form data');
    }
  };

  const loadCustomerInvoices = async (customerId, customerName) => {
    setFormData(prev => ({ ...prev, customer_id: customerId, customer_name: customerName }));
    setAllocations({});
    try {
      const res = await fetch(`${API}/customers/${customerId}/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setInvoices(json.data);
    } catch (e) {
      console.error('Failed to load invoices');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (totalAllocated > paymentAmount) {
      setError(`Allocated total (₹${totalAllocated}) cannot exceed payment receipt amount (₹${paymentAmount}).`);
      setLoading(false);
      return;
    }

    const allocList = Object.entries(allocations)
      .filter(([_, amt]) => Number(amt) > 0)
      .map(([invId, amt]) => {
        const inv = invoices.find(i => i.id === parseInt(invId));
        return {
          invoice_id: parseInt(invId),
          invoice_number: inv?.invoice_number || `INV-${invId}`,
          allocated_amount: Number(amt)
        };
      });

    try {
      const res = await fetch(`${API}/customer-payments`, {
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
        setSuccess(`Payment Receipt ${json.data?.receipt_number} recorded successfully!`);
        setTimeout(() => setActivePage('customer-receipts'), 1500);
      } else {
        setError(json.message || 'Failed to record payment');
      }
    } catch (e) {
      setError('Network error submitting payment');
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
            onClick={() => setActivePage('customer-receipts')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Record Customer Payment Receipt</h1>
            <p className="text-xs text-slate-500">
              Module 1: Multi-invoice allocation, unallocated advance credits &amp; bank settlement
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
        {/* Step 1: Customer & Payment Particulars */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            1. Receipt Particulars
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Select Customer *</label>
              <select
                value={formData.customer_id}
                onChange={(e) => {
                  const c = customers.find(x => x.id === parseInt(e.target.value));
                  loadCustomerInvoices(e.target.value, c?.customer_name || 'Customer');
                }}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.customer_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Date *</label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Receipt Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white font-bold focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method *</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {methods.map(m => (
                  <option key={m.id} value={m.method_code}>{m.method_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Deposit To Account *</label>
              <select
                value={formData.cash_bank_account_id}
                onChange={(e) => setFormData({ ...formData, cash_bank_account_id: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.account_name} ({fmt(a.current_balance)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Transaction Ref / Cheque #</label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                placeholder="e.g. UTR / NEFT reference number"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Multi-Invoice Allocation */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              2. Allocate Across Outstanding Invoices
            </h2>
            <div className="text-xs">
              <span className="text-slate-500">Allocated: </span>
              <span className="font-bold text-emerald-600">{fmt(totalAllocated)}</span>
              <span className="text-slate-400 mx-2">|</span>
              <span className="text-slate-500">Advance Credit: </span>
              <span className="font-bold text-purple-600">{fmt(unallocatedAmount)}</span>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
              No outstanding unpaid invoices for this customer. Total payment will be recorded as an <b>unallocated customer advance credit</b>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">Invoice #</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-right">Invoice Total</th>
                    <th className="px-3 py-2 text-right">Already Paid</th>
                    <th className="px-3 py-2 text-right">Balance Due</th>
                    <th className="px-3 py-2 text-right">Allocate Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td className="px-3 py-2 font-mono font-semibold text-slate-800">{inv.invoice_number}</td>
                      <td className="px-3 py-2 text-slate-600">{inv.invoice_date}</td>
                      <td className="px-3 py-2 text-right">{fmt(inv.total_invoice_amount)}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{fmt(inv.amount_paid)}</td>
                      <td className="px-3 py-2 text-right font-bold text-amber-700">{fmt(inv.balance_due)}</td>
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
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setActivePage('customer-receipts')}
            className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Posting Receipt...' : 'Post Customer Receipt'}
          </button>
        </div>
      </form>
    </div>
  );
}
