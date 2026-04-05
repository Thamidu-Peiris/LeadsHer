import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import EventCard from '../components/events/EventCard';
import Pagination from '../components/common/Pagination';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: 'all',              label: 'All' },
  { value: 'webinar',          label: 'Webinar' },
  { value: 'workshop',         label: 'Workshop' },
  { value: 'networking',       label: 'Networking' },
  { value: 'conference',       label: 'Conference' },
  { value: 'panel-discussion', label: 'Panel Discussion' },
];

const STATUSES = [
  { value: 'all',       label: 'All Statuses' },
  { value: 'upcoming',  label: 'Upcoming' },
  { value: 'ongoing',   label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
];

/** Hero image (public/images — add events-hero.png or reuse a suitable asset) */
const EVENTS_HERO_IMAGE = '/images/events-hero.png';

export default function EventsPage() {
  const { canManageEvents } = useAuth();
  const [events, setEvents]       = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]     = useState(true);
  const [filters, setFilters]     = useState({ category: 'all', status: 'upcoming', search: '', page: 1 });
  const [searchInput, setSearchInput] = useState('');

  const fetchEvents = useCallback((f) => {
    setLoading(true);
    const params = { page: f.page, limit: 9 };
    if (f.category !== 'all') params.category = f.category;
    if (f.status   !== 'all') params.status   = f.status;
    if (f.search)              params.search   = f.search;

    eventApi.getAll(params)
      .then((res) => {
        const data = res.data?.data || res.data;
        const evts = data?.events || [];
        setEvents(evts);
        const total   = res.data?.results || evts.length;
        const perPage = 9;
        setPagination({ page: f.page, totalPages: Math.ceil(total / perPage), total });
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchEvents(filters); }, [filters]);

  const setFilter = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value, page: key !== 'page' ? 1 : value }));

  const handleSearch = () => setFilter('search', searchInput.trim());

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,rgb(237_233_254/0.85),rgb(255_255_255)_42%,rgb(249_250_251))] text-neutral-900 dark:bg-none dark:bg-surface dark:text-on-surface">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        {/* Hero — same boxed + image pattern as /mentors */}
        <section
          className="relative mb-10 overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-100 dark:border-outline-variant/25 dark:bg-surface-container-lowest"
          aria-labelledby="events-hero-heading"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
            <div
              className="absolute inset-0 bg-cover bg-no-repeat bg-[80%_center] sm:bg-[78%_22%] dark:opacity-40"
              style={{ backgroundImage: `url(${EVENTS_HERO_IMAGE})` }}
            />
          </div>
          <div className="relative z-10 px-4 py-8 sm:px-6 sm:py-10">
            <header className="mb-0 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl text-left">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 [text-shadow:0_0_16px_rgba(255,255,255,0.95)] dark:[text-shadow:none]">
                  LeadsHer
                </p>
                <h1
                  id="events-hero-heading"
                  className="font-serif-alt text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl dark:text-on-surface [text-shadow:0_0_20px_rgba(255,255,255,0.95),0_0_8px_rgba(255,255,255,0.9)] dark:[text-shadow:none]"
                >
                  Events &amp; Gatherings
                </h1>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-slate-600 dark:text-on-surface-variant [text-shadow:0_0_12px_rgba(255,255,255,0.9)] dark:[text-shadow:none]">
                  Webinars, workshops, and networking sessions for women leaders and mentors.
                </p>
              </div>
              {canManageEvents && (
                <Link
                  to="/events/new"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-colors hover:bg-neutral-800 dark:bg-rose-600 dark:text-white dark:shadow-md dark:shadow-rose-600/25 dark:hover:bg-rose-700 sm:px-8"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  Create Event
                </Link>
              )}
            </header>
          </div>
        </section>

        {/* Filter card */}
        <div className="bg-white dark:bg-surface-container-lowest rounded-2xl border border-slate-100 dark:border-outline-variant/20 shadow-md p-5 mb-8 space-y-4">

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search events…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-xl pl-9 pr-4 py-2.5 text-sm text-on-surface transition-all focus:outline-none focus:ring-2 focus:ring-rose-200/80 focus:border-rose-300 dark:focus:border-rose-400/50 dark:focus:ring-rose-900/40"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/30 transition-colors hover:bg-rose-700 dark:bg-rose-500 dark:shadow-rose-500/25 dark:hover:bg-rose-600"
            >
              Search
            </button>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-rose-600/90 dark:text-rose-400/90">
              Category
            </span>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setFilter('category', c.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                  filters.category === c.value
                    ? 'border-rose-600 bg-rose-600 text-white shadow-md shadow-rose-600/35 hover:bg-rose-700 dark:border-rose-500 dark:bg-rose-500 dark:hover:bg-rose-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-900 dark:border-outline-variant/40 dark:bg-surface-container dark:text-on-surface-variant dark:hover:border-rose-400/40 dark:hover:bg-surface-container-high dark:hover:text-on-surface'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Status chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-rose-600/90 dark:text-rose-400/90">
              Status
            </span>
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setFilter('status', s.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                  filters.status === s.value
                    ? 'border-rose-600 bg-rose-600 text-white shadow-md shadow-rose-600/35 hover:bg-rose-700 dark:border-rose-500 dark:bg-rose-500 dark:hover:bg-rose-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-900 dark:border-outline-variant/40 dark:bg-surface-container dark:text-on-surface-variant dark:hover:border-rose-400/40 dark:hover:bg-surface-container-high dark:hover:text-on-surface'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-slate-400 dark:text-on-surface-variant">Loading events…</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-surface-container-lowest rounded-2xl border border-slate-100 dark:border-outline-variant/20">
            <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-outline mb-4 block">event_busy</span>
            <p className="text-slate-500 dark:text-on-surface-variant text-lg font-medium">No events found</p>
            <p className="text-slate-400 dark:text-outline text-sm mt-1">Try adjusting your filters or search query</p>
            {canManageEvents && (
              <Link to="/events/new" className="mt-6 inline-block rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition-colors hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600">
                Create the first event
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-400 dark:text-on-surface-variant mb-5">
              <span className="font-semibold text-on-surface">{pagination.total}</span> event{pagination.total !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((e) => <EventCard key={e._id} event={e} />)}
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => setFilter('page', p)}
            />
          </>
        )}
      </div>
    </div>
  );
}
