import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Timer,
  CheckSquare,
  BarChart3,
  FileText,
  History
} from 'lucide-react';

export default function MobileBottomNav() {
  const { activeTab, setActiveTab, timer } = useApp();

  const tabs = [
    { id: 'timer', label: 'Timer', icon: Timer, hasBadge: timer.is_running },
    { id: 'targets', label: 'Targets', icon: CheckSquare },
    { id: 'analytics', label: 'Weekly', icon: BarChart3 },
    { id: 'notepad', label: 'Notes', icon: FileText },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-lg px-2 py-1.5 safe-bottom">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition relative cursor-pointer ${
                isActive
                  ? 'text-indigo-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                {tab.hasBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
