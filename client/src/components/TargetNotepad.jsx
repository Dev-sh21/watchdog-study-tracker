import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDurationHuman } from '../utils/timeFormat';
import {
  parseTargetWithGemini,
  saveGeminiApiKey
} from '../services/api';
import {
  syncAddGoogleEvent,
  syncCompleteGoogleEvent,
  syncDeleteGoogleEvent,
  setGoogleToken,
  getGoogleToken
} from '../services/googleCalendar';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Calendar,
  Trash2,
  Play,
  Clock,
  Key,
  ExternalLink,
  ChevronRight,
  ListTodo
} from 'lucide-react';

export default function TargetNotepad() {
  const {
    targets,
    settings,
    timer,
    currentUser,
    handleCreateTarget,
    handleToggleTarget,
    handleDeleteTarget,
    handleStartTargetFocus
  } = useApp();

  const [promptInput, setPromptInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(currentUser?.gemini_api_key || '');
  const [googleTokenInput, setGoogleTokenInput] = useState(getGoogleToken());
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'

  // Smart Add with Gemini & Google Calendar Auto-Sync
  const handleAddSmartTarget = async (e) => {
    e.preventDefault();
    if (!promptInput.trim() || isProcessing) return;

    setIsProcessing(true);
    const rawText = promptInput.trim();

    try {
      // 1. Ask Gemini to parse the study target
      let parsed = {
        title: rawText,
        subject: settings.subjects?.[0] || 'General',
        target_date: new Date().toISOString().split('T')[0],
        time_str: '10:00',
        duration_minutes: 120,
        exam_tip: 'Focus on core concepts & previous year questions!'
      };

      try {
        const aiResult = await parseTargetWithGemini(rawText, geminiKeyInput);
        if (aiResult && aiResult.title) {
          parsed = aiResult;
        }
      } catch (aiErr) {
        console.warn('AI parse error, using fallback:', aiErr);
      }

      // 2. Automatically sync & add to Google Calendar
      let googleEventId = '';
      try {
        const calResult = await syncAddGoogleEvent({
          title: parsed.title,
          subject: parsed.subject,
          examName: settings.exam_name || 'GATE',
          dateStr: parsed.target_date,
          timeStr: parsed.time_str,
          durationMinutes: parsed.duration_minutes,
          tip: parsed.exam_tip
        });
        if (calResult && calResult.eventId) {
          googleEventId = calResult.eventId;
        }
      } catch (calErr) {
        console.warn('Google Calendar sync warning:', calErr);
      }

      // 3. Save target to SQLite database with Google Event ID & Gemini Tip
      await handleCreateTarget(
        parsed.title,
        parsed.subject,
        parsed.target_date,
        googleEventId,
        parsed.exam_tip
      );

      setPromptInput('');
    } catch (err) {
      console.error('Failed to create target:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Complete / Cut Task (Syncs & strikes out in Google Calendar)
  const onToggle = async (target) => {
    const isNowCompleted = target.status !== 'completed';
    await handleToggleTarget(target.id);

    // Sync with Google Calendar if event ID is attached
    if (target.google_event_id) {
      if (isNowCompleted) {
        await syncCompleteGoogleEvent(
          target.google_event_id,
          target.title,
          formatDurationHuman(target.actual_seconds || 0)
        );
      }
    }
  };

  // Delete / Cut Task (Deletes from DB and cuts from Google Calendar)
  const onDelete = async (target) => {
    // Cut/delete from Google Calendar automatically
    if (target.google_event_id) {
      await syncDeleteGoogleEvent(target.google_event_id);
    }
    await handleDeleteTarget(target.id);
  };

  const pendingTargets = targets.filter((t) => t.status !== 'completed');
  const completedTargets = targets.filter((t) => t.status === 'completed');

  const filteredTargets =
    filter === 'pending'
      ? pendingTargets
      : filter === 'completed'
      ? completedTargets
      : targets;

  const handleSaveKeys = async () => {
    if (geminiKeyInput.trim()) {
      await saveGeminiApiKey(geminiKeyInput.trim()).catch(console.error);
    }
    setGoogleToken(googleTokenInput.trim());
    setShowKeyModal(false);
  };

  return (
    <div className="bg-white border border-yellow-200/90 rounded-3xl p-6 sm:p-8 shadow-sm shadow-amber-500/5 space-y-6">
      
      {/* Header: Title & AI / Calendar Config */}
      <div className="flex items-center justify-between pb-3 border-b border-yellow-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Study Targets & Todo List
            </h3>
            <p className="text-[11px] text-amber-800 font-medium">
              Gemini AI Auto-Schedules & Syncs with Google Calendar 📅
            </p>
          </div>
        </div>

        {/* API Key / Token Config Button */}
        <button
          onClick={() => setShowKeyModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-amber-900 text-xs font-bold transition cursor-pointer"
          title="Configure Gemini API Key & Google Calendar Token"
        >
          <Key className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">AI & Sync Keys</span>
        </button>
      </div>

      {/* Target Input with Gemini AI Auto-Schedule */}
      <form onSubmit={handleAddSmartTarget} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            placeholder="e.g. Revise Algorithms DP, Solve 20 PYQs, or Laxmikanth Ch 5..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            disabled={isProcessing}
            className="flex-1 bg-yellow-50/60 focus:bg-white border border-yellow-200 text-slate-900 text-sm font-medium rounded-2xl px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
          />

          <button
            type="submit"
            disabled={isProcessing || !promptInput.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-950 text-xs sm:text-sm font-black shadow-md shadow-amber-400/25 transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-slate-900" />
                <span>Scheduling with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Gemini + Calendar</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-slate-400 px-1">
          Tip: Gemini will infer the subject, recommend ideal study duration, and sync straight to your Google Calendar!
        </p>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 bg-yellow-50/80 p-1 rounded-2xl border border-yellow-200">
          {[
            { id: 'all', label: `All (${targets.length})` },
            { id: 'pending', label: `Pending (${pendingTargets.length})` },
            { id: 'completed', label: `Done (${completedTargets.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === tab.id
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-amber-800 font-bold hidden sm:inline">
          {pendingTargets.length} task(s) left today
        </span>
      </div>

      {/* Target Goals List */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
        {filteredTargets.length === 0 ? (
          <div className="text-center py-10 bg-yellow-50/30 rounded-3xl border border-yellow-100">
            <CheckCircle2 className="w-8 h-8 text-amber-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">No targets here yet!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Type your goal above and let Gemini schedule it for you.</p>
          </div>
        ) : (
          filteredTargets.map((target) => {
            const isCompleted = target.status === 'completed';
            const isCurrentlyTracking = timer.active_target_id === target.id;
            const currentSeconds =
              (target.actual_seconds || 0) +
              (isCurrentlyTracking && timer.is_running ? timer.elapsed_seconds : 0);

            return (
              <div
                key={target.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCompleted
                    ? 'bg-slate-50/80 border-slate-200 opacity-75'
                    : isCurrentlyTracking
                    ? 'bg-amber-50 border-amber-300 shadow-sm shadow-amber-400/10'
                    : 'bg-white border-yellow-200 hover:border-amber-300 hover:shadow-sm'
                }`}
              >
                {/* Left: Curvy Checkbox & Title */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => onToggle(target)}
                    className="mt-0.5 text-amber-500 hover:text-emerald-500 transition cursor-pointer flex-shrink-0"
                    title={isCompleted ? 'Mark as Incomplete' : 'Cut / Complete Task!'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-amber-400 hover:text-emerald-500" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`text-sm font-bold leading-tight break-words ${
                          isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {target.title}
                      </p>

                      {isCurrentlyTracking && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 animate-pulse">
                          Tracking
                        </span>
                      )}
                    </div>

                    {/* Metadata & AI Tip */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="px-2 py-0.5 rounded-lg bg-yellow-100 text-amber-900 font-bold text-[10px]">
                        {target.subject}
                      </span>

                      {/* Time taken / duration calculation */}
                      {currentSeconds > 0 && (
                        <span className={`font-bold flex items-center gap-1 ${isCompleted ? 'text-emerald-600' : 'text-amber-800'}`}>
                          <Clock className="w-3 h-3" />
                          <span>
                            {isCompleted ? 'Finished in ' : 'Studied '}
                            {formatDurationHuman(currentSeconds)}
                          </span>
                        </span>
                      )}

                      {/* Google Calendar Link Badge */}
                      <a
                        href="https://calendar.google.com/calendar/u/0/r"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-700 hover:underline flex items-center gap-1 font-semibold text-[10px]"
                        title="View on Google Calendar"
                      >
                        <Calendar className="w-3 h-3 text-amber-600" />
                        <span>Google Cal</span>
                      </a>
                    </div>

                    {/* Gemini Study Tip (if available) */}
                    {target.gemini_tip && (
                      <p className="text-[11px] text-amber-900 font-medium bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60 inline-block mt-1">
                        💡 <strong>Tip:</strong> {target.gemini_tip}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Focus & Delete/Cut Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {!isCompleted && (
                    <button
                      onClick={() => handleStartTargetFocus(target)}
                      className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        isCurrentlyTracking
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-yellow-100 hover:bg-amber-400 text-amber-900 hover:text-slate-950'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isCurrentlyTracking ? 'Focusing...' : 'Focus'}</span>
                    </button>
                  )}

                  {/* Cut / Delete Button */}
                  <button
                    onClick={() => onDelete(target)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                    title="Cut task and remove from Google Calendar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Gemini API Key & Google Calendar Token Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-yellow-300 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Gemini & Google Calendar Settings</h3>
                <p className="text-xs text-slate-500">Add your keys for automatic background scheduling</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Gemini API Key:
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  className="w-full bg-yellow-50/50 border border-yellow-200 rounded-2xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-[10px] text-slate-400">
                  Free key from Google AI Studio (aistudio.google.com). If empty, smart built-in scheduling is used.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Google Calendar OAuth Access Token (Optional):
                </label>
                <input
                  type="password"
                  placeholder="ya29..."
                  value={googleTokenInput}
                  onChange={(e) => setGoogleTokenInput(e.target.value)}
                  className="w-full bg-yellow-50/50 border border-yellow-200 rounded-2xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-[10px] text-slate-400">
                  For silent background sync. If empty, calendar templates open seamlessly on creation.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKeys}
                className="px-5 py-2 rounded-2xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-md cursor-pointer"
              >
                Save Settings ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
