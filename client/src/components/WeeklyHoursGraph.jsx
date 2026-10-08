import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDurationHuman } from '../utils/timeFormat';
import {
  BarChart3,
  Clock,
  TrendingUp,
  Flame,
  Award,
  RefreshCw
} from 'lucide-react';

export default function WeeklyHoursGraph() {
  const { analytics, settings, refreshAll } = useApp();

  if (!analytics) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
        <p className="text-xs">Loading weekly hours graph...</p>
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
    overallDailyAverageHours = 0,
    currentStreak = 0
  } = analytics;

  const maxBarHours = Math.max(8, ...weekData.map((d) => d.hours));
  const dailyGoal = settings.daily_goal_hours || 6;

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-sm space-y-6">
      
      {/* Header with Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Weekly Study Hours (Monday – Sunday)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Total {weeklyTotalHours} hours studied this week • Saved in SQLite Database
          </p>
        </div>

        <button
          onClick={refreshAll}
          className="self-end sm:self-auto p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition cursor-pointer"
          title="Refresh Graph"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Weekly Hours */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-semibold uppercase block">This Week</span>
          <div className="text-xl sm:text-2xl font-black text-indigo-300 mt-0.5 font-mono-numbers">
            {weeklyTotalHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {formatDurationHuman(weeklyTotalSeconds)}
          </span>
        </div>

        {/* Today's Focus */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-semibold uppercase block">Today's Focus</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5 font-mono-numbers">
            {todayHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {formatDurationHuman(todaySeconds)}
          </span>
        </div>

        {/* Daily Average */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-semibold uppercase block">Daily Average</span>
          <div className="text-xl sm:text-2xl font-black text-purple-400 mt-0.5 font-mono-numbers">
            {weeklyAverageActiveDaysHours} <span className="text-xs font-normal text-slate-400">hrs/day</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Overall: {overallDailyAverageHours}h/day
          </span>
        </div>

        {/* Streak */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-semibold uppercase block">Study Streak</span>
          <div className="text-xl sm:text-2xl font-black text-orange-400 mt-0.5 flex items-center gap-1 font-mono-numbers">
            <Flame className="w-5 h-5 fill-orange-400" />
            <span>{currentStreak} Days</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Consecutive days
          </span>
        </div>
      </div>

      {/* Interactive Weekly Bar Chart */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
          <span className="text-[11px] font-medium text-slate-400">
            Hover or tap any bar to view exact hours and session count:
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Studied Hours
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2.5 h-0.5 bg-amber-400" /> Goal Line ({dailyGoal}h)
            </span>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-4 pb-2 px-2 border-b border-slate-800/80">
          {weekData.map((dayItem, index) => {
            const heightPercent = Math.min(100, (dayItem.hours / maxBarHours) * 100);
            const metGoal = dayItem.hours >= dailyGoal;

            return (
              <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
                
                {/* Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1.5 bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded-lg py-1 px-2 pointer-events-none text-center shadow-lg whitespace-nowrap z-10">
                  <div className="font-bold text-white">{dayItem.hours} hrs</div>
                  <div className="text-[10px] text-slate-400">{dayItem.sessionCount} session(s)</div>
                </div>

                {/* Vertical Bar */}
                <div className="w-full max-w-[44px] bg-slate-800/80 rounded-t-xl h-full flex items-end p-1 relative">
                  
                  {/* Goal Marker Line */}
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-amber-400/40 pointer-events-none"
                    style={{ bottom: `${(dailyGoal / maxBarHours) * 100}%` }}
                  />

                  {/* Filled Value */}
                  <div
                    className={`w-full rounded-t-lg transition-all duration-700 ${
                      dayItem.isToday
                        ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-500/30'
                        : metGoal
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                        : dayItem.hours > 0
                        ? 'bg-gradient-to-t from-purple-700 to-indigo-500'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* Day Labels */}
                <div className="mt-2.5 text-center">
                  <span
                    className={`text-xs font-semibold block ${
                      dayItem.isToday
                        ? 'text-indigo-400 ring-1 ring-indigo-500/50 bg-indigo-500/10 px-1 py-0.5 rounded-md'
                        : 'text-slate-400'
                    }`}
                  >
                    {dayItem.day}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono-numbers block mt-0.5">
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
