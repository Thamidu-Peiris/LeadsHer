/**
 * Show session timing: prefers Mongo `calendarDate` + `time`, else formats full `date` instant.
 * @param {{ date?: string | Date; calendarDate?: string; time?: string }} s
 */
export function formatSessionWhen(s) {
  if (s?.calendarDate && s?.time) return `${s.calendarDate} · ${s.time}`;
  if (s?.date) {
    try {
      return new Date(s.date).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }
  return '—';
}
