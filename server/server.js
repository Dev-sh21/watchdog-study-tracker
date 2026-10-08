const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { db, hashPassword, verifyPassword, EXAM_PRESETS } = require('./db');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Serve static frontend
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Store active WebSocket connections with their user_id
const clients = new Map(); // ws => userId

wss.on('connection', (ws) => {
  clients.set(ws, 1); // default to user 1

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'AUTH') {
        const token = data.token;
        const user = db.prepare('SELECT id FROM users WHERE token = ?').get(token);
        if (user) {
          clients.set(ws, user.id);
          sendTimerState(ws, user.id);
        }
      } else if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
    } catch (e) {
      console.error('WS message error:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

function sendTimerState(ws, userId) {
  const timer = db.prepare('SELECT * FROM user_timer WHERE user_id = ?').get(userId);
  if (timer) {
    ws.send(JSON.stringify({ type: 'TIMER_STATE', payload: parseTimer(timer) }));
  }
}

function broadcastToUser(userId, type, payload) {
  const message = JSON.stringify({ type, payload, userId });
  for (const [ws, uId] of clients.entries()) {
    if (uId === userId && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

function parseTimer(row) {
  if (!row) {
    return {
      is_running: false,
      elapsed_seconds: 0,
      start_time_ms: 0,
      active_target_id: null,
      active_subject: 'General',
      laps: []
    };
  }
  return {
    ...row,
    is_running: Boolean(row.is_running),
    laps: JSON.parse(row.laps || '[]')
  };
}

// Authentication Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.headers['x-auth-token'] || req.query.token;

  let user = null;
  if (token) {
    user = db.prepare('SELECT * FROM users WHERE token = ?').get(token);
  }

  // Fallback to first user if no valid token
  if (!user) {
    user = db.prepare('SELECT * FROM users ORDER BY id ASC LIMIT 1').get();
  }

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = {
    ...user,
    subjects: JSON.parse(user.subjects || '[]')
  };
  next();
}

function getNetworkIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// ======================== AUTH & PROFILE ROUTES ========================

// Get Network Info
app.get('/api/network-info', (req, res) => {
  const localIp = getNetworkIp();
  const host = req.get('host') || `${localIp}:${PORT}`;
  const port = host.includes(':3000') ? 3000 : PORT;
  res.json({
    localIp,
    clientPort: port,
    serverPort: PORT,
    clientUrl: `http://${localIp}:${port}`,
    serverUrl: `http://${localIp}:${PORT}`
  });
});

// List all registered profiles (for 1-click account switching between Devesh & Bhai)
app.get('/api/auth/users', (req, res) => {
  const users = db.prepare('SELECT id, username, name, selected_exam, exam_name, theme FROM users ORDER BY id ASC').all();
  res.json(users);
});

// Register new user
app.post('/api/auth/register', (req, res) => {
  const { username, name, password, exam = 'GATE' } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, name, and password are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Username already taken' });
  }

  const preset = EXAM_PRESETS[exam.toUpperCase()] || EXAM_PRESETS.GATE;
  const pass = hashPassword(password);
  const token = crypto.randomBytes(24).toString('hex');

  const result = db.prepare(`
    INSERT INTO users (username, name, password_hash, salt, selected_exam, exam_name, exam_date, daily_goal_hours, theme, subjects, token)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'dark', ?, ?)
  `).run(
    username.trim().toLowerCase(),
    name.trim(),
    pass.hash,
    pass.salt,
    exam.toUpperCase(),
    preset.exam_name,
    preset.exam_date,
    preset.daily_goal_hours,
    JSON.stringify(preset.subjects),
    token
  );

  const newUserId = result.lastInsertRowid;

  // Initialize timer and notepad
  db.prepare(`
    INSERT INTO user_timer (user_id, is_running, elapsed_seconds, start_time_ms, active_target_id, active_subject, laps, updated_at)
    VALUES (?, 0, 0, 0, NULL, ?, '[]', ?)
  `).run(newUserId, preset.subjects[0] || 'General', Date.now());

  db.prepare('INSERT INTO user_notepads (user_id, content) VALUES (?, ?)').run(
    newUserId,
    `# 🎯 My ${preset.exam_name} Study Notes\n- Add your formulas, syllabus checklist and revision points here!`
  );

  const createdUser = db.prepare('SELECT id, username, name, selected_exam, exam_name, exam_date, daily_goal_hours, theme, subjects, token FROM users WHERE id = ?').get(newUserId);
  res.status(201).json({
    ...createdUser,
    subjects: JSON.parse(createdUser.subjects || '[]')
  });
});

// Google Sign-In endpoint
app.post('/api/auth/google', (req, res) => {
  const { email, name, exam = 'GATE' } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Google email is required' });
  }

  const normalized = email.trim().toLowerCase();
  let user = db.prepare('SELECT * FROM users WHERE username = ?').get(normalized);

  if (!user) {
    const preset = EXAM_PRESETS[exam.toUpperCase()] || EXAM_PRESETS.GATE;
    const pass = hashPassword(crypto.randomBytes(16).toString('hex'));
    const token = crypto.randomBytes(24).toString('hex');

    const result = db.prepare(`
      INSERT INTO users (username, name, password_hash, salt, selected_exam, exam_name, exam_date, daily_goal_hours, theme, subjects, token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'dark', ?, ?)
    `).run(
      normalized,
      name || normalized.split('@')[0],
      pass.hash,
      pass.salt,
      exam.toUpperCase(),
      preset.exam_name,
      preset.exam_date,
      preset.daily_goal_hours,
      JSON.stringify(preset.subjects),
      token
    );

    const newUserId = result.lastInsertRowid;

    db.prepare(`
      INSERT INTO user_timer (user_id, is_running, elapsed_seconds, start_time_ms, active_target_id, active_subject, laps, updated_at)
      VALUES (?, 0, 0, 0, NULL, ?, '[]', ?)
    `).run(newUserId, preset.subjects[0] || 'General', Date.now());

    db.prepare('INSERT INTO user_notepads (user_id, content) VALUES (?, ?)').run(
      newUserId,
      `# 🎯 My ${preset.exam_name} Study Notes\n- Google Calendar linked!`
    );

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(newUserId);
  } else {
    if (!user.token) {
      const token = crypto.randomBytes(24).toString('hex');
      db.prepare('UPDATE users SET token = ? WHERE id = ?').run(token, user.id);
      user.token = token;
    }
  }

  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    selected_exam: user.selected_exam,
    exam_name: user.exam_name,
    exam_date: user.exam_date,
    daily_goal_hours: user.daily_goal_hours,
    theme: user.theme || 'dark',
    subjects: JSON.parse(user.subjects || '[]'),
    token: user.token
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.password_hash, user.salt)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Generate new token if not present
  let token = user.token;
  if (!token) {
    token = crypto.randomBytes(24).toString('hex');
    db.prepare('UPDATE users SET token = ? WHERE id = ?').run(token, user.id);
  }

  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    selected_exam: user.selected_exam,
    exam_name: user.exam_name,
    exam_date: user.exam_date,
    daily_goal_hours: user.daily_goal_hours,
    theme: user.theme || 'dark',
    subjects: JSON.parse(user.subjects || '[]'),
    token
  });
});

