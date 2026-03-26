/**
 * Session "date" from the client is YYYY-MM-DD (local calendar day).
 * Avoid `new Date("YYYY-MM-DD")` (UTC midnight) which breaks timezone checks.
 */

function parseLocalDateOnly(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) return null;
  const [y, m, d] = iso.trim().split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

function startOfLocalDay(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return null;
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

function todayLocal() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

/**
 * @returns {{ ok: true, sessionDate: Date } | { ok: false, error: string }}
 */
function validateSessionCalendarDate(isoDate, mentorshipStartDate) {
  const sessionDay = parseLocalDateOnly(isoDate);
  if (!sessionDay) {
    return { ok: false, error: 'Invalid session date (use YYYY-MM-DD)' };
  }
  const start = startOfLocalDay(mentorshipStartDate);
  if (!start) {
    return { ok: false, error: 'Invalid mentorship start date' };
  }
  if (sessionDay.getTime() < start.getTime()) {
    return { ok: false, error: 'Session date cannot be before mentorship start date' };
  }
  const today = todayLocal();
  if (sessionDay.getTime() > today.getTime()) {
    return { ok: false, error: 'Session date cannot be in the future (log past or today’s sessions only)' };
  }
  return { ok: true, sessionDate: sessionDay };
}

/** Middleware: only checks YYYY-MM-DD is valid and not after today (local). */
function validateSessionDateShape(iso) {
  const sessionDay = parseLocalDateOnly(iso);
  if (!sessionDay) {
    return { ok: false, error: 'Invalid session date' };
  }
  if (sessionDay.getTime() > todayLocal().getTime()) {
    return { ok: false, error: 'Session date cannot be in the future' };
  }
  return { ok: true };
}

module.exports = {
  parseLocalDateOnly,
  validateSessionCalendarDate,
  validateSessionDateShape,
};
