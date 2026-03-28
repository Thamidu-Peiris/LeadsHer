/**
 * Browser-side calls to Google Calendar API (access token from OAuth).
 * Read: calendar.readonly · Write events: calendar.events
 */

const CAL = 'https://www.googleapis.com/calendar/v3';

const TOKEN_KEY = 'leadsher_gcal_token';
const EXP_KEY = 'leadsher_gcal_exp';

/** @returns {string|null} */
export function readGoogleCalendarAccessTokenFromStorage() {
  try {
    const t = sessionStorage.getItem(TOKEN_KEY);
    const exp = sessionStorage.getItem(EXP_KEY);
    if (!t || !exp) return null;
    if (Date.now() > Number(exp) - 60_000) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(EXP_KEY);
      return null;
    }
    return t;
  } catch {
    return null;
  }
}

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Local wall time for Google Calendar `dateTime` + `timeZone`. */
export function formatLocalWallDateTime(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}:00`;
}

/**
 * @param {string} accessToken
 * @param {{ summary: string; description?: string; start: Date; end: Date; timeZone: string }} p
 */
export async function insertPrimaryCalendarEvent(accessToken, { summary, description, start, end, timeZone }) {
  const startStr = formatLocalWallDateTime(start);
  const endStr = formatLocalWallDateTime(end);
  if (!startStr || !endStr) throw new Error('Invalid start or end time');

  const res = await fetch(`${CAL}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary,
      description: description || '',
      start: { dateTime: startStr, timeZone },
      end: { dateTime: endStr, timeZone },
    }),
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Create event failed (${res.status})`);
  }
  return res.json();
}

/**
 * @param {string} accessToken
 * @param {{ timeMin: Date; timeMax: Date }} range
 * @returns {Promise<Array<{ id: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; htmlLink?: string }>>}
 */
export async function fetchPrimaryCalendarEvents(accessToken, { timeMin, timeMax }) {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
  });
  const res = await fetch(`${CAL}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Calendar request failed (${res.status})`);
  }
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

export function eventStartDate(ev) {
  const s = ev?.start?.dateTime || ev?.start?.date;
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
