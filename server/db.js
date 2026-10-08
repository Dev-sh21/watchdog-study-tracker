const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'watchdog.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subject TEXT DEFAULT 'General',
    target_date TEXT,
    actual_seconds INTEGER DEFAULT 0,
    status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'completed'
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT DEFAULT 'General',
    target_id INTEGER REFERENCES targets(id) ON DELETE SET NULL,
    duration_seconds INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    laps TEXT DEFAULT '[]',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS live_timer (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    is_running INTEGER DEFAULT 0,
    elapsed_seconds INTEGER DEFAULT 0,
    start_time_ms INTEGER DEFAULT 0,
    active_target_id INTEGER DEFAULT NULL,
    active_subject TEXT DEFAULT 'General',
    laps TEXT DEFAULT '[]',
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS notepad (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    content TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    exam_name TEXT DEFAULT 'GATE CSE / DA',
    exam_date TEXT DEFAULT '2027-02-06',
    daily_goal_hours REAL DEFAULT 6.0,
    subjects TEXT DEFAULT '["Engineering Mathematics","General Aptitude","Algorithms & DS","Operating Systems","Computer Networks","Database Systems (DBMS)","Theory of Computation","Compiler Design","Computer Architecture","Digital Logic"]'
  );
`);

// Seed live_timer if empty
const timerRow = db.prepare('SELECT id FROM live_timer WHERE id = 1').get();
if (!timerRow) {
  db.prepare(`
    INSERT INTO live_timer (id, is_running, elapsed_seconds, start_time_ms, active_target_id, active_subject, laps, updated_at)
    VALUES (1, 0, 0, 0, NULL, 'Engineering Mathematics', '[]', ?)
  `).run(Date.now());
}

// Seed notepad if empty
const notepadRow = db.prepare('SELECT id FROM notepad WHERE id = 1').get();
if (!notepadRow) {
  const initialNote = `# 🎯 GATE Preparation Notepad & Quick Reference

## 📌 High-Yield Formulas & Reminders:
- **Time Complexity:** Master Theorem for Divide & Conquer: T(n) = aT(n/b) + f(n)
- **Eigenvalues:** Sum of eigenvalues = Trace of matrix; Product = Determinant
- **OS Paging:** Virtual address = Page Number (p) + Offset (d)
- **CN:** Bandwidth-Delay Product = Bandwidth * Round Trip Time (RTT)

## 📝 Today's Strategy:
1. Finish Linear Algebra Eigenvalues PYQs
2. Solve 20 questions from OS CPU Scheduling
3. Review mistakes in short revision notebook!
`;
  db.prepare('INSERT INTO notepad (id, content) VALUES (1, ?)').run(initialNote);
}

// Seed settings if empty
const settingsRow = db.prepare('SELECT id FROM settings WHERE id = 1').get();
if (!settingsRow) {
  db.prepare('INSERT INTO settings (id) VALUES (1)').run();
}

// Seed initial sample targets if table is empty so user gets a great first impression
const targetCount = db.prepare('SELECT COUNT(*) as count FROM targets').get().count;
if (targetCount === 0) {
  const seedTargets = [
    { title: 'Linear Algebra - Eigenvalues & Vectors PYQ (2018-2024)', subject: 'Engineering Mathematics', status: 'in_progress', actual_seconds: 3600 },
    { title: 'OS Process Synchronization & Semaphore Problems', subject: 'Operating Systems', status: 'todo', actual_seconds: 0 },
    { title: 'Algorithms - Dynamic Programming Longest Common Subsequence', subject: 'Algorithms & DS', status: 'completed', actual_seconds: 4500, completed_at: new Date(Date.now() - 3600000 * 2).toISOString() }
  ];

  const insertTarget = db.prepare(`
    INSERT INTO targets (title, subject, status, actual_seconds, completed_at)
    VALUES (@title, @subject, @status, @actual_seconds, @completed_at)
  `);

  for (const t of seedTargets) {
    insertTarget.run({
      title: t.title,
      subject: t.subject,
      status: t.status,
      actual_seconds: t.actual_seconds,
      completed_at: t.completed_at || null
    });
  }

  // Also seed a couple of study sessions for the past few days to make analytics charts immediately helpful!
  const insertSession = db.prepare(`
    INSERT INTO sessions (subject, duration_seconds, start_time, end_time, laps, notes, created_at)
    VALUES (@subject, @duration_seconds, @start_time, @end_time, @laps, @notes, @created_at)
  `);

  const now = new Date();
  const formatSqliteDate = (d) => {
    return d.toISOString().replace('T', ' ').substring(0, 19);
  };

  // Seed sessions for last 4 days
  const sampleSessions = [
    { daysAgo: 3, duration: 14400, subject: 'Engineering Mathematics', laps: '[{"lap":1,"lapTime":3600,"total":3600},{"lap":2,"lapTime":3600,"total":7200}]' },
    { daysAgo: 2, duration: 18000, subject: 'Operating Systems', laps: '[{"lap":1,"lapTime":4500,"total":4500}]' },
    { daysAgo: 1, duration: 21600, subject: 'Algorithms & DS', laps: '[{"lap":1,"lapTime":7200,"total":7200}]' },
    { daysAgo: 0, duration: 10800, subject: 'Database Systems (DBMS)', laps: '[]' }
  ];

  for (const s of sampleSessions) {
    const sDate = new Date(now.getTime() - s.daysAgo * 86400000);
    const startT = new Date(sDate.getTime() - s.duration * 1000).toISOString();
    const endT = sDate.toISOString();
    insertSession.run({
      subject: s.subject,
      duration_seconds: s.duration,
      start_time: startT,
      end_time: endT,
      laps: s.laps,
      notes: 'Initial study block',
      created_at: formatSqliteDate(sDate)
    });
  }
}

module.exports = db;
