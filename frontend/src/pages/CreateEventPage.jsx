import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

const CATEGORIES = ['webinar', 'workshop', 'networking', 'conference', 'panel-discussion'];
const TYPES      = ['virtual', 'physical', 'hybrid'];

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: 'webinar', type: 'virtual',
    date: '', startTime: '', endTime: '', duration: '', timezone: 'UTC',
    capacity: '', status: 'upcoming', tags: '',
    location: { virtualLink: '', venue: '', address: '', city: '', country: '' },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) => {
    setError('');
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setForm((f) => ({ ...f, location: { ...f.location, [field]: value } }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.date || !form.startTime || !form.duration || !form.capacity) {
      setError('Please fill in all required fields.'); return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
        capacity: Number(form.capacity),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      const res = await eventApi.create(payload);
      toast.success('Event created!');
      navigate(`/events/${res.data?.data?.event?._id || res.data?._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Create an Event</h1>
      <p className="text-gray-500 mb-8">Organise a webinar, workshop or networking session.</p>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
          <input name="title" value={form.title} onChange={handleChange}
            className="input" placeholder="e.g. Women in Tech Leadership Panel" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            className="input h-28 resize-y" placeholder="Describe the event…" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select name="category" value={form.category} onChange={handleChange} className="input">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="input">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
            <input name="timezone" value={form.timezone} onChange={handleChange} className="input" placeholder="UTC" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start time *</label>
            <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End time</label>
            <input type="time" name="endTime" value={form.endTime} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (min) *</label>
            <input type="number" name="duration" value={form.duration} onChange={handleChange}
              className="input" placeholder="90" min="1" required />
          </div>
        </div>

        {/* Location */}
        {(form.type === 'virtual' || form.type === 'hybrid') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Virtual link</label>
            <input name="location.virtualLink" value={form.location.virtualLink} onChange={handleChange}
              className="input" placeholder="https://meet.example.com/..." />
          </div>
        )}
        {(form.type === 'physical' || form.type === 'hybrid') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Venue</label>
              <input name="location.venue" value={form.location.venue} onChange={handleChange}
                className="input" placeholder="Venue name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input name="location.city" value={form.location.city} onChange={handleChange}
                className="input" placeholder="City" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacity *</label>
            <input type="number" name="capacity" value={form.capacity} onChange={handleChange}
              className="input" placeholder="100" min="1" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="input">
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma-separated)</label>
          <input name="tags" value={form.tags} onChange={handleChange}
            className="input" placeholder="leadership, networking" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1 py-3" disabled={loading}>
            {loading ? <Spinner size="sm" className="mx-auto" /> : 'Create event'}
          </button>
          <button type="button" onClick={() => navigate('/events')} className="btn-secondary px-6 py-3">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
