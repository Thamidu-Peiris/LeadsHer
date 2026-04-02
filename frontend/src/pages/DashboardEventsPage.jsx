import { useEffect, useState, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventApi } from '../api/eventApi';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const STATUS_STYLE = {
  upcoming:  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  ongoing:   { bg: 'bg-amber-100 dark:bg-amber-900/30',    text: 'text-amber-700 dark:text-amber-300',    dot: 'bg-amber-500'   },
  completed: { bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-500 dark:text-slate-400',    dot: 'bg-slate-400'   },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30',        text: 'text-red-600 dark:text-red-400',        dot: 'bg-red-500'     },
};

const CAT_STYLE = {
  webinar:            'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  workshop:           'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  networking:         'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  conference:         'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  'panel-discussion': 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
};

const CARD = 'bg-white dark:bg-surface-container-lowest rounded-2xl border border-slate-100 dark:border-outline-variant/20 shadow-sm';

function label(val) {
  return (val || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Stat Card ───────────────────────────────────────────────────────────── */

function StatCard({ icon, title, value, accent = 'text-gold-accent' }) {
  return (
    <div className={`${CARD} p-5 flex items-center gap-4`}>
      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-surface-container flex items-center justify-center shrink-0">
        <span className={`material-symbols-outlined text-[22px] ${accent}`}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-on-surface leading-tight">{value}</p>
        <p className="text-[10px] text-slate-400 dark:text-on-surface-variant uppercase tracking-widest font-semibold mt-0.5">{title}</p>
      </div>
    </div>
  );
}

/* ── Tab Bar ─────────────────────────────────────────────────────────────── */

function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-surface-container rounded-xl w-fit flex-wrap">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            active === t.key
              ? 'bg-white dark:bg-surface-container-lowest text-on-surface shadow-sm'
              : 'text-slate-400 dark:text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">{t.icon}</span>
          {t.label}
          {t.count !== undefined && (
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
              active === t.key
                ? 'bg-gold-accent/15 text-gold-accent'
                : 'bg-slate-200 dark:bg-surface-container-high text-slate-500 dark:text-on-surface-variant'
            }`}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Event Row ───────────────────────────────────────────────────────────── */

function EventRow({ event, actions }) {
  const st = STATUS_STYLE[event.status] || STATUS_STYLE.upcoming;
  const registered = event.registeredAttendees?.length || 0;
  const d = new Date(event.date);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-outline-variant/20 bg-white dark:bg-surface-container-lowest hover:border-gold-accent/30 transition-all">
      {/* Date block */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gold-accent/10 dark:bg-gold-accent/5 shrink-0">
          <span className="text-xl font-bold text-gold-accent leading-none">
            {d.toLocaleDateString('en-US', { day: '2-digit' })}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-gold-accent/70">
            {d.toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="text-[9px] text-slate-400 dark:text-on-surface-variant">
            {d.getFullYear()}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${st.bg} ${st.text}`}>
              <span className={`w-1 h-1 rounded-full ${st.dot}`} />
              {event.status}
            </span>
            {event.category && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${CAT_STYLE[event.category] || 'bg-slate-100 text-slate-600'}`}>
                {label(event.category)}
              </span>
            )}
          </div>
          <h4 className="font-semibold text-on-surface text-sm leading-snug truncate">{event.title}</h4>
          <p className="text-[11px] text-slate-400 dark:text-on-surface-variant mt-0.5 flex items-center gap-2 flex-wrap">
            {event.startTime && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">schedule</span>{event.startTime}</span>}
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">{event.type === 'virtual' ? 'videocam' : 'location_on'}</span>{label(event.type)}</span>
            {event.capacity && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">group</span>{registered}/{event.capacity}</span>}
          </p>
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 ml-1">
          {actions}
        </div>
      )}
    </div>
  );
}

/* ── Section Card ────────────────────────────────────────────────────────── */

function SectionCard({ icon, title, action, children }) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-outline-variant/20 flex items-center justify-between">
        <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
          <span className={`material-symbols-outlined text-gold-accent text-[18px]`}>{icon}</span>
          {title}
        </h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function EmptyState({ icon, message, sub, cta }) {
  return (
    <div className="text-center py-12">
      <span className="material-symbols-outlined text-[44px] text-slate-200 dark:text-outline mb-3 block">{icon}</span>
      <p className="text-sm font-medium text-slate-500 dark:text-on-surface-variant mb-1">{message}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-outline mb-5">{sub}</p>}
      {cta}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODALS
═══════════════════════════════════════════════════════════════════════════ */

/* ── Feedback Modal ──────────────────────────────────────────────────────── */

function FeedbackModal({ event, onClose, onSave }) {
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async () => {
    if (!rating) { toast.error('Please select a rating'); return; }
    setSaving(true);
    try {
      await eventApi.submitFeedback(event._id, { rating, comment });
      toast.success('Feedback submitted — thank you!');
      onSave?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className={`${CARD} w-full max-w-md`}>
        <div className="px-6 py-5 border-b border-slate-100 dark:border-outline-variant/20 flex items-center justify-between">
          <div>
            <h3 className="font-serif-alt text-lg font-bold text-on-surface">Event Feedback</h3>
            <p className="text-xs text-slate-400 dark:text-on-surface-variant mt-0.5 truncate max-w-xs">{event.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-on-surface-variant uppercase tracking-widest mb-3">Your Rating *</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(s)}
                  className="hover:scale-110 transition-transform"
                >
                  <span
                    className={`material-symbols-outlined text-[34px] transition-colors ${s <= (hovered || rating) ? 'text-gold-accent' : 'text-slate-200 dark:text-outline-variant/40'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >star</span>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-gold-accent font-semibold mt-2">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
              </p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-on-surface-variant uppercase tracking-widest mb-2">Comment (optional)</p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Share your experience with this event…"
              className="w-full border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-accent/30 focus:border-gold-accent/50 transition-all resize-none"
            />
            <p className="text-[10px] text-slate-300 dark:text-outline text-right mt-1">{comment.length}/500</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-outline-variant/20 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving || !rating}
            className="flex-1 py-2.5 bg-gold-accent hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all"
          >
            {saving ? 'Submitting…' : 'Submit Feedback'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-slate-300 rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Attendees Modal ─────────────────────────────────────────────────────── */

function AttendeesModal({ event, onClose }) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    eventApi.getAttendees(event._id)
      .then(res => setAttendees(res.data?.data?.attendees || []))
      .catch(() => toast.error('Failed to load attendees'))
      .finally(() => setLoading(false));
  }, [event._id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className={`${CARD} w-full max-w-lg max-h-[80vh] flex flex-col`}>
        <div className="px-6 py-5 border-b border-slate-100 dark:border-outline-variant/20 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-serif-alt text-lg font-bold text-on-surface">Attendees</h3>
            <p className="text-xs text-slate-400 dark:text-on-surface-variant mt-0.5 truncate max-w-xs">{event.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4" style={{ scrollbarWidth: 'thin' }}>
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : attendees.length === 0 ? (
            <EmptyState icon="group_off" message="No attendees yet" sub="No one has registered for this event yet." />
          ) : (
            <div className="space-y-2">
              {attendees.map(a => {
                const u = a.user || {};
                const st = STATUS_STYLE[a.status] || STATUS_STYLE.upcoming;
                return (
                  <div key={a._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-surface-container border border-slate-100 dark:border-outline-variant/20">
                    <div className="w-9 h-9 rounded-full bg-gold-accent/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {u.profilePicture
                        ? <img src={u.profilePicture} alt={u.name} className="w-full h-full object-cover" />
                        : <span className="material-symbols-outlined text-gold-accent text-[18px]">person</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{u.name || 'Unknown'}</p>
                      <p className="text-[11px] text-slate-400 dark:text-on-surface-variant truncate">{u.email || ''}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${st.bg} ${st.text}`}>
                      {a.status}
                    </span>
                    {a.feedback?.rating && (
                      <span className="flex items-center gap-0.5 text-xs text-gold-accent font-bold ml-1">
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        {a.feedback.rating}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 dark:border-outline-variant/20 shrink-0 flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-on-surface-variant">{attendees.length} attendee{attendees.length !== 1 ? 's' : ''}</p>
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-slate-300 rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Reschedule Modal ────────────────────────────────────────────────────── */

function RescheduleModal({ event, onClose, onSave }) {
  const [form, setForm] = useState({
    date:      event.date ? new Date(event.date).toISOString().split('T')[0] : '',
    startTime: event.startTime || '',
    endTime:   event.endTime   || '',
    timezone:  event.timezone  || 'UTC',
  });
  const [saving, setSaving] = useState(false);

  const inp = 'w-full border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-gold-accent/30 focus:border-gold-accent/50 transition-all';
  const lbl = 'block text-[10px] font-bold text-slate-400 dark:text-on-surface-variant uppercase tracking-widest mb-1.5';

  const handleSubmit = async () => {
    if (!form.date || !form.startTime) { toast.error('Date and start time are required'); return; }
    setSaving(true);
    try {
      await eventApi.rescheduleEvent(event._id, form);
      toast.success('Event rescheduled successfully!');
      onSave?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reschedule');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className={`${CARD} w-full max-w-md`}>
        <div className="px-6 py-5 border-b border-slate-100 dark:border-outline-variant/20 flex items-center justify-between">
          <div>
            <h3 className="font-serif-alt text-lg font-bold text-on-surface">Reschedule Event</h3>
            <p className="text-xs text-slate-400 dark:text-on-surface-variant mt-0.5 truncate max-w-xs">{event.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={lbl}>New Date *</label>
            <input type="date" className={inp} value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Start Time *</label>
              <input type="time" className={inp} value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>End Time</label>
              <input type="time" className={inp} value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={lbl}>Timezone</label>
            <input type="text" className={inp} value={form.timezone} placeholder="UTC"
              onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-outline-variant/20 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gold-accent hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">schedule_send</span>
            {saving ? 'Saving…' : 'Reschedule Event'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-slate-300 rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Certificates Modal ──────────────────────────────────────────────────── */

function CertificatesModal({ event, onClose }) {
  const [certs, setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    eventApi.getEventCertificates(event._id)
      .then(res => setCerts(res.data?.data?.certificates || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [event._id]);

  useEffect(() => { load(); }, [load]);

  const handleIssue = async () => {
    setIssuing(true);
    try {
      const res = await eventApi.issueCertificates(event._id);
      toast.success(`${res.data?.results || 0} certificate(s) issued!`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue certificates');
    } finally { setIssuing(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className={`${CARD} w-full max-w-lg max-h-[80vh] flex flex-col`}>
        <div className="px-6 py-5 border-b border-slate-100 dark:border-outline-variant/20 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-serif-alt text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-gold-accent text-[20px]">workspace_premium</span>
              Certificates
            </h3>
            <p className="text-xs text-slate-400 dark:text-on-surface-variant mt-0.5 truncate max-w-xs">{event.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4" style={{ scrollbarWidth: 'thin' }}>
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : certs.length === 0 ? (
            <EmptyState
              icon="workspace_premium"
              message="No certificates issued yet"
              sub="Click 'Issue Certificates' to generate certificates for all registered attendees."
            />
          ) : (
            <div className="space-y-2">
              {certs.map(c => (
                <div key={c._id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                  <span className="material-symbols-outlined text-gold-accent text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{c.user?.name || 'Unknown'}</p>
                    <p className="text-[10px] font-mono text-slate-400 dark:text-on-surface-variant tracking-wider">{c.certificateCode}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-outline shrink-0">
                    {new Date(c.issuedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-outline-variant/20 flex gap-3 shrink-0">
          <button
            onClick={handleIssue}
            disabled={issuing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gold-accent hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
            {issuing ? 'Issuing…' : 'Issue Certificates'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-slate-300 rounded-xl transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROLE VIEWS
═══════════════════════════════════════════════════════════════════════════ */

/* ── MENTEE VIEW ─────────────────────────────────────────────────────────── */

function MenteeView() {
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [feedbackTarget, setFeedbackTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    eventApi.getMyEvents()
      .then(res => {
        const d = res.data?.data || res.data;
        setEvents(d?.events || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUnregister = async (ev) => {
    if (!window.confirm('Unregister from this event?')) return;
    try {
      await eventApi.unregister(ev._id);
      toast.success('Unregistered successfully');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot unregister at this time');
    }
  };

  const upcoming = events.filter(e => e.status === 'upcoming' || e.status === 'ongoing');
  const past     = events.filter(e => e.status === 'completed' || e.status === 'cancelled');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon="event" title="Registered" value={events.length} />
        <StatCard icon="upcoming" title="Upcoming" value={upcoming.length} accent="text-emerald-500" />
        <StatCard icon="history" title="Past Events" value={past.length} accent="text-slate-400" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : events.length === 0 ? (
        <div className={`${CARD} p-10`}>
          <EmptyState
            icon="event_busy"
            message="No registered events"
            sub="Browse upcoming events and register to get started."
            cta={
              <Link to="/events" className="inline-flex items-center gap-2 bg-gold-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all">
                <span className="material-symbols-outlined text-[16px]">search</span>
                Browse Events
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <SectionCard icon="upcoming" title="Upcoming & Ongoing">
              <div className="space-y-3">
                {upcoming.map(e => (
                  <EventRow key={e._id} event={e} actions={
                    <>
                      <Link to={`/events/${e._id}`}
                        className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant hover:border-gold-accent/40 hover:text-gold-accent rounded-lg transition-colors">
                        View
                      </Link>
                      {e.status === 'upcoming' && (
                        <button onClick={() => handleUnregister(e)}
                          className="px-3 py-1.5 text-xs font-bold border border-red-200 dark:border-red-800/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          Unregister
                        </button>
                      )}
                    </>
                  } />
                ))}
              </div>
            </SectionCard>
          )}

          {past.length > 0 && (
            <SectionCard icon="history" title="Past Events">
              <div className="space-y-3">
                {past.map(e => (
                  <EventRow key={e._id} event={e} actions={
                    <>
                      <Link to={`/events/${e._id}`}
                        className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant hover:border-gold-accent/40 hover:text-gold-accent rounded-lg transition-colors">
                        View
                      </Link>
                      {e.status === 'completed' && (
                        <button onClick={() => setFeedbackTarget(e)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-gold-accent/10 border border-gold-accent/20 text-gold-accent hover:bg-gold-accent hover:text-white rounded-lg transition-all">
                          <span className="material-symbols-outlined text-[12px]">star</span>
                          Feedback
                        </button>
                      )}
                    </>
                  } />
                ))}
              </div>
            </SectionCard>
          )}
        </>
      )}

      {feedbackTarget && (
        <FeedbackModal event={feedbackTarget} onClose={() => setFeedbackTarget(null)} onSave={load} />
      )}
    </div>
  );
}

/* ── MENTOR VIEW ─────────────────────────────────────────────────────────── */

function MentorView() {
  const [tab, setTab]               = useState('created');
  const [created, setCreated]       = useState([]);
  const [registered, setRegistered] = useState([]);
  const [loadC, setLoadC]           = useState(true);
  const [loadR, setLoadR]           = useState(true);
  const [attendeesTarget, setAttendeesTarget] = useState(null);
  const [feedbackTarget, setFeedbackTarget]   = useState(null);

  const fetchCreated = useCallback(() => {
    setLoadC(true);
    eventApi.getMyCreatedEvents()
      .then(res => { const d = res.data?.data || res.data; setCreated(d?.events || []); })
      .catch(() => {})
      .finally(() => setLoadC(false));
  }, []);

  const fetchRegistered = useCallback(() => {
    setLoadR(true);
    eventApi.getMyEvents()
      .then(res => { const d = res.data?.data || res.data; setRegistered(d?.events || []); })
      .catch(() => {})
      .finally(() => setLoadR(false));
  }, []);

  useEffect(() => { fetchCreated(); fetchRegistered(); }, []);

  const handleDelete = async (ev) => {
    if (!window.confirm(`Delete "${ev.title}"? This cannot be undone.`)) return;
    try {
      await eventApi.delete(ev._id);
      toast.success('Event deleted');
      fetchCreated();
    } catch { toast.error('Failed to delete event'); }
  };

  const handleCancel = async (ev) => {
    if (!window.confirm(`Cancel "${ev.title}"?`)) return;
    try {
      await eventApi.cancelEvent(ev._id);
      toast.success('Event cancelled');
      fetchCreated();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
  };

  const handleUnregister = async (ev) => {
    if (!window.confirm('Unregister from this event?')) return;
    try {
      await eventApi.unregister(ev._id);
      toast.success('Unregistered');
      fetchRegistered();
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot unregister at this time'); }
  };

  const tabs = [
    { key: 'created',    label: 'My Events',   icon: 'event',      count: created.length    },
    { key: 'registered', label: 'Registered',  icon: 'how_to_reg', count: registered.length },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="event"    title="Created"   value={created.length} />
        <StatCard icon="upcoming" title="Upcoming"  value={created.filter(e => e.status === 'upcoming').length} accent="text-emerald-500" />
        <StatCard icon="group"    title="Total Attendees" value={created.reduce((a, e) => a + (e.registeredAttendees?.length || 0), 0)} accent="text-blue-500" />
        <StatCard icon="how_to_reg" title="Registered" value={registered.length} accent="text-purple-500" />
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* Created events */}
      {tab === 'created' && (
        <SectionCard
          icon="event"
          title="Events You Created"
          action={
            <Link to="/events/new"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-accent hover:opacity-90 text-white text-xs font-bold rounded-lg transition-all">
              <span className="material-symbols-outlined text-[14px]">add</span>
              New Event
            </Link>
          }
        >
          {loadC ? <div className="flex justify-center py-10"><Spinner /></div>
          : created.length === 0 ? (
            <EmptyState
              icon="add_circle"
              message="No events created yet"
              sub="Create your first event to host webinars, workshops, or networking sessions."
              cta={
                <Link to="/events/new"
                  className="inline-flex items-center gap-2 bg-gold-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Create Event
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {created.map(e => (
                <EventRow key={e._id} event={e} actions={
                  <>
                    <button onClick={() => setAttendeesTarget(e)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-gold-accent/40 hover:text-gold-accent rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[13px]">group</span>
                      Attendees
                    </button>
                    <Link to={`/events/${e._id}/edit`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-gold-accent/40 hover:text-gold-accent rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                      Edit
                    </Link>
                    {e.status !== 'cancelled' && (
                      <button onClick={() => handleCancel(e)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-orange-200 dark:border-orange-800/40 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[13px]">event_busy</span>
                        Cancel
                      </button>
                    )}
                    <button onClick={() => handleDelete(e)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-red-200 dark:border-red-800/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[13px]">delete</span>
                      Delete
                    </button>
                  </>
                } />
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Registered events */}
      {tab === 'registered' && (
        <SectionCard icon="how_to_reg" title="Events You've Registered For">
          {loadR ? <div className="flex justify-center py-10"><Spinner /></div>
          : registered.length === 0 ? (
            <EmptyState
              icon="event_busy"
              message="No registered events"
              sub="Browse all events to find sessions you'd like to attend."
              cta={<Link to="/events" className="inline-flex items-center gap-2 bg-gold-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all">Browse Events</Link>}
            />
          ) : (
            <div className="space-y-3">
              {registered.map(e => (
                <EventRow key={e._id} event={e} actions={
                  <>
                    <Link to={`/events/${e._id}`}
                      className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-gold-accent/40 hover:text-gold-accent rounded-lg transition-colors">
                      View
                    </Link>
                    {e.status === 'upcoming' && (
                      <button onClick={() => handleUnregister(e)}
                        className="px-3 py-1.5 text-xs font-bold border border-red-200 dark:border-red-800/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        Unregister
                      </button>
                    )}
                    {e.status === 'completed' && (
                      <button onClick={() => setFeedbackTarget(e)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-gold-accent/10 border border-gold-accent/20 text-gold-accent hover:bg-gold-accent hover:text-white rounded-lg transition-all">
                        <span className="material-symbols-outlined text-[12px]">star</span>
                        Feedback
                      </button>
                    )}
                  </>
                } />
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {attendeesTarget && <AttendeesModal event={attendeesTarget} onClose={() => setAttendeesTarget(null)} />}
      {feedbackTarget  && <FeedbackModal  event={feedbackTarget}  onClose={() => setFeedbackTarget(null)}  onSave={fetchRegistered} />}
    </div>
  );
}

/* ── ADMIN VIEW ──────────────────────────────────────────────────────────── */

function AdminView() {
  const [tab, setTab]           = useState('all');
  const [allEvents, setAll]     = useState([]);
  const [created, setCreated]   = useState([]);
  const [loadAll, setLoadAll]   = useState(true);
  const [loadC, setLoadC]       = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [attendeesTarget,  setAttendeesTarget]  = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [certTarget,       setCertTarget]       = useState(null);

  const fetchAll = useCallback(() => {
    setLoadAll(true);
    eventApi.getAll({ limit: 200, sort: '-createdAt' })
      .then(res => { const d = res.data?.data || res.data; setAll(d?.events || []); })
      .catch(() => {})
      .finally(() => setLoadAll(false));
  }, []);

  const fetchCreated = useCallback(() => {
    setLoadC(true);
    eventApi.getMyCreatedEvents()
      .then(res => { const d = res.data?.data || res.data; setCreated(d?.events || []); })
      .catch(() => {})
      .finally(() => setLoadC(false));
  }, []);

  useEffect(() => { fetchAll(); fetchCreated(); }, []);

  const handleCancel = async (ev) => {
    if (!window.confirm(`Cancel "${ev.title}"? Attendees will not be automatically notified.`)) return;
    try {
      await eventApi.cancelEvent(ev._id);
      toast.success('Event cancelled');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
  };

  const handleDelete = async (ev) => {
    if (!window.confirm(`Permanently delete "${ev.title}"?`)) return;
    try {
      await eventApi.delete(ev._id);
      toast.success('Event deleted');
      fetchAll();
    } catch { toast.error('Failed to delete event'); }
  };

  const filtered = allEvents.filter(e => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:     allEvents.length,
    upcoming:  allEvents.filter(e => e.status === 'upcoming').length,
    ongoing:   allEvents.filter(e => e.status === 'ongoing').length,
    cancelled: allEvents.filter(e => e.status === 'cancelled').length,
  };

  const tabs = [
    { key: 'all',     label: 'All Events',  icon: 'dashboard', count: allEvents.length },
    { key: 'created', label: 'My Created',  icon: 'event',     count: created.length   },
  ];

  const statusOpts = ['all', 'upcoming', 'ongoing', 'completed', 'cancelled'];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="event"       title="Total Events" value={stats.total} />
        <StatCard icon="upcoming"    title="Upcoming"     value={stats.upcoming}  accent="text-emerald-500" />
        <StatCard icon="play_circle" title="Ongoing"      value={stats.ongoing}   accent="text-amber-500" />
        <StatCard icon="cancel"      title="Cancelled"    value={stats.cancelled} accent="text-red-500" />
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* All events tab */}
      {tab === 'all' && (
        <SectionCard
          icon="dashboard"
          title="All Platform Events"
          action={
            <Link to="/events/new"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-accent hover:opacity-90 text-white text-xs font-bold rounded-lg transition-all">
              <span className="material-symbols-outlined text-[14px]">add</span>
              New Event
            </Link>
          }
        >
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {statusOpts.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  statusFilter === s
                    ? 'bg-gold-accent text-white border-gold-accent'
                    : 'border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant'
                }`}
              >
                {s === 'all' ? 'All' : label(s)}
              </button>
            ))}
            <div className="relative ml-auto">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[14px]">search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search events…"
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-accent/30 text-on-surface"
              />
            </div>
          </div>

          {loadAll ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="search_off" message="No events match your filters" />
          ) : (
            <div className="space-y-3">
              {filtered.map(e => (
                <EventRow key={e._id} event={e} actions={
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setAttendeesTarget(e)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-gold-accent/40 hover:text-gold-accent rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[13px]">group</span>
                      Attendees
                    </button>
                    <Link to={`/events/${e._id}/edit`}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-gold-accent/40 hover:text-gold-accent rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                      Edit
                    </Link>
                    {e.status !== 'cancelled' && e.status !== 'completed' && (
                      <button onClick={() => setRescheduleTarget(e)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-blue-200 dark:border-blue-800/40 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[13px]">schedule_send</span>
                        Reschedule
                      </button>
                    )}
                    <button onClick={() => setCertTarget(e)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-amber-200 dark:border-amber-800/40 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[13px]">workspace_premium</span>
                      Certs
                    </button>
                    {e.status !== 'cancelled' && (
                      <button onClick={() => handleCancel(e)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-orange-200 dark:border-orange-800/40 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[13px]">event_busy</span>
                        Cancel
                      </button>
                    )}
                    <button onClick={() => handleDelete(e)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-red-200 dark:border-red-800/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[13px]">delete</span>
                      Delete
                    </button>
                  </div>
                } />
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* My created tab */}
      {tab === 'created' && (
        <SectionCard
          icon="event"
          title="Events You Created"
          action={
            <Link to="/events/new"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-accent hover:opacity-90 text-white text-xs font-bold rounded-lg transition-all">
              <span className="material-symbols-outlined text-[14px]">add</span>
              New Event
            </Link>
          }
        >
          {loadC ? <div className="flex justify-center py-10"><Spinner /></div>
          : created.length === 0 ? (
            <EmptyState
              icon="add_circle"
              message="No events created yet"
              cta={<Link to="/events/new" className="inline-flex items-center gap-2 bg-gold-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all">Create Event</Link>}
            />
          ) : (
            <div className="space-y-3">
              {created.map(e => (
                <EventRow key={e._id} event={e} actions={
                  <>
                    <button onClick={() => setAttendeesTarget(e)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-gold-accent/40 hover:text-gold-accent rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[13px]">group</span>
                      Attendees
                    </button>
                    <button onClick={() => setCertTarget(e)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-amber-200 dark:border-amber-800/40 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[13px]">workspace_premium</span>
                      Certs
                    </button>
                    <Link to={`/events/${e._id}/edit`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-gold-accent/40 hover:text-gold-accent rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                      Edit
                    </Link>
                  </>
                } />
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {attendeesTarget  && <AttendeesModal  event={attendeesTarget}  onClose={() => setAttendeesTarget(null)} />}
      {rescheduleTarget && <RescheduleModal  event={rescheduleTarget} onClose={() => setRescheduleTarget(null)} onSave={fetchAll} />}
      {certTarget       && <CertificatesModal event={certTarget}      onClose={() => setCertTarget(null)} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR NAV CONFIGS
═══════════════════════════════════════════════════════════════════════════ */

const MENTOR_NAV = [
  { to: '/dashboard',            icon: 'dashboard',      label: 'Dashboard'   },
  { to: '/dashboard/stories',    icon: 'auto_stories',   label: 'Stories'     },
  { to: '/dashboard/mentorship', icon: 'groups',         label: 'Mentorship'  },
  { to: '/dashboard/events',     icon: 'event',          label: 'Events'      },
  { to: '/dashboard/resources',  icon: 'library_books',  label: 'Resources'   },
  { to: '/dashboard/forum',      icon: 'forum',          label: 'Forum'       },
  { to: '/dashboard/settings',   icon: 'settings',       label: 'Settings'    },
];

const MENTEE_NAV = [
  { to: '/dashboard',            icon: 'dashboard',      label: 'Dashboard'   },
  { to: '/dashboard/mentors',    icon: 'groups',         label: 'Mentorship'  },
  { to: '/dashboard/events',     icon: 'event',          label: 'Events'      },
  { to: '/dashboard/stories',    icon: 'auto_stories',   label: 'Stories'     },
  { to: '/dashboard/resources',  icon: 'library_books',  label: 'Resources'   },
  { to: '/dashboard/forum',      icon: 'forum',          label: 'Forum'       },
  { to: '/dashboard/settings',   icon: 'settings',       label: 'Settings'    },
];

const ADMIN_NAV = [
  { to: '/dashboard',                  icon: 'space_dashboard',  label: 'Admin Dashboard'   },
  { to: '/dashboard/manage-account',   icon: 'manage_accounts',  label: 'Manage Accounts'   },
  { to: '/dashboard/manage-stories',   icon: 'auto_stories',     label: 'Manage Stories'    },
  { to: '/dashboard/events',           icon: 'event',            label: 'Manage Events'     },
  { to: '/dashboard/manage-mentors',   icon: 'groups',           label: 'Manage Mentors'    },
  { to: '/dashboard/resources',        icon: 'library_books',    label: 'Manage Resources'  },
  { to: '/dashboard/forum',            icon: 'forum',            label: 'Manage Forum'      },
  { to: '/dashboard/settings',         icon: 'settings',         label: 'Settings'          },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */

export default function DashboardEventsPage() {
  const { user, isAdmin, isMentor, isMentee, canManageEvents, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const firstName = user?.name?.split(' ')?.[0] || 'User';
  const avatarSrc = user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=C9A84C&color=fff`;

  const roleLabel = isAdmin ? 'Admin' : isMentor ? 'Mentor' : 'Mentee';
  const sidebarNav = isAdmin ? ADMIN_NAV : isMentor ? MENTOR_NAV : MENTEE_NAV;

  const pageTitle    = isAdmin  ? 'Event Management'
                     : isMentor ? 'Events'
                     :            'My Events';
  const pageSubtitle = isAdmin
    ? 'Create, manage, reschedule events and issue certificates across the platform.'
    : isMentor
    ? 'Host events, manage registrations, and view attendees.'
    : 'Browse, register, and submit feedback for events.';

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-surface text-on-surface">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white dark:bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col z-40">
        {/* Profile */}
        <div className="p-6 flex flex-col items-center gap-3 border-b border-outline-variant/20">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-gold-accent p-0.5 overflow-hidden">
              <img alt="Avatar" className="w-full h-full object-cover rounded-full" src={avatarSrc} />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-on-surface font-bold text-lg">{firstName}</h3>
            <div className="mt-1 flex justify-center">
              <span className="bg-gold-accent/10 text-gold-accent text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-gold-accent/20">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {sidebarNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 transition-all ${
                  isActive
                    ? 'text-gold-accent bg-gold-accent/5 border-gold-accent'
                    : 'text-outline hover:text-on-surface hover:bg-surface-container-low border-transparent'
                }`
              }
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="ml-[260px] flex-1 flex flex-col min-h-screen">

        {/* Header / Breadcrumb */}
        <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white/80 dark:bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-outline">
            <Link className="hover:text-gold-accent transition-colors" to="/">Home</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link className="hover:text-gold-accent transition-colors" to="/dashboard">Dashboard</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface">Events</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(v => !v)}
                className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/25 hover:border-gold-accent transition-colors focus:outline-none focus:ring-2 focus:ring-gold-accent/40"
              >
                <img alt="Avatar" className="w-full h-full object-cover rounded-full" src={avatarSrc} />
              </button>
              {profileOpen && (
                <div role="menu" className="absolute right-0 mt-3 w-56 bg-white dark:bg-surface-container border border-outline-variant/20 editorial-shadow z-50">
                  <div className="px-5 py-4 border-b border-outline-variant/15">
                    <p className="font-sans-modern text-sm font-semibold text-on-surface line-clamp-1">{user?.name || 'User'}</p>
                    <p className="font-sans-modern text-xs text-outline line-clamp-1">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try { await logout(); toast.success('You have signed out.'); }
                      finally { setProfileOpen(false); navigate('/'); }
                    }}
                    className="w-full text-left px-5 py-3 font-sans-modern text-sm text-tertiary hover:bg-tertiary/5 transition-colors flex items-center gap-2"
                    role="menuitem"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 bg-slate-50 dark:bg-surface">
          {/* Page header */}
          <div className="bg-white dark:bg-surface-container-lowest border-b border-outline-variant/20 px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-serif-alt text-2xl font-bold text-on-surface">{pageTitle}</h1>
              <p className="text-sm text-on-surface-variant mt-1">{pageSubtitle}</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link to="/events"
                className="flex items-center gap-2 px-4 py-2 border border-outline-variant/40 text-on-surface-variant text-sm font-bold rounded-lg hover:border-gold-accent/40 hover:text-gold-accent transition-colors">
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Browse All
              </Link>
              {canManageEvents && (
                <Link to="/events/new"
                  className="flex items-center gap-2 px-4 py-2 bg-gold-accent hover:opacity-90 text-white text-sm font-bold rounded-lg transition-all shadow-md shadow-gold-accent/20">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  Create Event
                </Link>
              )}
            </div>
          </div>

          {/* Role-based content */}
          <div className="p-8 space-y-6 max-w-[1400px] mx-auto w-full">
            {isAdmin              && <AdminView />}
            {isMentor && !isAdmin && <MentorView />}
            {isMentee             && <MenteeView />}
            {!isAdmin && !isMentor && !isMentee && (
              <div className={`${CARD} p-10`}>
                <EmptyState
                  icon="lock"
                  message="Please log in to view your events"
                  cta={<Link to="/login" className="inline-block bg-gold-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all">Log In</Link>}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
