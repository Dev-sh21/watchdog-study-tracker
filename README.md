# 🎯 GATE WatchDog — Exam Prep Command Center & Focus Tracker

A full-stack, mobile-synced study tracker built specifically for GATE aspirants.

---

## 🚀 Key Features

1. **⏱️ Precision Stopwatch & Clock with Lap System**
   - Clean, high-contrast digital stopwatch (`HH:MM:SS`).
   - Start, Pause, Resume, Reset controls.
   - **Laps:** Record split times, cumulative times, and add custom notes to each lap (e.g., "Theory notes", "PYQs 1-15", "Mistake review").
   - **Active Target Binding:** Directly link the stopwatch to an active GATE target so time spent is automatically attributed.
   - Keyboard hotkeys: `[Space]` to Play/Pause, `[L]` to Lap.

2. **🎯 Target Notepad with Time Spent Calculation**
   - Create and organize your GATE goals by subject.
   - **Live Time Calculation on Tick:** When you tick a target complete, the app calculates and displays the exact duration spent on that target (e.g., *"Completed in 1 hr 45 min 20 sec"*), with celebration confetti and sound effects!
   - 1-click **"Focus"** button to jump directly into the stopwatch with that goal selected.

3. **📊 Weekly Analytics & Study Averages**
   - **Weekly Total:** Total study hours for the current week (Mon–Sun).
   - **Today's Focus:** Hours studied today.
   - **Daily Averages:** Calculates both active-day average and 7-day weekly average.
   - **Overall Daily Average:** Long-term average across all study sessions.
   - **Study Streak:** Tracks consecutive active study days with streak flames.
   - **Interactive Weekly Bar Chart:** Visualizes daily study hours against your daily target goal line.
   - **Subject Distribution:** Visual breakdown of time spent on Engineering Maths, Algorithms, OS, DBMS, etc.

4. **📱 Seamless Phone Syncing (Same Wi-Fi)**
   - Click the **"Phone Sync"** button in the header or scan the generated QR code.
   - Open `http://<YOUR_LOCAL_IP>:3000` (or `:5050`) on your mobile browser (Safari, Chrome).
   - WebSocket live sync ensures that any timer action or goal completed on your phone immediately reflects on your laptop in real time!
   - Mobile-first responsive UI with bottom navigation bar.

5. **💾 Persistent SQLite Database**
   - Stored in `server/data/watchdog.db` with WAL mode for fast concurrency.
   - Persists all study sessions, laps, targets, notepad entries, and exam settings.

6. **📝 Persistent Formula & Revision Scratchpad**
   - Synced notepad for formulas (Master Theorem, Eigenvalues, OS Paging).
   - Debounced auto-save directly to SQLite.

---

## 🛠️ Quick Start

### 1. Start Development Servers (Backend + Frontend)
```bash
npm run dev
```
- **Laptop Browser:** `http://localhost:3000`
- **Phone Browser:** `http://10.207.43.176:3000` (or scan the QR code inside the app)
- **Backend API:** `http://localhost:5050`

### 2. Run Production Build (Single Server)
```bash
npm run build
npm start
```
Accessible on `http://localhost:5050` and `http://10.207.43.176:5050`.

---

## 🗄️ Database Structure (`better-sqlite3`)
- `targets`: ID, title, subject, target_date, actual_seconds, status, started_at, completed_at
- `sessions`: ID, subject, target_id, duration_seconds, start_time, end_time, laps (JSON), notes
- `live_timer`: ID (1), is_running, elapsed_seconds, start_time_ms, active_target_id, active_subject, laps (JSON)
- `notepad`: ID (1), content, updated_at
- `settings`: ID (1), exam_name, exam_date, daily_goal_hours, subjects (JSON)
