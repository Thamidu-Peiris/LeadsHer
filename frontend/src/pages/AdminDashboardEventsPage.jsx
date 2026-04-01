import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { eventApi } from '../api/eventApi';
import Spinner from '../components/common/Spinner';

export default function AdminDashboardEventsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const firstName = user?.name?.split(' ')?.[0] || 'Admin';
    const avatarSrc = user?.profilePicture || user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face&q=80';
    const [profileOpen, setProfileOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        let mounted = true;
        eventApi.getAll({ limit: 100 }).then(res => {
            if (mounted) setEvents(res.data?.data?.events || []);
        }).catch(() => toast.error('Failed to load events'))
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this event globally?')) return;
        try {
            await eventApi.update(id, { status: 'cancelled' });
            setEvents(events.map(e => e._id === id ? { ...e, status: 'cancelled' } : e));
            toast.success('Event cancelled');
        } catch { toast.error('Failed to cancel event'); }
    };

    return (
        <div className="min-h-screen">
            <div className="relative flex min-h-screen bg-surface text-on-surface">
                <aside className="fixed left-0 top-0 h-screen w-[260px] bg-slate-900 text-white flex flex-col z-40">
                    <div className="p-4 border-b border-slate-700">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full border-2 border-indigo-500 overflow-hidden">
                                <img alt="" className="w-full h-full object-cover rounded-full" src={avatarSrc} />
                            </div>
                            <p className="font-bold text-base text-center leading-tight px-1">{firstName}</p>
                        </div>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                        {[
                            { to: '/dashboard', icon: 'dashboard', label: 'Overview' },
                            { to: '/dashboard/users', icon: 'group', label: 'Users' },
                            { to: '/dashboard/events', icon: 'event', label: 'Events' },
                            { to: '/dashboard/stories', icon: 'auto_stories', label: 'Stories' },
                            { to: '/dashboard/resources', icon: 'library_books', label: 'Resources' },
                            { to: '/dashboard/forum', icon: 'forum', label: 'Forum' },
                        ].map((item) => (
                            <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                                <span className="text-sm font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                <main className="ml-[260px] flex-1 flex flex-col min-h-screen bg-slate-50">
                    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 px-8 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            <span>Manage Events</span>
                        </div>
                        <div className="relative">
                            <button onClick={() => setProfileOpen(!profileOpen)} className="w-10 h-10 rounded-full overflow-hidden">
                                <img alt="Avatar" className="w-full h-full object-cover rounded-full" src={avatarSrc} />
                            </button>
                            {profileOpen && (
                                <div role="menu" className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 shadow-xl z-50 rounded-lg">
                                    <div className="px-5 py-4 border-b border-gray-100"><p className="text-sm font-semibold">{user?.name}</p></div>
                                    <button onClick={async () => { await logout(); navigate('/'); }} className="w-full text-left px-5 py-3 text-red-600 hover:bg-gray-50 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">logout</span>Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </header>

                    <div className="p-8 space-y-6 max-w-[1400px] mx-auto w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-slate-900">All Events Overview</h1>
                            <Link to="/events/new" className="bg-indigo-600 text-white px-5 py-2.5 rounded shadow hover:bg-indigo-700 font-medium">+ Create Event</Link>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            {loading ? (
                                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
                            ) : events.length === 0 ? (
                                <div className="p-10 text-center text-slate-500">No events found in the system.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {events.map((e) => (
                                                <tr key={e._id} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-slate-900">{e.title}</div></td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${e.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                            {e.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link to={`/events/${e._id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">Manage</Link>
                                                        {e.status !== 'cancelled' && (
                                                            <button onClick={() => handleCancel(e._id)} className="text-orange-600 hover:text-orange-900 mr-4">Cancel</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
