import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

const CATEGORIES = ['webinar', 'workshop', 'networking', 'conference', 'panel-discussion'];
const TYPES      = ['virtual', 'physical', 'hybrid'];

function fmtLabel(val) {
  return val.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const EMPTY_FORM = {
  title: '', description: '', category: 'webinar', type: 'virtual',
  date: '', startTime: '', endTime: '', duration: '', timezone: 'UTC',
  capacity: '', status: 'upcoming', tags: '',
  location: { virtualLink: '', venue: '', address: '', city: '', country: '' },
};

const lbl = 'block text-[10px] font-bold text-slate-500 dark:text-on-surface-variant uppercase tracking-widest mb-1.5';
const inp = 'w-full border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-accent/30 focus:border-gold-accent/50 transition-all';

export default function CreateEventPage() {
  const navigate    = useNavigate();
  const { id }      = useParams();   // present on edit route /events/:id/edit
  const isEdit      = Boolean(id);

  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);  // load existing event if editing
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  /* Load existing event for edit mode */
  useEffect(() => {
    if (!isEdit) return;
    eventApi.getById(id)
      .then((res) => {
        const e = res.data?.data?.event || res.data;
        const d = e.date ? new Date(e.date).toISOString().split('T')[0] : '';
        setForm({
          title:       e.title       || '',
          description: e.description || '',
          category:    e.category    || 'webinar',
          type:        e.type        || 'virtual',
          date:        d,
          startTime:   e.startTime   || '',
          endTime:     e.endTime     || '',
          duration:    String(e.duration || ''),
          timezone:    e.timezone    || 'UTC',
          capacity:    String(e.capacity || ''),
          status:      e.status      || 'upcoming',
          tags:        (e.tags || []).join(', '),
          location: {
            virtualLink: e.location?.virtualLink || '',
            venue:       e.location?.venue       || '',
            address:     e.location?.address     || '',
            city:        e.location?.city        || '',
            country:     e.location?.country     || '',
          },
        });
      })
      .catch(() => { toast.error('Failed to load event'); navigate('/events'); })
      .finally(() => setLoading(false));
  }, [id]);

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
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
        capacity: Number(form.capacity),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      if (isEdit) {
        await eventApi.update(id, payload);
        toast.success('Event updated!');
        navigate(`/events/${id}`);
      } else {
        const res = await eventApi.create(payload);
        toast.success('Event created!');
        const newId = res.data?.data?.event?._id || res.data?._id;
        navigate(newId ? `/events/${newId}` : '/events');
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} event.`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface">

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-28 pb-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Link to="/events" className="hover:text-white transition-colors">Events</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-slate-300">{isEdit ? 'Edit Event' : 'Create Event'}</span>
          </nav>
          <h1 className="font-serif-alt text-3xl sm:text-4xl font-bold text-white">
            {isEdit ? 'Edit Event' : 'Create an Event'}
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            {isEdit ? 'Update the details of your event.' : 'Organise a webinar, workshop, or networking session for women leaders.'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-6 pb-16">
        <div className="bg-white dark:bg-surface-container-lowest rounded-2xl border border-slate-100 dark:border-outline-variant/20 shadow-md overflow-hidden">

          {error && (
            <div className="px-6 pt-5">
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 text-red-700 dark:text-red-400 text-sm">
                <span className="material-symbols-outlined text-[16px] mt-0.5">error</span>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* Basic Info */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gold-accent mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={lbl}>Title *</label>
                  <input name="title" value={form.title} onChange={handleChange}
                    className={inp} placeholder="e.g. Women in Tech Leadership Panel" required />
                </div>
                <div>
                  <label className={lbl}>Description *</label>
                  <textarea name="description" value={form.description} onChange={handleChange}
                    className={`${inp} h-28 resize-y`} placeholder="Describe what attendees will gain…" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Category</label>
                    <select name="category" value={form.category} onChange={handleChange} className={inp}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{fmtLabel(c)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Type</label>
                    <select name="type" value={form.type} onChange={handleChange} className={inp}>
                      {TYPES.map((t) => <option key={t} value={t}>{fmtLabel(t)}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100 dark:border-outline-variant/20" />

            {/* Schedule */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gold-accent mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                Schedule
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Date *</label>
                    <input type="date" name="date" value={form.date} onChange={handleChange} className={inp} required />
                  </div>
                  <div>
                    <label className={lbl}>Timezone</label>
                    <input name="timezone" value={form.timezone} onChange={handleChange} className={inp} placeholder="UTC" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={lbl}>Start Time *</label>
                    <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className={inp} required />
                  </div>
                  <div>
                    <label className={lbl}>End Time</label>
                    <input type="time" name="endTime" value={form.endTime} onChange={handleChange} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Duration (min) *</label>
                    <input type="number" name="duration" value={form.duration} onChange={handleChange}
                      className={inp} placeholder="90" min="1" required />
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100 dark:border-outline-variant/20" />

            {/* Location */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gold-accent mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                Location
              </h2>
              <div className="space-y-4">
                {(form.type === 'virtual' || form.type === 'hybrid') && (
                  <div>
                    <label className={lbl}>Virtual Link</label>
                    <input name="location.virtualLink" value={form.location.virtualLink} onChange={handleChange}
                      className={inp} placeholder="https://meet.example.com/…" type="url" />
                  </div>
                )}
                {(form.type === 'physical' || form.type === 'hybrid') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Venue</label>
                      <input name="location.venue" value={form.location.venue} onChange={handleChange}
                        className={inp} placeholder="Venue name" />
                    </div>
                    <div>
                      <label className={lbl}>City</label>
                      <input name="location.city" value={form.location.city} onChange={handleChange}
                        className={inp} placeholder="City" />
                    </div>
                    <div>
                      <label className={lbl}>Address</label>
                      <input name="location.address" value={form.location.address} onChange={handleChange}
                        className={inp} placeholder="Street address" />
                    </div>
                    <div>
                      <label className={lbl}>Country</label>
                      <input name="location.country" value={form.location.country} onChange={handleChange}
                        className={inp} placeholder="Country" />
                    </div>
                  </div>
                )}
                {form.type === 'virtual' && !form.location.virtualLink && (
                  <p className="text-xs text-slate-400 dark:text-on-surface-variant">Add a virtual meeting link for attendees.</p>
                )}
              </div>
            </section>

            <hr className="border-slate-100 dark:border-outline-variant/20" />

            {/* Settings */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gold-accent mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                Settings
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Capacity *</label>
                  <input type="number" name="capacity" value={form.capacity} onChange={handleChange}
                    className={inp} placeholder="100" min="1" required />
                </div>
                <div>
                  <label className={lbl}>Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className={inp}>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    {isEdit && <option value="completed">Completed</option>}
                    {isEdit && <option value="cancelled">Cancelled</option>}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={lbl}>Tags (comma-separated)</label>
                  <input name="tags" value={form.tags} onChange={handleChange}
                    className={inp} placeholder="leadership, networking, women" />
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-outline-variant/20">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-gold-accent hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md shadow-gold-accent/20"
              >
                {saving ? (
                  <><Spinner size="sm" /> {isEdit ? 'Saving…' : 'Creating…'}</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">{isEdit ? 'save' : 'add_circle'}</span>
                  {isEdit ? 'Save Changes' : 'Create Event'}</>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(isEdit ? `/events/${id}` : '/events')}
                className="px-6 py-3 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant hover:border-slate-300 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
