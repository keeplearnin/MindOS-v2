// Google Calendar API helper
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export async function fetchEvents(accessToken, timeMin, timeMax, calendarId = 'primary') {
  const params = new URLSearchParams({
    timeMin: timeMin || new Date().toISOString(),
    timeMax: timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });

  const res = await fetch(
    `${CALENDAR_API}/calendars/${calendarId}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);
  const data = await res.json();
  return data.items || [];
}

export async function createEvent(accessToken, event, calendarId = 'primary') {
  const res = await fetch(
    `${CALENDAR_API}/calendars/${calendarId}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );
  if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);
  return res.json();
}

export async function listCalendars(accessToken) {
  const res = await fetch(
    `${CALENDAR_API}/users/me/calendarList`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);
  const data = await res.json();
  return data.items || [];
}
