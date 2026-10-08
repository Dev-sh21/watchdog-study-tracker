import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import {
  Sparkles,
  Bot,
  Send,
  Key,
  Copy,
  Check,
  BookOpen,
  Calendar,
  Lightbulb,
  Zap,
  RefreshCw
} from 'lucide-react';

export default function GeminiStudyMentor() {
  const { currentUser, settings } = useApp();
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState(currentUser?.gemini_api_key || '');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!currentUser?.gemini_api_key);

  const presets = [
    {
      icon: Calendar,
      label: "Today's Study Timetable",
      text: `Create a realistic 6-8 hour timetable for today with focus blocks, breaks, and PYQ solving for ${settings.exam_name}.`
    },
    {
      icon: Lightbulb,
      label: 'Breakdown Topic to Targets',
      text: `Give me 3 actionable, high-impact study targets for today in ${settings.subjects?.[0] || 'Core Subject'} for ${settings.exam_name}.`
    },
    {
      icon: Zap,
      label: 'High-Yield Revision Mnemonics',
      text: `What are the top 5 high-yield recurring concepts and mnemonics in ${settings.exam_name} that I must revise?`
    }
  ];

  const handleAsk = async (customText) => {
    const textToAsk = customText || prompt;
    if (!textToAsk.trim()) return;

    setLoading(true);
    setResponse('');

    try {
      const res = await api.askGeminiAi(textToAsk.trim(), apiKey.trim());
      setResponse(res.text);
      if (customText) setPrompt('');
    } catch (e) {
      setResponse(`❌ Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-900 to-indigo-950/30 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-sm space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Gemini AI Study Mentor</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                AI Powered
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Personalized strategy, timetables & PYQ guidance for {settings.exam_name}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="self-end sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
          <span>{apiKey ? 'API Key Configured ✓' : 'Add Gemini API Key'}</span>
        </button>
      </div>

      {/* API Key Drawer */}
      {showKeyInput && (
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-2 text-xs">
          <label className="text-slate-300 font-semibold block">
            Enter your Google Gemini API Key:
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={() => {
                api.saveGeminiApiKey(apiKey);
                setShowKeyInput(false);
              }}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
            >
              Save Key
            </button>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Key is securely stored in your personal SQLite database profile.
          </span>
        </div>
      )}

      {/* Preset Prompts */}
      <div className="space-y-1.5">
        <span className="text-xs text-slate-400 font-semibold block">Quick Strategy Generators:</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {presets.map((p, i) => {
            const Icon = p.icon;
            return (
              <button
                key={i}
                onClick={() => handleAsk(p.text)}
                disabled={loading}
                className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition flex items-start gap-2.5 cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-indigo-300 transition-colors">
                    {p.label}
                  </span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">Click to generate</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Query Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder={`Ask AI: e.g. "How should I structure my 3-hour revision block for ${settings.exam_name}?"`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 cursor-pointer flex-shrink-0"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>{loading ? 'Thinking...' : 'Ask AI'}</span>
        </button>
      </form>

      {/* Response Box */}
      {response && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 relative">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>AI Study Recommendations:</span>
            </span>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 transition cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
            {response}
          </div>
        </div>
      )}
    </div>
  );
}
