import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { resourceApi } from '../api/resourceApi';
import Spinner from '../components/common/Spinner';
import ResourcePreviewModal from '../components/common/ResourcePreviewModal';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const TYPES = ['article', 'ebook', 'video', 'podcast', 'tool', 'guide'];

const CATEGORIES = [
  { value: '',                    label: 'All Categories' },
  { value: 'leadership-skills',   label: 'Leadership Skills' },
  { value: 'communication',       label: 'Communication' },
  { value: 'negotiation',         label: 'Negotiation' },
  { value: 'time-management',     label: 'Time Management' },
  { value: 'career-planning',     label: 'Career Planning' },
  { value: 'work-life-balance',   label: 'Work-Life Balance' },
  { value: 'networking',          label: 'Networking' },
];

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const SORTS = [
  { value: '-createdAt',     label: 'Newest First' },
  { value: 'createdAt',      label: 'Oldest First' },
  { value: '-averageRating', label: 'Highest Rated' },
  { value: '-views',         label: 'Most Viewed' },
  { value: '-downloads',     label: 'Most Downloaded' },
];

const TYPE_CFG = {
  article: { icon: 'article',       label: 'Article',  thumb: 'from-slate-700 to-slate-900',    badge: 'bg-slate-800/80' },
  ebook:   { icon: 'menu_book',     label: 'Ebook',    thumb: 'from-violet-700 to-purple-900',  badge: 'bg-violet-800/80' },
  video:   { icon: 'play_circle',   label: 'Video',    thumb: 'from-red-700 to-rose-900',       badge: 'bg-red-800/80' },
  podcast: { icon: 'podcasts',      label: 'Podcast',  thumb: 'from-amber-600 to-orange-800',   badge: 'bg-amber-700/80' },
  tool:    { icon: 'build',         label: 'Tool',     thumb: 'from-emerald-700 to-teal-900',   badge: 'bg-emerald-800/80' },
  guide:   { icon: 'local_library', label: 'Guide',    thumb: 'from-[#6242a3] to-[#3a1f7a]',   badge: 'bg-[#6242a3]/80' },
};

const DIFF_BADGE = {
  beginner:     'bg-emerald-500/80',
  intermediate: 'bg-amber-500/80',
  advanced:     'bg-red-500/80',
};

const fmt     = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0));
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }); } catch { return ''; } };

/* ─── Resource Card ──────────────────────────────────────────────────────── */

