import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import EventCard from '../components/events/EventCard';
import Pagination from '../components/common/Pagination';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['all', 'webinar', 'workshop', 'networking', 'conference', 'panel-discussion'];
const STATUSES   = ['all', 'upcoming', 'ongoing', 'completed'];

export default function EventsPage() {
  const { canManageEvents } = useAuth();
  const [events, setEvents]       = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]     = useState(true);
  const [filters, setFilters]     = useState({ category: 'all', status: 'upcoming', search: '', page: 1 });

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">Events</h1>
          <p className="section-subtitle">Webinars, workshops, and networking for women leaders</p>
        </div>
        {canManageEvents && (
          <Link to="/events/new" className="btn-primary shrink-0">+ Create Event</Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8 space-y-4">
        <div className="flex gap-2">
          <input
            type="text" placeholder="Search events…"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="input flex-1"
          />
          <button onClick={() => fetchEvents(filters)} className="btn-primary px-6">Search</button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center">Category:</span>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter('category', c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filters.category === c ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center">Status:</span>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter('status', s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filters.status === s ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No events found.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">{pagination.total} events</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
  );
}
