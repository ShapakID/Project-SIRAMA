import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  ArrowRightLeft,
  Globe,
  Edit3,
  RotateCcw,
  Building,
  User,
  BookOpen
} from 'lucide-react';
import {
  getNextWeekdayYMD,
  isWeekend,
  getDayOfWeek,
  parseNimMetadata
} from '../utils/timeUtils';

const ALL_ROOMS = [
  // SG
  'SG-1', 'SG-2', 'SG-3', 'SG-4', 'SG-5', 'SG-6',
  'SG-7', 'SG-8', 'SG-9', 'SG-10', 'SG-11', 'Lab-Komputer',
  // JTI
  'JTI-1', 'Lab-JTI', 'JTI-2', 'JTI-3'
];

const DEFAULT_CLASSES = [
  'SI-A 2025', 'SI-B 2025',
  'SI-A 2026', 'SI-B 2026',
  'SI-A 2024', 'SI-B 2024',
  'SI-A 2023', 'SI-B 2023'
];

export default function RoomTimetable({ currentUser, onSelectSlot }) {
  // Determine user class if PJ
  const userMetadata = currentUser?.nim ? parseNimMetadata(currentUser.nim) : null;
  const userClass = userMetadata?.className || null;
  const isPetugas = currentUser?.role === 'PETUGAS';

  const [activeView, setActiveView] = useState('CLASS'); // 'CLASS' | 'ROOM'
  const [selectedClass, setSelectedClass] = useState(() => userClass || 'SI-A 2025');
  const [classList, setClassList] = useState(DEFAULT_CLASSES);
  const [selectedDate, setSelectedDate] = useState(() => getNextWeekdayYMD());
  const [selectedRoom, setSelectedRoom] = useState('SG-7');

  // Class-centric state
  const [classSchedule, setClassSchedule] = useState(null);
  const [loadingClass, setLoadingClass] = useState(false);
  const [classError, setClassError] = useState(null);

  // Room availability state (for room view)
  const [roomSchedule, setRoomSchedule] = useState([]);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [roomError, setRoomError] = useState(null);

  // Action Modal State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    action: null, // 'ONLINE' | 'MOVE_ROOM' | 'RESCHEDULE' | 'RESET'
    course: null,
    newDate: '',
    newRoomCode: '',
    newStartTime: '',
    newEndTime: '',
    notes: '',
    loading: false,
    error: null
  });

  const isPJOfSelectedClass = isPetugas || (
    currentUser?.role === 'PJ' && userClass && userClass.trim().toLowerCase() === selectedClass.trim().toLowerCase()
  );

  // Fetch available class list on mount
  useEffect(() => {
    fetch('/api/schedules/classes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setClassList(data);
          if (userClass && data.includes(userClass)) {
            setSelectedClass(userClass);
          }
        }
      })
      .catch(() => {});
  }, [userClass]);

  // Fetch class schedule when selectedClass or selectedDate changes
  const fetchClassSchedule = async () => {
    setLoadingClass(true);
    setClassError(null);
    try {
      const res = await fetch(`/api/schedules/by-class?className=${encodeURIComponent(selectedClass)}&date=${selectedDate}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setClassSchedule(data);
    } catch (err) {
      setClassError('Gagal memuat jadwal kelas.');
    } finally {
      setLoadingClass(false);
    }
  };

  // Fetch room availability when selectedRoom or selectedDate changes
  const fetchRoomAvailability = async () => {
    setLoadingRoom(true);
    setRoomError(null);
    try {
      const res = await fetch(`/api/schedules/availability?roomCode=${selectedRoom}&date=${selectedDate}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRoomSchedule(data);
    } catch (err) {
      setRoomError('Gagal memuat ketersediaan ruangan.');
    } finally {
      setLoadingRoom(false);
    }
  };

  useEffect(() => {
    if (activeView === 'CLASS') {
      fetchClassSchedule();
    } else {
      fetchRoomAvailability();
    }
  }, [activeView, selectedClass, selectedRoom, selectedDate]);

  // Open PJ Action Modal
  const openActionModal = (action, course) => {
    setActionModal({
      isOpen: true,
      action,
      course,
      newDate: course.date || selectedDate,
      newRoomCode: course.effectiveRoomCode || 'SG-5',
      newStartTime: course.effectiveStartTime || '07:30',
      newEndTime: course.effectiveEndTime || '10:00',
      notes: '',
      loading: false,
      error: null
    });
  };

  const closeActionModal = () => {
    setActionModal({
      isOpen: false,
      action: null,
      course: null,
      newDate: '',
      newRoomCode: '',
      newStartTime: '',
      newEndTime: '',
      notes: '',
      loading: false,
      error: null
    });
  };

  // Submit PJ Override
  const handleSubmitOverride = async (e) => {
    e?.preventDefault();
    if (!actionModal.course) return;

    setActionModal(prev => ({ ...prev, loading: true, error: null }));
    try {
      const payload = {
        courseName: actionModal.course.courseName,
        roomCode: actionModal.course.originalRoomCode,
        date: actionModal.course.date,
        action: actionModal.action,
        newDate: actionModal.action === 'RESCHEDULE' ? actionModal.newDate : null,
        newRoomCode: (actionModal.action === 'MOVE_ROOM' || actionModal.action === 'RESCHEDULE') ? actionModal.newRoomCode : null,
        newStartTime: (actionModal.action === 'RESCHEDULE' || actionModal.action === 'MOVE_ROOM') ? actionModal.newStartTime : null,
        newEndTime: (actionModal.action === 'RESCHEDULE' || actionModal.action === 'MOVE_ROOM') ? actionModal.newEndTime : null,
        notes: actionModal.notes,
        updatedBy: currentUser?.nim || currentUser?.username || 'PJ'
      };

      const res = await fetch('/api/schedules/class-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan perubahan');
      }

      closeActionModal();
      fetchClassSchedule();
    } catch (err) {
      setActionModal(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const handleResetCourse = async (course) => {
    if (!window.confirm(`Kembalikan jadwal "${cleanCourseTitle(course.courseName)}" ke jadwal reguler SIGA?`)) {
      return;
    }

    try {
      const res = await fetch('/api/schedules/class-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: course.courseName,
          date: course.sourceDate || course.date,
          action: 'RESET'
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mereset jadwal');
      }
      fetchClassSchedule();
    } catch (err) {
      alert(err.message);
    }
  };

  const cleanCourseTitle = (rawName) => {
    if (!rawName) return 'Kegiatan Perkuliahan';
    return rawName.replace(/\s*\(SI-[A-Z]\s*\d{4}\)$/i, '').trim();
  };

  return (
    <div className="space-y-6">
      {/* View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-zinc-900/60 border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2 p-1 bg-zinc-800/80 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => setActiveView('CLASS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'CLASS'
                ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Jadwal Kelas (Senin–Jumat)
          </button>
          <button
            type="button"
            onClick={() => setActiveView('ROOM')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'ROOM'
                ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            Pantau per Ruangan
          </button>
        </div>

        {/* Dynamic Controls based on view */}
        <div className="flex flex-wrap items-center gap-3">
          {activeView === 'CLASS' ? (
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400 font-medium">Pilih Kelas:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={currentUser?.role === 'PJ' && !!userClass}
                className="bg-zinc-800 border border-white/10 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 disabled:opacity-80"
              >
                {classList.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400 font-medium">Pilih Ruangan:</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="bg-zinc-800 border border-white/10 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
              >
                <optgroup label="Gedung SG">
                  {ALL_ROOMS.filter(r => r.startsWith('SG') || r.startsWith('Lab-Komputer')).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </optgroup>
                <optgroup label="Gedung JTI">
                  {ALL_ROOMS.filter(r => r.startsWith('JTI') || r.startsWith('Lab-JTI')).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400 font-medium">Minggu/Tanggal:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-zinc-800 border border-white/10 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <button
            type="button"
            onClick={activeView === 'CLASS' ? fetchClassSchedule : fetchRoomAvailability}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/5 transition-all"
            title="Muat Ulang"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        {/* View Mode: Class Schedule (Monday-Friday) */}
        {activeView === 'CLASS' && (
          <div className="p-5 sm:p-7 space-y-6">
            {isWeekend(selectedDate) && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Gedung Perkuliahan Tutup (Akhir Pekan) pada tanggal {selectedDate}. KBM reguler aktif Senin–Jumat.</span>
              </div>
            )}

            {/* Header info bar */}
            {isPJOfSelectedClass ? (
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between gap-3 text-cyan-300 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    <strong>Mode Akses PJ Terverifikasi:</strong> Anda memiliki wewenang untuk mengatur KBM kelas <strong>{selectedClass}</strong> (melepas ruangan daring, memindahkan ruang, atau mengganti jadwal hari/jam).
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-zinc-800/50 border border-white/5 flex items-center gap-2 text-zinc-400 text-xs">
                <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>
                  Menampilkan jadwal kelas <strong>{selectedClass}</strong>. Aksi perubahan ruangan dan jadwal hanya dapat dilakukan oleh PJ kelas bersangkutan atau Petugas.
                </span>
              </div>
            )}

            {loadingClass ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                <span className="text-sm font-medium">Memuat jadwal kelas {selectedClass}...</span>
              </div>
            ) : classError ? (
              <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center text-sm">
                {classError}
              </div>
            ) : classSchedule?.scheduleByDays?.length > 0 ? (
              <div className="space-y-6">
                {classSchedule.scheduleByDays.map((dayGroup) => (
                  <div key={dayGroup.dayOfWeek} className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 sm:p-5">
                    {/* Day Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        <h3 className="text-base font-bold text-white tracking-wide">
                          {dayGroup.dayOfWeek}
                        </h3>
                        <span className="text-xs text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                          {dayGroup.date}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {dayGroup.courses.length} Mata Kuliah
                      </span>
                    </div>

                    {/* Courses in this day */}
                    {dayGroup.courses.length === 0 ? (
                      <div className="py-6 text-center text-xs text-zinc-400 border border-dashed border-white/5 rounded-xl">
                        Tidak ada jadwal perkuliahan pada hari {dayGroup.dayOfWeek}.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dayGroup.courses.map((course) => {
                          const isOnline = course.status === 'ONLINE';
                          const isMovedRoom = course.status === 'MOVED_ROOM';
                          const isRescheduled = course.status === 'RESCHEDULED';
                          const isRescheduledOut = course.status === 'RESCHEDULED_OUT';
                          const isRescheduledIn = course.status === 'RESCHEDULED_IN';

                          return (
                            <div
                              key={course.id}
                              className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                                isOnline
                                  ? 'bg-blue-950/20 border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                                  : isMovedRoom
                                  ? 'bg-purple-950/20 border-purple-500/30'
                                  : (isRescheduled || isRescheduledIn)
                                  ? 'bg-amber-950/20 border-amber-500/30'
                                  : isRescheduledOut
                                  ? 'bg-zinc-900/60 border-zinc-700/50 opacity-75'
                                  : 'bg-zinc-800/40 border-white/5 hover:border-white/15'
                              }`}
                            >
                              <div>
                                {/* Status Badge and Time Slot */}
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>
                                      {course.effectiveStartTime} - {course.effectiveEndTime} WITA
                                    </span>
                                  </div>

                                  {/* Status indicator */}
                                  {isOnline ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                      <Globe className="w-3 h-3" />
                                      Daring / Online
                                    </span>
                                  ) : isMovedRoom ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                      <ArrowRightLeft className="w-3 h-3" />
                                      Pindah Ruang
                                    </span>
                                  ) : isRescheduledOut ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-700/40 text-zinc-300 border border-zinc-600/30">
                                      <Calendar className="w-3 h-3" />
                                      Pindah Hari
                                    </span>
                                  ) : isRescheduledIn ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      <Calendar className="w-3 h-3" />
                                      Jadwal Pengganti
                                    </span>
                                  ) : isRescheduled ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      <Calendar className="w-3 h-3" />
                                      Ganti Jadwal
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                      <CheckCircle className="w-3 h-3" />
                                      Tatap Muka
                                    </span>
                                  )}
                                </div>

                                {/* Course Name */}
                                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                                  {cleanCourseTitle(course.courseName)}
                                </h4>

                                {/* Lecturer and SKS */}
                                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                                  <User className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                                  <span className="truncate">{course.lecturer || 'Dosen Pengampu'}</span>
                                  <span>•</span>
                                  <span>{course.sks} SKS</span>
                                </div>

                                {/* Room Info Pill */}
                                <div className="mt-3 flex items-center gap-2">
                                  <span className="text-xs text-zinc-400">Ruangan:</span>
                                  {isOnline ? (
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                                      Ruang {course.originalRoomCode} Dilepas (KOSONG di Denah)
                                    </span>
                                  ) : isMovedRoom ? (
                                    <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-500/30">
                                      <span className="line-through text-zinc-500">{course.originalRoomCode}</span>
                                      <span>➔</span>
                                      <span className="text-white font-bold">{course.effectiveRoomCode}</span>
                                    </div>
                                  ) : isRescheduledOut ? (
                                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 border border-white/5">
                                      Ruang {course.originalRoomCode} Dilepas
                                    </span>
                                  ) : (
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-700/50 text-white border border-white/10">
                                      {course.effectiveRoomCode}
                                    </span>
                                  )}
                                </div>

                                {course.notes && (
                                  <div className="mt-2 text-[11px] text-zinc-400 italic bg-black/20 p-2 rounded-lg border border-white/5">
                                    Catatan: {course.notes}
                                  </div>
                                )}
                              </div>

                              {/* PJ Action Buttons (Only for PJ of this class or Petugas) */}
                              {isPJOfSelectedClass && (
                                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                                  {!isOnline && !isRescheduledOut && (
                                    <button
                                      type="button"
                                      onClick={() => openActionModal('ONLINE', course)}
                                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1.5"
                                      title="Ubah KBM menjadi Daring dan lepas ruangan agar kosong di denah"
                                    >
                                      <Globe className="w-3.5 h-3.5" />
                                      Mode Daring
                                    </button>
                                  )}

                                  {!isRescheduledOut && (
                                    <button
                                      type="button"
                                      onClick={() => openActionModal('MOVE_ROOM', course)}
                                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1.5"
                                      title="Pindahkan KBM ke ruangan lain yang kosong"
                                    >
                                      <ArrowRightLeft className="w-3.5 h-3.5" />
                                      Pindah Ruang
                                    </button>
                                  )}

                                  {!isRescheduledOut && (
                                    <button
                                      type="button"
                                      onClick={() => openActionModal('RESCHEDULE', course)}
                                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5"
                                      title="Ganti jadwal (pindah hari, jam, atau ruangan)"
                                    >
                                      <Calendar className="w-3.5 h-3.5" />
                                      Ganti Jadwal
                                    </button>
                                  )}

                                  {course.isOverridden && (
                                    <button
                                      type="button"
                                      onClick={() => handleResetCourse(course)}
                                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1.5 ml-auto"
                                      title="Kembalikan ke jadwal reguler SIGA"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      Reset
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-zinc-400 text-sm">
                Tidak ada data jadwal untuk kelas {selectedClass}.
              </div>
            )}
          </div>
        )}

        {/* View Mode: Room Availability (Original Room View) */}
        {activeView === 'ROOM' && (
          <div className="p-5 sm:p-7 space-y-6">
            <div className="p-3.5 rounded-2xl bg-zinc-800/40 border border-white/5 flex items-center justify-between text-xs text-zinc-300">
              <span>Memantau ruangan: <strong className="text-white">{selectedRoom}</strong> pada tanggal <strong className="text-white">{selectedDate}</strong></span>
              <span className="text-zinc-500">WITA Timezone</span>
            </div>

            {loadingRoom ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                <span className="text-sm font-medium">Memuat ketersediaan {selectedRoom}...</span>
              </div>
            ) : roomError ? (
              <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center text-sm">
                {roomError}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roomSchedule.map((slot, idx) => {
                  const isAvailable = slot.status === 'AVAILABLE';
                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                        isAvailable
                          ? 'bg-emerald-950/15 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                          : 'bg-zinc-800/40 border-white/5'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            {slot.startTime} - {slot.endTime} WITA
                          </span>
                          {isAvailable ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Tersedia
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                              Kuliah SIGA (WITA)
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          {slot.courseName ? cleanCourseTitle(slot.courseName) : (isAvailable ? 'Ruangan Siap Digunakan' : 'Kegiatan Terjadwal')}
                        </h4>
                        {slot.lecturer && (
                          <p className="text-xs text-zinc-400 mt-1">Dosen: {slot.lecturer}</p>
                        )}
                        {slot.notes && (
                          <p className="text-[11px] text-cyan-300/80 mt-1">Catatan: {slot.notes}</p>
                        )}
                      </div>

                      {isAvailable && onSelectSlot && (
                        <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                          <button
                            type="button"
                            onClick={() => onSelectSlot({ roomCode: selectedRoom, date: selectedDate, startTime: slot.startTime, endTime: slot.endTime })}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all"
                          >
                            Reservasi Slot Ini
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PJ Action Modal (Online / Move Room / Reschedule) */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/20 p-6 sm:p-7 shadow-2xl relative bg-zinc-900/95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {actionModal.action === 'ONLINE' && <Globe className="w-5 h-5 text-cyan-400" />}
              {actionModal.action === 'MOVE_ROOM' && <ArrowRightLeft className="w-5 h-5 text-purple-400" />}
              {actionModal.action === 'RESCHEDULE' && <Calendar className="w-5 h-5 text-amber-400" />}
              {actionModal.action === 'ONLINE' ? 'Konfirmasi KBM Online / Daring' :
               actionModal.action === 'MOVE_ROOM' ? 'Pindahkan Ruangan KBM' :
               'Ganti Jadwal Perkuliahan'}
            </h3>

            <p className="text-xs text-zinc-400 mt-1">
              Perubahan untuk mata kuliah <strong className="text-white">{cleanCourseTitle(actionModal.course?.courseName)}</strong> pada hari <strong>{actionModal.course?.dayOfWeek}</strong> ({actionModal.course?.date}).
            </p>

            {actionModal.error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {actionModal.error}
              </div>
            )}

            <form onSubmit={handleSubmitOverride} className="mt-5 space-y-4">
              {actionModal.action === 'ONLINE' && (
                <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200">
                  <p className="font-semibold mb-1">Efek Mode Daring:</p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-300">
                    <li>Ruangan <strong>{actionModal.course?.originalRoomCode}</strong> otomatis dilepas dan berstatus <strong>KOSONG / TERSEDIA</strong> di denah interaktif.</li>
                    <li>Mahasiswa lain atau praktikum dapat memanfaatkan ruangan yang kosong ini.</li>
                  </ul>
                </div>
              )}

              {actionModal.action === 'MOVE_ROOM' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Pilih Ruangan Tujuan Baru:
                  </label>
                  <select
                    value={actionModal.newRoomCode}
                    onChange={(e) => setActionModal(prev => ({ ...prev, newRoomCode: e.target.value }))}
                    className="w-full bg-zinc-800 text-white text-xs font-semibold rounded-xl p-3 border border-white/10 focus:outline-none focus:border-cyan-400"
                    required
                  >
                    <optgroup label="Gedung SG (Lantai 1 & 2)">
                      {ALL_ROOMS.filter(r => (r.startsWith('SG') || r.startsWith('Lab-Komputer')) && r !== actionModal.course?.originalRoomCode).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Gedung JTI (Lantai 1 & 2)">
                      {ALL_ROOMS.filter(r => (r.startsWith('JTI') || r.startsWith('Lab-JTI')) && r !== actionModal.course?.originalRoomCode).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Ruang asal ({actionModal.course?.originalRoomCode}) akan otomatis berstatus KOSONG, dan ruang tujuan baru akan dikunci untuk kelas ini.
                  </p>
                </div>
              )}

              {actionModal.action === 'RESCHEDULE' && (
                <div className="space-y-3">
                  {/* Select Day/Date */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Pilih Hari & Tanggal Pelaksanaan:
                    </label>
                    <select
                      value={actionModal.newDate}
                      onChange={(e) => setActionModal(prev => ({ ...prev, newDate: e.target.value }))}
                      className="w-full bg-zinc-800 text-white text-xs font-semibold rounded-xl p-2.5 border border-white/10 focus:outline-none focus:border-cyan-400"
                      required
                    >
                      {classSchedule?.weekDates && Object.entries(classSchedule.weekDates).map(([dayName, dStr]) => (
                        <option key={dStr} value={dStr}>
                          {dayName} ({dStr}) {dStr === actionModal.course?.date ? '— Hari Asal' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Room */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Ruangan:
                    </label>
                    <select
                      value={actionModal.newRoomCode}
                      onChange={(e) => setActionModal(prev => ({ ...prev, newRoomCode: e.target.value }))}
                      className="w-full bg-zinc-800 text-white text-xs font-semibold rounded-xl p-2.5 border border-white/10 focus:outline-none focus:border-cyan-400"
                      required
                    >
                      <optgroup label="Gedung SG (Lantai 1 & 2)">
                        {ALL_ROOMS.filter(r => r.startsWith('SG') || r.startsWith('Lab-Komputer')).map(r => (
                          <option key={r} value={r}>{r} {r === actionModal.course?.originalRoomCode ? '(Ruang Semula)' : ''}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Gedung JTI (Lantai 1 & 2)">
                        {ALL_ROOMS.filter(r => r.startsWith('JTI') || r.startsWith('Lab-JTI')).map(r => (
                          <option key={r} value={r}>{r} {r === actionModal.course?.originalRoomCode ? '(Ruang Semula)' : ''}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Hours */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Jam Mulai:
                      </label>
                      <input
                        type="time"
                        value={actionModal.newStartTime}
                        onChange={(e) => setActionModal(prev => ({ ...prev, newStartTime: e.target.value }))}
                        className="w-full bg-zinc-800 text-white text-xs rounded-xl p-2.5 border border-white/10 focus:outline-none focus:border-cyan-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Jam Selesai:
                      </label>
                      <input
                        type="time"
                        value={actionModal.newEndTime}
                        onChange={(e) => setActionModal(prev => ({ ...prev, newEndTime: e.target.value }))}
                        className="w-full bg-zinc-800 text-white text-xs rounded-xl p-2.5 border border-white/10 focus:outline-none focus:border-cyan-400"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Catatan / Alasan (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dosen berhalangan tatap muka / Pindah jadwal atas kesepakatan kelas"
                  value={actionModal.notes}
                  onChange={(e) => setActionModal(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-zinc-800 text-white text-xs rounded-xl p-2.5 border border-white/10 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={closeActionModal}
                  disabled={actionModal.loading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionModal.loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all flex items-center gap-2"
                >
                  {actionModal.loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Terapkan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
