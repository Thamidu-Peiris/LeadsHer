import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
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
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState([]);
  const [deletingId, setDeletingId] = useState('');
  const [featuringId, setFeaturingId] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: '', title: '' });
  const [commentsDialog, setCommentsDialog] = useState({
    open: false,
    storyId: '',
    title: '',
    comments: [],
    loading: false,
    deletingCommentId: '',
  });
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

  const openModerateComments = async (story) => {
    setCommentsDialog({
      open: true,
      storyId: story._id,
      title: story.title || 'Untitled story',
      comments: [],
      loading: true,
      deletingCommentId: '',
    });
    try {
      const res = await storyApi.getComments(story._id, { page: 1, limit: 50 });
      setCommentsDialog((d) => ({
        ...d,
        comments: res.data?.comments || [],
        loading: false,
      }));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load comments');
      setCommentsDialog((d) => ({ ...d, loading: false, comments: [] }));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!commentsDialog.storyId) return;
    setCommentsDialog((d) => ({ ...d, deletingCommentId: commentId }));
    try {
      await storyApi.deleteComment(commentsDialog.storyId, commentId);
      setCommentsDialog((d) => ({
        ...d,
        comments: d.comments.filter((c) => c._id !== commentId),
        deletingCommentId: '',
      }));
      setStories((prev) =>
        prev.map((s) => (
          s._id === commentsDialog.storyId
            ? { ...s, commentCount: Math.max(0, (s.commentCount || 0) - 1) }
            : s
        ))
      );
      toast.success('Comment deleted');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete comment');
      setCommentsDialog((d) => ({ ...d, deletingCommentId: '' }));
    }
  };

  const adminNav = [
    { to: '/dashboard', icon: 'space_dashboard', label: 'Admin Dashboard' },
    { to: '/dashboard/manage-account', icon: 'manage_accounts', label: 'Manage User Account' },
    { to: '/dashboard/manage-stories', icon: 'auto_stories', label: 'Manage Stories' },
    { to: '/dashboard/events', icon: 'event', label: 'Manage Events' },
    { to: '/dashboard/manage-mentors', icon: 'groups', label: 'Manage Mentorship' },
    { to: '/dashboard/resources', icon: 'library_books', label: 'Manage Resources' },
    { to: '/dashboard/settings', icon: 'settings', label: 'Admin Settings' },
  ];

  return (
    <>
          <DashboardTopBar crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Manage Stories' }]} />

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
              <div className="bg-white border border-outline-variant/20 rounded-xl p-8 text-center text-on-surface-variant">
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
                        <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md border border-outline-variant/20 bg-surface-container-lowest text-outline font-bold">
                          {(s.commentCount || 0)} comments
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 lg:w-[470px]">
                        <Link
                          to={`/dashboard/stories/${s._id}/edit`}
                          className="px-3 py-1.5 rounded-md border border-outline-variant/25 bg-white text-xs font-bold uppercase tracking-wider text-on-surface hover:border-gold-accent/40 text-center"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => openModerateComments(s)}
                          className="px-3 py-1.5 rounded-md border border-outline-variant/25 bg-white text-xs font-bold uppercase tracking-wider text-on-surface hover:border-gold-accent/40"
                        >
                          Comments
                        </button>
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

      {commentsDialog.open && (
        <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[1px] p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl bg-white border border-outline-variant/20 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between">
              <div>
                <h3 className="font-serif-alt text-xl font-bold text-on-surface">Moderate Comments</h3>
                <p className="text-xs text-outline mt-1 line-clamp-1">{commentsDialog.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setCommentsDialog({ open: false, storyId: '', title: '', comments: [], loading: false, deletingCommentId: '' })}
                className="w-8 h-8 rounded-md border border-outline-variant/20 text-outline hover:text-on-surface hover:bg-surface-container-lowest flex items-center justify-center"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {commentsDialog.loading ? (
                <div className="py-10 flex justify-center"><Spinner size="md" /></div>
              ) : commentsDialog.comments.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-8">No comments found for this story.</p>
              ) : (
                commentsDialog.comments.map((c) => (
                  <div key={c._id} className="border border-outline-variant/15 rounded-lg p-3 bg-surface-container-lowest/60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface line-clamp-1">{c.user?.name || 'User'}</p>
                        <p className="text-xs text-outline mt-0.5">{new Date(c.createdAt || Date.now()).toLocaleString()}</p>
                        <p className="text-sm text-on-surface-variant mt-2 whitespace-pre-wrap">{c.content}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c._id)}
                        disabled={commentsDialog.deletingCommentId === c._id}
                        className="px-3 py-1.5 rounded-md border border-red-300 bg-red-50 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 disabled:opacity-60 shrink-0"
                      >
                        {commentsDialog.deletingCommentId === c._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
