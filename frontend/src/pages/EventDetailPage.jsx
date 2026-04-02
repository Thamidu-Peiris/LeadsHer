import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

const CATEGORY_STYLES = {
  webinar:            'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  workshop:           'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  networking:         'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  conference:         'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  'panel-discussion': 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
};

const STATUS_STYLES = {
  upcoming:  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  ongoing:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  completed: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

function fmtLabel(val) {
  return (val || '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function InfoCard({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-surface-container rounded-xl border border-slate-100 dark:border-outline-variant/20">
      <span className="material-symbols-outlined text-gold-accent text-[20px] mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-on-surface-variant uppercase tracking-widest mb-0.5">{label}</p>
        <div className="text-sm font-medium text-on-surface">{children}</div>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const { id }            = useParams();
  const { user, isAuthenticated, canManageEvents } = useAuth();
  const navigate          = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    eventApi.getById(id)
      .then((res) => {
        const e = res.data?.data?.event || res.data;
        setEvent(e);
        // Fix: compare as strings to handle ObjectId vs string mismatch
        const uid = user?._id?.toString() || user?.id?.toString();
        const isReg = e.registeredAttendees?.some(
          (a) => (a?._id?.toString() || a?.toString()) === uid
        );
        setRegistered(Boolean(isReg));
      })
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRegister = async () => {
    if (!isAuthenticated) { toast.error('Please log in to register'); return; }
    setRegistering(true);
    try {
      await eventApi.register(id);
      setRegistered(true);
      setEvent((e) => ({ ...e, registeredAttendees: [...(e.registeredAttendees || []), user._id] }));
      toast.success('Registered successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setRegistering(false); }
  };

  const handleUnregister = async () => {
    if (!window.confirm('Unregister from this event?')) return;
    setRegistering(true);
    try {
      await eventApi.unregister(id);
      setRegistered(false);
      setEvent((e) => ({
        ...e,
        registeredAttendees: (e.registeredAttendees || []).filter(
          (a) => (a?._id?.toString() || a?.toString()) !== (user?._id?.toString() || user?.id?.toString())
        ),
      }));
      toast.success('Unregistered successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unregister');
    } finally { setRegistering(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try {
      await eventApi.delete(id);
      toast.success('Event deleted');
      navigate('/events');
    } catch { toast.error('Failed to delete event'); }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Spinner size="lg" />
    </div>
  );
  if (!event) return null;

  const uid        = user?._id?.toString() || user?.id?.toString();
  const createdById = event.createdBy?._id?.toString() || event.createdBy?.toString();
  const isOwner    = uid && uid === createdById;
  const registered_ = event.registeredAttendees?.length || 0;
  const spotsLeft  = Math.max(0, (event.capacity || 0) - registered_);
  const isFull     = spotsLeft === 0;
  const fillPct    = Math.min((registered_ / (event.capacity || 1)) * 100, 100);

  // Determine whether the event start time has already passed
  const isStarted = (() => {
    if (!event.date || !event.startTime) return false;
    try {
      const start = new Date(event.date);
      const [h, m] = event.startTime.split(':').map(Number);
      start.setUTCHours(h, m, 0, 0);
      return new Date() >= start;
    } catch { return false; }
  })();
  const dateStr    = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const catStyle   = CATEGORY_STYLES[event.category] || 'bg-slate-100 text-slate-600';
  const stStyle    = STATUS_STYLES[event.status]   || 'bg-slate-100 text-slate-600';
  const canEdit    = isOwner || canManageEvents;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface">

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-6">
            <Link to="/events" className="hover:text-white transition-colors">Events</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-slate-300 truncate max-w-xs">{event.title}</span>
          </nav>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${catStyle}`}>
              {fmtLabel(event.category)}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${stStyle}`}>
              {event.status}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white uppercase tracking-wider">
              {fmtLabel(event.type)}
            </span>
          </div>

          <h1 className="font-serif-alt text-3xl sm:text-4xl font-bold text-white leading-tight">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-6 pb-16 space-y-5">

        {/* Info cards */}
        <div className="bg-white dark:bg-surface-container-lowest rounded-2xl border border-slate-100 dark:border-outline-variant/20 shadow-md p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoCard icon="calendar_today" label="Date">{dateStr}</InfoCard>
            <InfoCard icon="schedule" label="Time">
              {event.startTime}{event.endTime ? ` – ${event.endTime}` : ''}{' '}
              <span className="text-xs text-slate-400">({event.timezone || 'UTC'})</span>
            </InfoCard>
            <InfoCard icon="hourglass_empty" label="Duration">
              {event.duration ? `${event.duration} minutes` : '—'}
            </InfoCard>
            <InfoCard icon="group" label="Capacity">
              <span>{registered_}/{event.capacity} registered</span>
              <span className={`ml-2 text-xs font-semibold ${isFull ? 'text-red-500' : 'text-emerald-600'}`}>
                ({isFull ? 'Full' : `${spotsLeft} left`})
              </span>
            </InfoCard>
            {event.location?.virtualLink && (
              <div className="sm:col-span-2">
                <InfoCard icon="videocam" label="Virtual Link">
                  <a href={event.location.virtualLink} target="_blank" rel="noreferrer"
                    className="text-gold-accent hover:underline break-all text-sm">
                    {event.location.virtualLink}
                  </a>
                </InfoCard>
              </div>
            )}
            {event.location?.venue && (
              <div className="sm:col-span-2">
                <InfoCard icon="location_on" label="Venue">
                  {event.location.venue}
                  {event.location.city ? `, ${event.location.city}` : ''}
                  {event.location.country ? `, ${event.location.country}` : ''}
                </InfoCard>
              </div>
            )}
          </div>

          {/* Capacity bar */}
          <div className="mt-4">
            <div className="h-1.5 w-full bg-slate-100 dark:bg-outline-variant/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : 'bg-gold-accent'}`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-on-surface-variant mt-1.5 uppercase tracking-wider font-medium">
              {isFull ? 'Event is fully booked' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} remaining`}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-surface-container-lowest rounded-2xl border border-slate-100 dark:border-outline-variant/20 shadow-md p-6">
          <h2 className="font-serif-alt text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-gold-accent text-[20px]">description</span>
            About this Event
          </h2>
          <p className="text-slate-600 dark:text-on-surface-variant leading-relaxed whitespace-pre-wrap text-sm">
            {event.description}
          </p>
        </div>

        {/* Agenda */}
        {event.agenda?.length > 0 && (
          <div className="bg-white dark:bg-surface-container-lowest rounded-2xl border border-slate-100 dark:border-outline-variant/20 shadow-md p-6">
            <h2 className="font-serif-alt text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-gold-accent text-[20px]">list_alt</span>
              Agenda
            </h2>
            <div className="space-y-3">
              {event.agenda.map((item, i) => (
                <div key={i} className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-surface-container border border-slate-100 dark:border-outline-variant/20">
                  {item.time && (
                    <span className="text-xs font-bold text-gold-accent shrink-0 pt-0.5">{item.time}</span>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{item.topic}</p>
                    {item.speaker && <p className="text-xs text-slate-400 dark:text-on-surface-variant mt-0.5">{item.speaker}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.tags.map((t) => (
              <span key={t} className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-surface-container text-slate-500 dark:text-on-surface-variant border border-slate-200 dark:border-outline-variant/30">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="bg-white dark:bg-surface-container-lowest rounded-2xl border border-slate-100 dark:border-outline-variant/20 shadow-md p-5">
          <div className="flex flex-wrap gap-3">
            {event.status === 'upcoming' && (
              isStarted ? (
                /* Event start time has passed — registration closed */
                <div className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-slate-50 dark:bg-surface-container border border-slate-200 dark:border-outline-variant/30 text-slate-500 dark:text-on-surface-variant rounded-xl">
                  <span className="material-symbols-outlined text-[16px] text-red-400">lock_clock</span>
                  Registration closed — this event has already started
                </div>
              ) : registered ? (
                <button
                  onClick={handleUnregister}
                  disabled={registering}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold border border-red-200 dark:border-red-800/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50"
                >
                  {registering ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-[16px]">event_busy</span>}
                  Unregister
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering || isFull}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-gold-accent hover:opacity-90 disabled:opacity-50 text-white rounded-xl transition-all shadow-md shadow-gold-accent/20"
                >
                  {registering ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-[16px]">{isFull ? 'notifications' : 'how_to_reg'}</span>}
                  {isFull ? 'Join Waitlist' : 'Register Now'}
                </button>
              )
            )}

            {event.status === 'ongoing' && registered && (
              <div className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 rounded-xl">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                You are registered — event is in progress
              </div>
            )}

            {canEdit && (
              <>
                <Link
                  to={`/events/${id}/edit`}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-600 dark:text-on-surface-variant hover:border-gold-accent/50 hover:text-gold-accent rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Edit Event
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800/30 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Delete
                </button>
              </>
            )}

            <Link to="/events" className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-slate-400 dark:text-on-surface-variant hover:text-on-surface transition-colors ml-auto">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              All Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
