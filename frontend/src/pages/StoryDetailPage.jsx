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
  const authorName = story.author?.name || 'Unknown Mentor';
  const authorAvatar = story.author?.profilePicture || story.author?.avatar || '';
  const currentUserAvatar = user?.profilePicture || user?.avatar || '';
  const categoryLabel = story.category ? story.category.replace(/-/g, ' ') : 'story';
  const publishedDate = new Date(story.publishedAt || story.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const excerpt = story.excerpt || '';
  const hasCover = !!story.coverImage;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-12">
      <nav className="flex items-center gap-2 text-xs uppercase tracking-widest text-outline mb-6">
        <Link to="/stories" className="hover:text-gold-accent transition-colors">Stories</Link>
        <span className="material-symbols-outlined text-[13px]">chevron_right</span>
        <span className="line-clamp-1 text-on-surface-variant max-w-[65%]">{story.title}</span>
      </nav>

      <article className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden editorial-shadow">
        {hasCover && (
          <div className="relative h-[240px] sm:h-[320px] lg:h-[380px]">
            <img
              src={story.coverImage}
              alt={story.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
            <div className="absolute bottom-5 left-5 flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/90 text-[10px] font-bold uppercase tracking-widest text-on-surface">
                {categoryLabel}
              </span>
              <span className="px-3 py-1 rounded-full bg-black/50 text-[10px] font-bold uppercase tracking-widest text-white/95">
                {story.status || 'published'}
              </span>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 lg:p-10">
          {!hasCover && (
            <span className="inline-flex px-3 py-1 rounded-full border border-gold-accent/35 bg-gold-accent/10 text-[10px] font-bold uppercase tracking-widest text-gold-accent mb-4">
              {categoryLabel}
            </span>
          )}

          <h1 className="font-serif-alt text-3xl sm:text-4xl lg:text-5xl font-bold text-on-surface leading-tight tracking-tight">
            {story.title}
          </h1>
          {excerpt && (
            <p className="mt-4 text-base sm:text-lg italic text-on-surface-variant leading-relaxed max-w-3xl">
              {excerpt}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-outline-variant/15">
            <div className="flex items-center gap-3">
              {authorAvatar ? (
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-12 h-12 rounded-full object-cover border border-outline-variant/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/40 to-secondary/35 flex items-center justify-center text-white font-bold">
                  {authorName?.[0]?.toUpperCase() || 'M'}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-on-surface">{authorName}</p>
                <p className="text-xs text-outline">Mentor storyteller</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full border border-outline-variant/20 bg-surface-container-low text-on-surface-variant">
                {publishedDate}
              </span>
              <span className="px-3 py-1 rounded-full border border-outline-variant/20 bg-surface-container-low text-on-surface-variant">
                {story.readingTime || 1} min read
              </span>
              <span className="px-3 py-1 rounded-full border border-outline-variant/20 bg-surface-container-low text-on-surface-variant">
                {story.views || 0} views
              </span>
            </div>
          </div>

          {isOwner && (
            <div className="mt-5 flex items-center gap-2">
              <Link to={`/stories/${id}/edit`} className="inline-flex items-center px-4 py-2 rounded-lg border border-outline-variant/30 text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-colors">
                Edit story
              </Link>
              <button onClick={handleDelete} className="inline-flex items-center px-4 py-2 rounded-lg border border-red-500/25 bg-red-500/[0.08] text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-300 hover:bg-red-500/[0.14] transition-colors">
                Delete
              </button>
            </div>
          )}

          <div
            className="mt-8 prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-on-surface leading-relaxed text-base story-body-html"
            dangerouslySetInnerHTML={{ __html: story.content || '' }}
          />

          {story.tags?.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {story.tags.map((t) => (
                <span key={t} className="inline-flex px-3 py-1 rounded-full border border-outline-variant/20 bg-surface-container-low text-xs text-on-surface-variant">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between flex-wrap gap-3 py-4 border-y border-outline-variant/15">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                liked
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800/40'
                  : 'border border-outline-variant/30 text-on-surface-variant hover:border-red-200 hover:text-red-500'
              }`}
            >
              <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.5}>
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              {likeCount} {likeCount === 1 ? 'like' : 'likes'}
            </button>
            <span className="text-sm text-on-surface-variant">{comments.length} comments</span>
          </div>
        </div>
      </article>

      <section className="mt-10">
        <h2 className="font-serif-alt text-2xl font-bold text-on-surface mb-5">
          Comments ({comments.length})
        </h2>

        {isAuthenticated && (
          <form onSubmit={handleComment} className="mb-6 flex gap-3">
            {currentUserAvatar ? (
              <img
                src={currentUserAvatar}
                alt={user?.name || 'You'}
                className="w-10 h-10 rounded-full object-cover border border-outline-variant/20 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="input flex-1"
                placeholder="Add a thoughtful comment…"
              />
              <button type="submit" className="btn-primary px-5">Post</button>
            </div>
          </form>
        )}

        {comments.length === 0 ? (
          <p className="text-on-surface-variant text-sm">No comments yet. Be the first!</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c._id} className="flex gap-3">
                {c.user?.profilePicture || c.user?.avatar ? (
                  <img
                    src={c.user?.profilePicture || c.user?.avatar}
                    alt={c.user?.name || 'User'}
                    className="w-9 h-9 rounded-full object-cover border border-outline-variant/20 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {c.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="bg-white dark:bg-surface-container border border-outline-variant/15 rounded-xl px-4 py-3 flex-1">
                  <p className="font-medium text-sm text-on-surface">{c.user?.name || 'User'}</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">{c.content}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
