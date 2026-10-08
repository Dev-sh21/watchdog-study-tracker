import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Users,
  LogIn,
  UserPlus,
  X,
  GraduationCap,
  Landmark,
  ShieldCheck,
  Download,
  Check,
  AlertCircle
} from 'lucide-react';
import { getBackupDownloadUrl } from '../services/api';

export default function AuthModal({ isOpen, onClose }) {
  const {
    currentUser,
    availableUsers,
    login,
    register,
    switchProfile
  } = useApp();

  const [tab, setTab] = useState('switch'); // 'switch', 'login', 'register'
  
  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regExam, setRegExam] = useState('GATE'); // 'GATE' or 'UPSC'
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginUsername, loginPassword);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(regUsername, regName, regPassword, regExam);
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = async (userId) => {
    setError('');
    try {
      await switchProfile(userId);
      onClose();
    } catch (err) {
      setError(err.message || 'Switch failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Aspirant Accounts & Profiles</h3>
            <p className="text-xs text-slate-400">
              Isolated databases for GATE & UPSC preparation
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/60 text-xs font-semibold">
          <button
            onClick={() => { setTab('switch'); setError(''); }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              tab === 'switch' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Quick Switch
          </button>
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              tab === 'login' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              tab === 'register' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            New Aspirant +
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: QUICK SWITCH (DEVESH & BHAI) */}
        {tab === 'switch' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Choose who is studying right now:
            </p>

            <div className="space-y-2.5">
              {availableUsers.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                const isUpsc = u.selected_exam === 'UPSC';

                return (
                  <button
                    key={u.id}
                    onClick={() => handleQuickSwitch(u.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-950/30 border-indigo-500/60 ring-2 ring-indigo-500/30'
                        : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm ${
                          isUpsc
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20'
                        }`}
                      >
                        {isUpsc ? <Landmark className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-white">{u.name}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          Target: <strong className={isUpsc ? 'text-amber-400' : 'text-indigo-400'}>{u.exam_name}</strong>
                        </span>
                      </div>
                    </div>

                    {isCurrent ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-white">
                        Switch →
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SIGN IN */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Username:</label>
              <input
                type="text"
                placeholder="e.g. devesh or bhai"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Password:</label>
              <input
                type="password"
                placeholder="••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md transition cursor-pointer mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* TAB 3: REGISTER NEW ASPIRANT */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Your Name:</label>
              <input
                type="text"
                placeholder="e.g. Rahul Mishra"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Choose Username:</label>
              <input
                type="text"
                placeholder="e.g. rahul"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Create Password:</label>
              <input
                type="password"
                placeholder="••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Which Exam Are You Preparing For? */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">
                Which exam are you preparing for?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegExam('GATE')}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                    regExam === 'GATE'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                  <span>🎓 GATE (Tech/Engg)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegExam('UPSC')}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                    regExam === 'UPSC'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Landmark className="w-5 h-5 text-amber-400" />
                  <span>🇮🇳 UPSC (Civil Services)</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-md transition cursor-pointer mt-2"
            >
              {loading ? 'Creating Profile...' : 'Create Aspirant Profile'}
            </button>
          </form>
        )}

        {/* Strong Database Security & Backup Info */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SQLite WAL (Zero Data Loss)</span>
          </div>

          <a
            href={getBackupDownloadUrl()}
            download
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
            title="Download full JSON backup of all targets & sessions"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Backup</span>
          </a>
        </div>
      </div>
    </div>
  );
}
