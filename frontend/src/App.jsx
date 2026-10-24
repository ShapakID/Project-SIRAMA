import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GSGFloorPlan from './components/GSGFloorPlan';
import RoomTimetable from './components/RoomTimetable';
import ProjectorCatalog from './components/ProjectorCatalog';
import PJDashboard from './components/PJDashboard';
import PetugasDashboard from './components/PetugasDashboard';
import { Shield, Tv, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sirama_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('sirama_tab');
    if (savedTab) return savedTab;
    const savedUser = localStorage.getItem('sirama_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.role === 'PETUGAS') return 'petugas';
        if (u.role === 'PJ') return 'pj';
      } catch {}
    }
    return 'denah';
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Auto-verify session token on startup
  useEffect(() => {
    const token = localStorage.getItem('sirama_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Session expired');
        })
        .then((user) => {
          setCurrentUser(user);
          localStorage.setItem('sirama_user', JSON.stringify(user));
        })
        .catch(() => {
          // If token invalid, clear
          setCurrentUser(null);
          localStorage.removeItem('sirama_user');
          localStorage.removeItem('sirama_token');
        });
    }
  }, []);

  const switchTab = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('sirama_tab', tab);
  };

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
      if (data.token) localStorage.setItem('sirama_token', data.token);
      setLoginModalOpen(false);
      const targetTab = data.user.role === 'PJ' ? 'pj' : 'petugas';
      switchTab(targetTab);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sirama_user');
    localStorage.removeItem('sirama_token');
    localStorage.removeItem('sirama_tab');
    switchTab('denah');
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
      setReportSuccess('Laporan berhasil dikirim ke Petugas Fasilitas SG & JTI.');
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
        setActiveTab={switchTab}
        onOpenReportModal={() => setReportModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Content based on Active Tab */}
        {activeTab === 'denah' && (
          <GSGFloorPlan
            currentUser={currentUser}
            onSelectRoom={(roomCode) => {
              setSelectedRoom(roomCode);
              if (currentUser && currentUser.role === 'PJ') {
                switchTab('pj');
              } else if (currentUser && currentUser.role === 'PETUGAS') {
                switchTab('petugas');
              } else {
                setLoginModalOpen(true);
              }
            }}
            onNavigateToTimetable={() => switchTab('jadwal')}
          />
        )}

        {activeTab === 'jadwal' && (
          <RoomTimetable currentUser={currentUser} />
        )}

        {activeTab === 'proyektor' && (
          <ProjectorCatalog
            currentUser={currentUser}
            onOpenLogin={() => setLoginModalOpen(true)}
          />
        )}

        {activeTab === 'pj' && (
          currentUser && currentUser.role === 'PJ' ? (
            <PJDashboard
              currentUser={currentUser}
              initialRoom={selectedRoom}
              onNavigateToFloorPlan={() => switchTab('denah')}
            />
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
              <p className="text-sm text-zinc-300">Silakan masuk sebagai Petugas untuk mengakses panel kendali inventaris.</p>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="mt-4 px-5 py-2 bg-white text-zinc-950 hover:bg-zinc-200 rounded-full text-xs font-semibold transition-all shadow-md"
              >
                Login Petugas
              </button>
            </div>
          )
        )}
      </main>

      {/* Login Modal Once UI Glass Style */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="glass-modal rounded-3xl max-w-sm w-full p-6 sm:p-7 text-zinc-100">
            <h3 className="text-lg font-semibold text-white tracking-tight">Login Sistem SIRAMA</h3>
            <p className="text-xs text-zinc-400 mt-1">Gunakan NIM (PJ Kelas) atau Username (Petugas)</p>

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
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 rounded-full shadow-sm transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 sm:p-7 text-zinc-100">
            <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Lapor Kerusakan Fasilitas
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Laporan publik langsung diteruskan ke Petugas Fasilitas SG & JTI</p>

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
                      className="w-full px-3 py-2 glass-input rounded-xl text-xs focus:outline-none"
                    >
                      <option value="ROOM" className="bg-zinc-900 text-white">Ruangan (SG / JTI)</option>
                      <option value="PROJECTOR" className="bg-zinc-900 text-white">Unit Proyektor</option>
                      <option value="GENERAL_FACILITY" className="bg-zinc-900 text-white">Fasilitas Umum</option>
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
                      className="w-full px-3 py-2 glass-input rounded-xl text-xs focus:outline-none"
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
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs focus:outline-none"
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
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs focus:outline-none"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-sm transition"
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
