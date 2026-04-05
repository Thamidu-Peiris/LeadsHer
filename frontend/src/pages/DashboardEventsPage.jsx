import { useEffect, useState, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import { useAuth } from '../context/AuthContext';
import { eventApi } from '../api/eventApi';
import { authApi } from '../api/authApi';
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

const CARD =
  'bg-white dark:bg-white rounded-xl border border-outline-variant/20 shadow-sm dark:border-outline-variant/20';

function label(val) {
  return (val || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Stat Card ───────────────────────────────────────────────────────────── */

function StatCard({ icon, title, value, accent = 'text-[#f43f5e]' }) {
  return (
    <div className={`${CARD} p-5 flex items-center gap-4`}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/40">
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
    <div
      className="flex w-fit flex-wrap gap-1 rounded-xl border-2 border-outline-variant/30 bg-slate-50/80 p-1 shadow-inner dark:border-outline-variant/40 dark:bg-slate-900/40"
      role="tablist"
    >
      {tabs.map(t => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          className={`flex min-h-[40px] items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/40 focus-visible:ring-offset-2 ${
            active === t.key
              ? 'bg-[#f43f5e] text-white shadow-sm ring-1 ring-black/10'
              : 'border border-transparent bg-white text-on-surface shadow-sm hover:border-outline-variant/40 dark:bg-surface-container-lowest'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">{t.icon}</span>
          {t.label}
          {t.count !== undefined && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                active === t.key
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-200 text-slate-600 dark:bg-surface-container-high dark:text-on-surface-variant'
              }`}
            >
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
    <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/20 bg-white p-4 transition-all hover:border-[#f43f5e]/30 dark:bg-white sm:flex-row sm:items-center">
      {/* Date block */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-[#f43f5e]/15 bg-rose-50">
          <span className="text-xl font-bold leading-none text-[#f43f5e]">
            {d.toLocaleDateString('en-US', { day: '2-digit' })}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#f43f5e]/85">
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
      <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface">
          <span className="material-symbols-outlined text-[18px] text-[#f43f5e]">{icon}</span>
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
      <span className="material-symbols-outlined mb-3 block text-[44px] text-[#f43f5e]/25">{icon}</span>
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
                    className={`material-symbols-outlined text-[34px] transition-colors ${s <= (hovered || rating) ? 'text-[#f43f5e]' : 'text-slate-200 dark:text-outline-variant/40'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >star</span>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-[#f43f5e] font-semibold mt-2">
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
              className="w-full border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder-slate-400 focus:border-[#f43f5e] focus:outline-none focus:ring-0 transition-all resize-none"
            />
            <p className="text-[10px] text-slate-300 dark:text-outline text-right mt-1">{comment.length}/500</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-outline-variant/20 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving || !rating}
            className="flex-1 py-2.5 bg-[#f43f5e] hover:bg-[#e11d48] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all"
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
                    <div className="w-9 h-9 rounded-full bg-[#f43f5e]/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {u.profilePicture
                        ? <img src={u.profilePicture} alt={u.name} className="w-full h-full object-cover" />
                        : <span className="material-symbols-outlined text-[#f43f5e] text-[18px]">person</span>
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
                      <span className="flex items-center gap-0.5 text-xs text-[#f43f5e] font-bold ml-1">
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

  const inp = 'w-full border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:border-[#f43f5e] focus:outline-none focus:ring-0 transition-all';
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
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#f43f5e] hover:bg-[#e11d48] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all"
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
              <span className="material-symbols-outlined text-[#f43f5e] text-[20px]">workspace_premium</span>
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
                  <span className="material-symbols-outlined text-[#f43f5e] text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
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
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#f43f5e] hover:bg-[#e11d48] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all"
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
              <Link to="/events" className="inline-flex items-center gap-2 bg-rose-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500">
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
                        className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant hover:border-[#f43f5e]/40 hover:text-[#f43f5e] rounded-lg transition-colors">
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
                        className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant hover:border-[#f43f5e]/40 hover:text-[#f43f5e] rounded-lg transition-colors">
                        View
                      </Link>
                      {e.status === 'completed' && (
                        <button onClick={() => setFeedbackTarget(e)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-[#f43f5e]/10 border border-[#f43f5e]/20 text-[#f43f5e] hover:bg-[#f43f5e] hover:text-white rounded-lg transition-all">
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

function MentorView({ onNew, refreshKey = 0 }) {
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

  useEffect(() => { fetchCreated(); fetchRegistered(); }, [refreshKey]);

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
            <button
              type="button"
              onClick={onNew}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f43f5e] hover:bg-[#e11d48] text-white text-xs font-bold rounded-lg transition-all">
              <span className="material-symbols-outlined text-[14px]">add</span>
              New Event
            </button>
          }
        >
          {loadC ? <div className="flex justify-center py-10"><Spinner /></div>
          : created.length === 0 ? (
            <EmptyState
              icon="add_circle"
              message="No events created yet"
              sub="Create your first event to host webinars, workshops, or networking sessions."
              cta={
                <button
                  type="button"
                  onClick={onNew}
                  className="inline-flex items-center gap-2 bg-[#f43f5e] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#e11d48] transition-all">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Create Event
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {created.map(e => (
                <EventRow key={e._id} event={e} actions={
                  <>
                    <button onClick={() => setAttendeesTarget(e)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-[#f43f5e]/40 hover:text-[#f43f5e] rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[13px]">group</span>
                      Attendees
                    </button>
                    <Link to={`/events/${e._id}/edit`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-[#f43f5e]/40 hover:text-[#f43f5e] rounded-lg transition-colors">
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
              cta={<Link to="/events" className="inline-flex items-center gap-2 bg-rose-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500">Browse Events</Link>}
            />
          ) : (
            <div className="space-y-3">
              {registered.map(e => (
                <EventRow key={e._id} event={e} actions={
                  <>
                    <Link to={`/events/${e._id}`}
                      className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-[#f43f5e]/40 hover:text-[#f43f5e] rounded-lg transition-colors">
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
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-[#f43f5e]/10 border border-[#f43f5e]/20 text-[#f43f5e] hover:bg-[#f43f5e] hover:text-white rounded-lg transition-all">
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

function AdminView({ onNew, refreshKey = 0 }) {
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

  useEffect(() => { fetchAll(); fetchCreated(); }, [refreshKey]);

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
            <button
              type="button"
              onClick={onNew}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f43f5e] hover:bg-[#e11d48] text-white text-xs font-bold rounded-lg transition-all">
              <span className="material-symbols-outlined text-[14px]">add</span>
              New Event
            </button>
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
                    ? 'bg-[#f43f5e] text-white border-[#f43f5e]'
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
                className="min-h-[38px] rounded-lg border-2 border-outline-variant/30 bg-white py-2 pl-8 pr-3 text-xs text-on-surface focus:border-[#f43f5e] focus:outline-none focus:ring-0 dark:bg-surface-container-low"
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
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-[#f43f5e]/40 hover:text-[#f43f5e] rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[13px]">group</span>
                      Attendees
                    </button>
                    <Link to={`/events/${e._id}/edit`}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-[#f43f5e]/40 hover:text-[#f43f5e] rounded-lg transition-colors">
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
            <button
              type="button"
              onClick={onNew}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f43f5e] hover:bg-[#e11d48] text-white text-xs font-bold rounded-lg transition-all">
              <span className="material-symbols-outlined text-[14px]">add</span>
              New Event
            </button>
          }
        >
          {loadC ? <div className="flex justify-center py-10"><Spinner /></div>
          : created.length === 0 ? (
            <EmptyState
              icon="add_circle"
              message="No events created yet"
              cta={
                <button
                  type="button"
                  onClick={onNew}
                  className="inline-flex items-center gap-2 bg-[#f43f5e] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#e11d48] transition-all">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Create Event
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {created.map(e => (
                <EventRow key={e._id} event={e} actions={
                  <>
                    <button onClick={() => setAttendeesTarget(e)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-[#f43f5e]/40 hover:text-[#f43f5e] rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[13px]">group</span>
                      Attendees
                    </button>
                    <button onClick={() => setCertTarget(e)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-amber-200 dark:border-amber-800/40 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[13px]">workspace_premium</span>
                      Certs
                    </button>
                    <Link to={`/events/${e._id}/edit`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 hover:border-[#f43f5e]/40 hover:text-[#f43f5e] rounded-lg transition-colors">
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
   CREATE EVENT MODAL
═══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = ['webinar', 'workshop', 'networking', 'conference', 'panel-discussion'];
const TYPES      = ['virtual', 'physical', 'hybrid'];

const EMPTY_FORM = {
  title: '', description: '', category: 'webinar', type: 'virtual',
  date: '', startTime: '', endTime: '', duration: '', timezone: 'UTC',
  capacity: '', status: 'upcoming', tags: '',
  location: { virtualLink: '', venue: '', address: '', city: '', country: '' },
};

const lbl = 'block text-[10px] font-bold text-slate-500 dark:text-on-surface-variant uppercase tracking-widest mb-1.5';
const inp = 'w-full border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder-slate-400 focus:border-[#f43f5e] focus:outline-none focus:ring-0 transition-all';

/* ── helpers for time math ───────────────────────────────────────────────── */
function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function CreateEventModal({ onClose, onCreated }) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});   // tracks which fields the user has interacted with
  const [fieldErr, setFieldErr] = useState({}); // per-field error messages

  /* ── auto-compute duration whenever startTime or endTime changes ── */
  const computeDuration = (start, end) => {
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    if (s !== null && e !== null && e > s) return String(e - s);
    return '';
  };

  /* ── per-field validation rules ── */
  const validateField = (name, value, currentForm) => {
    switch (name) {
      case 'title':
        if (!value.trim()) return 'Event title is required.';
        if (value.trim().length < 5) return 'Title must be at least 5 characters.';
        return '';
      case 'description':
        if (!value.trim()) return 'Description is required.';
        if (value.trim().length < 10) return 'Description must be at least 10 characters.';
        return '';
      case 'date': {
        if (!value) return 'Event date is required.';
        if (value < todayStr()) return 'Event date cannot be in the past.';
        return '';
      }
      case 'startTime':
        if (!value) return 'Start time is required.';
        return '';
      case 'endTime': {
        if (!value) return '';          // end time is optional
        const s = timeToMinutes(currentForm?.startTime || '');
        const e = timeToMinutes(value);
        if (s !== null && e !== null && e <= s) return 'End time must be after start time.';
        return '';
      }
      case 'duration':
        if (!value || Number(value) < 1) return 'Duration must be at least 1 minute.';
        return '';
      case 'capacity':
        if (!value || Number(value) < 1) return 'Capacity must be at least 1.';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let nextForm;
    if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      nextForm = { ...form, location: { ...form.location, [field]: value } };
    } else {
      nextForm = { ...form, [name]: value };
    }

    /* Auto-compute duration when start or end time changes */
    if (name === 'startTime' || name === 'endTime') {
      const start = name === 'startTime' ? value : nextForm.startTime;
      const end   = name === 'endTime'   ? value : nextForm.endTime;
      const auto  = computeDuration(start, end);
      if (auto) nextForm = { ...nextForm, duration: auto };
    }

    setForm(nextForm);

    /* Validate touched field immediately */
    if (touched[name]) {
      setFieldErr(prev => ({ ...prev, [name]: validateField(name, value, nextForm) }));
    }
    /* Re-validate end time when start time changes */
    if (name === 'startTime' && touched.endTime) {
      setFieldErr(prev => ({ ...prev, endTime: validateField('endTime', nextForm.endTime, nextForm) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setFieldErr(prev => ({ ...prev, [name]: validateField(name, value, form) }));
  };

  const inpClass = (name) => {
    const hasErr = touched[name] && fieldErr[name];
    const isOk   = touched[name] && !fieldErr[name] && form[name];
    return `${inp} ${hasErr ? 'border-red-400 dark:border-red-500 focus:ring-red-300/40 focus:border-red-400' : isOk ? 'border-emerald-400 dark:border-emerald-500' : ''}`;
  };

  const FieldError = ({ name }) =>
    touched[name] && fieldErr[name]
      ? <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">error</span>
          {fieldErr[name]}
        </p>
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    /* Validate all required fields at once on submit */
    const required = ['title', 'description', 'date', 'startTime', 'duration', 'capacity'];
    const errors = {};
    required.forEach(f => { errors[f] = validateField(f, form[f], form); });
    if (form.endTime) errors.endTime = validateField('endTime', form.endTime, form);

    const allTouched = { ...touched };
    required.forEach(f => { allTouched[f] = true; });
    if (form.endTime) allTouched.endTime = true;

    setTouched(allTouched);
    setFieldErr(errors);

    if (Object.values(errors).some(Boolean)) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
        capacity: Number(form.capacity),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      await eventApi.create(payload);
      toast.success('Event created successfully!');
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event.');
    } finally {
      setSaving(false);
    }
  };

  /* Derived display for duration */
  const durationMins = Number(form.duration) || 0;
  const durationLabel = durationMins > 0
    ? durationMins >= 60
      ? `${Math.floor(durationMins / 60)}h ${durationMins % 60 > 0 ? `${durationMins % 60}m` : ''}`.trim()
      : `${durationMins}m`
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-surface-container-lowest w-full max-w-2xl rounded-2xl border border-slate-100 dark:border-outline-variant/20 shadow-2xl my-8">

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-outline-variant/20 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif-alt text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[#f43f5e] text-[22px]">add_circle</span>
              Create New Event
            </h2>
            <p className="text-xs text-slate-400 dark:text-on-surface-variant mt-1">
              Organise a webinar, workshop, or networking session for women leaders.
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-on-surface hover:bg-slate-100 dark:hover:bg-surface-container transition-colors shrink-0">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">

          {/* ── Basic Info ── */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#f43f5e] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className={lbl}>Title <span className="text-red-400">*</span></label>
                <input name="title" value={form.title}
                  onChange={handleChange} onBlur={handleBlur}
                  className={inpClass('title')} placeholder="e.g. Women in Tech Leadership Panel" />
                <FieldError name="title" />
              </div>
              <div>
                <label className={lbl}>Description <span className="text-red-400">*</span></label>
                <textarea name="description" value={form.description}
                  onChange={handleChange} onBlur={handleBlur}
                  className={`${inpClass('description')} h-24 resize-y`}
                  placeholder="Describe what attendees will gain…" />
                <FieldError name="description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Category</label>
                  <select name="category" value={form.category} onChange={handleChange} className={inp}>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Type</label>
                  <select name="type" value={form.type} onChange={handleChange} className={inp}>
                    {TYPES.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-100 dark:border-outline-variant/20" />

          {/* ── Schedule ── */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#f43f5e] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">calendar_month</span>
              Schedule
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Date <span className="text-red-400">*</span></label>
                  <input type="date" name="date" value={form.date}
                    min={todayStr()}
                    onChange={handleChange} onBlur={handleBlur}
                    className={inpClass('date')} />
                  <FieldError name="date" />
                </div>
                <div>
                  <label className={lbl}>Timezone</label>
                  <input name="timezone" value={form.timezone} onChange={handleChange}
                    className={inp} placeholder="UTC" />
                </div>
              </div>

              {/* Time row: Start | End | Duration (auto) */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>Start Time <span className="text-red-400">*</span></label>
                  <input type="time" name="startTime" value={form.startTime}
                    onChange={handleChange} onBlur={handleBlur}
                    className={inpClass('startTime')} />
                  <FieldError name="startTime" />
                </div>
                <div>
                  <label className={lbl}>End Time</label>
                  <input type="time" name="endTime" value={form.endTime}
                    onChange={handleChange} onBlur={handleBlur}
                    className={inpClass('endTime')} />
                  <FieldError name="endTime" />
                </div>
                <div>
                  <label className={lbl}>
                    Duration (min) <span className="text-red-400">*</span>
                    {durationLabel && (
                      <span className="ml-1 normal-case text-[#f43f5e] font-semibold tracking-normal">· {durationLabel}</span>
                    )}
                  </label>
                  <input type="number" name="duration" value={form.duration}
                    onChange={handleChange} onBlur={handleBlur}
                    className={inpClass('duration')} placeholder="auto" min="1" />
                  <FieldError name="duration" />
                  {form.startTime && form.endTime && form.duration && !fieldErr.endTime && (
                    <p className="mt-1 text-[11px] text-emerald-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      Auto-calculated from times
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-100 dark:border-outline-variant/20" />

          {/* ── Location ── */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#f43f5e] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              Location
            </h3>
            <div className="space-y-4">
              {(form.type === 'virtual' || form.type === 'hybrid') && (
                <div>
                  <label className={lbl}>Virtual Link</label>
                  <input name="location.virtualLink" value={form.location.virtualLink}
                    onChange={handleChange} className={inp} placeholder="https://meet.example.com/…" type="url" />
                </div>
              )}
              {(form.type === 'physical' || form.type === 'hybrid') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Venue</label>
                    <input name="location.venue" value={form.location.venue}
                      onChange={handleChange} className={inp} placeholder="Venue name" />
                  </div>
                  <div>
                    <label className={lbl}>City</label>
                    <input name="location.city" value={form.location.city}
                      onChange={handleChange} className={inp} placeholder="City" />
                  </div>
                  <div>
                    <label className={lbl}>Address</label>
                    <input name="location.address" value={form.location.address}
                      onChange={handleChange} className={inp} placeholder="Street address" />
                  </div>
                  <div>
                    <label className={lbl}>Country</label>
                    <input name="location.country" value={form.location.country}
                      onChange={handleChange} className={inp} placeholder="Country" />
                  </div>
                </div>
              )}
            </div>
          </section>

          <hr className="border-slate-100 dark:border-outline-variant/20" />

          {/* ── Settings ── */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#f43f5e] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">tune</span>
              Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Capacity <span className="text-red-400">*</span></label>
                <input type="number" name="capacity" value={form.capacity}
                  onChange={handleChange} onBlur={handleBlur}
                  className={inpClass('capacity')} placeholder="100" min="1" />
                <FieldError name="capacity" />
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select name="status" value={form.status} onChange={handleChange} className={inp}>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={lbl}>Tags (comma-separated)</label>
                <input name="tags" value={form.tags} onChange={handleChange}
                  className={inp} placeholder="leadership, networking, women" />
              </div>
            </div>
          </section>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-outline-variant/20">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-[#f43f5e] hover:bg-[#e11d48] disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-all"
            >
              {saving ? (
                <><Spinner size="sm" /> Creating…</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">add_circle</span> Create Event</>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant hover:border-slate-300 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
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
  const { user, isAdmin, isMentor, isMentee, canManageEvents, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen]     = useState(false);
  const [refreshKey, setRefreshKey]     = useState(0);

  const handleCreated = () => setRefreshKey(k => k + 1);

  // Refresh user profile to get the latest profile picture
  useEffect(() => {
    authApi.getProfile()
      .then((res) => {
        const u = res.data?.user || res.data;
        if (u) updateUser(u);
      })
      .catch(() => {});
  }, []);


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
    <>

        <DashboardTopBar crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Events' }]} />

        {/* Page content */}
        <div className="flex-1 bg-transparent">
          {/* Page header */}
          {isAdmin ? (
            <div className="mx-auto w-full max-w-[1400px] px-8 pt-8">
              <section
                className="rounded-xl border border-outline-variant/20 bg-white p-6 shadow-sm dark:border-outline-variant/20 dark:bg-white"
                aria-labelledby="event-management-heading"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                  <div className="min-w-0">
                    <h1
                      id="event-management-heading"
                      className="font-serif-alt text-2xl font-bold tracking-tight text-on-surface sm:text-3xl"
                    >
                      {pageTitle}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">{pageSubtitle}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-3">
                    <Link
                      to="/events"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border-2 border-outline-variant/35 bg-white px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:border-[#f43f5e]/45 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/35 focus-visible:ring-offset-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      Browse All
                    </Link>
                    {canManageEvents && (
                      <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border-2 border-[#f43f5e]/30 bg-[#f43f5e] px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#e11d48] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/45 focus-visible:ring-offset-2 active:scale-[0.99]"
                      >
                        <span className="material-symbols-outlined text-[16px]">add_circle</span>
                        Create Event
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="flex flex-col gap-4 border-b border-outline-variant/20 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-serif-alt text-2xl font-bold text-on-surface">{pageTitle}</h1>
                <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">{pageSubtitle}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <Link
                  to="/events"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/35 focus-visible:ring-offset-2"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  Browse All
                </Link>
                {canManageEvents && (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border-2 border-[#f43f5e]/30 bg-[#f43f5e] px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#e11d48] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/45 focus-visible:ring-offset-2 active:scale-[0.99]"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Create Event
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Role-based content */}
          <div className="p-8 space-y-6 max-w-[1400px] mx-auto w-full">
            {isAdmin              && <AdminView  onNew={() => setCreateOpen(true)} refreshKey={refreshKey} />}
            {isMentor && !isAdmin && <MentorView onNew={() => setCreateOpen(true)} refreshKey={refreshKey} />}
            {isMentee             && <MenteeView />}
            {!isAdmin && !isMentor && !isMentee && (
              <div className={`${CARD} p-10`}>
                <EmptyState
                  icon="lock"
                  message="Please log in to view your events"
                  cta={<Link to="/login" className="inline-block bg-[#f43f5e] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#e11d48] transition-all">Log In</Link>}
                />
              </div>
            )}
          </div>
        </div>
      {/* Create Event Modal */}
      {createOpen && (
        <CreateEventModal
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
