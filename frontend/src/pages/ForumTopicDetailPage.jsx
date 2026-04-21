import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { forumApi } from '../api/forumApi';
import Spinner from '../components/common/Spinner';
import { userDisplayPhoto } from '../utils/absolutePhotoUrl';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
};

const fmtCat = (c) =>
  (c || 'general').split('-').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ');

const REPORT_REASONS = [
  { value: 'spam',           label: 'Spam'           },
  { value: 'harassment',     label: 'Harassment'     },
  { value: 'inappropriate',  label: 'Inappropriate'  },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other',          label: 'Other'          },
];

const CAT_COLORS = {
  'general':         'bg-slate-100 text-slate-700',
  'career-advice':   'bg-blue-100 text-blue-700',
  'leadership-tips': 'bg-purple-100 text-purple-700',
  'networking':      'bg-green-100 text-green-700',
  'work-life':       'bg-amber-100 text-amber-700',
  'success-stories': 'bg-rose-100 text-rose-700',
};

/* ─── Report Modal ───────────────────────────────────────────────────────── */

function ReportModal({ postId, postType, onClose, onSubmit }) {
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(postId, postType, reason, description);
      toast.success('Report submitted. Our team will review it.');
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-surface-container rounded-xl border border-outline-variant/20 shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif-alt text-lg font-bold text-on-surface">Report Content</h3>
          <button onClick={onClose} className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-outline-variant/30 rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-900/40"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Additional details (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Describe the issue…"
              className="w-full border border-outline-variant/30 rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-blue-900/40"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-outline hover:text-on-surface border border-outline-variant/30 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Vote Buttons ───────────────────────────────────────────────────────── */

function VoteButtons({ upvoteCount, downvoteCount, userVote, onVote, isAuthenticated, size = 'normal' }) {
  const sm = size === 'small';
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onVote('upvote')}
        disabled={!isAuthenticated}
        className={`flex items-center gap-1 rounded-lg px-2 py-1 border transition-all disabled:cursor-not-allowed ${
          userVote === 'upvote'
            ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
            : 'text-outline border-outline-variant/30 hover:text-green-600 hover:border-green-300 disabled:opacity-50'
        }`}
      >
        <span className={`material-symbols-outlined ${sm ? 'text-[16px]' : 'text-[18px]'}`}>thumb_up</span>
        <span className={sm ? 'text-xs' : 'text-sm'}>{upvoteCount || 0}</span>
      </button>
      <button
        onClick={() => onVote('downvote')}
        disabled={!isAuthenticated}
        className={`flex items-center gap-1 rounded-lg px-2 py-1 border transition-all disabled:cursor-not-allowed ${
          userVote === 'downvote'
            ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
            : 'text-outline border-outline-variant/30 hover:text-red-600 hover:border-red-300 disabled:opacity-50'
        }`}
      >
        <span className={`material-symbols-outlined ${sm ? 'text-[16px]' : 'text-[18px]'}`}>thumb_down</span>
        <span className={sm ? 'text-xs' : 'text-sm'}>{downvoteCount || 0}</span>
      </button>
    </div>
  );
}

/* ─── Reply Card ─────────────────────────────────────────────────────────── */

