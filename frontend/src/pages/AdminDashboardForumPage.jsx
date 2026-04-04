import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
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
    <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-gold-accent/20 transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${CAT_COLORS[topic.category] || CAT_COLORS.general}`}>
            {fmtCat(topic.category)}
          </span>
          {topic.isPinned && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-gold-accent bg-gold-accent/10 border border-gold-accent/20 px-2 py-0.5 rounded-full flex items-center gap-1">
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
        <Link to={`/forum/${topic._id}`} className="block font-bold text-on-surface hover:text-gold-accent transition-colors line-clamp-1 mb-1">
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
      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
        <Link
          to={`/forum/${topic._id}`}
          className="flex items-center gap-1 text-xs text-outline hover:text-gold-accent border border-outline-variant/30 hover:border-gold-accent/30 px-2.5 py-1.5 rounded-lg transition-all"
        >
          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          View
        </Link>
        <button
          onClick={() => onPin(topic._id)}
          disabled={loading}
          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-60 ${
            topic.isPinned
              ? 'bg-gold-accent/10 text-gold-accent border-gold-accent/30 hover:bg-gold-accent/20'
              : 'text-outline border-outline-variant/30 hover:text-gold-accent hover:border-gold-accent/30'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">push_pin</span>
          {topic.isPinned ? 'Unpin' : 'Pin'}
        </button>
        <button
          onClick={() => onClose(topic._id)}
          disabled={loading}
          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-60 ${
            topic.isClosed
              ? 'text-green-700 bg-green-50 border-green-300 hover:bg-green-100'
              : 'text-slate-600 border-outline-variant/30 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">{topic.isClosed ? 'lock_open' : 'lock'}</span>
          {topic.isClosed ? 'Reopen' : 'Close'}
        </button>
        <button
          onClick={() => onDelete(topic._id)}
          className="flex items-center gap-1 text-xs text-outline hover:text-red-500 border border-outline-variant/30 hover:border-red-300 px-2.5 py-1.5 rounded-lg transition-all"
        >
          <span className="material-symbols-outlined text-[14px]">delete</span>
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
              className="text-xs text-gold-accent hover:underline flex items-center gap-1"
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
  const { user, logout } = useAuth();
  const firstName = user?.name?.split(' ')?.[0] || 'Admin';

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

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Delete this topic and all replies? This cannot be undone.')) return;
    try {
      await forumApi.deleteTopic(topicId);
      toast.success('Topic deleted.');
      fetchTopics();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete topic.');
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
          <DashboardTopBar crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Forum' }]} showAvatar={false} />

          <div className="flex-1 p-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
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
                className="inline-flex items-center gap-2 bg-gold-accent hover:bg-gold-accent/90 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Discussion
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Total Topics</p>
                <p className="font-serif-alt text-3xl font-bold text-on-surface">{topicsTotal}</p>
              </div>
              <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Pinned</p>
                <p className="font-serif-alt text-3xl font-bold text-gold-accent">{pinnedTopics.length}</p>
              </div>
              <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Pending Reports</p>
                <p className={`font-serif-alt text-3xl font-bold ${reportsTotal > 0 ? 'text-red-500' : 'text-on-surface'}`}>
                  {reportsTotal}
                </p>
              </div>
              <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Categories</p>
                <p className="font-serif-alt text-3xl font-bold text-on-surface">6</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-outline-variant/20">
              <button
                onClick={() => setActiveTab('topics')}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${
                  activeTab === 'topics'
                    ? 'border-gold-accent text-gold-accent'
                    : 'border-transparent text-outline hover:text-on-surface'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">forum</span>
                  Topics
                </span>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${
                  activeTab === 'reports'
                    ? 'border-gold-accent text-gold-accent'
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
                        className="w-full border border-outline-variant/30 rounded-lg pl-9 pr-4 py-2 text-sm bg-white dark:bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-gold-accent"
                      />
                    </div>
                    <button type="submit" className="px-3 py-2 text-xs font-bold bg-gold-accent hover:bg-gold-accent/90 text-white rounded-lg transition-colors">
                      Search
                    </button>
                  </form>
                  <select
                    value={topicCategory}
                    onChange={(e) => { setTopicCategory(e.target.value); setTopicsPage(1); }}
                    className="border border-outline-variant/30 rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-gold-accent"
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
                          <TopicRow key={t._id} topic={t} onPin={handlePin} onClose={handleClose} onDelete={handleDeleteTopic} loading={actionLoading} />
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
                              <TopicRow key={t._id} topic={t} onPin={handlePin} onClose={handleClose} onDelete={handleDeleteTopic} loading={actionLoading} />
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
                          ? 'bg-gold-accent text-white border-gold-accent'
                          : 'bg-white dark:bg-surface-container-lowest text-outline border-outline-variant/30 hover:border-gold-accent/40'
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
    </>
  );
}
