import React, { useState, useEffect } from 'react';
import { Tv, Sparkles, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function ProjectorCatalog({ onOpenLogin, currentUser }) {
  const [selectedBuilding, setSelectedBuilding] = useState('GSG');
  const [projectors, setProjectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjector, setSelectedProjector] = useState(null);

  const fetchProjectors = async () => {
    try {
      const res = await fetch(`/api/projectors?building=${selectedBuilding}`);
      const data = await res.json();
      setProjectors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load projectors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectors();
    const interval = setInterval(fetchProjectors, 15000);
    return () => clearInterval(interval);
  }, [selectedBuilding]);

  const totalUsed = projectors.filter((p) => p.isUsed || p.status === 'IN_USE').length;
  const totalAvailable = projectors.filter((p) => p.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
            <span className="text-xs font-mono text-cyan-300 uppercase tracking-wider">Live Inventory {selectedBuilding === 'GSG' ? 'SG' : 'JTI'}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
            Katalog & Status Unit Proyektor {selectedBuilding === 'GSG' ? 'SG' : 'JTI'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-xl leading-relaxed">
            {selectedBuilding === 'GSG'
              ? 'Pantauan live keterpakaian 11 unit proyektor SG FT-UNTAD (Unit 01 s.d. 11). Klik masing-masing unit untuk melihat riwayat log audit dan peminjam terkini.'
              : 'Pantauan live keterpakaian 3 unit proyektor khusus JTI FT-UNTAD (JTI-01 s.d. JTI-03). Klik masing-masing unit untuk melihat riwayat peminjam.'}
          </p>
        </div>

        {/* Building Switcher & Counter Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex p-1 bg-zinc-900/80 rounded-2xl border border-white/10">
            <button
              onClick={() => setSelectedBuilding('GSG')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                selectedBuilding === 'GSG'
                  ? 'bg-cyan-500 text-zinc-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              SG (11 Unit)
            </button>
            <button
              onClick={() => setSelectedBuilding('JTI')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                selectedBuilding === 'JTI'
                  ? 'bg-cyan-500 text-zinc-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              JTI (3 Unit)
            </button>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 text-center min-w-[90px]">
            <div className="text-lg font-bold font-mono text-emerald-300">{totalAvailable}</div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Tersedia</div>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20 text-center min-w-[90px]">
            <div className="text-lg font-bold font-mono text-amber-300">{totalUsed}</div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Terpakai</div>
          </div>
        </div>
      </div>

      {/* Grid of 11 Projectors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {projectors.map((p) => {
          const isUsed = p.isUsed || p.status === 'IN_USE';
          const isBroken = p.status === 'BROKEN';

          return (
            <div
              key={p.code}
              onClick={() => setSelectedProjector(p)}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[140px] ${
                isUsed
                  ? 'bg-amber-500/[0.05] border-amber-500/30 hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : isBroken
                  ? 'bg-rose-500/[0.05] border-rose-500/30 hover:border-rose-400/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                  : 'bg-zinc-900/60 border-white/10 hover:border-cyan-400/40 hover:bg-zinc-800/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
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
                  <div className="text-[11px] text-zinc-400 mt-1">{p.brand || (selectedBuilding === 'JTI' ? 'JTI Standard' : 'SG Standard')}</div>
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

      {/* Projector Detail & Audit Log Modal */}
      {selectedProjector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-panel rounded-3xl max-w-2xl w-full p-6 sm:p-7 border border-white/10 text-zinc-100 shadow-2xl shadow-black space-y-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xl text-white">Unit {selectedProjector.code}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-zinc-800 text-zinc-300 border border-white/10">
                    {selectedProjector.brand || (selectedProjector.building === 'JTI' ? 'JTI Standard' : 'SG Standard')}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">Riwayat Log & Audit Penggunaan Proyektor {selectedProjector.building === 'JTI' ? 'JTI' : 'SG'}</p>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
                selectedProjector.isUsed || selectedProjector.status === 'IN_USE'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : selectedProjector.status === 'BROKEN'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  selectedProjector.isUsed || selectedProjector.status === 'IN_USE'
                    ? 'bg-amber-400 animate-pulse'
                    : selectedProjector.status === 'BROKEN'
                    ? 'bg-rose-400'
                    : 'bg-emerald-400'
                }`} />
                {selectedProjector.isUsed || selectedProjector.status === 'IN_USE'
                  ? 'SEDANG TERPAKAI'
                  : selectedProjector.status === 'BROKEN'
                  ? 'UNIT RUSAK'
                  : 'TERSEDIA'}
              </span>
            </div>

            {/* Current Active Loan Info */}
            {selectedProjector.currentLoan ? (
              <div className="p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 space-y-2">
                <div className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Informasi Peminjaman Berjalan Saat Ini
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Peminjam</span>
                    <span className="font-semibold text-white">{selectedProjector.currentLoan.borrowerName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">NIM</span>
                    <span className="font-mono text-zinc-200">{selectedProjector.currentLoan.borrowerNim}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Ruang Digunakan</span>
                    <span className="font-mono font-semibold text-cyan-300">{selectedProjector.currentLoan.roomCode}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Waktu Pinjam</span>
                    <span className="font-mono text-zinc-300">
                      {new Date(selectedProjector.currentLoan.borrowedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

              {(!selectedProjector.history || selectedProjector.history.length === 0) ? (
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
                      {selectedProjector.history.map((h) => (
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
                onClick={() => setSelectedProjector(null)}
                className="px-5 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-white/10 transition"
              >
                Tutup Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
