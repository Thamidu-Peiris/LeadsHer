import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { mentorApi } from '../api/mentorApi';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import MentorFilterSidebar, { defaultFilters } from '../components/mentors/MentorFilterSidebar';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../utils/apiErrorMessage';
import { userDisplayPhoto } from '../utils/absolutePhotoUrl';

/** Backend returns { data: MentorProfile[], pagination: { page, pages, ... } } */
function mentorsFromResponse(body) {
  if (!body) return [];
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.mentors)) return body.mentors;
  if (Array.isArray(body.data?.mentors)) return body.data.mentors;
  return [];
}

const CATEGORY_CHIPS = [
  { id: 'ALL', label: 'All' },
  { id: 'Leadership', label: 'Leadership' },
  { id: 'Entrepreneurship', label: 'Entrepreneurship' },
  { id: 'STEM', label: 'STEM' },
  { id: 'Corporate', label: 'Corporate' },
  { id: 'Social Impact', label: 'Social Impact' },
  { id: 'Career Growth', label: 'Career Growth' },
];

/** 2 columns × 3 rows per page */
const PAGE_LIMIT = 6;

/** Blurred hero background (public/images — replace file to customize) */
const MENTORS_HERO_IMAGE = '/images/mentors-hero.png';

const SORT_OPTIONS = [
  { value: '-rating', label: 'Best match' },
  { value: '-createdAt', label: 'Newest' },
  { value: 'createdAt', label: 'Oldest' },
];

function localYmd(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  const y = x.getFullYear();
  const mo = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

function buildListParams(page, search, applied, sort, category) {
  const expertiseFromSidebar = applied.expertise.length ? applied.expertise.join(',') : undefined;
  const expertiseQuick =
    category && category !== 'ALL' ? category : expertiseFromSidebar;
  return {
    page,
    limit: PAGE_LIMIT,
    sort: sort || '-rating',
    search: search || undefined,
    expertise: expertiseQuick || undefined,
    industry: applied.industry || undefined,
    availableOnly: applied.availableOnly ? 'true' : undefined,
    mentoringAreas: applied.levels.length ? applied.levels.join(',') : undefined,
    minRating: applied.minRating > 0 ? applied.minRating : undefined,
  };
}

function StarRow({ rating, className = 'text-[15px]' }) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <span className={`leading-none tracking-tight ${className}`} aria-hidden>
      <span className="text-rose-500 dark:text-rose-400">{'★'.repeat(r)}</span>
      <span className="text-rose-100 dark:text-rose-900/35">{'★'.repeat(5 - r)}</span>
    </span>
  );
}

