import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import * as api from '../services/api';
import { sounds } from '../utils/audio';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Current User & Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('watchdog_theme') || 'dark';
  });

  // Apply theme to document.body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
    localStorage.setItem('watchdog_theme', theme);
  }, [theme]);

  // Timer State
  const [timer, setTimer] = useState({
    is_running: false,
    elapsed_seconds: 0,
    start_time_ms: 0,
    active_target_id: null,
    active_subject: 'General',
    laps: []
  });

  // Data States
  const [targets, setTargets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [notepad, setNotepad] = useState({ content: '', updated_at: null });
  const [settings, setSettings] = useState({
    exam_name: 'GATE CSE / DA',
    exam_date: '2027-02-06',
    daily_goal_hours: 6.0,
    subjects: []
  });
  const [networkInfo, setNetworkInfo] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Modals & Navigation Tabs
  const [activeTab, setActiveTab] = useState('timer'); // 'timer', 'targets', 'analytics', 'notepad', 'history'
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [completionToast, setCompletionToast] = useState(null);

  const wsRef = useRef(null);
  const localTimerIntervalRef = useRef(null);

  // Load User Data & Application State
  const loadUserData = useCallback(async () => {
    const token = api.getAuthToken();
    if (!token) {
      setCurrentUser(null);
      return;
    }

    try {
      const [user, usersList, netRes] = await Promise.all([
        api.fetchCurrentUser().catch(() => null),
        api.fetchUsersList().catch(() => []),
        api.fetchNetworkInfo().catch(() => null)
      ]);

      if (user) {
        setCurrentUser(user);
        setSettings({
          exam_name: user.exam_name,
          exam_date: user.exam_date,
          daily_goal_hours: user.daily_goal_hours,
          subjects: user.subjects || []
        });
        if (user.theme) {
          setTheme(user.theme);
        }
      } else {
        // Token was invalid, clear it
        api.logoutUser();
        setCurrentUser(null);
        return;
      }

      if (usersList) setAvailableUsers(usersList);
      if (netRes) setNetworkInfo(netRes);

      // Fetch user-scoped data
      const [timerRes, targetsRes, analyticsRes, sessionsRes, notepadRes] = await Promise.all([
        api.fetchTimerState().catch(() => null),
        api.fetchTargets().catch(() => []),
        api.fetchWeeklyAnalytics().catch(() => null),
        api.fetchSessions().catch(() => []),
        api.fetchNotepad().catch(() => ({ content: '' }))
      ]);

      if (timerRes) setTimer(timerRes);
      if (targetsRes) setTargets(targetsRes);
      if (analyticsRes) setAnalytics(analyticsRes);
      if (sessionsRes) setSessions(sessionsRes);
      if (notepadRes) setNotepad(notepadRes);
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, []);

  // WebSocket Connection
  useEffect(() => {
    loadUserData();

    let ws = null;
    let reconnectTimeout = null;

    function connectWs() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Authenticate WebSocket with user's token
        const token = api.getAuthToken();
        if (token) {
          ws.send(JSON.stringify({ type: 'AUTH', token }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleWsMessage(msg);
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectWs, 2000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    }

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [loadUserData]);

  // Handle incoming WebSocket messages
  const handleWsMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'TIMER_STATE':
      case 'TIMER_UPDATE':
        setTimer(msg.payload);
        break;

      case 'TARGET_CREATED':
        setTargets((prev) => [msg.payload, ...prev]);
        break;

      case 'TARGET_UPDATED':
        setTargets((prev) => prev.map((t) => (t.id === msg.payload.id ? msg.payload : t)));
        break;

      case 'TARGET_DELETED':
        setTargets((prev) => prev.filter((t) => t.id !== msg.payload.id));
        break;

      case 'TARGET_TOGGLED': {
        const { target, wasCompleted, timeTakenFormatted } = msg.payload;
        setTargets((prev) => prev.map((t) => (t.id === target.id ? target : t)));
        if (wasCompleted) {
          triggerCelebration(target.title, timeTakenFormatted);
        }
        api.fetchWeeklyAnalytics().then(setAnalytics).catch(console.error);
        break;
      }

      case 'SESSION_SAVED':
        setSessions((prev) => [msg.payload, ...prev]);
        api.fetchWeeklyAnalytics().then(setAnalytics).catch(console.error);
        api.fetchTargets().then(setTargets).catch(console.error);
        break;

      case 'SESSION_DELETED':
        setSessions((prev) => prev.filter((s) => s.id !== msg.payload.id));
        api.fetchWeeklyAnalytics().then(setAnalytics).catch(console.error);
        break;

      case 'NOTEPAD_UPDATED':
        setNotepad(msg.payload);
        break;

      default:
        break;
    }
  }, []);

  const triggerCelebration = useCallback((title, duration) => {
    sounds.playFanfare();
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {}

    setCompletionToast({
      title,
      duration: duration || 'Completed',
      id: Date.now()
    });

    setTimeout(() => {
      setCompletionToast(null);
    }, 6000);
  }, []);

  // Timer Tick Interval
  useEffect(() => {
    if (timer.is_running) {
      localTimerIntervalRef.current = setInterval(() => {
        setTimer((prev) => ({
          ...prev,
          elapsed_seconds: prev.elapsed_seconds + 1
        }));
      }, 1000);
    } else {
      if (localTimerIntervalRef.current) clearInterval(localTimerIntervalRef.current);
    }

    return () => {
      if (localTimerIntervalRef.current) clearInterval(localTimerIntervalRef.current);
    };
  }, [timer.is_running]);

  // Periodic State Sync
  useEffect(() => {
    if (!timer.is_running) return;
    const syncInterval = setInterval(() => {
      api.updateTimerState(timer).catch(console.error);
    }, 10000);
    return () => clearInterval(syncInterval);
  }, [timer]);

  // ==================== AUTH & PROFILE ACTIONS ====================

  const login = async (username, password) => {
    const user = await api.loginUser(username, password);
    setCurrentUser(user);
    if (user.theme) setTheme(user.theme);
    await loadUserData();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'AUTH', token: user.token }));
    }
  };

  const loginGoogle = async (email, name, exam) => {
    const user = await api.loginWithGoogle(email, name, exam);
    setCurrentUser(user);
    if (user.theme) setTheme(user.theme);
    await loadUserData();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'AUTH', token: user.token }));
    }
  };

  const logout = () => {
    api.logoutUser();
    setCurrentUser(null);
    setTargets([]);
    setSessions([]);
    setAnalytics(null);
  };

  const register = async (username, name, password, exam) => {
    const user = await api.registerUser(username, name, password, exam);
    setCurrentUser(user);
    if (user.theme) setTheme(user.theme);
    await loadUserData();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'AUTH', token: user.token }));
    }
  };

  const switchProfile = async (userId) => {
    const user = await api.switchUserAccount(userId);
    setCurrentUser(user);
    if (user.theme) setTheme(user.theme);
    await loadUserData();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'AUTH', token: user.token }));
    }
  };

  const switchExam = async (examType) => {
    const updated = await api.updateSelectedExam(examType);
    setCurrentUser(updated);
    setSettings({
      exam_name: updated.exam_name,
      exam_date: updated.exam_date,
      daily_goal_hours: updated.daily_goal_hours,
      subjects: updated.subjects || []
    });
    // Set timer active subject to first subject of new exam
    if (updated.subjects && updated.subjects.length > 0) {
      setTimerSubject(updated.subjects[0]);
    }
    const [freshAnalytics, freshTargets] = await Promise.all([
      api.fetchWeeklyAnalytics(),
      api.fetchTargets()
    ]);
    setAnalytics(freshAnalytics);
    setTargets(freshTargets);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await api.updateUserTheme(newTheme).catch(console.error);
  };

  // ==================== TIMER ACTIONS ====================

  const startTimer = async () => {
    sounds.playStart();
    const newState = {
      ...timer,
      is_running: true,
      start_time_ms: timer.start_time_ms || Date.now()
    };
    setTimer(newState);
    await api.updateTimerState(newState);
  };

  const pauseTimer = async () => {
    sounds.playPause();
    const newState = {
      ...timer,
      is_running: false
    };
    setTimer(newState);
    await api.updateTimerState(newState);
  };

  const resetTimer = async () => {
    const newState = {
      ...timer,
      is_running: false,
      elapsed_seconds: 0,
      start_time_ms: 0,
      laps: []
    };
    setTimer(newState);
    await api.updateTimerState(newState);
  };

  const recordLap = async (note = '') => {
    sounds.playLap();
    const currentElapsed = timer.elapsed_seconds;
    const previousTotal = timer.laps.length > 0 ? timer.laps[timer.laps.length - 1].total : 0;
    const lapTime = currentElapsed - previousTotal;

    const newLap = {
      lapNumber: timer.laps.length + 1,
      lapTime,
      total: currentElapsed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      note: note.trim()
    };

    const newLaps = [...timer.laps, newLap];
    const newState = { ...timer, laps: newLaps };
    setTimer(newState);
    await api.updateTimerState(newState);
  };

  const saveCurrentSession = async (notes = '') => {
    if (timer.elapsed_seconds <= 0) return;

    sounds.playFanfare();
    const nowIso = new Date().toISOString();
    const startIso = new Date(Date.now() - timer.elapsed_seconds * 1000).toISOString();

    await api.saveSession({
      subject: timer.active_subject || settings.subjects[0] || 'General',
      target_id: timer.active_target_id,
      duration_seconds: timer.elapsed_seconds,
      start_time: startIso,
      end_time: nowIso,
      laps: timer.laps,
      notes: notes
    });

    setTimer((prev) => ({
      ...prev,
      is_running: false,
      elapsed_seconds: 0,
      start_time_ms: 0,
      laps: []
    }));

    const [freshAnalytics, freshSessions, freshTargets] = await Promise.all([
      api.fetchWeeklyAnalytics(),
      api.fetchSessions(),
      api.fetchTargets()
    ]);
    setAnalytics(freshAnalytics);
    setSessions(freshSessions);
    setTargets(freshTargets);
  };

  const setTimerSubject = async (subject) => {
    const newState = { ...timer, active_subject: subject };
    setTimer(newState);
    await api.updateTimerState(newState);
  };

  const setTimerActiveTarget = async (targetId) => {
    const selectedTarget = targets.find((t) => t.id === targetId);
    const newState = {
      ...timer,
      active_target_id: targetId,
      active_subject: selectedTarget ? selectedTarget.subject : timer.active_subject
    };
    setTimer(newState);
    await api.updateTimerState(newState);
  };

  // ==================== TARGET ACTIONS ====================

  const handleCreateTarget = async (title, subject, targetDate) => {
    const newTarget = await api.createTarget({
      title,
      subject: subject || timer.active_subject || settings.subjects[0],
      target_date: targetDate
    });
    setTargets((prev) => [newTarget, ...prev]);
    return newTarget;
  };

  const handleToggleTarget = async (id) => {
    const res = await api.toggleTargetCompletion(id);
    if (res.target) {
      setTargets((prev) => prev.map((t) => (t.id === id ? res.target : t)));
      if (res.wasCompleted) {
        triggerCelebration(res.target.title, res.timeTakenFormatted);
      }
      const freshAnalytics = await api.fetchWeeklyAnalytics();
      setAnalytics(freshAnalytics);
    }
  };

  const handleDeleteTarget = async (id) => {
    await api.deleteTarget(id);
    setTargets((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStartTargetFocus = async (target) => {
    sounds.playStart();
    const newState = {
      ...timer,
      active_target_id: target.id,
      active_subject: target.subject || timer.active_subject,
      is_running: true,
      start_time_ms: timer.start_time_ms || Date.now()
    };
    setTimer(newState);
    await api.updateTimerState(newState);
    setActiveTab('timer');
  };

  // ==================== OTHER ACTIONS ====================

  const handleSaveNotepad = async (content) => {
    const updated = await api.saveNotepad(content);
    setNotepad(updated);
  };

  const handleSaveSettings = async (newSettings) => {
    const updated = await api.saveSettings(newSettings);
    setSettings({
      exam_name: updated.exam_name,
      exam_date: updated.exam_date,
      daily_goal_hours: updated.daily_goal_hours,
      subjects: updated.subjects || []
    });
    setCurrentUser(updated);
  };

  const handleDeleteSession = async (id) => {
    await api.deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    const freshAnalytics = await api.fetchWeeklyAnalytics();
    setAnalytics(freshAnalytics);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        availableUsers,
        theme,
        toggleTheme,
        isAuthModalOpen,
        setIsAuthModalOpen,
        login,
        loginGoogle,
        logout,
        register,
        switchProfile,
        switchExam,
        timer,
        targets,
        analytics,
        sessions,
        notepad,
        settings,
        networkInfo,
        isConnected,
        activeTab,
        setActiveTab,
        isPhoneModalOpen,
        setIsPhoneModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        completionToast,
        setCompletionToast,
        // Timer operations
        startTimer,
        pauseTimer,
        resetTimer,
        recordLap,
        saveCurrentSession,
        setTimerSubject,
        setTimerActiveTarget,
        // Target operations
        handleCreateTarget,
        handleToggleTarget,
        handleDeleteTarget,
        handleStartTargetFocus,
        // Notepad & Settings
        handleSaveNotepad,
        handleSaveSettings,
        handleDeleteSession,
        refreshAll: loadUserData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
