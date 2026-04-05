import { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../context/AuthContext';
import { mentorApi } from '../api/mentorApi';
import { mentorshipApi } from '../api/mentorshipApi';
import { formatSessionWhen } from '../utils/mentorshipSessionDisplay';
import { getApiErrorMessage } from '../utils/apiErrorMessage';

function mentorsFromResponse(body) {
  if (!body) return [];
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.mentors)) return body.mentors;
  if (Array.isArray(body.data?.mentors)) return body.data.mentors;
  return [];
}

const DIRECTORY_PAGE_LIMIT = 6;

const DIRECTORY_SORT_OPTIONS = [
  { value: '-rating', label: 'Best match' },
  { value: '-createdAt', label: 'Newest' },
  { value: 'createdAt', label: 'Oldest' },
];

function StarRow({ rating, className = 'text-[15px]' }) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <span className={`leading-none tracking-tight ${className}`} aria-hidden>
      <span className="text-rose-500">{'★'.repeat(r)}</span>
      <span className="text-rose-100">{'★'.repeat(5 - r)}</span>
    </span>
  );
}

function safeList(res) {
  const data = res?.data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.mentors)) return data.mentors;
  if (Array.isArray(data?.data?.mentors)) return data.data.mentors;
  if (Array.isArray(data?.requests)) return data.requests;
  if (Array.isArray(data?.data?.requests)) return data.data.requests;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return '';
  }
}

