import React, { useState, useEffect } from 'react';
import { Tv, AlertTriangle, CheckCircle, RefreshCw, Wrench, ArrowDownLeft, Shield } from 'lucide-react';

export default function PetugasDashboard({ currentUser }) {
  const [projectors, setProjectors] = useState([]);
  const [loans, setLoans] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Return modal state
  const [returnLoanId, setReturnLoanId] = useState(null);
  const [conditionNotes, setConditionNotes] = useState('Kondisi baik dan lengkap');

  const loadData = async () => {
    setLoading(true);
    try {
      const [resPrj, resLoans, resReports] = await Promise.all([
        fetch('/api/projectors'),
        fetch('/api/projectors/loans'),
        fetch('/api/reports')
      ]);

      if (resPrj.ok) setProjectors(await resPrj.json());
      if (resLoans.ok) setLoans(await resLoans.json());
      if (resReports.ok) setReports(await resReports.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReturnProjector = async (e) => {
    e.preventDefault();
    if (!returnLoanId) return;
    try {
      const res = await fetch(`/api/projectors/loans/${returnLoanId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditionNotes })
      });
      if (!res.ok) throw new Error('Gagal mencatat pengembalian proyektor');
      setMessage({ text: 'Pengembalian proyektor berhasil dicatat!', type: 'success' });
      setReturnLoanId(null);
      loadData();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleUpdateReportStatus = async (reportId, status) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Gagal mengubah status laporan');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Header Profile Petugas */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            Petugas Fasilitas GSG FT-UNTAD
          </span>
          <h2 className="text-xl font-bold text-slate-800 mt-2">Pusat Kendali Petugas Gedung Serbaguna</h2>
          <p className="text-xs text-slate-500">Otoritas serah-terima unit proyektor (Unit 01-11) dan penanganan insiden kerusakan fasilitas.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 transition w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* Grid Status 11 Unit Proyektor */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Tv className="w-5 h-5 text-indigo-600" />
          Status 11 Unit Proyektor GSG
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {projectors.map((p) => (
            <div
              key={p.code}
              className={`p-3 rounded-lg border text-center transition ${
                p.status === 'AVAILABLE'
                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900'
                  : p.status === 'IN_USE'
                  ? 'bg-blue-50/60 border-blue-300 text-blue-900'
                  : 'bg-rose-50/60 border-rose-300 text-rose-900'
              }`}
            >
              <div className="font-mono font-bold text-base">Unit {p.code}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{p.brand}</div>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold ${
                p.status === 'AVAILABLE' ? 'bg-emerald-200 text-emerald-900' :
                p.status === 'IN_USE' ? 'bg-blue-200 text-blue-900' : 'bg-rose-200 text-rose-900'
              }`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Daftar Peminjaman Proyektor Aktif */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ArrowDownLeft className="w-5 h-5 text-blue-600" />
          Daftar Serah-Terima & Peminjaman Proyektor
        </h3>

        {loans.length === 0 ? (
          <p className="text-xs text-slate-500">Belum ada riwayat peminjaman proyektor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Unit</th>
                  <th className="px-4 py-2.5">Peminjam / NIM</th>
                  <th className="px-4 py-2.5">Ruang</th>
                  <th className="px-4 py-2.5">Waktu Pinjam</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Aksi Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">Unit {loan.projectorCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{loan.borrowerName}</div>
                      <div className="text-[10px] text-slate-500">{loan.borrowerNim}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700">{loan.roomCode}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(loan.borrowedAt).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        loan.status === 'BORROWED' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {loan.status === 'BORROWED' ? (
                        <button
                          onClick={() => setReturnLoanId(loan.id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition"
                        >
                          Catat Kembali
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Dikembalikan ({loan.returnNotes || 'OK'})</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Laporan Kerusakan Fasilitas */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-rose-500" />
          Daftar Laporan Kerusakan Fasilitas
        </h3>

        {reports.length === 0 ? (
          <p className="text-xs text-slate-500">Tidak ada laporan kerusakan saat ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Target</th>
                  <th className="px-4 py-2.5">Kode Target</th>
                  <th className="px-4 py-2.5">Pelapor</th>
                  <th className="px-4 py-2.5">Deskripsi Masalah</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Ubah Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.targetType}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{r.targetCode}</td>
                    <td className="px-4 py-3 text-slate-600">{r.reporterName}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs">{r.description}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        r.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        r.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      {r.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateReportStatus(r.id, 'IN_PROGRESS')}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] hover:bg-blue-500 transition"
                        >
                          Proses
                        </button>
                      )}
                      {r.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleUpdateReportStatus(r.id, 'RESOLVED')}
                          className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] hover:bg-emerald-500 transition"
                        >
                          Selesai
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return Modal */}
      {returnLoanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Catat Pengembalian Proyektor</h3>
            <p className="text-xs text-slate-500 mt-1">Periksa kelengkapan kabel power, HDMI, dan fungsi lampu.</p>
            <form onSubmit={handleReturnProjector} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Catatan Kondisi Unit</label>
                <input
                  type="text"
                  required
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="Contoh: Kondisi baik / Rusak kabel"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnLoanId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow-sm transition"
                >
                  Simpan Pengembalian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
