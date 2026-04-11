/**
 * Unit tests — pure date helpers (no DB, no HTTP).
 */
const { getEventStartDate, resolveReminderStartInstant } = require('../../src/utils/eventStart');

describe('eventStart.getEventStartDate', () => {
  const baseDate = new Date('2026-06-15T00:00:00.000Z');

  it('returns UTC instant from date + startTime', () => {
    const d = getEventStartDate({ date: baseDate, startTime: '14:30' });
    expect(d).toBeInstanceOf(Date);
    expect(d.toISOString()).toBe('2026-06-15T14:30:00.000Z');
  });

  it('returns null when startTime is missing or whitespace-only', () => {
    expect(getEventStartDate({ date: baseDate, startTime: null })).toBeNull();
    expect(getEventStartDate({ date: baseDate, startTime: '   ' })).toBeNull();
    expect(getEventStartDate({ date: baseDate, startTime: '' })).toBeNull();
  });

  it('returns null when date is missing or invalid', () => {
    expect(getEventStartDate({ date: null, startTime: '10:00' })).toBeNull();
    expect(getEventStartDate({ date: 'not-a-date', startTime: '10:00' })).toBeNull();
  });

  it('parses minutes segment with trailing noise (e.g. seconds)', () => {
    const d = getEventStartDate({ date: baseDate, startTime: '09:00:45' });
    expect(d.toISOString()).toBe('2026-06-15T09:00:00.000Z');
  });
});

describe('eventStart.resolveReminderStartInstant', () => {
  const baseDate = new Date('2026-08-01T00:00:00.000Z');

  it('matches getEventStartDate when time is valid', () => {
    const ev = { date: baseDate, startTime: '11:15' };
    expect(resolveReminderStartInstant(ev).toISOString()).toBe(getEventStartDate(ev).toISOString());
  });

  it('falls back to event date when startTime is blank (reminder path)', () => {
    const d = resolveReminderStartInstant({ date: baseDate, startTime: '   ' });
    expect(d.toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });

  it('returns null when date is unusable', () => {
    expect(resolveReminderStartInstant({ date: 'invalid', startTime: '10:00' })).toBeNull();
  });
});
