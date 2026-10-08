import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Save,
  Check,
  Sparkles,
  BookMarked,
  Code2,
  ListCheck
} from 'lucide-react';

export default function Scratchpad() {
  const { notepad, handleSaveNotepad } = useApp();
  const [content, setContent] = useState(notepad.content || '');
  const [isSaved, setIsSaved] = useState(true);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (notepad.content !== undefined) {
      setContent(notepad.content);
    }
  }, [notepad.content]);

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);
    setIsSaved(false);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Auto-save after 800ms debounce
    saveTimeoutRef.current = setTimeout(async () => {
      await handleSaveNotepad(val);
      setIsSaved(true);
    }, 800);
  };

  const handleManualSave = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    await handleSaveNotepad(content);
    setIsSaved(true);
  };

  const insertTemplate = (snippet) => {
    const updated = content ? `${content}\n\n${snippet}` : snippet;
    setContent(updated);
    handleSaveNotepad(updated);
    setIsSaved(true);
  };

  const templates = [
    {
      label: 'Formula: Master Theorem',
      snippet: `### 📌 Master Theorem:
T(n) = a * T(n/b) + Θ(n^k * log^p(n))
- If log_b(a) > k => T(n) = Θ(n^(log_b(a)))
- If log_b(a) == k:
  - p > -1 => T(n) = Θ(n^k * log^(p+1)(n))
  - p == -1 => T(n) = Θ(n^k * log(log(n)))
  - p < -1 => T(n) = Θ(n^k)`
    },
    {
      label: 'Shortcut: Eigenvalues & Matrices',
      snippet: `### 📌 Eigenvalue Properties:
1. Trace(A) = Sum of Eigenvalues
2. Det(A) = Product of Eigenvalues
3. Eigenvalues of A^T are same as A
4. If λ is an eigenvalue of A, then λ^k is eigenvalue of A^k`
    },
    {
      label: 'Revision Checklist',
      snippet: `### 🎯 Quick Revision Checklist:
- [ ] Solve 2024 & 2023 Set 1 PYQs
- [ ] Revisit starred tricky questions in Test Series
- [ ] Memorize standard time complexities & recurrences`
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">GATE Scratchpad & Formulas</h3>
            <p className="text-xs text-slate-400">
              Persistent notebook synced across your laptop and phone
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Saved indicator */}
          <span
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
              isSaved
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 animate-spin" />}
            <span>{isSaved ? 'Auto-Saved to DB' : 'Saving...'}</span>
          </span>

          <button
            onClick={handleManualSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Quick Snippet Inserts */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 font-medium mr-1">Quick Snippets:</span>
        {templates.map((tpl, i) => (
          <button
            key={i}
            onClick={() => insertTemplate(tpl.snippet)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            + {tpl.label}
          </button>
        ))}
      </div>

      {/* Notepad Textarea */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Write your revision notes, tricky formulas, or daily problem notes here..."
          className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono resize-y min-h-[350px] leading-relaxed"
        />

        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>Words: {content.trim() ? content.trim().split(/\s+/).length : 0} | Chars: {content.length}</span>
          {notepad.updated_at && <span>Last saved: {notepad.updated_at}</span>}
        </div>
      </div>
    </div>
  );
}
