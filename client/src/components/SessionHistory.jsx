import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDurationHuman, formatTimeStopwatch } from '../utils/timeFormat';
import {
  History,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Flag,
  FileText
} from 'lucide-react';

export default function SessionHistory() {
  const { sessions, handleDeleteSession } = useApp();
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Study Sessions History</h3>
            <p className="text-xs text-slate-400">
              Total {sessions.length} logged sessions in SQLite database
            </p>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800/50">
            <History className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No study sessions logged yet.</p>
            <p className="text-slate-500 text-xs mt-1">
              Start the stopwatch timer, complete your study block, and hit "Save & Log"!
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const isExpanded = expandedId === session.id;
            const laps = session.laps || [];

            return (
              <div
                key={session.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 transition hover:border-slate-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Info */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white text-sm">
                        {session.subject}
                      </span>
                      {session.target_title && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          🎯 {session.target_title}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(session.created_at || session.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </span>

                      <span className="flex items-center gap-1 font-semibold text-emerald-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDurationHuman(session.duration_seconds)}</span>
                      </span>

                      {laps.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Flag className="w-3.5 h-3.5 text-purple-400" />
                          <span>{laps.length} laps</span>
                        </span>
                      )}
                    </div>

                    {session.notes && (
                      <p className="text-xs text-slate-300 italic pt-1 flex items-start gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                        <span>"{session.notes}"</span>
                      </p>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-2">
                    {laps.length > 0 && (
                      <button
                        onClick={() => toggleExpand(session.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Laps' : 'View Laps'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                      title="Delete this study session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Laps Table */}
                {isExpanded && laps.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Laps Recorded in this Session:
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono-numbers">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-800">
                            <th className="py-1 px-2">Lap #</th>
                            <th className="py-1 px-2">Split</th>
                            <th className="py-1 px-2">Total</th>
                            <th className="py-1 px-2">Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {laps.map((lap, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/20">
                              <td className="py-1.5 px-2 text-indigo-400">#{lap.lapNumber || idx + 1}</td>
                              <td className="py-1.5 px-2 text-emerald-400">+{formatTimeStopwatch(lap.lapTime)}</td>
                              <td className="py-1.5 px-2 text-slate-300">{formatTimeStopwatch(lap.total)}</td>
                              <td className="py-1.5 px-2 text-slate-400 font-sans">{lap.note || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
