// Google Calendar direct REST API & Sync Service for WatchDog

import { createGoogleCalendarUrl } from '../utils/calendar';

const STORAGE_KEY = 'watchdog_google_cal_token';

export function getGoogleToken() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setGoogleToken(token) {
  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Check if Google Calendar is authorized
export function isGoogleCalendarConnected() {
  return Boolean(getGoogleToken());
}

// Create Event in Google Calendar
export async function syncAddGoogleEvent({
  title,
  subject = 'General',
  examName = 'GATE',
  dateStr,
  timeStr = '10:00',
  durationMinutes = 120,
  tip = ''
}) {
  const token = getGoogleToken();

  // Calculate start & end ISO strings with local timezone offset
  const today = new Date();
  const year = dateStr ? Number(dateStr.split('-')[0]) : today.getFullYear();
  const month = dateStr ? Number(dateStr.split('-')[1]) - 1 : today.getMonth();
  const day = dateStr ? Number(dateStr.split('-')[2]) : today.getDate();
  const [hour, min] = (timeStr || '10:00').split(':').map(Number);

  const startDate = new Date(year, month, day, hour || 10, min || 0, 0);
  const endDate = new Date(startDate.getTime() + (durationMinutes || 120) * 60 * 1000);

  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

  const eventPayload = {
    summary: `[${examName}] ${title} (${subject})`,
    description: `🎯 Study Target: ${title}\n📚 Subject: ${subject}\n💡 AI Tip: ${tip || 'Focus and practice PYQs!'}\n\n⏱️ Automatically synced via WatchDog Study Cockpit.`,
    start: { dateTime: startIso, timeZone },
    end: { dateTime: endIso, timeZone },
    colorId: '5' // Yellow / Banana in Google Calendar!
  };

  if (token) {
    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventPayload)
      });

      if (res.ok) {
        const data = await res.json();
        return {
          eventId: data.id,
          htmlLink: data.htmlLink,
          syncedDirectly: true
        };
      } else if (res.status === 401) {
        // Token expired
        setGoogleToken('');
      }
    } catch (e) {
      console.warn('Direct Google Calendar API failed, falling back to URL template:', e);
    }
  }

  // Fallback: Open Google Calendar quick web template URL in a pop-up tab
  const gcalUrl = createGoogleCalendarUrl({
    title,
    subject,
    examName,
    dateStr: dateStr || today.toISOString().split('T')[0],
    timeStr,
    durationMinutes,
    details: tip
  });

  try {
    const popup = window.open(gcalUrl, '_blank', 'noopener,noreferrer');
    if (!popup) {
      console.warn('Popup blocked by browser');
    }
  } catch (err) {
    console.error('Failed to open calendar tab:', err);
  }

  return {
    eventId: '',
    htmlLink: gcalUrl,
    syncedDirectly: false
  };
}

// Mark Event as Completed (Cut / Strike) on Google Calendar
export async function syncCompleteGoogleEvent(eventId, title, timeTakenFormatted = '') {
  const token = getGoogleToken();
  if (!token || !eventId) return;

  try {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: `✓ [DONE] ${title}`,
        colorId: '2' // Green in Google Calendar
      })
    });
  } catch (err) {
    console.warn('Error updating completed event on Google Calendar:', err);
  }
}

// Delete / Cut Event from Google Calendar
export async function syncDeleteGoogleEvent(eventId) {
  const token = getGoogleToken();
  if (!token || !eventId) return;

  try {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (err) {
    console.warn('Error deleting event from Google Calendar:', err);
  }
}
