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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar
        currentUser={currentUser}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setReportModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner Informasional */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-6 text-white shadow-md">
          <div className="max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Sistem Informasi Reservasi & Manajemen Ruangan (SIRAMA)
            </h2>
            <p className="mt-2 text-sm text-blue-100 leading-relaxed">
              Gedung Serbaguna (GSG) Fakultas Teknik Universitas Tadulako. Peminjaman ruangan praktikum anti-bentrok langsung berstatus sah tanpa kunci fisik, terintegrasi jadwal perkuliahan SIGA.
            </p>
          </div>
        </div>

        {/* Content based on Active Tab */}
        {activeTab === 'jadwal' && (
          <RoomTimetable />
        )}

        {activeTab === 'proyektor' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center py-12">
            <Tv className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Daftar Unit Proyektor GSG (Unit 01 - 11)</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Peminjaman unit proyektor wajib memiliki nomor reservasi ruangan aktif. Kelola peminjaman melalui Panel PJ Kelas atau Panel Petugas.
            </p>
          </div>
        )}

        {activeTab === 'pj' && (
          currentUser && currentUser.role === 'PJ' ? (
            <PJDashboard currentUser={currentUser} />
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center py-12">
              <p className="text-sm text-slate-600">Silakan login sebagai Penanggung Jawab (PJ) Kelas untuk mengakses panel ini.</p>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-semibold"
              >
                Login Sekarang
              </button>
            </div>
          )
        )}

        {activeTab === 'petugas' && (
          currentUser && currentUser.role === 'PETUGAS' ? (
            <PetugasDashboard currentUser={currentUser} />
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center py-12">
              <p className="text-sm text-slate-600">Silakan login sebagai Petugas GSG untuk mengakses panel kendali ini.</p>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-semibold"
              >
                Login Petugas
              </button>
            </div>
          )
        )}
      </main>

      {/* Login Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Login Sistem SIRAMA</h3>
            <p className="text-xs text-slate-500 mt-0.5">Gunakan NIM (PJ Kelas) atau Username (Petugas GSG)</p>

            {loginError && (
              <div className="mt-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">NIM / Username</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: F5212510018 atau petugas"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Password akun"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-sm transition"
                >
                  Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Damage Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Lapor Kerusakan Fasilitas GSG
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Laporan publik langsung diteruskan ke Petugas GSG FT-UNTAD</p>

            {reportSuccess ? (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>{reportSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Tipe Fasilitas</label>
                    <select
                      value={reportData.targetType}
                      onChange={(e) => setReportData({ ...reportData, targetType: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none"
                    >
                      <option value="ROOM">Ruangan GSG</option>
                      <option value="PROJECTOR">Unit Proyektor</option>
                      <option value="GENERAL_FACILITY">Fasilitas Umum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Kode Target</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: SG-7 atau Unit 02"
                      value={reportData.targetCode}
                      onChange={(e) => setReportData({ ...reportData, targetCode: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Nama Pelapor (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Nama Anda atau Anonim"
                    value={reportData.reporterName}
                    onChange={(e) => setReportData({ ...reportData, reporterName: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Deskripsi Kerusakan</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Jelaskan kendala: misal lampu redup, kabel HDMI putus, AC tidak dingin..."
                    value={reportData.description}
                    onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-md shadow-sm transition"
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
