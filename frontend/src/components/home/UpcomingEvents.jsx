import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventApi } from '../../api/eventApi';
import { absolutePhotoUrl } from '../../utils/absolutePhotoUrl';
import Spinner from '../common/Spinner';

const CATEGORY_STYLES = {
  webinar:            'bg-violet-100 text-violet-700',
  workshop:           'bg-blue-100 text-blue-700',
  networking:         'bg-teal-100 text-teal-700',
  conference:         'bg-purple-100 text-purple-700',
  'panel-discussion': 'bg-rose-100 text-rose-700',
};

const TYPE_ICON = { virtual: 'videocam', physical: 'location_on', hybrid: 'devices' };

function fmtLabel(val) {
  return (val || '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function UpcomingEvents() {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventApi.getAll({ status: 'upcoming', limit: 3 })
      .then((res) => setEvents(res.data?.data?.events || res.data?.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="py-24 bg-surface flex justify-center items-center min-h-[300px]">
      <Spinner />
    </section>
  );

  if (!events.length) return (
    <section className="py-24 bg-surface">
      <div className="container mx-auto px-8 md:px-12 text-center">
        <h2 className="font-headline text-5xl mb-6">Upcoming Gatherings</h2>
        <p className="font-body text-on-surface-variant mb-8">No events scheduled yet. Check back soon!</p>
        <Link to="/events" className="btn-primary">View All Events</Link>
      </div>
    </section>
  );

  return (
    <section className="py-24 bg-surface">
      <div className="container mx-auto px-8 md:px-12">
        {/* Header */}
        <div className="flex justify-between items-baseline mb-14">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">Community</p>
            <h2 className="font-headline text-5xl">Upcoming Gatherings</h2>
          </div>
          <Link
            to="/events"
            className="font-label text-xs tracking-[0.2em] uppercase text-primary transition-all hover:tracking-[0.3em] hidden md:flex items-center gap-1"
          >
            View All <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((e) => {
            const d        = new Date(e.date);
            const day      = d.toLocaleDateString('en-US', { day: '2-digit' });
            const month    = d.toLocaleDateString('en-US', { month: 'short' });
            const year     = d.getFullYear();
            const location = e.type === 'virtual'
              ? 'Virtual'
              : e.location?.city || e.location?.venue || 'TBC';
            const registered = e.registeredAttendees?.length || 0;
            const spotsLeft  = Math.max(0, (e.capacity || 0) - registered);
            const fillPct    = Math.min((registered / (e.capacity || 1)) * 100, 100);
            const catStyle   = CATEGORY_STYLES[e.category] || 'bg-slate-100 text-slate-600';
            const coverRaw =
              typeof e.coverImage === 'string'
                ? e.coverImage
                : typeof e.cover_image === 'string'
                  ? e.cover_image
                  : '';
            const coverUrl = coverRaw?.trim() ? absolutePhotoUrl(coverRaw.trim()) : '';

            return (
              <Link
                to={`/events/${e._id}`}
                key={e._id}
                className="group flex flex-col bg-white dark:bg-surface-container-lowest rounded-2xl border border-slate-100 dark:border-outline-variant/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                {/* Date → thumbnail → title */}
                <div className="flex min-h-[96px] items-stretch sm:min-h-[104px]">
                  <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center border-r border-slate-100 bg-rose-100/70 py-3 dark:border-outline-variant/20 dark:bg-rose-950/25 sm:w-20 sm:py-5">
                    <span className="text-2xl font-bold leading-none text-rose-600 dark:text-rose-400 sm:text-3xl">{day}</span>
                    <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-rose-600/85 dark:text-rose-400/90">{month}</span>
                    <span className="text-[10px] text-slate-400 dark:text-on-surface-variant">{year}</span>
                  </div>
                  <div className="relative w-[5.25rem] shrink-0 border-r border-slate-100 dark:border-outline-variant/20 sm:w-28">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt=""
                        className="h-full min-h-[96px] w-full object-cover sm:min-h-[104px]"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full min-h-[96px] w-full items-center justify-center bg-gradient-to-br from-rose-50 to-rose-100/60 dark:from-rose-950/35 dark:to-rose-950/15 sm:min-h-[104px]">
                        <span className="material-symbols-outlined text-[28px] text-rose-200 dark:text-rose-800/70 sm:text-[32px]" aria-hidden>
                          event
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 px-3 py-3 sm:px-4">
                    <span className={`mb-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${catStyle}`}>
                      {fmtLabel(e.category)}
                    </span>
                    <h4 className="font-serif-alt line-clamp-2 text-base font-bold leading-snug text-on-surface transition-colors group-hover:text-rose-600 dark:group-hover:text-rose-400">
                      {e.title}
                    </h4>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col px-4 pb-4 pt-3 gap-2.5">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-rose-600 dark:text-rose-400">{TYPE_ICON[e.type] || 'location_on'}</span>
                      {location}
                    </span>
                    {e.startTime && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-rose-600 dark:text-rose-400">schedule</span>
                        {e.startTime}
                      </span>
                    )}
                  </div>

                  {/* Capacity bar */}
                  <div>
                    <div className="h-1 w-full bg-slate-100 dark:bg-outline-variant/20 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${fillPct}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-on-surface-variant mt-1">
                      {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} remaining` : 'Fully booked'}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center gap-1 pt-1 text-xs font-bold text-rose-600 transition-all group-hover:gap-2 group-hover:text-rose-700 dark:text-rose-400 dark:group-hover:text-rose-300">
                    Secure Spot
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link to="/events" className="btn-outline">View All Events</Link>
        </div>
      </div>
    </section>
  );
}
