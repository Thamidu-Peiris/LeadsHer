import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventApi } from '../../api/eventApi';
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
            <p className="text-gold-accent text-xs font-bold uppercase tracking-[0.2em] mb-2">Community</p>
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

            return (
              <Link
                to={`/events/${e._id}`}
                key={e._id}
                className="group flex flex-col bg-white dark:bg-surface-container-lowest rounded-2xl border border-slate-100 dark:border-outline-variant/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                {/* Date stripe */}
                <div className="flex items-stretch">
                  <div className="flex flex-col items-center justify-center w-20 shrink-0 bg-gold-accent/10 dark:bg-gold-accent/5 border-r border-slate-100 dark:border-outline-variant/20 py-5">
                    <span className="text-3xl font-bold text-gold-accent leading-none">{day}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold-accent/80 mt-0.5">{month}</span>
                    <span className="text-[10px] text-slate-400 dark:text-on-surface-variant">{year}</span>
                  </div>
                  <div className="flex-1 px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${catStyle}`}>
                      {fmtLabel(e.category)}
                    </span>
                    <h4 className="font-serif-alt text-base font-bold text-on-surface group-hover:text-gold-accent transition-colors line-clamp-2 leading-snug">
                      {e.title}
                    </h4>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col px-4 pb-4 pt-3 gap-2.5">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400 dark:text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">{TYPE_ICON[e.type] || 'location_on'}</span>
                      {location}
                    </span>
                    {e.startTime && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        {e.startTime}
                      </span>
                    )}
                  </div>

                  {/* Capacity bar */}
                  <div>
                    <div className="h-1 w-full bg-slate-100 dark:bg-outline-variant/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gold-accent rounded-full transition-all" style={{ width: `${fillPct}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-on-surface-variant mt-1">
                      {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} remaining` : 'Fully booked'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-gold-accent group-hover:gap-2 transition-all mt-auto pt-1">
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
