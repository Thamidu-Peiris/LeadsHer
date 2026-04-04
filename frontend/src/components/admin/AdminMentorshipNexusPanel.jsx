import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=128&h=128&fit=crop&crop=face&q=80';

function relativeTime(iso) {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function shortId(id) {
  if (!id) return '—';
  const s = String(id);
  return s.length <= 6 ? s.toUpperCase() : `REQ-${s.slice(-6).toUpperCase()}`;
}

/** Parse `YYYY-MM-DD` to local start of day (browser date inputs). */
function localDayStart(yyyyMmDd) {
  if (!yyyyMmDd || typeof yyyyMmDd !== 'string') return null;
  const parts = yyyyMmDd.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Parse `YYYY-MM-DD` to local end of day. */
function localDayEnd(yyyyMmDd) {
  if (!yyyyMmDd || typeof yyyyMmDd !== 'string') return null;
  const parts = yyyyMmDd.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d, 23, 59, 59, 999);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function statusUi(status) {
  const s = (status || '').toLowerCase();
  if (s === 'pending') {
    return {
      border: 'border-l-4 border-amber-400',
      badge: 'bg-amber-50 text-amber-700',
      label: 'Pending',
    };
  }
  if (s === 'accepted') {
    return {
      border: 'border-l-4 border-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700',
      label: 'Accepted',
    };
  }
  if (s === 'rejected') {
    return {
      border: 'border-l-4 border-rose-500',
      badge: 'bg-rose-50 text-rose-700',
      label: 'Rejected',
    };
  }
  if (s === 'cancelled') {
    return {
      border: 'border-l-4 border-rose-400 opacity-80',
      badge: 'bg-rose-50/90 text-rose-700',
      label: 'Cancelled',
    };
  }
  return {
    border: 'border-l-4 border-slate-300',
    badge: 'bg-slate-100 text-slate-700',
    label: status || '—',
  };
}

function Stars({ value }) {
  const n = Math.min(5, Math.max(0, Math.round(Number(value) || 0)));
  return (
    <div className="flex items-center gap-0.5 text-gold-accent" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="material-symbols-outlined text-base"
          style={{
            fontVariationSettings: i <= n ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
          }}
        >
          star
        </span>
      ))}
    </div>
  );
}

function normalizeId(v) {
  if (v == null) return '';
  if (typeof v === 'object' && v !== null && '$oid' in v) return String(v.$oid);
  return String(v);
}

/** Turn relative upload URLs into absolute so <img> loads from API host (not Vite :3000). */
function absolutePhotoUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const t = url.trim();
  if (!t) return '';
  if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('data:') || t.startsWith('blob:')) {
    return t;
  }
  let origin = '';
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_API_ORIGIN) {
    origin = String(import.meta.env.VITE_PUBLIC_API_ORIGIN).replace(/\/$/, '');
  } else if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL?.startsWith('http')) {
    try {
      origin = new URL(import.meta.env.VITE_API_URL).origin;
    } catch {
      origin = '';
    }
  }
  if (!origin && typeof window !== 'undefined') origin = window.location.origin;
  if (!origin) return t;
  return t.startsWith('/') ? `${origin}${t}` : `${origin}/${t}`;
}

