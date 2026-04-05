import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
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

export default function MentorDashboardForumPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [topics, setTopics]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);
  const [togglingId, setTogglingId] = useState(null);

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
    <>
          <DashboardTopBar crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Forum' }]} />

          <div className="flex-1 p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
              <div>
                <h1 className="font-serif-alt text-3xl font-bold text-on-surface">Forum Management</h1>
                <p className="text-outline text-sm mt-1">Manage your topics — close discussions, view replies, and mark accepted answers</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  to="/forum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-outline hover:text-gold-accent border border-outline-variant/30 hover:border-gold-accent/40 px-4 py-2.5 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  Browse Forum
                </Link>
                <Link
                  to="/forum/new"
                  className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors dark:bg-rose-600 dark:hover:bg-rose-500"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  New Discussion
                </Link>
              </div>
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
                <Link to="/forum/new" className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-lg transition-colors dark:bg-rose-600 dark:hover:bg-rose-500">
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
    </>
  );
}
