import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { storyApi } from '../api/storyApi';
import StoryCard from '../components/stories/StoryCard';
import Spinner from '../components/common/Spinner';

export default function MenteeDashboardStoriesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    <>
          <DashboardTopBar crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Stories' }]} />

          <div className="p-8 space-y-6 max-w-[1400px] mx-auto w-full">
            <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8">
              <h1 className="font-serif-alt text-3xl font-bold text-on-surface">Stories for You</h1>
              <p className="text-on-surface-variant text-sm mt-1">Personalized story feed inside your dashboard.</p>
            </section>

            {topStories.length > 0 && (
              <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6">
                <h2 className="font-serif-alt text-xl font-bold text-on-surface mb-4">Top Stories Right Now</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topStories.map((s) => (
                    <div key={s._id} className="overflow-hidden rounded-xl border border-outline-variant/20 bg-white dark:bg-surface-container-lowest">
                      <Link to={`/stories/${s._id}`} className="block group">
                        <div className="aspect-[16/9] overflow-hidden bg-surface-container-low">
                          {s.coverImage ? (
                            <img
                              src={s.coverImage}
                              alt={s.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/25 to-secondary/20">
                              <span className="font-serif-alt text-4xl text-white/40">{s.title?.[0] || 'S'}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
                            {s.category === 'STEM' ? 'Future Tech' : 'Story'}
                          </p>
                          <p className="mt-1 font-semibold text-sm text-on-surface line-clamp-2">{s.title}</p>
                          <p className="text-xs text-outline mt-2">{s.views || 0} views</p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              {loading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
              ) : stories.length === 0 ? (
                <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8 text-center">
                  <p className="text-on-surface-variant">No stories available right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {stories.map((s, idx) => (
                    <div key={s._id} className="rounded-xl border border-outline-variant/20 bg-white p-4 dark:bg-surface-container-lowest">
                      <StoryCard story={s} idx={idx} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
    </>
  );
}
