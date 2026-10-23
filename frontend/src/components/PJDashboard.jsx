import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Tv, PlusCircle, CheckCircle, AlertCircle, RefreshCw, Send, Trash2 } from 'lucide-react';

const ROOM_OPTIONS = ['SG-1', 'SG-2', 'SG-3', 'SG-4', 'SG-5', 'SG-6', 'SG-7', 'SG-8', 'JTI-1', 'JTI-2'];

export default function PJDashboard({ currentUser }) {
  const [reservations, setReservations] = useState([]);
  const [projectors, setProjectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form states
  const [formData, setFormData] = useState({
    roomCode: 'SG-7',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
    title: 'Praktikum Rekayasa Perangkat Lunak'
  });

  const [overrideData, setOverrideData] = useState({
    roomCode: 'SG-7',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '10:00',
    reason: 'Perkuliahan dilaksanakan secara Daring (Online)'
  });

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
      {/* Alert Banner */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Profil PJ */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            Penanggung Jawab (PJ) Mata Kuliah
          </span>
          <h2 className="text-xl font-bold text-slate-800 mt-2">{currentUser.name}</h2>
          <p className="text-xs text-slate-500 font-mono">NIM: {currentUser.nim} • Jurusan Teknologi Informasi</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 transition w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Reservasi Praktikum */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              Buat Jadwal Praktikum Baru
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Reservasi langsung sah saat ditekan 'Terbitkan' jika tidak terjadi bentrok.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Ruangan GSG</label>
                <select
                  value={formData.roomCode}
                  onChange={(e) => setFormData({ ...formData, roomCode: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500"
                >
                  {ROOM_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Tanggal</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Jam Mulai</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Jam Selesai</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Nama Praktikum & Modul</label>
              <input
                type="text"
                placeholder="Contoh: Praktikum RPL - Modul 2 UML & Activity Diagram"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCreateDraft}
                className="flex-1 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition"
              >
                Simpan Draft
              </button>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Lepas Ruangan (Override) & Sewa Proyektor */}
        <div className="space-y-6">
          {/* Form Lepas Ruangan */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Lepaskan Slot Kelas (Daring / Dosen Kosong)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Membuat slot kuliah reguler menjadi KOSONG sehingga bisa dipakai praktikum.</p>
            </div>

            <form onSubmit={handleCreateOverride} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Ruangan</label>
                  <select
                    value={overrideData.roomCode}
                    onChange={(e) => setOverrideData({ ...overrideData, roomCode: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  >
                    {ROOM_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Tanggal</label>
                  <input
                    type="date"
                    value={overrideData.date}
                    onChange={(e) => setOverrideData({ ...overrideData, date: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Jam Mulai</label>
                  <input
                    type="time"
                    value={overrideData.startTime}
                    onChange={(e) => setOverrideData({ ...overrideData, startTime: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Jam Selesai</label>
                  <input
                    type="time"
                    value={overrideData.endTime}
                    onChange={(e) => setOverrideData({ ...overrideData, endTime: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Alasan / Catatan</label>
                <input
                  type="text"
                  value={overrideData.reason}
                  onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })}
                  className="mt-1 w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition"
              >
                Lepaskan Slot Ruangan
              </button>
            </form>
          </div>

          {/* Form Sewa Proyektor */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tv className="w-5 h-5 text-indigo-600" />
                Peminjaman Unit Proyektor (Unit 01-11)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Wajib memiliki reservasi aktif berstatus PUBLISHED.</p>
            </div>

            <form onSubmit={handleBorrowProjector} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Nomor Reservasi Praktikum Aktif</label>
                <select
                  value={selectedLoan.reservationId}
                  onChange={(e) => setSelectedLoan({ ...selectedLoan, reservationId: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
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
                <label className="block text-xs font-semibold text-slate-700">Pilih Unit Proyektor Tersedia</label>
                <select
                  value={selectedLoan.projectorCode}
                  onChange={(e) => setSelectedLoan({ ...selectedLoan, projectorCode: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
                >
                  {projectors.filter(p => p.status === 'AVAILABLE').map(p => (
                    <option key={p.code} value={p.code}>Unit {p.code} ({p.brand})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
              >
                Pinjam Unit Proyektor
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Tabel Daftar Reservasi PJ */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Daftar Reservasi Anda</h3>
        {reservations.length === 0 ? (
          <p className="text-xs text-slate-500">Belum ada reservasi dibuat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Ruang</th>
                  <th className="px-4 py-2.5">Tanggal</th>
                  <th className="px-4 py-2.5">Waktu</th>
                  <th className="px-4 py-2.5">Mata Kuliah / Modul</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{item.roomCode}</td>
                    <td className="px-4 py-3">{item.date}</td>
                    <td className="px-4 py-3 font-mono">{item.startTime} - {item.endTime}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        item.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {item.status === 'DRAFT' && (
                        <button
                          onClick={() => handlePublish(item.id)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-500 transition"
                        >
                          Terbitkan
                        </button>
                      )}
                      {item.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancel(item.id)}
                          className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded transition"
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
