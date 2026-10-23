import React from 'react';
import { Building2, Shield, User, LogOut, AlertTriangle } from 'lucide-react';

export default function Navbar({ currentUser, onOpenLogin, onLogout, activeTab, setActiveTab, onOpenReportModal }) {
  return (
    <header className="sticky top-0 z-40 w-full px-3 sm:px-6 pt-3 pb-2 backdrop-blur-sm bg-zinc-950/40">
      <div className="max-w-7xl mx-auto">
        <div className="glass-panel rounded-full px-3 sm:px-5 h-14 flex items-center justify-between shadow-2xl shadow-black/60">
          {/* Brand Mark */}
          <div className="flex items-center space-x-3 cursor-pointer pl-1" onClick={() => setActiveTab('jadwal')}>
            <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-zinc-100">SIRAMA</span>
                <span className="text-[10px] font-mono tracking-wider bg-white/5 border border-white/10 text-cyan-300 px-2 py-0.5 rounded-full uppercase">
                  GSG FT-UNTAD
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">Fasilitas & Jadwal Anti-Bentrok</p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <nav className="hidden md:flex items-center p-1 bg-zinc-950/50 rounded-full border border-white/5 space-x-1">
            <button
              onClick={() => setActiveTab('jadwal')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                activeTab === 'jadwal'
                  ? 'bg-white/15 text-white border border-white/15 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              Jadwal Ruangan
            </button>
            <button
              onClick={() => setActiveTab('proyektor')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                activeTab === 'proyektor'
                  ? 'bg-white/15 text-white border border-white/15 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              Proyektor 01-11
            </button>
            {currentUser && currentUser.role === 'PJ' && (
              <button
                onClick={() => setActiveTab('pj')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeTab === 'pj'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'text-amber-400/80 hover:text-amber-300 hover:bg-white/5'
                }`}
              >
                Panel PJ Kelas
              </button>
            )}
            {currentUser && currentUser.role === 'PETUGAS' && (
              <button
                onClick={() => setActiveTab('petugas')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeTab === 'petugas'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-white/5'
                }`}
              >
                Panel Petugas
              </button>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 px-3 py-1.5 rounded-full hover:bg-rose-500/20 transition-all shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Lapor Kerusakan</span>
              <span className="sm:hidden">Lapor</span>
            </button>

            {currentUser ? (
              <div className="flex items-center space-x-2 glass-pill px-3 py-1 rounded-full border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
                <span className="text-xs font-medium text-zinc-200">
                  {currentUser.name.split(' ')[0]} <span className="text-zinc-500 font-mono text-[10px]">({currentUser.role})</span>
                </span>
                <button
                  onClick={onLogout}
                  title="Keluar"
                  className="text-zinc-400 hover:text-rose-400 p-0.5 rounded transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-3.5 py-1.5 rounded-full transition-all shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
