import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminPageHeader from '../components/dashboard/AdminPageHeader';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { storyApi } from '../api/storyApi';
import { MAX_FEATURED_STORIES } from '../constants/featuredStories';
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
        <div className="w-full h-full bg-gradient-to-br from-[#f43f5e]/15 to-rose-100/40 flex items-center justify-center">
          <span className="material-symbols-outlined text-outline text-[18px]">image</span>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardStoriesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState([]);
  const [deletingId, setDeletingId] = useState('');
  const [featuringId, setFeaturingId] = useState('');
  const [reorderingId, setReorderingId] = useState('');
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
  const [profileOpen, setProfileOpen] = useState(false);

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

  const featuredPublishedCount = useMemo(
    () => stories.filter((s) => s.isFeatured && (s.status || 'draft') === 'published').length,
    [stories]
  );

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
      const res = await storyApi.update(story._id, { isFeatured: !story.isFeatured });
      const updated = res.data;
      setStories((prev) =>
        prev.map((s) => (s._id === story._id ? { ...s, ...updated } : s))
      );
      toast.success(!story.isFeatured ? 'Story featured' : 'Story unfeatured');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update feature status');
    } finally {
      setFeaturingId('');
    }
  };

  const handleReorderFeatured = async (story, direction) => {
    if (!story.isFeatured || (story.status || 'draft') !== 'published') return;
    setReorderingId(story._id);
    try {
      await storyApi.update(story._id, { featuredReorder: direction });
      await loadStories();
      toast.success('Featured order updated');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to reorder featured stories');
    } finally {
      setReorderingId('');
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

  return (
    <>
          <AdminPageHeader
            crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Manage Stories' }]}
            user={user}
            profileOpen={profileOpen}
            setProfileOpen={setProfileOpen}
            title="Manage Stories"
            hideTitleRow
          />

          <div className="p-8 space-y-5 max-w-[1280px] mx-auto w-full">
            <section
              className="rounded-xl border border-outline-variant/20 bg-white p-6 shadow-sm dark:border-outline-variant/20 dark:bg-white"
              aria-labelledby="manage-stories-heading"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                <div className="min-w-0">
                  <h1
                    id="manage-stories-heading"
                    className="font-serif-alt text-2xl font-bold tracking-tight text-on-surface sm:text-3xl"
                  >
                    Manage Stories
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                    Review, edit, and moderate stories — feature published posts and set their order for the public{' '}
                    <span className="font-semibold text-[#f43f5e]">/stories</span> page.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-outline-variant/25 bg-white px-5 py-4 sm:min-w-[220px]">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#f43f5e]">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden>
                      auto_stories
                    </span>
                    Featured on /stories
                  </div>
                  <div className="flex flex-wrap items-baseline gap-1">
                    <span
                      className="text-3xl font-bold tabular-nums tracking-tight text-[#f43f5e]"
                      aria-live="polite"
                    >
                      {featuredPublishedCount}
                    </span>
                    <span className="text-xl font-medium text-rose-300">/</span>
                    <span className="text-2xl font-semibold tabular-nums text-rose-900/70">
                      {MAX_FEATURED_STORIES}
                    </span>
                    <span className="ml-1 text-xs font-medium text-on-surface-variant">published max</span>
                  </div>
                  <p className="border-t border-[#f43f5e]/15 pt-3 text-xs leading-snug text-on-surface-variant">
                    <span className="font-semibold text-[#f43f5e]">Feature</span> toggles inclusion ·{' '}
                    <span className="font-semibold text-[#f43f5e]">Arrows</span> set order
                  </p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, excerpt, author..."
                className="min-h-[44px] rounded-lg border-2 border-outline-variant/30 bg-white px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:border-[#f43f5e] focus:outline-none focus:ring-0"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-h-[44px] rounded-lg border-2 border-outline-variant/30 bg-white px-3 py-2.5 text-sm font-medium text-on-surface focus:border-[#f43f5e] focus:outline-none focus:ring-0"
              >
                <option value="all">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <button
                type="button"
                onClick={loadStories}
                className="min-h-[44px] rounded-lg border-2 border-[#f43f5e]/35 bg-[#f43f5e] px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#e11d48] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/45 focus-visible:ring-offset-2 active:scale-[0.99]"
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
                          <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md border border-[#f43f5e]/35 bg-[#f43f5e]/10 font-bold text-[#f43f5e]">
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
                      <div className="flex flex-col gap-2 lg:w-[470px] lg:items-end">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                          <Link
                            to={`/dashboard/stories/${s._id}/edit`}
                            className="inline-flex min-h-[40px] items-center justify-center rounded-lg border-2 border-outline-variant/35 bg-white px-3 text-center text-xs font-bold uppercase tracking-wider text-on-surface shadow-sm transition-colors hover:border-[#f43f5e]/45 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/30"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => openModerateComments(s)}
                            className="min-h-[40px] rounded-lg border-2 border-outline-variant/35 bg-white px-3 text-xs font-bold uppercase tracking-wider text-on-surface shadow-sm transition-colors hover:border-[#f43f5e]/45 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/30"
                          >
                            Comments
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleFeature(s)}
                            disabled={featuringId === s._id}
                            className={`min-h-[40px] rounded-lg border-2 px-3 text-xs font-bold uppercase tracking-wider shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-60 ${
                              s.isFeatured
                                ? 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-slate-400'
                                : 'border-[#f43f5e]/40 bg-[#f43f5e]/10 text-[#f43f5e] hover:bg-[#f43f5e]/18 focus-visible:ring-[#f43f5e]/40'
                            }`}
                          >
                            {featuringId === s._id ? 'Saving...' : s.isFeatured ? 'Unfeature' : 'Feature'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteDialog({ open: true, id: s._id, title: s.title || 'Untitled story' })}
                            disabled={deletingId === s._id}
                            className="min-h-[40px] rounded-lg border-2 border-red-400 bg-red-50 px-3 text-xs font-bold uppercase tracking-wider text-red-800 shadow-sm transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60"
                          >
                            {deletingId === s._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                        {s.isFeatured && (s.status || 'draft') === 'published' && (
                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#f43f5e] mr-1 hidden sm:inline">
                              Order
                            </span>
                            <button
                              type="button"
                              title="Move up in featured list"
                              onClick={() => handleReorderFeatured(s, 'up')}
                              disabled={reorderingId === s._id}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#f43f5e]/30 bg-white text-[#f43f5e] shadow-sm transition-colors hover:border-[#f43f5e] hover:bg-rose-50 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/35"
                            >
                              <span className="material-symbols-outlined text-[22px]">arrow_upward</span>
                            </button>
                            <button
                              type="button"
                              title="Move down in featured list"
                              onClick={() => handleReorderFeatured(s, 'down')}
                              disabled={reorderingId === s._id}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#f43f5e]/30 bg-white text-[#f43f5e] shadow-sm transition-colors hover:border-[#f43f5e] hover:bg-rose-50 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/35"
                            >
                              <span className="material-symbols-outlined text-[22px]">arrow_downward</span>
                            </button>
                          </div>
                        )}
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
                className="rounded-lg border-2 border-outline-variant/35 bg-white px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:border-[#f43f5e]/45 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/30"
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
