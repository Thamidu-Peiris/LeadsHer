import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import { mentorshipApi } from '../api/mentorshipApi';
import { mentorApi } from '../api/mentorApi';
import MentorSchedulePanel from '../components/mentorship/MentorSchedulePanel';
import MentorshipVideoCallModal from '../components/mentorship/MentorshipVideoCallModal';
import { getSessionVideoWindowInfo } from '../utils/mentorshipVideoCall';
import {
  insertPrimaryCalendarEvent,
  readGoogleCalendarAccessTokenFromStorage,
} from '../utils/googleCalendarClient';
import { formatSessionWhen } from '../utils/mentorshipSessionDisplay';
import { userDisplayPhoto } from '../utils/absolutePhotoUrl';

function safeList(res) {
  const data = res?.data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.requests)) return data.requests;
  if (Array.isArray(data?.mentorships)) return data.mentorships;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

/** Avatar for mentee on mentor dashboard (populated user or fallback initial from name). */
function MenteeFace({ mentee, displayName, size = 'md' }) {
  const user =
    mentee && typeof mentee === 'object'
      ? mentee
      : { name: displayName || 'Mentee' };
  const dim = size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-10 w-10' : 'h-12 w-12';
  const px = size === 'lg' ? 128 : size === 'sm' ? 80 : 96;
  return (
    <img
      src={userDisplayPhoto(user, { size: px })}
      alt=""
      className={`${dim} rounded-full object-cover border border-outline-variant/25 bg-surface-container-lowest shrink-0`}
    />
  );
}

/** Submitted feedback rating: filled stars amber/yellow, empty stars gray. */
function FeedbackSubmittedStars({ rating }) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <span
      className="inline-flex items-center gap-px text-[14px] leading-none tracking-tight"
      role="img"
      aria-label={`${r} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < r ? 'text-amber-400' : 'text-neutral-300 dark:text-neutral-500'}
          aria-hidden
        >
          ★
        </span>
      ))}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return '';
  }
}

/** Local YYYY-MM-DD + HH:mm from a Date (same wall clock as datetime-local). */
function localCalendarAndTime(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return { calendarDate: '', time: '' };
  const y = x.getFullYear();
  const mo = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  const h = String(x.getHours()).padStart(2, '0');
  const min = String(x.getMinutes()).padStart(2, '0');
  return { calendarDate: `${y}-${mo}-${day}`, time: `${h}:${min}` };
}

/** Value for `<input type="datetime-local" />` in local timezone. */
function toDatetimeLocalValue(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return '';
  const y = x.getFullYear();
  const mo = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  const h = String(x.getHours()).padStart(2, '0');
  const min = String(x.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${day}T${h}:${min}`;
}

