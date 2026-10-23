import React from 'react';
import { Building2, Shield, User, LogOut, AlertTriangle } from 'lucide-react';

export default function Navbar({ currentUser, onOpenLogin, onLogout, activeTab, setActiveTab, onOpenReportModal }) {
  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('jadwal')}>
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight flex items-center gap-2">
              SIRAMA <span className="text-xs bg-blue-700/60 text-blue-200 px-2 py-0.5 rounded uppercase font-semibold">GSG FT-UNTAD</span>
            </h1>
            <p className="text-xs text-slate-400">Sistem Reservasi Ruangan & Proyektor</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('jadwal')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              activeTab === 'jadwal' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Jadwal Ruangan
          </button>
          <button
            onClick={() => setActiveTab('proyektor')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              activeTab === 'proyektor' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Unit Proyektor (01-11)
          </button>
          {currentUser && currentUser.role === 'PJ' && (
            <button
              onClick={() => setActiveTab('pj')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === 'pj' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:bg-slate-800'
              }`}
            >
              Panel PJ Kelas
            </button>
          )}
          {currentUser && currentUser.role === 'PETUGAS' && (
            <button
              onClick={() => setActiveTab('petugas')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === 'petugas' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:bg-slate-800'
              }`}
            >
              Panel Petugas
            </button>
          )}
        </nav>

        {/* Right Action buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 text-xs bg-rose-600/20 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-md hover:bg-rose-600/30 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Lapor Kerusakan</span>
          </button>

          {currentUser ? (
            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              <span className="text-xs font-medium text-slate-200">
                {currentUser.name.split(' ')[0]} ({currentUser.role})
              </span>
              <button
                onClick={onLogout}
                title="Keluar"
                className="text-slate-400 hover:text-white p-1 rounded transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-md font-medium transition shadow-sm"
            >
              <User className="w-3.5 h-3.5" />
              <span>Login PJ / Petugas</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
