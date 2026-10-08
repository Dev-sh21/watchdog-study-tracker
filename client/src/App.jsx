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
import AuthModal from './components/AuthModal';
import AuthLandingPage from './components/AuthLandingPage';

function MainLayout() {
  const { currentUser, activeTab, isAuthModalOpen, setIsAuthModalOpen } = useApp();

  // If not logged in, show the dedicated Sign-In / Sign-Up Landing Page first!
  if (!currentUser) {
    return <AuthLandingPage />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
      <Header />
      <CompletionToast />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 transition-all w-full flex-1">
        {activeTab === 'timer' && <StopwatchTimer />}
        {activeTab === 'targets' && <TargetNotepad />}
        {activeTab === 'analytics' && <WeeklyAnalytics />}
        {activeTab === 'notepad' && <Scratchpad />}
        {activeTab === 'history' && <SessionHistory />}
      </main>

      <MobileBottomNav />
      <PhoneSyncModal />
      <SettingsModal />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
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
