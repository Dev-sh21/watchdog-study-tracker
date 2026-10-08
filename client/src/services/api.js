// API service for GATE & UPSC WatchDog

const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('watchdog_token') || '';
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('watchdog_token', token);
  } else {
    localStorage.removeItem('watchdog_token');
  }
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ================= AUTH APIs =================
export async function loginWithGoogle(email, name, exam = 'GATE') {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, exam })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Google login failed');
  }
  const data = await res.json();
  if (data.token) setAuthToken(data.token);
  return data;
}

export function logoutUser() {
  setAuthToken('');
}
export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to login');
  }
  const data = await res.json();
  if (data.token) setAuthToken(data.token);
  return data;
}

export async function registerUser(username, name, password, exam = 'GATE') {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, name, password, exam })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to register');
  }
  const data = await res.json();
  if (data.token) setAuthToken(data.token);
  return data;
}

export async function fetchUsersList() {
  const res = await fetch(`${API_BASE}/auth/users`);
  return res.json();
}

export async function switchUserAccount(userId) {
  const res = await fetch(`${API_BASE}/auth/switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  if (!res.ok) throw new Error('Failed to switch user');
  const data = await res.json();
  if (data.token) setAuthToken(data.token);
  return data;
}

export async function fetchCurrentUser() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getHeaders()
  });
  if (!res.ok) return null;
  return res.json();
}

export async function updateSelectedExam(exam) {
  const res = await fetch(`${API_BASE}/auth/exam`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ exam })
  });
  return res.json();
}

export async function updateUserTheme(theme) {
  const res = await fetch(`${API_BASE}/auth/theme`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ theme })
  });
  return res.json();
}

// ================= STUDY PARTNER / BROTHER PROGRESS =================
export async function fetchPartnerProgress() {
  const res = await fetch(`${API_BASE}/partner/progress`, { headers: getHeaders() });
  if (!res.ok) return { partner: null };
  return res.json();
}

export async function sendPartnerNudge(message) {
  const res = await fetch(`${API_BASE}/partner/nudge`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message })
  });
  return res.json();
}

// ================= GEMINI AI ASSISTANT =================
export async function askGeminiAi(prompt, apiKey) {
  const res = await fetch(`${API_BASE}/ai/ask`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ prompt, apiKey })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to call Gemini AI');
  }
  return res.json();
}

export async function saveGeminiApiKey(apiKey) {
  const res = await fetch(`${API_BASE}/auth/api-key`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ gemini_api_key: apiKey })
  });
  return res.json();
}

export function getBackupDownloadUrl() {
  const token = getAuthToken();
  return `${API_BASE}/backup/export?token=${token}`;
}

// ================= NETWORK & TIMER =================
export async function fetchNetworkInfo() {
  const res = await fetch(`${API_BASE}/network-info`);
  return res.json();
}

export async function fetchTimerState() {
  const res = await fetch(`${API_BASE}/timer`, { headers: getHeaders() });
  return res.json();
}

export async function updateTimerState(state) {
  const res = await fetch(`${API_BASE}/timer`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(state)
  });
  return res.json();
}

// ================= TARGETS =================
export async function fetchTargets() {
  const res = await fetch(`${API_BASE}/targets`, { headers: getHeaders() });
  return res.json();
}

export async function createTarget(targetData) {
  const res = await fetch(`${API_BASE}/targets`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(targetData)
  });
  return res.json();
}

export async function toggleTargetCompletion(id) {
  const res = await fetch(`${API_BASE}/targets/${id}/toggle`, {
    method: 'POST',
    headers: getHeaders()
  });
  return res.json();
}

export async function updateTarget(id, updates) {
  const res = await fetch(`${API_BASE}/targets/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  });
  return res.json();
}

export async function deleteTarget(id) {
  const res = await fetch(`${API_BASE}/targets/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return res.json();
}

// ================= SESSIONS & ANALYTICS =================
export async function fetchSessions() {
  const res = await fetch(`${API_BASE}/sessions`, { headers: getHeaders() });
  return res.json();
}

export async function saveSession(sessionData) {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(sessionData)
  });
  return res.json();
}

export async function deleteSession(id) {
  const res = await fetch(`${API_BASE}/sessions/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return res.json();
}

export async function fetchWeeklyAnalytics() {
  const res = await fetch(`${API_BASE}/analytics/weekly`, { headers: getHeaders() });
  return res.json();
}

// ================= NOTEPAD & SETTINGS =================
export async function fetchNotepad() {
  const res = await fetch(`${API_BASE}/notepad`, { headers: getHeaders() });
  return res.json();
}

export async function saveNotepad(content) {
  const res = await fetch(`${API_BASE}/notepad`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ content })
  });
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${API_BASE}/settings`, { headers: getHeaders() });
  return res.json();
}

export async function saveSettings(settingsData) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(settingsData)
  });
  return res.json();
}