function localYmd(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return '';
  const y = x.getFullYear();
  const mo = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

export default function MenteeDashboardMentorsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('directory'); // directory | requests | active | history

  const [loading, setLoading] = useState(true);
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [directoryPage, setDirectoryPage] = useState(1);
  const [directoryPagination, setDirectoryPagination] = useState({ totalPages: 1, total: 0 });
  const [sortBy, setSortBy] = useState('-rating');
  const [mentors, setMentors] = useState([]);

  const [requests, setRequests] = useState([]);
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);

  const [requestingMentor, setRequestingMentor] = useState(null);
  const [requestForm, setRequestForm] = useState({
    goals: 'Career growth, Leadership',
    preferredStartDate: '',
    message: 'I would love to learn from your experience.',
  });
  const [submitting, setSubmitting] = useState(false);

  const [goalsFor, setGoalsFor] = useState(null);
  const [goalsInput, setGoalsInput] = useState('');

  const [feedbackFor, setFeedbackFor] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });

  const [expandedId, setExpandedId] = useState(null);

  const directoryTotal = directoryPagination.total;

  const counts = useMemo(
    () => ({
      directory: directoryTotal,
      requests: requests.length,
      active: active.length,
      history: history.length,
    }),
    [directoryTotal, requests.length, active.length, history.length]
  );

  const loadMentors = useCallback(async () => {
    const res = await mentorApi.getAll({
      page: directoryPage,
      limit: DIRECTORY_PAGE_LIMIT,
      sort: sortBy,
      search: appliedSearch || undefined,
    });
    const data = res.data;
    setMentors(mentorsFromResponse(data));
    const pag = data.pagination || {};
    setDirectoryPagination({
      totalPages: pag.pages ?? pag.totalPages ?? 1,
      total: typeof pag.total === 'number' ? pag.total : 0,
    });
  }, [directoryPage, appliedSearch, sortBy]);

  const loadMyMentorship = async () => {
    const [r, a, h] = await Promise.allSettled([
      mentorshipApi.getRequests(),
      mentorshipApi.getActive(),
      mentorshipApi.getHistory(),
    ]);
    if (r.status === 'fulfilled') setRequests(safeList(r.value));
    if (a.status === 'fulfilled') setActive(safeList(a.value));
    if (h.status === 'fulfilled') setHistory(safeList(h.value));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadMyMentorship();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (tab !== 'directory') return;
    let cancelled = false;
    (async () => {
      setMentorsLoading(true);
      try {
        await loadMentors();
      } finally {
        if (!cancelled) setMentorsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, loadMentors]);

  const handleDirectorySearch = () => {
    setAppliedSearch(searchInput.trim());
    setDirectoryPage(1);
  };

  const actuallySendRequest = async () => {
    const goals = requestForm.goals.split(',').map((g) => g.trim()).filter(Boolean);
    if (goals.length === 0) {
      toast.error('Add at least one goal');
      return;
    }
    if (!requestForm.preferredStartDate) {
      toast.error('Choose a preferred start date');
      return;
    }
    setSubmitting(true);
    try {
      const mentorUserId = requestingMentor?.user?._id || requestingMentor?.user || requestingMentor?._id;
      await mentorApi.sendRequest(mentorUserId, {
        goals,
        preferredStartDate: requestForm.preferredStartDate,
        message: requestForm.message.trim() || 'I would love to connect!',
      });
      toast.success('Mentorship request sent!');
      setRequestingMentor(null);
      await loadMyMentorship();
      setTab('requests');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to send request'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectorySortChange = (e) => {
    setSortBy(e.target.value);
    setDirectoryPage(1);
  };

  const dirRangeFrom =
    directoryTotal === 0 ? 0 : (directoryPage - 1) * DIRECTORY_PAGE_LIMIT + 1;
  const dirRangeTo =
    directoryTotal === 0 ? 0 : Math.min(directoryPage * DIRECTORY_PAGE_LIMIT, directoryTotal);

  const cancelRequest = async (id) => {
    try {
      await mentorshipApi.cancelRequest(id);
      toast.success('Request cancelled');
      await loadMyMentorship();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to cancel'));
    }
  };

  const updateGoals = async () => {
    if (!goalsFor?._id) return;
    const goals = goalsInput.split(',').map((g) => g.trim()).filter(Boolean);
    if (goals.length === 0) { toast.error('Add at least one goal'); return; }
    try {
      await mentorshipApi.updateGoals(goalsFor._id, { goals });
      toast.success('Goals updated');
      setGoalsFor(null);
      setGoalsInput('');
      await loadMyMentorship();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to update goals'));
    }
  };

  const submitFeedback = async () => {
    if (!feedbackFor?._id) return;
    try {
      await mentorshipApi.submitFeedback(feedbackFor._id, feedbackForm);
      toast.success('Feedback submitted');
      setFeedbackFor(null);
      setFeedbackForm({ rating: 5, comment: '' });
      await loadMyMentorship();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to submit feedback'));
    }
  };

  // Sessions are read-only for mentees (mentors log sessions).

  return (
    <>
          <DashboardTopBar crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Find Mentors' }]} />

          <div className="p-8 space-y-6 max-w-[1400px] mx-auto w-full">
            <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-serif-alt text-3xl font-bold text-on-surface">Mentorship</h1>
                <p className="text-on-surface-variant text-sm mt-1">
                  Browse mentors, send requests, and manage your mentorship journey.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'directory', label: 'Directory', count: counts.directory },
                  { key: 'requests', label: 'My Requests', count: counts.requests },
                  { key: 'active', label: 'Active', count: counts.active },
                  { key: 'history', label: 'History', count: counts.history },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                      tab === t.key
                        ? 'border-rose-400 bg-rose-50 text-on-surface dark:border-rose-400 dark:bg-rose-950/35'
                        : 'border-outline-variant/25 bg-white dark:bg-surface-container hover:border-rose-300 dark:hover:border-rose-500/50'
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
                {tab === 'directory' && (
                  <div className="bg-white dark:bg-surface-container-lowest border border-neutral-200/90 rounded-xl overflow-hidden">
                    <div className="border-b border-neutral-200/80 bg-gradient-to-br from-white via-white to-rose-50/40 px-4 py-5 sm:px-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative min-w-0 flex-1">
                          <span
                            className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-neutral-400"
                            aria-hidden
                          >
                            <span className="material-symbols-outlined text-[22px] leading-none">search</span>
                          </span>
                          <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleDirectorySearch()}
                            placeholder="Search by name, expertise, or industry…"
                            className="w-full rounded-full border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm text-neutral-900 outline-none transition-shadow placeholder:text-neutral-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100/80 dark:border-outline-variant/25 dark:bg-surface-container dark:text-on-surface"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleDirectorySearch}
                          className="shrink-0 rounded-full bg-neutral-900 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-800"
                        >
                          Search
                        </button>
                      </div>
                    </div>

                    <div className="px-4 py-3.5 sm:flex sm:items-center sm:justify-between sm:px-4 border-b border-neutral-200 bg-white">
                      <p className="text-[11px] font-medium uppercase leading-snug tracking-[0.14em] text-neutral-500">
                        Showing{' '}
                        <span className="font-semibold text-neutral-900 tabular-nums dark:text-on-surface">{dirRangeFrom}</span>
                        –
                        <span className="font-semibold text-neutral-900 tabular-nums dark:text-on-surface">{dirRangeTo}</span>
                        {' of '}
                        <span className="font-semibold text-neutral-900 tabular-nums dark:text-on-surface">{directoryTotal}</span>
                        {' mentors'}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-0 sm:gap-3">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Sort by:</span>
                        <div className="relative min-w-[140px]">
                          <select
                            value={sortBy}
                            onChange={handleDirectorySortChange}
                            className="w-full cursor-pointer appearance-none rounded-md border border-neutral-200 bg-white py-2 pl-3 pr-9 text-sm font-semibold text-neutral-900 outline-none transition-colors hover:border-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-200 dark:border-outline-variant/25 dark:bg-surface-container dark:text-on-surface"
                            aria-label="Sort mentors"
                          >
                            {DIRECTORY_SORT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-rose-500 dark:text-rose-400">
                            <span className="material-symbols-outlined text-[20px] leading-none">expand_more</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      {mentorsLoading ? (
                        <div className="flex justify-center py-20">
                          <Spinner size="lg" />
                        </div>
                      ) : mentors.length === 0 ? (
                        <p className="text-center text-neutral-500 py-16 dark:text-on-surface-variant">No mentors found.</p>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {mentors.map((m) => {
                              const displayName = m.user?.name || 'Mentor';
                              const avatarSrc = m.user?.profilePicture || m.user?.avatar;
                              const initial = displayName[0]?.toUpperCase() || 'M';
                              const industries = m.industries || [];
                              const areas = m.mentoringAreas || [];
                              const roleLine =
                                areas[0] && industries[0]
                                  ? `${areas[0]} at ${industries[0]}`
                                  : areas[0] || industries[0] || 'Mentor';
                              const industryLine =
                                industries.slice(0, 3).join(' • ') || areas.slice(0, 2).join(' • ') || '';
                              const tagPair = (m.expertise || []).slice(0, 2);
                              const ratingVal = Number(m.rating) || 0;
                              const displayRating = ratingVal > 0 ? ratingVal.toFixed(1) : '—';
                              const sessions = m.totalMentorships ?? 0;
                              const sessionLabel = sessions === 1 ? '1 session' : `${sessions} sessions`;

                              return (
                                <article
                                  key={m._id}
                                  className="group flex h-full min-h-0 flex-col rounded-[10px] border border-neutral-200 bg-white p-3 transition-[border-color] hover:border-neutral-300 dark:border-outline-variant/20 dark:bg-surface-container-lowest"
                                >
                                  <div className="flex gap-2.5">
                                    {avatarSrc ? (
                                      <img
                                        src={avatarSrc}
                                        alt=""
                                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-neutral-200/80"
                                      />
                                    ) : (
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-semibold text-neutral-600 ring-1 ring-neutral-200/80">
                                        {initial}
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex min-w-0 items-center gap-1">
                                        <h2 className="font-serif-alt text-[17px] font-semibold leading-tight text-neutral-900 line-clamp-1 dark:text-on-surface">
                                          {displayName}
                                        </h2>
                                        {m.isVerified ? (
                                          <span
                                            className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-sky-500 text-white"
                                            title="Verified mentor"
                                            aria-label="Verified mentor"
                                          >
                                            <span className="material-symbols-outlined text-[14px] leading-none" aria-hidden>
                                              check
                                            </span>
                                          </span>
                                        ) : null}
                                      </div>
                                      <p className="mt-0.5 text-xs leading-snug text-neutral-500 line-clamp-2 dark:text-outline">
                                        {roleLine}
                                      </p>
                                    </div>
                                  </div>

                                  {tagPair.length > 0 && (
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                      {tagPair.map((ex) => (
                                        <span
                                          key={ex}
                                          className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-700 bg-neutral-100 dark:bg-surface-container dark:text-on-surface-variant"
                                        >
                                          {ex}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {industryLine ? (
                                    <p className="mt-1.5 text-[11px] leading-snug text-neutral-500 line-clamp-1 dark:text-outline">
                                      {industryLine}
                                    </p>
                                  ) : null}

                                  <div className="mt-1.5 flex items-baseline gap-2 text-[13px] text-neutral-600 tabular-nums sm:text-sm dark:text-on-surface-variant">
                                    <StarRow rating={ratingVal} />
                                    {displayRating !== '—' ? (
                                      <span>
                                        <span className="font-medium text-neutral-800 dark:text-on-surface">{displayRating}</span>
                                        <span className="text-neutral-400"> · {sessionLabel}</span>
                                      </span>
                                    ) : (
                                      <span className="text-neutral-400">No rating yet</span>
                                    )}
                                  </div>

                                  {m.bio ? (
                                    <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-snug text-neutral-600 dark:text-on-surface-variant">
                                      {m.bio}
                                    </p>
                                  ) : (
                                    <div className="flex-1 min-h-0" aria-hidden />
                                  )}

                                  <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-rose-100/80 pt-2 dark:border-outline-variant/20">
                                    <button
                                      type="button"
                                      title="Request mentorship"
                                      onClick={() => {
                                        setRequestingMentor(m);
                                        setRequestForm({
                                          goals: 'Career growth, Leadership',
                                          preferredStartDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                                          message: 'I would love to learn from your experience.',
                                        });
                                      }}
                                      className="rounded-md bg-rose-500 py-2 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 dark:bg-rose-500 dark:text-white dark:hover:bg-rose-400"
                                    >
                                      Request
                                    </button>
                                    <Link
                                      to={`/mentors/${m._id}`}
                                      title="View full profile"
                                      className="flex items-center justify-center rounded-md border border-rose-300 bg-white py-2 text-[10px] font-semibold uppercase tracking-wide text-rose-900 transition-colors hover:border-rose-400 hover:bg-rose-50 dark:border-rose-400/40 dark:bg-surface-container dark:text-rose-100 dark:hover:bg-rose-950/30"
                                    >
                                      Profile
                                    </Link>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                          <div className="flex justify-center pt-6">
                            <Pagination
                              page={directoryPage}
                              totalPages={directoryPagination.totalPages}
                              onPageChange={(p) => setDirectoryPage(p)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {tab === 'requests' && (
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8">
                    <h2 className="font-serif-alt text-2xl font-bold text-on-surface mb-1">My Requests</h2>
                    <p className="text-on-surface-variant text-sm mb-6">Track and cancel pending requests.</p>
                    {requests.length === 0 ? (
                      <p className="text-on-surface-variant">No requests yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {requests.map((r) => (
                          <div key={r._id} className="border border-outline-variant/20 rounded-xl p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-widest text-outline font-bold">Mentor</p>
                                <p className="font-semibold text-on-surface">{r?.mentor?.name || 'Mentor'}</p>
                                <p className="text-xs text-outline mt-1">Preferred start: {formatDate(r?.preferredStartDate)}</p>
                                <p className="text-xs text-on-surface-variant mt-2 line-clamp-2">
                                  {r?.message || 'No request message.'}
                                </p>
                              </div>
                              <span
                                className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border shrink-0 ${
                                  (r?.status || 'pending') === 'accepted'
                                    ? 'border-green-500 text-green-900 bg-green-200'
                                    : (r?.status || 'pending') === 'rejected'
                                      ? 'border-red-500 text-red-900 bg-red-200'
                                      : (r?.status || 'pending') === 'cancelled'
                                        ? 'border-slate-500 text-slate-900 bg-slate-200'
                                        : 'border-amber-500 text-amber-950 bg-amber-200'
                                }`}
                              >
                                {r?.status || 'pending'}
                              </span>
                            </div>
                            <div className="mt-4 flex gap-2 flex-wrap">
                              {(r?.status || 'pending') === 'pending' ? (
                                <button
                                  type="button"
                                  onClick={() => cancelRequest(r._id)}
                                  className="px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase border border-tertiary/30 text-tertiary hover:bg-tertiary/5"
                                >
                                  Cancel request
                                </button>
                              ) : (
                                <p className="text-xs text-outline">
                                  {r?.status === 'accepted'
                                    ? 'This request has been accepted.'
                                    : r?.status === 'cancelled'
                                      ? 'This request has been cancelled.'
                                      : r?.status === 'rejected'
                                        ? 'This request was rejected.'
                                        : 'This request is not cancellable.'}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'active' && (
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8">
                    <h2 className="font-serif-alt text-2xl font-bold text-on-surface mb-1">Active Mentorship</h2>
                    <p className="text-on-surface-variant text-sm mb-6">View your active mentorship, log sessions, and update goals.</p>

                    {active.length === 0 ? (
                      <p className="text-on-surface-variant">No active mentorships yet. Send a request from the Directory tab.</p>
                    ) : (
                      <div className="space-y-4">
                        {active.map((m) => {
                          const sessionCount = m?.sessions?.length || 0;
                          const goals = m?.goals || [];
                          const isExpanded = expandedId === m._id;
                          return (
                            <div key={m._id} className="border border-outline-variant/20 rounded-xl p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-xs uppercase tracking-widest text-outline font-bold">Mentor</p>
                                  <p className="font-semibold text-on-surface text-lg">{m?.mentor?.name || 'Mentor'}</p>
                                  {m?.mentor?.email && <p className="text-xs text-outline">{m.mentor.email}</p>}
                                  <p className="text-xs text-outline mt-1">Started: {formatDate(m?.startDate)} · Sessions: {sessionCount}</p>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-outline-variant/25 text-outline shrink-0">
                                  {m?.status || 'active'}
                                </span>
                              </div>

                              <div className="mt-4">
                                <p className="text-xs uppercase tracking-widest text-outline font-bold mb-2">Goals</p>
                                <div className="flex flex-wrap gap-2">
                                  {goals.length ? goals.map((g) => (
                                    <span key={g} className="inline-flex rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-100">{g}</span>
                                  )) : <span className="text-sm text-on-surface-variant">No goals set yet.</span>}
                                </div>
                              </div>

                              {sessionCount > 0 && (
                                <div className="mt-4">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedId(isExpanded ? null : m._id)}
                                    className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-rose-600 transition-colors hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                                    {isExpanded ? 'Hide' : 'View'} sessions ({sessionCount})
                                  </button>
                                  {isExpanded && (
                                    <div className="mt-3 space-y-2">
                                      {(m.sessions || []).map((s, i) => (
                                        <div key={i} className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg px-4 py-3 text-sm">
                                          <div className="flex items-center justify-between">
                                            <span className="font-semibold text-on-surface">{formatSessionWhen(s)}</span>
                                            <span className="text-outline">{s.duration} min</span>
                                          </div>
                                          {s.topics?.length > 0 && <p className="text-xs text-outline mt-1">Topics: {s.topics.join(', ')}</p>}
                                          {s.notes && <p className="text-xs text-on-surface-variant mt-1">{s.notes}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="mt-5 flex gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => { setGoalsFor(m); setGoalsInput(goals.join(', ')); }}
                                  className="rounded-lg bg-rose-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-rose-600 dark:hover:bg-rose-400"
                                >
                                  Set goals
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
                  <div className="bg-white border border-outline-variant/20 rounded-xl p-8">
                    <h2 className="font-serif-alt text-2xl font-bold text-on-surface mb-1">Mentorship History</h2>
                    <p className="text-on-surface-variant text-sm mb-6">Past mentorships — submit feedback on completed ones.</p>

                    {history.length === 0 ? (
                      <p className="text-on-surface-variant">No history yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {history.map((m) => {
                          const hasMenteeFeedback = !!m?.feedback?.menteeRating;
                          return (
                            <div key={m._id} className="border border-outline-variant/20 rounded-xl p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-xs uppercase tracking-widest text-outline font-bold">Mentor</p>
                                  <p className="font-semibold text-on-surface text-lg">{m?.mentor?.name || 'Mentor'}</p>
                                  <p className="text-xs text-outline mt-1">
                                    Started: {formatDate(m?.startDate)} · {m?.completedAt ? `Completed: ${formatDate(m.completedAt)}` : `Ended: ${formatDate(m?.endDate)}`}
                                  </p>
                                  <p className="text-xs text-outline">Sessions: {m?.sessions?.length || 0}</p>
                                </div>
                                <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border shrink-0 ${
                                  m?.status === 'completed' ? 'border-green-300 text-green-700 bg-green-50' :
                                  m?.status === 'terminated' ? 'border-red-300 text-red-700 bg-red-50' :
                                  'border-outline-variant/25 text-outline'
                                }`}>
                                  {m?.status}
                                </span>
                              </div>
                              {m?.status === 'completed' && !hasMenteeFeedback && (
                                <div className="mt-4">
                                  <button
                                    type="button"
                                    onClick={() => { setFeedbackFor(m); setFeedbackForm({ rating: 5, comment: '' }); }}
                                    className="rounded-lg bg-rose-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-rose-600 dark:hover:bg-rose-400"
                                  >
                                    Submit feedback
                                  </button>
                                </div>
                              )}
                              {hasMenteeFeedback && (
                                <p className="mt-3 text-xs text-green-700 font-semibold">✓ Feedback submitted (Rating: {m.feedback.menteeRating}/5)</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Request modal — portaled so backdrop covers sticky top bar (avoids parent stacking context) */}
            {requestingMentor &&
              createPortal(
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6"
                  role="presentation"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) setRequestingMentor(null);
                  }}
                >
                  <div
                    className="w-full max-w-xl rounded-2xl border border-outline-variant/20 bg-white p-6 shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.35),0_25px_50px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.06)] dark:bg-surface-container"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="request-mentorship-title"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 id="request-mentorship-title" className="font-serif-alt text-xl font-bold text-on-surface">
                          Request Mentorship
                        </h3>
                        <p className="text-xs text-outline">
                          Mentor: {requestingMentor?.user?.name || requestingMentor?.name || 'Mentor'}
                        </p>
                      </div>
                      <button type="button" onClick={() => setRequestingMentor(null)} className="text-outline hover:text-on-surface">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-outline">Preferred start date</label>
                        <input
                          type="date"
                          value={requestForm.preferredStartDate}
                          onChange={(e) => setRequestForm((f) => ({ ...f, preferredStartDate: e.target.value }))}
                          className="w-full rounded-lg border border-outline-variant/25 bg-white px-4 py-2 text-sm text-on-surface dark:bg-surface-container"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-outline">Goals (comma-separated)</label>
                        <input
                          value={requestForm.goals}
                          onChange={(e) => setRequestForm((f) => ({ ...f, goals: e.target.value }))}
                          className="w-full rounded-lg border border-outline-variant/25 bg-white px-4 py-2 text-sm text-on-surface dark:bg-surface-container"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-outline">Message</label>
                      <textarea
                        value={requestForm.message}
                        onChange={(e) => setRequestForm((f) => ({ ...f, message: e.target.value }))}
                        className="w-full rounded-lg border border-outline-variant/25 bg-white px-4 py-2 text-sm text-on-surface dark:bg-surface-container"
                        rows={4}
                      />
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                      <button type="button" onClick={() => setRequestingMentor(null)} className="border border-outline-variant/25 px-4 py-2 text-xs font-bold uppercase tracking-wider">
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={actuallySendRequest}
                        className="rounded-md bg-rose-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:opacity-60 dark:bg-rose-500 dark:hover:bg-rose-400"
                      >
                        {submitting ? 'Sending…' : 'Send request'}
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

            {/* Goals modal */}
            {goalsFor &&
              createPortal(
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6"
                  role="presentation"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) setGoalsFor(null);
                  }}
                >
                  <div
                    className="w-full max-w-xl border border-outline-variant/20 bg-white p-6 dark:bg-surface-container"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-serif-alt text-xl font-bold text-on-surface">Set Mentorship Goals</h3>
                        <p className="text-xs text-outline">Mentor: {goalsFor?.mentor?.name || 'Mentor'}</p>
                      </div>
                      <button type="button" onClick={() => setGoalsFor(null)} className="text-outline hover:text-on-surface">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-outline">Goals (comma-separated)</label>
                    <input
                      value={goalsInput}
                      onChange={(e) => setGoalsInput(e.target.value)}
                      className="w-full rounded-lg border border-outline-variant/25 bg-white px-4 py-3 text-sm text-on-surface dark:bg-surface-container"
                      placeholder="Leadership, confidence, career growth…"
                    />

                    <div className="mt-5 flex justify-end gap-2">
                      <button type="button" onClick={() => setGoalsFor(null)} className="border border-outline-variant/25 px-4 py-2 text-xs font-bold uppercase tracking-wider">
                        Cancel
                      </button>
                      <button type="button" onClick={updateGoals} className="bg-rose-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-600 dark:hover:bg-rose-400">
                        Save goals
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

            {/* Feedback modal */}
            {feedbackFor &&
              createPortal(
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6"
                  role="presentation"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) setFeedbackFor(null);
                  }}
                >
                  <div
                    className="w-full max-w-lg border border-outline-variant/20 bg-white p-6 dark:bg-surface-container"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-serif-alt text-xl font-bold text-on-surface">Submit Feedback</h3>
                        <p className="text-xs text-outline">Mentor: {feedbackFor?.mentor?.name || 'Mentor'}</p>
                      </div>
                      <button type="button" onClick={() => setFeedbackFor(null)} className="text-outline hover:text-on-surface">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-outline">Rating (1-5)</label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={feedbackForm.rating}
                          onChange={(e) => setFeedbackForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                          className="w-full rounded-lg border border-outline-variant/25 bg-white px-4 py-2 text-sm text-on-surface dark:bg-surface-container"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-outline">Comment</label>
                      <textarea
                        value={feedbackForm.comment}
                        onChange={(e) => setFeedbackForm((f) => ({ ...f, comment: e.target.value }))}
                        className="w-full rounded-lg border border-outline-variant/25 bg-white px-4 py-2 text-sm text-on-surface dark:bg-surface-container"
                        rows={4}
                      />
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                      <button type="button" onClick={() => setFeedbackFor(null)} className="border border-outline-variant/25 px-4 py-2 text-xs font-bold uppercase tracking-wider">
                        Cancel
                      </button>
                      <button type="button" onClick={submitFeedback} className="bg-rose-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-600 dark:hover:bg-rose-400">
                        Submit
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

            <footer className="pt-6 border-t border-outline-variant/20 text-center">
              <p className="text-[10px] text-black dark:text-neutral-100 tracking-widest uppercase">
                © {new Date().getFullYear()} LeadsHer. Built for brilliance.
              </p>
            </footer>
          </div>
    </>
  );
}

