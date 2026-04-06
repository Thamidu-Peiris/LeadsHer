import { useEffect, useState, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { resourceApi } from '../api/resourceApi';
import Spinner from '../components/common/Spinner';
import ResourcePreviewModal from '../components/common/ResourcePreviewModal';

/* ─── Constants ──────────────────────────────────────────────────────────── */

const TYPES = ['article', 'ebook', 'video', 'podcast', 'tool', 'guide'];

const CATEGORIES = [
  { value: '',                   label: 'All Categories'    },
  { value: 'leadership-skills',  label: 'Leadership Skills' },
  { value: 'communication',      label: 'Communication'     },
  { value: 'negotiation',        label: 'Negotiation'       },
  { value: 'time-management',    label: 'Time Management'   },
  { value: 'career-planning',    label: 'Career Planning'   },
  { value: 'work-life-balance',  label: 'Work-Life Balance' },
  { value: 'networking',         label: 'Networking'        },
];

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const SORTS = [
  { value: '-createdAt',     label: 'Newest First'    },
  { value: 'createdAt',      label: 'Oldest First'    },
  { value: '-averageRating', label: 'Highest Rated'   },
  { value: '-views',         label: 'Most Viewed'     },
  { value: '-downloads',     label: 'Most Downloaded' },
];

const TYPE_CFG = {
  article: { icon: 'article',       label: 'Article', thumb: 'from-slate-700 to-slate-900',   badge: 'bg-slate-800/80'  },
  ebook:   { icon: 'menu_book',     label: 'Ebook',   thumb: 'from-violet-700 to-purple-900', badge: 'bg-violet-800/80' },
  video:   { icon: 'play_circle',   label: 'Video',   thumb: 'from-red-700 to-rose-900',      badge: 'bg-red-800/80'    },
  podcast: { icon: 'podcasts',      label: 'Podcast', thumb: 'from-amber-600 to-orange-800',  badge: 'bg-amber-700/80'  },
  tool:    { icon: 'build',         label: 'Tool',    thumb: 'from-emerald-700 to-teal-900',  badge: 'bg-emerald-800/80'},
  guide:   { icon: 'local_library', label: 'Guide',   thumb: 'from-[#6242a3] to-[#3a1f7a]',  badge: 'bg-[#6242a3]/80'  },
};

const DIFF_BADGE = {
  beginner:     'bg-emerald-500/80',
  intermediate: 'bg-amber-500/80',
  advanced:     'bg-red-500/80',
};

const fmt     = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0));
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }); } catch { return ''; } };

/* ─── Resource Card ──────────────────────────────────────────────────────── */

