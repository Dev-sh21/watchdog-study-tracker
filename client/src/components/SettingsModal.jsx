import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  X,
  Save,
  Plus,
  Trash2,
  Calendar,
  Clock,
  BookOpen
} from 'lucide-react';

export default function SettingsModal() {
  const { isSettingsModalOpen, setIsSettingsModalOpen, settings, handleSaveSettings } = useApp();

  const [examName, setExamName] = useState(settings.exam_name || 'GATE CSE / DA');
  const [examDate, setExamDate] = useState(settings.exam_date || '2027-02-06');
  const [dailyGoalHours, setDailyGoalHours] = useState(settings.daily_goal_hours || 6.0);
  const [subjects, setSubjects] = useState(settings.subjects || []);
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    if (settings) {
      setExamName(settings.exam_name);
      setExamDate(settings.exam_date);
      setDailyGoalHours(settings.daily_goal_hours);
      setSubjects(settings.subjects || []);
    }
  }, [settings]);

  if (!isSettingsModalOpen) return null;

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    if (!subjects.includes(newSubject.trim())) {
      setSubjects([...subjects, newSubject.trim()]);
    }
    setNewSubject('');
  };

  const handleRemoveSubject = (sub) => {
    setSubjects(subjects.filter((s) => s !== sub));
  };

  const handleSave = async () => {
    await handleSaveSettings({
      exam_name: examName,
      exam_date: examDate,
      daily_goal_hours: Number(dailyGoalHours),
      subjects
    });
    setIsSettingsModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={() => setIsSettingsModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">GATE Prep Settings ⚙️</h3>
            <p className="text-xs text-slate-400">
              Customize your target exam date, study goals and subjects
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 text-xs">
          {/* Exam Name */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              Exam Name / Target:
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Target Exam Date */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Target Exam Date:</span>
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Daily Goal Hours */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Daily Study Goal (Hours):</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="24"
              value={dailyGoalHours}
              onChange={(e) => setDailyGoalHours(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Subjects List */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>Configured Subjects:</span>
            </label>

            {/* Add Subject Input */}
            <div className="flex gap-2 mb-2.5">
              <input
                type="text"
                placeholder="Add new subject..."
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSubject}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-950/40 rounded-xl border border-slate-800">
              {subjects.map((sub) => (
                <span
                  key={sub}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px]"
                >
                  <span>{sub}</span>
                  <button
                    onClick={() => handleRemoveSubject(sub)}
                    className="text-slate-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
