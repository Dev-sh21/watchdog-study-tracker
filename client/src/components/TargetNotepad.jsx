import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDurationHuman } from '../utils/timeFormat';
import {
  CheckSquare,
  Square,
  Plus,
  Play,
  Trash2,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ListTodo,
  TrendingUp
} from 'lucide-react';

export default function TargetNotepad() {
  const {
    targets,
    settings,
    timer,
    handleCreateTarget,
    handleToggleTarget,
    handleDeleteTarget,
    handleStartTargetFocus
  } = useApp();

  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState(settings.subjects?.[0] || 'Engineering Mathematics');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await handleCreateTarget(newTitle.trim(), newSubject);
    setNewTitle('');
  };

  const activeTargets = targets.filter((t) => t.status !== 'completed');
  const completedTargets = targets.filter((t) => t.status === 'completed');

  const filteredTargets =
    filter === 'active'
      ? activeTargets
      : filter === 'completed'
      ? completedTargets
      : targets;

  const totalActualSeconds = targets.reduce((acc, t) => acc + (t.actual_seconds || 0), 0);
  const completionRate = targets.length > 0 ? Math.round((completedTargets.length / targets.length) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Target Progress & Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Goals</span>
            <div className="text-2xl font-bold text-white mt-0.5">{targets.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <ListTodo className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Completed Goals</span>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">
              {completedTargets.length} <span className="text-xs text-slate-400 font-normal">({completionRate}%)</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Goal Time</span>
            <div className="text-2xl font-bold text-purple-400 mt-0.5">
              {formatDurationHuman(totalActualSeconds)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Target Creator Form */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Add New Target / Goal for GATE</span>
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="e.g. Solve 30 PYQs from Algorithms Graphs or OS Paging..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <select
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer sm:w-56"
          >
            {settings.subjects?.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Target</span>
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: `All (${targets.length})` },
            { id: 'active', label: `Pending (${activeTargets.length})` },
            { id: 'completed', label: `Completed (${completedTargets.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filter === tab.id
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline">
          Tip: Click the checkbox to mark done & see total time taken!
        </span>
      </div>

      {/* Targets List */}
      <div className="space-y-3">
        {filteredTargets.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800/50">
            <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No targets in this category.</p>
            <p className="text-slate-500 text-xs mt-1">Add a new goal above to stay on track for GATE!</p>
          </div>
        ) : (
          filteredTargets.map((target) => {
            const isCompleted = target.status === 'completed';
            const isCurrentlyTracking = timer.active_target_id === target.id;
            const currentAccumulated =
              (target.actual_seconds || 0) +
              (isCurrentlyTracking && timer.is_running ? timer.elapsed_seconds : 0);

            return (
              <div
                key={target.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-slate-900/40 border-slate-800/80 opacity-80'
                    : isCurrentlyTracking
                    ? 'bg-indigo-950/20 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Left: Checkbox & Title */}
                <div className="flex items-start gap-3.5 flex-1">
                  {/* Interactive Tick Checkbox */}
                  <button
                    onClick={() => handleToggleTarget(target.id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-400 transition cursor-pointer flex-shrink-0"
                    title={isCompleted ? 'Mark as Incomplete' : 'Tick Complete & View Time Spent!'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-500/20" />
                    ) : (
                      <Square className="w-6 h-6 text-slate-500 hover:text-emerald-400" />
                    )}
                  </button>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`text-sm font-semibold leading-snug break-words ${
                          isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
                        }`}
                      >
                        {target.title}
                      </p>

                      {isCurrentlyTracking && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse">
                          Active in Timer
                        </span>
                      )}
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                        {target.subject}
                      </span>

                      {/* Display exact time taken! */}
                      {currentAccumulated > 0 && (
                        <span
                          className={`flex items-center gap-1 font-semibold ${
                            isCompleted ? 'text-emerald-400' : 'text-indigo-300'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {isCompleted ? 'Finished in: ' : 'Time spent: '}
                            <strong>{formatDurationHuman(currentAccumulated)}</strong>
                          </span>
                        </span>
                      )}

                      {/* Completed date if available */}
                      {isCompleted && target.completed_at && (
                        <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Completed on {new Date(target.completed_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-2 self-end sm:self-center">
                  {!isCompleted && (
                    <button
                      onClick={() => handleStartTargetFocus(target)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isCurrentlyTracking
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                      title="Link this goal to stopwatch and start studying"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isCurrentlyTracking ? 'Focusing...' : 'Focus'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteTarget(target.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                    title="Delete target"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
