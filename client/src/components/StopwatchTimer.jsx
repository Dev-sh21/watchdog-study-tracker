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
  BookOpen,
  Volume2,
  VolumeX,
  FileCheck,
  Target
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

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

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
    <div className="bg-white border border-yellow-200/90 rounded-3xl p-6 sm:p-8 shadow-sm shadow-amber-500/5 space-y-6">
      
      {/* Top Bar: Curvy Subject Selector & Audio Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-yellow-100">
        
        {/* Subject Pill Dropdown */}
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <select
            value={timer.active_subject}
            onChange={(e) => setTimerSubject(e.target.value)}
            className="bg-yellow-50/70 hover:bg-yellow-50 border border-yellow-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 w-full cursor-pointer transition"
          >
            {settings.subjects?.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* Mute/Unmute Curvy Button */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={toggleSound}
            className={`p-2 rounded-2xl border text-xs transition cursor-pointer ${
              soundEnabled
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
            title={soundEnabled ? 'Audio On' : 'Audio Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Linked Goal Banner (if studying specific goal) */}
      {activeTarget && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold text-amber-800 block tracking-wider">
                Focusing on Target:
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{activeTarget.title}</p>
            </div>
          </div>

          <button
            onClick={() => handleToggleTarget(activeTarget.id)}
            className="px-3 py-1.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer flex-shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Done ✓</span>
          </button>
        </div>
      )}

      {/* Big Curvy Stopwatch Display Card */}
      <div className="bg-gradient-to-b from-yellow-50/60 to-white border border-yellow-200 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Soft yellow ambient glow */}
        <div
          className={`absolute w-56 h-56 rounded-full blur-3xl opacity-30 -top-8 transition-all duration-700 pointer-events-none ${
            timer.is_running ? 'bg-amber-400' : 'bg-yellow-200'
          }`}
        />

        {/* Running Status Badge */}
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              timer.is_running ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'
            }`}
          />
          <span className="text-xs font-bold uppercase tracking-widest text-amber-800">
            {timer.is_running ? 'Focusing Now' : timer.elapsed_seconds > 0 ? 'Paused' : 'Ready'}
          </span>
        </div>

        {/* Large Curvy Numbers */}
        <div className="font-mono-numbers text-6xl sm:text-7xl font-black text-slate-900 py-3 tracking-tight select-none">
          {formatTimeStopwatch(timer.elapsed_seconds)}
        </div>

        <div className="text-[11px] font-semibold text-slate-400 tracking-wider">
          {timer.elapsed_seconds > 3600 ? 'HOURS : MINUTES : SECONDS' : 'MINUTES : SECONDS'}
        </div>

        {/* Main Action Buttons (Curvy & Bold) */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6">
          
          {/* Start / Pause */}
          {timer.is_running ? (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-base shadow-lg shadow-amber-500/25 transform active:scale-95 transition cursor-pointer"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-base shadow-lg shadow-amber-400/30 transform active:scale-95 transition cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{timer.elapsed_seconds > 0 ? 'Resume' : 'Start Focus'}</span>
            </button>
          )}

          {/* Lap Button */}
          <button
            onClick={() => recordLap()}
            disabled={!timer.is_running}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm transition transform active:scale-95 cursor-pointer ${
              timer.is_running
                ? 'bg-yellow-100 hover:bg-yellow-200 text-amber-900 border border-yellow-300'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
            }`}
            title="Record lap split time (Hotkey: L)"
          >
            <Flag className="w-4 h-4" />
            <span>Lap</span>
          </button>

          {/* Save & Log to Database */}
          {timer.elapsed_seconds > 0 && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-yellow-300 font-bold text-sm shadow-md transition transform active:scale-95 cursor-pointer"
              title="Save session to database"
            >
              <Save className="w-4 h-4" />
              <span>Save & Log</span>
            </button>
          )}

          {/* Reset */}
          {timer.elapsed_seconds > 0 && !timer.is_running && (
            <button
              onClick={resetTimer}
              className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition transform active:scale-95 cursor-pointer"
              title="Reset without saving"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-400 mt-4 hidden sm:block">
          Shortcut: <kbd className="px-1.5 py-0.5 rounded-lg bg-yellow-100 text-slate-800 font-mono text-[10px]">Space</kbd> to Pause/Resume,{' '}
          <kbd className="px-1.5 py-0.5 rounded-lg bg-yellow-100 text-slate-800 font-mono text-[10px]">L</kbd> for Lap.
        </p>
      </div>

      {/* Laps List (Curvy Table) */}
      {timer.laps && timer.laps.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-amber-600" />
              <span>Recorded Laps ({timer.laps.length})</span>
            </h4>
          </div>

          <div className="max-h-44 overflow-y-auto rounded-2xl border border-yellow-200 divide-y divide-yellow-100 bg-yellow-50/30">
            {timer.laps
              .slice()
              .reverse()
              .map((lap, index) => (
                <div key={index} className="flex items-center justify-between px-3.5 py-2 text-xs font-mono-numbers">
                  <span className="font-bold text-amber-800">
                    #{lap.lapNumber || timer.laps.length - index}
                  </span>
                  <span className="font-semibold text-emerald-600">
                    +{formatTimeStopwatch(lap.lapTime)}
                  </span>
                  <span className="text-slate-700 font-medium">
                    {formatTimeStopwatch(lap.total)}
                  </span>
                  <span className="text-slate-400 text-[10px] font-sans">
                    {lap.timestamp || '--:--'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Save Session Modal (Curvy White & Yellow) */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-yellow-300 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Save Study Session</h3>
                <p className="text-xs text-slate-500">Log this session to SQLite & weekly stats</p>
              </div>
            </div>

            <div className="bg-yellow-50/80 rounded-2xl p-3.5 space-y-1.5 text-xs border border-yellow-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-bold text-amber-900">{formatDurationHuman(timer.elapsed_seconds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subject:</span>
                <span className="font-semibold text-slate-800">{timer.active_subject}</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">
                Quick Note (Optional):
              </label>
              <textarea
                placeholder="Topics or PYQs covered..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="w-full bg-yellow-50/50 border border-yellow-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none h-16"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSaveSession}
                className="px-5 py-2 rounded-2xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-md cursor-pointer"
              >
                Save & Log ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