function ResourceCard({ resource, bookmarkedIds, onBookmark, onDownload, onRate, onPreview }) {
  const cfg        = TYPE_CFG[resource.type] || TYPE_CFG.article;
  const diffBadge  = DIFF_BADGE[resource.difficulty] || DIFF_BADGE.beginner;
  const isBookmarked = bookmarkedIds.has(resource._id);

  const handleAccess = () => {
    onDownload(resource._id);
    const rawUrl = resource.file?.url || resource.externalLink;
    if (!rawUrl) { toast('No link or file attached to this resource.', { icon: 'ℹ️' }); return; }
    onPreview(resource);
  };

  return (
    <div className="group bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/40 rounded-lg overflow-hidden hover:border-rose-500/50 transition-all duration-300 flex flex-col">

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
            <span className="material-symbols-outlined text-white/30 text-[48px]">{cfg.icon}</span>
          </div>
        )}

        {/* Bookmark button */}
        <button
          onClick={() => onBookmark(resource._id)}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
            isBookmarked
              ? 'bg-black text-white'
              : 'bg-black/20 text-white hover:bg-black hover:text-white'
          }`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isBookmarked ? 'bookmark' : 'bookmark_border'}
          </span>
        </button>
      </div>

      {/* Card body */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <span className={`px-1.5 py-0.5 ${cfg.badge} text-white text-[9px] uppercase font-bold tracking-wider rounded`}>
            {cfg.label}
          </span>
          <span className={`px-1.5 py-0.5 ${diffBadge} text-white text-[9px] uppercase font-bold tracking-wider rounded`}>
            {resource.difficulty}
          </span>
          {resource.isPremium && (
            <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] uppercase font-bold tracking-wider rounded">
              Premium
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold leading-snug text-on-surface line-clamp-2 group-hover:text-rose-500 transition-colors">
          {resource.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-on-surface-variant line-clamp-2 flex-1 leading-relaxed">
          {resource.description}
        </p>

        {/* Downloads (blue), rating (amber) + count — date (right) */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-outline-variant/20 min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
            <span className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-blue-800 dark:text-blue-300 tabular-nums" title="Downloads">
              <span className="material-symbols-outlined text-[17px] leading-none text-blue-800 dark:text-blue-300">download</span>
              {fmt(resource.downloads ?? 0)}
            </span>
            <span className="flex items-center gap-1 shrink-0 text-xs font-bold tabular-nums text-amber-500 dark:text-amber-400" title="Average rating">
              <span
                className="material-symbols-outlined text-[17px] leading-none text-amber-500 dark:text-amber-400"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              {(Number(resource.averageRating) || 0).toFixed(1)}
              <span className="font-normal text-slate-400 dark:text-slate-500">({resource.ratingCount ?? 0})</span>
            </span>
            <button
              type="button"
              onClick={() => onRate(resource)}
              className="text-[10px] text-slate-400 dark:text-outline hover:text-rose-500 transition-colors flex items-center gap-0.5 shrink-0"
            >
              <span className="material-symbols-outlined text-[12px]">star_border</span>
              Rate
            </button>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-outline shrink-0 tabular-nums">
            {fmtDate(resource.createdAt)}
          </span>
        </div>

        {/* Access button */}
        <button
          onClick={handleAccess}
          className="w-full py-1.5 rounded-md border border-rose-500/40 text-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all"
        >
          Access Resource
        </button>
      </div>
    </div>
  );
}

/* ─── Bookmarks (shared list + right rail) ───────────────────────────────── */

function BookmarksList({ bookmarks, onRemove }) {
  if (bookmarks.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-outline text-center py-6 px-2">
        No bookmarks yet. Save resources to find them here.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2 max-h-[min(60vh,28rem)] overflow-y-auto pr-1 -mr-1">
      {bookmarks.map((r) => {
        const cfg = TYPE_CFG[r.type] || TYPE_CFG.article;
        return (
          <li key={r._id}>
            <div className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-surface-container border border-transparent hover:border-rose-500/30 transition-all">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${cfg.thumb} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                {r.thumbnail ? (
                  <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="material-symbols-outlined text-white/50 text-[20px]">{cfg.icon}</span>
                )}
              </div>
              <div className="flex flex-col justify-center overflow-hidden flex-1 min-w-0">
                <h4 className="text-xs font-bold line-clamp-2 text-on-surface">{r.title}</h4>
                <span className="text-[10px] text-slate-400 dark:text-outline mt-0.5 uppercase font-bold tracking-widest">{cfg.label}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(r._id)}
                className="self-start text-slate-300 dark:text-outline hover:text-red-500 transition-colors flex-shrink-0 p-0.5"
                title="Remove bookmark"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function BookmarksPanelHeader({ bookmarkCount }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
        <span className="material-symbols-outlined text-[20px]">bookmarks</span>
      </div>
      <span className="text-sm font-bold text-on-surface truncate">Your Bookmarks</span>
      {bookmarkCount > 0 && (
        <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold tabular-nums shrink-0">
          {bookmarkCount}
        </span>
      )}
    </div>
  );
}

/** `verticalCollapse={false}` when nested in BookmarksRightRail (rail hides horizontally). */
function BookmarksPanel({ bookmarks, bookmarkCount, onRemove, className = '', verticalCollapse = true }) {
  const [open, setOpen] = useState(false);

  if (!verticalCollapse) {
    return (
      <div
        className={`rounded-2xl border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container shadow-sm p-4 flex flex-col gap-3 min-w-0 ${className}`}
      >
        <BookmarksPanelHeader bookmarkCount={bookmarkCount} />
        <BookmarksList bookmarks={bookmarks} onRemove={onRemove} />
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 p-4 text-left hover:bg-slate-50 dark:hover:bg-surface-container-high transition-colors shrink-0"
      >
        <BookmarksPanelHeader bookmarkCount={bookmarkCount} />
        <span
          className={`material-symbols-outlined text-slate-400 dark:text-outline shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          keyboard_arrow_up
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-outline-variant/20">
          <BookmarksList bookmarks={bookmarks} onRemove={onRemove} />
        </div>
      )}
    </div>
  );
}

