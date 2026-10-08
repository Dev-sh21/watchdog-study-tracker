const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const os = require('os');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Serve static frontend in production if built
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Store active WebSocket connections
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);

  // Send current timer state immediately on connect
  const timer = db.prepare('SELECT * FROM live_timer WHERE id = 1').get();
  if (timer) {
    ws.send(JSON.stringify({ type: 'TIMER_STATE', payload: parseTimer(timer) }));
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'PING') {
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

function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function parseTimer(row) {
  return {
    ...row,
    is_running: Boolean(row.is_running),
    laps: JSON.parse(row.laps || '[]')
  };
}

// Get network interfaces for phone sync
function getNetworkIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Pick IPv4 and non-internal
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// ======================== API ROUTES ========================

// 1. Network Info for Phone Sync
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

// 2. Live Timer Sync
app.get('/api/timer', (req, res) => {
  const row = db.prepare('SELECT * FROM live_timer WHERE id = 1').get();
  res.json(parseTimer(row));
});

app.post('/api/timer', (req, res) => {
  const {
    is_running = 0,
    elapsed_seconds = 0,
    start_time_ms = 0,
    active_target_id = null,
    active_subject = 'General',
    laps = []
  } = req.body;

  db.prepare(`
    UPDATE live_timer
    SET is_running = ?,
        elapsed_seconds = ?,
        start_time_ms = ?,
        active_target_id = ?,
        active_subject = ?,
        laps = ?,
        updated_at = ?
    WHERE id = 1
  `).run(
    is_running ? 1 : 0,
    elapsed_seconds,
    start_time_ms,
    active_target_id,
    active_subject,
    JSON.stringify(laps),
    Date.now()
  );

  const updated = parseTimer(db.prepare('SELECT * FROM live_timer WHERE id = 1').get());
  broadcast('TIMER_UPDATE', updated);
  res.json(updated);
});

// 3. Targets (Goals / Notepad)
app.get('/api/targets', (req, res) => {
  const targets = db.prepare(`
    SELECT * FROM targets
    ORDER BY CASE WHEN status = 'completed' THEN 1 ELSE 0 END ASC, id DESC
  `).all();
  res.json(targets);
});

app.post('/api/targets', (req, res) => {
  const { title, subject = 'Engineering Mathematics', target_date = null } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const result = db.prepare(`
    INSERT INTO targets (title, subject, target_date, status, actual_seconds)
    VALUES (?, ?, ?, 'todo', 0)
  `).run(title.trim(), subject, target_date);

  const newTarget = db.prepare('SELECT * FROM targets WHERE id = ?').get(result.lastInsertRowid);
  broadcast('TARGET_CREATED', newTarget);
  res.status(201).json(newTarget);
});

app.patch('/api/targets/:id', (req, res) => {
  const { id } = req.params;
  const target = db.prepare('SELECT * FROM targets WHERE id = ?').get(id);
  if (!target) return res.status(400).json({ error: 'Target not found' });

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
    WHERE id = ?
  `).run(title, subject, target_date, status, actual_seconds, started_at, completed_at, id);

  const updated = db.prepare('SELECT * FROM targets WHERE id = ?').get(id);
  broadcast('TARGET_UPDATED', updated);
  res.json(updated);
});

// Toggle Target Completion & Calculate Time Taken!
app.post('/api/targets/:id/toggle', (req, res) => {
  const { id } = req.params;
  const target = db.prepare('SELECT * FROM targets WHERE id = ?').get(id);
  if (!target) return res.status(404).json({ error: 'Target not found' });

  const timer = db.prepare('SELECT * FROM live_timer WHERE id = 1').get();
  let newStatus = target.status === 'completed' ? 'todo' : 'completed';
  let completed_at = null;
  let addedSeconds = 0;

  if (newStatus === 'completed') {
    completed_at = new Date().toISOString();
    // If current timer was tracking this target, capture its accumulated seconds!
    if (timer && timer.active_target_id === target.id && timer.elapsed_seconds > 0) {
      addedSeconds = timer.elapsed_seconds;
    }
  }

  const totalActual = (target.actual_seconds || 0) + addedSeconds;

  db.prepare(`
    UPDATE targets
    SET status = ?, completed_at = ?, actual_seconds = ?
    WHERE id = ?
  `).run(newStatus, completed_at, totalActual, id);

  const updated = db.prepare('SELECT * FROM targets WHERE id = ?').get(id);

  // Format time taken in human readable string (e.g., "1 hr 45 min 20 sec" or "32 min 10 sec")
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

  broadcast('TARGET_TOGGLED', responseData);
  res.json(responseData);
});

app.delete('/api/targets/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM targets WHERE id = ?').run(id);
  broadcast('TARGET_DELETED', { id: Number(id) });
  res.json({ success: true, id: Number(id) });
});

// 4. Study Sessions
app.get('/api/sessions', (req, res) => {
  const sessions = db.prepare(`
    SELECT s.*, t.title as target_title
    FROM sessions s
    LEFT JOIN targets t ON s.target_id = t.id
    ORDER BY s.id DESC
    LIMIT 100
  `).all();

  const parsed = sessions.map(s => ({
    ...s,
    laps: JSON.parse(s.laps || '[]')
  }));

  res.json(parsed);
});

app.post('/api/sessions', (req, res) => {
  const {
    subject = 'General',
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

  const nowIso = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO sessions (subject, target_id, duration_seconds, start_time, end_time, laps, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    subject,
    target_id || null,
    duration_seconds,
    start_time || nowIso,
    end_time || nowIso,
    JSON.stringify(laps),
    notes
  );

  // If a target was tracked, add this duration to the target's actual_seconds
  if (target_id) {
    db.prepare(`
      UPDATE targets
      SET actual_seconds = actual_seconds + ?
      WHERE id = ?
    `).run(duration_seconds, target_id);
  }

  // Reset live timer to 0
  db.prepare(`
    UPDATE live_timer
    SET is_running = 0, elapsed_seconds = 0, start_time_ms = 0, laps = '[]'
    WHERE id = 1
  `).run();

  const newSession = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);
  const parsed = { ...newSession, laps: JSON.parse(newSession.laps || '[]') };

  broadcast('SESSION_SAVED', parsed);
  broadcast('TIMER_UPDATE', parseTimer(db.prepare('SELECT * FROM live_timer WHERE id = 1').get()));

  res.status(201).json(parsed);
});

app.delete('/api/sessions/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  broadcast('SESSION_DELETED', { id: Number(id) });
  res.json({ success: true, id: Number(id) });
});

// 5. Weekly Analytics & Averages
app.get('/api/analytics/weekly', (req, res) => {
  const now = new Date();
  
  // Calculate current week (Monday to Sunday) or past 7 days
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
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
    
    // Sum duration of sessions on that day
    const dayStats = db.prepare(`
      SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds, COUNT(*) as session_count
      FROM sessions
      WHERE date(created_at) = ?
    `).get(dateStr);

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

  // Today's total
  const todayStr = now.toISOString().split('T')[0];
  const todayStats = db.prepare(`
    SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds
    FROM sessions
    WHERE date(created_at) = ?
  `).get(todayStr);
  const todaySeconds = todayStats ? todayStats.total_seconds : 0;

  // Total all-time stats
  const allTimeStats = db.prepare(`
    SELECT 
      COALESCE(SUM(duration_seconds), 0) as total_seconds,
      COUNT(DISTINCT date(created_at)) as distinct_days,
      COUNT(*) as total_sessions
    FROM sessions
  `).get();

  const totalAllTimeSeconds = allTimeStats.total_seconds || 0;
  const distinctDays = Math.max(1, allTimeStats.distinct_days || 1);
  const overallDailyAverageSeconds = Math.round(totalAllTimeSeconds / distinctDays);

  // Weekly daily average (across the 7 days of the week, or across active days)
  const weeklyAverage7Days = Math.round(weeklyTotalSeconds / 7);
  const weeklyAverageActiveDays = activeDaysCount > 0 ? Math.round(weeklyTotalSeconds / activeDaysCount) : 0;

  // Streak calculation (consecutive days with at least 1 study session)
  const allDistinctDates = db.prepare(`
    SELECT DISTINCT date(created_at) as study_date
    FROM sessions
    ORDER BY study_date DESC
  `).all().map(r => r.study_date);

  let currentStreak = 0;
  let checkDate = new Date(now);
  
  // If not studied today yet, check if studied yesterday to keep streak alive
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

  // Subject distribution
  const subjectBreakdown = db.prepare(`
    SELECT subject, COALESCE(SUM(duration_seconds), 0) as total_seconds, COUNT(*) as count
    FROM sessions
    GROUP BY subject
    ORDER BY total_seconds DESC
  `).all().map(s => ({
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

// 6. Persistent Notepad
app.get('/api/notepad', (req, res) => {
  const row = db.prepare('SELECT * FROM notepad WHERE id = 1').get();
  res.json({ content: row ? row.content : '', updated_at: row ? row.updated_at : null });
});

app.put('/api/notepad', (req, res) => {
  const { content } = req.body;
  db.prepare(`
    UPDATE notepad
    SET content = ?, updated_at = datetime('now', 'localtime')
    WHERE id = 1
  `).run(content || '');

  const row = db.prepare('SELECT * FROM notepad WHERE id = 1').get();
  broadcast('NOTEPAD_UPDATED', row);
  res.json(row);
});

// 7. Settings
app.get('/api/settings', (req, res) => {
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json({
    ...row,
    subjects: JSON.parse(row.subjects || '[]')
  });
});

app.put('/api/settings', (req, res) => {
  const { exam_name, exam_date, daily_goal_hours, subjects } = req.body;
  const current = db.prepare('SELECT * FROM settings WHERE id = 1').get();

  db.prepare(`
    UPDATE settings
    SET exam_name = ?,
        exam_date = ?,
        daily_goal_hours = ?,
        subjects = ?
    WHERE id = 1
  `).run(
    exam_name || current.exam_name,
    exam_date || current.exam_date,
    daily_goal_hours || current.daily_goal_hours,
    subjects ? JSON.stringify(subjects) : current.subjects
  );

  const updated = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json({
    ...updated,
    subjects: JSON.parse(updated.subjects || '[]')
  });
});

// For any other route, serve index.html if built, otherwise message
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.send('GATE WatchDog Server Running. Frontend is active on port 3000.');
});

server.listen(PORT, '0.0.0.0', () => {
  const ip = getNetworkIp();
  console.log(`🚀 GATE WatchDog Server running at:`);
  console.log(`   - Local:    http://localhost:${PORT}`);
  console.log(`   - Network:  http://${ip}:${PORT}`);
  console.log(`   - WebSocket: ws://${ip}:${PORT}/ws`);
});
