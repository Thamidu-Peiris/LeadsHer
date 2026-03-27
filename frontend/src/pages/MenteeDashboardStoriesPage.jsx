import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { storyApi } from '../api/storyApi';
import StoryCard from '../components/stories/StoryCard';
import Spinner from '../components/common/Spinner';

export default function MenteeDashboardStoriesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const firstName = user?.name?.split(' ')?.[0] || 'Mentee';
  const menteeAvatarSrc =
    user?.profilePicture || user?.avatar ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80';

  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState([]);

  
  useEffect(() => {
    let mounted = true;
    const loadStories = async () => {
      setLoading(true);
      try {
        const res = await storyApi.getAll({ limit: 12, sort: '-publishedAt' });
        if (!mounted) return;
        setStories(res.data?.stories || []);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load stories');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadStories();
    return () => { mounted = false; };
  }, []);

  const topStories = useMemo(
    () => [...stories].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3),
    [stories]
  );

  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen overflow-hidden bg-surface text-on-surface">
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white dark:bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col z-40">
          <div className="p-4 border-b border-outline-variant/20">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-gold-accent p-0.5 overflow-hidden">
                  <img alt="" className="w-full h-full object-cover rounded-full" src={menteeAvatarSrc} />
                </div>
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <p className="text-on-surface font-bold text-base text-center leading-tight px-1">{firstName}</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {[
              { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
              { to: '/dashboard/mentors', icon: 'groups', label: 'Mentorship' },
              { to: '/events', icon: 'event', label: 'Events' },
              { to: '/dashboard/stories', icon: 'auto_stories', label: 'Stories' },
              { to: '/dashboard/resources', icon: 'library_books', label: 'Resources' },
              { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
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
        </aside>

        <main className="ml-[260px] flex-1 flex flex-col min-h-screen">
          <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white/80 dark:bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-outline">
              <Link className="hover:text-gold-accent transition-colors" to="/">Home</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <Link className="hover:text-gold-accent transition-colors" to="/dashboard">Dashboard</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface">Stories</span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/25 hover:border-gold-accent transition-colors focus:outline-none focus:ring-2 focus:ring-gold-accent/40"
              >
                <img alt="Avatar" className="w-full h-full object-cover rounded-full" src={menteeAvatarSrc} />
              </button>
              {profileOpen && (
                <div role="menu" className="absolute right-0 mt-3 w-56 bg-white dark:bg-surface-container border border-outline-variant/20 editorial-shadow z-50">
                  <div className="px-5 py-4 border-b border-outline-variant/15">
                    <p className="font-sans-modern text-sm font-semibold text-on-surface line-clamp-1">{user?.name || 'Mentee'}</p>
                    <p className="font-sans-modern text-xs text-outline line-clamp-1">{user?.email}</p>
                  </div>
                  <Link
                    to="/dashboard/profile"
                    onClick={() => setProfileOpen(false)}
                    className="block w-full text-left px-5 py-3 font-sans-modern text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                    role="menuitem"
                  >
                    Profile
                  </Link>
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
          </header>

          <div className="p-8 space-y-6 max-w-[1400px] mx-auto w-full">
            <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl p-8">
              <h1 className="font-serif-alt text-3xl font-bold text-on-surface">Stories for You</h1>
              <p className="text-on-surface-variant text-sm mt-1">Personalized story feed inside your dashboard.</p>
            </section>

            {topStories.length > 0 && (
              <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl p-6">
                <h2 className="font-serif-alt text-xl font-bold text-on-surface mb-4">Top Stories Right Now</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topStories.map((s) => (
                    <div key={s._id} className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                      <p className="font-semibold text-sm text-on-surface line-clamp-2">{s.title}</p>
                      <p className="text-xs text-outline mt-2">{s.views || 0} views</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              {loading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
              ) : stories.length === 0 ? (
                <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl p-8 text-center">
                  <p className="text-on-surface-variant">No stories available right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {stories.map((s) => <StoryCard key={s._id} story={s} />)}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
