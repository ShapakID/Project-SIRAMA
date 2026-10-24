import React from 'react';
import { Building2, Shield, User, LogOut, AlertTriangle, Layers, Calendar, Tv, GraduationCap } from 'lucide-react';

export default function Navbar({ currentUser, onOpenLogin, onLogout, activeTab, setActiveTab, onOpenReportModal }) {
  return (
    <header className="sticky top-0 z-40 w-full px-2.5 sm:px-6 pt-2 sm:pt-3 pb-2 backdrop-blur-md bg-zinc-950/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto space-y-2">
        <div className="glass-panel rounded-2xl sm:rounded-full px-3 sm:px-5 h-13 sm:h-14 flex items-center justify-between shadow-2xl shadow-black/60 border border-white/10">
          {/* Brand Mark */}
          <div className="flex items-center space-x-2.5 cursor-pointer pl-0.5" onClick={() => setActiveTab('denah')}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white">SIRAMA</span>
                <span className="text-[9px] sm:text-[10px] font-mono tracking-wider bg-white/5 border border-white/10 text-cyan-300 px-1.5 sm:px-2 py-0.5 rounded-full uppercase">
                  GSG & JTI
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 hidden sm:block">Fasilitas & Jadwal Kuliah FT-UNTAD</p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <nav className="hidden md:flex items-center p-1 bg-zinc-950/50 rounded-full border border-white/5 space-x-1">
            <button
              onClick={() => setActiveTab('denah')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'denah'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Denah Lantai</span>
            </button>
            <button
              onClick={() => setActiveTab('jadwal')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'jadwal'
                  ? 'bg-white/15 text-white border border-white/15 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Jadwal & Detektor MK</span>
            </button>
            <button
              onClick={() => setActiveTab('proyektor')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'proyektor'
                  ? 'bg-white/15 text-white border border-white/15 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Proyektor</span>
            </button>
            {currentUser && currentUser.role === 'PJ' && (
              <button
                onClick={() => setActiveTab('pj')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === 'pj'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'text-amber-400/80 hover:text-amber-300 hover:bg-white/5'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Panel PJ Kelas</span>
              </button>
            )}
            {currentUser && currentUser.role === 'PETUGAS' && (
              <button
                onClick={() => setActiveTab('petugas')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === 'petugas'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-white/5'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Panel Petugas</span>
              </button>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1 text-[11px] sm:text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-rose-500/20 transition-all shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="hidden sm:inline">Lapor Kerusakan</span>
              <span className="sm:hidden">Lapor</span>
            </button>

            {currentUser ? (
              <div className="flex items-center space-x-1.5 sm:space-x-2 glass-pill px-2.5 sm:px-3 py-1 rounded-full border border-white/10 max-w-[150px] sm:max-w-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse shrink-0"></span>
                <span className="text-[11px] sm:text-xs font-medium text-zinc-200 truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className="text-zinc-500 font-mono text-[9px] sm:text-[10px] hidden sm:inline">({currentUser.role})</span>
                <button
                  onClick={onLogout}
                  title="Keluar"
                  className="text-zinc-400 hover:text-rose-400 p-0.5 rounded transition shrink-0 ml-0.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1 text-[11px] sm:text-xs bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-3 sm:px-3.5 py-1.5 rounded-full transition-all shadow-sm shrink-0"
              >
                <User className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar (visible on mobile only) */}
        <div className="md:hidden flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1 px-1 bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('denah')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'denah'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Denah</span>
          </button>
          <button
            onClick={() => setActiveTab('jadwal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'jadwal'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Jadwal & MK</span>
          </button>
          <button
            onClick={() => setActiveTab('proyektor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'proyektor'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 bg-white/5'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Proyektor</span>
          </button>
          {currentUser && currentUser.role === 'PJ' && (
            <button
              onClick={() => setActiveTab('pj')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'pj'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : 'text-amber-400/80 hover:text-amber-300 bg-white/5'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Panel PJ</span>
            </button>
          )}
          {currentUser && currentUser.role === 'PETUGAS' && (
            <button
              onClick={() => setActiveTab('petugas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'petugas'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : 'text-emerald-400/80 hover:text-emerald-300 bg-white/5'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Petugas</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
