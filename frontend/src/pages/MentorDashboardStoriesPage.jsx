import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { storyApi } from '../api/storyApi';
import Spinner from '../components/common/Spinner';
import { mentorApi } from '../api/mentorApi';

const PLACEHOLDER_GRADS = [
  'from-primary/25 to-secondary/15',
  'from-tertiary/20 to-primary/15',
  'from-secondary/20 to-tertiary/15',
];

function StoryCoverThumb({ story, index }) {
  const [imgError, setImgError] = useState(false);
  const url = (story.coverImage || '').trim();
  const showImg = url && !imgError;

  useEffect(() => {
    setImgError(false);
  }, [url]);

  return (
    <Link
      to={`/stories/${story._id}`}
      className="relative shrink-0 block w-[88px] h-[66px] sm:w-[104px] sm:h-[78px] rounded-lg overflow-hidden border border-outline-variant/12 bg-surface-container-low ring-1 ring-black/[0.03] shadow-sm group/thumb"
      aria-label={`View ${story.title || 'story'}`}
    >
      {showImg ? (
        <img
          src={url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-[1.03]"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${PLACEHOLDER_GRADS[index % PLACEHOLDER_GRADS.length]} flex items-center justify-center`}
        >
          <span className="font-serif-alt text-2xl sm:text-xl font-bold text-white/35 italic select-none">
            {(story.title || 'S').trim().charAt(0).toUpperCase() || '—'}
          </span>
        </div>
      )}
    </Link>
  );
}

export default function MentorDashboardStoriesPage() {
  const { user, logout, canManageEvents } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id ?? user?._id;
  const storiesCacheKey = userId ? `leadsher_mentor_stories_${userId}` : '';

  const firstName = user?.name?.split(' ')?.[0] || 'Mentor';
  const [profileOpen, setProfileOpen] = useState(false);
  const [mentorProfile, setMentorProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [publishingId, setPublishingId] = useState('');
  const [topStoryIndex, setTopStoryIndex] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: '', title: '' });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    mentorApi.getMyProfile()
      .then((res) => {
        const p = res.data?.data || res.data?.data?.data || res.data?.data || null;
        setMentorProfile(p);
      })
      .catch(() => setMentorProfile(null));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Hydrate immediately from cache to avoid "refresh-like" blank/loading flicker.
    if (storiesCacheKey) {
      try {
        const cached = JSON.parse(sessionStorage.getItem(storiesCacheKey) || '[]');
        if (Array.isArray(cached) && cached.length) {
          setStories(cached);
          setLoading(false);
        } else {
          setLoading(true);
        }
      } catch {
        setLoading(true);
      }
    } else {
      setLoading(true);
    }

    // Dedicated endpoint for mentor's own stories (draft + published).
    // Fallback keeps drafts visible even if `/stories/mine` is unavailable.
    storyApi.getMine({ limit: 100 })
      .then((res) => {
        const nextStories = res.data?.stories || [];
        setStories(nextStories);
        if (storiesCacheKey) {
          sessionStorage.setItem(storiesCacheKey, JSON.stringify(nextStories));
        }
      })
      .catch(async () => {
        try {
          const fallbackRes = await storyApi.getAll({ author: userId, limit: 100, sort: 'newest' });
          const nextStories = fallbackRes.data?.stories || [];
          setStories(nextStories);
          if (storiesCacheKey) {
            sessionStorage.setItem(storiesCacheKey, JSON.stringify(nextStories));
          }
        } catch {
          setStories([]);
        }
      })
      .finally(() => setLoading(false));
  }, [userId, storiesCacheKey]);

  const avatarSrc =
    user?.profilePicture ||
    user?.avatar ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80';

  const openDeleteDialog = (id, title) => {
    setDeleteDialog({ open: true, id, title: title || 'Untitled story' });
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setDeleteDialog({ open: false, id: '', title: '' });
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteDialog.id) return;
    setDeleting(true);
    try {
      await storyApi.delete(deleteDialog.id);
      setStories((prev) => prev.filter((s) => s._id !== deleteDialog.id));
      toast.success('Story deleted');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete story');
    } finally {
      setDeleting(false);
      setDeleteDialog({ open: false, id: '', title: '' });
    }
  };

  const publishDraft = async (id) => {
    setPublishingId(id);
    try {
      await storyApi.update(id, { status: 'published' });
      setStories((prev) => prev.map((s) => (s._id === id ? { ...s, status: 'published', publishedAt: s.publishedAt || new Date().toISOString() } : s)));
      toast.success('Draft published');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not publish draft');
    } finally {
      setPublishingId('');
    }
  };

  const stats = useMemo(() => {
    const total = stories.length;
    const published = stories.filter((s) => s.status === 'published');
    const drafts = stories.filter((s) => s.status === 'draft');
    const totalViews = stories.reduce((sum, s) => sum + (s.views || s.viewCount || 0), 0);
    const totalLikes = stories.reduce((sum, s) => sum + (s.likeCount || 0), 0);
    const avgReadingTime = total ? Math.round(stories.reduce((sum, s) => sum + (s.readingTime || 0), 0) / total) : 0;
    return {
      total,
      published: published.length,
      drafts: drafts.length,
      totalViews,
      totalLikes,
      avgReadingTime,
      topViewed: [...stories]
        .sort((a, b) => (b.views || b.viewCount || 0) - (a.views || a.viewCount || 0))
        .slice(0, 3),
    };
  }, [stories]);

  useEffect(() => {
    setTopStoryIndex(0);
  }, [stats.topViewed.length]);

  useEffect(() => {
    if (stats.topViewed.length <= 1) return undefined;
    const timer = setInterval(() => {
      setTopStoryIndex((idx) => (idx + 1) % stats.topViewed.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [stats.topViewed.length]);

  const displayedStories = useMemo(() => {
    if (statusFilter === 'all') return stories;
    return stories.filter((s) => s.status === statusFilter);
  }, [stories, statusFilter]);

  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen overflow-hidden bg-surface text-on-surface">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white dark:bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col z-40">
          <div className="p-6 flex flex-col items-center gap-3 border-b border-outline-variant/20">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-gold-accent p-0.5 overflow-hidden">
                <img
                  alt="User avatar"
                  className="w-full h-full object-cover rounded-full"
                  src={avatarSrc}
                />
              </div>
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white rounded-full ${
                  mentorProfile?.isAvailable ? 'bg-green-500' : 'bg-red-500'
                }`}
                title={mentorProfile?.isAvailable ? 'Available' : 'Unavailable'}
              />
            </div>
            <div className="text-center">
              <h3 className="text-on-surface font-bold text-lg">{firstName}</h3>
              <div className="mt-1 flex justify-center">
                <span className="bg-gold-accent/10 text-gold-accent text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-gold-accent/20">
                  Mentor
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {[
              { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
              { to: '/dashboard/stories', icon: 'auto_stories', label: 'Stories' },
              { to: '/dashboard/mentorship', icon: 'groups', label: 'Mentorship' },
              { to: '/events', icon: 'event', label: 'Events' },
              { to: '/dashboard/resources', icon: 'library_books', label: 'Resources' },
              { to: '/dashboard/forum', icon: 'forum', label: 'Forum' },
              { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 transition-all group ${
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

          <div className="p-4 mt-auto border-t border-outline-variant/20 space-y-3">
            <button className="w-full bg-gradient-to-r from-gold-accent to-primary text-white text-xs font-bold py-3 rounded-lg shadow-lg shadow-primary/10 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
              UPGRADE TO PRO
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="ml-[260px] flex-1 flex flex-col min-h-screen">
          <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white/80 dark:bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-outline">
              <Link className="hover:text-gold-accent transition-colors" to="/">
                Home
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <Link className="hover:text-gold-accent transition-colors" to="/dashboard">
                Dashboard
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface">Stories</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/25 hover:border-gold-accent transition-colors focus:outline-none focus:ring-2 focus:ring-gold-accent/40"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen ? 'true' : 'false'}
                >
                  <img
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-full"
                    src={avatarSrc}
                  />
                </button>

                {profileOpen && (
                  <div role="menu" className="absolute right-0 mt-3 w-56 bg-white dark:bg-surface-container border border-outline-variant/20 editorial-shadow z-50">
                    <div className="px-5 py-4 border-b border-outline-variant/15">
                      <p className="font-sans-modern text-sm font-semibold text-on-surface line-clamp-1">
                        {user?.name || 'Mentor'}
                      </p>
                      <p className="font-sans-modern text-xs text-outline line-clamp-1">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await logout();
                          toast.success('You have signed out.');
                        } finally {
                          setProfileOpen(false);
                          navigate('/');
                        }
                      }}
                      className="w-full text-left px-5 py-3 font-sans-modern text-sm text-tertiary hover:bg-tertiary/5 transition-colors flex items-center gap-2"
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

          <div className="p-8 space-y-6 max-w-[1400px] mx-auto w-full">
            <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-serif-alt text-3xl font-bold text-on-surface">Stories Studio</h1>
                <p className="text-on-surface-variant text-sm mt-1">
                  Create, draft, publish, and analyze your stories in one place.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link
                  to="/dashboard/stories/new"
                  className="bg-gold-accent text-white px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-gold-accent/10"
                >
                  + New Story
                </Link>
                {canManageEvents && (
                  <Link
                    to="/events/new"
                    className="px-6 py-3 rounded-lg font-bold text-sm border border-outline-variant/25 hover:border-gold-accent/40 transition-colors bg-white dark:bg-surface-container"
                  >
                    + New Event
                  </Link>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold">Total stories</p>
                <p className="text-3xl font-bold text-on-surface mt-2">{stats.total}</p>
              </div>
              <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold">Published</p>
                <p className="text-3xl font-bold text-on-surface mt-2">{stats.published}</p>
              </div>
              <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold">Drafts</p>
                <p className="text-3xl font-bold text-on-surface mt-2">{stats.drafts}</p>
              </div>
              <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold">Total views</p>
                <p className="text-3xl font-bold text-on-surface mt-2">{stats.totalViews}</p>
              </div>
              <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold">Avg read time</p>
                <p className="text-3xl font-bold text-on-surface mt-2">{stats.avgReadingTime}m</p>
              </div>
            </section>

            {stats.topViewed.length > 0 && (
              <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl p-6">
                <h2 className="font-serif-alt text-xl font-bold text-on-surface">Story Analytics</h2>
                <p className="text-xs text-outline mt-1">Top performing stories by views</p>
                <div className="mt-4 space-y-3">
                  {(() => {
                    const s = stats.topViewed[topStoryIndex];
                    const value = s.views || s.viewCount || 0;
                    const max = stats.topViewed[0]?.views || stats.topViewed[0]?.viewCount || 1;
                    const width = Math.max(8, Math.round((value / max) * 100));
                    return (
                      <div
                        key={`metric-${s._id}-${topStoryIndex}`}
                        style={{
                          animation: 'storySlideInRight 620ms cubic-bezier(0.16, 1, 0.3, 1) both',
                          willChange: 'transform, opacity',
                        }}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-on-surface line-clamp-1">{s.title}</span>
                          <span className="text-outline">{value} views · {s.likeCount || 0} likes</span>
                        </div>
                        <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
                          <div className="h-2 bg-gold-accent rounded-full" style={{ width: `${width}%` }} />
                        </div>
                        {stats.topViewed.length > 1 && (
                          <div className="mt-3 flex items-center justify-end gap-1.5">
                            {stats.topViewed.map((_, i) => (
                              <button
                                key={`dot-${i}`}
                                type="button"
                                onClick={() => setTopStoryIndex(i)}
                                aria-label={`Show top story ${i + 1}`}
                                className={`h-1.5 rounded-full transition-all ${
                                  i === topStoryIndex ? 'w-4 bg-gold-accent' : 'w-1.5 bg-outline-variant/50 hover:bg-outline'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </section>
            )}

            <section className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: 'All' },
                { key: 'published', label: 'Published' },
                { key: 'draft', label: 'Drafts' },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                    statusFilter === f.key
                      ? 'bg-gold-accent/10 text-on-surface border-gold-accent/40'
                      : 'bg-white dark:bg-surface-container-lowest border-outline-variant/25 text-outline hover:border-gold-accent/40'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </section>

            {loading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : displayedStories.length === 0 ? (
              <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl p-10 text-center">
                <p className="text-on-surface-variant mb-5">
                  {statusFilter === 'draft' ? 'No drafts created yet.' : statusFilter === 'published' ? 'No published stories yet.' : 'No stories created yet.'}
                </p>
                <Link to="/dashboard/stories/new" className="btn-primary">Write your first story</Link>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {displayedStories.map((s, idx) => (
                  <li
                    key={s._id}
                    className="group relative rounded-xl border border-outline-variant/[0.12] dark:border-outline-variant/20 bg-white dark:bg-surface-container-lowest shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_14px_rgba(15,23,42,0.07)] hover:border-outline-variant/25 transition-[box-shadow,border-color] duration-200"
                  >
                    <div className="p-4 sm:p-4 sm:pr-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5">
                        <div className="flex gap-3 sm:gap-4 min-w-0 flex-1 lg:items-start">
                          <StoryCoverThumb story={s} index={idx} />
                          <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center text-[9px] font-semibold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full ${
                                s.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300/90'
                                  : 'bg-slate-100 text-slate-600 dark:bg-surface-container-high dark:text-on-surface-variant'
                              }`}
                            >
                              {s.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                          </div>
                          <h3 className="font-serif-alt text-[17px] sm:text-lg font-bold text-on-surface leading-snug tracking-tight line-clamp-1 pr-1">
                            {s.title}
                          </h3>
                          {s.excerpt && (
                            <p className="text-[13px] leading-relaxed text-on-surface-variant/90 line-clamp-1">
                              {s.excerpt}
                            </p>
                          )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 sm:gap-x-7 gap-y-1.5 text-[13px] sm:text-[15px] font-medium text-on-surface-variant tabular-nums lg:border-l lg:border-outline-variant/10 lg:pl-6 lg:shrink-0">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[19px] sm:text-[21px] text-on-surface-variant/80" aria-hidden>visibility</span>
                            {s.views ?? s.viewCount ?? 0}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[19px] sm:text-[21px] text-on-surface-variant/80" aria-hidden>favorite</span>
                            {s.likeCount ?? 0}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[19px] sm:text-[21px] text-on-surface-variant/80" aria-hidden>schedule</span>
                            {s.readingTime || 1}m
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 lg:ml-auto lg:shrink-0 border-t border-outline-variant/[0.08] pt-3 lg:border-t-0 lg:pt-0">
                          <Link
                            to={`/stories/${s._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-lg border border-outline-variant/20 text-outline bg-white/80 dark:bg-surface-container hover:text-gold-accent hover:border-gold-accent/35 hover:bg-gold-accent/[0.06] transition-colors"
                            aria-label="Open story in new tab"
                            title="View story"
                          >
                            <span className="material-symbols-outlined text-[22px] font-light" aria-hidden>open_in_new</span>
                          </Link>
                          <Link
                            to={`/dashboard/stories/${s._id}/edit`}
                            className="inline-flex items-center justify-center min-h-10 px-5 sm:px-6 rounded-lg text-[11px] font-bold uppercase tracking-[0.1em] border border-outline-variant/35 bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:border-outline-variant/55 hover:bg-surface-container-high/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => openDeleteDialog(s._id, s.title)}
                            className="inline-flex items-center justify-center min-h-10 px-5 sm:px-6 rounded-lg text-[11px] font-bold uppercase tracking-[0.1em] border border-red-500/20 bg-red-500/[0.1] text-red-700 hover:bg-red-500/[0.16] hover:border-red-500/30 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/25 dark:hover:bg-red-500/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest transition-colors"
                          >
                            Delete
                          </button>
                          {s.status === 'draft' && (
                            <button
                              type="button"
                              disabled={publishingId === s._id}
                              onClick={() => publishDraft(s._id)}
                              className="inline-flex items-center justify-center min-h-10 px-5 sm:px-6 rounded-lg text-[11px] font-bold uppercase tracking-[0.1em] border border-gold-accent/35 text-gold-accent hover:bg-gold-accent/10 transition-colors disabled:opacity-50"
                            >
                              {publishingId === s._id ? 'Publishing…' : 'Publish'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <footer className="pt-6 border-t border-outline-variant/20 text-center">
              <p className="text-[10px] text-outline tracking-widest uppercase">
                © {new Date().getFullYear()} LeadsHer. Built for brilliance.
              </p>
            </footer>
          </div>
        </main>
      </div>

      {deleteDialog.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close delete dialog"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={closeDeleteDialog}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-outline-variant/20 bg-white dark:bg-surface-container-lowest shadow-[0_24px_60px_rgba(15,23,42,0.28)] p-6">
            <h3 className="font-serif-alt text-2xl font-bold text-on-surface">Delete story?</h3>
            <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
              This will permanently remove
              {' '}
              <span className="font-semibold text-on-surface">"{deleteDialog.title}"</span>.
              This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={deleting}
                className="px-4 py-2.5 rounded-lg border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-60"
              >
                {deleting && <Spinner size="sm" className="text-white" />}
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