function Avatar({ src, name }) {
  const [imgErr, setImgErr] = useState(false);
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const resolved = absolutePhotoUrl(src);
  useEffect(() => {
    setImgErr(false);
  }, [src]);
  if (resolved && !imgErr) {
    return (
      <img
        alt=""
        className="w-8 h-8 rounded-full border-2 border-white object-cover bg-surface-container-low"
        src={resolved}
        onError={() => setImgErr(true)}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full border-2 border-white bg-gold-accent/15 text-gold-accent flex items-center justify-center text-[10px] font-bold font-sans-modern">
      {initial}
    </div>
  );
}

/** Resolve profile image: supports raw ObjectId strings + merged user objects */
function useParticipantPhotos(authUsers, mentorProfiles) {
  return useMemo(() => {
    const authById = new Map();
    const authByEmail = new Map();

    (authUsers || []).forEach((u) => {
      const id = u?.id ?? u?._id;
      if (id) authById.set(normalizeId(id), u);
      if (u?.email) authByEmail.set(String(u.email).trim().toLowerCase(), u);
    });

    const mentorUserPhotoById = new Map();
    (mentorProfiles || []).forEach((p) => {
      const u = p?.user;
      if (!u) return;
      const id = u?._id ?? u?.id;
      const url = (u.profilePicture || u.avatar || '').trim();
      if (id && url) mentorUserPhotoById.set(normalizeId(id), url);
    });

    const pickUrl = (u) => (u?.profilePicture || u?.avatar || '').trim();

    return (participant) => {
      if (participant == null) return '';

      if (typeof participant === 'string') {
        const pid = normalizeId(participant);
        const u = authById.get(pid);
        if (u) return pickUrl(u) || '';
        if (mentorUserPhotoById.has(pid)) return mentorUserPhotoById.get(pid);
        return '';
      }

      const direct = pickUrl(participant);
      if (direct) return direct;

      const pid = normalizeId(participant._id ?? participant.id);
      if (pid) {
        const u = authById.get(pid);
        const fromAuth = u ? pickUrl(u) : '';
        if (fromAuth) return fromAuth;
        if (mentorUserPhotoById.has(pid)) return mentorUserPhotoById.get(pid);
      }

      const em = (participant.email || '').trim().toLowerCase();
      if (em && authByEmail.has(em)) return pickUrl(authByEmail.get(em)) || '';
      return '';
    };
  }, [authUsers, mentorProfiles]);
}

export default function AdminMentorshipNexusPanel({
  user,
  authUsers,
  mentorProfiles,
  requests,
  activeMentorships,
  feedbackRows,
  onTerminate,
  variant = 'overview',
}) {
  const participantPhoto = useParticipantPhotos(authUsers, mentorProfiles);
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('');
  const [requestDateFrom, setRequestDateFrom] = useState('');
  const [requestDateTo, setRequestDateTo] = useState('');
  const [requestRowsPerPage, setRequestRowsPerPage] = useState(10);
  const [requestPage, setRequestPage] = useState(1);
  const [activeSearch, setActiveSearch] = useState('');
  const [activeRowsPerPage, setActiveRowsPerPage] = useState(10);
  const [activePage, setActivePage] = useState(1);
  const q = variant === 'all-requests' ? requestSearch.trim().toLowerCase() : '';
  const activeQ = variant === 'all-active' ? activeSearch.trim().toLowerCase() : '';
  const statusFilter =
    variant === 'all-requests' ? String(requestStatusFilter || '').toLowerCase() : '';
  const dateFrom = variant === 'all-requests' ? requestDateFrom.trim() : '';
  const dateTo = variant === 'all-requests' ? requestDateTo.trim() : '';

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter) {
        const s = String(r?.status || '').toLowerCase();
        if (s !== statusFilter) return false;
      }
      if (dateFrom || dateTo) {
        const created = r?.createdAt != null ? new Date(r.createdAt) : null;
        if (!created || Number.isNaN(created.getTime())) return false;
        if (dateFrom) {
          const start = localDayStart(dateFrom);
          if (start && created < start) return false;
        }
        if (dateTo) {
          const end = localDayEnd(dateTo);
          if (end && created > end) return false;
        }
      }
      if (!q) return true;
      const blob = [
        r?.mentee?.name,
        r?.mentor?.name,
        r?.message,
        r?.status,
        r?._id,
        ...(Array.isArray(r?.goals) ? r.goals : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [requests, q, statusFilter, dateFrom, dateTo]);

  const filteredActive = useMemo(() => {
    if (!activeQ) return activeMentorships;
    return activeMentorships.filter((m) => {
      const blob = [
        m?.mentee?.name,
        m?.mentor?.name,
        m?._id,
        ...(Array.isArray(m?.goals) ? m.goals : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(activeQ);
    });
  }, [activeMentorships, activeQ]);

  const filteredFeedback = useMemo(() => {
    if (!q) return feedbackRows;
    return feedbackRows.filter((f) => {
      const blob = [
        f?.mentee?.name,
        f?.mentor?.name,
        f?.feedback?.menteeComment,
        f?.feedback?.mentorComment,
        f?._id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [feedbackRows, q]);

  const requestsSorted = useMemo(
    () =>
      [...filteredRequests].sort(
        (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
      ),
    [filteredRequests]
  );

  const requestTotalPages = useMemo(() => {
    if (variant !== 'all-requests') return 1;
    const n = requestsSorted.length;
    if (n === 0) return 1;
    return Math.max(1, Math.ceil(n / requestRowsPerPage));
  }, [variant, requestsSorted.length, requestRowsPerPage]);

  const requestPageEffective = Math.min(Math.max(1, requestPage), requestTotalPages);

  useEffect(() => {
    if (variant !== 'all-requests') return;
    setRequestPage(1);
  }, [variant, q, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (variant !== 'all-requests') return;
    if (requestPage !== requestPageEffective) setRequestPage(requestPageEffective);
  }, [variant, requestPage, requestPageEffective]);

  const tableRequests = useMemo(() => {
    if (variant === 'overview') return requestsSorted.slice(0, 5);
    const n = requestsSorted.length;
    if (n === 0) return [];
    const start = (requestPageEffective - 1) * requestRowsPerPage;
    return requestsSorted.slice(start, start + requestRowsPerPage);
  }, [variant, requestsSorted, requestPageEffective, requestRowsPerPage]);

  const requestRangeLabel = useMemo(() => {
    if (variant !== 'all-requests' || requestsSorted.length === 0) return null;
    const start = (requestPageEffective - 1) * requestRowsPerPage + 1;
    const end = Math.min(requestPageEffective * requestRowsPerPage, requestsSorted.length);
    return { start, end, total: requestsSorted.length };
  }, [variant, requestsSorted.length, requestPageEffective, requestRowsPerPage]);

  const activeSorted = useMemo(
    () =>
      [...filteredActive].sort(
        (a, b) =>
          new Date(b?.startDate || b?.createdAt || 0) - new Date(a?.startDate || a?.createdAt || 0)
      ),
    [filteredActive]
  );

  const activeTotalPages = useMemo(() => {
    if (variant !== 'all-active') return 1;
    const n = activeSorted.length;
    if (n === 0) return 1;
    return Math.max(1, Math.ceil(n / activeRowsPerPage));
  }, [variant, activeSorted.length, activeRowsPerPage]);

  const activePageEffective = Math.min(Math.max(1, activePage), activeTotalPages);

  useEffect(() => {
    if (variant !== 'all-active') return;
    setActivePage(1);
  }, [variant, activeQ]);

  useEffect(() => {
    if (variant !== 'all-active') return;
    if (activePage !== activePageEffective) setActivePage(activePageEffective);
  }, [variant, activePage, activePageEffective]);

  const tableActive = useMemo(() => {
    if (variant === 'overview') return activeSorted.slice(0, 5);
    if (variant !== 'all-active') return [];
    const n = activeSorted.length;
    if (n === 0) return [];
    const start = (activePageEffective - 1) * activeRowsPerPage;
    return activeSorted.slice(start, start + activeRowsPerPage);
  }, [variant, activeSorted, activePageEffective, activeRowsPerPage]);

  const activeRangeLabel = useMemo(() => {
    if (variant !== 'all-active' || activeSorted.length === 0) return null;
    const start = (activePageEffective - 1) * activeRowsPerPage + 1;
    const end = Math.min(activePageEffective * activeRowsPerPage, activeSorted.length);
    return { start, end, total: activeSorted.length };
  }, [variant, activeSorted.length, activePageEffective, activeRowsPerPage]);

  return (
    <div className="space-y-10 max-w-7xl mx-auto w-full pb-16 text-on-surface font-sans-modern">
      {variant === 'all-requests' ? (
        <div>
          <h1 className="font-serif-alt text-3xl font-bold text-on-surface tracking-tight">
            All mentorship requests
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Complete list of requests, newest first.
          </p>
          <div className="mt-5 flex flex-nowrap items-end gap-3 w-full max-w-full overflow-x-auto pb-1 [scrollbar-width:thin]">
            <div className="relative flex-1 min-w-[12rem] max-w-xl">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[22px] pointer-events-none">
                search
              </span>
              <input
                type="search"
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                placeholder="Search mentee, mentor, message, goals, ID…"
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-11 pr-4 py-2.5 text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-2 focus:ring-gold-accent/35 font-sans-modern"
                aria-label="Search mentorship requests"
              />
            </div>
            <div className="shrink-0 w-[11rem]">
              <label
                htmlFor="mentorship-requests-status-filter"
                className="block text-[11px] font-medium text-on-surface-variant mb-1"
              >
                Status
              </label>
              <select
                id="mentorship-requests-status-filter"
                value={requestStatusFilter}
                onChange={(e) => setRequestStatusFilter(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-gold-accent/35 font-sans-modern cursor-pointer"
                aria-label="Filter requests by status"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="shrink-0 w-[10.75rem]">
              <label
                htmlFor="mentorship-requests-date-from"
                className="block text-[11px] font-medium text-on-surface-variant mb-1"
              >
                Created from
              </label>
              <input
                id="mentorship-requests-date-from"
                type="date"
                value={requestDateFrom}
                onChange={(e) => setRequestDateFrom(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-gold-accent/35 font-sans-modern"
                aria-label="Filter requests created on or after this date"
              />
            </div>
            <div className="shrink-0 w-[10.75rem] pr-1">
              <label
                htmlFor="mentorship-requests-date-to"
                className="block text-[11px] font-medium text-on-surface-variant mb-1"
              >
                Created to
              </label>
              <input
                id="mentorship-requests-date-to"
                type="date"
                value={requestDateTo}
                onChange={(e) => setRequestDateTo(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-gold-accent/35 font-sans-modern"
                aria-label="Filter requests created on or before this date"
              />
            </div>
          </div>
        </div>
      ) : variant === 'all-active' ? (
        <div>
          <h1 className="font-serif-alt text-3xl font-bold text-on-surface tracking-tight">
            All active mentorships
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Complete list of active pairs, most recent start first.
          </p>
          <div className="relative max-w-lg mt-5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[22px] pointer-events-none">
              search
            </span>
            <input
              type="search"
              value={activeSearch}
              onChange={(e) => setActiveSearch(e.target.value)}
              placeholder="Search mentor, mentee, goals, or ID…"
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-11 pr-4 py-2.5 text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-2 focus:ring-gold-accent/35 font-sans-modern"
              aria-label="Search active mentorships"
            />
          </div>
        </div>
      ) : (
        <div>
          <h1 className="font-serif-alt text-3xl font-bold text-on-surface tracking-tight">
            Mentorship Management
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Oversee active pairs, review pending requests, and track feedback loops.
          </p>
        </div>
      )}

      {/* Requests */}
      {variant !== 'all-active' && (
      <section id="mentorship-requests" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-alt text-xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-gold-accent">pending_actions</span>
            {variant === 'all-requests' ? 'Requests' : 'Mentorship Requests'}
          </h2>
          {variant === 'overview' && (
            <Link
              to="/dashboard/manage-mentors/view-all-mentorship"
              className="text-primary text-sm font-semibold hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        {requestsSorted.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-6">
            {variant === 'all-requests' && (q || statusFilter || dateFrom || dateTo)
              ? 'No requests match your filters.'
              : 'No requests to display.'}
          </p>
        ) : (
          <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-surface-container-high/50">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-outline w-[100px]">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-outline whitespace-nowrap">
                      Request ID
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-outline min-w-[200px]">
                      Mentee &amp; Mentor
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-outline min-w-[220px]">
                      Message
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-outline">
                      Goals
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-outline whitespace-nowrap text-right">
                      Timeline
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {tableRequests.map((r) => {
                    const su = statusUi(r.status);
                    const menteeName = r?.mentee?.name || 'Mentee';
                    const mentorName = r?.mentor?.name || 'Mentor';
                    const mPic = participantPhoto(r?.mentee);
                    const oPic = participantPhoto(r?.mentor);
                    const goals = Array.isArray(r.goals) ? r.goals : [];
                    return (
                      <tr
                        key={r._id}
                        className="group hover:bg-surface-container-low/80 transition-colors border-b border-outline-variant/25 last:border-0"
                      >
                        <td className="px-4 sm:px-6 py-4 align-top">
                          <span
                            className={`${su.badge} inline-block text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider font-sans-modern whitespace-nowrap`}
                          >
                            {su.label}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 align-top text-xs text-outline font-mono whitespace-nowrap">
                          {shortId(r._id)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 align-top">
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-2 shrink-0">
                              <Avatar src={oPic} name={mentorName} />
                              <Avatar src={mPic} name={menteeName} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-on-surface leading-snug">
                                {menteeName}{' '}
                                <span className="text-on-surface-variant font-normal">to</span> {mentorName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 align-top max-w-xs">
                          {r.message ? (
                            <p className="text-sm text-on-surface-variant italic line-clamp-2">&ldquo;{r.message}&rdquo;</p>
                          ) : (
                            <span className="text-sm text-outline">—</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 align-top">
                          <div className="flex flex-wrap gap-1.5">
                            {goals.slice(0, 5).map((g) => (
                              <span
                                key={g}
                                className="bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              >
                                {g}
                              </span>
                            ))}
                            {goals.length === 0 && <span className="text-xs text-outline">—</span>}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 align-top text-right">
                          <div className="text-[10px] text-on-surface-variant space-y-1">
                            <p>
                              <span className="text-outline uppercase tracking-wider">Start</span>
                              <br />
                              <span className="text-on-surface font-medium">
                                {r.preferredStartDate
                                  ? new Date(r.preferredStartDate).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })
                                  : '—'}
                              </span>
                            </p>
                            <p className="text-outline">{relativeTime(r.createdAt)}</p>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {variant === 'all-requests' && requestRangeLabel && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3 border-t border-outline-variant/20 bg-surface-container-high/30 text-sm text-on-surface-variant">
                <p>
                  Showing{' '}
                  <span className="font-medium text-on-surface tabular-nums">{requestRangeLabel.start}</span>
                  –
                  <span className="font-medium text-on-surface tabular-nums">{requestRangeLabel.end}</span>
                  {' of '}
                  <span className="font-medium text-on-surface tabular-nums">{requestRangeLabel.total}</span>
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="mentorship-requests-rows-per-page" className="text-xs whitespace-nowrap">
                      Rows per page
                    </label>
                    <select
                      id="mentorship-requests-rows-per-page"
                      value={requestRowsPerPage}
                      onChange={(e) => {
                        setRequestRowsPerPage(Number(e.target.value));
                        setRequestPage(1);
                      }}
                      className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-gold-accent/35 font-sans-modern cursor-pointer tabular-nums"
                      aria-label="Rows per page"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-surface-container-high/80 disabled:opacity-40 disabled:pointer-events-none"
                      disabled={requestPageEffective <= 1}
                      onClick={() => setRequestPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <span className="text-xs tabular-nums px-1">
                      Page {requestPageEffective} of {requestTotalPages}
                    </span>
                    <button
                      type="button"
                      className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-surface-container-high/80 disabled:opacity-40 disabled:pointer-events-none"
                      disabled={requestPageEffective >= requestTotalPages}
                      onClick={() => setRequestPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      )}

      {(variant === 'overview' || variant === 'all-active') && (
        <>
      {/* Active table */}
      <section id="active-mentorships" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-alt text-xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-gold-accent">hub</span>
            Active Mentorships
          </h2>
          {variant === 'overview' && (
            <Link
              to="/dashboard/manage-mentors/view-all-active-mentorship"
              className="text-primary text-sm font-semibold hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-high/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-outline">
                    Mentor &amp; Mentee
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-outline">Goals</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-outline text-center">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-outline text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {activeSorted.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                      {variant === 'all-active' && activeQ
                        ? 'No active mentorships match your search.'
                        : 'No active mentorships to display.'}
                    </td>
                  </tr>
                ) : (
                  tableActive.map((m) => {
                    const goals = Array.isArray(m.goals) ? m.goals : [];
                    return (
                      <tr key={m._id} className="group hover:bg-surface-container-low/80 transition-colors border-b border-outline-variant/25 last:border-0">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-bold text-on-surface">
                              {m?.mentor?.name || 'Mentor'} &amp; {m?.mentee?.name || 'Mentee'}
                            </p>
                            <p className="text-[10px] text-outline">ID: MNT-{String(m._id).slice(-6).toUpperCase()}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {goals.slice(0, 4).map((g) => (
                              <span
                                key={g}
                                className="bg-secondary-container/80 text-on-secondary-container text-[10px] px-2 py-0.5 rounded-full"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-emerald-700 flex items-center justify-center gap-1 text-xs font-bold">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => onTerminate(m._id)}
                            className="border border-error/40 text-error hover:bg-error hover:text-on-error px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                          >
                            Terminate
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {variant === 'all-active' && activeRangeLabel && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3 border-t border-outline-variant/20 bg-surface-container-high/30 text-sm text-on-surface-variant">
              <p>
                Showing{' '}
                <span className="font-medium text-on-surface tabular-nums">{activeRangeLabel.start}</span>
                –
                <span className="font-medium text-on-surface tabular-nums">{activeRangeLabel.end}</span>
                {' of '}
                <span className="font-medium text-on-surface tabular-nums">{activeRangeLabel.total}</span>
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="mentorship-active-rows-per-page" className="text-xs whitespace-nowrap">
                    Rows per page
                  </label>
                  <select
                    id="mentorship-active-rows-per-page"
                    value={activeRowsPerPage}
                    onChange={(e) => {
                      setActiveRowsPerPage(Number(e.target.value));
                      setActivePage(1);
                    }}
                    className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-gold-accent/35 font-sans-modern cursor-pointer tabular-nums"
                    aria-label="Rows per page"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-surface-container-high/80 disabled:opacity-40 disabled:pointer-events-none"
                    disabled={activePageEffective <= 1}
                    onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="text-xs tabular-nums px-1">
                    Page {activePageEffective} of {activeTotalPages}
                  </span>
                  <button
                    type="button"
                    className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-surface-container-high/80 disabled:opacity-40 disabled:pointer-events-none"
                    disabled={activePageEffective >= activeTotalPages}
                    onClick={() => setActivePage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {variant === 'overview' && (
      <>
      {/* Feedback */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-alt text-xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-gold-accent">reviews</span>
            Recent Feedback
          </h2>
        </div>

        {filteredFeedback.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-6">No feedback records to display.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFeedback.slice(0, 12).map((f) => {
              const fb = f.feedback || {};
              const menteeComment = fb.menteeComment;
              const mentorComment = fb.mentorComment;
              return (
                <div
                  key={f._id}
                  className="bg-white p-6 rounded-xl border border-outline-variant/20"
                >
                  <div className="flex flex-col gap-4">
                    {fb.mentorRating != null && (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <img
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-outline-variant/20"
                              src={absolutePhotoUrl(participantPhoto(f?.mentee)) || PLACEHOLDER}
                            />
                            <div>
                              <p className="text-sm font-bold text-on-surface">{f?.mentee?.name || 'Mentee'}</p>
                              <p className="text-[10px] text-on-surface-variant">Reviewed {f?.mentor?.name || 'mentor'}</p>
                            </div>
                          </div>
                          <Stars value={fb.mentorRating} />
                        </div>
                        {menteeComment && (
                          <p className="text-sm text-on-surface leading-relaxed italic">&ldquo;{menteeComment}&rdquo;</p>
                        )}
                      </div>
                    )}
                    {fb.menteeRating != null && (
                      <div className={fb.mentorRating != null ? 'pt-3 border-t border-outline-variant/25' : ''}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <img
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-outline-variant/20"
                              src={absolutePhotoUrl(participantPhoto(f?.mentor)) || PLACEHOLDER}
                            />
                            <div>
                              <p className="text-sm font-bold text-on-surface">{f?.mentor?.name || 'Mentor'}</p>
                              <p className="text-[10px] text-on-surface-variant">Reviewed {f?.mentee?.name || 'mentee'}</p>
                            </div>
                          </div>
                          <Stars value={fb.menteeRating} />
                        </div>
                        {mentorComment && (
                          <p className="text-sm text-on-surface leading-relaxed italic">&ldquo;{mentorComment}&rdquo;</p>
                        )}
                      </div>
                    )}
                    {!fb.mentorRating && !fb.menteeRating && (
                      <p className="text-sm text-on-surface-variant">Feedback recorded for this mentorship.</p>
                    )}
                  </div>
                  <div className="mt-4 flex justify-between items-center text-[10px] text-outline">
                    <span>Ref: FB-{String(f._id).slice(-6).toUpperCase()}</span>
                    <span>
                      {f.completedAt
                        ? new Date(f.completedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      </>
      )}
    </>
    )}
    </div>
  );
}