// Quick Switch Account
app.post('/api/auth/switch', (req, res) => {
  const { userId } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    selected_exam: user.selected_exam,
    exam_name: user.exam_name,
    exam_date: user.exam_date,
    daily_goal_hours: user.daily_goal_hours,
    theme: user.theme || 'dark',
    subjects: JSON.parse(user.subjects || '[]'),
    token: user.token
  });
});

// Get Current User Profile
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

// Switch Exam Preset (GATE <=> UPSC)
app.patch('/api/auth/exam', authMiddleware, (req, res) => {
  const { exam } = req.body; // 'GATE' or 'UPSC'
  const preset = EXAM_PRESETS[exam.toUpperCase()];
  if (!preset) return res.status(400).json({ error: 'Invalid exam type' });

  db.prepare(`
    UPDATE users
    SET selected_exam = ?, exam_name = ?, exam_date = ?, daily_goal_hours = ?, subjects = ?
    WHERE id = ?
  `).run(
    exam.toUpperCase(),
    preset.exam_name,
    preset.exam_date,
    preset.daily_goal_hours,
    JSON.stringify(preset.subjects),
    req.user.id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({
    ...updated,
    subjects: JSON.parse(updated.subjects || '[]')
  });
});

// Switch Theme (dark vs light)
app.patch('/api/auth/theme', authMiddleware, (req, res) => {
  const { theme } = req.body; // 'dark' | 'light'
  const validTheme = theme === 'light' ? 'light' : 'dark';

  db.prepare('UPDATE users SET theme = ? WHERE id = ?').run(validTheme, req.user.id);
  res.json({ theme: validTheme });
});

// Full Data Backup Export (Zero Data Loss Guarantee!)
app.get('/api/backup/export', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const targets = db.prepare('SELECT * FROM targets WHERE user_id = ?').all(userId);
  const sessions = db.prepare('SELECT * FROM sessions WHERE user_id = ?').all(userId);
  const notepad = db.prepare('SELECT * FROM user_notepads WHERE user_id = ?').get(userId);
  const user = db.prepare('SELECT id, username, name, selected_exam, exam_name, exam_date, daily_goal_hours, subjects, created_at FROM users WHERE id = ?').get(userId);

  const backupData = {
    exportedAt: new Date().toISOString(),
    user: { ...user, subjects: JSON.parse(user.subjects || '[]') },
    targets,
    sessions: sessions.map(s => ({ ...s, laps: JSON.parse(s.laps || '[]') })),
    notepad: notepad ? notepad.content : ''
  };

  res.setHeader('Content-Disposition', `attachment; filename="watchdog_backup_${user.username}_${Date.now()}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.json(backupData);
});

// ======================== TIMER ROUTES (USER-SCOPED) ========================

app.get('/api/timer', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT * FROM user_timer WHERE user_id = ?').get(req.user.id);
  res.json(parseTimer(row));
});

app.post('/api/timer', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const {
    is_running = 0,
    elapsed_seconds = 0,
    start_time_ms = 0,
    active_target_id = null,
    active_subject = req.user.subjects[0] || 'General',
    laps = []
  } = req.body;

  db.prepare(`
    INSERT INTO user_timer (user_id, is_running, elapsed_seconds, start_time_ms, active_target_id, active_subject, laps, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      is_running = excluded.is_running,
      elapsed_seconds = excluded.elapsed_seconds,
      start_time_ms = excluded.start_time_ms,
      active_target_id = excluded.active_target_id,
      active_subject = excluded.active_subject,
      laps = excluded.laps,
      updated_at = excluded.updated_at
  `).run(
    userId,
    is_running ? 1 : 0,
    elapsed_seconds,
    start_time_ms,
    active_target_id,
    active_subject,
    JSON.stringify(laps),
    Date.now()
  );

  const updated = parseTimer(db.prepare('SELECT * FROM user_timer WHERE user_id = ?').get(userId));
  broadcastToUser(userId, 'TIMER_UPDATE', updated);
  res.json(updated);
});

// ======================== TARGETS ROUTES (USER-SCOPED) ========================

app.get('/api/targets', authMiddleware, (req, res) => {
  const targets = db.prepare(`
    SELECT * FROM targets
    WHERE user_id = ?
    ORDER BY CASE WHEN status = 'completed' THEN 1 ELSE 0 END ASC, id DESC
  `).all(req.user.id);
  res.json(targets);
});

app.post('/api/targets', authMiddleware, (req, res) => {
  const { title, subject, target_date = null, google_event_id = '', gemini_tip = '' } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const finalSubject = subject || req.user.subjects[0] || 'General';
  const result = db.prepare(`
    INSERT INTO targets (user_id, title, subject, target_date, status, actual_seconds, google_event_id, gemini_tip)
    VALUES (?, ?, ?, ?, 'todo', 0, ?, ?)
  `).run(req.user.id, title.trim(), finalSubject, target_date, google_event_id || '', gemini_tip || '');

  const newTarget = db.prepare('SELECT * FROM targets WHERE id = ?').get(result.lastInsertRowid);
  broadcastToUser(req.user.id, 'TARGET_CREATED', newTarget);
  res.status(201).json(newTarget);
});

app.patch('/api/targets/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const target = db.prepare('SELECT * FROM targets WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!target) return res.status(404).json({ error: 'Target not found' });

  const {
    title = target.title,
    subject = target.subject,
    target_date = target.target_date,
    status = target.status,
    actual_seconds = target.actual_seconds,
    started_at = target.started_at,
    completed_at = target.completed_at,
    google_event_id = target.google_event_id,
    gemini_tip = target.gemini_tip
  } = req.body;

  db.prepare(`
    UPDATE targets
    SET title = ?, subject = ?, target_date = ?, status = ?, actual_seconds = ?, started_at = ?, completed_at = ?, google_event_id = ?, gemini_tip = ?
    WHERE id = ? AND user_id = ?
  `).run(title, subject, target_date, status, actual_seconds, started_at, completed_at, google_event_id, gemini_tip, id, req.user.id);

  const updated = db.prepare('SELECT * FROM targets WHERE id = ?').get(id);
  broadcastToUser(req.user.id, 'TARGET_UPDATED', updated);
  res.json(updated);
});

app.post('/api/targets/:id/toggle', authMiddleware, (req, res) => {
  const { id } = req.params;
  const target = db.prepare('SELECT * FROM targets WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!target) return res.status(404).json({ error: 'Target not found' });

  const timer = db.prepare('SELECT * FROM user_timer WHERE user_id = ?').get(req.user.id);
  let newStatus = target.status === 'completed' ? 'todo' : 'completed';
  let completed_at = null;
  let addedSeconds = 0;

  if (newStatus === 'completed') {
    completed_at = new Date().toISOString();
    if (timer && timer.active_target_id === target.id && timer.elapsed_seconds > 0) {
      addedSeconds = timer.elapsed_seconds;
    }
  }

  const totalActual = (target.actual_seconds || 0) + addedSeconds;

  db.prepare(`
    UPDATE targets
    SET status = ?, completed_at = ?, actual_seconds = ?
    WHERE id = ? AND user_id = ?
  `).run(newStatus, completed_at, totalActual, id, req.user.id);

  const updated = db.prepare('SELECT * FROM targets WHERE id = ?').get(id);

  function formatDuration(sec) {
    if (!sec || sec <= 0) return 'Just started';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const parts = [];
    if (h > 0) parts.push(`${h} hr${h > 1 ? 's' : ''}`);
    if (m > 0) parts.push(`${m} min${m > 1 ? 's' : ''}`);
    if (s > 0 || parts.length === 0) parts.push(`${s} sec`);
    return parts.join(' ');
  }

  const responseData = {
    target: updated,
    wasCompleted: newStatus === 'completed',
    timeTakenFormatted: formatDuration(totalActual),
    timeTakenSeconds: totalActual
  };

  broadcastToUser(req.user.id, 'TARGET_TOGGLED', responseData);
  res.json(responseData);
});

app.delete('/api/targets/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const target = db.prepare('SELECT * FROM targets WHERE id = ? AND user_id = ?').get(id, req.user.id);
  db.prepare('DELETE FROM targets WHERE id = ? AND user_id = ?').run(id, req.user.id);
  broadcastToUser(req.user.id, 'TARGET_DELETED', { id: Number(id), google_event_id: target ? target.google_event_id : '' });
  res.json({ success: true, id: Number(id), google_event_id: target ? target.google_event_id : '' });
});

// ======================== SESSIONS ROUTES (USER-SCOPED) ========================

app.get('/api/sessions', authMiddleware, (req, res) => {
  const sessions = db.prepare(`
    SELECT s.*, t.title as target_title
    FROM sessions s
    LEFT JOIN targets t ON s.target_id = t.id
    WHERE s.user_id = ?
    ORDER BY s.id DESC
    LIMIT 100
  `).all(req.user.id);

  const parsed = sessions.map(s => ({
    ...s,
    laps: JSON.parse(s.laps || '[]')
  }));

  res.json(parsed);
});

app.post('/api/sessions', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const {
    subject,
    target_id = null,
    duration_seconds,
    start_time,
    end_time,
    laps = [],
    notes = ''
  } = req.body;

  if (!duration_seconds || duration_seconds <= 0) {
    return res.status(400).json({ error: 'Duration must be greater than 0' });
  }

  const finalSubject = subject || req.user.subjects[0] || 'General';
  const nowIso = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO sessions (user_id, subject, target_id, duration_seconds, start_time, end_time, laps, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    finalSubject,
    target_id || null,
    duration_seconds,
    start_time || nowIso,
    end_time || nowIso,
    JSON.stringify(laps),
    notes
  );

  if (target_id) {
    db.prepare(`
      UPDATE targets
      SET actual_seconds = actual_seconds + ?
      WHERE id = ? AND user_id = ?
    `).run(duration_seconds, target_id, userId);
  }

  // Reset user's timer
  db.prepare(`
    UPDATE user_timer
    SET is_running = 0, elapsed_seconds = 0, start_time_ms = 0, laps = '[]'
    WHERE user_id = ?
  `).run(userId);

  const newSession = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);
  const parsed = { ...newSession, laps: JSON.parse(newSession.laps || '[]') };

  broadcastToUser(userId, 'SESSION_SAVED', parsed);
  broadcastToUser(userId, 'TIMER_UPDATE', parseTimer(db.prepare('SELECT * FROM user_timer WHERE user_id = ?').get(userId)));

  res.status(201).json(parsed);
});

app.delete('/api/sessions/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?').run(id, req.user.id);
  broadcastToUser(req.user.id, 'SESSION_DELETED', { id: Number(id) });
  res.json({ success: true, id: Number(id) });
});

// ======================== WEEKLY ANALYTICS (USER-SCOPED) ========================

app.get('/api/analytics/weekly', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  
  const dayOfWeek = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekData = [];

  let weeklyTotalSeconds = 0;
  let activeDaysCount = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    
    const dayStats = db.prepare(`
      SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds, COUNT(*) as session_count
      FROM sessions
      WHERE user_id = ? AND date(created_at) = ?
    `).get(userId, dateStr);

    const sec = dayStats ? dayStats.total_seconds : 0;
    weeklyTotalSeconds += sec;
    if (sec > 0) activeDaysCount++;

    weekData.push({
      day: daysOfWeek[i],
      date: dateStr,
      seconds: sec,
      hours: Number((sec / 3600).toFixed(2)),
      isToday: d.toDateString() === now.toDateString(),
      sessionCount: dayStats ? dayStats.session_count : 0
    });
  }

  const todayStr = now.toISOString().split('T')[0];
  const todayStats = db.prepare(`
    SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds
    FROM sessions
    WHERE user_id = ? AND date(created_at) = ?
  `).get(userId, todayStr);
  const todaySeconds = todayStats ? todayStats.total_seconds : 0;

  const allTimeStats = db.prepare(`
    SELECT 
      COALESCE(SUM(duration_seconds), 0) as total_seconds,
      COUNT(DISTINCT date(created_at)) as distinct_days,
      COUNT(*) as total_sessions
    FROM sessions
    WHERE user_id = ?
  `).get(userId);

  const totalAllTimeSeconds = allTimeStats.total_seconds || 0;
  const distinctDays = Math.max(1, allTimeStats.distinct_days || 1);
  const overallDailyAverageSeconds = Math.round(totalAllTimeSeconds / distinctDays);

  const weeklyAverage7Days = Math.round(weeklyTotalSeconds / 7);
  const weeklyAverageActiveDays = activeDaysCount > 0 ? Math.round(weeklyTotalSeconds / activeDaysCount) : 0;

  // Streak
  const allDistinctDates = db.prepare(`
    SELECT DISTINCT date(created_at) as study_date
    FROM sessions
    WHERE user_id = ?
    ORDER BY study_date DESC
  `).all(userId).map(r => r.study_date);

  let currentStreak = 0;
  let checkDate = new Date(now);
  const studiedToday = allDistinctDates.includes(todayStr);
  if (!studiedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const formatted = checkDate.toISOString().split('T')[0];
    if (allDistinctDates.includes(formatted)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const subjectBreakdown = db.prepare(`
    SELECT subject, COALESCE(SUM(duration_seconds), 0) as total_seconds, COUNT(*) as count
    FROM sessions
    WHERE user_id = ?
    GROUP BY subject
    ORDER BY total_seconds DESC
  `).all(userId).map(s => ({
    subject: s.subject,
    seconds: s.total_seconds,
    hours: Number((s.total_seconds / 3600).toFixed(2)),
    count: s.count
  }));

  res.json({
    weekData,
    weeklyTotalSeconds,
    weeklyTotalHours: Number((weeklyTotalSeconds / 3600).toFixed(2)),
    todaySeconds,
    todayHours: Number((todaySeconds / 3600).toFixed(2)),
    weeklyAverage7DaysSeconds: weeklyAverage7Days,
    weeklyAverage7DaysHours: Number((weeklyAverage7Days / 3600).toFixed(2)),
    weeklyAverageActiveDaysSeconds: weeklyAverageActiveDays,
    weeklyAverageActiveDaysHours: Number((weeklyAverageActiveDays / 3600).toFixed(2)),
    overallDailyAverageSeconds,
    overallDailyAverageHours: Number((overallDailyAverageSeconds / 3600).toFixed(2)),
    currentStreak,
    totalSessions: allTimeStats.total_sessions || 0,
    subjectBreakdown
  });
});

// ======================== NOTEPAD & SETTINGS ROUTES ========================

app.get('/api/notepad', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT * FROM user_notepads WHERE user_id = ?').get(req.user.id);
  res.json({ content: row ? row.content : '', updated_at: row ? row.updated_at : null });
});

app.put('/api/notepad', authMiddleware, (req, res) => {
  const { content } = req.body;
  db.prepare(`
    INSERT INTO user_notepads (user_id, content, updated_at)
    VALUES (?, ?, datetime('now', 'localtime'))
    ON CONFLICT(user_id) DO UPDATE SET
      content = excluded.content,
      updated_at = excluded.updated_at
  `).run(req.user.id, content || '');

  const row = db.prepare('SELECT * FROM user_notepads WHERE user_id = ?').get(req.user.id);
  broadcastToUser(req.user.id, 'NOTEPAD_UPDATED', row);
  res.json(row);
});

app.get('/api/settings', authMiddleware, (req, res) => {
  res.json(req.user);
});

app.put('/api/settings', authMiddleware, (req, res) => {
  const { exam_name, exam_date, daily_goal_hours, subjects } = req.body;

  db.prepare(`
    UPDATE users
    SET exam_name = ?, exam_date = ?, daily_goal_hours = ?, subjects = ?
    WHERE id = ?
  `).run(
    exam_name || req.user.exam_name,
    exam_date || req.user.exam_date,
    daily_goal_hours || req.user.daily_goal_hours,
    subjects ? JSON.stringify(subjects) : JSON.stringify(req.user.subjects),
    req.user.id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({
    ...updated,
    subjects: JSON.parse(updated.subjects || '[]')
  });
});

// ======================== STUDY PARTNER (BHAI'S PROGRESS) ========================

app.get('/api/partner/progress', authMiddleware, (req, res) => {
  const currentUserId = req.user.id;

  // If Devesh (1), partner is Sarvesh (2). If Sarvesh (2), partner is Devesh (1). Otherwise pick the other user.
  let partnerId = currentUserId === 1 ? 2 : 1;
  let partner = db.prepare('SELECT id, username, name, selected_exam, exam_name, exam_date, daily_goal_hours, theme FROM users WHERE id = ?').get(partnerId);

  if (!partner) {
    partner = db.prepare('SELECT id, username, name, selected_exam, exam_name, exam_date, daily_goal_hours, theme FROM users WHERE id != ? LIMIT 1').get(currentUserId);
  }

  if (!partner) {
    return res.json({ partner: null });
  }

  partnerId = partner.id;

  // Partner live timer status
  const timerRow = db.prepare('SELECT * FROM user_timer WHERE user_id = ?').get(partnerId);
  const liveTimer = parseTimer(timerRow);

  // Partner today's study seconds
  const todayStr = new Date().toISOString().split('T')[0];
  const todayStats = db.prepare(`
    SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds, COUNT(*) as count
    FROM sessions
    WHERE user_id = ? AND date(created_at) = ?
  `).get(partnerId, todayStr);
  const todaySeconds = (todayStats ? todayStats.total_seconds : 0) + (liveTimer.is_running ? liveTimer.elapsed_seconds : 0);

  // Partner weekly total seconds
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);
  const mondayStr = monday.toISOString().split('T')[0];

  const weeklyStats = db.prepare(`
    SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds
    FROM sessions
    WHERE user_id = ? AND date(created_at) >= ?
  `).get(partnerId, mondayStr);
  const weeklySeconds = (weeklyStats ? weeklyStats.total_seconds : 0) + (liveTimer.is_running ? liveTimer.elapsed_seconds : 0);

  // Partner streak
  const distinctDates = db.prepare(`
    SELECT DISTINCT date(created_at) as study_date
    FROM sessions
    WHERE user_id = ?
    ORDER BY study_date DESC
  `).all(partnerId).map(r => r.study_date);

  let currentStreak = 0;
  let checkDate = new Date(now);
  if (!distinctDates.includes(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  while (true) {
    const formatted = checkDate.toISOString().split('T')[0];
    if (distinctDates.includes(formatted)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Partner completed targets (last 5)
  const recentCompleted = db.prepare(`
    SELECT id, title, subject, actual_seconds, completed_at
    FROM targets
    WHERE user_id = ? AND status = 'completed'
    ORDER BY id DESC
    LIMIT 5
  `).all(partnerId);

  // Partner pending targets count
  const pendingCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM targets
    WHERE user_id = ? AND status != 'completed'
  `).get(partnerId).count;

  // Partner active targets
  const activeTargets = db.prepare(`
    SELECT id, title, subject, actual_seconds, status
    FROM targets
    WHERE user_id = ? AND status != 'completed'
    ORDER BY id DESC
    LIMIT 4
  `).all(partnerId);

  // Nudges between them
  const nudges = db.prepare(`
    SELECT n.*, u.name as from_name
    FROM partner_nudges n
    JOIN users u ON n.from_user_id = u.id
    WHERE (n.from_user_id = ? AND n.to_user_id = ?) OR (n.from_user_id = ? AND n.to_user_id = ?)
    ORDER BY n.id DESC
    LIMIT 6
  `).all(currentUserId, partnerId, partnerId, currentUserId);

  res.json({
    partner: {
      ...partner,
      todaySeconds,
      todayHours: Number((todaySeconds / 3600).toFixed(2)),
      weeklySeconds,
      weeklyHours: Number((weeklySeconds / 3600).toFixed(2)),
      currentStreak,
      liveTimer: {
        is_running: liveTimer.is_running,
        elapsed_seconds: liveTimer.elapsed_seconds,
        active_subject: liveTimer.active_subject
      },
      recentCompleted,
      pendingCount,
      activeTargets,
      nudges
    }
  });
});

app.post('/api/partner/nudge', authMiddleware, (req, res) => {
  const currentUserId = req.user.id;
  const partnerId = currentUserId === 1 ? 2 : 1;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const result = db.prepare(`
    INSERT INTO partner_nudges (from_user_id, to_user_id, message)
    VALUES (?, ?, ?)
  `).run(currentUserId, partnerId, message.trim());

  const nudge = db.prepare(`
    SELECT n.*, u.name as from_name
    FROM partner_nudges n
    JOIN users u ON n.from_user_id = u.id
    WHERE n.id = ?
  `).get(result.lastInsertRowid);

  broadcastToUser(partnerId, 'PARTNER_NUDGE', nudge);
  res.status(201).json(nudge);
});

// ======================== GEMINI AI STUDY ASSISTANT ========================

app.post('/api/ai/ask', authMiddleware, async (req, res) => {
  const { prompt, apiKey } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const key = apiKey || req.user.gemini_api_key || process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(400).json({
      error: 'Gemini API Key missing. Please provide your API key in Settings or input box.'
    });
  }

  // Save key to user if newly provided
  if (apiKey && apiKey !== req.user.gemini_api_key) {
    db.prepare('UPDATE users SET gemini_api_key = ? WHERE id = ?').run(apiKey.trim(), req.user.id);
  }

  const systemInstruction = `You are an elite, encouraging AI Study Mentor & Strategist for ${req.user.exam_name} in India.
User: ${req.user.name}.
Target Exam: ${req.user.exam_name} (${req.user.selected_exam}).
Daily Goal: ${req.user.daily_goal_hours} hours.
Give actionable, sharp, concise, practical advice, formula mnemonics, or customized study timetables. Format using clean markdown.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nStudent Query: ${prompt}` }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.text();
      return res.status(500).json({ error: `Gemini API error: ${errData}` });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    res.json({ text: replyText });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to call Gemini API' });
  }
});

