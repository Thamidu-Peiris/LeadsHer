import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { resourceApi } from '../api/resourceApi';
import Spinner from '../components/common/Spinner';
import ResourcePreviewModal from '../components/common/ResourcePreviewModal';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const RESOURCES_HERO_IMAGE = '/images/resources-hero.png';

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

/* Match mentee dashboard /dashboard/resources card visuals */
const TYPE_CFG = {
  article: { icon: 'article',       label: 'Article', thumb: 'from-slate-700 to-slate-900',   badge: 'bg-slate-800/80'  },
  ebook:   { icon: 'menu_book',     label: 'Ebook',   thumb: 'from-violet-700 to-purple-900', badge: 'bg-violet-800/80' },
  video:   { icon: 'play_circle',   label: 'Video',   thumb: 'from-red-700 to-rose-900',      badge: 'bg-red-800/80'    },
  podcast: { icon: 'podcasts',      label: 'Podcast', thumb: 'from-amber-600 to-orange-800',  badge: 'bg-amber-700/80'  },
  tool:    { icon: 'build',         label: 'Tool',    thumb: 'from-emerald-700 to-teal-900',  badge: 'bg-emerald-800/80'},
  guide:   { icon: 'local_library', label: 'Guide',   thumb: 'from-[#6242a3] to-[#3a1f7a]',    badge: 'bg-[#6242a3]/80'  },
};

const DIFF_BADGE = {
  beginner:     'bg-emerald-500/80',
  intermediate: 'bg-amber-500/80',
  advanced:     'bg-red-500/80',
};

const fmt     = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0));
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }); } catch { return ''; } };

/* ─── Rate Modal ─────────────────────────────────────────────────────────── */

