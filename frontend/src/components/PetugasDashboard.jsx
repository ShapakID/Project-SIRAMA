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
      {/* Alert Banner Once UI Glass */}
      {message.text && (
        <div className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
          message.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} className="font-bold ml-4 text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Profile Petugas Once UI Glass */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full glass-pill text-emerald-300 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"></span>
            Petugas Fasilitas GSG FT-UNTAD
          </span>
          <h2 className="text-xl font-semibold text-white tracking-tight mt-2.5">Pusat Kendali Petugas GSG</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Otoritas serah-terima unit proyektor (Unit 01 - 11) dan penanganan insiden kerusakan fasilitas.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 text-xs glass-pill hover:bg-white/10 text-zinc-300 hover:text-white px-4 py-2 rounded-full border border-white/10 transition w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* Grid Status 11 Unit Proyektor */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 shadow-xl space-y-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Status 11 Unit Proyektor GSG
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {projectors.map((p) => (
            <div
              key={p.code}
              className={`glass-panel-hover p-4 rounded-2xl border text-center transition-all ${
                p.status === 'AVAILABLE'
                  ? 'bg-emerald-500/[0.04] border-emerald-500/20'
                  : p.status === 'IN_USE'
                  ? 'bg-cyan-500/[0.04] border-cyan-500/20'
                  : 'bg-rose-500/[0.04] border-rose-500/20'
              }`}
            >
              <div className="font-mono font-semibold text-base text-white">Unit {p.code}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">{p.brand}</div>
              <span className={`inline-flex items-center gap-1 mt-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
                p.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                p.status === 'IN_USE' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
              }`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Daftar Peminjaman Proyektor Aktif */}
      <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Daftar Serah-Terima & Peminjaman Proyektor
          </h3>
        </div>

        {loans.length === 0 ? (
          <p className="text-xs text-zinc-500">Belum ada riwayat peminjaman proyektor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/60 text-zinc-400 uppercase font-mono text-[11px] border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Peminjam / NIM</th>
                  <th className="px-4 py-3">Ruang</th>
                  <th className="px-4 py-3">Waktu Pinjam</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-white">Unit {loan.projectorCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-200">{loan.borrowerName}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{loan.borrowerNim}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-300">{loan.roomCode}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono">{new Date(loan.borrowedAt).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] border ${
                        loan.status === 'BORROWED' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {loan.status === 'BORROWED' ? (
                        <button
                          onClick={() => setReturnLoanId(loan.id)}
                          className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 rounded-xl font-semibold shadow-sm transition"
                        >
                          Catat Kembali
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-500 italic font-mono">Dikembalikan ({loan.returnNotes || 'Lengkap'})</span>
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
      <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Daftar Laporan Kerusakan Fasilitas
          </h3>
        </div>

        {reports.length === 0 ? (
          <p className="text-xs text-zinc-500">Tidak ada laporan kerusakan saat ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/60 text-zinc-400 uppercase font-mono text-[11px] border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Kode Target</th>
                  <th className="px-4 py-3">Pelapor</th>
                  <th className="px-4 py-3">Deskripsi Masalah</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ubah Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-200">{r.targetType}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-white">{r.targetCode}</td>
                    <td className="px-4 py-3 text-zinc-400">{r.reporterName}</td>
                    <td className="px-4 py-3 text-zinc-300 max-w-xs">{r.description}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] border ${
                        r.status === 'PENDING' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                        r.status === 'IN_PROGRESS' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      {r.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateReportStatus(r.id, 'IN_PROGRESS')}
                          className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-medium transition"
                        >
                          Proses
                        </button>
                      )}
                      {r.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleUpdateReportStatus(r.id, 'RESOLVED')}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-medium transition"
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

      {/* Return Modal Once UI Glass Style */}
      {returnLoanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-panel rounded-3xl max-w-sm w-full p-6 sm:p-7 border border-white/10 text-zinc-100 shadow-2xl shadow-black">
            <h3 className="text-base font-semibold text-white tracking-tight">Catat Pengembalian Proyektor</h3>
            <p className="text-xs text-zinc-400 mt-1">Periksa kelengkapan kabel power, HDMI, dan fungsi lampu.</p>
            <form onSubmit={handleReturnProjector} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Catatan Kondisi Unit</label>
                <input
                  type="text"
                  required
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="Contoh: Kondisi baik / Rusak kabel"
                  className="w-full px-3.5 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnLoanId(null)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl shadow-sm transition"
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
