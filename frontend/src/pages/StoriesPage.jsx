import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { storyApi } from '../api/storyApi';
import StoryCard from '../components/stories/StoryCard';
import Pagination from '../components/common/Pagination';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['all', 'leadership', 'entrepreneurship', 'STEM', 'corporate', 'social-impact', 'career-growth'];
const SORTS = [
  { value: '-createdAt', label: 'Newest' },
  { value: '-views', label: 'Most viewed' },
  { value: '-likes', label: 'Most liked' },
];

export default function StoriesPage() {
  const { isAuthenticated, user } = useAuth();
  const newStoryHref = user?.role === 'mentor' ? '/dashboard/stories/new' : '/stories/new';
  const [stories, setStories]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]     = useState(true);
  const [filters, setFilters]     = useState({ category: 'all', search: '', sort: '-createdAt', page: 1 });

  const fetchStories = useCallback((f) => {
    setLoading(true);
    const params = { page: f.page, limit: 9, sort: f.sort };
    if (f.category !== 'all') params.category = f.category;
    if (f.search) params.search = f.search;

    storyApi.getAll(params)
      .then((res) => {
        const data = res.data;
        setStories(data.stories || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStories(filters); }, [filters]);

  const setFilter = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value, page: key !== 'page' ? 1 : value }));

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStories(filters);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">Stories</h1>
          <p className="section-subtitle">Discover leadership journeys from women around the world</p>
        </div>
        {isAuthenticated && (
          <Link to={newStoryHref} className="btn-primary shrink-0">+ Share Story</Link>
        )}
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-surface-container-lowest rounded-2xl border border-gray-100 dark:border-outline-variant/20 shadow-sm p-4 mb-8 space-y-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text" placeholder="Search stories…"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="input flex-1"
          />
          <button type="submit" className="btn-primary px-6">Search</button>
        </form>

        {/* Category + Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter('category', c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filters.category === c
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 dark:bg-surface-container text-gray-600 dark:text-on-surface-variant hover:bg-gray-200 dark:hover:bg-surface-container-high'
              }`}
            >
              {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}

          <select
            value={filters.sort}
            onChange={(e) => setFilter('sort', e.target.value)}
            className="ml-auto input w-auto py-1.5 text-xs"
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : stories.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 dark:text-on-surface-variant text-lg mb-4">No stories found.</p>
          {isAuthenticated && (
            <Link to={newStoryHref} className="btn-primary">Be the first to share</Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 dark:text-on-surface-variant mb-4">{pagination.total} stories</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((s) => <StoryCard key={s._id} story={s} />)}
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
