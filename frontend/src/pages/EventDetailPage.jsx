import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import { absolutePhotoUrl } from '../utils/absolutePhotoUrl';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

const CATEGORY_STYLES = {
  webinar:            'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  workshop:           'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  networking:         'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  conference:         'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'panel-discussion': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
};

const STATUS_STYLES = {
  upcoming:  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  ongoing:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function fmtLabel(val) {
  return (val || '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-rose-100/80 bg-white/90 p-4 dark:border-outline-variant/25 dark:bg-surface-container-lowest">
      <span className="material-symbols-outlined mt-0.5 text-[20px] text-rose-500 dark:text-rose-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">{label}</p>
        <div className="text-sm font-medium text-slate-800 dark:text-on-surface">{children}</div>
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
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    eventApi.getById(id)
      .then((res) => {
        const body = res.data;
        const e =
          body?.data?.event ??
          body?.event ??
          (body?._id || body?.title ? body : null);
        setEvent(e);
        const uid = user?._id?.toString() || user?.id?.toString();
        const isReg = e.registeredAttendees?.some(
          (a) => (a?._id?.toString() || a?.toString()) === uid
        );
        setRegistered(Boolean(isReg));
      })
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

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

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/events/${id}`;
  }, [id]);

  const copyEventLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const shareEvent = async () => {
    if (!shareUrl) return;
    const title = event?.title || 'Event';
    const payload = { title, text: title, url: shareUrl };
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share(payload);
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
    await copyEventLink();
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#fef8fa] dark:bg-surface">
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

  const isStarted = (() => {
    if (!event.date || !event.startTime) return false;
    try {
      const start = new Date(event.date);
      const [h, m] = event.startTime.split(':').map(Number);
      start.setUTCHours(h, m, 0, 0);
      return new Date() >= start;
    } catch { return false; }
  })();

  const dateObj    = new Date(event.date);
  const dateStr    = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dayNum     = dateObj.toLocaleDateString('en-US', { day: 'numeric' });
  const catStyle   = CATEGORY_STYLES[event.category] || 'bg-slate-100 text-slate-700';
  const stStyle    = STATUS_STYLES[event.status]   || 'bg-slate-100 text-slate-600';
  const canEdit    = isOwner || canManageEvents;
  const coverRaw = event.coverImage ?? event.cover_image;
  const cover =
    typeof coverRaw === 'string' && coverRaw.trim() ? coverRaw.trim() : '';
  const coverUrl = cover ? absolutePhotoUrl(cover) : '';
  const priceLabel = event.isPaid && event.price > 0 ? `$${Number(event.price).toFixed(2)}` : 'Free';

  const rawAttendees = event.registeredAttendees || [];
  const attendeeSlots = rawAttendees.slice(0, 8);
  const attendeeOverflow = Math.max(0, rawAttendees.length - 8);

  return (
    <div className="min-h-screen bg-[#fef8fa] text-slate-800 dark:bg-surface dark:text-on-surface">

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-rose-100/90 bg-white/90 backdrop-blur-md dark:border-outline-variant/30 dark:bg-surface-container-lowest/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/events"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-600 transition-colors hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            All events
          </Link>
          {canEdit && (
            <div className="flex items-center gap-2">
              <Link
                to={`/events/${id}/edit`}
                className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-700 transition-colors hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-950/40"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero — sharp cover + dark scrim / vignette (no white wash; keeps white type readable) */}
      <section className="relative min-h-[280px] w-full overflow-hidden sm:min-h-[360px]">
        {coverUrl ? (
          <>
            <img
              src={coverUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              decoding="async"
              loading="eager"
              aria-hidden
            />
            {/* Dark overlay — stronger toward bottom so no white haze on the photo */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/45 to-black/58 dark:from-black/60 dark:via-black/55 dark:to-black/70"
              aria-hidden
            />
            {/* Edge vignette */}
            <div
              className="absolute inset-0 bg-[radial-gradient(ellipse_120%_100%_at_50%_35%,transparent_20%,rgba(0,0,0,0.35)_100%)] dark:bg-[radial-gradient(ellipse_120%_100%_at_50%_35%,transparent_15%,rgba(0,0,0,0.48)_100%)]"
              aria-hidden
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rose-100 via-white to-rose-50 dark:from-surface-container dark:via-surface dark:to-surface-container-high" />
        )}
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-end px-4 pb-10 pt-16 sm:px-6 sm:pb-14 sm:pt-20">
          <nav
            className={`mb-4 flex flex-wrap items-center gap-1.5 text-sm font-normal sm:text-base ${
              coverUrl
                ? 'text-white/90'
                : 'text-slate-600 dark:text-on-surface-variant'
            }`}
            aria-label="Breadcrumb"
          >
            <Link
              to="/events"
              className={`font-normal transition-colors ${
                coverUrl
                  ? 'text-white hover:text-white/80'
                  : 'hover:text-rose-600 dark:hover:text-rose-400'
              }`}
            >
              Events
            </Link>
            <span
              className={`material-symbols-outlined shrink-0 text-[18px] sm:text-[20px] ${
                coverUrl ? 'text-white/75' : 'text-slate-400 dark:text-outline'
              }`}
              aria-hidden
            >
              chevron_right
            </span>
            <span
              className={`min-w-0 max-w-[min(100%,720px)] truncate text-sm font-normal leading-snug sm:text-base ${
                coverUrl ? 'text-white' : 'text-slate-800 dark:text-on-surface'
              }`}
            >
              {event.title}
            </span>
          </nav>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${catStyle}`}>
              {fmtLabel(event.category)}
            </span>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${stStyle}`}>
              {event.status}
            </span>
            <span className="inline-flex items-center rounded-full border border-rose-200/80 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-800 backdrop-blur-sm dark:border-rose-500/30 dark:bg-surface-container/80 dark:text-rose-200">
              {fmtLabel(event.type)}
            </span>
          </div>
          <h1
            className={`font-serif-alt max-w-5xl text-4xl font-bold leading-[1.1] sm:text-5xl md:text-6xl ${
              coverUrl ? 'text-white' : 'text-slate-900 dark:text-on-surface'
            }`}
          >
            {event.title}
          </h1>
          <p
            className={`mt-5 flex flex-wrap items-center gap-2 text-base font-medium sm:text-lg ${
              coverUrl
                ? 'text-white/95'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            <span className="material-symbols-outlined text-[22px] sm:text-[24px]">calendar_today</span>
            {dateStr}
            <span className={coverUrl ? 'text-white/70' : 'text-slate-400 dark:text-outline'}>·</span>
            <span>
              {event.startTime}
              {event.endTime ? ` – ${event.endTime}` : ''}{' '}
              <span
                className={`text-sm font-normal sm:text-base ${
                  coverUrl ? 'text-white/80' : 'text-slate-500 dark:text-on-surface-variant'
                }`}
              >
                ({event.timezone || 'UTC'})
              </span>
            </span>
          </p>
        </div>
      </section>

      <main className="w-full border-t border-rose-100/90 bg-gradient-to-b from-rose-50 via-[#fdf2f7] to-rose-50/90 dark:border-outline-variant/25 dark:from-surface dark:via-surface dark:to-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
          {/* Left column */}
          <div className="space-y-12">
            <article>
              <h2 className="font-serif-alt mb-5 text-2xl font-bold text-rose-600 dark:text-rose-400 sm:text-3xl">About this event</h2>
              <div className="max-w-3xl space-y-4 text-base leading-relaxed text-slate-600 dark:text-on-surface-variant">
                <p className="whitespace-pre-wrap">{event.description}</p>
              </div>
            </article>

            {event.agenda?.length > 0 && (
              <section>
                <h2 className="font-serif-alt mb-8 text-2xl font-bold text-rose-600 dark:text-rose-400 sm:text-3xl">Agenda</h2>
                <div className="relative space-y-0 border-l-2 border-rose-200 pl-8 dark:border-rose-800/50">
                  {event.agenda.map((item, i) => (
                    <div key={i} className="relative pb-10 last:pb-0">
                      <div className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full border-4 border-white bg-rose-500 shadow-sm ring-2 ring-rose-200 dark:border-surface-container dark:bg-rose-400 dark:ring-rose-900/50" />
                      {item.time && (
                        <span className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">{item.time}</span>
                      )}
                      <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-on-surface">{item.topic}</h3>
                      {item.speaker && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-on-surface-variant">{item.speaker}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {Array.isArray(event.speakers) && event.speakers.length > 0 && event.speakers.some((s) => s && typeof s === 'object' && (s.name || s.profilePicture)) && (
              <section>
                <h2 className="font-serif-alt mb-8 text-2xl font-bold text-rose-600 dark:text-rose-400 sm:text-3xl">Speakers</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {event.speakers.filter((s) => s && typeof s === 'object').map((s) => (
                    <div key={s._id || s.id || s.name} className="flex items-center gap-4">
                      {s.profilePicture ? (
                        <img src={s.profilePicture} alt="" className="h-24 w-24 rounded-full object-cover ring-2 ring-rose-200 ring-offset-4 ring-offset-[#fef8fa] dark:ring-rose-800 dark:ring-offset-surface" />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-rose-100 text-xl font-bold text-rose-600 ring-2 ring-rose-200 ring-offset-4 ring-offset-[#fef8fa] dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800 dark:ring-offset-surface">
                          {(s.name || '?')[0]}
                        </div>
                      )}
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-on-surface">{s.name || 'Speaker'}</h4>
                        {s.title && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{s.title}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow icon="schedule" label="Duration">
                {event.duration ? `${event.duration} minutes` : '—'}
              </InfoRow>
              <InfoRow icon="group" label="Registration">
                <span>{registered_}/{event.capacity} registered</span>
                <span className={`ml-2 text-xs font-semibold ${isFull ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {isFull ? 'Full' : `${spotsLeft} left`}
                </span>
              </InfoRow>
              {event.location?.virtualLink && (
                <div className="sm:col-span-2">
                  <InfoRow icon="videocam" label="Virtual link">
                    <a
                      href={event.location.virtualLink}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-sm font-semibold text-rose-600 underline-offset-2 hover:underline dark:text-rose-400"
                    >
                      {event.location.virtualLink}
                    </a>
                  </InfoRow>
                </div>
              )}
              {event.location?.venue && (
                <div className="sm:col-span-2">
                  <InfoRow icon="location_on" label="Venue">
                    {event.location.venue}
                    {event.location.city ? `, ${event.location.city}` : ''}
                    {event.location.country ? `, ${event.location.country}` : ''}
                  </InfoRow>
                </div>
              )}
            </div>

            {event.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {event.tags.map((t) => (
                  <span
                    key={t}
                    className="cursor-default rounded-full border border-rose-200/90 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:border-rose-400 hover:text-rose-600 dark:border-outline-variant/40 dark:bg-surface-container dark:text-on-surface-variant dark:hover:border-rose-500/50"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {registered_ > 0 && (
              <section className="rounded-2xl border border-rose-100 bg-white/80 p-6 dark:border-outline-variant/25 dark:bg-surface-container-lowest">
                <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
                  <div className="flex -space-x-2 overflow-hidden">
                    {attendeeSlots.map((a, idx) => {
                      const key = typeof a === 'object' && a ? (a._id || a.id || idx) : idx;
                      const name = typeof a === 'object' && a?.name ? a.name : '';
                      const pic = typeof a === 'object' && a?.profilePicture ? a.profilePicture : '';
                      const initial = (name || '?')[0]?.toUpperCase() || '?';
                      return (
                        <div
                          key={key}
                          className="inline-block h-11 w-11 overflow-hidden rounded-full ring-2 ring-white dark:ring-surface-container-lowest"
                          title={name || 'Attendee'}
                        >
                          {pic ? (
                            <img src={pic} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-rose-100 text-xs font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-200">
                              {initial}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {attendeeOverflow > 0 && (
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700 ring-2 ring-white dark:bg-rose-950 dark:text-rose-200 dark:ring-surface-container-lowest">
                        +{attendeeOverflow}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif-alt text-xl font-bold text-slate-900 dark:text-on-surface">
                      {registered_} {registered_ === 1 ? 'person is' : 'people are'} attending
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-on-surface-variant">Join others who registered for this event.</p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sticky registration card */}
          <aside className="relative lg:pt-2">
            <div className="space-y-6 rounded-2xl border border-rose-100/90 bg-white/90 p-6 shadow-[0_8px_40px_-12px_rgba(190,24,93,0.12)] backdrop-blur-md dark:border-outline-variant/30 dark:bg-surface-container-lowest sm:p-8 lg:sticky lg:top-28">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">Date &amp; time</span>
                <span className="rounded-lg bg-rose-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-800 dark:bg-rose-950/60 dark:text-rose-200">
                  {priceLabel}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-rose-100 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/40">
                  <span className="text-[10px] font-bold leading-none text-rose-600 dark:text-rose-400">{monthShort}</span>
                  <span className="text-lg font-bold leading-none text-slate-900 dark:text-on-surface">{dayNum}</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-on-surface">{dateStr}</p>
                  <p className="text-sm text-slate-500 dark:text-on-surface-variant">
                    {event.startTime}
                    {event.endTime ? ` – ${event.endTime}` : ''} · {event.timezone || 'UTC'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-end justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">Availability</span>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {registered_}/{event.capacity} spots
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-rose-100 dark:bg-rose-950/50">
                  <div
                    className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : 'bg-rose-500'}`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-on-surface-variant">
                  {isFull ? 'Event is fully booked' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} remaining`}
                </p>
              </div>

              <div className="space-y-3 border-t border-rose-100 pt-6 dark:border-outline-variant/20">
                {event.status === 'upcoming' && (
                  isStarted ? (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 dark:border-outline-variant/30 dark:bg-surface-container dark:text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px] text-red-400">lock_clock</span>
                      Registration closed — event has started
                    </div>
                  ) : registered ? (
                    <button
                      type="button"
                      onClick={handleUnregister}
                      disabled={registering}
                      className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border-2 border-red-200 text-sm font-bold uppercase tracking-widest text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800/50 dark:hover:bg-red-950/30"
                    >
                      {registering ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-[18px]">event_busy</span>}
                      Unregister
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRegister}
                      disabled={registering || isFull}
                      className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-rose-500 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-rose-500/25 transition-all hover:bg-rose-600 disabled:opacity-50 dark:hover:bg-rose-400"
                    >
                      {registering ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-[18px]">{isFull ? 'notifications' : 'how_to_reg'}</span>}
                      {isFull ? 'Join waitlist' : 'Register now'}
                    </button>
                  )
                )}

                {event.status === 'ongoing' && registered && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    You&apos;re registered — event in progress
                  </div>
                )}

                <div className="border-t border-rose-100 pt-5 dark:border-outline-variant/20">
                  <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">
                    Share this event
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={shareEvent}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-rose-200 text-slate-500 transition-colors hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:border-outline-variant/40 dark:hover:border-rose-500/50 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                      title="Share"
                      aria-label="Share this event"
                    >
                      <span className="material-symbols-outlined text-[22px]">share</span>
                    </button>
                    <button
                      type="button"
                      onClick={copyEventLink}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-rose-200 text-slate-500 transition-colors hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:border-outline-variant/40 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                      title="Copy link"
                      aria-label="Copy event link"
                    >
                      <span className="material-symbols-outlined text-[22px]">{linkCopied ? 'check' : 'link'}</span>
                    </button>
                  </div>
                </div>

                <Link
                  to="/events"
                  className="flex h-11 w-full items-center justify-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-rose-600 dark:text-on-surface-variant dark:hover:text-rose-400"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Back to all events
                </Link>
              </div>
            </div>
          </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