function ResourceCard({ resource, isAuthenticated, bookmarkedIds, onBookmark, onAccess }) {
  const cfg        = TYPE_CFG[resource.type] || TYPE_CFG.article;
  const diffBadge  = DIFF_BADGE[resource.difficulty] || DIFF_BADGE.beginner;
  const isBookmarked = bookmarkedIds.has(resource._id);

  return (
    <div className="group bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/40 rounded-xl overflow-hidden hover:border-gold-accent/50 hover:shadow-lg transition-all duration-300 flex flex-col">

      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden flex-shrink-0">
        {resource.thumbnail ? (
          <img
            src={resource.thumbnail}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${cfg.thumb} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}>
            <span className="material-symbols-outlined text-white/25 text-[64px]">{cfg.icon}</span>
          </div>
        )}

        {/* Type + Difficulty badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={`px-2 py-1 ${cfg.badge} backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider rounded`}>
            {cfg.label}
          </span>
          <span className={`px-2 py-1 ${diffBadge} backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider rounded`}>
            {resource.difficulty}
          </span>
          {resource.isPremium && (
            <span className="px-2 py-1 bg-gold-accent/80 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider rounded">
              Premium
            </span>
          )}
        </div>

        {/* Bookmark button */}
        <button
          onClick={() => onBookmark(resource._id)}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
            isBookmarked
              ? 'bg-gold-accent text-white'
              : 'bg-black/20 text-white hover:bg-gold-accent hover:text-white'
          }`}
          title={isAuthenticated ? (isBookmarked ? 'Remove bookmark' : 'Bookmark') : 'Sign in to bookmark'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isBookmarked ? 'bookmark' : 'bookmark_border'}
          </span>
        </button>
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="text-base font-bold leading-snug text-on-surface line-clamp-2 group-hover:text-gold-accent transition-colors">
          {resource.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-on-surface-variant line-clamp-2 flex-1">
          {resource.description}
        </p>

        {/* Author + date */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-outline">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">person</span>
            {resource.author || resource.uploadedBy?.name || 'LeadsHer'}
          </span>
          <span>{fmtDate(resource.createdAt)}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-outline-variant/20">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-gold-accent">
              <span className="material-symbols-outlined text-[14px]">download</span>
              {fmt(resource.downloads)}
            </span>
            <span className="flex items-center gap-1 font-semibold text-yellow-500">
              <span className="material-symbols-outlined text-[14px]">star</span>
              {resource.averageRating ? resource.averageRating.toFixed(1) : '—'}
              {resource.ratingCount > 0 && (
                <span className="text-slate-400 font-normal">({resource.ratingCount})</span>
              )}
            </span>
          </div>
        </div>

        {/* Access button */}
        <button
          onClick={() => onAccess(resource)}
          className="w-full py-2 rounded-lg border border-gold-accent/40 text-gold-accent text-sm font-bold hover:bg-gold-accent hover:text-white transition-all"
        >
          Access Resource
        </button>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function PublicResourcesPage() {
  const { isAuthenticated, isMentor } = useAuth();
  const navigate = useNavigate();

  /* ── State ── */
  const [resources, setResources]   = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]       = useState(true);

  const [searchInput, setSearchInput]           = useState('');
  const [search, setSearch]                     = useState('');
  const [activeType, setActiveType]             = useState('all');
  const [filterCategory, setFilterCategory]     = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [sort, setSort]                         = useState('-createdAt');
  const [page, setPage]                         = useState(1);

  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [previewResource, setPreviewResource] = useState(null);

  /* ── Fetch resources ── */
  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await resourceApi.getAll({
        page, limit: 12, sort,
        ...(search ? { search } : {}),
        ...(activeType !== 'all' ? { type: activeType } : {}),
        ...(filterCategory ? { category: filterCategory } : {}),
        ...(filterDifficulty ? { difficulty: filterDifficulty } : {}),
      });
      setResources(res.data?.resources || []);
      setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch {
      toast.error('Failed to load resources');
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort, search, activeType, filterCategory, filterDifficulty]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  /* ── Fetch bookmarks for authenticated users ── */
  useEffect(() => {
    if (!isAuthenticated) return;
    resourceApi.getBookmarks({ limit: 50 })
      .then((res) => {
        const bk = res.data?.resources || [];
        setBookmarkedIds(new Set(bk.map((r) => r._id)));
      })
      .catch(() => {});
  }, [isAuthenticated]);

  /* ── Handlers ── */
  const handleBookmark = async (id) => {
    if (!isAuthenticated) {
      toast('Sign in to bookmark resources', { icon: '🔒' });
      navigate('/login');
      return;
    }
    try {
      const res = await resourceApi.toggleBookmark(id);
      if (res.data.bookmarked) {
        setBookmarkedIds((prev) => new Set([...prev, id]));
      } else {
        setBookmarkedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      }
      toast.success(res.data.bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks');
    } catch {
      toast.error('Failed to update bookmark');
    }
  };

  const handleAccess = (resource) => {
    if (!isAuthenticated) {
      toast('Sign in to access this resource', { icon: '🔒' });
      navigate('/login');
      return;
    }
    resourceApi.trackDownload(resource._id).catch(() => {});
    const rawUrl = resource.file?.url || resource.externalLink;
    if (!rawUrl) { toast('No link or file attached to this resource.', { icon: 'ℹ️' }); return; }
    setPreviewResource(resource);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleTypeChange = (type) => {
    setActiveType(type);
    setPage(1);
    setSearch('');
    setSearchInput('');
    setFilterDifficulty('');
    setFilterCategory('');
    setSort('-createdAt');
  };

  const typePills = [
    { key: 'all', label: 'All Resources' },
    ...TYPES.map((t) => ({ key: t, label: TYPE_CFG[t].label + 's' })),
  ];

  /* ─── RENDER ──────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#f8f6f6] dark:bg-[#100f16] pt-[72px]">

      {/* Hero */}
      <div className="text-center px-6 pt-16 pb-10">
        <h1 className="font-serif-alt text-5xl md:text-7xl font-bold text-on-surface mb-4">
          Leadership Resource Library
        </h1>
        <p className="text-lg text-slate-500 dark:text-on-surface-variant max-w-xl mx-auto mb-8">
          Curated guides, ebooks, videos, and tools designed to accelerate your growth as a visionary leader.
        </p>
        {/* Hero search */}
        <form onSubmit={handleSearch} className="max-w-[600px] mx-auto">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gold-accent text-[22px]">search</span>
            <input
              className="w-full h-14 pl-12 pr-4 bg-white dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 text-on-surface rounded-xl text-base placeholder:text-slate-400 dark:placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-gold-accent/50 focus:border-gold-accent/50 transition-all shadow-sm"
              placeholder="Search for articles, workshops, or mentors..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </form>
      </div>

      {/* Type pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 dark:border-outline-variant/40 pb-6 px-6">
        {typePills.map((pill) => (
          <button
            key={pill.key}
            onClick={() => handleTypeChange(pill.key)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeType === pill.key
                ? 'bg-gold-accent text-white shadow-md shadow-gold-accent/20'
                : 'bg-transparent border border-slate-200 dark:border-outline-variant/40 text-slate-600 dark:text-on-surface-variant hover:border-gold-accent/50 hover:text-gold-accent'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 px-6 py-5">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">

          {/* Category dropdown */}
          <div className="relative min-w-[180px]">
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              className="w-full bg-white dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 text-on-surface rounded-lg px-4 py-2 text-sm appearance-none focus:ring-2 focus:ring-gold-accent/40 focus:outline-none cursor-pointer"
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-outline text-[18px]">expand_more</span>
          </div>

          {/* Difficulty segmented control */}
          <div className="flex bg-slate-100 dark:bg-surface-container-high p-1 rounded-lg border border-slate-200 dark:border-outline-variant/40">
            <button
              onClick={() => { setFilterDifficulty(''); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${!filterDifficulty ? 'bg-white dark:bg-surface-container-low shadow-sm text-on-surface' : 'text-slate-500 dark:text-on-surface-variant hover:text-on-surface'}`}
            >
              All
            </button>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => { setFilterDifficulty(d); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${filterDifficulty === d ? 'bg-white dark:bg-surface-container-low shadow-sm text-on-surface' : 'text-slate-500 dark:text-on-surface-variant hover:text-on-surface'}`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative min-w-[150px]">
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="w-full bg-white dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 text-on-surface rounded-lg px-4 py-2 text-sm appearance-none focus:ring-2 focus:ring-gold-accent/40 focus:outline-none cursor-pointer"
            >
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-outline text-[18px]">sort</span>
          </div>

          {(search || filterCategory || filterDifficulty) && (
            <button
              onClick={() => { setSearch(''); setSearchInput(''); setFilterCategory(''); setFilterDifficulty(''); setPage(1); }}
              className="flex items-center gap-1 text-xs text-slate-400 dark:text-outline hover:text-red-500 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
              Clear filters
            </button>
          )}
        </div>

        {/* CTA — mentor upload or sign-in */}
        {isAuthenticated ? (
          <Link
            to="/dashboard/resources"
            className="w-full lg:w-auto flex items-center justify-center gap-2 bg-gold-accent text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md shadow-gold-accent/20"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            My Library
          </Link>
        ) : (
          <Link
            to="/register"
            className="w-full lg:w-auto flex items-center justify-center gap-2 bg-gold-accent text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md shadow-gold-accent/20"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Join to Upload
          </Link>
        )}
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="flex justify-center py-24"><Spinner size="lg" /></div>
        ) : resources.length === 0 ? (
          <div className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/40 rounded-2xl p-16 text-center">
            <span className="material-symbols-outlined text-[56px] text-slate-200 dark:text-outline">library_books</span>
            <p className="text-slate-400 dark:text-on-surface-variant mt-3 font-medium">
              {search || filterCategory || filterDifficulty
                ? 'No resources match your filters.'
                : 'No resources available yet. Check back soon!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {resources.map((resource) => (
              <ResourceCard
                key={resource._id}
                resource={resource}
                isAuthenticated={isAuthenticated}
                bookmarkedIds={bookmarkedIds}
                onBookmark={handleBookmark}
                onAccess={handleAccess}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-5 py-2 text-sm font-semibold border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container text-slate-500 dark:text-on-surface-variant rounded-lg hover:border-gold-accent/40 hover:text-gold-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Previous
            </button>
            <span className="px-4 py-2 text-sm text-slate-500 dark:text-on-surface-variant">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-5 py-2 text-sm font-semibold border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container text-slate-500 dark:text-on-surface-variant rounded-lg hover:border-gold-accent/40 hover:text-gold-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {previewResource && (
        <ResourcePreviewModal resource={previewResource} onClose={() => setPreviewResource(null)} />
      )}

      {/* Guest CTA banner */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-primary/5 via-gold-accent/5 to-tertiary/5 border-t border-slate-200 dark:border-outline-variant/40 py-12 px-6 text-center">
          <h2 className="font-serif-alt text-2xl font-bold text-on-surface mb-2">
            Unlock the Full Library
          </h2>
          <p className="text-slate-500 dark:text-on-surface-variant mb-6 max-w-md mx-auto text-sm">
            Create a free account to bookmark resources, track your downloads, rate content, and upload your own.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/register"
              className="bg-gold-accent text-white px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-gold-accent/20">
              Create Free Account
            </Link>
            <Link to="/login"
              className="border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container text-slate-600 dark:text-on-surface-variant px-6 py-3 rounded-lg font-bold text-sm hover:border-gold-accent/40 hover:text-gold-accent transition-all">
              Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
