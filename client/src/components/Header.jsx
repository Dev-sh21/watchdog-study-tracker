import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getDaysRemaining } from '../utils/timeFormat';
import {
  Timer,
  CheckSquare,
  BarChart3,
  FileText,
  History,
  Smartphone,
  Settings,
  Wifi,
  WifiOff,
  Flame,
  Sun,
  Moon,
  Users,
  GraduationCap,
  Landmark,
  ChevronDown,
  Calendar,
  LogOut,
  Bot
} from 'lucide-react';

export default function Header() {
  const {
    activeTab,
    setActiveTab,
    isConnected,
    setIsPhoneModalOpen,
    setIsSettingsModalOpen,
    setIsAuthModalOpen,
    currentUser,
    switchExam,
    logout,
    theme,
    toggleTheme,
    settings,
    analytics
  } = useApp();

  const [showExamDropdown, setShowExamDropdown] = useState(false);
  const daysInfo = getDaysRemaining(settings.exam_date);

  const partnerName = currentUser?.id === 1 ? 'Sarvesh' : 'Devesh';

  const tabs = [
    { id: 'timer', label: 'Stopwatch & Focus', icon: Timer },
    { id: 'partner', label: `${partnerName}'s Progress 👥`, icon: Users },
    { id: 'targets', label: 'Targets & Goals', icon: CheckSquare },
    { id: 'analytics', label: 'Weekly Stats', icon: BarChart3 },
    { id: 'ai', label: 'Gemini AI', icon: Bot },
    { id: 'notepad', label: 'Notes', icon: FileText },
    { id: 'history', label: 'History', icon: History }
  ];

  const handleSelectExam = async (examType) => {
    setShowExamDropdown(false);
    await switchExam(examType);
  };

  const isUpsc = currentUser?.selected_exam === 'UPSC';

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo & Exam Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
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
                <span className="text-base sm:text-lg font-bold tracking-tight text-white block leading-tight">
                  {isUpsc ? 'UPSC WatchDog' : 'GATE WatchDog'}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block">
                  Prep Command Center
                </span>
              </div>
            </div>

            {/* Exam Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExamDropdown(!showExamDropdown)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  isUpsc
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                    : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25'
                }`}
                title="Switch Exam Mode (GATE or UPSC)"
              >
                {isUpsc ? <Landmark className="w-3.5 h-3.5 text-amber-400" /> : <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{currentUser?.selected_exam || 'GATE'}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {showExamDropdown && (
                <div className="absolute top-full left-0 mt-1.5 w-48 bg-slate-900 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl z-50 space-y-1">
                  <button
                    onClick={() => handleSelectExam('GATE')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition cursor-pointer ${
                      !isUpsc ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div>GATE CSE / DA</div>
                      <div className="text-[10px] opacity-75 font-normal">Engineering & Tech</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectExam('UPSC')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition cursor-pointer ${
                      isUpsc ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Landmark className="w-4 h-4 text-amber-400" />
                    <div>
                      <div>UPSC CSE</div>
                      <div className="text-[10px] opacity-75 font-normal">Civil Services</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Countdown Badge */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-slate-400">Exam Countdown:</span>
              <span className="font-semibold text-amber-300">
                {daysInfo.isPassed ? 'Exam Day!' : `${daysInfo.days}d ${daysInfo.hours}h Left`}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? isUpsc
                        ? 'bg-amber-600/90 text-white shadow-md shadow-amber-600/20'
                        : 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions: User Profile Switcher, Theme, Phone Sync, Settings */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* User Profile Pill */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
              title="Switch Aspirant Account (Devesh / Bhai)"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                {currentUser?.name?.[0] || 'U'}
              </div>
              <span className="max-w-[85px] sm:max-w-[120px] truncate">{currentUser?.name || 'Account'}</span>
              <Users className="w-3.5 h-3.5 text-slate-400" />
            </button>

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

            {/* Phone Sync Button */}
            <button
              onClick={() => setIsPhoneModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs sm:text-sm font-medium shadow-md transition-all cursor-pointer ${
                isUpsc
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/20'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-indigo-600/20'
              }`}
              title="Open QR code to sync with your phone"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Phone Sync</span>
            </button>

            {/* Direct Google Calendar Shortcut */}
            <a
              href="https://calendar.google.com/calendar/u/0/r"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-indigo-400 hover:text-indigo-300 transition cursor-pointer hidden sm:flex items-center gap-1"
              title="Open My Google Calendar"
            >
              <Calendar className="w-4 h-4" />
            </a>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              title="Settings & Exam Customization"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Log Out Button */}
            <button
              onClick={logout}
              className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition cursor-pointer"
              title="Sign Out (Go to Sign-In Page)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