function ReplyCard({
  reply, user, topicAuthorId, onVote, onReport, onEdit, onDelete,
  onMarkAccepted, canMarkAccepted, canReply, onReplyToReply,
}) {
  const [editing, setEditing]         = useState(false);
  const [content, setContent]         = useState(reply.content);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [replyOpen, setReplyOpen]     = useState(false);
  const [replyText, setReplyText]     = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const handleInlineReply = async () => {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    await onReplyToReply(reply._id, replyText.trim());
    setReplySubmitting(false);
    setReplyText('');
    setReplyOpen(false);
  };

  const isOwn    = user && (user.id === reply.author?._id || user._id === reply.author?._id);
  const isAdmin  = user?.role === 'admin';
  const avatarSrc = userDisplayPhoto(reply.author, { size: 40 });

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await onEdit(reply._id, content.trim());
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this reply?')) return;
    setDeleting(true);
    await onDelete(reply._id);
    setDeleting(false);
  };

  return (
    <div
      id={`reply-${reply._id}`}
      className={`rounded-xl border p-5 transition-all ${
        reply.isAcceptedAnswer
          ? 'border-green-400/50 bg-green-50/50 dark:bg-green-900/10 dark:border-green-700/40'
          : 'border-slate-200 dark:border-outline-variant/30 bg-white dark:bg-surface-container-lowest'
      }`}
    >
      {reply.isAcceptedAnswer && (
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-widest mb-3">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          Accepted Answer
        </div>
      )}

      <div className="flex items-start gap-3">
        <img src={avatarSrc} alt={reply.author?.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-outline-variant/20" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">{reply.author?.name}</span>
              <span className="text-xs text-outline">{fmtDate(reply.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              {canMarkAccepted && (
                <button
                  onClick={() => onMarkAccepted(reply._id)}
                  title={reply.isAcceptedAnswer ? 'Unmark as accepted' : 'Mark as accepted answer'}
                  className={`text-xs px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                    reply.isAcceptedAnswer
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : 'text-outline border-outline-variant/30 hover:text-green-600 hover:border-green-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  {reply.isAcceptedAnswer ? 'Accepted' : 'Accept'}
                </button>
              )}
              {(isOwn || isAdmin) && !editing && (
                <>
                  <button
                    onClick={() => { setContent(reply.content); setEditing(true); }}
                    className="text-xs text-outline hover:text-blue-900 border border-transparent hover:border-blue-900/30 px-2 py-1 rounded-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs text-outline hover:text-red-500 border border-transparent hover:border-red-300 px-2 py-1 rounded-lg transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </>
              )}
              {user && !isOwn && (
                <button
                  onClick={() => onReport(reply._id, 'reply')}
                  title="Report"
                  className="text-xs text-outline hover:text-red-500 border border-transparent hover:border-red-300 px-2 py-1 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">flag</span>
                </button>
              )}
            </div>
          </div>

          {editing ? (
            <div className="space-y-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                maxLength={1000}
                className="w-full border border-outline-variant/30 rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface text-on-surface resize-y focus:outline-none focus:ring-2 focus:ring-blue-900/40"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !content.trim()}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-lg disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 text-xs text-outline hover:text-on-surface border border-outline-variant/30 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">{reply.content}</p>
          )}

          {/* Voting */}
          <div className="mt-3">
            <VoteButtons
              upvoteCount={reply.upvoteCount}
              downvoteCount={reply.downvoteCount}
              userVote={reply.userVote}
              onVote={(type) => onVote(reply._id, type, 'reply')}
              isAuthenticated={!!user}
              size="small"
            />
          </div>

          {/* Inline reply to this reply */}
          {canReply && (
            <div className="mt-3">
              {!replyOpen ? (
                <button
                  type="button"
                  onClick={() => setReplyOpen(true)}
                  className="text-xs text-outline hover:text-blue-900 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">reply</span>
                  Reply
                </button>
              ) : (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Write your reply…"
                    autoFocus
                    className="w-full border border-outline-variant/30 rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-blue-900/40"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleInlineReply}
                      disabled={replySubmitting || !replyText.trim()}
                      className="px-3 py-1.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-lg disabled:opacity-60 transition-colors"
                    >
                      {replySubmitting ? 'Posting…' : 'Post Reply'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setReplyOpen(false); setReplyText(''); }}
                      className="px-3 py-1.5 text-xs text-outline hover:text-on-surface border border-outline-variant/30 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Topic Detail Page ──────────────────────────────────────────────────── */

export default function ForumTopicDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [topic, setTopic]             = useState(null);
  const [replies, setReplies]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [replyPage, setReplyPage]     = useState(1);
  const [replyTotalPages, setReplyTotalPages] = useState(1);

  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const [reportTarget, setReportTarget] = useState(null); // { id, type }
  const [deletingTopic, setDeletingTopic] = useState(false);
  const [togglingClose, setTogglingClose] = useState(false);
  const [togglingPin, setTogglingPin]   = useState(false);

  const isOwner = user && topic && (user.id === topic.author?._id || user._id === topic.author?._id);
  const isAdmin = user?.role === 'admin';
  const isMentor = user?.role === 'mentor';
  const canClose = isOwner || isAdmin;
  const canPin   = isAdmin;
  const canMarkAccepted = isOwner || isAdmin || isMentor;
  const canDeleteTopic  = isOwner || isAdmin;

  const fetchTopic = useCallback(async () => {
    setLoading(true);
    try {
      const res = await forumApi.getTopicById(id, { page: replyPage, limit: 20 });
      const data = res.data;
      setTopic(data);
      setReplies(data.replies || []);
      setReplyTotalPages(data.replyPagination?.totalPages || 1);
    } catch (e) {
      if (e.response?.status === 404) {
        toast.error('Topic not found.');
        navigate('/forum');
      } else {
        toast.error('Failed to load topic.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, replyPage, navigate]);

  useEffect(() => { fetchTopic(); }, [fetchTopic]);

  /* Voting */
  const handleVote = async (postId, type, postType) => {
    if (!user) { toast.error('Please log in to vote.'); return; }
    try {
      const res = await forumApi.vote(postId, type, postType);
      if (postType === 'topic') {
        setTopic((t) => ({ ...t, upvoteCount: res.data.upvoteCount, downvoteCount: res.data.downvoteCount,
          userVote: t.userVote === type ? null : type }));
      } else {
        setReplies((prev) => prev.map((r) =>
          r._id === postId
            ? { ...r, upvoteCount: res.data.upvoteCount, downvoteCount: res.data.downvoteCount,
                userVote: r.userVote === type ? null : type }
            : r
        ));
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to vote.');
    }
  };

  /* Reporting */
  const handleReport = async (postId, postType, reason, description) => {
    await forumApi.report(postId, postType, reason, description);
  };

  /* Submit reply */
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please log in to reply.'); return; }
    if (!replyContent.trim()) return;
    if (topic?.isClosed) { toast.error('This topic is closed for replies.'); return; }
    setSubmitting(true);
    try {
      const res = await forumApi.createReply(id, replyContent.trim());
      setReplies((prev) => [...prev, res.data]);
      setReplyContent('');
      setTopic((t) => ({ ...t, replyCount: (t.replyCount || 0) + 1 }));
      toast.success('Reply posted!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to post reply.');
    } finally {
      setSubmitting(false);
    }
  };

  /* Reply to a reply */
  const handleReplyToReply = async (parentReplyId, content) => {
    if (!user) { toast.error('Please log in to reply.'); return; }
    if (topic?.isClosed) { toast.error('This topic is closed for replies.'); return; }
    try {
      const res = await forumApi.createReply(id, content, parentReplyId);
      setReplies((prev) => [...prev, res.data]);
      setTopic((t) => ({ ...t, replyCount: (t.replyCount || 0) + 1 }));
      toast.success('Reply posted!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to post reply.');
    }
  };

  /* Edit reply */
  const handleEditReply = async (replyId, content) => {
    try {
      const res = await forumApi.updateReply(replyId, content);
      setReplies((prev) => prev.map((r) => r._id === replyId ? { ...r, content: res.data.content } : r));
      toast.success('Reply updated.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update reply.');
    }
  };

  /* Delete reply */
  const handleDeleteReply = async (replyId) => {
    try {
      await forumApi.deleteReply(replyId);
      setReplies((prev) => prev.filter((r) => r._id !== replyId));
      setTopic((t) => ({ ...t, replyCount: Math.max(0, (t.replyCount || 1) - 1) }));
      toast.success('Reply deleted.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete reply.');
    }
  };

  /* Mark accepted answer */
  const handleMarkAccepted = async (replyId) => {
    try {
      const res = await forumApi.markAcceptedAnswer(replyId);
      setReplies((prev) => prev.map((r) => ({
        ...r,
        isAcceptedAnswer: r._id === replyId ? res.data.isAcceptedAnswer : false,
      })));
      toast.success(res.data.isAcceptedAnswer ? 'Marked as accepted answer.' : 'Acceptance removed.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to mark answer.');
    }
  };

  /* Delete topic */
  const handleDeleteTopic = async () => {
    if (!window.confirm('Delete this topic and all its replies? This cannot be undone.')) return;
    setDeletingTopic(true);
    try {
      await forumApi.deleteTopic(id);
      toast.success('Topic deleted.');
      navigate('/forum');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete topic.');
      setDeletingTopic(false);
    }
  };

  /* Toggle close */
  const handleToggleClose = async () => {
    setTogglingClose(true);
    try {
      const res = await forumApi.closeTopic(id);
      setTopic((t) => ({ ...t, isClosed: res.data.isClosed }));
      toast.success(res.data.isClosed ? 'Topic closed.' : 'Topic reopened.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update topic.');
    } finally {
      setTogglingClose(false);
    }
  };

  /* Toggle pin */
  const handleTogglePin = async () => {
    setTogglingPin(true);
    try {
      const res = await forumApi.pinTopic(id);
      setTopic((t) => ({ ...t, isPinned: res.data.isPinned }));
      toast.success(res.data.isPinned ? 'Topic pinned.' : 'Topic unpinned.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update topic.');
    } finally {
      setTogglingPin(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!topic) return null;

  const catColor = CAT_COLORS[topic.category] || CAT_COLORS.general;
  const avatarSrc = userDisplayPhoto(topic.author, { size: 48 });

  return (
    <div className="min-h-screen bg-surface">
      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          postId={reportTarget.id}
          postType={reportTarget.type}
          onClose={() => setReportTarget(null)}
          onSubmit={handleReport}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 pt-20 pb-10 sm:pt-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2.5 text-sm sm:text-base text-outline mb-6">
          <Link to="/forum" className="font-medium hover:text-blue-900 transition-colors">Forum</Link>
          <span className="material-symbols-outlined text-[18px] sm:text-[22px] shrink-0">chevron_right</span>
          <span className="text-on-surface font-semibold line-clamp-1">{topic.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start">
        {/* Left: topic + description (~2/3 width) */}
        <div className="lg:col-span-2 min-w-0">
        <div className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/30 rounded-xl p-6">
          {/* Badges + admin actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              {topic.isPinned && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-900 bg-blue-900/10 border border-blue-900/25 px-2 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[12px]">push_pin</span>
                  Pinned
                </span>
              )}
              {topic.isClosed && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[12px]">lock</span>
                  Closed
                </span>
              )}
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${catColor}`}>
                {fmtCat(topic.category)}
              </span>
            </div>

            {/* Admin / owner actions */}
            <div className="flex flex-wrap items-center gap-2">
              {canPin && (
                <button
                  onClick={handleTogglePin}
                  disabled={togglingPin}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-60 ${
                    topic.isPinned
                      ? 'bg-blue-900/10 text-blue-900 border-blue-900/30 hover:bg-blue-900/20'
                      : 'text-outline border-outline-variant/30 hover:text-blue-900 hover:border-blue-900/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">push_pin</span>
                  {topic.isPinned ? 'Unpin' : 'Pin'}
                </button>
              )}
              {canClose && (
                <button
                  onClick={handleToggleClose}
                  disabled={togglingClose}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-60 ${
                    topic.isClosed
                      ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                      : 'text-outline border-outline-variant/30 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{topic.isClosed ? 'lock_open' : 'lock'}</span>
                  {topic.isClosed ? 'Reopen' : 'Close'}
                </button>
              )}
              {isOwner && (
                <Link
                  to={`/forum/${id}/edit`}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-outline-variant/30 text-outline hover:text-blue-900 hover:border-blue-900/30 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  Edit
                </Link>
              )}
              {canDeleteTopic && (
                <button
                  onClick={handleDeleteTopic}
                  disabled={deletingTopic}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-outline-variant/30 text-outline hover:text-red-500 hover:border-red-300 transition-all disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  Delete
                </button>
              )}
              {user && !isOwner && (
                <button
                  onClick={() => setReportTarget({ id: topic._id, type: 'topic' })}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-outline-variant/30 text-outline hover:text-red-500 hover:border-red-300 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">flag</span>
                  Report
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="font-serif-alt text-2xl md:text-3xl font-bold text-on-surface mb-4 leading-snug">
            {topic.title}
          </h1>

          {/* Author */}
          <div className="flex items-center gap-3 mb-5">
            <img src={avatarSrc} alt={topic.author?.name} className="w-10 h-10 rounded-full object-cover border border-outline-variant/20" />
            <div>
              <p className="text-sm font-bold text-on-surface">{topic.author?.name}</p>
              <p className="text-xs text-outline">{fmtDate(topic.createdAt)}</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none text-on-surface whitespace-pre-wrap leading-relaxed mb-5 border-t border-outline-variant/15 pt-5">
            {topic.content}
          </div>

          {/* Tags */}
          {topic.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {topic.tags.map((tag) => (
                <span key={tag} className="text-xs bg-slate-100 dark:bg-surface-container text-slate-600 dark:text-outline px-2 py-1 rounded-full border border-slate-200 dark:border-outline-variant/20">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats + Voting */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-outline-variant/15">
            <div className="flex items-center gap-4 text-xs text-outline">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">visibility</span>
                {topic.views || 0} views
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">chat_bubble_outline</span>
                {topic.replyCount || 0} replies
              </span>
            </div>
            <VoteButtons
              upvoteCount={topic.upvoteCount}
              downvoteCount={topic.downvoteCount}
              userVote={topic.userVote}
              onVote={(type) => handleVote(topic._id, type, 'topic')}
              isAuthenticated={!!user}
            />
          </div>
        </div>

        {/* Post a reply — under topic & description */}
        <div className="mt-6">
          {topic.isClosed ? (
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-surface-container border border-slate-200 dark:border-outline-variant/20 rounded-xl text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px] text-outline">lock</span>
              This topic is closed. No new replies can be added.
            </div>
          ) : user ? (
            <div className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/30 rounded-xl p-6">
              <h3 className="text-sm font-bold text-outline uppercase tracking-widest mb-4">Post a Reply</h3>
              <form onSubmit={handleSubmitReply}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={5}
                  maxLength={1000}
                  placeholder="Share your thoughts, advice, or experience…"
                  className="w-full border border-outline-variant/30 rounded-lg px-4 py-3 text-sm text-on-surface bg-white dark:bg-surface resize-y focus:outline-none focus:ring-2 focus:ring-blue-900/40 focus:border-blue-900 transition-all placeholder:text-outline/60"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-outline">{replyContent.length}/1000</span>
                  <button
                    type="submit"
                    disabled={submitting || !replyContent.trim()}
                    className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        Posting…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        Post Reply
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-8 bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/30 rounded-xl">
              <p className="text-on-surface-variant mb-3">Join the conversation</p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">login</span>
                Log in to reply
              </Link>
            </div>
          )}
        </div>
        </div>

        {/* Right: replies (~1/3 width) */}
        <div className="lg:col-span-1 flex flex-col min-w-0">
        <div>
          <h2 className="text-sm font-bold text-outline uppercase tracking-widest mb-4">
            {topic.replyCount || 0} {(topic.replyCount || 0) === 1 ? 'Reply' : 'Replies'}
          </h2>

          {replies.length === 0 ? (
            <div className="text-center py-10 text-on-surface-variant text-sm">
              No replies yet. Be the first to respond!
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Build reply tree (group children under their parent)
                const map = {};
                replies.forEach((r) => { map[r._id] = { ...r, children: [] }; });
                const roots = [];
                replies.forEach((r) => {
                  const parentId = r.parentReply ? r.parentReply.toString() : null;
                  if (parentId && map[parentId]) {
                    map[parentId].children.push(map[r._id]);
                  } else {
                    roots.push(map[r._id]);
                  }
                });
                const sharedProps = {
                  user,
                  topicAuthorId: topic.author?._id,
                  onVote: handleVote,
                  onReport: (postId, postType) => setReportTarget({ id: postId, type: postType }),
                  onEdit: handleEditReply,
                  onDelete: handleDeleteReply,
                  onMarkAccepted: handleMarkAccepted,
                  canMarkAccepted: canMarkAccepted && !topic.isClosed,
                  canReply: !!user && !topic.isClosed,
                  onReplyToReply: handleReplyToReply,
                };
                return roots.map((reply) => (
                  <div key={reply._id}>
                    <ReplyCard reply={reply} {...sharedProps} />
                    {reply.children?.length > 0 && (
                      <div className="ml-8 pl-5 mt-3 space-y-3 border-l-2 border-slate-200 dark:border-outline-variant/20">
                        {reply.children.map((child) => (
                          <ReplyCard key={child._id} reply={child} {...sharedProps} />
                        ))}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          )}

          {/* Reply pagination */}
          {replyTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                disabled={replyPage <= 1}
                onClick={() => setReplyPage((p) => p - 1)}
                className="p-2 rounded-lg border border-outline-variant/30 text-outline hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="text-sm text-on-surface-variant">
                Page {replyPage} of {replyTotalPages}
              </span>
              <button
                disabled={replyPage >= replyTotalPages}
                onClick={() => setReplyPage((p) => p + 1)}
                className="p-2 rounded-lg border border-outline-variant/30 text-outline hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}
