import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText, UploadCloud, Download, Search, RefreshCw,
  PlusCircle, Trash2, Eye, ShieldCheck, AlertCircle, X, File
} from 'lucide-react';

const API = '/api/audit';

export default function EvidenceManagementPage() {
  const { token, user } = useAuth();
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Upload Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    file_name: '',
    file_type: 'application/pdf',
    description: '',
    finding_id: '',
    audit_record_id: ''
  });

  const fetchEvidence = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/evidence`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setEvidenceList(json.data || []);
      else setError(json.message || 'Failed to load evidence files');
    } catch (e) {
      setError('Network error fetching evidence repository');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate file extension
      const validExts = ['.pdf', '.jpg', '.jpeg', '.png', '.csv', '.xlsx', '.txt'];
      const hasValidExt = validExts.some(ext => uploadData.file_name.toLowerCase().endsWith(ext));
      if (!hasValidExt) {
        alert('Invalid file format! Allowed: .pdf, .jpg, .png, .csv, .xlsx, .txt');
        return;
      }

      const payload = {
        ...uploadData,
        file_size: 1024 * 180, // Mock 180KB
        file_data: 'JVBERi0xLjQKJcTl8uXr...'
      };

      const res = await fetch(`${API}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Evidence file "${uploadData.file_name}" attached successfully!`);
        setUploadModalOpen(false);
        setUploadData({ file_name: '', file_type: 'application/pdf', description: '', finding_id: '', audit_record_id: '' });
        fetchEvidence();
      } else {
        setError(json.message || 'Upload rejected');
      }
    } catch (err) {
      setError('Error uploading evidence file');
    }
  };

  const handleDownload = (id, fileName) => {
    window.open(`${API}/evidence/${id}/download?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UploadCloud className="h-6 w-6 text-amber-600" />
            Audit Evidence &amp; Document Management
          </h1>
          <p className="text-sm text-slate-500">
            Secure digital vault for Certificates of Analysis, NABL test certificates, and transaction audit trails
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvidence}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl transition shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Upload Evidence
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
          {success}
        </div>
      )}

      {/* Evidence Repository Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {evidenceList.map((doc) => (
          <div
            key={doc.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {(doc.file_size / 1024).toFixed(1)} KB
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm mt-3 truncate" title={doc.file_name}>
                {doc.file_name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{doc.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">By {doc.uploaded_by_name}</span>
              <button
                onClick={() => handleDownload(doc.id, doc.file_name)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Evidence Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-amber-600" />
                Attach Audit Evidence Document
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">File Name (with extension) *</label>
                <input
                  type="text"
                  required
                  value={uploadData.file_name}
                  onChange={(e) => setUploadData({ ...uploadData, file_name: e.target.value })}
                  placeholder="e.g. nabl_pesticide_test_report_lot104.pdf"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Document Category / MIME Type</label>
                <select
                  value={uploadData.file_type}
                  onChange={(e) => setUploadData({ ...uploadData, file_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="application/pdf">PDF Report (.pdf)</option>
                  <option value="text/csv">CSV Data Dump (.csv)</option>
                  <option value="image/jpeg">JPEG Image (.jpg/.jpeg)</option>
                  <option value="image/png">PNG Screenshot (.png)</option>
                  <option value="application/vnd.ms-excel">Excel Workbook (.xlsx)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Evidence Description &amp; Verification Relevance *</label>
                <textarea
                  required
                  rows={3}
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  placeholder="State document source, laboratory accreditation, and audit relevance..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm"
                >
                  Save &amp; Attach
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
