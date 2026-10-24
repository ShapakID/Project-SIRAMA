import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Tv, PlusCircle, CheckCircle, AlertCircle, RefreshCw, Send, Trash2, Tag, FileText, BookOpen } from 'lucide-react';
import { getWitaDateYMD, getNextWeekdayYMD, isWeekend, getDayOfWeek, parseNimMetadata } from '../utils/timeUtils';
import { getCoursesByNim } from '../utils/curriculumData';

const ROOM_OPTIONS = ['SG-1', 'SG-2', 'SG-3', 'SG-4', 'SG-5', 'SG-6', 'SG-7', 'SG-8', 'SG-9', 'SG-10', 'SG-11', 'Lab-Komputer'];

export default function PJDashboard({ currentUser }) {
  const [reservations, setReservations] = useState([]);
  const [projectors, setProjectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const classMeta = parseNimMetadata(currentUser?.nim);
  const pjClassTitle = classMeta ? classMeta.className : 'SI-A 2025';

  const availableCourses = getCoursesByNim(currentUser?.nim);
  const [selectedCourse, setSelectedCourse] = useState(() => availableCourses[0]?.name || 'Rekayasa Perangkat Lunak');
  const [moduleTopic, setModuleTopic] = useState('Modul 1: Pengantar & Persiapan');

  // Form states
  const [formData, setFormData] = useState({
    roomCode: 'SG-7',
    date: getNextWeekdayYMD(),
    startTime: '10:00',
    endTime: '12:00',
    category: 'PRAKTIKUM',
    title: `Praktikum ${availableCourses[0]?.name || 'Rekayasa Perangkat Lunak'} - Modul 1: Pengantar & Persiapan`,
    purpose: ''
  });

  const [overrideData, setOverrideData] = useState({
    roomCode: 'SG-7',
    date: getNextWeekdayYMD(),
    startTime: '08:00',
    endTime: '10:00',
    reason: 'Perkuliahan dilaksanakan secara Daring (Online)'
  });

  useEffect(() => {
    if (formData.category === 'PRAKTIKUM') {
      const fullTitle = moduleTopic.trim()
        ? `Praktikum ${selectedCourse} - ${moduleTopic.trim()}`
        : `Praktikum ${selectedCourse}`;
      setFormData(prev => ({ ...prev, title: fullTitle }));
    }
  }, [selectedCourse, moduleTopic, formData.category]);

  const [selectedLoan, setSelectedLoan] = useState({
    reservationId: '',
    projectorCode: '01'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [resPracticum, resProjector] = await Promise.all([
        fetch(`/api/practicum?pjNim=${currentUser.nim || ''}`),
        fetch('/api/projectors')
      ]);
      if (resPracticum.ok) {
        const pData = await resPracticum.json();
        setReservations(pData);
        if (pData.length > 0 && !selectedLoan.reservationId) {
          const published = pData.find(r => r.status === 'PUBLISHED');
          if (published) setSelectedLoan(prev => ({ ...prev, reservationId: published.id }));
        }
      }
      if (resProjector.ok) {
        const prData = await resProjector.json();
        setProjectors(prData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDraft = async () => {
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/practicum/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: currentUser.id,
          pjNim: currentUser.nim,
          pjName: currentUser.name
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan draft');
      setMessage({ text: 'Draft praktikum berhasil disimpan!', type: 'success' });
      loadData();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleCreateAndPublish = async () => {
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/practicum/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: currentUser.id,
          pjNim: currentUser.nim,
          pjName: currentUser.name,
          organizerNim: currentUser.nim,
          organizerName: currentUser.name
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat reservasi');

      const pubRes = await fetch(`/api/practicum/${data.id}/publish`, { method: 'POST' });
      const pubData = await pubRes.json();
      if (!pubRes.ok) throw new Error(pubData.error || 'Gagal menerbitkan reservasi');

      setMessage({ text: 'Reservasi praktikum berhasil dibuat dan langsung DITERBITKAN anti-bentrok!', type: 'success' });
      loadData();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handlePublish = async (id) => {
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch(`/api/practicum/${id}/publish`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menerbitkan reservasi');
      setMessage({ text: 'Reservasi praktikum SAH dan diterbitkan anti-bentrok!', type: 'success' });
      loadData();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Batalkan reservasi ini?')) return;
    try {
      const res = await fetch(`/api/practicum/${id}/cancel`, { method: 'POST' });
      if (res.ok) loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateOverride = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/schedules/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...overrideData,
          status: 'RELEASED',
          releasedByNim: currentUser.nim,
          releasedByName: currentUser.name
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal melepaskan ruangan');
      setMessage({ text: `Ruangan ${overrideData.roomCode} berhasil dilepaskan untuk tanggal ${overrideData.date}`, type: 'success' });
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleBorrowProjector = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    if (!selectedLoan.reservationId) {
      setMessage({ text: 'Pilih nomor reservasi ruangan praktikum aktif terlebih dahulu!', type: 'error' });
      return;
    }
    try {
      const res = await fetch('/api/projectors/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectorCode: selectedLoan.projectorCode,
          reservationId: selectedLoan.reservationId,
          borrowerName: currentUser.name,
          borrowerNim: currentUser.nim
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal meminjam proyektor');
      setMessage({ text: `Peminjaman Unit Proyektor ${selectedLoan.projectorCode} berhasil dicatat! Ambil unit di ruang petugas GSG.`, type: 'success' });
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

      {/* Profil PJ Once UI Glass */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full glass-pill text-amber-300 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            PJ Kelas Aktif ({pjClassTitle})
          </span>
          <h2 className="text-xl font-semibold text-white tracking-tight mt-2.5">{currentUser.name}</h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">NIM: {currentUser.nim} • Jurusan Teknologi Informasi</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 text-xs glass-pill hover:bg-white/10 text-zinc-300 hover:text-white px-4 py-2 rounded-full border border-white/10 transition w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          Segarkan Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Reservasi Praktikum & Kegiatan Organisasi */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 shadow-xl space-y-5">
          <div className="border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Reservasi Ruangan (Praktikum / HIMA / Lainnya)
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Dukungan kegiatan perkuliahan, organisasi HIMA Untad, atau kegiatan lainnya.</p>
          </div>

          <div className="space-y-4">
            {/* Opsi Kategori Reservasi */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Tujuan / Kategori Reservasi</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: 'PRAKTIKUM', title: 'Praktikum Rekayasa Perangkat Lunak' }))}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition cursor-pointer text-center ${
                    formData.category === 'PRAKTIKUM'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                      : 'bg-zinc-950/60 text-zinc-400 border-white/10 hover:text-zinc-200'
                  }`}
                >
                  Praktikum
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: 'HIMA_ORMAWA', title: 'Rapat / Kegiatan HIMA SIFOR' }))}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition cursor-pointer text-center ${
                    formData.category === 'HIMA_ORMAWA'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold'
                      : 'bg-zinc-950/60 text-zinc-400 border-white/10 hover:text-zinc-200'
                  }`}
                >
                  HIMA / Ormawa
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: 'LAINNYA', title: 'Kegiatan Lainnya' }))}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition cursor-pointer text-center ${
                    formData.category === 'LAINNYA'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                      : 'bg-zinc-950/60 text-zinc-400 border-white/10 hover:text-zinc-200'
                  }`}
                >
                  Lainnya
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Ruangan GSG</label>
                <select
                  value={formData.roomCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomCode: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {ROOM_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-zinc-300">Hari & Tanggal</label>
                  <span className={`text-[10px] font-mono ${isWeekend(formData.date) ? 'text-rose-400 font-bold' : 'text-zinc-400'}`}>
                    {getDayOfWeek(formData.date)}
                  </span>
                </div>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className={`w-full px-3 py-2 bg-zinc-950/80 border rounded-xl text-xs text-zinc-200 focus:outline-none ${
                    isWeekend(formData.date) ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-400' : 'border-white/10 focus:border-cyan-400'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Jam Mulai (WITA)</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Jam Selesai (WITA)</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Opsi Pemilihan Mata Kuliah untuk Praktikum */}
            {formData.category === 'PRAKTIKUM' ? (
              <div className="space-y-3 p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-cyan-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Pilih Mata Kuliah Kurikulum ({pjClassTitle})
                    </label>
                    <span className="text-[10px] text-zinc-400">Semester {classMeta?.semester || 3}</span>
                  </div>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950/90 border border-cyan-500/30 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {availableCourses.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} {c.hasLab ? '• Ada Praktikum' : ''} ({c.sks} SKS)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Modul / Topik Praktikum (Manual)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Modul 2 - UML & Diagram Alur"
                    value={moduleTopic}
                    onChange={(e) => setModuleTopic(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  {formData.category === 'HIMA_ORMAWA'
                    ? 'Nama Kegiatan / Divisi HIMA'
                    : 'Nama Acara / Kegiatan'}
                </label>
                <input
                  type="text"
                  placeholder={
                    formData.category === 'HIMA_ORMAWA'
                      ? 'Contoh: Rapat Kerja HIMA SIFOR - Panitia Dies Natalis'
                      : 'Contoh: Persiapan Lomba Hackathon Kampus'
                  }
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            {/* Kolom Alasan / Deskripsi Tujuan Reservasi */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Alasan / Keterangan Reservasi
                </label>
                {formData.category !== 'PRAKTIKUM' && (
                  <span className="text-[10px] text-amber-400 font-mono">Wajib diisi</span>
                )}
              </div>
              <textarea
                rows={2}
                placeholder={
                  formData.category === 'HIMA_ORMAWA'
                    ? 'Tulis alasan penggunaan ruangan oleh HIMA/Ormawa...'
                    : formData.category === 'LAINNYA'
                    ? 'Tulis alasan dan keperluan kegiatan di GSG...'
                    : 'Catatan tambahan (opsional)...'
                }
                value={formData.purpose}
                onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            {/* Peringatan Hari Sabtu/Minggu (GSG Tutup) */}
            {isWeekend(formData.date) && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Gedung GSG tutup pada hari <b>{getDayOfWeek(formData.date)}</b> (Akhir Pekan). Harap pilih hari operasional Senin - Jumat.</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isWeekend(formData.date)}
                onClick={handleCreateDraft}
                className={`flex-1 py-2.5 text-xs font-medium rounded-xl border border-white/10 transition ${
                  isWeekend(formData.date)
                    ? 'opacity-30 cursor-not-allowed bg-zinc-900 text-zinc-600'
                    : 'glass-pill hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer'
                }`}
              >
                Simpan Draft
              </button>
              <button
                type="button"
                disabled={isWeekend(formData.date)}
                onClick={handleCreateAndPublish}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition ${
                  isWeekend(formData.date)
                    ? 'opacity-30 cursor-not-allowed bg-zinc-800 text-zinc-600'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer'
                }`}
              >
                Terbitkan Langsung
              </button>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Lepas Ruangan (Override) & Sewa Proyektor */}
        <div className="space-y-6">
          {/* Form Lepas Ruangan */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 shadow-xl space-y-4">
            <div className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Lepaskan Slot Kuliah (Daring / Kosong)
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">Mengubah slot kuliah SIGA menjadi TERSEDIA untuk praktikum.</p>
            </div>

            <form onSubmit={handleCreateOverride} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Ruangan</label>
                  <select
                    value={overrideData.roomCode}
                    onChange={(e) => setOverrideData({ ...overrideData, roomCode: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
                  >
                    {ROOM_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-zinc-300">Hari & Tanggal</label>
                    <span className={`text-[10px] font-mono ${isWeekend(overrideData.date) ? 'text-rose-400 font-bold' : 'text-zinc-400'}`}>
                      {getDayOfWeek(overrideData.date)}
                    </span>
                  </div>
                  <input
                    type="date"
                    value={overrideData.date}
                    onChange={(e) => setOverrideData({ ...overrideData, date: e.target.value })}
                    className={`w-full px-3 py-2 bg-zinc-950/80 border rounded-xl text-xs text-zinc-200 focus:outline-none ${
                      isWeekend(overrideData.date) ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-400' : 'border-white/10 focus:border-cyan-400'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Jam Mulai</label>
                  <input
                    type="time"
                    value={overrideData.startTime}
                    onChange={(e) => setOverrideData({ ...overrideData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Jam Selesai</label>
                  <input
                    type="time"
                    value={overrideData.endTime}
                    onChange={(e) => setOverrideData({ ...overrideData, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Alasan / Catatan</label>
                <input
                  type="text"
                  value={overrideData.reason}
                  onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {isWeekend(overrideData.date) && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>GSG tutup hari {getDayOfWeek(overrideData.date)}. Pilih Senin - Jumat.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isWeekend(overrideData.date)}
                className={`w-full py-2.5 text-xs font-medium rounded-xl border transition ${
                  isWeekend(overrideData.date)
                    ? 'opacity-30 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-600'
                    : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/30 cursor-pointer'
                }`}
              >
                Lepaskan Slot Ruangan Ini
              </button>
            </form>
          </div>

          {/* Form Sewa Proyektor */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 shadow-xl space-y-4">
            <div className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Peminjaman Unit Proyektor (Unit 01 - 11)
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">Wajib terikat pada reservasi berstatus PUBLISHED.</p>
            </div>

            <form onSubmit={handleBorrowProjector} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Reservasi Praktikum Terbit</label>
                <select
                  value={selectedLoan.reservationId}
                  onChange={(e) => setSelectedLoan({ ...selectedLoan, reservationId: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Pilih Reservasi Terbit --</option>
                  {reservations.filter(r => r.status === 'PUBLISHED').map(r => (
                    <option key={r.id} value={r.id}>
                      {r.roomCode} ({r.date} {r.startTime}-{r.endTime}) - {r.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Pilih Unit Proyektor Tersedia</label>
                <select
                  value={selectedLoan.projectorCode}
                  onChange={(e) => setSelectedLoan({ ...selectedLoan, projectorCode: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
                >
                  {projectors.filter(p => p.status === 'AVAILABLE').map(p => (
                    <option key={p.code} value={p.code}>Unit {p.code} ({p.brand})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.25)] transition"
              >
                Pinjam Unit Proyektor
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Tabel Daftar Reservasi PJ */}
      <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-7 shadow-xl space-y-4">
        <h3 className="text-base font-semibold text-white tracking-tight">Daftar Reservasi Anda</h3>
        {reservations.length === 0 ? (
          <p className="text-xs text-zinc-500">Belum ada reservasi dibuat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/60 text-zinc-400 uppercase font-mono text-[11px] border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Ruang</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Waktu (WITA)</th>
                  <th className="px-4 py-3">Kategori & Kegiatan</th>
                  <th className="px-4 py-3">Alasan / Tujuan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reservations.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">{item.roomCode}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono">{item.date}</td>
                    <td className="px-4 py-3 font-mono text-zinc-300">{item.startTime} - {item.endTime}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.category === 'HIMA_ORMAWA' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            HIMA
                          </span>
                        ) : item.category === 'LAINNYA' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Lainnya
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Praktikum
                          </span>
                        )}
                        <span className="font-medium text-zinc-200">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 max-w-[200px] truncate" title={item.purpose || ''}>
                      {item.purpose || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] border ${
                        item.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                        item.status === 'DRAFT' ? 'glass-pill text-zinc-300 border-white/10' : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {item.status === 'DRAFT' && (
                        <button
                          onClick={() => handlePublish(item.id)}
                          className="px-3 py-1 bg-emerald-500 text-zinc-950 font-semibold rounded-lg hover:bg-emerald-400 transition"
                        >
                          Terbitkan
                        </button>
                      )}
                      {item.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancel(item.id)}
                          className="px-3 py-1 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        >
                          Batal
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
    </div>
  );
}
