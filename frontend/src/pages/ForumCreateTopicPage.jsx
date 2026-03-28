import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { forumApi } from '../api/forumApi';
import Spinner from '../components/common/Spinner';

const CATEGORIES = [
  { value: 'general',         label: 'General'         },
  { value: 'career-advice',   label: 'Career Advice'   },
  { value: 'leadership-tips', label: 'Leadership Tips' },
  { value: 'networking',      label: 'Networking'      },
  { value: 'work-life',       label: 'Work & Life'     },
  { value: 'success-stories', label: 'Success Stories' },
];

export default function ForumCreateTopicPage() {
  const { id } = useParams(); // present when editing
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
  });
  const [loading, setLoading]   = useState(isEdit);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!isEdit) return;
    forumApi.getTopicById(id)
      .then((res) => {
        const t = res.data;
        setForm({
          title: t.title || '',
          content: t.content || '',
          category: t.category || 'general',
          tags: (t.tags || []).join(', '),
        });
      })
      .catch(() => {
        toast.error('Failed to load topic.');
        navigate('/forum');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.');
      return;
    }
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10),
    };
    setSaving(true);
    try {
      if (isEdit) {
        await forumApi.updateTopic(id, payload);
        toast.success('Topic updated.');
        navigate(`/forum/${id}`);
      } else {
        const res = await forumApi.createTopic(payload);
        toast.success('Discussion started!');
        navigate(`/forum/${res.data._id}`);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save topic.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-on-surface-variant mb-4">You must be logged in to post.</p>
          <Link to="/login" className="btn-primary">Log in</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-outline mb-6">
          <Link to="/forum" className="hover:text-gold-accent transition-colors">Forum</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface">{isEdit ? 'Edit Topic' : 'New Discussion'}</span>
        </nav>

        <div className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/30 rounded-xl p-8">
          <h1 className="font-serif-alt text-2xl font-bold text-on-surface mb-6">
            {isEdit ? 'Edit Discussion' : 'Start a Discussion'}
          </h1>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 dark:bg-error-container/30 border border-red-200 dark:border-error/30 text-red-700 dark:text-on-error-container text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                maxLength={200}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="What do you want to discuss?"
                className="w-full border border-outline-variant/30 rounded-lg px-4 py-3 text-sm text-on-surface bg-white dark:bg-surface focus:outline-none focus:ring-2 focus:ring-gold-accent/40 focus:border-gold-accent transition-all placeholder:text-outline/60"
              />
              <p className="text-xs text-outline mt-1 text-right">{form.title.length}/200</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full border border-outline-variant/30 rounded-lg px-4 py-3 text-sm text-on-surface bg-white dark:bg-surface focus:outline-none focus:ring-2 focus:ring-gold-accent/40 transition-all"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={10}
                placeholder="Share your question, insight, or story in detail…"
                className="w-full border border-outline-variant/30 rounded-lg px-4 py-3 text-sm text-on-surface bg-white dark:bg-surface resize-y focus:outline-none focus:ring-2 focus:ring-gold-accent/40 focus:border-gold-accent transition-all placeholder:text-outline/60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="leadership, career, networking (comma-separated, max 10)"
                className="w-full border border-outline-variant/30 rounded-lg px-4 py-3 text-sm text-on-surface bg-white dark:bg-surface focus:outline-none focus:ring-2 focus:ring-gold-accent/40 transition-all placeholder:text-outline/60"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || !form.title.trim() || !form.content.trim()}
                className="flex items-center gap-2 bg-gold-accent hover:bg-gold-accent/90 text-white font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    {isEdit ? 'Saving…' : 'Posting…'}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">{isEdit ? 'save' : 'send'}</span>
                    {isEdit ? 'Save Changes' : 'Post Discussion'}
                  </>
                )}
              </button>
              <Link
                to={isEdit ? `/forum/${id}` : '/forum'}
                className="flex items-center gap-2 px-6 py-3 rounded-lg border border-outline-variant/30 text-outline hover:text-on-surface hover:border-outline/50 transition-all text-sm font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