export default function MentorsPage() {
  const { isAuthenticated, isMentee } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState(() => ({ ...defaultFilters }));
  const [draftFilters, setDraftFilters] = useState(() => ({ ...defaultFilters }));
  const [sortBy, setSortBy] = useState('-rating');
  const [appliedCategory, setAppliedCategory] = useState('ALL');
  const [requestModalMentor, setRequestModalMentor] = useState(null);
  const [requestForm, setRequestForm] = useState({
    goals: 'Career growth, Leadership',
    preferredStartDate: '',
    message: 'I would love to learn from your experience.',
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const fetchMentors = useCallback(
    (p = 1) => {
      setLoading(true);
      mentorApi
        .getAll(buildListParams(p, appliedSearch, appliedFilters, sortBy, appliedCategory))
        .then((res) => {
          const data = res.data;
          setMentors(mentorsFromResponse(data));
          const pag = data.pagination || {};
          setPagination({
            page: pag.page ?? p,
            totalPages: pag.pages ?? pag.totalPages ?? 1,
            total: typeof pag.total === 'number' ? pag.total : 0,
          });
        })
        .catch(() => setMentors([]))
        .finally(() => setLoading(false));
    },
    [appliedSearch, appliedFilters, sortBy, appliedCategory]
  );

  useEffect(() => {
    fetchMentors(page);
  }, [page, appliedSearch, appliedFilters, sortBy, appliedCategory, fetchMentors]);

  const handleSearch = () => {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

  const selectCategory = (id) => {
    setAppliedCategory(id);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const applySidebarFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  };

  const clearSidebarFilters = () => {
    const z = { ...defaultFilters };
    setDraftFilters(z);
    setAppliedFilters(z);
    setPage(1);
  };

  const openRequestModal = useCallback(
    (e, m) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated) {
        toast.error('Log in to send a request');
        return;
      }
      if (!isMentee) {
        toast.error('Only mentees can request mentorship');
        return;
      }
      const mentorUserId = m?.user?._id || m?.user;
      if (!mentorUserId) {
        toast.error('Could not resolve mentor account');
        return;
      }
      setRequestForm({
        goals: 'Career growth, Leadership',
        preferredStartDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        message: 'I would love to learn from your experience.',
      });
      setRequestModalMentor(m);
    },
    [isAuthenticated, isMentee]
  );

  const submitMentorshipRequest = useCallback(async () => {
    if (!requestModalMentor) return;
    const mentorUserId = requestModalMentor.user?._id || requestModalMentor.user;
    if (!mentorUserId) {
      toast.error('Could not resolve mentor account');
      return;
    }
    const goals = requestForm.goals
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
    if (goals.length === 0) {
      toast.error('Add at least one goal');
      return;
    }
    if (!requestForm.preferredStartDate) {
      toast.error('Choose a preferred start date');
      return;
    }
    if (new Date(requestForm.preferredStartDate) <= new Date()) {
      toast.error('Preferred start date must be in the future');
      return;
    }
    setSubmittingRequest(true);
    try {
      await mentorApi.sendRequest(mentorUserId, {
        goals,
        preferredStartDate: requestForm.preferredStartDate,
        message: requestForm.message.trim() || 'I would love to connect!',
      });
      toast.success('Mentorship request sent!');
      setRequestModalMentor(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to send request'));
    } finally {
      setSubmittingRequest(false);
    }
  }, [requestModalMentor, requestForm]);

  const totalMentors = pagination.total;
  const rangeFrom =
    totalMentors === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const rangeTo =
    totalMentors === 0 ? 0 : Math.min(page * PAGE_LIMIT, totalMentors);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,rgb(237_233_254/0.85),rgb(255_255_255)_42%,rgb(249_250_251))] text-neutral-900 dark:bg-none dark:bg-surface dark:text-on-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-14">
        <section
          className="relative mb-10 overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-100 dark:border-outline-variant/25 dark:bg-surface-container-lowest"
          aria-labelledby="mentors-hero-heading"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
            <div
              className="absolute inset-0 bg-cover bg-no-repeat bg-[85%_center] sm:bg-[82%_25%] dark:opacity-40"
              style={{ backgroundImage: `url(${MENTORS_HERO_IMAGE})` }}
            />
          </div>
          <div className="relative z-10 px-4 py-8 sm:px-6 sm:py-10">
            <header className="mb-8 max-w-3xl text-left">
              <h1
                id="mentors-hero-heading"
                className="font-serif-alt text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl dark:text-on-surface [text-shadow:0_0_20px_rgba(255,255,255,0.95),0_0_8px_rgba(255,255,255,0.9)] dark:[text-shadow:none]"
              >
                Find a Mentor
              </h1>
              <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-on-surface-variant [text-shadow:0_0_12px_rgba(255,255,255,0.9)] dark:[text-shadow:none]">
                Connect with experienced women leaders who can guide your journey
              </p>
            </header>

            <div className="max-w-3xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <span
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400 dark:text-outline"
                    aria-hidden
                  >
                    <span className="material-symbols-outlined text-[22px] leading-none">search</span>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name, expertise, or industry…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full rounded-full border border-slate-200/90 bg-white py-3.5 pl-12 pr-5 text-sm text-neutral-900 shadow-[0_2px_12px_rgba(15,23,42,0.06)] placeholder:text-slate-400 outline-none transition-shadow focus:border-rose-300 focus:ring-2 focus:ring-rose-100/80 dark:border-outline-variant/30 dark:bg-surface-container dark:text-on-surface dark:placeholder:text-outline dark:shadow-none dark:focus:border-rose-400/50 dark:focus:ring-rose-900/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="shrink-0 rounded-full bg-neutral-900 px-8 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-colors hover:bg-neutral-800 dark:bg-gold-accent dark:text-neutral-900 dark:shadow-none dark:hover:brightness-95"
                >
                  Search
                </button>
              </div>
            </div>

            <div
              className="mt-4 flex min-w-0 flex-nowrap gap-1.5 overflow-x-auto pb-0.5 sm:gap-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="group"
              aria-label="Filter by category"
            >
              {CATEGORY_CHIPS.map(({ id, label }) => {
                const selected = appliedCategory === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectCategory(id)}
                    className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all sm:px-3.5 sm:text-[11px] sm:tracking-[0.12em] ${
                      selected
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/35 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600'
                        : 'border border-slate-200/90 bg-white text-slate-600 shadow-sm hover:border-rose-200 hover:bg-rose-50 hover:text-rose-900 dark:border-outline-variant/30 dark:bg-surface-container dark:text-on-surface-variant dark:hover:border-rose-400/40 dark:hover:bg-surface-container-high dark:hover:text-on-surface'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Filter sidebar + results — aligned with header column */}
        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="w-full lg:w-[270px] shrink-0 lg:pt-1">
          <MentorFilterSidebar
            draft={draftFilters}
            setDraft={setDraftFilters}
            onApply={applySidebarFilters}
            onClear={clearSidebarFilters}
          />
        </div>

        <div className="flex-1 min-w-0">
            <div className="mb-4 flex flex-col gap-3 border-b border-neutral-200 bg-white px-3 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-4 dark:border-outline-variant/20 dark:bg-surface-container-lowest">
              <p className="text-[11px] font-medium uppercase leading-snug tracking-[0.14em] text-neutral-500 dark:text-outline">
                Showing{' '}
                <span className="font-semibold text-neutral-900 tabular-nums dark:text-on-surface">
                  {rangeFrom}
                </span>
                –
                <span className="font-semibold text-neutral-900 tabular-nums dark:text-on-surface">
                  {rangeTo}
                </span>
                {' of '}
                <span className="font-semibold text-neutral-900 tabular-nums dark:text-on-surface">
                  {totalMentors}
                </span>
                {' mentors'}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-outline">
                  Sort by:
                </span>
                <div className="relative min-w-[140px]">
                  <select
                    value={sortBy}
                    onChange={handleSortChange}
                    className="w-full cursor-pointer appearance-none rounded-md border border-neutral-200 bg-white py-2 pl-3 pr-9 text-sm font-semibold text-neutral-900 outline-none transition-colors hover:border-neutral-300 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-200 dark:border-outline-variant/25 dark:bg-surface-container dark:text-on-surface dark:hover:border-outline-variant/40 dark:focus:border-gold-accent/50 dark:focus:ring-gold-accent/20"
                    aria-label="Sort mentors"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-600 dark:text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px] leading-none">
                      expand_more
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <Spinner size="lg" />
              </div>
            ) : mentors.length === 0 ? (
              <div className="text-center py-24 rounded-[8px] border border-neutral-200/90 bg-white dark:border-outline-variant/20 dark:bg-surface-container-lowest">
                <p className="text-lg text-[#666666] dark:text-on-surface-variant">No mentors found.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mentors.map((m) => {
                    const displayName = m.user?.name || 'Mentor';
                    const avatarSrc = userDisplayPhoto(m.user || { name: displayName }, { size: 80 });
                    const industries = m.industries || [];
                    const areas = m.mentoringAreas || [];
                    const roleLine =
                      areas[0] && industries[0]
                        ? `${areas[0]} at ${industries[0]}`
                        : areas[0] || industries[0] || 'Mentor';
                    const industryLine = industries.slice(0, 3).join(' • ') || areas.slice(0, 2).join(' • ') || '';
                    const tagPair = (m.expertise || []).slice(0, 2);
                    const ratingVal = Number(m.rating) || 0;
                    const displayRating = ratingVal > 0 ? ratingVal.toFixed(1) : '—';
                    const sessions = m.totalMentorships ?? 0;
                    const sessionLabel = sessions === 1 ? '1 session' : `${sessions} sessions`;

                    return (
                      <article
                        key={m._id}
                        className="group flex h-full min-h-0 flex-col rounded-[10px] border border-neutral-200 bg-white p-3 shadow-sm transition-[box-shadow,border-color] hover:border-neutral-300 hover:shadow-md dark:border-outline-variant/20 dark:bg-surface-container-lowest dark:hover:border-outline-variant/40"
                      >
                        <div className="flex gap-2.5">
                          <img
                            src={avatarSrc}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-neutral-200/80 dark:ring-outline-variant/30"
                          />
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
                          <p className="mt-1.5 text-[11px] leading-snug text-neutral-500 line-clamp-1 dark:text-outline">{industryLine}</p>
                        ) : null}

                        <div className="mt-1.5 flex items-baseline gap-2 text-[13px] text-neutral-600 tabular-nums sm:text-sm dark:text-on-surface-variant">
                          <StarRow rating={ratingVal} />
                          {displayRating !== '—' ? (
                            <span>
                              <span className="font-medium text-neutral-800 dark:text-on-surface">{displayRating}</span>
                              <span className="text-neutral-400 dark:text-outline"> · {sessionLabel}</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400 dark:text-outline">No rating yet</span>
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
                            title={
                              isAuthenticated && !isMentee
                                ? 'Only mentees can request mentorship'
                                : 'Request mentorship'
                            }
                            disabled={isAuthenticated && !isMentee}
                            onClick={(e) => openRequestModal(e, m)}
                            className="rounded-md bg-rose-100 py-2 text-[10px] font-semibold uppercase tracking-wide text-black shadow-sm shadow-rose-200/60 transition-colors hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-rose-900/35 dark:text-rose-50 dark:shadow-none dark:hover:bg-rose-900/55 dark:disabled:hover:bg-rose-900/35"
                          >
                            Request
                          </button>
                          <Link
                            to={`/mentors/${m._id}`}
                            title="View full profile"
                            className="flex items-center justify-center rounded-md border border-rose-300 bg-white py-2 text-[10px] font-semibold uppercase tracking-wide text-rose-900 transition-colors hover:border-rose-400 hover:bg-rose-50 dark:border-rose-400/35 dark:bg-surface-container dark:text-rose-100 dark:hover:border-rose-400/55 dark:hover:bg-rose-950/25"
                          >
                            Profile
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="flex justify-center">
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={(p) => setPage(p)}
                  />
                </div>
              </>
            )}
        </div>
        </div>
      </div>

      {requestModalMentor && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 dark:bg-black/60 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mentors-page-request-modal-title"
        >
          <div className="w-full max-w-xl rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-outline-variant/25 dark:bg-surface-container dark:shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3
                  id="mentors-page-request-modal-title"
                  className="font-serif-alt text-xl font-bold text-neutral-900 dark:text-on-surface"
                >
                  Request mentorship
                </h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-outline">
                  Mentor:{' '}
                  <span className="font-medium text-neutral-800 dark:text-on-surface">
                    {requestModalMentor.user?.name || 'Mentor'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequestModalMentor(null)}
                className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-outline dark:hover:bg-surface-container-high dark:hover:text-on-surface"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[22px] leading-none">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-outline">
                  Preferred start date
                </label>
                <input
                  type="date"
                  min={localYmd(new Date())}
                  value={requestForm.preferredStartDate}
                  onChange={(e) =>
                    setRequestForm((f) => ({ ...f, preferredStartDate: e.target.value }))
                  }
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-gold-accent focus:ring-1 focus:ring-gold-accent/30 dark:border-outline-variant/25 dark:bg-surface-container-lowest dark:text-on-surface dark:focus:ring-gold-accent/25"
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-outline">
                  Goals (comma-separated)
                </label>
                <input
                  type="text"
                  value={requestForm.goals}
                  onChange={(e) => setRequestForm((f) => ({ ...f, goals: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-gold-accent focus:ring-1 focus:ring-gold-accent/30 dark:border-outline-variant/25 dark:bg-surface-container-lowest dark:text-on-surface dark:focus:ring-gold-accent/25"
                  placeholder="e.g. Career growth, Leadership"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-outline">
                Message
              </label>
              <textarea
                value={requestForm.message}
                onChange={(e) => setRequestForm((f) => ({ ...f, message: e.target.value }))}
                rows={4}
                className="w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-gold-accent focus:ring-1 focus:ring-gold-accent/30 dark:border-outline-variant/25 dark:bg-surface-container-lowest dark:text-on-surface dark:focus:ring-gold-accent/25"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRequestModalMentor(null)}
                className="rounded-lg border border-neutral-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-outline-variant/30 dark:text-on-surface-variant dark:hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingRequest}
                onClick={submitMentorshipRequest}
                className="rounded-lg bg-rose-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-rose-500/25 transition-all hover:bg-rose-600 disabled:opacity-60"
              >
                {submittingRequest ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
