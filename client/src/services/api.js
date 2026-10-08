// API service to interact with GATE WatchDog backend

// Determine base URL: works seamlessly whether accessed from localhost or phone (http://10.207.43.176:3000)
const API_BASE = '/api';

export async function fetchNetworkInfo() {
  const res = await fetch(`${API_BASE}/network-info`);
  return res.json();
}

export async function fetchTimerState() {
  const res = await fetch(`${API_BASE}/timer`);
  return res.json();
}

export async function updateTimerState(state) {
  const res = await fetch(`${API_BASE}/timer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state)
  });
  return res.json();
}

export async function fetchTargets() {
  const res = await fetch(`${API_BASE}/targets`);
  return res.json();
}

export async function createTarget(targetData) {
  const res = await fetch(`${API_BASE}/targets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(targetData)
  });
  return res.json();
}

export async function toggleTargetCompletion(id) {
  const res = await fetch(`${API_BASE}/targets/${id}/toggle`, {
    method: 'POST'
  });
  return res.json();
}

export async function updateTarget(id, updates) {
  const res = await fetch(`${API_BASE}/targets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return res.json();
}

export async function deleteTarget(id) {
  const res = await fetch(`${API_BASE}/targets/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function fetchSessions() {
  const res = await fetch(`${API_BASE}/sessions`);
  return res.json();
}

export async function saveSession(sessionData) {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData)
  });
  return res.json();
}

export async function deleteSession(id) {
  const res = await fetch(`${API_BASE}/sessions/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function fetchWeeklyAnalytics() {
  const res = await fetch(`${API_BASE}/analytics/weekly`);
  return res.json();
}

export async function fetchNotepad() {
  const res = await fetch(`${API_BASE}/notepad`);
  return res.json();
}

export async function saveNotepad(content) {
  const res = await fetch(`${API_BASE}/notepad`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${API_BASE}/settings`);
  return res.json();
}

export async function saveSettings(settingsData) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settingsData)
  });
  return res.json();
}
