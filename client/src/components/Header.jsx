import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getDaysRemaining } from '../utils/timeFormat';
import {
  Timer,
  Sun,
  Moon,
  Users,
  GraduationCap,
  Landmark,
  ChevronDown,
  Database,
  Check
} from 'lucide-react';

export default function Header() {
  const {
    currentUser,
    availableUsers,
    switchProfile,
    switchExam,
    theme,
    toggleTheme,
    settings,
    isConnected
  } = useApp();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showExamDropdown, setShowExamDropdown] = useState(false);

  const daysInfo = getDaysRemaining(settings.exam_date);
  const isUpsc = currentUser?.selected_exam === 'UPSC';

  const handleSelectExam = async (examType) => {
    setShowExamDropdown(false);
    await switchExam(examType);
  };

  const handleSelectUser = async (userId) => {
    setShowUserDropdown(false);
    await switchProfile(userId);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand & Exam Tag */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                  isUpsc
                    ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 shadow-amber-500/25'
                    : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-indigo-500/25'
                }`}
              >
                {isUpsc ? (
                  <Landmark className="w-5 h-5 text-white animate-pulse" />
                ) : (
                  <Timer className="w-5 h-5 text-white animate-pulse" />
                )}
              </div>

              <div>
                <span className="text-base sm:text-lg font-black tracking-tight text-white block leading-tight">
                  WatchDog ⏱️
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {currentUser?.selected_exam === 'UPSC' ? 'UPSC Civil Services' : 'GATE Preparation'}
                </span>
              </div>
            </div>

            {/* Quick Exam Mode Toggle (GATE <-> UPSC) */}
            <div className="relative">
              <button
                onClick={() => setShowExamDropdown(!showExamDropdown)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  isUpsc
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                    : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25'
                }`}
                title="Switch Target Exam (GATE or UPSC)"
              >
                {isUpsc ? <Landmark className="w-3.5 h-3.5 text-amber-400" /> : <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{currentUser?.selected_exam || 'GATE'}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {showExamDropdown && (
                <div className="absolute top-full left-0 mt-1.5 w-48 bg-slate-900 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl z-50 space-y-1">
                  <button
                    onClick={() => handleSelectExam('GATE')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition cursor-pointer ${
                      !isUpsc ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-300" />
                      <span>GATE CSE / DA</span>
                    </div>
                    {!isUpsc && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleSelectExam('UPSC')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition cursor-pointer ${
                      isUpsc ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-amber-300" />
                      <span>UPSC CSE</span>
                    </div>
                    {isUpsc && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Countdown Badge */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-slate-400">Exam:</span>
              <span className="font-semibold text-amber-300">
                {daysInfo.isPassed ? 'Exam Day!' : `${daysInfo.days}d Left`}
              </span>
            </div>
          </div>

          {/* Right: User Switcher, SQLite DB Badge & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Live Database Sync Status */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300"
              title="All sessions and goals persist to SQLite database"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium text-slate-300">SQLite Synced</span>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </div>

            {/* Quick Aspirant Switcher (Devesh <-> Sarvesh) */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer shadow-sm"
                title="Switch Aspirant Account (Devesh / Sarvesh)"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                  {currentUser?.name?.[0] || 'U'}
                </div>
                <span className="max-w-[100px] sm:max-w-[140px] truncate font-medium">
                  {currentUser?.name || 'Devesh Mishra'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute top-full right-0 mt-1.5 w-56 bg-slate-900 border border-slate-700/80 rounded-2xl p-2 shadow-2xl z-50 space-y-1">
                  <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Select Aspirant
                  </div>

                  {availableUsers.map((u) => {
                    const isSelected = currentUser?.id === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUser(u.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-200 font-bold flex-shrink-0">
                            {u.name?.[0] || 'U'}
                          </div>
                          <div className="truncate">
                            <div className="truncate">{u.name}</div>
                            <div className="text-[10px] opacity-75">{u.selected_exam} Prep</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400 hover:-rotate-12 transition-transform" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
