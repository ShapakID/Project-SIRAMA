import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Tv,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  BookOpen,
  Layers,
  Building2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { getWitaDateYMD, getNextWeekdayYMD, isWeekend, getDayOfWeek, parseNimMetadata } from '../utils/timeUtils';
import { getCoursesByNim } from '../utils/curriculumData';

export default function PJDashboard({ currentUser, initialRoom, onNavigateToFloorPlan }) {
  const [reservations, setReservations] = useState([]);
  const [projectors, setProjectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const classMeta = parseNimMetadata(currentUser?.nim);
  const pjClassTitle = classMeta ? classMeta.className : 'SI-A 2025';

  const availableCourses = getCoursesByNim(currentUser?.nim);
  const [selectedCourse, setSelectedCourse] = useState(() => availableCourses[0]?.name || 'Rekayasa Perangkat Lunak');

  // Form states - category only PRAKTIKUM and LAINNYA
  const [formData, setFormData] = useState({
    roomCode: initialRoom || 'SG-7',
    date: getNextWeekdayYMD(),
    startTime: '10:00',
    endTime: '12:00',
    category: 'PRAKTIKUM',
    title: `Praktikum ${availableCourses[0]?.name || 'Rekayasa Perangkat Lunak'}`,
    purpose: ''
  });

  // Sync initialRoom when passed or updated from floor plan
  useEffect(() => {
    if (initialRoom) {
      setFormData(prev => ({ ...prev, roomCode: initialRoom }));
    }
  }, [initialRoom]);

  // Keep title synced when category or selectedCourse changes
  useEffect(() => {
    if (formData.category === 'PRAKTIKUM') {
      setFormData(prev => ({ ...prev, title: `Praktikum ${selectedCourse}` }));
    }
  }, [selectedCourse, formData.category]);

  const [loanModalRes, setLoanModalRes] = useState(null);
  const [selectedProjectorCode, setSelectedProjectorCode] = useState('');

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
        headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('sirama_token') ? { 'Authorization': `Bearer ${localStorage.getItem('sirama_token')}` } : {}) },
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
      const resDraft = await fetch('/api/practicum/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('sirama_token') ? { 'Authorization': `Bearer ${localStorage.getItem('sirama_token')}` } : {}) },
        body: JSON.stringify({
          ...formData,
          userId: currentUser.id,
          pjNim: currentUser.nim,
          pjName: currentUser.name
        })
      });
      const draftData = await resDraft.json();
      if (!resDraft.ok) throw new Error(draftData.error || 'Gagal membuat draft');

      const resPub = await fetch(`/api/practicum/${draftData.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('sirama_token') ? { 'Authorization': `Bearer ${localStorage.getItem('sirama_token')}` } : {}) },
        body: JSON.stringify({
          userId: currentUser.id,
          pjNim: currentUser.nim
        })
      });
      const pubData = await resPub.json();
      if (!resPub.ok) throw new Error(pubData.error || 'Gagal menerbitkan reservasi');

      setMessage({
        text: `Sukses! Reservasi "${formData.title}" di ruang ${formData.roomCode} berhasil diterbitkan langsung.`,
        type: 'success'
      });
      setSelectedLoan(prev => ({ ...prev, reservationId: draftData.id }));
      loadData();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handlePublish = async (id) => {
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch(`/api/practicum/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('sirama_token') ? { 'Authorization': `Bearer ${localStorage.getItem('sirama_token')}` } : {}) },
        body: JSON.stringify({
          userId: currentUser.id,
          pjNim: currentUser.nim
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mempublikasikan');
      setMessage({ text: 'Praktikum resmi diterbitkan! Ruangan sekarang terkunci.', type: 'success' });
      loadData();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Batalkan reservasi ini? Ruangan akan kembali kosong.')) return;
    try {
      const res = await fetch(`/api/practicum/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('sirama_token') ? { 'Authorization': `Bearer ${localStorage.getItem('sirama_token')}` } : {}) },
        body: JSON.stringify({
          userId: currentUser.id,
          pjNim: currentUser.nim
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membatalkan');
      setMessage({ text: 'Reservasi berhasil dibatalkan.', type: 'success' });
      loadData();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const todayWita = getWitaDateYMD();

  const openLoanModal = (resItem) => {
    setLoanModalRes(resItem);
    const isJti = resItem.roomCode.startsWith('JTI') || resItem.roomCode === 'Lab-JTI';
    const building = isJti ? 'JTI' : 'GSG';
    const available = projectors.filter(p => {
      const pB = p.building || (p.code.startsWith('JTI') ? 'JTI' : 'GSG');
      return pB === building && p.status === 'AVAILABLE';
    });
    setSelectedProjectorCode(available[0]?.code || '');
  };

  const handleBorrowProjector = async (e) => {
    e.preventDefault();
    if (!loanModalRes) return;

    const todayD = new Date(todayWita + 'T00:00:00');
    const resD = new Date(loanModalRes.date + 'T00:00:00');
    const diffDays = Math.round((resD - todayD) / (1000 * 60 * 60 * 24));
    if (diffDays < 0 || diffDays > 3) {
      setMessage({ text: 'Peminjaman proyektor hanya diizinkan H-3 s.d. hari H pelaksanaan.', type: 'error' });
      return;
    }
    if (!selectedProjectorCode) {
      setMessage({ text: 'Tidak ada unit proyektor tersedia.', type: 'error' });
      return;
    }

    const isJti = loanModalRes.roomCode.startsWith('JTI') || loanModalRes.roomCode === 'Lab-JTI';
    const displayBuilding = isJti ? 'JTI' : 'SG';

    try {
      const res = await fetch('/api/projectors/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('sirama_token') ? { 'Authorization': `Bearer ${localStorage.getItem('sirama_token')}` } : {}) },
        body: JSON.stringify({
          projectorCode: selectedProjectorCode,
          reservationId: loanModalRes.id,
          borrowerName: currentUser.name,
          borrowerNim: currentUser.nim,
          roomCode: loanModalRes.roomCode
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal meminjam proyektor');
      setMessage({
        text: `Peminjaman Unit Proyektor ${selectedProjectorCode} berhasil dicatat! Ambil unit di ruang petugas ${displayBuilding}.`,
        type: 'success'
      });
      setLoanModalRes(null);
      loadData();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const isSelectedRoomJti = formData.roomCode.startsWith('JTI') || formData.roomCode === 'Lab-JTI';

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

      <div className="max-w-3xl mx-auto w-full">
        {/* Kolom Form Reservasi Ruangan */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 shadow-xl space-y-5">
          <div className="border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Reservasi Ruangan
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Pilih ruangan langsung dari denah interaktif, tentukan jadwal, dan terbitkan reservasi.
            </p>
          </div>

          <div className="space-y-4">
            {/* Opsi Kategori Reservasi: Hanya 2 (Praktikum & Lainnya) */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Tujuan Reservasi</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: 'PRAKTIKUM', title: `Praktikum ${selectedCourse}` }))}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition cursor-pointer text-center ${
                    formData.category === 'PRAKTIKUM'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-zinc-950/60 text-zinc-400 border-white/10 hover:text-zinc-200'
                  }`}
                >
                  Praktikum
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: 'LAINNYA', title: 'Kegiatan Mahasiswa / Umum' }))}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition cursor-pointer text-center ${
                    formData.category === 'LAINNYA'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'bg-zinc-950/60 text-zinc-400 border-white/10 hover:text-zinc-200'
                  }`}
                >
                  Lainnya
                </button>
              </div>
            </div>

            {/* Pemilihan Ruangan: Langsung dari Denah, Tanpa Dropdown List */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Ruangan Terpilih</label>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-950/80 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 min-w-[3.5rem] rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold font-mono text-xs sm:text-sm whitespace-nowrap shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    {formData.roomCode}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white tracking-tight">
                        Ruang {formData.roomCode}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-cyan-300">
                        {isSelectedRoomJti ? 'JTI' : 'SG'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {isSelectedRoomJti ? 'Fasilitas JTI FT-Untad' : 'Fasilitas SG FT-Untad'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onNavigateToFloorPlan}
                  className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-xl text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>Pilih dari Denah</span>
                </button>
              </div>
            </div>

            {/* Tanggal & Waktu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-zinc-300">Tanggal</label>
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

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Mulai (WITA)</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Selesai (WITA)</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Form Konten: Praktikum Mata Kuliah vs Acara Lainnya */}
            {formData.category === 'PRAKTIKUM' ? (
              <div className="space-y-3 p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-cyan-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Pilih Mata Kuliah Kurikulum ({pjClassTitle})
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">Semester {classMeta?.semester || 3}</span>
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
            ) : (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Nama Kegiatan / Acara
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rapat Koordinasi, Pelatihan, atau Kegiatan Mahasiswa"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            {/* Alasan / Catatan Tujuan */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  {formData.category === 'LAINNYA' ? 'Alasan / Tujuan Kegiatan' : 'Catatan Tambahan (Opsional)'}
                </label>
                {formData.category === 'LAINNYA' && (
                  <span className="text-[10px] text-amber-400 font-mono">Wajib diisi</span>
                )}
              </div>
              <textarea
                rows={2}
                placeholder={
                  formData.category === 'LAINNYA'
                    ? 'Tuliskan alasan dan tujuan penggunaan ruangan...'
                    : 'Catatan peralatan, materi, atau informasi praktikum...'
                }
                value={formData.purpose}
                onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            {/* Peringatan Hari Libur Akhir Pekan */}
            {isWeekend(formData.date) && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Gedung perkuliahan tutup pada hari <b>{getDayOfWeek(formData.date)}</b>. Silakan pilih hari Senin - Jumat.</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
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
                Simpan Pengajuan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Daftar Reservasi PJ */}
      <div className="glass-panel rounded-3xl border border-white/10 p-4 sm:p-7 shadow-xl space-y-4">
        <h3 className="text-base font-semibold text-white tracking-tight">Daftar Reservasi Anda</h3>
        {reservations.length === 0 ? (
          <p className="text-xs text-zinc-500">Belum ada reservasi dibuat.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs text-zinc-300 min-w-[640px]">
              <thead className="bg-zinc-900/60 text-zinc-400 uppercase font-mono text-[11px] border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Ruang</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Waktu (WITA)</th>
                  <th className="px-4 py-3">Tujuan & Nama Kegiatan</th>
                  <th className="px-4 py-3">Alasan / Catatan</th>
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
                        {item.category === 'LAINNYA' ? (
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
                        item.status === 'DRAFT' ? 'glass-pill text-zinc-300 border-white/10' :
                        item.status === 'COMPLETED' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' :
                        'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      {false && (
                        <button
                          onClick={() => handlePublish(item.id)}
                          className="px-3 py-1 bg-emerald-500 text-zinc-950 font-semibold rounded-lg hover:bg-emerald-400 transition cursor-pointer"
                        >
                          Terbitkan
                        </button>
                      )}
                      {item.status === 'PUBLISHED' && (
                        item.activeLoan ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            <Tv className="w-3 h-3 text-cyan-400" />
                            Unit {item.activeLoan.projectorCode}
                          </span>
                        ) : (
                          <button
                            onClick={() => openLoanModal(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-medium transition cursor-pointer"
                          >
                            <Tv className="w-3.5 h-3.5" />
                            Pinjam Proyektor
                          </button>
                        )
                      )}
                      {item.status !== 'CANCELLED' && item.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleCancel(item.id)}
                          className="px-3 py-1 text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
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

      {/* Modal Peminjaman Proyektor Terikat Reservasi */}
      {loanModalRes && (() => {
        const todayD = new Date(todayWita + 'T00:00:00');
        const resD = new Date(loanModalRes.date + 'T00:00:00');
        const diffDays = Math.round((resD - todayD) / (1000 * 60 * 60 * 24));
        const isAllowed = diffDays >= 0 && diffDays <= 3;
        const isJti = loanModalRes.roomCode.startsWith('JTI') || loanModalRes.roomCode === 'Lab-JTI';
        const displayBld = isJti ? 'JTI' : 'SG';
        const targetBld = isJti ? 'JTI' : 'GSG';
        const availableUnits = projectors.filter(p => {
          const pB = p.building || (p.code.startsWith('JTI') ? 'JTI' : 'GSG');
          return pB === targetBld && p.status === 'AVAILABLE';
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-modal max-w-md w-full p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    Peminjaman Proyektor {displayBld}
                  </h3>
                </div>
                <button
                  onClick={() => setLoanModalRes(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Info Reservasi Terkait */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Ruangan:</span>
                  <span className="font-semibold text-white font-mono">{loanModalRes.roomCode} ({displayBld})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Jadwal:</span>
                  <span className="font-mono text-cyan-300">{loanModalRes.date} • {loanModalRes.startTime}-{loanModalRes.endTime} WITA</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Kegiatan:</span>
                  <span className="text-zinc-200 truncate max-w-[200px]">{loanModalRes.title}</span>
                </div>
              </div>

              {/* Status Validasi H-3 */}
              <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                isAllowed
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
              }`}>
                {isAllowed ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">
                    {isAllowed ? 'Siap Dipinjam' : 'Belum Memasuki Waktu Pinjam'}
                  </div>
                  <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">
                    {diffDays < 0
                      ? `Tanggal reservasi sudah lewat.`
                      : diffDays > 3
                      ? `Peminjaman proyektor dibuka H-3 s.d. hari H (Jadwal: ${loanModalRes.date}, saat ini H-${diffDays}).`
                      : `Reservasi ini memenuhi syarat (${diffDays === 0 ? 'Hari H' : `H-${diffDays}`}). Silakan pilih unit.`}
                  </p>
                </div>
              </div>

              {isAllowed ? (
                <form onSubmit={handleBorrowProjector} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Pilih Unit Proyektor {displayBld} ({availableUnits.length} unit tersedia)
                    </label>
                    {availableUnits.length === 0 ? (
                      <p className="text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                        Seluruh proyektor {displayBld} sedang terpakai saat ini.
                      </p>
                    ) : (
                      <select
                        value={selectedProjectorCode}
                        onChange={(e) => setSelectedProjectorCode(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                      >
                        {availableUnits.map(p => (
                          <option key={p.code} value={p.code}>
                            Unit {p.code} ({displayBld}) • Siap Pakai
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setLoanModalRes(null)}
                      className="px-3.5 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={availableUnits.length === 0}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
                    >
                      Konfirmasi Pinjam
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setLoanModalRes(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
