const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'watchdog.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Password hashing utility using Node.js crypto
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === verifyHash;
}

const EXAM_PRESETS = {
  GATE: {
    exam_name: 'GATE CSE / DA',
    exam_date: '2027-02-06',
    daily_goal_hours: 6.0,
    subjects: [
      'Engineering Mathematics',
      'General Aptitude',
      'Algorithms & DS',
      'Operating Systems',
      'Computer Networks',
      'Database Systems (DBMS)',
      'Theory of Computation',
      'Compiler Design',
      'Computer Architecture',
      'Digital Logic'
    ]
  },
  UPSC: {
    exam_name: 'UPSC CSE (Civil Services)',
    exam_date: '2027-05-23',
    daily_goal_hours: 8.0,
    subjects: [
      'Indian Polity & Governance',
      'Modern Indian History & Culture',
      'Geography & Environment',
      'Indian Economy',
      'Ethics & Integrity (GS-4)',
      'Science & Technology',
      'CSAT (Paper II)',
      'Current Affairs & Editorial',
      'Optional Subject',
      'Answer Writing Practice'
    ]
  }
};

// Safe column addition helper to prevent data loss
function ensureColumn(tableName, columnName, columnDef) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = columns.some((col) => col.name === columnName);
  if (!exists) {
    db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`).run();
  }
}

// 1. Create Core Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    selected_exam TEXT DEFAULT 'GATE', -- 'GATE' | 'UPSC' | 'OTHER'
    exam_name TEXT DEFAULT 'GATE CSE / DA',
    exam_date TEXT DEFAULT '2027-02-06',
    daily_goal_hours REAL DEFAULT 6.0,
    theme TEXT DEFAULT 'dark', -- 'dark' | 'light'
    subjects TEXT,
    token TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
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
    user_id INTEGER DEFAULT 1,
    subject TEXT DEFAULT 'General',
    target_id INTEGER REFERENCES targets(id) ON DELETE SET NULL,
    duration_seconds INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    laps TEXT DEFAULT '[]',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS user_timer (
    user_id INTEGER PRIMARY KEY,
    is_running INTEGER DEFAULT 0,
    elapsed_seconds INTEGER DEFAULT 0,
    start_time_ms INTEGER DEFAULT 0,
    active_target_id INTEGER DEFAULT NULL,
    active_subject TEXT DEFAULT 'General',
    laps TEXT DEFAULT '[]',
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS user_notepads (
    user_id INTEGER PRIMARY KEY,
    content TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS partner_nudges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

// Ensure columns exist on existing tables
ensureColumn('targets', 'user_id', 'INTEGER DEFAULT 1');
ensureColumn('targets', 'google_event_id', "TEXT DEFAULT ''");
ensureColumn('targets', 'gemini_tip', "TEXT DEFAULT ''");
ensureColumn('sessions', 'user_id', 'INTEGER DEFAULT 1');
ensureColumn('users', 'theme', "TEXT DEFAULT 'yellow'");
ensureColumn('users', 'gemini_api_key', "TEXT DEFAULT ''");
ensureColumn('users', 'google_calendar_token', "TEXT DEFAULT ''");

// Seed Users if none exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (username, name, password_hash, salt, selected_exam, exam_name, exam_date, daily_goal_hours, theme, subjects, token)
    VALUES (@username, @name, @password_hash, @salt, @selected_exam, @exam_name, @exam_date, @daily_goal_hours, @theme, @subjects, @token)
  `);

  // User 1: Devesh (GATE)
  const pass1 = hashPassword('123456');
  const token1 = crypto.randomBytes(24).toString('hex');
  insertUser.run({
    username: 'devesh',
    name: 'Devesh Mishra',
    password_hash: pass1.hash,
    salt: pass1.salt,
    selected_exam: 'GATE',
    exam_name: EXAM_PRESETS.GATE.exam_name,
    exam_date: EXAM_PRESETS.GATE.exam_date,
    daily_goal_hours: EXAM_PRESETS.GATE.daily_goal_hours,
    theme: 'dark',
    subjects: JSON.stringify(EXAM_PRESETS.GATE.subjects),
    token: token1
  });

  // User 2: Bhai (UPSC)
  const pass2 = hashPassword('123456');
  const token2 = crypto.randomBytes(24).toString('hex');
  insertUser.run({
    username: 'sarvesh',
    name: 'Sarvesh Mishra',
    password_hash: pass2.hash,
    salt: pass2.salt,
    selected_exam: 'UPSC',
    exam_name: EXAM_PRESETS.UPSC.exam_name,
    exam_date: EXAM_PRESETS.UPSC.exam_date,
    daily_goal_hours: EXAM_PRESETS.UPSC.daily_goal_hours,
    theme: 'dark',
    subjects: JSON.stringify(EXAM_PRESETS.UPSC.subjects),
    token: token2
  });

  // Seed user_timer & user_notepads for both
  db.prepare(`
    INSERT OR IGNORE INTO user_timer (user_id, is_running, elapsed_seconds, start_time_ms, active_target_id, active_subject, laps, updated_at)
    VALUES (1, 0, 0, 0, NULL, 'Engineering Mathematics', '[]', ?),
           (2, 0, 0, 0, NULL, 'Indian Polity & Governance', '[]', ?)
  `).run(Date.now(), Date.now());

  // Notepad for Devesh (GATE)
  const gateNotes = `# 🎯 GATE CSE / DA Preparation Notes
## 📌 Important Formulas & Reminders:
- Master Theorem: T(n) = aT(n/b) + f(n)
- Eigenvalues: Sum = Trace, Product = Determinant
- Virtual Address = Page Number (p) + Offset (d)
`;
  db.prepare('INSERT OR IGNORE INTO user_notepads (user_id, content) VALUES (1, ?)').run(gateNotes);

  // Notepad for Bhai (UPSC)
  const upscNotes = `# 🇮🇳 UPSC Civil Services Examination (CSE) Strategy & Notes
## 📌 High-Yield Revision Points:
- **Polity:** Article 14-32 (Fundamental Rights), Article 36-51 (DPSP), Article 51A (Fundamental Duties)
- **Economy:** Monetary Policy Committee (MPC) - Repo Rate vs Reverse Repo, Fiscal Deficit formula
- **Geography:** Monsoon Mechanism, El-Niño / La-Niña, Himalayan vs Peninsular Rivers
- **Modern History:** 1857 Revolt leaders, Non-Cooperation Movement (1920), Civil Disobedience (1930)

## 🎯 Daily Study Schedule:
1. 07:00 - 09:30: The Hindu Editorial & Current Affairs Notes
2. 10:30 - 01:30: Core GS-2 Polity (M. Laxmikanth)
3. 03:00 - 05:30: Optional Subject (Paper 1 / Paper 2)
4. 06:30 - 08:30: Answer Writing Practice (2 GS Mains questions) + CSAT revision!
`;
  db.prepare('INSERT OR IGNORE INTO user_notepads (user_id, content) VALUES (2, ?)').run(upscNotes);

  // Seed sample UPSC targets for Bhai
  const upscTargets = [
    { title: 'Polity: Laxmikanth Ch 7-11 (Fundamental Rights & Duties)', subject: 'Indian Polity & Governance', status: 'in_progress', actual_seconds: 7200 },
    { title: 'Modern History: Spectrum 1919-1947 Gandhian Era Timeline', subject: 'Modern Indian History & Culture', status: 'todo', actual_seconds: 0 },
    { title: 'Daily Answer Writing: 2 GS-2 Mains Questions with Model Answers', subject: 'Answer Writing Practice', status: 'completed', actual_seconds: 3600, completed_at: new Date(Date.now() - 3600000 * 3).toISOString() }
  ];

  const insertTarget = db.prepare(`
    INSERT INTO targets (user_id, title, subject, status, actual_seconds, completed_at)
    VALUES (2, @title, @subject, @status, @actual_seconds, @completed_at)
  `);

  for (const t of upscTargets) {
    insertTarget.run({
      title: t.title,
      subject: t.subject,
      status: t.status,
      actual_seconds: t.actual_seconds,
      completed_at: t.completed_at || null
    });
  }

  // Seed sample UPSC study sessions
  const insertSession = db.prepare(`
    INSERT INTO sessions (user_id, subject, duration_seconds, start_time, end_time, laps, notes, created_at)
    VALUES (2, @subject, @duration_seconds, @start_time, @end_time, @laps, @notes, @created_at)
  `);

  const now = new Date();
  const formatSqliteDate = (d) => d.toISOString().replace('T', ' ').substring(0, 19);

  const sampleUpscSessions = [
    { daysAgo: 2, duration: 25200, subject: 'Indian Polity & Governance', notes: 'Laxmikanth Ch 7-10 completed' },
    { daysAgo: 1, duration: 28800, subject: 'Current Affairs & Editorial', notes: 'The Hindu monthly compilation' },
    { daysAgo: 0, duration: 18000, subject: 'Indian Economy', notes: 'Budget & Economic Survey highlights' }
  ];

  for (const s of sampleUpscSessions) {
    const sDate = new Date(now.getTime() - s.daysAgo * 86400000);
    insertSession.run({
      subject: s.subject,
      duration_seconds: s.duration,
      start_time: new Date(sDate.getTime() - s.duration * 1000).toISOString(),
      end_time: sDate.toISOString(),
      laps: '[]',
      notes: s.notes,
      created_at: formatSqliteDate(sDate)
    });
  }
}

module.exports = {
  db,
  hashPassword,
  verifyPassword,
  EXAM_PRESETS
};
