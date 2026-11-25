import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Truck, PlusCircle, RefreshCw, Star, CheckCircle2,
  AlertTriangle, Phone, Mail, MapPin, X
} from 'lucide-react';

const API = '/api/dispatch';

export default function TransportersPage() {
  const { token } = useAuth();
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    transport_mode: 'ROAD',
    vehicle_number: '',
    driver_name: '',
    driver_phone: ''
  });

  const fetchTransporters = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/transporters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setTransporters(json.data);
      else setError(json.message || 'Failed to load transporters');
    } catch (e) {
      setError('Network error fetching transporter partners');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchTransporters(); }, [fetchTransporters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/transporters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Transporter ${json.data?.name} enrolled successfully!`);
        setModalOpen(false);
        setFormData({
          name: '', contact_person: '', phone: '', email: '', gstin: '',
          address: '', transport_mode: 'ROAD', vehicle_number: '', driver_name: '', driver_phone: ''
        });
        fetchTransporters();
      } else {
        setError(json.message || 'Failed to add transporter');
      }
    } catch (e) {
      setError('Network error adding transporter');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transport Partners Management</h1>
          <p className="text-sm text-slate-500">
            Module 5: Approved Road Cargo Fleet, Temperature-Controlled Logistics &amp; Carrier GSTINs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransporters}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={() => { setModalOpen(true); setError(''); setSuccess(''); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" /> Add Transport Partner
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

      {/* Transporters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            Loading carriers...
          </div>
        ) : (
          transporters.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-emerald-300 transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 rounded">
                    {t.code}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1.5">{t.name}</h3>
                  <p className="text-xs text-slate-500">{t.contact_person || 'Dispatch Desk'}</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                  {t.rating || '4.5'}
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{t.phone}</span>
                </div>
                {t.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{t.email}</span>
                  </div>
                )}
                {t.gstin && (
                  <div className="font-mono text-slate-700">
                    <span className="font-semibold text-slate-500">GSTIN:</span> {t.gstin}
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{t.address}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 border border-slate-200">
                <p className="font-semibold text-slate-700">Designated Vehicle &amp; Driver</p>
                <p className="text-slate-600 font-mono">Reg: <b>{t.vehicle_number || 'TN-59-AB-1234'}</b></p>
                <p className="text-slate-500">Driver: {t.driver_name || 'M. Murugan'} ({t.driver_phone || '+91 98421 12345'})</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Transporter Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-600" />
                Add Approved Transport Partner
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Company / Transporter Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  placeholder="e.g. Kaveri Cold Logistics Private Limited"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    placeholder="33AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Operating Address</label>
                <textarea
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle #</label>
                  <input
                    type="text"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    placeholder="TN-59-AB-1234"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Driver Phone</label>
                  <input
                    type="text"
                    value={formData.driver_phone}
                    onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
