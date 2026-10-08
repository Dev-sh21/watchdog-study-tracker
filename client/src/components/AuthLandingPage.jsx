import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Timer,
  GraduationCap,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  BarChart3,
  Flame,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle
} from 'lucide-react';

export default function AuthLandingPage() {
  const {
    login,
    register,
    loginGoogle,
    switchProfile,
    availableUsers,
    theme,
    toggleTheme
  } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'google'
  
  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regExam, setRegExam] = useState('GATE');

  // Google Sign-In modal/prompt
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleExam, setGoogleExam] = useState('GATE');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginUsername, loginPassword);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(regUsername, regName, regPassword, regExam);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;
    setError('');
    setLoading(true);
    try {
      await loginGoogle(googleEmail.trim(), googleName.trim() || googleEmail.split('@')[0], googleExam);
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (userId) => {
    setError('');
    setLoading(true);
    try {
      await switchProfile(userId);
    } catch (err) {
      setError('Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Bar with Logo & Theme Switcher */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Timer className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block leading-tight">
              WatchDog
            </span>
            <span className="text-[11px] text-slate-400">
              GATE & UPSC Command Center
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto w-full gap-8 lg:gap-16">
        
        {/* Left Hero / Pitch */}
        <div className="flex-1 space-y-6 max-w-xl text-center lg:text-left">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Dedicated Multi-Exam Isolation & 24/7 Cloud Sync</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Stop Guessing. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Track Every Second
            </span>{' '}
            of Your Prep.
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Whether you are conquering <strong>GATE CSE</strong> or your brother is mastering <strong>UPSC Civil Services</strong>, 
            sign in to your private account to access isolated timers, targets, weekly averages, and Google Calendar sync!
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-left">
            <div className="flex items-start gap-2.5 bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Study Stopwatch & Laps</h4>
                <p className="text-[11px] text-slate-400">Record split times, notes and pause anytime.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Target Time Tracking</h4>
                <p className="text-[11px] text-slate-400">Tick goals to see exact duration spent!</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Google Calendar Link</h4>
                <p className="text-[11px] text-slate-400">Directly syncs study sessions to your Google Calendar.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Flame className="w-4 h-4 fill-orange-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Weekly Averages & Streaks</h4>
                <p className="text-[11px] text-slate-400">Charts, daily hours & unstoppable consistency.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Authentication Card */}
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-5">
          
          {/* Header Switcher: Sign In vs Sign Up */}
          <div className="flex rounded-2xl bg-slate-800/90 p-1 border border-slate-700/60 text-xs font-bold">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                mode === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                mode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 🔴 GOOGLE SIGN-IN BUTTON */}
          <div>
            <button
              onClick={() => setMode('google')}
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-sm shadow-md transition-all transform active:scale-98 cursor-pointer"
            >
              {/* Official Google G Logo */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold absolute">
              Or Use Email / Username
            </span>
          </div>

          {/* GOOGLE SIGN IN MODAL / FORM */}
          {mode === 'google' && (
            <form onSubmit={handleGoogleSubmit} className="space-y-3.5 text-xs">
              <div className="bg-indigo-950/20 border border-indigo-500/30 p-3 rounded-2xl">
                <span className="font-semibold text-indigo-300 block mb-0.5">Google Account Details:</span>
                <p className="text-[11px] text-slate-400">
                  Enter your Google Account email to link your Google Calendar & isolated prep database.
                </p>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Google Email Address:</label>
                <input
                  type="email"
                  placeholder="e.g. devesh@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Your Full Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Devesh Mishra"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1.5">
                  Which exam are you preparing for?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGoogleExam('GATE')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      googleExam === 'GATE'
                        ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <span>GATE CSE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGoogleExam('UPSC')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      googleExam === 'UPSC'
                        ? 'bg-amber-500/25 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Landmark className="w-4 h-4 text-amber-400" />
                    <span>UPSC CSE</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
                >
                  {loading ? 'Connecting...' : 'Sign In with Google →'}
                </button>
              </div>
            </form>
          )}

          {/* STANDARD SIGN IN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Username or Email:</label>
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
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In to Your Dashboard'}
              </button>
            </form>
          )}

          {/* STANDARD SIGN UP / REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Full Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Devesh Mishra"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Username / Email:</label>
                <input
                  type="text"
                  placeholder="e.g. devesh"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Exam Choice */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  Which exam are you preparing for?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegExam('GATE')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      regExam === 'GATE'
                        ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <span>🎓 GATE CSE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegExam('UPSC')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      regExam === 'UPSC'
                        ? 'bg-amber-500/25 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Landmark className="w-4 h-4 text-amber-400" />
                    <span>🇮🇳 UPSC CSE</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-md transition cursor-pointer mt-1"
              >
                {loading ? 'Creating Account...' : 'Create Account & Start Prep'}
              </button>
            </form>
          )}

          {/* 1-CLICK DEMO ACCOUNTS FOR INSTANT LOGIN */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <span className="text-[11px] text-slate-400 block text-center font-medium">
              Quick 1-Click Login for Brother & You:
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(1)}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Devesh</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">GATE CSE</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin(2)}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Bhai</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">UPSC CSE</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
