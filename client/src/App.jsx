import React from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import StopwatchTimer from './components/StopwatchTimer';
import TargetNotepad from './components/TargetNotepad';
import WeeklyHoursGraph from './components/WeeklyHoursGraph';
import CompletionToast from './components/CompletionToast';

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
      <Header />
      <CompletionToast />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-all w-full flex-1 space-y-8">
        
        {/* ================= HERO SECTION ================= */}
        {/* Timer / Stopwatch on Left & Target / Todo Notepad on Right */}
        <section aria-label="Hero Section" className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="w-full">
            <StopwatchTimer />
          </div>

          <div className="w-full">
            <TargetNotepad />
          </div>
        </section>

        {/* ================= WEEKLY HOURS GRAPH SECTION ================= */}
        {/* Visual Monday–Sunday bar chart, weekly total, today's hours & daily average */}
        <section aria-label="Weekly Study Analytics">
          <WeeklyHoursGraph />
        </section>

      </main>

      {/* Clean, unobtrusive footer */}
      <footer className="border-t border-yellow-200/90 py-5 text-center text-xs text-amber-900/70 font-medium">
        <p>WatchDog • Powered by Gemini AI & Google Calendar • Automatically Saved in SQLite Database</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
