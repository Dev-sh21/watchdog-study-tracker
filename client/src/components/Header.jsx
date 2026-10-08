import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getDaysRemaining } from '../utils/timeFormat';
import {
  Timer,
  ChevronDown,
  Check,
  Calendar,
  Sparkles,
  GraduationCap,
  Landmark,
  User
} from 'lucide-react';
import { isGoogleCalendarConnected } from '../services/googleCalendar';

export default function Header() {
  const {
    currentUser,
    availableUsers,
    switchProfile,
    switchExam,
    settings
  } = useApp();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showExamDropdown, setShowExamDropdown] = useState(false);

  const daysInfo = getDaysRemaining(settings.exam_date);
  const isUpsc = currentUser?.selected_exam === 'UPSC';
  const hasGoogleCal = isGoogleCalendarConnected();

  const handleSelectExam = async (examType) => {
    setShowExamDropdown(false);
    await switchExam(examType);
  };

  const handleSelectUser = async (userId) => {
    setShowUserDropdown(false);
    await switchProfile(userId);
  };

  return (
    <header className="border-b border-yellow-200/90 bg-white/90 backdrop-blur-md sticky top-0 z-30 transition-colors shadow-sm shadow-yellow-500/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Curvy Brand Logo & Exam Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-md shadow-amber-400/25 transform hover:scale-105 transition-all">
                {isUpsc ? (
                  <Landmark className="w-5 h-5 text-slate-900" />
                ) : (
                  <Timer className="w-5 h-5 text-slate-900" />
                )}
              </div>

              <div>
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 block leading-tight">
                  WatchDog ⏱️
                </span>
                <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                  <span>{isUpsc ? 'UPSC Civil Services' : 'GATE Prep'}</span>
                </span>
              </div>
            </div>

            {/* Quick Exam Switcher (Curvy Pill) */}
            <div className="relative">
              <button
                onClick={() => setShowExamDropdown(!showExamDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/80 transition cursor-pointer"
                title="Switch Target Exam"
              >
                {isUpsc ? <Landmark className="w-3.5 h-3.5 text-amber-800" /> : <GraduationCap className="w-3.5 h-3.5 text-amber-800" />}
                <span>{currentUser?.selected_exam || 'GATE'}</span>
                <ChevronDown className="w-3 h-3 text-amber-800 opacity-70" />
              </button>

              {showExamDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-yellow-200 rounded-3xl p-1.5 shadow-xl z-50 space-y-1">
                  <button
                    onClick={() => handleSelectExam('GATE')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold text-left transition cursor-pointer ${
                      !isUpsc ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-slate-700 hover:bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>GATE CSE / DA</span>
                    </div>
                    {!isUpsc && <Check className="w-3.5 h-3.5 text-slate-900" />}
                  </button>

                  <button
                    onClick={() => handleSelectExam('UPSC')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold text-left transition cursor-pointer ${
                      isUpsc ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-slate-700 hover:bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4" />
                      <span>UPSC CSE</span>
                    </div>
                    {isUpsc && <Check className="w-3.5 h-3.5 text-slate-900" />}
                  </button>
                </div>
              )}
            </div>

            {/* Countdown Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-slate-600 font-medium">Days Left:</span>
              <span className="font-bold text-amber-800">
                {daysInfo.isPassed ? 'Exam Day!' : `${daysInfo.days} Days`}
              </span>
            </div>
          </div>

          {/* Right: Gemini AI Badge, Google Calendar Status & User Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Gemini & Google Calendar Integration Status */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Gemini AI</span>
              <span className="text-slate-300">•</span>
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>G-Calendar Sync</span>
            </div>

            {/* User Switcher Pill (Devesh / Sarvesh) */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-bold transition cursor-pointer shadow-sm shadow-amber-400/20"
                title="Switch Aspirant Profile"
              >
                <div className="w-5 h-5 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center text-[10px] font-black">
                  {currentUser?.name?.[0] || 'D'}
                </div>
                <span className="max-w-[100px] sm:max-w-[140px] truncate font-bold">
                  {currentUser?.name || 'Devesh Mishra'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-900 opacity-80" />
              </button>

              {showUserDropdown && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-yellow-200 rounded-3xl p-2 shadow-2xl z-50 space-y-1">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Switch Aspirant
                  </div>

                  {availableUsers.map((u) => {
                    const isSelected = currentUser?.id === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUser(u.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-medium text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-slate-900 font-bold'
                            : 'text-slate-700 hover:bg-yellow-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-yellow-100 text-amber-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {u.name?.[0] || 'U'}
                          </div>
                          <div className="truncate">
                            <div className="truncate font-semibold">{u.name}</div>
                            <div className="text-[10px] text-slate-500">{u.selected_exam} Prep</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 flex-shrink-0 text-slate-900" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}
