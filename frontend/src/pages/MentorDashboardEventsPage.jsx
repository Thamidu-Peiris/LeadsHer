import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { eventApi } from '../api/eventApi';
import EventCard from '../components/events/EventCard';
import Spinner from '../components/common/Spinner';

export default function MentorDashboardEventsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const firstName = user?.name?.split(' ')?.[0] || 'Mentor';
    const avatarSrc = user?.profilePicture || user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face&q=80';
    const [profileOpen, setProfileOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        let mounted = true;
        if (user?._id) {
            // NOTE: eventApi.getAll might not support filtering by host directly in the standard impl,
            // but if the backend accepts query params they will be passed. If not, filtering client side.
            eventApi.getAll({ host: user._id }).then(res => {
                const evts = res.data?.data?.events || res.data?.events || [];
                // client side fallback filter just in case
                const hosted = evts.filter(e => e.createdBy === user._id || (e.host?._id || e.host) === user._id);
                if (mounted) setEvents(hosted);
            }).catch(() => toast.error('Failed to load your events'))
                .finally(() => { if (mounted) setLoading(false); });
        }
        return () => { mounted = false; };
    }, [user]);

    return (
        <div className="min-h-screen">
            <div className="relative flex min-h-screen bg-surface text-on-surface">
                <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-outline-variant/20 flex flex-col z-40">
                    <div className="p-4 border-b border-outline-variant/20">
                        <div className="flex flex-col items-center gap-2">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-2 border-brand-600 p-0.5">
                                    <img alt="" className="w-full h-full object-cover rounded-full" src={avatarSrc} />
                                </div>
                                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                            </div>
                            <p className="text-on-surface font-bold text-base text-center leading-tight px-1">{firstName}</p>
                        </div>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                        {[
                            { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
                            { to: '/dashboard/mentorship', icon: 'groups', label: 'Mentorship' },
                            { to: '/dashboard/events', icon: 'event', label: 'My Events' },
                            { to: '/dashboard/stories', icon: 'auto_stories', label: 'Stories' },
                            { to: '/dashboard/resources', icon: 'library_books', label: 'Resources' },
                            { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
                        ].map((item) => (
                            <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                                <span className="text-sm font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                <main className="ml-[260px] flex-1 flex flex-col min-h-screen">
                    <header className="h-16 border-b border-outline-variant/20 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-outline">
                            <Link className="hover:text-brand-600 transition-colors" to="/">Home</Link>
                            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            <span className="text-on-surface">Hosted Events</span>
                        </div>
                        {/* Same avatar toggle logic */}
                        <div className="relative">
                            <button onClick={() => setProfileOpen(!profileOpen)} className="w-10 h-10 rounded-full border border-gray-200">
                                <img alt="Avatar" className="w-full h-full object-cover rounded-full" src={avatarSrc} />
                            </button>
                            {profileOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 shadow-lg z-50">
                                    <div className="px-5 py-4 border-b border-gray-100"><p className="text-sm font-semibold">{user?.name}</p></div>
                                    <Link to="/dashboard/profile" className="block px-5 py-3 hover:bg-gray-50">Profile</Link>
                                    <button onClick={async () => { await logout(); navigate('/'); }} className="w-full text-left px-5 py-3 text-red-600 hover:bg-red-50">Sign out</button>
                                </div>
                            )}
                        </div>
                    </header>

                    <div className="p-8 space-y-6 max-w-[1400px] mx-auto w-full">
                        <section className="bg-white border border-gray-100 shadow-sm rounded-xl p-8 flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Hosted Events</h1>
                                <p className="text-gray-500 text-sm mt-1">Events that you are organizing and hosting.</p>
                            </div>
                            <Link to="/events/new" className="bg-brand-600 text-white px-6 py-2.5 rounded-lg shadow-sm hover:bg-brand-700 font-medium">+ Create Event</Link>
                        </section>

                        <section>
                            {loading ? (
                                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
                            ) : events.length === 0 ? (
                                <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-8 text-center text-gray-500">
                                    <p>You haven't hosted any events yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                    {events.map((e) => (
                                        <div key={e._id} className="flex flex-col bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                                            <h3 className="text-lg font-bold text-gray-900">{e.title}</h3>
                                            <p className="text-sm text-gray-500 mt-1 mb-4">{new Date(e.date).toDateString()} at {e.startTime}</p>
                                            <div className="flex gap-2">
                                                <Link to={`/events/${e._id}`} className="text-sm text-brand-600 hover:underline">View Attendees & Feedback</Link>
                                                <span className="text-gray-300">|</span>
                                                <Link to={`/events/${e._id}/edit`} className="text-sm text-gray-600 hover:underline">Edit</Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
