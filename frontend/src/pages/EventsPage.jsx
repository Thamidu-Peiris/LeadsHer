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
    <div className="min-h-screen bg-slate-50 dark:bg-surface">

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-gold-accent text-xs font-bold uppercase tracking-[0.2em] mb-2">LeadsHer</p>
              <h1 className="font-serif-alt text-4xl sm:text-5xl font-bold text-white leading-tight">
                Events & Gatherings
              </h1>
              <p className="text-slate-400 mt-3 text-sm max-w-lg">
                Webinars, workshops, and networking sessions for women leaders and mentors.
              </p>
            </div>
            {canManageEvents && (
              <Link
                to="/events/new"
                className="inline-flex items-center gap-2 bg-gold-accent hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0 shadow-lg shadow-gold-accent/20"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Create Event
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 pb-16">

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
                className="w-full border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-xl pl-9 pr-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-gold-accent/30 focus:border-gold-accent/50 transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 bg-gold-accent hover:opacity-90 text-white text-sm font-bold rounded-xl transition-all"
            >
              Search
            </button>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-on-surface-variant uppercase tracking-widest shrink-0">Category</span>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setFilter('category', c.value)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  filters.category === c.value
                    ? 'bg-gold-accent text-white border-gold-accent shadow-sm'
                    : 'bg-white dark:bg-surface-container border-slate-200 dark:border-outline-variant/40 text-slate-600 dark:text-on-surface-variant hover:border-gold-accent/40'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Status chips */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-on-surface-variant uppercase tracking-widest shrink-0">Status</span>
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setFilter('status', s.value)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  filters.status === s.value
                    ? 'bg-slate-800 dark:bg-on-surface text-white border-slate-800 shadow-sm'
                    : 'bg-white dark:bg-surface-container border-slate-200 dark:border-outline-variant/40 text-slate-600 dark:text-on-surface-variant hover:border-slate-400'
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
              <Link to="/events/new" className="inline-block mt-6 bg-gold-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all">
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
