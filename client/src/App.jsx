import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import DashboardHero from './components/DashboardHero';
import StopwatchTimer from './components/StopwatchTimer';
import TargetNotepad from './components/TargetNotepad';
import PartnerProgress from './components/PartnerProgress';
import GeminiStudyMentor from './components/GeminiStudyMentor';
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
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 transition-all w-full flex-1">
        {/* Presentable Command Header on Dashboard */}
        <DashboardHero />

        {/* Tab 1: Default Focus Cockpit (Stopwatch + Targets + Brother Progress Preview) */}
        {activeTab === 'timer' && (
          <div className="space-y-8">
            <StopwatchTimer />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <TargetNotepad />
              <PartnerProgress />
            </div>
          </div>
        )}

        {/* Tab 2: Dedicated Brother's Live Progress */}
        {activeTab === 'partner' && <PartnerProgress />}

        {/* Tab 3: Goals & Google Calendar */}
        {activeTab === 'targets' && <TargetNotepad />}

        {/* Tab 4: Weekly Analytics & Averages */}
        {activeTab === 'analytics' && <WeeklyAnalytics />}

        {/* Tab 5: Gemini AI Study Mentor */}
        {activeTab === 'ai' && <GeminiStudyMentor />}

        {/* Tab 6: Notes & Scratchpad */}
        {activeTab === 'notepad' && <Scratchpad />}

        {/* Tab 7: Study History Logs */}
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
