import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { storyApi } from '../api/storyApi';
import Spinner from '../components/common/Spinner';

function trimText(v, max = 120) {
  const t = String(v || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}...`;
}

function StoryThumb({ story }) {
  const [imgError, setImgError] = useState(false);
  const src = (story?.coverImage || '').trim();
  const showImage = src && !imgError;
  return (
    <div className="w-[64px] h-[64px] rounded-md overflow-hidden border border-outline-variant/20 bg-surface-container-lowest shrink-0">
      {showImage ? (
        <img
          src={src}
          alt={story?.title || 'Story cover'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/25 to-tertiary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-outline text-[18px]">image</span>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardStoriesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState([]);
  const [deletingId, setDeletingId] = useState('');
  const [featuringId, setFeaturingId] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: '', title: '' });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadStories = async () => {
    setLoading(true);
    try {
      const res = await storyApi.getAll({ limit: 200, sort: '-createdAt' });
      setStories(res.data?.stories || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load stories');
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const filteredStories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stories.filter((s) => {
      if (statusFilter !== 'all' && (s.status || 'draft') !== statusFilter) return false;
      if (!q) return true;
      const title = String(s.title || '').toLowerCase();
      const excerpt = String(s.excerpt || '').toLowerCase();
      const author = String(s.author?.name || '').toLowerCase();
      return title.includes(q) || excerpt.includes(q) || author.includes(q);
    });
  }, [stories, query, statusFilter]);

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    const storyId = deleteDialog.id;
    setDeletingId(storyId);
    try {
      await storyApi.delete(storyId);
      toast.success('Story deleted');
      setStories((prev) => prev.filter((s) => s._id !== storyId));
      setDeleteDialog({ open: false, id: '', title: '' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete story');
    } finally {
      setDeletingId('');
    }
  };

  const handleToggleFeature = async (story) => {
    setFeaturingId(story._id);
    try {
      await storyApi.update(story._id, { isFeatured: !story.isFeatured });
      setStories((prev) =>
        prev.map((s) => (s._id === story._id ? { ...s, isFeatured: !s.isFeatured } : s))
      );
      toast.success(!story.isFeatured ? 'Story featured' : 'Story unfeatured');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update feature status');
    } finally {
      setFeaturingId('');
    }
  };

  const adminNav = [
    { to: '/dashboard', icon: 'space_dashboard', label: 'Admin Dashboard' },
    { to: '/dashboard/manage-account', icon: 'manage_accounts', label: 'Manage User Account' },
    { to: '/dashboard/manage-stories', icon: 'auto_stories', label: 'Manage Stories' },
    { to: '/events', icon: 'event', label: 'Manage Events' },
    { to: '/dashboard/manage-mentors', icon: 'groups', label: 'Manage Mentorship' },
    { to: '/dashboard/resources', icon: 'library_books', label: 'Manage Resources' },
    { to: '/dashboard/generated-reports', icon: 'analytics', label: 'Generated Reports' },
    { to: '/dashboard/settings', icon: 'settings', label: 'Admin Settings' },
  ];

  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen overflow-hidden bg-surface text-on-surface">
        <aside className="fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-outline-variant/20 flex flex-col z-40">
          <div className="p-6 border-b border-outline-variant/20">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-gold-accent p-0.5 overflow-hidden">
                  <img
                    alt="Admin avatar"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face&q=80"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <div className="text-center">
                <p className="text-on-surface font-bold text-lg leading-tight">{user?.name || 'Admin'}</p>
                <span className="inline-flex mt-2 px-3 py-1 rounded-full bg-gold-accent/15 text-gold-accent text-[10px] font-bold tracking-widest uppercase border border-gold-accent/25">
                  Admin
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {adminNav.map((item) => (
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

        <main className="ml-[280px] flex-1 flex flex-col min-h-screen">
          <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-outline mb-1">
                <Link className="hover:text-gold-accent transition-colors" to="/">Home</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <Link className="hover:text-gold-accent transition-colors" to="/dashboard">Dashboard</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-on-surface">Manage Stories</span>
              </div>
              <h1 className="font-serif-alt text-2xl font-bold text-on-surface">Manage Stories</h1>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/25 hover:border-gold-accent transition-colors"
              >
                <img
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face&q=80"
                />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-outline-variant/20 editorial-shadow z-50">
                  <div className="px-5 py-4 border-b border-outline-variant/15">
                    <p className="text-sm font-semibold text-on-surface line-clamp-1">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-outline line-clamp-1">{user?.email}</p>
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
                    className="w-full text-left px-5 py-3 text-sm text-tertiary hover:bg-tertiary/5 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className="p-8 space-y-5 max-w-[1280px] mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, excerpt, author..."
                className="px-4 py-2.5 rounded-lg border border-outline-variant/25 bg-white text-sm text-on-surface"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-outline-variant/25 bg-white text-sm text-on-surface"
              >
                <option value="all">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <button
                type="button"
                onClick={loadStories}
                className="px-4 py-2.5 rounded-lg border border-outline-variant/25 bg-white text-sm font-semibold text-on-surface hover:border-gold-accent/40"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="py-16 flex justify-center"><Spinner size="lg" /></div>
            ) : filteredStories.length === 0 ? (
              <div className="bg-white border border-outline-variant/20 editorial-shadow rounded-xl p-8 text-center text-on-surface-variant">
                No stories found.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStories.map((s) => (
                  <div key={s._id} className="bg-white border border-outline-variant/20 rounded-xl px-4 py-3">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                      <div className="min-w-0 flex-1 flex items-start gap-3">
                        <StoryThumb story={s} />
                        <div className="min-w-0">
                          <p className="font-semibold text-on-surface line-clamp-1">{s.title || 'Untitled story'}</p>
                          <p className="text-xs text-outline mt-0.5 line-clamp-1">
                            by {s.author?.name || 'Unknown'} · {new Date(s.createdAt || Date.now()).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-on-surface-variant mt-1 line-clamp-1">{trimText(s.excerpt || s.content || '', 140)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md border font-bold ${
                          (s.status || 'draft') === 'published'
                            ? 'border-green-300 bg-green-50 text-green-700'
                            : 'border-amber-300 bg-amber-50 text-amber-700'
                        }`}>
                          {s.status || 'draft'}
                        </span>
                        {s.isFeatured && (
                          <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md border border-primary/30 bg-primary/10 text-primary font-bold">
                            Featured
                          </span>
                        )}
                        <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md border border-outline-variant/20 bg-surface-container-lowest text-outline font-bold">
                          {(s.views || 0)} views
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 lg:w-[340px]">
                        <Link
                          to={`/dashboard/stories/${s._id}/edit`}
                          className="px-3 py-1.5 rounded-md border border-outline-variant/25 bg-white text-xs font-bold uppercase tracking-wider text-on-surface hover:border-gold-accent/40 text-center"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleFeature(s)}
                          disabled={featuringId === s._id}
                          className={`px-3 py-1.5 rounded-md border text-xs font-bold uppercase tracking-wider disabled:opacity-60 ${
                            s.isFeatured
                              ? 'border-outline-variant/25 bg-surface-container-lowest text-on-surface hover:border-outline-variant/40'
                              : 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                          }`}
                        >
                          {featuringId === s._id ? 'Saving...' : s.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteDialog({ open: true, id: s._id, title: s.title || 'Untitled story' })}
                          disabled={deletingId === s._id}
                          className="px-3 py-1.5 rounded-md border border-red-300 bg-red-50 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 disabled:opacity-60"
                        >
                          {deletingId === s._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {deleteDialog.open && (
        <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[1px] p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-white border border-outline-variant/20 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/15">
              <h3 className="font-serif-alt text-xl font-bold text-on-surface">Delete Story</h3>
              <p className="text-xs text-outline mt-1">This action cannot be undone.</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-on-surface">
                Are you sure you want to delete
                {' '}
                <span className="font-semibold">"{deleteDialog.title}"</span>
                ?
              </p>
            </div>
            <div className="px-6 pb-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteDialog({ open: false, id: '', title: '' })}
                className="px-4 py-2 rounded-lg border border-outline-variant/25 bg-white text-sm font-semibold text-on-surface hover:border-gold-accent/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletingId === deleteDialog.id}
                className="px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                {deletingId === deleteDialog.id ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
