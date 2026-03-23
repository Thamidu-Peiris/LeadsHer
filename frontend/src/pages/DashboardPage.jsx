import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storyApi } from '../api/storyApi';
import { eventApi } from '../api/eventApi';
import StoryCard from '../components/stories/StoryCard';
import EventCard from '../components/events/EventCard';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, canManageEvents } = useAuth();
  const [myStories, setMyStories]   = useState([]);
  const [myEvents, setMyEvents]     = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [sRes, eRes] = await Promise.allSettled([
          storyApi.getByUser(user._id, { limit: 6 }),
          eventApi.getMyEvents(),
        ]);
        if (sRes.status === 'fulfilled') {
          setMyStories(sRes.value.data?.stories || []);
        }
        if (eRes.status === 'fulfilled') {
          setMyEvents(eRes.value.data?.data?.events || eRes.value.data?.events || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const handleDeleteStory = async (id) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await storyApi.delete(id);
      setMyStories((s) => s.filter((x) => x._id !== id));
      toast.success('Story deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-brand-900 to-brand-700 rounded-2xl text-white px-8 py-8 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-brand-200 text-sm mt-1 capitalize">
            Role: {user?.role} · {user?.email}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/stories/new" className="btn-primary bg-white text-brand-700 hover:bg-brand-50">
            + New Story
          </Link>
          {canManageEvents && (
            <Link to="/events/new" className="btn-secondary border-white/30 text-white hover:bg-white/10">
              + New Event
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'My Stories',        value: myStories.length, link: '/stories' },
          { label: 'Registered Events', value: myEvents.length,  link: '/events' },
          { label: 'Total Views',       value: myStories.reduce((a, s) => a + (s.views || 0), 0) },
          { label: 'Total Likes',       value: myStories.reduce((a, s) => a + (s.likeCount || 0), 0) },
        ].map(({ label, value, link }) => (
          <div key={label} className="card p-5">
            <p className="text-2xl font-display font-bold text-brand-700">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
            {link && <Link to={link} className="text-xs text-brand-600 hover:underline mt-2 block">View all →</Link>}
          </div>
        ))}
      </div>

      {/* My Stories */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold text-gray-900">My Stories</h2>
          <Link to="/stories/new" className="btn-secondary text-sm">+ Add</Link>
        </div>

        {myStories.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-gray-400 mb-4">You haven't written any stories yet.</p>
            <Link to="/stories/new" className="btn-primary">Share your first story</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myStories.map((s) => (
              <div key={s._id} className="relative group">
                <StoryCard story={s} />
                <div className="absolute top-2 right-2 hidden group-hover:flex gap-1.5">
                  <Link to={`/stories/${s._id}/edit`}
                    className="bg-white shadow text-xs px-2.5 py-1 rounded-lg text-gray-700 hover:bg-gray-50 border">Edit</Link>
                  <button onClick={() => handleDeleteStory(s._id)}
                    className="bg-white shadow text-xs px-2.5 py-1 rounded-lg text-red-500 hover:bg-red-50 border">Del</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Events */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold text-gray-900">My Events</h2>
          <Link to="/events" className="btn-secondary text-sm">Browse events</Link>
        </div>

        {myEvents.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-gray-400 mb-4">You haven't registered for any events yet.</p>
            <Link to="/events" className="btn-primary">Browse events</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myEvents.map((e) => <EventCard key={e._id} event={e} />)}
          </div>
        )}
      </section>
    </div>
  );
}