/** Wall-clock start of day (local) for “mentorship started on this day” — aligns with server UTC calendar-day rule. */
function mentorshipDayStartLocalMs(mentorship) {
  const raw = mentorship?.startDate ?? mentorship?.createdAt;
  if (!raw) return 0;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return 0;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Earliest allowed start: same calendar day as mentorship (or later), and at least ~1 min from now. */
function minSessionStartMs(mentorship) {
  const dayStart = mentorshipDayStartLocalMs(mentorship);
  return Math.max(dayStart, Date.now() + 60_000);
}

export default function MentorDashboardMentorshipPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mentorProfile, setMentorProfile] = useState(null);
  const [tab, setTab] = useState('requests'); // requests | active | history | schedule

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);

  const [respondingId, setRespondingId] = useState('');

  const [sessionFor, setSessionFor] = useState(null);
  const [sessionForm, setSessionForm] = useState({ startAt: '', duration: 30, notes: '', topics: '' });

  const [goalsFor, setGoalsFor] = useState(null);
  const [goalsInput, setGoalsInput] = useState('');

  const [expandedId, setExpandedId] = useState(null);
  const [videoCall, setVideoCall] = useState(null);

  const [feedbackFor, setFeedbackFor] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });

  const scheduleSessionCount = useMemo(() => {
    let n = 0;
    [...active, ...history].forEach((m) => {
      n += Array.isArray(m?.sessions) ? m.sessions.length : 0;
    });
    return n;
  }, [active, history]);

  const counts = useMemo(() => ({
    requests: requests.length,
    active: active.length,
    history: history.length,
    schedule: scheduleSessionCount,
  }), [requests.length, active.length, history.length, scheduleSessionCount]);

  const loadAll = useCallback(async (options = {}) => {
    const { showLoading = false } = options;
    if (showLoading) setLoading(true);
    try {
      const [r, a, h] = await Promise.allSettled([
        mentorshipApi.getRequests({ status: 'pending', type: 'received' }),
        mentorshipApi.getActive(),
        mentorshipApi.getHistory(),
      ]);
      if (r.status === 'fulfilled') setRequests(safeList(r.value));
      if (a.status === 'fulfilled') setActive(safeList(a.value));
      if (h.status === 'fulfilled') setHistory(safeList(h.value));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll({ showLoading: true });
  }, [loadAll]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadAll();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadAll]);

  useEffect(() => {
    const userId = user?.id ?? user?._id;
    if (!userId) return;
    mentorApi.getMyProfile()
      .then((res) => {
        const p = res.data?.data || res.data?.data?.data || res.data?.data || null;
        setMentorProfile(p);
      })
      .catch(() => setMentorProfile(null));
  }, [user?.id, user?._id]);

  const avatarSrc =
    user?.profilePicture ||
    user?.avatar ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80';

  const accept = async (id) => {
    setRespondingId(id);
    try {
      await mentorshipApi.acceptRequest(id, undefined);
      toast.success('Request accepted');
      await loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to accept');
    } finally {
      setRespondingId('');
    }
  };

  const reject = async (id) => {
    setRespondingId(id);
    try {
      await mentorshipApi.rejectRequest(id, undefined);
      toast.success('Request rejected');
      await loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to reject');
    } finally {
      setRespondingId('');
    }
  };

  const complete = async (id) => {
    try {
      await mentorshipApi.complete(id);
      toast.success('Mentorship marked complete');
      await loadAll();
      setFeedbackFor({ _id: id });
    } catch (e) {
      const msg = e.response?.data?.requirements?.join(' · ') || e.response?.data?.message || 'Failed to complete';
      toast.error(msg);
    }
  };

  const updateGoals = async () => {
    if (!goalsFor?._id) return;
    const goals = goalsInput.split(',').map((g) => g.trim()).filter(Boolean);
    if (!goals.length) { toast.error('Add at least one goal'); return; }
    try {
      await mentorshipApi.updateGoals(goalsFor._id, { goals });
      toast.success('Goals updated');
      setGoalsFor(null);
      setGoalsInput('');
      await loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update goals');
    }
  };

  const submitSession = async () => {
    if (!sessionFor?._id) return;
    const start = new Date(sessionForm.startAt);
    if (Number.isNaN(start.getTime())) {
      toast.error('Pick a valid date and time');
      return;
    }
    const dur = Math.max(15, parseInt(String(sessionForm.duration), 10) || 30);
    const wall = localCalendarAndTime(start);
    try {
      const payload = {
        startAt: start.toISOString(),
        calendarDate: wall.calendarDate,
        time: wall.time,
        duration: dur,
        notes: sessionForm.notes || undefined,
        topics: sessionForm.topics
          ? sessionForm.topics.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
      };
      await mentorshipApi.logSession(sessionFor._id, payload);

      let successMsg = 'Session scheduled';
      const token = readGoogleCalendarAccessTokenFromStorage();
      if (token) {
        try {
          const end = new Date(start.getTime() + dur * 60000);
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const topicLine = sessionForm.topics?.trim()
            ? `Topics: ${sessionForm.topics}`
            : '';
          await insertPrimaryCalendarEvent(token, {
            summary: `Mentorship — ${sessionFor?.mentee?.name || 'Mentee'}`,
            description: [topicLine, sessionForm.notes?.trim()].filter(Boolean).join('\n\n'),
            start,
            end,
            timeZone: tz,
          });
          successMsg = 'Session scheduled and added to Google Calendar';
        } catch (calErr) {
          console.error(calErr);
          successMsg = 'Session scheduled (Google Calendar sync failed — try reconnecting)';
        }
      }

      toast.success(successMsg);
      setSessionFor(null);
      setSessionForm({ startAt: '', duration: 30, notes: '', topics: '' });
      await loadAll();
    } catch (e) {
      const data = e.response?.data;
      const errs = data?.errors;
      const msg =
        (Array.isArray(errs) && errs.length ? errs.join(' ') : null) ||
        data?.error ||
        data?.message ||
        'Failed to schedule session';
      toast.error(msg);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackFor?._id) return;
    try {
      await mentorshipApi.submitFeedback(feedbackFor._id, feedbackForm);
      toast.success('Feedback submitted');
      setFeedbackFor(null);
      setFeedbackForm({ rating: 5, comment: '' });
      await loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit feedback');
    }
  };

  const SidebarNav = [
    { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/dashboard/stories', icon: 'auto_stories', label: 'Stories' },
    { to: '/dashboard/mentorship', icon: 'groups', label: 'Mentorship' },
    { to: '/dashboard/events', icon: 'event', label: 'Events' },
    { to: '/dashboard/resources', icon: 'library_books', label: 'Resources' },
    { to: '/dashboard/forum', icon: 'forum', label: 'Forum' },
    { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
  ];

  const SESSION_FUTURE_GRACE_MS = 300_000; // keep in sync with mentorship-service sessionDate FUTURE_GRACE_MS
  const sessionMinMs = sessionFor ? minSessionStartMs(sessionFor) : 0;
  const sessionModalMinLocal = sessionFor ? toDatetimeLocalValue(new Date(sessionMinMs)) : '';
  const sessionStart = sessionForm.startAt ? new Date(sessionForm.startAt) : null;
  const sessionDateInvalid =
    !!sessionFor &&
    (!sessionForm.startAt ||
      !sessionStart ||
      Number.isNaN(sessionStart.getTime()) ||
      sessionStart.getTime() < Date.now() - SESSION_FUTURE_GRACE_MS ||
      sessionStart.getTime() < sessionMinMs);

  return (
    <>
          <DashboardTopBar crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Mentorship' }]} />

          <div className="p-8 space-y-6 max-w-[1400px] mx-auto w-full">
            <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-serif-alt text-3xl font-bold text-on-surface">Mentorship</h1>
                <p className="text-on-surface-variant text-sm mt-1">
                  Receive requests, manage active mentees, and track mentorship history.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'requests', label: 'Requests', count: counts.requests },
                  { key: 'active', label: 'Active', count: counts.active },
                  { key: 'history', label: 'History', count: counts.history },
                  { key: 'schedule', label: 'Schedule', count: counts.schedule },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                      tab === t.key
                        ? 'border-rose-500 bg-rose-500/10 text-on-surface'
                        : 'border-outline-variant/25 bg-white dark:bg-surface-container hover:border-rose-500/40'
                    }`}
                  >
                    {t.label} <span className="text-outline font-semibold">({t.count})</span>
                  </button>
                ))}
              </div>
            </section>

            {loading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : (
              <>
                {tab === 'requests' && (
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8">
                    <div className="mb-6">
                      <h2 className="font-serif-alt text-2xl font-bold text-on-surface">Mentorship Requests</h2>
                      <p className="text-on-surface-variant text-sm">Accept or reject incoming mentorship requests.</p>
                    </div>

                    {requests.length === 0 ? (
                      <p className="text-on-surface-variant">No pending requests.</p>
                    ) : (
                      <div className="space-y-4">
                        {requests.map((r) => {
                          const menteeName = r?.mentee?.name || r?.menteeName || 'Mentee';
                          const goals = r?.goals || [];
                          const status = r?.status || 'pending';
                          return (
                            <div key={r._id} className="border border-outline-variant/20 rounded-xl p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 flex-1 gap-4">
                                  <MenteeFace mentee={r?.mentee} displayName={menteeName} size="lg" />
                                  <div className="min-w-0">
                                  <p className="text-xs uppercase tracking-widest text-outline font-bold">From</p>
                                  <h3 className="font-serif-alt text-xl font-bold text-on-surface line-clamp-1">
                                    {menteeName}
                                  </h3>
                                  {r?.message && <p className="text-on-surface-variant text-sm mt-2">{r.message}</p>}
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {goals.slice(0, 6).map((g) => (
                                      <span key={g} className="inline-flex px-3 py-1 text-xs bg-surface-container-lowest border border-outline-variant/15 rounded-lg">
                                        {g}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-xs text-outline mt-3">
                                    Preferred start: <span className="font-semibold text-on-surface">{formatDate(r?.preferredStartDate)}</span>
                                  </p>
                                  </div>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-outline-variant/25 text-outline shrink-0">
                                  {status}
                                </span>
                              </div>

                              <div className="mt-5 flex gap-2 flex-wrap">
                                <button
                                  type="button"
                                  disabled={respondingId === r._id}
                                  onClick={() => accept(r._id)}
                                  className="bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase hover:opacity-90 disabled:opacity-60"
                                >
                                  {respondingId === r._id ? 'Working…' : 'Accept'}
                                </button>
                                <button
                                  type="button"
                                  disabled={respondingId === r._id}
                                  onClick={() => reject(r._id)}
                                  className="px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase border border-tertiary/30 text-tertiary hover:bg-tertiary/5 disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'active' && (
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8">
                    <h2 className="font-serif-alt text-2xl font-bold text-on-surface mb-1">Active Mentees</h2>
                    <p className="text-on-surface-variant text-sm mb-6">Schedule sessions, update goals, mark complete, and submit feedback.</p>

                    {active.length === 0 ? (
                      <p className="text-on-surface-variant">No active mentorships.</p>
                    ) : (
                      <div className="space-y-4">
                        {active.map((m) => {
                          const menteeName = m?.mentee?.name || 'Mentee';
                          const menteeEmail = m?.mentee?.email || '';
                          const started = formatDate(m?.startDate);
                          const sessionCount = m?.sessions?.length || 0;
                          const goals = m?.goals || [];
                          const isExpanded = expandedId === m._id;
                          return (
                            <div key={m._id} className="border border-outline-variant/20 rounded-xl p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 flex-1 gap-4">
                                  <MenteeFace mentee={m?.mentee} displayName={menteeName} size="lg" />
                                  <div className="min-w-0">
                                  <h3 className="font-serif-alt text-xl font-bold text-on-surface">{menteeName}</h3>
                                  {menteeEmail && <p className="text-xs text-outline">{menteeEmail}</p>}
                                  <p className="text-xs text-outline mt-1">Started: {started || '—'} · Sessions logged: {sessionCount}</p>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-green-300 bg-green-50 text-green-800 shrink-0 dark:border-green-600/50 dark:bg-green-950/50 dark:text-green-400">
                                  {m?.status || 'active'}
                                </span>
                              </div>

                              {/* Goals */}
                              <div className="mt-4">
                                <p className="text-xs uppercase tracking-widest text-outline font-bold mb-2">Goals</p>
                                <div className="flex flex-wrap gap-2">
                                  {goals.length ? goals.map((g) => (
                                    <span key={g} className="inline-flex px-3 py-1 text-xs bg-rose-500/5 border border-rose-500/20 rounded-lg">{g}</span>
                                  )) : <span className="text-sm text-on-surface-variant">No goals set</span>}
                                </div>
                              </div>

                              {/* Session history expandable */}
                              {sessionCount > 0 && (
                                <div className="mt-4">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedId(isExpanded ? null : m._id)}
                                    className="text-xs text-rose-500 font-bold uppercase tracking-wider flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      {isExpanded ? 'expand_less' : 'expand_more'}
                                    </span>
                                    {isExpanded ? 'Hide' : 'View'} sessions ({sessionCount})
                                  </button>
                                  {isExpanded && (
                                    <div className="mt-3 space-y-2">
                                      {(m.sessions || []).map((s, i) => {
                                        const sessionKey = s._id ? String(s._id) : `idx-${i}`;
                                        const win = getSessionVideoWindowInfo(s);
                                        const canVideo = Boolean(s._id) && win.canJoin;
                                        return (
                                        <div key={sessionKey} className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg px-4 py-3 text-sm">
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-semibold text-on-surface">{formatSessionWhen(s)}</span>
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="text-outline">{s.duration} min</span>
                                              {s.callStatus === 'completed' ? (
                                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-800 dark:bg-green-950/60 dark:text-green-300">
                                                  Call completed
                                                </span>
                                              ) : (
                                                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600 dark:bg-surface-container dark:text-on-surface-variant" title={win.label}>
                                                  {win.phase === 'too_early' ? 'Video soon' : win.phase === 'ended' ? 'Window ended' : win.phase === 'open' ? 'Video open' : '—'}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          {s.topics?.length > 0 && (
                                            <p className="text-xs text-outline mt-1">Topics: {s.topics.join(', ')}</p>
                                          )}
                                          {s.notes && <p className="text-xs text-on-surface-variant mt-1">{s.notes}</p>}
                                          <div className="mt-2">
                                            <button
                                              type="button"
                                              disabled={!canVideo}
                                              title={!s._id ? 'Session id missing' : win.label}
                                              onClick={() => {
                                                if (!s._id) return;
                                                setVideoCall({
                                                  mentorshipId: m._id,
                                                  sessionId: String(s._id),
                                                  peerName: menteeName,
                                                });
                                              }}
                                              className="rounded-lg bg-sky-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-sky-600 dark:hover:bg-sky-500"
                                            >
                                              Join video call
                                            </button>
                                          </div>
                                        </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="mt-5 flex gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSessionFor(m);
                                    const minMs = minSessionStartMs(m);
                                    const defaultStart = new Date(minMs + 15 * 60 * 1000);
                                    setSessionForm({
                                      startAt: toDatetimeLocalValue(defaultStart),
                                      duration: 30,
                                      notes: '',
                                      topics: '',
                                    });
                                  }}
                                  className="px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase border border-outline-variant/25 hover:border-rose-500/40 transition-colors bg-white dark:bg-surface-container"
                                >
                                  Schedule session
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setGoalsFor(m); setGoalsInput(goals.join(', ')); }}
                                  className="px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase border border-outline-variant/25 hover:border-rose-500/40 transition-colors bg-white"
                                >
                                  Set goals
                                </button>
                                <button
                                  type="button"
                                  onClick={() => complete(m._id)}
                                  className="bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase hover:opacity-90"
                                >
                                  Mark complete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'history' && (
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8">
                    <h2 className="font-serif-alt text-2xl font-bold text-on-surface mb-1">Mentorship History</h2>
                    <p className="text-on-surface-variant text-sm mb-6">Completed and past mentorships.</p>

                    {history.length === 0 ? (
                      <p className="text-on-surface-variant">No history yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {history.map((m) => {
                          const sessionCount = m?.sessions?.length || 0;
                          const hasMentorFeedback = !!m?.feedback?.mentorRating;
                          return (
                            <div key={m._id} className="border border-outline-variant/20 rounded-xl p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 flex-1 gap-4">
                                  <MenteeFace
                                    mentee={m?.mentee}
                                    displayName={m?.mentee?.name || 'Mentee'}
                                    size="lg"
                                  />
                                  <div className="min-w-0">
                                  <h3 className="font-serif-alt text-xl font-bold text-on-surface">
                                    {m?.mentee?.name || 'Mentee'}
                                  </h3>
                                  <p className="text-xs text-outline mt-1">
                                    Started: {formatDate(m?.startDate)} · {m?.completedAt ? `Completed: ${formatDate(m.completedAt)}` : `Ended: ${formatDate(m?.endDate)}`}
                                  </p>
                                  <p className="text-xs text-outline">Sessions: {sessionCount}</p>
                                  </div>
                                </div>
                                <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border text-outline shrink-0 ${
                                  m?.status === 'completed' ? 'border-green-300 text-green-700 bg-green-50' :
                                  m?.status === 'terminated' ? 'border-red-300 text-red-700 bg-red-50' :
                                  'border-outline-variant/25'
                                }`}>
                                  {m?.status}
                                </span>
                              </div>
                              {m?.status === 'completed' && !hasMentorFeedback && (
                                <div className="mt-4">
                                  <button
                                    type="button"
                                    onClick={() => { setFeedbackFor(m); setFeedbackForm({ rating: 5, comment: '' }); }}
                                    className="bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase hover:opacity-90"
                                  >
                                    Submit feedback
                                  </button>
                                </div>
                              )}
                              {hasMentorFeedback && (
                                <p className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-green-700 dark:text-green-400">
                                  <span>✓ Feedback submitted</span>
                                  <FeedbackSubmittedStars rating={m.feedback.mentorRating} />
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'schedule' && (
                  <MentorSchedulePanel
                    active={active}
                    history={history}
                    onSessionVideoCall={(mentorshipId, session, menteeName) => {
                      if (!session?._id) return;
                      setVideoCall({
                        mentorshipId,
                        sessionId: String(session._id),
                        peerName: menteeName || 'Mentee',
                      });
                    }}
                  />
                )}
              </>
            )}

            {/* Goals modal */}
            {goalsFor && (
              <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-6">
                <div className="w-full max-w-lg bg-white border border-outline-variant/20 p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <MenteeFace mentee={goalsFor?.mentee} displayName={goalsFor?.mentee?.name || 'Mentee'} size="md" />
                      <div className="min-w-0">
                      <h3 className="font-serif-alt text-xl font-bold text-on-surface">Set Goals</h3>
                      <p className="text-xs text-outline">Mentee: {goalsFor?.mentee?.name || 'Mentee'}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setGoalsFor(null)} className="text-outline hover:text-on-surface">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Goals (comma-separated)</label>
                  <input
                    value={goalsInput}
                    onChange={(e) => setGoalsInput(e.target.value)}
                    className="w-full bg-white border border-outline-variant/25 rounded-lg px-4 py-2 text-sm"
                    placeholder="Career growth, Leadership, Negotiation"
                  />
                  <div className="mt-5 flex gap-2 justify-end">
                    <button type="button" onClick={() => setGoalsFor(null)} className="px-4 py-2 text-xs font-bold tracking-wider uppercase border border-outline-variant/25">
                      Cancel
                    </button>
                    <button type="button" onClick={updateGoals} className="bg-rose-500 text-white px-4 py-2 text-xs font-bold tracking-wider uppercase">
                      Save goals
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Session modal */}
            {sessionFor && (
              <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-6">
                <div className="w-full max-w-lg bg-white dark:bg-surface-container border border-outline-variant/20 p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <MenteeFace mentee={sessionFor?.mentee} displayName={sessionFor?.mentee?.name || 'Mentee'} size="md" />
                      <div className="min-w-0">
                      <h3 className="font-serif-alt text-xl font-bold text-on-surface">Schedule session</h3>
                      <p className="text-xs text-outline">Mentee: {sessionFor?.mentee?.name || 'Mentee'}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSessionFor(null)} className="text-outline hover:text-on-surface shrink-0">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">
                        Start date &amp; time
                      </label>
                      <input
                        type="datetime-local"
                        min={sessionModalMinLocal || undefined}
                        value={sessionForm.startAt}
                        onChange={(e) => setSessionForm((f) => ({ ...f, startAt: e.target.value }))}
                        className="w-full bg-white dark:bg-surface-container border border-outline-variant/25 text-on-surface rounded-lg px-4 py-2 text-sm"
                      />
                      {sessionFor?.startDate && (
                        <p className="mt-2 text-[11px] text-outline">
                          Mentorship started:{' '}
                          <span className="font-semibold text-on-surface">{formatDate(sessionFor.startDate)}</span>
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-outline">
                        Choose a <span className="font-semibold text-on-surface">future</span> time. If Google Calendar is connected on the Schedule tab, the event is added there too.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Duration (min)</label>
                      <input
                        type="number"
                        min={15}
                        value={sessionForm.duration}
                        onChange={(e) => setSessionForm((f) => ({ ...f, duration: e.target.value }))}
                        className="w-full bg-white dark:bg-surface-container border border-outline-variant/25 text-on-surface rounded-lg px-4 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Topics (comma-separated)</label>
                    <input
                      value={sessionForm.topics}
                      onChange={(e) => setSessionForm((f) => ({ ...f, topics: e.target.value }))}
                      className="w-full bg-white dark:bg-surface-container border border-outline-variant/25 text-on-surface rounded-lg px-4 py-2 text-sm"
                      placeholder="Leadership, career, negotiation…"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Notes</label>
                    <textarea
                      value={sessionForm.notes}
                      onChange={(e) => setSessionForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full bg-white dark:bg-surface-container border border-outline-variant/25 text-on-surface rounded-lg px-4 py-2 text-sm"
                      rows={4}
                    />
                  </div>
                  <div className="mt-5 flex gap-2 justify-end">
                    <button type="button" onClick={() => setSessionFor(null)} className="px-4 py-2 text-xs font-bold tracking-wider uppercase border border-outline-variant/25">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitSession}
                      disabled={
                        sessionDateInvalid ||
                        Number(sessionForm.duration) < 15
                      }
                      className="bg-rose-500 text-white px-4 py-2 text-xs font-bold tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Schedule session
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback modal */}
            {feedbackFor && (
              <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-6">
                <div className="w-full max-w-lg bg-white dark:bg-surface-container border border-outline-variant/20 p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <MenteeFace mentee={feedbackFor?.mentee} displayName={feedbackFor?.mentee?.name || 'Mentee'} size="md" />
                      <div className="min-w-0">
                      <h3 className="font-serif-alt text-xl font-bold text-on-surface">Submit Feedback</h3>
                      <p className="text-xs text-outline">
                        {feedbackFor?.mentee?.name || 'Mentee'} — rate their progress.
                      </p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setFeedbackFor(null)} className="text-outline hover:text-on-surface shrink-0">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Rating (1-5)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={feedbackForm.rating}
                        onChange={(e) => setFeedbackForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                        className="w-full bg-white dark:bg-surface-container border border-outline-variant/25 text-on-surface rounded-lg px-4 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Comment</label>
                    <textarea
                      value={feedbackForm.comment}
                      onChange={(e) => setFeedbackForm((f) => ({ ...f, comment: e.target.value }))}
                      className="w-full bg-white dark:bg-surface-container border border-outline-variant/25 text-on-surface rounded-lg px-4 py-2 text-sm"
                      rows={4}
                      placeholder="Write a short feedback note…"
                    />
                  </div>
                  <div className="mt-5 flex gap-2 justify-end">
                    <button type="button" onClick={() => setFeedbackFor(null)} className="px-4 py-2 text-xs font-bold tracking-wider uppercase border border-outline-variant/25">
                      Cancel
                    </button>
                    <button type="button" onClick={submitFeedback} className="bg-rose-500 text-white px-4 py-2 text-xs font-bold tracking-wider uppercase">
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}

            <MentorshipVideoCallModal
              open={Boolean(videoCall)}
              onClose={() => setVideoCall(null)}
              mentorshipId={videoCall?.mentorshipId || ''}
              sessionId={videoCall?.sessionId || ''}
              peerName={videoCall?.peerName}
              onCallEnded={() => loadAll()}
            />
          </div>
    </>
  );
}

