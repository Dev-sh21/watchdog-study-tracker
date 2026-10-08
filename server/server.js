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
  const { title, subject, target_date = null } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const finalSubject = subject || req.user.subjects[0] || 'General';
  const result = db.prepare(`
    INSERT INTO targets (user_id, title, subject, target_date, status, actual_seconds)
    VALUES (?, ?, ?, ?, 'todo', 0)
  `).run(req.user.id, title.trim(), finalSubject, target_date);

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
    completed_at = target.completed_at
  } = req.body;

  db.prepare(`
    UPDATE targets
    SET title = ?, subject = ?, target_date = ?, status = ?, actual_seconds = ?, started_at = ?, completed_at = ?
    WHERE id = ? AND user_id = ?
  `).run(title, subject, target_date, status, actual_seconds, started_at, completed_at, id, req.user.id);

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
  db.prepare('DELETE FROM targets WHERE id = ? AND user_id = ?').run(id, req.user.id);
  broadcastToUser(req.user.id, 'TARGET_DELETED', { id: Number(id) });
  res.json({ success: true, id: Number(id) });
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
