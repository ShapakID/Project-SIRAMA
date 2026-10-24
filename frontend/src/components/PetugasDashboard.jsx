import React, { useState, useEffect } from 'react';
import {
  Tv,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Wrench,
  ArrowDownLeft,
  Shield,
  Eye,
  Calendar,
  Clock,
  BookOpen,
  Filter,
  XCircle
} from 'lucide-react';

export default function PetugasDashboard({ currentUser }) {
  const [projectors, setProjectors] = useState([]);
  const [loans, setLoans] = useState([]);
  const [reports, setReports] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [resFilter, setResFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Return modal state
  const [returnLoanId, setReturnLoanId] = useState(null);
  const [conditionNotes, setConditionNotes] = useState('Kondisi baik dan lengkap');
  const [selectedProjectorLog, setSelectedProjectorLog] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resPrj, resLoans, resReports, resReservations] = await Promise.all([
        fetch('/api/projectors'),
        fetch('/api/projectors/loans'),
        fetch('/api/reports'),
        fetch('/api/practicum')
      ]);

      if (resPrj.ok) setProjectors(await resPrj.json());
      if (resLoans.ok) setLoans(await resLoans.json());
      if (resReports.ok) setReports(await resReports.json());
      if (resReservations.ok) setReservations(await resReservations.json());
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
      setMessage({ text: 'Pengembalian proyektor berhasil dicatat! Reservasi ruangan otomatis dilepaskan (RELEASED / COMPLETED).', type: 'success' });
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

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Batalkan pengajuan reservasi ruangan ini?')) return;
    try {
      const res = await fetch(`/api/practicum/${reservationId}/cancel`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Gagal membatalkan reservasi');
      setMessage({ text: 'Reservasi berhasil dibatalkan oleh Petugas GSG.', type: 'success' });
      loadData();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
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
          <p className="text-xs text-zinc-400 mt-0.5">Pemantauan reservasi ruangan GSG (SG 01 - SG 12), otoritas serah-terima unit proyektor, dan penanganan fasilitas.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 text-xs glass-pill hover:bg-white/10 text-zinc-300 hover:text-white px-4 py-2 rounded-full border border-white/10 transition w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* SECTION: Monitoring Reservasi Ruangan GSG (Fokus Utama Petugas) */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                Pantauan Reservasi Ruangan GSG
              </h3>
              <p className="text-xs text-zinc-400">
                Memantau siapa yang memesan/menggunakan ruangan GSG (Lantai 1 & 2), mata kuliah, dan status reservasi.
              </p>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 bg-zinc-900/60 p-1 rounded-full border border-white/10 w-fit">
            <button
              onClick={() => setResFilter('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-mono transition ${
                resFilter === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semua ({reservations.length})
            </button>
            <button
              onClick={() => setResFilter('PUBLISHED')}
              className={`px-3 py-1 rounded-full text-xs font-mono transition ${
                resFilter === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Terbit Resmi ({reservations.filter(r => r.status === 'PUBLISHED').length})
            </button>
            <button
              onClick={() => setResFilter('DRAFT')}
              className={`px-3 py-1 rounded-full text-xs font-mono transition ${
                resFilter === 'DRAFT' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pengajuan Draft ({reservations.filter(r => r.status === 'DRAFT').length})
            </button>
          </div>
        </div>

        {/* Tabel Pantauan Reservasi */}
        <div className="overflow-x-auto">
          {reservations.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs font-mono">
              Belum ada riwayat reservasi praktikum yang tercatat di GSG.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-mono">
                  <th className="py-2.5 px-3">Ruang GSG</th>
                  <th className="py-2.5 px-3">Kategori & Kegiatan</th>
                  <th className="py-2.5 px-3">Alasan / Tujuan</th>
                  <th className="py-2.5 px-3">Pemohon (PJ Kelas)</th>
                  <th className="py-2.5 px-3">Waktu (WITA)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {reservations
                  .filter(r => resFilter === 'ALL' || r.status === resFilter)
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-3">
                        <span className="font-mono font-semibold text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                          {r.roomCode}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {r.category === 'HIMA_ORMAWA' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              HIMA
                            </span>
                          ) : r.category === 'LAINNYA' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Lainnya
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              Praktikum
                            </span>
                          )}
                          <span className="font-medium text-white">{r.title || r.courseName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-300 text-[11px] max-w-xs truncate" title={r.purpose || ''}>
                        {r.purpose || r.notes || '-'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-white font-medium">{r.pjName || 'PJ Mahasiswa'}</div>
                        <div className="text-[11px] font-mono text-zinc-400">{r.pjNim}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-300">
                        <div>{r.date}</div>
                        <div className="text-[11px] text-zinc-400">{r.startTime} - {r.endTime} WITA</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
                            r.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : r.status === 'DRAFT'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                          }`}
                        >
                          {r.status === 'PUBLISHED' ? 'Resmi Terbit' : r.status === 'DRAFT' ? 'Draft PJ' : r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-400 text-[11px] max-w-xs truncate">
                        {r.notes || '-'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {r.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => handleCancelReservation(r.id)}
                            className="px-2.5 py-1 text-[11px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-full transition"
                            title="Batalkan reservasi jika terjadi pelanggaran atau bentrok"
                          >
                            Batalkan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Grid Status 11 Unit Proyektor */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
            <h3 className="text-base font-semibold text-white tracking-tight">
              Status 11 Unit Proyektor GSG & Audit Trail
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            Klik unit untuk melihat riwayat log 5 peminjam terakhir
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {projectors.map((p) => {
            const isUsed = p.isUsed || p.status === 'IN_USE';
            const isBroken = p.status === 'BROKEN';
            return (
              <div
                key={p.code}
                onClick={() => setSelectedProjectorLog(p)}
                className={`glass-panel-hover p-4 rounded-2xl border text-center transition-all cursor-pointer group flex flex-col justify-between ${
                  isUsed
                    ? 'bg-amber-500/[0.06] border-amber-500/30 hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : isBroken
                    ? 'bg-rose-500/[0.06] border-rose-500/30 hover:border-rose-400/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                    : 'bg-emerald-500/[0.04] border-emerald-500/20 hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Unit</span>
                    <span className="text-[10px] text-cyan-400/80 group-hover:text-cyan-300 font-medium">Log →</span>
                  </div>
                  <div className="font-mono font-bold text-lg text-white">Unit {p.code}</div>

                  {isUsed && p.currentLoan ? (
                    <div className="mt-2 text-[10px] text-amber-200/90 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 text-left">
                      <div className="font-semibold truncate">{p.currentLoan.borrowerName}</div>
                      <div className="text-zinc-400 font-mono">{p.currentLoan.roomCode}</div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-400 mt-1">{p.brand || 'GSG Standard'}</div>
                  )}
                </div>

                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border ${
                    isUsed
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : isBroken
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isUsed
                        ? 'bg-amber-400 animate-pulse'
                        : isBroken
                        ? 'bg-rose-400'
                        : 'bg-emerald-400'
                    }`} />
                    {isUsed ? 'TERPAKAI' : isBroken ? 'RUSAK' : 'TERSEDIA'}
                  </span>
                </div>
              </div>
            );
          })}
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

      {/* Projector Audit Log Modal */}
      {selectedProjectorLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-panel rounded-3xl max-w-2xl w-full p-6 sm:p-7 border border-white/10 text-zinc-100 shadow-2xl shadow-black space-y-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xl text-white">Unit {selectedProjectorLog.code}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-zinc-800 text-zinc-300 border border-white/10">
                    {selectedProjectorLog.brand || 'GSG Standard'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">Riwayat Log & Audit Penggunaan Proyektor GSG</p>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
                selectedProjectorLog.isUsed || selectedProjectorLog.status === 'IN_USE'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : selectedProjectorLog.status === 'BROKEN'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  selectedProjectorLog.isUsed || selectedProjectorLog.status === 'IN_USE'
                    ? 'bg-amber-400 animate-pulse'
                    : selectedProjectorLog.status === 'BROKEN'
                    ? 'bg-rose-400'
                    : 'bg-emerald-400'
                }`} />
                {selectedProjectorLog.isUsed || selectedProjectorLog.status === 'IN_USE'
                  ? 'SEDANG TERPAKAI'
                  : selectedProjectorLog.status === 'BROKEN'
                  ? 'UNIT RUSAK'
                  : 'TERSEDIA DI GSG'}
              </span>
            </div>

            {/* Current Active Loan Info (if any) */}
            {selectedProjectorLog.currentLoan ? (
              <div className="p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 space-y-2">
                <div className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Informasi Peminjaman Berjalan Saat Ini
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Peminjam</span>
                    <span className="font-semibold text-white">{selectedProjectorLog.currentLoan.borrowerName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">NIM</span>
                    <span className="font-mono text-zinc-200">{selectedProjectorLog.currentLoan.borrowerNim}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Ruang Digunakan</span>
                    <span className="font-mono font-semibold text-cyan-300">{selectedProjectorLog.currentLoan.roomCode}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Waktu Pinjam</span>
                    <span className="font-mono text-zinc-300">
                      {new Date(selectedProjectorLog.currentLoan.borrowedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Unit proyektor ini dalam kondisi standby dan siap dipinjamkan kepada PJ Praktikum.</span>
              </div>
            )}

            {/* 5 Riwayat Terakhir */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                5 Riwayat Peminjaman Terakhir
              </h4>

              {(!selectedProjectorLog.history || selectedProjectorLog.history.length === 0) ? (
                <div className="p-6 text-center text-xs text-zinc-500 border border-white/5 rounded-2xl">
                  Belum ada riwayat peminjaman untuk unit ini.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.03] text-zinc-400 font-mono text-[11px] border-b border-white/10">
                      <tr>
                        <th className="px-3 py-2.5">Waktu Pinjam</th>
                        <th className="px-3 py-2.5">Peminjam</th>
                        <th className="px-3 py-2.5">Ruang</th>
                        <th className="px-3 py-2.5">Status Pengembalian</th>
                        <th className="px-3 py-2.5">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedProjectorLog.history.map((h) => (
                        <tr key={h.id} className="hover:bg-white/[0.02]">
                          <td className="px-3 py-2 text-zinc-300 font-mono text-[11px]">
                            {new Date(h.borrowedAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}{' '}
                            {new Date(h.borrowedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-white">{h.borrowerName}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{h.borrowerNim}</div>
                          </td>
                          <td className="px-3 py-2 font-mono text-cyan-300 font-semibold">{h.roomCode}</td>
                          <td className="px-3 py-2">
                            {h.returnedAt ? (
                              <span className="text-[10px] text-emerald-400 font-mono">
                                Kembali {new Date(h.returnedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-400 font-mono font-semibold">
                                Masih Dipinjam
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-zinc-400 text-[11px] max-w-[150px] truncate">
                            {h.conditionNotes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedProjectorLog(null)}
                className="px-5 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-white/10 transition"
              >
                Tutup Log
              </button>
            </div>
          </div>
        </div>
      )}

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
