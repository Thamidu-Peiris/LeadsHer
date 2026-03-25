import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storyApi } from '../api/storyApi';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

const CATEGORIES = ['leadership', 'entrepreneurship', 'STEM', 'corporate', 'social-impact', 'career-growth'];

export default function CreateStoryPage({ cancelTo = '/stories' }) {
  const navigate  = useNavigate();
  const [form, setForm] = useState({
    title: '', content: '', excerpt: '', category: 'leadership', tags: '', status: 'draft',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;

  const handleChange = (e) => {
    setError('');
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) { setError('Title and content are required.'); return; }
    if (form.status === 'published' && wordCount < 100) {
      setError('Published stories must have at least 100 words.'); return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      const res = await storyApi.create(payload);
      toast.success('Story created!');
      navigate(`/stories/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create story.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Share your story</h1>
      <p className="text-gray-500 mb-8">Inspire others with your leadership journey.</p>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
          <input name="title" value={form.title} onChange={handleChange}
            className="input" placeholder="e.g. How I became a CTO at 30" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select name="category" value={form.category} onChange={handleChange} className="input">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="input">
              <option value="draft">Save as draft</option>
              <option value="published">Publish now</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma-separated, max 5)</label>
          <input name="tags" value={form.tags} onChange={handleChange}
            className="input" placeholder="leadership, women, STEM" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Excerpt (optional, max 300 chars)</label>
          <input name="excerpt" value={form.excerpt} onChange={handleChange}
            className="input" placeholder="A short summary of your story…" maxLength={300} />
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Content *</label>
            <span className={`text-xs ${wordCount >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
              {wordCount} words {form.status === 'published' && '(100+ required to publish)'}
            </span>
          </div>
          <textarea
            name="content" value={form.content} onChange={handleChange}
            className="input h-64 resize-y leading-relaxed"
            placeholder="Write your story here…"
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1 py-3" disabled={loading}>
            {loading ? <Spinner size="sm" className="mx-auto" /> : (form.status === 'published' ? 'Publish story' : 'Save draft')}
          </button>
          <button type="button" onClick={() => navigate(cancelTo)} className="btn-secondary px-6 py-3">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
