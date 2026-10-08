import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatTimeStopwatch, formatDurationHuman } from '../utils/timeFormat';
import {
  Play,
  Pause,
  RotateCcw,
  Flag,
  Save,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Target,
  BookOpen,
  Volume2,
  VolumeX,
  FileCheck
} from 'lucide-react';
import { sounds } from '../utils/audio';

export default function StopwatchTimer() {
  const {
    timer,
    targets,
    settings,
    startTimer,
    pauseTimer,
    resetTimer,
    recordLap,
    saveCurrentSession,
    setTimerSubject,
    setTimerActiveTarget,
    handleToggleTarget
  } = useApp();

  const [lapNote, setLapNote] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Keyboard shortcuts (Space = Play/Pause, L = Lap)
  useEffect(() => {
    function handleKeyDown(e) {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (timer.is_running) pauseTimer();
        else startTimer();
      } else if (e.code === 'KeyL' && timer.is_running) {
        e.preventDefault();
        recordLap();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timer.is_running, pauseTimer, startTimer, recordLap]);

  const activeTarget = targets.find((t) => t.id === timer.active_target_id);

  const handleLapSubmit = (e) => {
    e.preventDefault();
    recordLap(lapNote);
    setLapNote('');
  };

  const handleConfirmSaveSession = async () => {
    await saveCurrentSession(sessionNotes);
    setSessionNotes('');
    setShowSaveModal(false);
  };

  const toggleSound = () => {
    const nextState = sounds.toggle();
    setSoundEnabled(nextState);
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 flex flex-col justify-center max-w-none' : ''}`}>
      {/* Top Control Bar: Subject & Target Binding */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Subject Dropdown */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 min-w-[90px]">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Subject:</span>
            </label>
            <select
              value={timer.active_subject}
              onChange={(e) => setTimerSubject(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full cursor-pointer"
            >
              {settings.subjects?.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Active Target Dropdown Binding */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 min-w-[90px]">
              <Target className="w-3.5 h-3.5 text-rose-400" />
              <span>Goal/Target:</span>
            </label>
            <select
              value={timer.active_target_id || ''}
              onChange={(e) => setTimerActiveTarget(e.target.value ? Number(e.target.value) : null)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500 w-full cursor-pointer"
            >
              <option value="">(None - General Study Block)</option>
              {targets
                .filter((t) => t.status !== 'completed' || t.id === timer.active_target_id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.status === 'completed' ? '✓ ' : '🎯 '} {t.title} ({t.subject})
                  </option>
                ))}
            </select>
          </div>

          {/* Sound & Fullscreen Toggles */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={toggleSound}
              className={`p-2.5 rounded-xl border text-sm transition cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:text-indigo-300'
                  : 'bg-slate-800/40 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
              title={soundEnabled ? 'Sound is On' : 'Sound is Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Zen Focus Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* If Active Target is Selected, display dynamic card with 1-click completion! */}
        {activeTarget && (
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-950/20 px-3.5 py-2.5 rounded-xl border border-indigo-500/20">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                  Currently Studying Target:
                </span>
                <p className="text-sm font-medium text-slate-100">{activeTarget.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-400">
                Tracked: <strong className="text-slate-200">{formatDurationHuman((activeTarget.actual_seconds || 0) + (timer.is_running ? timer.elapsed_seconds : 0))}</strong>
              </span>

              {/* Instant Tick Button */}
              <button
                onClick={() => handleToggleTarget(activeTarget.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTarget.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{activeTarget.status === 'completed' ? 'Completed ✓' : 'Mark as Done!'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Big Stopwatch Display Card */}
      <div className="relative bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
        
        {/* Ambient background glow */}
        <div
          className={`absolute w-72 h-72 rounded-full blur-3xl opacity-20 -top-10 transition-colors duration-700 pointer-events-none ${
            timer.is_running ? 'bg-indigo-500' : 'bg-slate-600'
          }`}
        />

        {/* Status Tag */}
        <div className="mb-4 flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              timer.is_running ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
            }`}
          />
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-slate-400">
            {timer.is_running ? 'Focus Session Active' : timer.elapsed_seconds > 0 ? 'Paused' : 'Ready to Study'}
          </span>
        </div>

        {/* Time Digits */}
        <div className="font-mono-numbers text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white select-none py-2 drop-shadow-md">
          {formatTimeStopwatch(timer.elapsed_seconds)}
        </div>

        {/* Small hint label */}
        <div className="text-xs text-slate-500 font-medium mt-1">
          {timer.elapsed_seconds > 3600
            ? 'HOURS : MINUTES : SECONDS'
            : 'MINUTES : SECONDS'}
        </div>

        {/* Main Stopwatch Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-10">
          
          {/* Start / Pause Button */}
          {timer.is_running ? (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base sm:text-lg shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer glow-amber"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base sm:text-lg shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer glow-emerald"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{timer.elapsed_seconds > 0 ? 'Resume' : 'Start Focus'}</span>
            </button>
          )}

          {/* Lap Button (Active when timer is running) */}
          <button
            onClick={() => recordLap()}
            disabled={!timer.is_running}
            className={`flex items-center gap-2 px-5 sm:px-6 py-3.5 rounded-2xl border font-semibold text-sm sm:text-base transition-all transform active:scale-95 cursor-pointer ${
              timer.is_running
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30'
                : 'bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            title="Record Lap split time (Hotkey: L)"
          >
            <Flag className="w-4 h-4" />
            <span>Lap</span>
          </button>

          {/* Save Session Button */}
          {timer.elapsed_seconds > 0 && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-2 px-5 sm:px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95 cursor-pointer"
              title="Save this study block to database"
            >
              <Save className="w-4 h-4" />
              <span>Save & Log</span>
            </button>
          )}

          {/* Reset Button */}
          {timer.elapsed_seconds > 0 && !timer.is_running && (
            <button
              onClick={resetTimer}
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-sm transition-all transform active:scale-95 cursor-pointer"
              title="Reset timer to 0 without saving"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Hotkey notice */}
        <p className="text-xs text-slate-500 mt-6 hidden sm:block">
          Pro-tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Space</kbd> to Play/Pause,{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">L</kbd> for Lap.
        </p>
      </div>

      {/* Laps Section */}
      {timer.laps && timer.laps.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Flag className="w-4 h-4 text-indigo-400" />
              <span>Recorded Laps ({timer.laps.length})</span>
            </h3>
            
            {/* Quick Lap Note Input */}
            {timer.is_running && (
              <form onSubmit={handleLapSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add note to next lap..."
                  value={lapNote}
                  onChange={(e) => setLapNote(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-56"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
                >
                  Lap + Note
                </button>
              </form>
            )}
          </div>

          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Lap</th>
                  <th className="py-2 px-3">Lap Time</th>
                  <th className="py-2 px-3">Total Time</th>
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {timer.laps
                  .slice()
                  .reverse()
                  .map((lap, index) => (
                    <tr key={index} className="hover:bg-slate-800/30 font-mono-numbers">
                      <td className="py-2.5 px-3 font-semibold text-indigo-400">
                        #{lap.lapNumber || timer.laps.length - index}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-emerald-400">
                        +{formatTimeStopwatch(lap.lapTime)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        {formatTimeStopwatch(lap.total)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-xs">
                        {lap.timestamp || '--:--'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans text-xs italic">
                        {lap.note || '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Session Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Save Study Session</h3>
                <p className="text-xs text-slate-400">Log this session to your database & weekly stats</p>
              </div>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-3.5 space-y-2 text-sm border border-slate-700/50 font-mono-numbers">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Duration:</span>
                <span className="font-bold text-emerald-400">{formatDurationHuman(timer.elapsed_seconds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Subject:</span>
                <span className="text-slate-200 font-sans">{timer.active_subject}</span>
              </div>
              {activeTarget && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Linked Target:</span>
                  <span className="text-indigo-300 font-sans truncate max-w-[200px]">{activeTarget.title}</span>
                </div>
              )}
              {timer.laps.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Total Laps:</span>
                  <span className="text-slate-300">{timer.laps.length} laps</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Session Notes (Optional):
              </label>
              <textarea
                placeholder="What topics, formulas, or PYQs did you solve?"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSaveSession}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer"
              >
                Confirm & Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
