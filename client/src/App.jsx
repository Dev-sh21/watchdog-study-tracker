import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import StopwatchTimer from './components/StopwatchTimer';
import TargetNotepad from './components/TargetNotepad';
import WeeklyAnalytics from './components/WeeklyAnalytics';
import Scratchpad from './components/Scratchpad';
import SessionHistory from './components/SessionHistory';
import PhoneSyncModal from './components/PhoneSyncModal';
import SettingsModal from './components/SettingsModal';
import MobileBottomNav from './components/MobileBottomNav';
import CompletionToast from './components/CompletionToast';

function MainContent() {
  const { activeTab } = useApp();

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 transition-all">
      {activeTab === 'timer' && <StopwatchTimer />}
      {activeTab === 'targets' && <TargetNotepad />}
      {activeTab === 'analytics' && <WeeklyAnalytics />}
      {activeTab === 'notepad' && <Scratchpad />}
      {activeTab === 'history' && <SessionHistory />}
    </main>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        <Header />
        <CompletionToast />
        <MainContent />
        <MobileBottomNav />
        <PhoneSyncModal />
        <SettingsModal />
      </div>
    </AppProvider>
  );
}
