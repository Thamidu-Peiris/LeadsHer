import { useMemo } from 'react';
import MentorGoogleCalendarSection from './MentorGoogleCalendarSection';
import { formatSessionWhen } from '../../utils/mentorshipSessionDisplay';

/**
 * @param {{ active: any[]; history: any[] }} props
 */
export default function MentorSchedulePanel({ active = [], history = [] }) {
  const leadsherSessions = useMemo(() => {
    const rows = [];
    const pushMentorship = (m, source) => {
      const menteeName = m?.mentee?.name || 'Mentee';
      const sessions = Array.isArray(m?.sessions) ? m.sessions : [];
      sessions.forEach((s, idx) => {
        const raw = s?.date ?? s?.createdAt;
        const dt = raw ? new Date(raw) : null;
        rows.push({
          key: `${m._id}-${idx}`,
          mentorshipId: m._id,
          menteeName,
          source,
          date: dt && !Number.isNaN(dt.getTime()) ? dt : null,
          calendarDate: s?.calendarDate,
          time: s?.time,
          duration: s?.duration,
          topics: s?.topics,
          notes: s?.notes,
        });
      });
    };
    active.forEach((m) => pushMentorship(m, 'active'));
    history.forEach((m) => pushMentorship(m, 'history'));
    rows.sort((a, b) => {
      const ta = a.date ? a.date.getTime() : 0;
      const tb = b.date ? b.date.getTime() : 0;
      return tb - ta;
    });
    return rows;
  }, [active, history]);

  const hasGoogle = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8">
        <h2 className="font-serif-alt text-2xl font-bold text-on-surface mb-1">Session schedule</h2>
        <p className="text-on-surface-variant text-sm mb-6">
          Scheduled mentorship sessions across active and past mentorships, newest first. Connect Google Calendar below to
          sync new sessions and view your calendar.
        </p>

        {leadsherSessions.length === 0 ? (
          <p className="text-on-surface-variant text-sm">No sessions yet. Use <strong>Active</strong> → Schedule session to add one.</p>
        ) : (
          <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {leadsherSessions.map((row) => (
              <li
                key={row.key}
                className="border border-outline-variant/15 rounded-lg px-4 py-3 bg-surface-container-lowest/60"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-semibold text-on-surface">
                      {row.menteeName}
                      <span className="text-on-surface-variant font-normal text-xs ml-2">
                        ({row.source === 'active' ? 'Active' : 'History'})
                      </span>
                    </p>
                    <p className="text-sm text-outline mt-0.5">
                      {formatSessionWhen(row)} · {row.duration != null ? `${row.duration} min` : '—'}
                    </p>
                  </div>
                </div>
                {row.topics?.length > 0 && (
                  <p className="text-xs text-outline mt-2">Topics: {row.topics.join(', ')}</p>
                )}
                {row.notes && <p className="text-xs text-on-surface-variant mt-1 line-clamp-3">{row.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {hasGoogle ? (
        <MentorGoogleCalendarSection />
      ) : (
        <div className="border border-dashed border-outline-variant/30 rounded-xl p-6 text-sm text-on-surface-variant">
          <p className="font-semibold text-on-surface mb-1">Google Calendar (optional)</p>
          <p>
            Set <code className="text-xs bg-surface-container px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> in your
            environment and add this app&apos;s origin in Google Cloud Console → OAuth client → Authorized JavaScript
            origins. Then reload to connect your calendar.
          </p>
        </div>
      )}
    </div>
  );
}