app.patch('/api/auth/api-key', authMiddleware, (req, res) => {
  const { gemini_api_key } = req.body;
  db.prepare('UPDATE users SET gemini_api_key = ? WHERE id = ?').run(gemini_api_key || '', req.user.id);
  res.json({ success: true });
});

app.patch('/api/auth/google-calendar-token', authMiddleware, (req, res) => {
  const { token } = req.body;
  db.prepare('UPDATE users SET google_calendar_token = ? WHERE id = ?').run(token || '', req.user.id);
  res.json({ success: true });
});

// Smart AI Target Parser & Scheduler using Gemini
app.post('/api/ai/parse-target', authMiddleware, async (req, res) => {
  const { prompt, apiKey } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const key = apiKey || req.user.gemini_api_key || process.env.GEMINI_API_KEY;
  const todayStr = new Date().toISOString().split('T')[0];
  const userSubjects = req.user.subjects || [];

  const fallback = () => {
    const lower = prompt.toLowerCase();
    let matchedSubject = userSubjects[0] || 'General';
    for (const sub of userSubjects) {
      if (lower.includes(sub.toLowerCase()) || sub.toLowerCase().split(' ').some(w => w.length > 3 && lower.includes(w))) {
        matchedSubject = sub;
        break;
      }
    }
    let dur = 120;
    if (lower.includes('1 hr') || lower.includes('1 hour') || lower.includes('60 min')) dur = 60;
    else if (lower.includes('3 hr') || lower.includes('3 hour') || lower.includes('180 min')) dur = 180;
    else if (lower.includes('30 min') || lower.includes('quick')) dur = 45;

    return {
      title: prompt.trim(),
      subject: matchedSubject,
      target_date: todayStr,
      time_str: '10:00',
      duration_minutes: dur,
      exam_tip: `High-yield topic for ${req.user.selected_exam}! Focus on previous year questions & error log.`
    };
  };

  if (!key) {
    return res.json(fallback());
  }

  try {
    const promptText = `You are an elite study strategist for ${req.user.exam_name} (${req.user.selected_exam}).
Available subjects: ${JSON.stringify(userSubjects)}.
Today's date: ${todayStr}.

The student wants to schedule this study target: "${prompt}"

Return ONLY a valid JSON object (no markdown, no backticks, just raw JSON) matching:
{
  "title": "Clear, concise study goal title",
  "subject": "Exactly one subject from the available subjects list that best fits",
  "target_date": "YYYY-MM-DD",
  "time_str": "HH:MM (24-hour format)",
  "duration_minutes": 120,
  "exam_tip": "One concise, high-yield tip for this topic in ${req.user.selected_exam}"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      console.warn('Gemini target parse returned non-ok, using fallback');
      return res.json(fallback());
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return res.json({
        title: parsed.title || prompt.trim(),
        subject: userSubjects.includes(parsed.subject) ? parsed.subject : (userSubjects[0] || 'General'),
        target_date: parsed.target_date || todayStr,
        time_str: parsed.time_str || '10:00',
        duration_minutes: Number(parsed.duration_minutes) || 120,
        exam_tip: parsed.exam_tip || fallback().exam_tip
      });
    }
    return res.json(fallback());
  } catch (err) {
    console.error('Gemini parse error:', err);
    return res.json(fallback());
  }
});

// Fallback SPA routing
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.send('GATE & UPSC WatchDog Server Running.');
});

server.listen(PORT, () => {
  const ip = getNetworkIp();
  console.log(`🚀 Multi-Exam WatchDog Server (GATE & UPSC) running at:`);
  console.log(`   - Local:    http://localhost:${PORT}`);
  console.log(`   - Network:  http://${ip}:${PORT}`);
  console.log(`   - WebSocket: ws://${ip}:${PORT}/ws`);
});
