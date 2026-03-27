import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storyApi } from '../api/storyApi';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

export default function StoryDetailPage() {
  const { id }            = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate          = useNavigate();
  const [story, setStory] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment]   = useState('');
  const [loading, setLoading]   = useState(true);
  const [liking, setLiking]     = useState(false);
  const [liked, setLiked]       = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      storyApi.getById(id),
      storyApi.getComments(id),
    ])
      .then(([sRes, cRes]) => {
        const s = sRes.data;
        setStory(s);
        setLikeCount(s.likeCount || 0);
        setLiked(s.userLiked || false);
        setComments(cRes.data?.comments || []);
      })
      .catch(() => navigate('/stories'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated) { toast.error('Log in to like stories'); return; }
    setLiking(true);
    try {
      const res = await storyApi.toggleLike(id);
      setLiked(res.data.userLiked);
      setLikeCount(res.data.likeCount);
    } catch { toast.error('Failed to like'); }
    finally { setLiking(false); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await storyApi.addComment(id, comment);
      setComments((c) => [res.data, ...c]);
      setComment('');
      toast.success('Comment added!');
    } catch { toast.error('Failed to add comment'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await storyApi.delete(id);
      toast.success('Story deleted');
      navigate('/stories');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  if (!story)  return null;

  const isOwner = user?._id === (story.author?._id || story.author);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 dark:text-on-surface-variant mb-6">
        <Link to="/stories" className="hover:text-brand-600">Stories</Link>
        <span>/</span>
        <span className="text-gray-600 dark:text-on-surface-variant truncate max-w-xs">{story.title}</span>
      </nav>

      {/* Category badge */}
      <span className="badge bg-brand-100 text-brand-700 mb-4">{story.category}</span>

      <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-on-surface leading-tight mb-6">
        {story.title}
      </h1>

      {/* Meta */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-outline-variant/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">
            {story.author?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="font-medium text-sm text-gray-900 dark:text-on-surface">{story.author?.name || 'Unknown'}</p>
            <p className="text-xs text-gray-400 dark:text-on-surface-variant">
              {new Date(story.publishedAt || story.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {' · '}{story.readingTime} min read
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <Link to={`/stories/${id}/edit`} className="btn-secondary text-xs py-1.5 px-3">Edit</Link>
              <button onClick={handleDelete} className="btn-ghost text-xs py-1.5 px-3 text-red-500 hover:bg-red-50">Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Content — HTML from TinyMCE editor */}
      <div
        className="prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-on-surface leading-relaxed text-base mb-10 story-body-html"
        dangerouslySetInnerHTML={{ __html: story.content || '' }}
      />

      {/* Tags */}
      {story.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {story.tags.map((t) => (
            <span key={t} className="badge bg-gray-100 dark:bg-surface-container text-gray-600 dark:text-on-surface-variant">#{t}</span>
          ))}
        </div>
      )}

      {/* Like */}
      <div className="flex items-center gap-4 py-6 border-t border-b border-gray-100 dark:border-outline-variant/20 mb-10">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            liked ? 'bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800/40' : 'border border-gray-200 dark:border-outline-variant/30 text-gray-500 dark:text-on-surface-variant hover:border-red-200 hover:text-red-500'
          }`}
        >
          <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.5}>
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
          </svg>
          {likeCount} {likeCount === 1 ? 'like' : 'likes'}
        </button>
        <span className="text-sm text-gray-400 dark:text-on-surface-variant">{story.views || 0} views</span>
      </div>

      {/* Comments */}
      <section>
        <h2 className="font-display text-xl font-semibold text-gray-900 dark:text-on-surface mb-6">
          Comments ({comments.length})
        </h2>

        {isAuthenticated && (
          <form onSubmit={handleComment} className="mb-6 flex gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                value={comment} onChange={(e) => setComment(e.target.value)}
                className="input flex-1" placeholder="Add a comment…"
              />
              <button type="submit" className="btn-primary px-4">Post</button>
            </div>
          </form>
        )}

        {comments.length === 0 ? (
          <p className="text-gray-400 dark:text-on-surface-variant text-sm">No comments yet. Be the first!</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c._id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-surface-container-high flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {c.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="bg-gray-50 dark:bg-surface-container rounded-xl px-4 py-3 flex-1">
                  <p className="font-medium text-sm text-gray-800 dark:text-on-surface">{c.user?.name || 'User'}</p>
                  <p className="text-sm text-gray-600 dark:text-on-surface-variant mt-0.5">{c.content}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
