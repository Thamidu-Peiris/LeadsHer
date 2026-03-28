import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { forumApi } from '../api/forumApi';
import Spinner from '../components/common/Spinner';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { value: '',                label: 'All Topics'        },
  { value: 'general',         label: 'General'           },
  { value: 'career-advice',   label: 'Career Advice'     },
  { value: 'leadership-tips', label: 'Leadership Tips'   },
  { value: 'networking',      label: 'Networking'        },
  { value: 'work-life',       label: 'Work & Life'       },
  { value: 'success-stories', label: 'Success Stories'   },
];

const SORTS = [
  { value: 'newest',        label: 'Newest'        },
  { value: 'trending',      label: 'Trending'      },
  { value: 'most-discussed', label: 'Most Discussed' },
];

const CAT_COLORS = {
  'general':         'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'career-advice':   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'leadership-tips': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'networking':      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'work-life':       'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'success-stories': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

const fmtDate = (d) => {
  try {
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch { return ''; }
};

const fmtCat = (c) =>
  (c || 'general').split('-').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ');

/* ─── Topic Card ─────────────────────────────────────────────────────────── */

function TopicCard({ topic, pinned }) {
  const catColor = CAT_COLORS[topic.category] || CAT_COLORS.general;
  const avatarSrc =
    topic.author?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(topic.author?.name || 'U')}&background=c9a84c&color=fff&size=40`;

  return (
    <Link
      to={`/forum/${topic._id}`}
      className={`group block bg-white dark:bg-surface-container-lowest border rounded-xl p-5 hover:border-gold-accent/50 hover:shadow-md transition-all duration-200 ${
        pinned
          ? 'border-gold-accent/40 bg-gold-accent/[0.02]'
          : 'border-slate-200 dark:border-outline-variant/30'
      }`}
    >
      <div className="flex items-start gap-4">
        <img
          src={avatarSrc}
          alt={topic.author?.name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5 border border-outline-variant/20"
        />
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gold-accent bg-gold-accent/10 border border-gold-accent/25 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[12px]">push_pin</span>
                Pinned
              </span>
            )}
            {topic.isClosed && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[12px]">lock</span>
                Closed
              </span>
            )}
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${catColor}`}>
              {fmtCat(topic.category)}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-serif-alt text-base font-bold text-on-surface group-hover:text-gold-accent transition-colors line-clamp-2 leading-snug mb-1">
            {topic.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">
            {topic.content}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-outline">
            <span className="font-medium text-on-surface-variant">{topic.author?.name}</span>
            <span>{fmtDate(topic.createdAt)}</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">chat_bubble_outline</span>
              {topic.replyCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">thumb_up</span>
              {topic.upvoteCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">visibility</span>
              {topic.views || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Forum Page ─────────────────────────────────────────────────────────── */

export default function ForumPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [topics, setTopics]     = useState([]);
  const [pinned, setPinned]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]       = useState(0);

  const [category, setCategory] = useState('');
  const [sort, setSort]         = useState('newest');
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await forumApi.getTopics({ page, limit: 15, category: category || undefined, sort, search: search || undefined });
      setTopics(res.data.topics || []);
      setPinned(res.data.pinned || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load topics.');
    } finally {
      setLoading(false);
    }
  }, [page, category, sort, search]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleCategoryChange = (val) => {
    setCategory(val);
    setPage(1);
  };

  const handleSortChange = (val) => {
    setSort(val);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1a0a2e] via-[#2d1254] to-[#1a0a2e] py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #c9a84c 0%, transparent 60%)' }}
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 text-gold-accent/80 text-xs font-bold uppercase tracking-[0.2em] mb-4">
            <span className="w-8 h-px bg-gold-accent/50" />
            Community
            <span className="w-8 h-px bg-gold-accent/50" />
          </div>
          <h1 className="font-serif-alt text-4xl md:text-5xl font-bold text-white mb-4">
            LeadsHer Forum
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto mb-8">
            Ask questions, share insights, and grow alongside a community of women leaders.
          </p>
          {user ? (
            <Link
              to="/forum/new"
              className="inline-flex items-center gap-2 bg-gold-accent hover:bg-gold-accent/90 text-white font-bold px-8 py-3 rounded-lg transition-colors shadow-lg shadow-gold-accent/25"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Start a Discussion
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-gold-accent hover:bg-gold-accent/90 text-white font-bold px-8 py-3 rounded-lg transition-colors shadow-lg shadow-gold-accent/25"
            >
              Join the Conversation
            </Link>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-gold-accent transition-colors">
              search
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search discussions…"
              className="w-full bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/30 rounded-xl py-3 pl-12 pr-32 text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-2 focus:ring-gold-accent/40 focus:border-gold-accent transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gold-accent hover:bg-gold-accent/90 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Filters row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => handleCategoryChange(c.value)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                  category === c.value
                    ? 'bg-gold-accent text-white border-gold-accent'
                    : 'bg-white dark:bg-surface-container-lowest text-outline border-outline-variant/30 hover:border-gold-accent/40 hover:text-on-surface'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-sm border border-outline-variant/30 rounded-lg px-3 py-1.5 bg-white dark:bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-gold-accent"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        {!loading && (
          <p className="text-xs text-outline mb-4">
            {search ? `Results for "${search}" — ` : ''}{total} discussion{total !== 1 ? 's' : ''}
          </p>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Pinned */}
            {pinned.length > 0 && (
              <div className="mb-6 space-y-3">
                {pinned.map((t) => <TopicCard key={t._id} topic={t} pinned />)}
              </div>
            )}

            {/* Topics */}
            {topics.length === 0 ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-5xl text-outline/40 mb-4 block">forum</span>
                <p className="text-on-surface-variant font-medium mb-2">No discussions yet</p>
                <p className="text-outline text-sm mb-6">Be the first to start a conversation.</p>
                {user && (
                  <Link to="/forum/new" className="btn-primary inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Start a Discussion
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {topics.map((t) => <TopicCard key={t._id} topic={t} pinned={false} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 rounded-lg border border-outline-variant/30 text-outline hover:text-on-surface hover:border-gold-accent/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="text-outline text-sm px-1">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all border ${
                          p === page
                            ? 'bg-gold-accent text-white border-gold-accent'
                            : 'border-outline-variant/30 text-outline hover:border-gold-accent/40 hover:text-on-surface'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-lg border border-outline-variant/30 text-outline hover:text-on-surface hover:border-gold-accent/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
