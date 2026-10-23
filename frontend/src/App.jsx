import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RoomTimetable from './components/RoomTimetable';
import PJDashboard from './components/PJDashboard';
import PetugasDashboard from './components/PetugasDashboard';
import { Shield, Tv, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sirama_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('jadwal');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Report form state
  const [reportData, setReportData] = useState({
    targetType: 'ROOM',
    targetCode: 'SG-7',
    reporterName: '',
    description: ''
  });
  const [reportSuccess, setReportSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal');
      
      setCurrentUser(data.user);
      localStorage.setItem('sirama_user', JSON.stringify(data.user));
      setLoginModalOpen(false);
      if (data.user.role === 'PJ') setActiveTab('pj');
      if (data.user.role === 'PETUGAS') setActiveTab('petugas');
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sirama_user');
    setActiveTab('jadwal');
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });
      if (!res.ok) throw new Error('Gagal mengirim laporan');
      setReportSuccess('Laporan berhasil dikirim ke Petugas GSG.');
      setTimeout(() => {
        setReportSuccess('');
        setReportModalOpen(false);
      }, 1500);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans pb-16">
      <Navbar
        currentUser={currentUser}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setReportModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Banner Informasional Hero Once UI Style */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-cyan-300 text-xs font-mono mb-4 border border-cyan-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse"></span>
              GSG FT-UNTAD ACADEMIC PLATFORM
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-tight">
              Sistem Informasi Reservasi & Fasilitas
            </h2>
            <p className="mt-2.5 text-sm text-zinc-400 leading-relaxed max-w-2xl">
              Gedung Serbaguna Fakultas Teknik Universitas Tadulako. Peminjaman ruangan praktikum anti-bentrok berbasis transaksi atomik dan manajemen unit proyektor tanpa kunci fisik, terintegrasi sinkron jadwal SIGA.
            </p>
          </div>
        </div>

        {/* Content based on Active Tab */}
        {activeTab === 'jadwal' && (
          <RoomTimetable />
        )}

        {activeTab === 'proyektor' && (
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 text-center shadow-xl shadow-black/40">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto mb-4 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <Tv className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-semibold text-white tracking-tight">Katalog 11 Unit Proyektor GSG (Unit 01 - 11)</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-2 leading-relaxed">
              Peminjaman proyektor terikat pada jadwal reservasi ruangan aktif berstatus PUBLISHED. Kelola alur peminjaman melalui Panel PJ Kelas atau Panel Petugas GSG.
            </p>
          </div>
        )}

        {activeTab === 'pj' && (
          currentUser && currentUser.role === 'PJ' ? (
            <PJDashboard currentUser={currentUser} />
          ) : (
            <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 text-center shadow-xl shadow-black/40">
              <p className="text-sm text-zinc-300">Silakan masuk sebagai Penanggung Jawab (PJ) Kelas untuk mengakses panel ini.</p>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="mt-4 px-5 py-2 bg-white text-zinc-950 hover:bg-zinc-200 rounded-full text-xs font-semibold transition-all shadow-md"
              >
                Login PJ Sekarang
              </button>
            </div>
          )
        )}

        {activeTab === 'petugas' && (
          currentUser && currentUser.role === 'PETUGAS' ? (
            <PetugasDashboard currentUser={currentUser} />
          ) : (
            <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 text-center shadow-xl shadow-black/40">
              <p className="text-sm text-zinc-300">Silakan masuk sebagai Petugas GSG untuk mengakses panel kendali inventaris.</p>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="mt-4 px-5 py-2 bg-white text-zinc-950 hover:bg-zinc-200 rounded-full text-xs font-semibold transition-all shadow-md"
              >
                Login Petugas GSG
              </button>
            </div>
          )
        )}
      </main>

      {/* Login Modal Once UI Glass Style */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-panel rounded-3xl max-w-sm w-full p-6 sm:p-7 border border-white/10 text-zinc-100 shadow-2xl shadow-black">
            <h3 className="text-lg font-semibold text-white tracking-tight">Login Sistem SIRAMA</h3>
            <p className="text-xs text-zinc-400 mt-1">Gunakan NIM (PJ Kelas) atau Username (Petugas GSG)</p>

            {loginError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">NIM / Username</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: F5212510018 atau petugas"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Password akun"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 focus:outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl shadow-sm transition"
                >
                  Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Damage Report Modal Once UI Glass Style */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-panel rounded-3xl max-w-md w-full p-6 sm:p-7 border border-white/10 text-zinc-100 shadow-2xl shadow-black">
            <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Lapor Kerusakan Fasilitas GSG
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Laporan publik langsung diteruskan ke Petugas GSG FT-UNTAD</p>

            {reportSuccess ? (
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>{reportSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Tipe Fasilitas</label>
                    <select
                      value={reportData.targetType}
                      onChange={(e) => setReportData({ ...reportData, targetType: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="ROOM">Ruangan GSG</option>
                      <option value="PROJECTOR">Unit Proyektor</option>
                      <option value="GENERAL_FACILITY">Fasilitas Umum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Kode Target</label>
                    <input
                      type="text"
                      required
                      placeholder="SG-7 / Unit 02"
                      value={reportData.targetCode}
                      onChange={(e) => setReportData({ ...reportData, targetCode: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Nama Pelapor (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Nama Anda atau Anonim"
                    value={reportData.reporterName}
                    onChange={(e) => setReportData({ ...reportData, reporterName: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Deskripsi Kerusakan</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Jelaskan kendala: misal lampu redup, kabel HDMI putus, AC tidak dingin..."
                    value={reportData.description}
                    onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-sm transition"
                  >
                    Kirim Laporan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
