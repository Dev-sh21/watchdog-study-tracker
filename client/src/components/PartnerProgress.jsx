import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatDurationHuman } from '../utils/timeFormat';
import * as api from '../services/api';
import {
  Users,
  Flame,
  Clock,
  CheckCircle2,
  Send,
  Sparkles,
  Target,
  RefreshCw,
  Coffee,
  Heart,
  Landmark,
  GraduationCap
} from 'lucide-react';

export default function PartnerProgress() {
  const { currentUser } = useApp();
  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [nudgeSent, setNudgeSent] = useState(false);

  const loadPartner = async () => {
    try {
      const res = await api.fetchPartnerProgress();
      setPartnerData(res.partner);
    } catch (e) {
      console.error('Failed to load partner progress:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartner();
    const interval = setInterval(loadPartner, 15000); // Poll partner status every 15s
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleSendNudge = async (msg) => {
    const textToSend = msg || nudgeMessage;
    if (!textToSend.trim()) return;

    try {
      await api.sendPartnerNudge(textToSend.trim());
      setNudgeMessage('');
      setNudgeSent(true);
      setTimeout(() => setNudgeSent(false), 3000);
      loadPartner();
    } catch (e) {
      console.error('Failed to send nudge:', e);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
        <p className="text-xs">Loading study partner's progress...</p>
      </div>
    );
  }

  if (!partnerData) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center text-slate-400">
        <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm font-semibold text-slate-300">No Study Partner Linked Yet</p>
        <p className="text-xs text-slate-500 mt-1">
          Ask your brother (Sarvesh) to sign in to start tracking each other's progress!
        </p>
      </div>
    );
  }

  const isUpsc = partnerData.selected_exam === 'UPSC';
  const isStudyingNow = partnerData.liveTimer?.is_running;
  const partnerGoalHours = partnerData.daily_goal_hours || 8.0;
  const progressPercent = Math.min(100, Math.round((partnerData.todayHours / partnerGoalHours) * 100));

  const quickCheers = [
    '🔥 Gazab speed hai Bhai!',
    '💪 Keep pushing Sarvesh!',
    '☕ Chai break le le!',
    '🎯 Target complete kar jaldi!'
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-sm space-y-6">
      
      {/* Partner Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${
              isUpsc
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25'
                : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25'
            }`}
          >
            {isUpsc ? <Landmark className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">{partnerData.name}'s Progress</h3>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {partnerData.exam_name}
              </span>
            </div>

            {/* Live Focus Status Indicator */}
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isStudyingNow ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                }`}
              />
              {isStudyingNow ? (
                <span className="text-emerald-400 font-semibold">
                  Studying Right Now: {partnerData.liveTimer.active_subject} ({formatDurationHuman(partnerData.liveTimer.elapsed_seconds)})
                </span>
              ) : (
                <span className="text-slate-400">Currently taking a break / idle</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={loadPartner}
          className="self-end sm:self-auto p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition cursor-pointer"
          title="Refresh Partner Progress"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Today's Hours */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-medium block">Today's Study</span>
          <div className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono-numbers">
            {partnerData.todayHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <span className="text-[10px] text-indigo-400 font-medium mt-0.5 block">
            Goal: {partnerGoalHours}h ({progressPercent}%)
          </span>
        </div>

        {/* Weekly Total */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-medium block">This Week</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5 font-mono-numbers">
            {partnerData.weeklyHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {formatDurationHuman(partnerData.weeklySeconds)}
          </span>
        </div>

        {/* Streak */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-medium block">Study Streak</span>
          <div className="text-xl sm:text-2xl font-black text-orange-400 mt-0.5 flex items-center gap-1">
            <Flame className="w-5 h-5 fill-orange-400" />
            <span>{partnerData.currentStreak}d</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Consistency streak</span>
        </div>

        {/* Completed Targets */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-medium block">Done Goals</span>
          <div className="text-xl sm:text-2xl font-black text-purple-400 mt-0.5 font-mono-numbers">
            {partnerData.recentCompleted.length} <span className="text-xs font-normal text-slate-400">tasks</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {partnerData.pendingCount} pending
          </span>
        </div>
      </div>

      {/* Progress Bar of Today's Goal */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>{partnerData.name}'s Daily Target Completion</span>
          <span className="font-bold text-white">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isUpsc
                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Split View: Recent Completed Targets & Active Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        
        {/* Completed Targets */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Recently Completed by {partnerData.name}:</span>
          </h4>

          {partnerData.recentCompleted.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No targets completed yet today.</p>
          ) : (
            <div className="space-y-2">
              {partnerData.recentCompleted.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between gap-2"
                >
                  <div className="truncate flex-1">
                    <span className="font-semibold text-slate-200 block truncate">{t.title}</span>
                    <span className="text-[10px] text-slate-400">{t.subject}</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex-shrink-0">
                    {formatDurationHuman(t.actual_seconds)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Active Tasks */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Target className="w-4 h-4" />
            <span>Upcoming Goals on {partnerData.name}'s Desk:</span>
          </h4>

          {partnerData.activeTargets.length === 0 ? (
            <p className="text-xs text-slate-500 italic">All caught up! No pending targets.</p>
          ) : (
            <div className="space-y-2">
              {partnerData.activeTargets.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between gap-2"
                >
                  <div className="truncate flex-1">
                    <span className="font-semibold text-slate-200 block truncate">{t.title}</span>
                    <span className="text-[10px] text-slate-400">{t.subject}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                    {t.status === 'in_progress' ? 'In Progress' : 'To Do'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Send Motivation Cheer / Nudge */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Send Motivation Cheer to {partnerData.name}:</span>
          </span>

          {nudgeSent && (
            <span className="text-xs font-semibold text-emerald-400 animate-pulse">
              ✓ Sent cheer to {partnerData.name}!
            </span>
          )}
        </div>

        {/* Quick Cheer Chips */}
        <div className="flex flex-wrap gap-2">
          {quickCheers.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendNudge(chip)}
              className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Custom Nudge Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendNudge(nudgeMessage);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder={`Say something encouraging to ${partnerData.name}...`}
            value={nudgeMessage}
            onChange={(e) => setNudgeMessage(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>

        {/* Nudge History Feed */}
        {partnerData.nudges && partnerData.nudges.length > 0 && (
          <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              Recent Cheers & Motivation Exchanged:
            </span>
            <div className="space-y-1">
              {partnerData.nudges.slice(0, 3).map((n) => (
                <div key={n.id} className="text-xs text-slate-300 flex items-center gap-1.5">
                  <span className="font-bold text-indigo-400">{n.from_name}:</span>
                  <span className="italic">"{n.message}"</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
