import { useEffect, useState, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { forumApi } from '../api/forumApi';
import Spinner from '../components/common/Spinner';

const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch { return ''; }
};

const fmtCat = (c) =>
  (c || 'general').split('-').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ');

const CAT_COLORS = {
  'general':         'bg-slate-100 text-slate-700',
  'career-advice':   'bg-blue-100 text-blue-700',
  'leadership-tips': 'bg-purple-100 text-purple-700',
  'networking':      'bg-green-100 text-green-700',
  'work-life':       'bg-amber-100 text-amber-700',
  'success-stories': 'bg-rose-100 text-rose-700',
};

const SIDEBAR_NAV = [
  { to: '/dashboard',           icon: 'dashboard',     label: 'Dashboard'   },
  { to: '/dashboard/stories',   icon: 'auto_stories',  label: 'Stories'     },
  { to: '/dashboard/mentorship',icon: 'groups',        label: 'Mentorship'  },
  { to: '/events',              icon: 'event',         label: 'Events'      },
  { to: '/dashboard/resources', icon: 'library_books', label: 'Resources'   },
  { to: '/dashboard/forum',     icon: 'forum',         label: 'Forum'       },
  { to: '/dashboard/settings',  icon: 'settings',      label: 'Settings'    },
];

export default function MentorDashboardForumPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')?.[0] || 'Mentor';

  const [topics, setTopics]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);
  const [togglingId, setTogglingId] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const avatarSrc =
    user?.profilePicture || user?.avatar ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80';

  const fetchMyTopics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await forumApi.getMyTopics({ page, limit: 10 });
      setTopics(res.data.topics || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load your topics.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchMyTopics(); }, [fetchMyTopics]);

  const handleDelete = async (topicId) => {
    if (!window.confirm('Delete this topic and all its replies?')) return;
    try {
      await forumApi.deleteTopic(topicId);
      toast.success('Topic deleted.');
      fetchMyTopics();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete topic.');
    }
  };

  const handleToggleClose = async (topicId) => {
    setTogglingId(topicId);
    try {
      const res = await forumApi.closeTopic(topicId);
      setTopics((prev) => prev.map((t) => t._id === topicId ? { ...t, isClosed: res.data.isClosed } : t));
      toast.success(res.data.isClosed ? 'Topic closed.' : 'Topic reopened.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update topic.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6f6] dark:bg-[#100f16]">
      <div className="relative flex min-h-screen overflow-hidden text-on-surface">

        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white dark:bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col z-40">
          <div className="p-6 flex flex-col items-center gap-3 border-b border-outline-variant/20">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-gold-accent p-0.5 overflow-hidden">
                <img alt="User avatar" className="w-full h-full object-cover rounded-full" src={avatarSrc} />
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="text-center">
              <h3 className="text-on-surface font-bold text-lg">{firstName}</h3>
              <span className="bg-gold-accent/10 text-gold-accent text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-gold-accent/20 mt-1 inline-block">
                Mentor
              </span>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {SIDEBAR_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'}
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
          <div className="p-4 mt-auto border-t border-outline-variant/20 space-y-3">
            <button
              className="w-full bg-gradient-to-r from-gold-accent to-primary text-white text-xs font-bold py-3 rounded-lg shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
              UPGRADE TO PRO
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="ml-[260px] flex-1 flex flex-col min-h-screen">
          <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white/80 dark:bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-outline">
              <Link className="hover:text-gold-accent transition-colors" to="/">Home</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <Link className="hover:text-gold-accent transition-colors" to="/dashboard">Dashboard</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface">Forum</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/forum"
                className="flex items-center gap-1 text-xs text-outline hover:text-gold-accent border border-outline-variant/30 hover:border-gold-accent/40 px-3 py-1.5 rounded-lg transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Browse Forum
              </Link>
              <Link
                to="/forum/new"
                className="flex items-center gap-2 bg-gold-accent hover:bg-gold-accent/90 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                New Discussion
              </Link>
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

          <div className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="font-serif-alt text-3xl font-bold text-on-surface">Forum Management</h1>
              <p className="text-outline text-sm mt-1">Manage your topics — close discussions, view replies, and mark accepted answers</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Topics</p>
                <p className="font-serif-alt text-3xl font-bold text-on-surface">{total}</p>
              </div>
              <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Total Replies</p>
                <p className="font-serif-alt text-3xl font-bold text-on-surface">
                  {topics.reduce((a, t) => a + (t.replyCount || 0), 0)}
                </p>
              </div>
              <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Open</p>
                <p className="font-serif-alt text-3xl font-bold text-green-600">{topics.filter((t) => !t.isClosed).length}</p>
              </div>
              <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Closed</p>
                <p className="font-serif-alt text-3xl font-bold text-slate-500">{topics.filter((t) => t.isClosed).length}</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : topics.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl">
                <span className="material-symbols-outlined text-5xl text-outline/40 mb-4 block">forum</span>
                <p className="text-on-surface font-medium mb-1">No discussions yet</p>
                <p className="text-outline text-sm mb-6">Start engaging with the LeadsHer community.</p>
                <Link to="/forum/new" className="inline-flex items-center gap-2 bg-gold-accent hover:bg-gold-accent/90 text-white font-bold px-5 py-2.5 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Start a Discussion
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {topics.map((topic) => (
                    <div
                      key={topic._id}
                      className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-gold-accent/30 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${CAT_COLORS[topic.category] || CAT_COLORS.general}`}>
                            {fmtCat(topic.category)}
                          </span>
                          {topic.isClosed ? (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="material-symbols-outlined text-[11px]">lock</span>Closed
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="material-symbols-outlined text-[11px]">lock_open</span>Open
                            </span>
                          )}
                          {topic.isPinned && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gold-accent bg-gold-accent/10 px-2 py-0.5 rounded-full">Pinned</span>
                          )}
                        </div>
                        <Link
                          to={`/forum/${topic._id}`}
                          className="block font-bold text-on-surface hover:text-gold-accent transition-colors line-clamp-1 mb-1"
                        >
                          {topic.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-outline">
                          <span>{fmtDate(topic.createdAt)}</span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">chat_bubble_outline</span>
                            {topic.replyCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">thumb_up</span>
                            {topic.upvoteCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">visibility</span>
                            {topic.views || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                        <Link
                          to={`/forum/${topic._id}`}
                          className="flex items-center gap-1 text-xs text-outline hover:text-gold-accent border border-outline-variant/30 hover:border-gold-accent/30 px-3 py-1.5 rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          View
                        </Link>
                        <button
                          onClick={() => handleToggleClose(topic._id)}
                          disabled={togglingId === topic._id}
                          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-60 ${
                            topic.isClosed
                              ? 'text-green-700 bg-green-50 border-green-300 hover:bg-green-100'
                              : 'text-slate-600 border-outline-variant/30 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">{topic.isClosed ? 'lock_open' : 'lock'}</span>
                          {topic.isClosed ? 'Reopen' : 'Close'}
                        </button>
                        <Link
                          to={`/forum/${topic._id}/edit`}
                          className="flex items-center gap-1 text-xs text-outline hover:text-gold-accent border border-outline-variant/30 hover:border-gold-accent/30 px-3 py-1.5 rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(topic._id)}
                          className="flex items-center gap-1 text-xs text-outline hover:text-red-500 border border-outline-variant/30 hover:border-red-300 px-3 py-1.5 rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                      className="p-2 rounded-lg border border-outline-variant/30 text-outline hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed">
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <span className="text-sm text-on-surface-variant">Page {page} of {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                      className="p-2 rounded-lg border border-outline-variant/30 text-outline hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed">
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
