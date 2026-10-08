import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDurationHuman } from '../utils/timeFormat';
import {
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  Flame,
  Award,
  BookOpen,
  PieChart,
  RefreshCw
} from 'lucide-react';

export default function WeeklyAnalytics() {
  const { analytics, settings, refreshAll } = useApp();

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
        <p>Loading weekly study analytics...</p>
      </div>
    );
  }

  const {
    weekData = [],
    weeklyTotalSeconds = 0,
    weeklyTotalHours = 0,
    todaySeconds = 0,
    todayHours = 0,
    weeklyAverage7DaysHours = 0,
    weeklyAverageActiveDaysHours = 0,
    overallDailyAverageHours = 0,
    currentStreak = 0,
    totalSessions = 0,
    subjectBreakdown = []
  } = analytics;

  // Find max hours for chart scale (minimum 8 for nice headroom)
  const maxBarHours = Math.max(8, ...weekData.map((d) => d.hours));
  const weeklyGoalHours = (settings.daily_goal_hours || 6) * 7;
  const weeklyProgressPercent = Math.min(100, Math.round((weeklyTotalHours / weeklyGoalHours) * 100));

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Weekly Goal Progress */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Weekly GATE Prep Overview
            </span>
            <h2 className="text-2xl font-bold text-white mt-0.5">
              {formatDurationHuman(weeklyTotalSeconds)} studied this week
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Target: {weeklyGoalHours} hrs/week ({settings.daily_goal_hours} hrs/day goal)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshAll}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-indigo-300">{weeklyProgressPercent}%</span>
              <span className="text-xs text-slate-400 block">Goal Completed</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${weeklyProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Today's Focus */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Today's Focus</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {todayHours} <span className="text-sm font-normal text-slate-400">hrs</span>
            </div>
            <span className="text-xs text-emerald-400 font-medium">
              {formatDurationHuman(todaySeconds)}
            </span>
          </div>
        </div>

        {/* Metric 2: Weekly Daily Average */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Weekly Daily Avg</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-300">
              {weeklyAverageActiveDaysHours} <span className="text-sm font-normal text-slate-400">hrs/day</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              ({weeklyAverage7DaysHours} hrs across 7 days)
            </span>
          </div>
        </div>

        {/* Metric 3: Overall All-Time Average */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Overall Average</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-300">
              {overallDailyAverageHours} <span className="text-sm font-normal text-slate-400">hrs/day</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Total Sessions: {totalSessions}
            </span>
          </div>
        </div>

        {/* Metric 4: Consecutive Study Streak */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Study Streak</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-orange-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-orange-400">
              {currentStreak} <span className="text-sm font-normal text-slate-400">Days</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {currentStreak >= 3 ? '🔥 Unstoppable consistency!' : 'Keep building momentum!'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Weekly Bar Chart */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>Weekly Daily Hours Breakdown (Mon – Sun)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Visualizes how much time you dedicated each day this week
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-500"></span> Studied Hours
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-dashed bg-amber-400"></span> Daily Goal ({settings.daily_goal_hours}h)
            </span>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-800">
          {weekData.map((dayItem, index) => {
            const heightPercent = Math.min(100, (dayItem.hours / maxBarHours) * 100);
            const metGoal = dayItem.hours >= settings.daily_goal_hours;

            return (
              <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
                
                {/* Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-2 bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded-lg py-1 px-2 pointer-events-none text-center shadow-lg whitespace-nowrap z-10">
                  <div className="font-bold text-white">{dayItem.hours} hrs</div>
                  <div className="text-[10px] text-slate-400">{dayItem.sessionCount} session(s)</div>
                </div>

                {/* Vertical Bar */}
                <div className="w-full max-w-[48px] bg-slate-800/80 rounded-t-xl h-full flex items-end p-1 relative">
                  
                  {/* Goal Marker Line */}
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-amber-400/40 pointer-events-none"
                    style={{ bottom: `${(settings.daily_goal_hours / maxBarHours) * 100}%` }}
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
                <div className="mt-3 text-center">
                  <span
                    className={`text-xs font-semibold block ${
                      dayItem.isToday
                        ? 'text-indigo-400 ring-1 ring-indigo-500/50 bg-indigo-500/10 px-1.5 py-0.5 rounded-md'
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

      {/* Subject Wise Distribution Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-sm">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <span>Subject-Wise Study Time Distribution</span>
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          See which GATE subjects are getting the most focus
        </p>

        {subjectBreakdown.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No study sessions logged yet. Start the stopwatch above to see your subject breakdown!
          </p>
        ) : (
          <div className="space-y-3.5">
            {subjectBreakdown.map((item, idx) => {
              const percent = weeklyTotalSeconds > 0
                ? Math.round((item.seconds / weeklyTotalSeconds) * 100)
                : 0;

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-semibold text-slate-200">{item.subject}</span>
                    <span className="font-mono-numbers text-slate-400">
                      <strong className="text-white">{item.hours} hrs</strong> ({percent}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
