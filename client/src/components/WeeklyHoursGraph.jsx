import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDurationHuman } from '../utils/timeFormat';
import {
  BarChart3,
  RefreshCw,
  Flame,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';

export default function WeeklyHoursGraph() {
  const { analytics, settings, refreshAll } = useApp();

  if (!analytics) {
    return (
      <div className="bg-white border border-yellow-200 rounded-3xl p-6 text-center text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
        <p className="text-xs font-semibold">Loading weekly hours...</p>
      </div>
    );
  }

  const {
    weekData = [],
    weeklyTotalSeconds = 0,
    weeklyTotalHours = 0,
    todaySeconds = 0,
    todayHours = 0,
    weeklyAverageActiveDaysHours = 0,
    currentStreak = 0
  } = analytics;

  const maxBarHours = Math.max(8, ...weekData.map((d) => d.hours));
  const dailyGoal = settings.daily_goal_hours || 6;

  return (
    <div className="bg-white border border-yellow-200/90 rounded-3xl p-6 sm:p-8 shadow-sm shadow-amber-500/5 space-y-6">
      
      {/* Header: Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-yellow-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Weekly Study Hours (Monday – Sunday)
            </h3>
            <p className="text-[11px] text-amber-800 font-medium">
              Total {weeklyTotalHours} hours studied this week • Saved in SQLite Database
            </p>
          </div>
        </div>

        <button
          onClick={refreshAll}
          className="self-end sm:self-auto p-2 rounded-2xl bg-yellow-50 hover:bg-yellow-100 text-amber-800 border border-yellow-200 transition cursor-pointer"
          title="Refresh Graph"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards Row (Curvy & Clean) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Weekly Hours */}
        <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-2xl">
          <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
            This Week
          </span>
          <div className="text-2xl font-black text-slate-900 mt-0.5 font-mono-numbers">
            {weeklyTotalHours} <span className="text-xs font-semibold text-slate-500">hrs</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {formatDurationHuman(weeklyTotalSeconds)}
          </span>
        </div>

        {/* Today's Focus */}
        <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-2xl">
          <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
            Today's Focus
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-0.5 font-mono-numbers">
            {todayHours} <span className="text-xs font-semibold text-slate-500">hrs</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {formatDurationHuman(todaySeconds)}
          </span>
        </div>

        {/* Daily Average */}
        <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-2xl">
          <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
            Daily Average
          </span>
          <div className="text-2xl font-black text-amber-600 mt-0.5 font-mono-numbers">
            {weeklyAverageActiveDaysHours} <span className="text-xs font-semibold text-slate-500">hrs/day</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Active days average
          </span>
        </div>

        {/* Study Streak */}
        <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-2xl">
          <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
            Study Streak
          </span>
          <div className="text-2xl font-black text-amber-500 mt-0.5 flex items-center gap-1 font-mono-numbers">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
            <span>{currentStreak} Days</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Consecutive study
          </span>
        </div>
      </div>

      {/* Interactive Curvy Bar Chart */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
          <span className="text-[11px] font-semibold text-slate-600">
            Daily Study Progress:
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Studied Hours
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              <span className="w-2.5 h-0.5 bg-amber-600" /> Goal ({dailyGoal}h)
            </span>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-4 pb-2 px-2 border-b border-yellow-200 bg-yellow-50/20 rounded-2xl">
          {weekData.map((dayItem, index) => {
            const heightPercent = Math.min(100, (dayItem.hours / maxBarHours) * 100);
            const metGoal = dayItem.hours >= dailyGoal;

            return (
              <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
                
                {/* Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-xl py-1 px-2.5 pointer-events-none text-center shadow-lg whitespace-nowrap z-10">
                  <div>{dayItem.hours} hrs</div>
                  <div className="text-[10px] text-amber-300 font-normal">{dayItem.sessionCount} session(s)</div>
                </div>

                {/* Vertical Bar Column */}
                <div className="w-full max-w-[42px] bg-yellow-100/60 rounded-t-2xl h-full flex items-end p-1 relative">
                  
                  {/* Goal Marker Line */}
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-amber-600/50 pointer-events-none"
                    style={{ bottom: `${(dailyGoal / maxBarHours) * 100}%` }}
                  />

                  {/* Filled Value Bar */}
                  <div
                    className={`w-full rounded-t-xl transition-all duration-700 ${
                      dayItem.isToday
                        ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-md shadow-amber-400/30'
                        : metGoal
                        ? 'bg-gradient-to-t from-emerald-500 to-emerald-400'
                        : dayItem.hours > 0
                        ? 'bg-gradient-to-t from-amber-400 to-yellow-300'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* Day Labels */}
                <div className="mt-2 text-center">
                  <span
                    className={`text-xs font-bold block ${
                      dayItem.isToday
                        ? 'text-amber-900 bg-amber-300/80 px-1.5 py-0.5 rounded-lg'
                        : 'text-slate-600'
                    }`}
                  >
                    {dayItem.day}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono-numbers font-semibold block mt-0.5">
                    {dayItem.hours}h
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
