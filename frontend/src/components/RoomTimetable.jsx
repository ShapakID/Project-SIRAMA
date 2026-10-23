import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const ROOM_OPTIONS = [
  'SG-1', 'SG-2', 'SG-3', 'SG-4', 'SG-5', 'SG-6', 'SG-7', 'SG-8', 'JTI-1', 'JTI-2'
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" /> Tersedia
          </span>
        );
      case 'OCCUPIED_CLASS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" /> Perkuliahan SIGA
          </span>
        );
      case 'OCCUPIED_PRACTICUM':
      case 'PRACTICUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <Clock className="w-3.5 h-3.5" /> Praktikum Terjadwal
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5" /> Pemeliharaan
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            {slot.status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header controls */}
      <div className="p-4 sm:p-6 bg-slate-900 text-white border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Jadwal & Ketersediaan Ruangan GSG
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Sinkronisasi real-time jadwal kuliah SIGA UNTAD, penimpaan override libur/kosong, dan peminjaman praktikum.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Input */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white">
              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={fetchAvailability}
              title="Refresh"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Room selector pills */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap mr-1">Ruangan:</span>
          {ROOM_OPTIONS.map((room) => (
            <button
              key={room}
              onClick={() => setSelectedRoom(room)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition ${
                selectedRoom === room
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {room}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable content */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-sm">Memuat ketersediaan {selectedRoom}...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        ) : scheduleData.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Ruangan Kosong Seharian</p>
            <p className="text-xs text-slate-500 mt-1">Tidak ada jadwal kuliah SIGA maupun praktikum tercatat pada tanggal ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduleData.map((slot, idx) => (
              <div
                key={idx}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition ${
                  slot.status === 'AVAILABLE'
                    ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                    : slot.status === 'OCCUPIED_CLASS'
                    ? 'bg-rose-50/50 border-rose-200'
                    : slot.status === 'OCCUPIED_PRACTICUM'
                    ? 'bg-purple-50/50 border-purple-200'
                    : 'bg-amber-50/50 border-amber-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    {getStatusBadge(slot)}
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {slot.courseName || slot.title || (slot.status === 'AVAILABLE' ? 'Ruangan Siap Digunakan' : 'Pemeliharaan Ruangan')}
                  </h4>
                  {(slot.lecturer || slot.pjName) && (
                    <p className="text-xs text-slate-600">
                      Penanggung Jawab / Dosen: <span className="font-medium text-slate-800">{slot.lecturer || slot.pjName}</span>
                    </p>
                  )}
                  {slot.notes && (
                    <p className="text-xs text-slate-500 italic">
                      Catatan: {slot.notes}
                    </p>
                  )}
                </div>

                {slot.status === 'AVAILABLE' && onSelectSlot && (
                  <button
                    onClick={() => onSelectSlot({ roomCode: selectedRoom, date: selectedDate, startTime: slot.startTime, endTime: slot.endTime })}
                    className="mt-3 sm:mt-0 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded shadow-sm transition"
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