function RateModal({ resource, onClose, onSave }) {
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview]   = useState('');
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async () => {
    if (!rating) { toast.error('Please select a rating'); return; }
    setSaving(true);
    try { await onSave(resource._id, { rating, review }); onClose(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to submit rating'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-surface-container rounded-2xl shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-outline-variant/20 flex items-center justify-between">
          <h2 className="font-serif-alt text-lg font-bold text-on-surface">Rate this Resource</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm font-semibold text-on-surface line-clamp-1">{resource.title}</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button"
                onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)} className="hover:scale-110 transition-transform">
                <span className={`material-symbols-outlined text-[36px] ${star <= (hovered || rating) ? 'text-rose-600 dark:text-rose-400' : 'text-slate-200 dark:text-outline'}`}>
                  {star <= (hovered || rating) ? 'star' : 'star_border'}
                </span>
              </button>
            ))}
            <span className="ml-2 text-sm text-slate-500 dark:text-on-surface-variant font-medium">
              {rating ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating] : 'Select rating'}
            </span>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-on-surface-variant uppercase tracking-widest mb-1.5">Review (optional)</label>
            <textarea
              className="w-full border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg px-3 py-2 text-sm text-on-surface h-20 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              value={review} onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts..." maxLength={500}
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-outline-variant/20 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant rounded-lg hover:border-slate-300 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || !rating}
            className="rounded-lg bg-rose-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 dark:bg-rose-500">
            {saving ? 'Submitting…' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Resource Card ──────────────────────────────────────────────────────── */

function ResourceCard({ resource, isAuthenticated, bookmarkedIds, onBookmark, onAccess, onRate }) {
  const cfg = TYPE_CFG[resource.type] || TYPE_CFG.article;
  const diffBadge = DIFF_BADGE[resource.difficulty] || DIFF_BADGE.beginner;
  const isBookmarked = bookmarkedIds.has(resource._id);

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-all duration-300 hover:border-rose-500/50 dark:border-outline-variant/40 dark:bg-surface-container-lowest">
      {/* Thumbnail — same as mentee: clean image + compact bookmark */}
      <div className="relative aspect-video flex-shrink-0 overflow-hidden">
        {resource.thumbnail ? (
          <img
            src={resource.thumbnail}
            alt={resource.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${cfg.thumb} transition-transform duration-500 group-hover:scale-105`}>
            <span className="material-symbols-outlined text-[48px] text-white/30">{cfg.icon}</span>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onBookmark(resource._id);
          }}
          className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition-all ${
            isBookmarked
              ? 'bg-black text-white'
              : 'bg-black/20 text-white hover:bg-black hover:text-white'
          }`}
          title={isAuthenticated ? (isBookmarked ? 'Remove bookmark' : 'Bookmark') : 'Sign in to bookmark'}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isBookmarked ? 'bookmark' : 'bookmark_border'}
          </span>
        </button>
      </div>

      {/* Body — badges below thumb, typography + stats row like mentee */}
      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center gap-1">
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white ${cfg.badge}`}>
            {cfg.label}
          </span>
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white ${diffBadge}`}>
            {resource.difficulty}
          </span>
          {resource.isPremium && (
            <span className="rounded bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              Premium
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-on-surface transition-colors group-hover:text-rose-500">
          {resource.title}
        </h3>
        <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500 dark:text-on-surface-variant">
          {resource.description}
        </p>

        <div className="flex min-w-0 items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-outline-variant/20">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums text-blue-800 dark:text-blue-300">
              <span className="material-symbols-outlined text-[16px] leading-none">download</span>
              {fmt(resource.downloads)}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums text-amber-500 dark:text-amber-400">
              <span className="material-symbols-outlined text-[16px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              {resource.averageRating ? resource.averageRating.toFixed(1) : '—'}
              {resource.ratingCount > 0 && (
                <span className="font-normal text-slate-400">({resource.ratingCount})</span>
              )}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onRate(resource);
              }}
              className="flex shrink-0 items-center gap-0.5 text-[10px] text-slate-400 transition-colors hover:text-rose-500 dark:text-outline"
            >
              <span className="material-symbols-outlined text-[12px]">star_border</span>
              Rate
            </button>
          </div>
          <span className="shrink-0 tabular-nums text-[10px] text-slate-400 dark:text-outline">
            {fmtDate(resource.createdAt)}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onAccess(resource);
          }}
          className="w-full rounded-md border border-rose-500/40 py-1.5 text-xs font-bold text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
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
  const [rateTarget, setRateTarget] = useState(null);

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

  const handleRate = (resource) => {
    if (!isAuthenticated) {
      toast('Sign in to rate resources', { icon: '🔒' });
      navigate('/login');
      return;
    }
    setRateTarget(resource);
  };

  const submitRating = async (id, data) => {
    const res = await resourceApi.rate(id, data);
    setResources((prev) =>
      prev.map((r) =>
        r._id === id ? { ...r, averageRating: res.data.averageRating, ratingCount: res.data.ratingCount } : r
      )
    );
    toast.success('Rating submitted');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <section
          className="relative mb-6 overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-100 dark:border-outline-variant/25 dark:bg-surface-container-lowest"
          aria-labelledby="resources-hero-heading"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
            <div
              className="absolute inset-0 bg-cover bg-no-repeat bg-[85%_center] sm:bg-[82%_25%] dark:opacity-40"
              style={{ backgroundImage: `url(${RESOURCES_HERO_IMAGE})` }}
            />
          </div>
          <div className="relative z-10 px-4 py-8 sm:px-6 sm:py-10">
            <header className="mb-6 max-w-3xl text-left">
              <h1
                id="resources-hero-heading"
                className="font-serif-alt text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl dark:text-on-surface [text-shadow:0_0_20px_rgba(255,255,255,0.95),0_0_8px_rgba(255,255,255,0.9)] dark:[text-shadow:none]"
              >
                Leadership Resource Library
              </h1>
              <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-on-surface-variant [text-shadow:0_0_12px_rgba(255,255,255,0.9)] dark:[text-shadow:none]">
                Curated guides, ebooks, videos, and tools designed to accelerate your growth as a visionary leader.
              </p>
            </header>
            {/* Hero search */}
            <form onSubmit={handleSearch} className="max-w-[600px]">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-rose-600 dark:text-rose-400 text-[22px]">search</span>
                <input
                  className="w-full h-14 pl-12 pr-4 bg-white dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 text-on-surface rounded-xl text-base placeholder:text-slate-400 dark:placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all shadow-sm"
                  placeholder="Search for articles, workshops, or mentors..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </form>
          </div>
        </section>
      </div>

      {/* Type pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 dark:border-outline-variant/40 pb-6 px-6">
        {typePills.map((pill) => (
          <button
            key={pill.key}
            onClick={() => handleTypeChange(pill.key)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeType === pill.key
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 dark:bg-rose-500'
                : 'border border-slate-200 bg-transparent text-slate-600 hover:border-rose-400/50 hover:text-rose-600 dark:border-outline-variant/40 dark:text-on-surface-variant dark:hover:text-rose-400'
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
              className="w-full bg-white dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 text-on-surface rounded-lg px-4 py-2 text-sm appearance-none focus:ring-2 focus:ring-rose-500/40 focus:outline-none cursor-pointer"
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
              className="w-full bg-white dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 text-on-surface rounded-lg px-4 py-2 text-sm appearance-none focus:ring-2 focus:ring-rose-500/40 focus:outline-none cursor-pointer"
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
            className="w-full lg:w-auto flex items-center justify-center gap-2 bg-black hover:bg-neutral-900 text-white px-6 py-2.5 rounded-lg font-bold text-sm active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            My Library
          </Link>
        ) : (
          <Link
            to="/register"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition-all hover:opacity-90 active:scale-95 dark:bg-rose-500 lg:w-auto"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {resources.map((resource) => (
              <ResourceCard
                key={resource._id}
                resource={resource}
                isAuthenticated={isAuthenticated}
                bookmarkedIds={bookmarkedIds}
                onBookmark={handleBookmark}
                onAccess={handleAccess}
                onRate={handleRate}
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
              className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-500 transition-all hover:border-rose-400/50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-outline-variant/40 dark:bg-surface-container dark:text-on-surface-variant dark:hover:text-rose-400"
            >
              ← Previous
            </button>
            <span className="px-4 py-2 text-sm text-slate-500 dark:text-on-surface-variant">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-500 transition-all hover:border-rose-400/50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-outline-variant/40 dark:bg-surface-container dark:text-on-surface-variant dark:hover:text-rose-400"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {previewResource && (
        <ResourcePreviewModal resource={previewResource} onClose={() => setPreviewResource(null)} />
      )}

      {rateTarget && (
        <RateModal resource={rateTarget} onClose={() => setRateTarget(null)} onSave={submitRating} />
      )}

      {/* Guest CTA banner */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-primary/5 via-rose-500/10 to-tertiary/5 border-t border-slate-200 dark:border-outline-variant/40 py-12 px-6 text-center">
          <h2 className="font-serif-alt text-2xl font-bold text-on-surface mb-2">
            Unlock the Full Library
          </h2>
          <p className="text-slate-500 dark:text-on-surface-variant mb-6 max-w-md mx-auto text-sm">
            Create a free account to bookmark resources, track your downloads, rate content, and upload your own.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/register"
              className="rounded-lg bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition-all hover:opacity-90 dark:bg-rose-500">
              Create Free Account
            </Link>
            <Link to="/login"
              className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition-all hover:border-rose-400/50 hover:text-rose-600 dark:border-outline-variant/40 dark:bg-surface-container dark:text-on-surface-variant dark:hover:text-rose-400">
              Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