/** Right column: horizontal collapse to a slim strip; xl+ only. */
function BookmarksRightRail({ bookmarks, bookmarkCount, onRemove }) {
  const [railOpen, setRailOpen] = useState(false);

  return (
    <aside
      className={`hidden xl:flex shrink-0 flex-col border-l border-slate-200/70 dark:border-outline-variant/30 bg-white/25 dark:bg-surface-container-low/20 transition-[width,min-width,padding] duration-300 ease-out overflow-hidden ${
        railOpen
          ? 'w-[300px] min-w-[300px] pl-4 pr-5 py-8 justify-center'
          : 'w-[52px] min-w-[52px] px-0 py-8 items-center justify-center'
      }`}
    >
      {!railOpen ? (
        <button
          type="button"
          onClick={() => setRailOpen(true)}
          className="group flex flex-col items-center justify-center gap-2 min-h-[140px] w-full rounded-l-xl border border-r-0 border-slate-200/80 dark:border-outline-variant/40 bg-white/90 dark:bg-surface-container shadow-sm hover:bg-rose-50/80 dark:hover:bg-surface-container-high transition-colors"
          title="Show bookmarks"
          aria-expanded={false}
          aria-label="Expand bookmarks sidebar"
        >
          <span className="material-symbols-outlined text-rose-500 text-[22px]">bookmarks</span>
          <span className="material-symbols-outlined text-slate-500 dark:text-outline text-[22px] transition-transform group-hover:-translate-x-0.5">
            chevron_left
          </span>
          {bookmarkCount > 0 && (
            <span className="text-[10px] font-bold tabular-nums bg-rose-500 text-white min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center">
              {bookmarkCount > 99 ? '99+' : bookmarkCount}
            </span>
          )}
        </button>
      ) : (
        <div className="flex flex-col gap-2 w-full min-w-0 justify-center flex-1">
          <div className="flex items-center justify-end shrink-0 -mt-1 -mr-1">
            <button
              type="button"
              onClick={() => setRailOpen(false)}
              className="p-2 rounded-lg text-slate-500 dark:text-outline hover:bg-slate-100 dark:hover:bg-surface-container-high transition-colors"
              title="Hide bookmarks panel"
              aria-expanded
              aria-label="Collapse bookmarks sidebar"
            >
              <span className="material-symbols-outlined text-[22px] block transition-transform">chevron_right</span>
            </button>
          </div>
          <BookmarksPanel
            bookmarks={bookmarks}
            bookmarkCount={bookmarkCount}
            onRemove={onRemove}
            verticalCollapse={false}
            className="w-full"
          />
        </div>
      )}
    </aside>
  );
}

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
                <span className={`material-symbols-outlined text-[36px] ${star <= (hovered || rating) ? 'text-rose-500' : 'text-slate-200 dark:text-outline'}`}>
                  {star <= (hovered || rating) ? 'star' : 'star_border'}
                </span>
              </button>
            ))}
            <span className="ml-2 text-sm text-slate-500 dark:text-on-surface-variant font-medium">
              {rating ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating] : 'Select rating'}
            </span>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-on-surface-variant uppercase tracking-widest mb-1.5">
              Review (optional)
            </label>
            <textarea
              className="w-full border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg px-3 py-2 text-sm text-on-surface h-20 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts..."
              maxLength={500}
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-outline-variant/20 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant rounded-lg hover:border-slate-300 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || !rating}
            className="px-6 py-2.5 text-sm font-bold bg-rose-500 text-white hover:opacity-90 disabled:opacity-50 rounded-lg transition-all">
            {saving ? 'Submitting…' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

const sidebarNav = [
  { to: '/dashboard',           icon: 'dashboard',     label: 'Dashboard'   },
  { to: '/dashboard/mentors',   icon: 'groups',        label: 'Mentorship'  },
  { to: '/dashboard/events',              icon: 'event',         label: 'Events'      },
  { to: '/dashboard/stories',   icon: 'auto_stories',  label: 'Stories'     },
  { to: '/dashboard/resources', icon: 'library_books', label: 'Resources'   },
  { to: '/dashboard/settings',  icon: 'settings',      label: 'Settings'    },
];

const typePills = [
  { key: 'all',         label: 'All Resources' },
  ...TYPES.map((t) => ({ key: t, label: TYPE_CFG[t].label + 's' })),
  { key: 'recommended', label: 'Recommended'   },
];

export default function MenteeDashboardResourcesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* ── Resources state ── */
  const [resources, setResources]     = useState([]);
  const [pagination, setPagination]   = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]         = useState(true);

  /* ── Filter state ── */
  const [searchInput, setSearchInput]           = useState('');
  const [search, setSearch]                     = useState('');
  const [activeType, setActiveType]             = useState('all');
  const [filterCategory, setFilterCategory]     = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [sort, setSort]                         = useState('-createdAt');
  const [page, setPage]                         = useState(1);

  /* ── Bookmarks state ── */
  const [bookmarks, setBookmarks]       = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  /* ── Rate modal ── */
  const [rateTarget, setRateTarget] = useState(null);
  const [previewResource, setPreviewResource] = useState(null);

  /* ── Fetch resources ── */
  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      if (activeType === 'recommended') {
        const res = await resourceApi.getRecommended({ limit: 12 });
        setResources(res.data?.resources || []);
        setPagination({ page: 1, totalPages: 1, total: res.data?.resources?.length || 0 });
      } else {
        const res = await resourceApi.getAll({
          page, limit: 12, sort,
          ...(search          ? { search }                 : {}),
          ...(activeType !== 'all' ? { type: activeType } : {}),
          ...(filterCategory  ? { category: filterCategory }   : {}),
          ...(filterDifficulty ? { difficulty: filterDifficulty } : {}),
        });
        setResources(res.data?.resources || []);
        setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch {
      toast.error('Failed to load resources');
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [activeType, page, sort, search, filterCategory, filterDifficulty]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  /* ── Fetch bookmarks on mount ── */
  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await resourceApi.getBookmarks({ limit: 50 });
      const bk  = res.data?.resources || [];
      setBookmarks(bk);
      setBookmarkedIds(new Set(bk.map((r) => r._id)));
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  /* ── Handlers ── */
  const handleBookmark = async (id) => {
    try {
      const res = await resourceApi.toggleBookmark(id);
      if (res.data.bookmarked) {
        setBookmarkedIds((prev) => new Set([...prev, id]));
        const target = resources.find((r) => r._id === id);
        if (target) setBookmarks((prev) => [target, ...prev.filter((b) => b._id !== id)]);
      } else {
        setBookmarkedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
        setBookmarks((prev) => prev.filter((b) => b._id !== id));
      }
      toast.success(res.data.bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks');
    } catch {
      toast.error('Failed to update bookmark');
    }
  };

  const handleDownload = async (id) => {
    try { await resourceApi.trackDownload(id); } catch { /* ignore */ }
  };

  const submitRating = async (id, data) => {
    const res = await resourceApi.rate(id, data);
    setResources((prev) =>
      prev.map((r) =>
        r._id === id
          ? { ...r, averageRating: res.data.averageRating, ratingCount: res.data.ratingCount }
          : r
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

  /* ─── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
          <DashboardTopBar crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Resources' }]} />

          <div className="flex flex-1 min-h-0 items-stretch w-full">
          {/* ── Main column ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">

            <div className="mx-8 mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-outline-variant/40 dark:bg-surface-container-lowest">
              {/* Search — top of content */}
              <div className="w-full max-w-2xl mx-auto pb-4">
                <form onSubmit={handleSearch}>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-rose-500 transition-colors text-[20px]">
                      search
                    </span>
                    <input
                      className="w-full bg-slate-50 dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 text-on-surface rounded-full py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 dark:placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-all"
                      placeholder="Search resources..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                </form>
              </div>

              {/* Type pills — below search */}
              <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 dark:border-outline-variant/40 pt-2 pb-6">
                {typePills.map((pill) => (
                  <button
                    key={pill.key}
                    onClick={() => handleTypeChange(pill.key)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                      activeType === pill.key
                        ? 'bg-rose-500 text-white'
                        : 'bg-white border border-slate-200 dark:border-outline-variant/40 text-slate-600 dark:text-on-surface-variant hover:border-rose-500/50 hover:text-rose-500'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Filter row — hidden on Recommended tab */}
              {activeType !== 'recommended' && (
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-5">
                  <div className="flex flex-wrap items-center gap-3 w-full">

                    {/* Category dropdown */}
                    <div className="relative min-w-[180px]">
                      <select
                        value={filterCategory}
                        onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                        className="w-full bg-white dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 text-on-surface rounded-lg px-4 py-2 text-sm appearance-none focus:ring-2 focus:ring-rose-500/40 focus:outline-none cursor-pointer"
                      >
                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-outline text-[18px]">
                        expand_more
                      </span>
                    </div>

                    {/* Difficulty segmented control */}
                    <div className="flex flex-wrap sm:flex-nowrap bg-white dark:bg-surface-container-lowest p-1 rounded-lg border border-slate-200 dark:border-outline-variant/40 shadow-sm">
                      <button
                        type="button"
                        onClick={() => { setFilterDifficulty(''); setPage(1); }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          !filterDifficulty
                            ? 'bg-rose-500 text-white shadow-sm dark:bg-rose-600'
                            : 'text-slate-600 dark:text-on-surface-variant hover:bg-slate-100 dark:hover:bg-surface-container'
                        }`}
                      >
                        All
                      </button>
                      {DIFFICULTIES.map((d) => (
                        <button
                          type="button"
                          key={d}
                          onClick={() => { setFilterDifficulty(d); setPage(1); }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${
                            filterDifficulty === d
                              ? 'bg-rose-500 text-white shadow-sm dark:bg-rose-600'
                              : 'text-slate-600 dark:text-on-surface-variant hover:bg-slate-100 dark:hover:bg-surface-container'
                          }`}
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
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-outline text-[18px]">
                        sort
                      </span>
                    </div>

                    {(search || filterCategory || filterDifficulty) && (
                      <button
                        onClick={() => { setSearch(''); setSearchInput(''); setFilterCategory(''); setFilterDifficulty(''); setPage(1); }}
                        className="flex items-center gap-1 text-xs text-slate-400 dark:text-outline hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">close</span>
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Recommended banner */}
            {activeType === 'recommended' && (
              <div className="px-8 pt-5 pb-1">
                <div className="bg-gradient-to-r from-rose-50 to-rose-100/90 dark:from-rose-950/40 dark:to-rose-900/30 border border-rose-200/80 dark:border-rose-800/40 rounded-xl p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-rose-500 text-[24px]">auto_awesome</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Personalized for You</p>
                    <p className="text-xs text-slate-500 dark:text-on-surface-variant">
                      Resources curated based on your bookmarks and interests.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Resource grid */}
            <div className="px-8 pb-8 pt-2">
              {loading ? (
                <div className="flex justify-center py-24">
                  <Spinner size="lg" />
                </div>
              ) : resources.length === 0 ? (
                <div className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/40 rounded-2xl p-16 text-center">
                  <span className="material-symbols-outlined text-[56px] text-slate-200 dark:text-outline">library_books</span>
                  <p className="text-slate-400 dark:text-on-surface-variant mt-3 font-medium">
                    {activeType === 'recommended'
                      ? 'No recommendations yet. Bookmark some resources to get started.'
                      : search || filterCategory || filterDifficulty
                        ? 'No resources match your filters.'
                        : 'No resources available yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {resources.map((resource) => (
                    <ResourceCard
                      key={resource._id}
                      resource={resource}
                      bookmarkedIds={bookmarkedIds}
                      onBookmark={handleBookmark}
                      onDownload={handleDownload}
                      onRate={setRateTarget}
                      onPreview={setPreviewResource}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && pagination.totalPages > 1 && activeType !== 'recommended' && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-5 py-2 text-sm font-semibold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant rounded-lg hover:border-rose-500/40 hover:text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-slate-500 dark:text-on-surface-variant">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-5 py-2 text-sm font-semibold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant rounded-lg hover:border-rose-500/40 hover:text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* Bookmarks — below grid on smaller screens */}
            <div className="xl:hidden px-8 pb-6">
              <BookmarksPanel
                bookmarks={bookmarks}
                bookmarkCount={bookmarkedIds.size}
                onRemove={handleBookmark}
              />
            </div>

            <div className="text-center text-xs text-black dark:text-neutral-100 py-4">
              © 2026 LEADSHER. BUILT FOR BRILLIANCE.
            </div>
          </div>

          <BookmarksRightRail
            bookmarks={bookmarks}
            bookmarkCount={bookmarkedIds.size}
            onRemove={handleBookmark}
          />
          </div>

      {/* ── Rate modal ───────────────────────────────────────────────────── */}
      {rateTarget && (
        <RateModal
          resource={rateTarget}
          onClose={() => setRateTarget(null)}
          onSave={submitRating}
        />
      )}
      {previewResource && (
        <ResourcePreviewModal resource={previewResource} onClose={() => setPreviewResource(null)} />
      )}
    </div>
  );
}
