import React from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Clock, X } from 'lucide-react';

export default function CompletionToast() {
  const { completionToast, setCompletionToast } = useApp();

  if (!completionToast) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-auto animate-in slide-in-from-top duration-300">
      <div className="bg-white border-2 border-yellow-300 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-amber-500/20 relative">
        <button
          onClick={() => setCompletionToast(null)}
          className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-yellow-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-900 flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-400/30">
            <Trophy className="w-6 h-6 animate-bounce" />
          </div>

          <div className="space-y-1 pr-6 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                🎉 Goal Completed!
              </span>
            </div>

            <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
              {completionToast.title}
            </p>

            <div className="pt-1 flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Finished in:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-bold text-emerald-800 font-mono-numbers">
                <Clock className="w-3.5 h-3.5" />
                <span>{completionToast.duration}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
