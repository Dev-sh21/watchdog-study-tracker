export function formatTimeStopwatch(seconds) {
  const totalSec = Math.floor(seconds || 0);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const pad = (num) => String(num).padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function formatStopwatchFull(seconds) {
  const totalSec = Math.floor(seconds || 0);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (num) => String(num).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export function formatDurationHuman(seconds) {
  if (!seconds || seconds <= 0) return '0 min';
  const totalSec = Math.floor(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const parts = [];
  if (hrs > 0) parts.push(`${hrs} hr${hrs > 1 ? 's' : ''}`);
  if (mins > 0) parts.push(`${mins} min${mins > 1 ? 's' : ''}`);
  if (secs > 0 && hrs === 0) parts.push(`${secs} sec`);

  return parts.length > 0 ? parts.join(' ') : '0 min';
}

export function getDaysRemaining(targetDateStr) {
  if (!targetDateStr) return { days: 0, hours: 0 };
  const target = new Date(targetDateStr);
  const now = new Date();
  const diffMs = target - now;
  if (diffMs <= 0) return { days: 0, hours: 0, isPassed: true };

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, isPassed: false };
}
