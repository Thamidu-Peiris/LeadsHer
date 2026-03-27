import { useEffect, useState, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
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

const SIDEBAR_W = 260;

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
            <span className="material-symbols-outlined text-white/30 text-[64px]">{cfg.icon}</span>
          </div>
        )}

        {/* Badges */}
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
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
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
            </span>
          </div>
          <button
            onClick={() => onRate(resource)}
            className="text-[11px] text-slate-400 dark:text-outline hover:text-gold-accent transition-colors flex items-center gap-0.5"
          >
            <span className="material-symbols-outlined text-[13px]">star_border</span>
            Rate
          </button>
        </div>

        {/* Access button */}
        <button
          onClick={handleAccess}
          className="w-full py-2 rounded-lg border border-gold-accent/40 text-gold-accent text-sm font-bold hover:bg-gold-accent hover:text-white transition-all"
        >
          Access Resource
        </button>
      </div>
    </div>
  );
}

/* ─── Bookmarks Drawer ───────────────────────────────────────────────────── */

function BookmarksDrawer({ bookmarks, bookmarkCount, onRemove }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-0 z-50" style={{ left: SIDEBAR_W, right: 0 }}>
      <div className="mx-6">
        <div className="bg-white dark:bg-surface-container border-x border-t border-slate-200 dark:border-outline-variant/40 rounded-t-2xl shadow-2xl overflow-hidden">

          {/* Toggle bar */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold-accent/10 flex items-center justify-center text-gold-accent">
                <span className="material-symbols-outlined text-[18px]">bookmarks</span>
              </div>
              <span className="text-sm font-bold text-on-surface">Your Bookmarks</span>
              {bookmarkCount > 0 && (
                <span className="text-xs bg-gold-accent text-white px-2 py-0.5 rounded-full font-bold">
                  {bookmarkCount}
                </span>
              )}
            </div>
            <span className={`material-symbols-outlined text-slate-400 dark:text-outline transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
              keyboard_arrow_up
            </span>
          </button>

          {/* Drawer content */}
          {open && (
            <div className="border-t border-slate-100 dark:border-outline-variant/20 p-5 pt-3">
              {bookmarks.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-outline text-center py-4">
                  No bookmarks yet. Save resources to find them here.
                </p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                  {bookmarks.map((r) => {
                    const cfg = TYPE_CFG[r.type] || TYPE_CFG.article;
                    return (
                      <div key={r._id} className="flex-shrink-0 w-56 flex gap-3 p-3 bg-slate-50 dark:bg-surface-container rounded-xl border border-transparent hover:border-gold-accent/30 transition-all cursor-pointer">
                        <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${cfg.thumb} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                          {r.thumbnail ? (
                            <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span className="material-symbols-outlined text-white/50 text-[22px]">{cfg.icon}</span>
                          )}
                        </div>
                        <div className="flex flex-col justify-center overflow-hidden flex-1 min-w-0">
                          <h4 className="text-xs font-bold truncate text-on-surface">{r.title}</h4>
                          <span className="text-[10px] text-slate-400 dark:text-outline mt-1 uppercase font-bold tracking-widest">{cfg.label}</span>
                        </div>
                        <button
                          onClick={() => onRemove(r._id)}
                          className="self-start text-slate-300 dark:text-outline hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                          title="Remove bookmark"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
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
                <span className={`material-symbols-outlined text-[36px] ${star <= (hovered || rating) ? 'text-gold-accent' : 'text-slate-200 dark:text-outline'}`}>
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
              className="w-full border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg px-3 py-2 text-sm text-on-surface h-20 resize-none focus:outline-none focus:ring-2 focus:ring-gold-accent/40"
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
            className="px-6 py-2.5 text-sm font-bold bg-gold-accent text-white hover:opacity-90 disabled:opacity-50 rounded-lg transition-all">
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
  { to: '/events',              icon: 'event',         label: 'Events'      },
  { to: '/stories',             icon: 'auto_stories',  label: 'Stories'     },
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

  const firstName = user?.name?.split(' ')?.[0] || 'Mentee';

  const [profileOpen, setProfileOpen] = useState(false);

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
    <div className="min-h-screen bg-[#f8f6f6] dark:bg-[#100f16]">
      <div className="relative flex min-h-screen overflow-hidden text-on-surface">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white dark:bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col z-40">

          {/* Profile block */}
          <div className="p-6 flex flex-col items-center gap-3 border-b border-outline-variant/20">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-primary p-0.5 overflow-hidden">
                <img
                  alt="User avatar"
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="text-center">
              <h3 className="text-on-surface font-bold text-lg">{firstName}</h3>
              <div className="mt-1 flex justify-center">
                <span className="bg-primary/10 text-primary text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-primary/20">
                  Mentee
                </span>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {sidebarNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard/resources'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 transition-all ${
                    isActive
                      ? 'text-gold-accent bg-gold-accent/5 border-gold-accent'
                      : 'text-outline hover:text-on-surface hover:bg-surface-container-low border-transparent'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Bottom area */}
          <div className="p-4 mt-auto border-t border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between px-4 py-2 text-outline hover:text-on-surface cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <span className="text-sm font-medium">Notifications</span>
              </div>
              <span className="w-2 h-2 bg-tertiary rounded-full" />
            </div>
            <button className="w-full bg-gradient-to-r from-gold-accent to-primary text-white text-xs font-bold py-3 rounded-lg shadow-lg shadow-primary/10 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
              UPGRADE TO PRO
            </button>
          </div>
        </aside>

        {/* ── Main ─────────────────────────────────────────────────────────── */}
        <main className="ml-[260px] flex-1 flex flex-col min-h-screen pb-20">

          {/* Top header */}
          <header className="h-16 min-h-[64px] border-b border-slate-200 dark:border-outline-variant/40 bg-white/80 dark:bg-[#1a1824]/90 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-outline">
              <Link className="hover:text-gold-accent transition-colors" to="/">Home</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <Link className="hover:text-gold-accent transition-colors" to="/dashboard">Dashboard</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface">Resources</span>
            </div>

            {/* Search bar */}
            <div className="max-w-md w-full px-4 hidden md:block">
              <form onSubmit={handleSearch}>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-gold-accent transition-colors text-[20px]">
                    search
                  </span>
                  <input
                    className="w-full bg-slate-50 dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 text-on-surface rounded-full py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 dark:placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-gold-accent/40 transition-all"
                    placeholder="Search resources..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 flex items-center justify-center text-slate-400 dark:text-outline hover:text-gold-accent transition-colors">
                <span className="material-symbols-outlined">help_outline</span>
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 hover:border-gold-accent transition-colors focus:outline-none focus:ring-2 focus:ring-gold-accent/40"
                >
                  <img
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face&q=80"
                  />
                </button>
                {profileOpen && (
                  <div role="menu" className="absolute right-0 mt-3 w-56 bg-white dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 rounded-xl shadow-xl z-50">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-outline-variant/20">
                      <p className="text-sm font-semibold text-on-surface line-clamp-1">{user?.name}</p>
                      <p className="text-xs text-slate-400 dark:text-outline line-clamp-1">{user?.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try { await logout(); toast.success('You have signed out.'); }
                        finally { setProfileOpen(false); navigate('/'); }
                      }}
                      className="w-full text-left px-5 py-3 text-sm text-tertiary hover:bg-red-50 dark:hover:bg-error-container/20 transition-colors flex items-center gap-2 rounded-b-xl"
                      role="menuitem"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ── Page content ── */}
          <div className="flex-1">

            {/* Type pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 dark:border-outline-variant/40 pt-6 pb-6 px-6">
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

            {/* Recommended banner */}
            {activeType === 'recommended' && (
              <div className="px-8 pt-5 pb-1">
                <div className="bg-gradient-to-r from-primary/10 to-gold-accent/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-gold-accent text-[24px]">auto_awesome</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Personalized for You</p>
                    <p className="text-xs text-slate-500 dark:text-on-surface-variant">
                      Resources curated based on your bookmarks and interests.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Filter row — hidden on Recommended tab */}
            {activeType !== 'recommended' && (
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-8 py-5">
                <div className="flex flex-wrap items-center gap-3 w-full">

                  {/* Category dropdown */}
                  <div className="relative min-w-[180px]">
                    <select
                      value={filterCategory}
                      onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                      className="w-full bg-white dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 text-on-surface rounded-lg px-4 py-2 text-sm appearance-none focus:ring-2 focus:ring-gold-accent/40 focus:outline-none cursor-pointer"
                    >
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-outline text-[18px]">
                      expand_more
                    </span>
                  </div>

                  {/* Difficulty segmented control */}
                  <div className="flex bg-slate-100 dark:bg-surface-container-high p-1 rounded-lg border border-slate-200 dark:border-outline-variant/40">
                    <button
                      onClick={() => { setFilterDifficulty(''); setPage(1); }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        !filterDifficulty
                          ? 'bg-white dark:bg-surface-container-low shadow-sm text-on-surface'
                          : 'text-slate-500 dark:text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      All
                    </button>
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d}
                        onClick={() => { setFilterDifficulty(d); setPage(1); }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${
                          filterDifficulty === d
                            ? 'bg-white dark:bg-surface-container-low shadow-sm text-on-surface'
                            : 'text-slate-500 dark:text-on-surface-variant hover:text-on-surface'
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
                      className="w-full bg-white dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 text-on-surface rounded-lg px-4 py-2 text-sm appearance-none focus:ring-2 focus:ring-gold-accent/40 focus:outline-none cursor-pointer"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    className="px-5 py-2 text-sm font-semibold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant rounded-lg hover:border-gold-accent/40 hover:text-gold-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-slate-500 dark:text-on-surface-variant">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-5 py-2 text-sm font-semibold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant rounded-lg hover:border-gold-accent/40 hover:text-gold-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-slate-400 dark:text-outline py-4">
              © 2026 LEADSHER. BUILT FOR BRILLIANCE.
            </div>
          </div>
        </main>
      </div>

      {/* ── Bookmarks bottom drawer ──────────────────────────────────────── */}
      <BookmarksDrawer
        bookmarks={bookmarks}
        bookmarkCount={bookmarkedIds.size}
        onRemove={handleBookmark}
      />

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
