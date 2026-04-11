/**
 * Event start instant — matches registrationController (date + startTime as UTC wall clock).
 * @param {{ date?: Date|string; startTime?: string }} event
 * @returns {Date|null}
 */
function getEventStartDate(event) {
  if (!event?.date) return null;
  const stRaw = event.startTime;
  if (stRaw == null || String(stRaw).trim() === '') return null;
  try {
    const eventStart = new Date(event.date);
    if (Number.isNaN(eventStart.getTime())) return null;
    const parts = String(stRaw).trim().split(':');
    const hours = parseInt(parts[0], 10);
    const minutePart = parts[1] != null ? String(parts[1]).replace(/\D/g, '') : '';
    const minutes = minutePart === '' ? 0 : parseInt(minutePart, 10);
    if (Number.isNaN(hours)) return null;
    eventStart.setUTCHours(hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
    if (Number.isNaN(eventStart.getTime())) return null;
    return eventStart;
  } catch {
    return null;
  }
}

/**
 * Same as {@link getEventStartDate} when date + startTime are well-formed; otherwise falls back so
 * admin reminder emails still work (e.g. odd whitespace, date-only, or slightly odd time strings).
 * @param {{ date?: Date|string; startTime?: string }} event
 * @returns {Date|null}
 */
function resolveReminderStartInstant(event) {
  const primary = getEventStartDate(event);
  if (primary) return primary;

  if (!event?.date) return null;
  const base = new Date(event.date);
  if (Number.isNaN(base.getTime())) return null;

  const st = event.startTime != null ? String(event.startTime).trim() : '';
  if (!st) return base;

  const parts = st.split(':');
  const hours = parseInt(parts[0], 10);
  const minuteDigits = parts[1] != null ? String(parts[1]).replace(/\D/g, '') : '';
  const minutes = minuteDigits === '' ? 0 : parseInt(minuteDigits, 10);
  if (Number.isNaN(hours)) return base;

  base.setUTCHours(hours, Number.isNaN(minutes) ? 0 : Math.min(59, minutes), 0, 0);
  if (Number.isNaN(base.getTime())) return new Date(event.date);
  return base;
}

module.exports = { getEventStartDate, resolveReminderStartInstant };
