import React, { useState, useEffect } from 'react';
import {
  Layers,
  Calendar,
  Clock,
  Users,
  DoorOpen,
  ArrowUp,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Info,
  Shield,
  X
} from 'lucide-react';

export default function GSGFloorPlan({ currentUser, onSelectRoom, onNavigateToTimetable }) {
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [roomsData, setRoomsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRoomModal, setActiveRoomModal] = useState(null);

  useEffect(() => {
    fetchFloorStatus();
  }, [selectedDate]);

  const fetchFloorStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schedules/floor-status?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setRoomsData(data);
      }
    } catch (err) {
      console.error('Failed to fetch floor status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Find room by display code or code
  const getRoom = (code) => {
    return roomsData.find(
      (r) => r.displayCode === code || r.code === code || r.code === code.replace(' ', '-')
    ) || {
      code,
      displayCode: code,
      name: `Ruang ${code}`,
      summaryStatus: 'AVAILABLE',
      capacity: 45,
      facilities: 'AC, Whiteboard, Speaker',
      slots: []
    };
  };

  // Layout definition per floor as strictly specified:
  // Lantai 1:
  // Kiri: SG 03, SG 02, SG 01
  // Kanan: SG 06, SG 05, SG 04
  // Bawah: Pintu Masuk
  const floor1Layout = {
    leftColumn: ['SG 03', 'SG 02', 'SG 01'],
    rightColumn: ['SG 06', 'SG 05', 'SG 04']
  };

  // Lantai 2:
  // Kiri: SG 09, SG 08, SG 07
  // Kanan: Lab-Komputer, SG 11, SG 10
  const floor2Layout = {
    leftColumn: ['SG 09', 'SG 08', 'SG 07'],
    rightColumn: ['Lab-Komputer', 'SG 11', 'SG 10']
  };

  const currentLayout = selectedFloor === 1 ? floor1Layout : floor2Layout;

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'OCCUPIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
            Jadwal Kuliah
          </span>
        );
      case 'PRACTICUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            Praktikum
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            Perbaikan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Tersedia
          </span>
        );
    }
  };

  const renderRoomCard = (roomCode, positionLabel) => {
    const room = getRoom(roomCode);
    const isLab = roomCode === 'Lab-Komputer';

    return (
      <div
        key={roomCode}
        onClick={() => setActiveRoomModal(room)}
        className="group relative rounded-2xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-cyan-400/40 backdrop-blur-xl p-4 sm:p-5 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] cursor-pointer flex flex-col justify-between min-h-[145px]"
      >
        {/* Subtle hover gradient glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 via-transparent to-white/[0.02] group-hover:from-cyan-500/[0.04] transition duration-500 pointer-events-none" />

        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-white group-hover:text-cyan-300 transition">
                  {room.displayCode}
                </span>
                {isLab && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    LAB
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">{positionLabel}</p>
            </div>
            {renderStatusBadge(room.summaryStatus)}
          </div>

          <div className="mt-3">
            {room.activeSchedule ? (
              <p className="text-xs text-zinc-200 line-clamp-1 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                <span>{room.activeSchedule}</span>
              </p>
            ) : (
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400/80 flex-shrink-0" />
                <span>Tidak ada kelas bentrok</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            {room.capacity || 45} Kursi
          </span>
          <span className="text-cyan-400/80 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition flex items-center gap-0.5">
            Detail →
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card Once UI Style */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 mb-3">
              <Layers className="w-3.5 h-3.5" />
              Visual Denah Arsitektural Gedung Serbaguna (GSG)
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Denah Lantai GSG FT-UNTAD
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Tata letak spasial ruangan SG 01 hingga SG 12 (Lab Komputer). Pantau ketersediaan slot kelas & praktikum secara langsung per lantai.
            </p>
          </div>

          {/* Controls: Date Picker & Floor Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 glass-pill px-3.5 py-2 rounded-2xl border border-white/10 bg-zinc-900/60">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Floor Switcher Pills */}
            <div className="inline-flex p-1 bg-zinc-900/80 rounded-2xl border border-white/10">
              <button
                onClick={() => setSelectedFloor(1)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                  selectedFloor === 1
                    ? 'bg-white text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Lantai 1
              </button>
              <button
                onClick={() => setSelectedFloor(2)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                  selectedFloor === 2
                    ? 'bg-white text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Lantai 2
              </button>
            </div>
          </div>
        </div>

        {/* Status Legend Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              Tersedia (Bebas Dipakai)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
              Jadwal Kuliah Resmi
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              Praktikum Diterbitkan
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              Pemeliharaan Fasilitas
            </span>
          </div>

          <div className="text-[11px] text-zinc-400 italic">
            * Klik pada ruangan untuk melihat jadwal & opsi reservasi
          </div>
        </div>
      </div>

      {/* Main Floor Blueprint Container */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-white/10 text-white border border-white/10">
              LANTAI {selectedFloor}
            </span>
            <span className="text-xs text-zinc-400">
              {selectedFloor === 1 ? 'Zona Dasar (Akses Pintu Masuk)' : 'Zona Atas (Ruang SG 07-11 & Lab Komputer)'}
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-400">GEDUNG SERBAGUNA FT-UNTAD</span>
        </div>

        {/* Blueprint Layout Grid: 2 Columns + Center Hallway */}
        <div className="relative max-w-4xl mx-auto">
          {/* Spatial Map Header (Ujung Belakang / Dalam) */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider text-zinc-400 border border-white/5 bg-zinc-950/40">
              <span>Sisi Belakang GSG (Taman Dalam / Dinding Belakang)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 relative">
            {/* Center Hallway Strip (Desktop only divider with indicator) */}
            <div className="hidden md:flex absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-14 flex-col items-center justify-between py-6 pointer-events-none z-10">
              <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent border-dashed border-l border-white/15" />
              <div className="absolute top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[10px] font-mono uppercase tracking-widest text-zinc-400 px-3 py-1 bg-zinc-950/80 rounded-full border border-white/10">
                Selasar Tengah Lt {selectedFloor}
              </div>
            </div>

            {/* Kolom Kiri */}
            <div className="space-y-4">
              <div className="text-center md:text-left mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 px-2 py-0.5 rounded bg-white/5">
                  Sayap Kiri (Ruang Barat)
                </span>
              </div>
              {currentLayout.leftColumn.map((code, idx) => {
                const labels = selectedFloor === 1
                  ? ['Ujung Dalam Kiri', 'Tengah Kiri', 'Depan Kiri (Dekat Pintu)']
                  : ['Ujung Dalam Kiri', 'Tengah Kiri', 'Depan Kiri (Atas Tangga)'];
                return renderRoomCard(code, labels[idx]);
              })}
            </div>

            {/* Kolom Kanan */}
            <div className="space-y-4">
              <div className="text-center md:text-left mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 px-2 py-0.5 rounded bg-white/5">
                  Sayap Kanan (Ruang Timur)
                </span>
              </div>
              {currentLayout.rightColumn.map((code, idx) => {
                const labels = selectedFloor === 1
                  ? ['Ujung Dalam Kanan', 'Tengah Kanan', 'Depan Kanan (Dekat Pintu)']
                  : ['Ujung Dalam Kanan (Lab Komputer)', 'Tengah Kanan', 'Depan Kanan (Atas Tangga)'];
                return renderRoomCard(code, labels[idx]);
              })}
            </div>
          </div>

          {/* Bottom Area: Pintu Masuk (Lantai 1) / Void Tangga (Lantai 2) */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center">
            {selectedFloor === 1 ? (
              <div className="relative group max-w-md w-full">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-lg pointer-events-none" />
                <div className="relative flex items-center justify-center gap-3 p-4 rounded-2xl border border-emerald-500/30 bg-zinc-950/80 backdrop-blur-md text-emerald-300 shadow-xl text-center">
                  <DoorOpen className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-white uppercase font-mono">
                      Pintu Masuk Utama GSG FT-UNTAD
                    </p>
                    <p className="text-[11px] text-zinc-400">Lobi Utama & Akses Masuk Mahasiswa / Dosen</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative group max-w-md w-full">
                <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl blur-lg pointer-events-none" />
                <div className="relative flex items-center justify-center gap-3 p-4 rounded-2xl border border-cyan-500/30 bg-zinc-950/80 backdrop-blur-md text-cyan-300 shadow-xl text-center">
                  <ArrowUp className="w-5 h-5 text-cyan-400 rotate-180" />
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-white uppercase font-mono">
                      Tangga Akses & Void Lantai 1
                    </p>
                    <p className="text-[11px] text-zinc-400">Penghubung Lantai 1 (Dasar) ke Lantai 2 (Atas)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Room Detail Modal Once UI Style */}
      {activeRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="glass-modal rounded-3xl max-w-lg w-full p-6 sm:p-7 text-zinc-100 relative">
            <button
              onClick={() => setActiveRoomModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold font-mono text-white">
                {activeRoomModal.displayCode}
              </span>
              {renderStatusBadge(activeRoomModal.summaryStatus)}
            </div>

            <p className="text-xs text-zinc-400 mt-1">{activeRoomModal.name} • Lantai {activeRoomModal.floor || selectedFloor}</p>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-zinc-400 block mb-0.5">Kapasitas Kursi</span>
                <span className="font-semibold text-white">{activeRoomModal.capacity || 45} Orang</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-zinc-400 block mb-0.5">Fasilitas Ruang</span>
                <span className="font-semibold text-white">{activeRoomModal.facilities || 'AC, Whiteboard, Speaker'}</span>
              </div>
            </div>

            {/* List of slots for the day */}
            <div className="mt-5">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase font-mono tracking-wider mb-2">
                Jadwal Hari Ini ({selectedDate})
              </h4>

              {activeRoomModal.slots && activeRoomModal.slots.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeRoomModal.slots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-medium text-white">{slot.courseName || slot.title || 'Kegiatan Ruangan'}</p>
                        <p className="text-zinc-400 text-[11px] mt-0.5">
                          {slot.lecturer ? `Dosen: ${slot.lecturer.split(':')[0]}` : slot.pjName ? `PJ: ${slot.pjName}` : slot.notes}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-mono text-cyan-300 text-[11px] block">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <span className="text-[10px] text-zinc-400 uppercase">{slot.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Ruangan sepenuhnya bebas digunakan pada tanggal ini!</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <div>
                {currentUser?.role === 'PETUGAS' && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-300">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    Mode Monitoring Petugas GSG
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveRoomModal(null)}
                  className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition"
                >
                  Tutup
                </button>
                {currentUser?.role === 'PETUGAS' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRoomModal(null);
                      if (onSelectRoom) onSelectRoom(activeRoomModal.code);
                    }}
                    className="px-5 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 rounded-full shadow-sm transition flex items-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Pantau Semua Reservasi
                  </button>
                ) : currentUser?.role === 'PJ' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const code = activeRoomModal.code;
                      setActiveRoomModal(null);
                      if (onSelectRoom) onSelectRoom(code);
                    }}
                    className="px-5 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-full shadow-sm transition"
                  >
                    Ajukan Praktikum di Ruang Ini
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRoomModal(null);
                      if (onSelectRoom) onSelectRoom(activeRoomModal.code);
                    }}
                    className="px-5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-full transition"
                  >
                    Masuk untuk Reservasi
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
