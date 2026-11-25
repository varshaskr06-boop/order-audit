import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Truck, CheckCircle2, AlertTriangle, Clock, Download,
  Printer, RefreshCw, MapPin, Undo2
} from 'lucide-react';
import BarChart from '../components/charts/BarChart';
import { exportToCSV, printReport } from '../utils/exportUtils';

export default function DispatchAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDispatch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/dispatch', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Failed to load dispatch analytics');
    } catch (e) {
      setError('Network error fetching dispatch analytics');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDispatch();
  }, [fetchDispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          Loading Logistics & Dispatch Performance...
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const carrierPerformance = data?.carrierPerformance || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="h-6 w-6 text-emerald-600" />
            Dispatch & Logistics Performance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Fulfillment turnaround, carrier on-time delivery rates, and customer return tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV('Carrier_Logistics_Report', carrierPerformance)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => printReport('Dispatch_Analytics')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Shipments Dispatched</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.total_dispatches} Shipments</div>
          <div className="text-xs text-slate-500 mt-1">B2B wholesale & distributors</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Successfully Delivered</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{summary.delivered_count} Shipments</div>
          <div className="text-xs text-slate-500 mt-1">POD confirmed & signed</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">In-Transit Active Shipments</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{summary.in_transit} Shipments</div>
          <div className="text-xs text-slate-500 mt-1">Live tracking active</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Customer Return / Damage Rate</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.return_rate_percentage}%</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">Under benchmark &lt;1.5%</div>
        </div>
      </div>

      {/* Carrier On-Time Performance Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 mb-4">Carrier On-Time Delivery Rate (%)</h3>
        <BarChart
          data={carrierPerformance.map((c) => ({
            label: c.carrier_name.split(' ')[0] + ' ' + (c.carrier_name.split(' ')[1] || ''),
            on_time: c.on_time_rate
          }))}
          xKey="label"
          bars={[{ key: 'on_time', color: '#16a34a', label: 'On-Time Rate %' }]}
          yFormat={(v) => `${v}%`}
        />
      </div>

      {/* Logistics Partners Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Transporter Performance & Average Turnaround Time</h3>
          <span className="text-xs text-slate-500">Service Level Agreement (SLA) Tracking</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Carrier / Fleet Partner</th>
                <th className="px-4 py-3 text-right">Shipments Handled</th>
                <th className="px-4 py-3 text-right">On-Time Delivery Rate</th>
                <th className="px-4 py-3 text-right">Avg Delivery Time</th>
                <th className="px-4 py-3 text-center">Service Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {carrierPerformance.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{c.carrier_name}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{c.shipments}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{c.on_time_rate}%</td>
                  <td className="px-4 py-3 text-right font-mono">{c.avg_days} Days</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      TIER 1 PREFERRED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
