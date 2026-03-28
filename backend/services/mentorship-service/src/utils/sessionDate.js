/**
 * Session scheduling uses a full start instant (ISO 8601 from the client).
 */

/** Allow past skew vs client clock + network latency so valid sessions are not rejected as “in the past”. */
const FUTURE_GRACE_MS = 300_000;

/** Returned when `startAt` / `date` is missing or unusable (session POST validation). */
const MSG_SESSION_DATETIME_REQUIRED = 'Session date is required';

function isEmptyish(v) {
  return v == null || (typeof v === 'string' && !String(v).trim());
}

/**
 * Merge `startAt`, `date`, and numeric timestamps into one ISO string for validation.
 * @param {{ startAt?: unknown; date?: unknown }} input
 * @returns {string} ISO-friendly string or '' if missing
 */
function normalizeSessionStartInput(input) {
  if (!input || typeof input !== 'object') return '';
  let v = input.startAt;
  if (isEmptyish(v) && input.date != null && String(input.date).trim() !== '') {
    v = input.date;
  }
  if (isEmptyish(v)) return '';
  if (typeof v === 'number' && Number.isFinite(v)) {
    return new Date(v).toISOString();
  }
  const s = String(v).trim();
  if (s === 'undefined' || s === 'null') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return `${s}T12:00:00.000Z`;
  }
  return s;
}

/**
 * Middleware: parseable ISO datetime, effectively in the future (with grace).
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateSessionStartAtShape(isoString) {
  if (typeof isoString !== 'string' || !isoString.trim()) {
    return { ok: false, error: MSG_SESSION_DATETIME_REQUIRED };
  }
  const d = new Date(isoString.trim());
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: 'Invalid session start time' };
  }
  if (d.getTime() < Date.now() - FUTURE_GRACE_MS) {
    return { ok: false, error: 'Session must be scheduled in the future' };
  }
  return { ok: true };
}

function utcCalendarDayMs(d) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
}

/**
 * Service: future (with grace) + session not on a calendar day (UTC) before the mentorship started.
 * @returns {{ ok: true, sessionDate: Date } | { ok: false, error: string }}
 */
function validateSessionStartAt(isoString, mentorshipStartDate) {
  const shape = validateSessionStartAtShape(isoString);
  if (!shape.ok) return shape;

  const sessionStart = new Date(isoString.trim());
  const start = mentorshipStartDate ? new Date(mentorshipStartDate) : null;
  if (start && !Number.isNaN(start.getTime())) {
    const sessionDay = utcCalendarDayMs(sessionStart);
    const mentorshipDay = utcCalendarDayMs(start);
    if (sessionDay != null && mentorshipDay != null && sessionDay < mentorshipDay) {
      return { ok: false, error: 'Session cannot be before the mentorship start date' };
    }
  }
  return { ok: true, sessionDate: sessionStart };
}

module.exports = {
  validateSessionStartAtShape,
  validateSessionStartAt,
  normalizeSessionStartInput,
  MSG_SESSION_DATETIME_REQUIRED,
};
