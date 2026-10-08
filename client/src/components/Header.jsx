import React from 'react';
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
  Flame
} from 'lucide-react';

export default function Header() {
  const {
    activeTab,
    setActiveTab,
    isConnected,
    setIsPhoneModalOpen,
    setIsSettingsModalOpen,
    settings,
    analytics
  } = useApp();

  const daysInfo = getDaysRemaining(settings.exam_date);

  const tabs = [
    { id: 'timer', label: 'Stopwatch & Clock', icon: Timer },
    { id: 'targets', label: 'Targets & Goals', icon: CheckSquare },
    { id: 'analytics', label: 'Weekly Analytics', icon: BarChart3 },
    { id: 'notepad', label: 'Quick Notes', icon: FileText },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Exam Countdown */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Timer className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  GATE WatchDog
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {settings.exam_name}
                </span>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span className="text-slate-400">Exam Countdown:</span>
              <span className="font-semibold text-amber-300">
                {daysInfo.isPassed ? 'Exam Day!' : `${daysInfo.days} Days ${daysInfo.hours}h Left`}
              </span>
            </div>

            {/* Streak Badge */}
            {analytics?.currentStreak > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-xs text-orange-400 font-medium">
                <Flame className="w-3.5 h-3.5 fill-orange-400" />
                <span>{analytics.currentStreak} Day Streak</span>
              </div>
            )}
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Phone Sync, Live Status & Settings */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Sync Status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
              title={isConnected ? 'Real-time WebSocket Sync Active' : 'Connecting to server...'}
            >
              {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isConnected ? 'Live Synced' : 'Offline'}</span>
            </div>

            {/* Phone Sync Button */}
            <button
              onClick={() => setIsPhoneModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              title="Open QR code to sync with your phone"
            >
              <Smartphone className="w-4 h-4" />
              <span>Phone Sync</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              title="Settings & Exam Date"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
