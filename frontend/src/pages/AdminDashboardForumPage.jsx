import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminTopBar from '../components/dashboard/AdminTopBar';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { forumApi } from '../api/forumApi';
import Spinner from '../components/common/Spinner';
// Utility functions
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

const CATEGORIES = [
  { value: '',                label: 'All'            },
  { value: 'general',         label: 'General'        },
  { value: 'career-advice',   label: 'Career Advice'  },
  { value: 'leadership-tips', label: 'Leadership Tips'},
  { value: 'networking',      label: 'Networking'     },
  { value: 'work-life',       label: 'Work & Life'    },
  { value: 'success-stories', label: 'Success Stories'},
];

const REPORT_STATUS_COLORS = {
  pending:  'bg-amber-100 text-amber-700 border-amber-200',
  reviewed: 'bg-green-100 text-green-700 border-green-200',
  dismissed:'bg-slate-100 text-slate-600 border-slate-200',
};

/* ─── Topic Row ──────────────────────────────────────────────────────────── */

function TopicRow({ topic, onPin, onClose, onDelete, loading }) {
  return (
    <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-rose-500/25 transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${CAT_COLORS[topic.category] || CAT_COLORS.general}`}>
            {fmtCat(topic.category)}
          </span>
          {topic.isPinned && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/25 dark:border-rose-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[11px]">push_pin</span>Pinned
            </span>
          )}
          {topic.isClosed ? (
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[11px]">lock</span>Closed
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Open</span>
          )}
        </div>
        <Link to={`/forum/${topic._id}`} className="block font-bold text-on-surface hover:text-rose-600 dark:hover:text-rose-400 transition-colors line-clamp-1 mb-1">
          {topic.title}
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-xs text-outline">
          <span className="font-medium text-on-surface-variant">{topic.author?.name}</span>
          <span>{fmtDate(topic.createdAt)}</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">chat_bubble_outline</span>{topic.replyCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">thumb_up</span>{topic.upvoteCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">visibility</span>{topic.views || 0}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
        <Link
          to={`/forum/${topic._id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 hover:border-sky-300 px-4 py-2 min-h-[40px] rounded-xl transition-all dark:text-sky-300 dark:bg-sky-950/50 dark:border-sky-800/80 dark:hover:bg-sky-950/80"
        >
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          View
        </Link>
        <button
          type="button"
          onClick={() => onPin(topic._id)}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 min-h-[40px] rounded-xl border transition-all disabled:opacity-60 ${
            topic.isPinned
              ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-600/50 dark:hover:bg-rose-950'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 dark:hover:bg-rose-950/70'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">push_pin</span>
          {topic.isPinned ? 'Unpin' : 'Pin'}
        </button>
        <button
          type="button"
          onClick={() => onClose(topic._id)}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 min-h-[40px] rounded-xl border transition-all disabled:opacity-60 ${
            topic.isClosed
              ? 'text-green-800 bg-green-50 border-green-300 hover:bg-green-100 dark:text-green-300 dark:bg-green-950/50 dark:border-green-700 dark:hover:bg-green-950/80'
              : 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300 dark:text-amber-200 dark:bg-amber-950/45 dark:border-amber-800/70 dark:hover:bg-amber-950/70'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">{topic.isClosed ? 'lock_open' : 'lock'}</span>
          {topic.isClosed ? 'Reopen' : 'Close'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(topic)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 px-4 py-2 min-h-[40px] rounded-xl transition-all dark:text-red-400 dark:bg-red-950/40 dark:border-red-900/60 dark:hover:bg-red-950/70"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
          Delete
        </button>
      </div>
    </div>
  );
}

/* ─── Report Row ─────────────────────────────────────────────────────────── */

function ReportRow({ report, onResolve }) {
  const [processing, setProcessing] = useState(false);
  const statusColor = REPORT_STATUS_COLORS[report.status] || REPORT_STATUS_COLORS.pending;

  const handle = async (action) => {
    setProcessing(true);
    try {
      await onResolve(report._id, action);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusColor}`}>
              {report.status}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {report.postType}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
              {report.reason}
            </span>
          </div>
          <div className="text-sm text-on-surface-variant mb-1">
            <span className="font-medium text-on-surface">{report.reporter?.name}</span>
            <span className="text-outline"> · {report.reporter?.email}</span>
          </div>
          {report.description && (
            <p className="text-sm text-outline italic mt-1">"{report.description}"</p>
          )}
          <p className="text-xs text-outline mt-1">Reported {fmtDate(report.createdAt)}</p>
          {report.reviewedBy && (
            <p className="text-xs text-outline mt-0.5">
              Reviewed by {report.reviewedBy?.name} on {fmtDate(report.reviewedAt)}
            </p>
          )}
          <div className="mt-2">
            <Link
              to={`/forum/${report.post}`}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              View reported content
            </Link>
          </div>
        </div>
        {report.status === 'pending' && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => handle('reviewed')}
              disabled={processing}
              className="flex items-center gap-1 text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Resolve
            </button>
            <button
              onClick={() => handle('dismissed')}
              disabled={processing}
              className="flex items-center gap-1 text-xs text-slate-600 border border-slate-300 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[14px]">cancel</span>
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Admin Dashboard Forum Page ─────────────────────────────────────────── */

export default function AdminDashboardForumPage() {
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('topics'); // 'topics' | 'reports'

  // Topics state
  const [topics, setTopics]           = useState([]);
  const [pinnedTopics, setPinnedTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsPage, setTopicsPage]   = useState(1);
  const [topicsTotalPages, setTopicsTotalPages] = useState(1);
  const [topicsTotal, setTopicsTotal] = useState(0);
  const [topicCategory, setTopicCategory] = useState('');
  const [topicSearch, setTopicSearch] = useState('');
  const [topicSearchInput, setTopicSearchInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, title: '' });
  const [deleteTopicPending, setDeleteTopicPending] = useState(false);

  // Reports state
  const [reports, setReports]               = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsPage, setReportsPage]       = useState(1);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  const [reportsTotal, setReportsTotal]     = useState(0);
  const [reportStatus, setReportStatus]     = useState('');

  const fetchTopics = useCallback(async () => {
    setTopicsLoading(true);
    try {
      const res = await forumApi.getTopics({
        page: topicsPage, limit: 15,
        category: topicCategory || undefined,
        search: topicSearch || undefined,
        sort: 'newest',
      });
      setTopics(res.data.topics || []);
      setPinnedTopics(res.data.pinned || []);
      setTopicsTotalPages(res.data.pagination?.totalPages || 1);
      setTopicsTotal(res.data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load topics.');
    } finally {
      setTopicsLoading(false);
    }
  }, [topicsPage, topicCategory, topicSearch]);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await forumApi.getReports({
        page: reportsPage, limit: 15,
        status: reportStatus || undefined,
      });
      setReports(res.data.reports || []);
      setReportsTotalPages(res.data.pagination?.totalPages || 1);
      setReportsTotal(res.data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load reports.');
    } finally {
      setReportsLoading(false);
    }
  }, [reportsPage, reportStatus]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);
  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
  }, [activeTab, fetchReports]);

  const handlePin = async (topicId) => {
    setActionLoading(true);
    try {
      const res = await forumApi.pinTopic(topicId);
      setTopics((prev) => prev.map((t) => t._id === topicId ? { ...t, isPinned: res.data.isPinned } : t));
      setPinnedTopics((prev) => {
        if (res.data.isPinned) return [...prev, { ...res.data }];
        return prev.filter((t) => t._id !== topicId);
      });
      toast.success(res.data.isPinned ? 'Topic pinned.' : 'Topic unpinned.');
      fetchTopics();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to pin/unpin topic.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async (topicId) => {
    setActionLoading(true);
    try {
      const res = await forumApi.closeTopic(topicId);
      const update = (arr) => arr.map((t) => t._id === topicId ? { ...t, isClosed: res.data.isClosed } : t);
      setTopics(update);
      setPinnedTopics(update);
      toast.success(res.data.isClosed ? 'Topic closed.' : 'Topic reopened.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to close/reopen topic.');
    } finally {
      setActionLoading(false);
    }
  };

  const requestDeleteTopic = (topic) => {
    setDeleteDialog({
      open: true,
      id: topic._id,
      title: (topic.title || '').trim() || 'this discussion',
    });
  };

  const closeDeleteTopicDialog = () => {
    if (deleteTopicPending) return;
    setDeleteDialog({ open: false, id: null, title: '' });
  };

  const confirmDeleteTopic = async () => {
    if (!deleteDialog.id) return;
    setDeleteTopicPending(true);
    try {
      await forumApi.deleteTopic(deleteDialog.id);
      toast.success('Topic deleted.');
      setDeleteDialog({ open: false, id: null, title: '' });
      fetchTopics();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete topic.');
    } finally {
      setDeleteTopicPending(false);
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      const res = await forumApi.resolveReport(reportId, action);
      setReports((prev) => prev.map((r) => r._id === reportId ? res.data : r));
      toast.success(action === 'reviewed' ? 'Report marked as resolved.' : 'Report dismissed.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update report.');
    }
  };

  const handleTopicSearch = (e) => {
    e.preventDefault();
    setTopicsPage(1);
    setTopicSearch(topicSearchInput.trim());
  };

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <>
          <AdminTopBar
            crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Forum' }]}
            user={user}
            profileOpen={profileOpen}
            setProfileOpen={setProfileOpen}
          />
          <div className="px-4 sm:px-8 pt-4 pb-8 max-w-[1600px] mx-auto w-full">
            <div className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/20 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-outline-variant/20 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0 flex-1">
                  <h1 className="font-serif-alt text-2xl sm:text-3xl font-bold text-on-surface">Forum moderation</h1>
                  <p className="text-sm text-outline mt-1">Pin topics, close threads, and review reports.</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3 shrink-0 sm:ml-auto self-end sm:self-auto w-full sm:w-auto">
                  <Link
                    to="/forum"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium bg-white dark:bg-surface-container text-outline border border-outline-variant/30 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-400/50 hover:bg-rose-50/80 dark:hover:bg-rose-950/20 px-4 py-2.5 rounded-lg transition-all shadow-sm dark:hover:bg-surface-container-high"
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
            <div className="px-6 sm:px-8 pt-6 pb-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100 dark:border-outline-variant/20">
              <div className="rounded-xl border-2 border-sky-300 bg-sky-100 p-5 dark:border-sky-700 dark:bg-sky-950">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[22px] text-sky-700 dark:text-sky-300">forum</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sky-900 dark:text-sky-200">Total Topics</p>
                </div>
                <p className="font-serif-alt text-3xl font-bold text-sky-800 dark:text-sky-200">{topicsTotal}</p>
              </div>
              <div className="rounded-xl border-2 border-rose-300 bg-rose-100 p-5 dark:border-rose-700 dark:bg-rose-950">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[22px] text-rose-700 dark:text-rose-300" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rose-900 dark:text-rose-200">Pinned</p>
                </div>
                <p className="font-serif-alt text-3xl font-bold text-rose-700 dark:text-rose-300">{pinnedTopics.length}</p>
              </div>
              <div className={`rounded-xl border-2 p-5 ${
                reportsTotal > 0
                  ? 'border-orange-400 bg-orange-100 dark:border-orange-600 dark:bg-orange-950'
                  : 'border-amber-300 bg-amber-100 dark:border-amber-700 dark:bg-amber-950'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`material-symbols-outlined text-[22px] ${reportsTotal > 0 ? 'text-orange-700 dark:text-orange-300' : 'text-amber-800 dark:text-amber-300'}`}>flag</span>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${reportsTotal > 0 ? 'text-orange-950 dark:text-orange-100' : 'text-amber-950 dark:text-amber-200'}`}>Pending Reports</p>
                </div>
                <p className={`font-serif-alt text-3xl font-bold ${reportsTotal > 0 ? 'text-red-700 dark:text-red-400' : 'text-amber-900 dark:text-amber-200'}`}>
                  {reportsTotal}
                </p>
              </div>
              <div className="rounded-xl border-2 border-violet-300 bg-violet-100 p-5 dark:border-violet-700 dark:bg-violet-950">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[22px] text-violet-700 dark:text-violet-300">category</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-violet-950 dark:text-violet-200">Categories</p>
                </div>
                <p className="font-serif-alt text-3xl font-bold text-violet-800 dark:text-violet-200">6</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-nowrap items-center gap-1 px-4 sm:px-6 border-b border-outline-variant/20 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setActiveTab('topics')}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px relative ${
                  activeTab === 'topics'
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-outline hover:text-on-surface'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">forum</span>
                  Topics
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px relative ${
                  activeTab === 'reports'
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-outline hover:text-on-surface'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">flag</span>
                  Reports
                  {reportsTotal > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {reportsTotal}
                    </span>
                  )}
                </span>
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
            {/* Topics Tab */}
            {activeTab === 'topics' && (
              <div>
                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-5">
                  <form onSubmit={handleTopicSearch} className="flex gap-2 flex-1 min-w-[200px]">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">search</span>
                      <input
                        type="text"
                        value={topicSearchInput}
                        onChange={(e) => setTopicSearchInput(e.target.value)}
                        placeholder="Search topics…"
                        className="w-full border border-outline-variant/30 rounded-lg pl-9 pr-4 py-2 text-sm bg-white dark:bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                    <button type="submit" className="px-3 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors dark:bg-rose-600 dark:hover:bg-rose-500">
                      Search
                    </button>
                  </form>
                  <select
                    value={topicCategory}
                    onChange={(e) => { setTopicCategory(e.target.value); setTopicsPage(1); }}
                    className="border border-outline-variant/30 rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {topicsLoading ? (
                  <div className="flex justify-center py-20"><Spinner size="lg" /></div>
                ) : (
                  <>
                    {/* Pinned */}
                    {pinnedTopics.length > 0 && (
                      <div className="mb-4 space-y-3">
                        <p className="text-xs font-bold text-outline uppercase tracking-widest">Pinned</p>
                        {pinnedTopics.map((t) => (
                          <TopicRow key={t._id} topic={t} onPin={handlePin} onClose={handleClose} onDelete={requestDeleteTopic} loading={actionLoading} />
                        ))}
                      </div>
                    )}

                    {topics.length === 0 && pinnedTopics.length === 0 ? (
                      <div className="text-center py-16 bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl">
                        <span className="material-symbols-outlined text-4xl text-outline/40 mb-3 block">forum</span>
                        <p className="text-on-surface-variant">No topics found.</p>
                      </div>
                    ) : (
                      <>
                        {topics.length > 0 && (
                          <div className="space-y-3">
                            {topics.map((t) => (
                              <TopicRow key={t._id} topic={t} onPin={handlePin} onClose={handleClose} onDelete={requestDeleteTopic} loading={actionLoading} />
                            ))}
                          </div>
                        )}

                        {topicsTotalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-6">
                            <button disabled={topicsPage <= 1} onClick={() => setTopicsPage((p) => p - 1)}
                              className="p-2 rounded-lg border border-outline-variant/30 text-outline disabled:opacity-40 disabled:cursor-not-allowed">
                              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                            <span className="text-sm text-on-surface-variant">Page {topicsPage} of {topicsTotalPages}</span>
                            <button disabled={topicsPage >= topicsTotalPages} onClick={() => setTopicsPage((p) => p + 1)}
                              className="p-2 rounded-lg border border-outline-variant/30 text-outline disabled:opacity-40 disabled:cursor-not-allowed">
                              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div>
                {/* Filter by status */}
                <div className="flex gap-2 mb-5">
                  {[
                    { value: '', label: 'All' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'reviewed', label: 'Reviewed' },
                    { value: 'dismissed', label: 'Dismissed' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => { setReportStatus(s.value); setReportsPage(1); }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                        reportStatus === s.value
                          ? 'bg-rose-500 text-white border-rose-500 dark:bg-rose-600 dark:border-rose-600'
                          : 'bg-white dark:bg-surface-container-lowest text-outline border-outline-variant/30 hover:border-rose-400/50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {reportsLoading ? (
                  <div className="flex justify-center py-20"><Spinner size="lg" /></div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl">
                    <span className="material-symbols-outlined text-4xl text-outline/40 mb-3 block">flag</span>
                    <p className="text-on-surface-variant">No reports found.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {reports.map((r) => (
                        <ReportRow key={r._id} report={r} onResolve={handleResolveReport} />
                      ))}
                    </div>
                    {reportsTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <button disabled={reportsPage <= 1} onClick={() => setReportsPage((p) => p - 1)}
                          className="p-2 rounded-lg border border-outline-variant/30 text-outline disabled:opacity-40 disabled:cursor-not-allowed">
                          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <span className="text-sm text-on-surface-variant">Page {reportsPage} of {reportsTotalPages}</span>
                        <button disabled={reportsPage >= reportsTotalPages} onClick={() => setReportsPage((p) => p + 1)}
                          className="p-2 rounded-lg border border-outline-variant/30 text-outline disabled:opacity-40 disabled:cursor-not-allowed">
                          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            </div>
            </div>
          </div>

        {deleteDialog.open && (
          <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close dialog"
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
              onClick={closeDeleteTopicDialog}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-delete-forum-topic-title"
              className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-outline-variant/25 bg-white dark:bg-surface-container-lowest shadow-[0_24px_60px_rgba(15,23,42,0.28)] p-6"
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-500 text-[32px] shrink-0" aria-hidden>delete_forever</span>
                <div className="min-w-0">
                  <h3 id="admin-delete-forum-topic-title" className="font-serif-alt text-xl font-bold text-on-surface">
                    Delete discussion?
                  </h3>
                  <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
                    This will permanently remove{' '}
                    <span className="font-semibold text-on-surface break-words">"{deleteDialog.title}"</span>
                    {' '}and all replies. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeDeleteTopicDialog}
                  disabled={deleteTopicPending}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-outline-variant/40 text-sm font-bold text-on-surface-variant hover:bg-slate-50 dark:hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTopic}
                  disabled={deleteTopicPending}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
                >
                  {deleteTopicPending && <Spinner size="sm" className="text-white" />}
                  {deleteTopicPending ? 'Deleting…' : 'Delete discussion'}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
