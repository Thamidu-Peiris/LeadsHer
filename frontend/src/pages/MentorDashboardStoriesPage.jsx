import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { storyApi } from '../api/storyApi';
import Spinner from '../components/common/Spinner';
import { mentorApi } from '../api/mentorApi';

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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await storyApi.delete(id);
      setStories((prev) => prev.filter((s) => s._id !== id));
      toast.success('Story deleted');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete story');
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
        .slice(0, 5),
    };
  }, [stories]);

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
              { to: '/forum', icon: 'forum', label: 'Forum' },
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
                  {stats.topViewed.map((s) => {
                    const value = s.views || s.viewCount || 0;
                    const max = stats.topViewed[0]?.views || stats.topViewed[0]?.viewCount || 1;
                    const width = Math.max(8, Math.round((value / max) * 100));
                    return (
                      <div key={`metric-${s._id}`}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-on-surface line-clamp-1">{s.title}</span>
                          <span className="text-outline">{value} views · {s.likeCount || 0} likes</span>
                        </div>
                        <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
                          <div className="h-2 bg-gold-accent rounded-full" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
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
              <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-outline-variant/10">
                  {displayedStories.map((s) => (
                    <div key={s._id} className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border ${
                              s.status === 'published'
                                ? 'bg-green-500/10 text-green-700 border-green-500/20'
                                : 'bg-outline-variant/20 text-outline border-outline-variant/30'
                            }`}>
                              {s.status || 'draft'}
                            </span>
                          </div>
                          <h3 className="font-serif-alt text-xl font-bold text-on-surface line-clamp-1">{s.title}</h3>
                          {s.excerpt && (
                            <p className="text-on-surface-variant text-sm mt-2 line-clamp-2">
                              {s.excerpt}
                            </p>
                          )}
                        </div>
                        <Link to={`/stories/${s._id}`} className="text-outline hover:text-gold-accent transition-colors">
                          <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                        </Link>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-outline">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">visibility</span> {s.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">favorite</span> {s.likeCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">schedule</span> {s.readingTime || 1}m
                        </span>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <Link
                          to={`/stories/${s._id}/edit`}
                          className="px-4 py-2 text-xs font-bold tracking-wider uppercase border border-outline-variant/25 hover:border-gold-accent/40 transition-colors bg-white dark:bg-surface-container"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(s._id)}
                          className="px-4 py-2 text-xs font-bold tracking-wider uppercase border border-tertiary/30 text-tertiary hover:bg-tertiary/5 transition-colors bg-white dark:bg-surface-container"
                        >
                          Delete
                        </button>
                        {s.status === 'draft' && (
                          <button
                            type="button"
                            disabled={publishingId === s._id}
                            onClick={() => publishDraft(s._id)}
                            className="px-4 py-2 text-xs font-bold tracking-wider uppercase border border-gold-accent/30 text-gold-accent hover:bg-gold-accent/10 transition-colors bg-white dark:bg-surface-container disabled:opacity-60"
                          >
                            {publishingId === s._id ? 'Publishing...' : 'Publish'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <footer className="pt-6 border-t border-outline-variant/20 text-center">
              <p className="text-[10px] text-outline tracking-widest uppercase">
                © {new Date().getFullYear()} LeadsHer. Built for brilliance.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

