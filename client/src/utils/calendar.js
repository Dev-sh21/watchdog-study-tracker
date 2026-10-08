// Google Calendar & iCalendar (.ics) integration utility

export function createGoogleCalendarUrl({
  title,
  subject,
  examName = 'GATE',
  dateStr,
  timeStr = '10:00',
  durationMinutes = 120,
  details = ''
}) {
  const eventTitle = `[${examName}] ${title} (${subject})`;
  
  let desc = `🎯 Study Session for ${examName}\n`;
  desc += `📚 Subject: ${subject}\n`;
  desc += `📝 Target: ${title}\n`;
  if (details) desc += `\nNotes: ${details}\n`;
  desc += `\nTracked in WatchDog Study Command Center.`;

  // Parse Date and Time
  let startDateTime;
  if (dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, mins] = (timeStr || '10:00').split(':').map(Number);
    startDateTime = new Date(year, month - 1, day, hours, mins);
  } else {
    // Default to today at next rounded hour
    startDateTime = new Date();
    startDateTime.setHours(startDateTime.getHours() + 1, 0, 0, 0);
  }

  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

  // Format to UTC string YYYYMMDDTHHmmSSZ
  const formatUtc = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return (
      d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      'Z'
    );
  };

  const datesParam = `${formatUtc(startDateTime)}/${formatUtc(endDateTime)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    details: desc,
    location: 'Study Desk / Library',
    dates: datesParam
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Generate .ics file for native Apple Calendar / Android Calendar download
export function downloadIcsFile({
  title,
  subject,
  examName = 'GATE',
  dateStr,
  timeStr = '10:00',
  durationMinutes = 120
}) {
  const eventTitle = `[${examName}] ${title} (${subject})`;
  
  let startDateTime;
  if (dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, mins] = (timeStr || '10:00').split(':').map(Number);
    startDateTime = new Date(year, month - 1, day, hours, mins);
  } else {
    startDateTime = new Date();
    startDateTime.setHours(startDateTime.getHours() + 1, 0, 0, 0);
  }

  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

  const formatUtc = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return (
      d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      'Z'
    );
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GATE & UPSC WatchDog//Study Planner//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@watchdog.app`,
    `DTSTAMP:${formatUtc(new Date())}`,
    `DTSTART:${formatUtc(startDateTime)}`,
    `DTEND:${formatUtc(endDateTime)}`,
    `SUMMARY:${eventTitle.replace(/\n/g, ' ')}`,
    `DESCRIPTION:Target Study Block for ${examName} - Subject: ${subject}. Tracked in WatchDog.`,
    'LOCATION:Study Desk',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
