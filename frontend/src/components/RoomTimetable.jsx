import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const ROOM_OPTIONS = [
  'SG-1', 'SG-2', 'SG-3', 'SG-4', 'SG-5', 'SG-6', 'SG-7', 'SG-8', 'SG-9', 'SG-10', 'SG-11', 'Lab-Komputer'
];

export default function RoomTimetable({ onSelectSlot }) {
  const [selectedRoom, setSelectedRoom] = useState('SG-7');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/schedules/availability?roomCode=${selectedRoom}&date=${selectedDate}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setScheduleData(data);
    } catch (err) {
      setError('Gagal memuat jadwal ketersediaan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [selectedRoom, selectedDate]);

  const getStatusBadge = (slot) => {
    switch (slot.status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"></span>
            Tersedia
          </span>
        );
      case 'OCCUPIED_CLASS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Kuliah SIGA
          </span>
        );
      case 'OCCUPIED_PRACTICUM':
      case 'PRACTICUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            Praktikum Terjadwal
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Pemeliharaan
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium glass-pill text-zinc-300 border-white/10">
            {slot.status}
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl shadow-black/50">
      {/* Header controls Once UI Style */}
      <div className="p-5 sm:p-7 border-b border-white/10 bg-zinc-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
              <h2 className="text-lg font-semibold text-white tracking-tight">
                Jadwal & Ketersediaan Ruangan GSG
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Sinkronisasi real-time jadwal kuliah SIGA UNTAD, penimpaan override kuliah daring, dan reservasi praktikum.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Input Pill */}
            <div className="flex items-center glass-pill rounded-full px-3.5 py-1.5 text-xs text-zinc-200 border border-white/10">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 mr-2" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer text-xs"
              />
            </div>

            <button
              onClick={fetchAvailability}
              title="Refresh"
              className="p-2 glass-pill hover:bg-white/10 border border-white/10 rounded-full text-zinc-300 hover:text-white transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Room selector pills */}
        <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs text-zinc-400 font-mono mr-1">Ruangan:</span>
          {ROOM_OPTIONS.map((room) => (
            <button
              key={room}
              onClick={() => setSelectedRoom(room)}
              className={`px-3.5 py-1 rounded-full text-xs font-mono font-medium whitespace-nowrap transition-all duration-200 ${
                selectedRoom === room
                  ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                  : 'glass-pill text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
              }`}
            >
              {room}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable content */}
      <div className="p-5 sm:p-7">
        {loading ? (
          <div className="py-16 text-center text-zinc-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-cyan-400" />
            <p className="text-sm text-zinc-400">Sinkronisasi status {selectedRoom}...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        ) : scheduleData.length === 0 ? (
          <div className="py-16 text-center text-zinc-400">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <p className="font-medium text-zinc-200">Ruangan Terbuka Seharian</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">Tidak ada jadwal kuliah SIGA maupun praktikum tercatat pada tanggal ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduleData.map((slot, idx) => (
              <div
                key={idx}
                className={`glass-panel-hover flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all ${
                  slot.status === 'AVAILABLE'
                    ? 'bg-emerald-500/[0.03] border-emerald-500/20'
                    : slot.status === 'OCCUPIED_CLASS'
                    ? 'bg-rose-500/[0.03] border-rose-500/20'
                    : slot.status === 'OCCUPIED_PRACTICUM'
                    ? 'bg-purple-500/[0.03] border-purple-500/20'
                    : 'bg-amber-500/[0.03] border-amber-500/20'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    {getStatusBadge(slot)}
                  </div>
                  <h4 className="font-medium text-white text-sm">
                    {slot.courseName || slot.title || (slot.status === 'AVAILABLE' ? 'Ruangan Siap Digunakan' : 'Pemeliharaan Ruangan')}
                  </h4>
                  {(slot.lecturer || slot.pjName) && (
                    <p className="text-xs text-zinc-400">
                      Penanggung Jawab / Dosen: <span className="font-medium text-zinc-200">{slot.lecturer || slot.pjName}</span>
                    </p>
                  )}
                  {slot.notes && (
                    <p className="text-xs text-zinc-400 italic">
                      Catatan: {slot.notes}
                    </p>
                  )}
                </div>

                {slot.status === 'AVAILABLE' && onSelectSlot && (
                  <button
                    onClick={() => onSelectSlot({ roomCode: selectedRoom, date: selectedDate, startTime: slot.startTime, endTime: slot.endTime })}
                    className="mt-3 sm:mt-0 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2 rounded-xl shadow-sm transition"
                  >
                    Pilih Slot Ini
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
