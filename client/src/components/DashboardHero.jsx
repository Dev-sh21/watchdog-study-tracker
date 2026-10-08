import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getDaysRemaining, formatDurationHuman } from '../utils/timeFormat';
import * as api from '../services/api';
import {
  Flame,
  Clock,
  Target,
  Users,
  GraduationCap,
  Landmark,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function DashboardHero() {
  const { currentUser, settings, analytics, activeTab, setActiveTab } = useApp();
  const [partnerStats, setPartnerStats] = useState(null);

  const isUpsc = currentUser?.selected_exam === 'UPSC';
  const partnerName = currentUser?.id === 1 ? 'Sarvesh' : 'Devesh';
  const daysInfo = getDaysRemaining(settings.exam_date);

  const todayHours = analytics?.todayHours || 0;
  const dailyGoal = settings.daily_goal_hours || (isUpsc ? 8.0 : 6.0);
  const goalPercent = Math.min(100, Math.round((todayHours / dailyGoal) * 100));

  useEffect(() => {
    api.fetchPartnerProgress()
      .then((res) => {
        if (res && res.partner) setPartnerStats(res.partner);
      })
      .catch(() => {});
  }, [currentUser]);

  return (
    <div className="space-y-4 mb-6">
      
      {/* Hero Welcome & Command Center Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-5 sm:p-7 shadow-2xl backdrop-blur-md">
        
        {/* Ambient Gradient Glows */}
        <div
          className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isUpsc ? 'bg-amber-500' : 'bg-indigo-500'
          }`}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left: Personalized Greeting & Exam Pill */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  isUpsc
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                }`}
              >
                {isUpsc ? <Landmark className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                <span>Target: {settings.exam_name}</span>
              </span>

              {/* Countdown Pill */}
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-amber-300 border border-slate-700/80 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {daysInfo.isPassed ? 'Exam Day!' : `${daysInfo.days} Days & ${daysInfo.hours}h Remaining`}
                </span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Namaste, {currentUser?.name?.split(' ')[0] || 'Aspirant'}! 🚀
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Consistency turns ordinary aspirants into top rankers. Track your daily hours, tick off your syllabus goals, and stay accountable with your brother!
            </p>
          </div>

          {/* Right: Duo Study Partner Status Card */}
          {partnerStats && (
            <div
              onClick={() => setActiveTab('partner')}
              className="bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-2xl transition cursor-pointer flex flex-col justify-between gap-2 max-w-sm w-full group shadow-lg"
              title={`Click to view full ${partnerName}'s progress`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block group-hover:text-indigo-300 transition-colors">
                      {partnerStats.name} ({partnerStats.selected_exam})
                    </span>
                    <span className="text-[10px] text-slate-400">Brother's Live Progress</span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              {/* Partner live stats */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">
                  Today: <strong className="text-white font-mono-numbers">{partnerStats.todayHours}h</strong>
                </span>

                <span className="text-slate-400">
                  This Week: <strong className="text-emerald-400 font-mono-numbers">{partnerStats.weeklyHours}h</strong>
                </span>

                {/* Partner live status indicator */}
                <span className="flex items-center gap-1 font-semibold text-[11px]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      partnerStats.liveTimer?.is_running ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                    }`}
                  />
                  <span className={partnerStats.liveTimer?.is_running ? 'text-emerald-400' : 'text-slate-500'}>
                    {partnerStats.liveTimer?.is_running ? 'Studying Now' : 'Offline'}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Today's Goal Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Today's Study Goal: {todayHours} hrs / {dailyGoal} hrs ({goalPercent}%)</span>
            </span>

            <span className="text-amber-400 flex items-center gap-1 font-mono-numbers">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{analytics?.currentStreak || 0} Day Streak</span>
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isUpsc
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
              }`}
              style={{ width: `${goalPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Action Pills Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('timer')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex-shrink-0 ${
            activeTab === 'timer'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900/70 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>⏱️ Focus Stopwatch</span>
        </button>

        <button
          onClick={() => setActiveTab('partner')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex-shrink-0 ${
            activeTab === 'partner'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900/70 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-purple-400" />
          <span>👥 {partnerName}'s Progress</span>
          {partnerStats?.liveTimer?.is_running && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('targets')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex-shrink-0 ${
            activeTab === 'targets'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900/70 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-rose-400" />
          <span>🎯 Target Goals</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex-shrink-0 ${
            activeTab === 'ai'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900/70 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>🤖 Gemini AI Mentor</span>
        </button>

        <a
          href="https://calendar.google.com/calendar/u/0/r"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900/70 border border-slate-800 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 transition cursor-pointer flex-shrink-0 ml-auto"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Google Calendar</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
        </a>
      </div>
    </div>
  );
}
