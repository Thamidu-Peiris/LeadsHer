import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventApi } from '../../api/eventApi';
import Spinner from '../common/Spinner';

const TAG_COLORS = {
  webinar:           'bg-tertiary-container text-white',
  workshop:          'bg-primary-container text-white',
  networking:        'bg-secondary text-white',
  conference:        'bg-tertiary-container text-white',
  'panel-discussion':'bg-primary-container text-white',
};

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
    <section className="py-32 bg-surface flex justify-center items-center min-h-[300px]">
      <Spinner />
    </section>
  );

  if (!events.length) return (
    <section className="py-32 bg-surface">
      <div className="container mx-auto px-8 md:px-12 text-center">
        <h2 className="font-headline text-5xl mb-6">Upcoming Gatherings</h2>
        <p className="font-body text-on-surface-variant mb-8">No events scheduled yet. Check back soon!</p>
        <Link to="/events" className="btn-primary">View All Events</Link>
      </div>
    </section>
  );

  return (
    <section className="py-32 bg-surface">
      <div className="container mx-auto px-8 md:px-12">
        <div className="flex justify-between items-baseline mb-16">
          <h2 className="font-headline text-5xl">Upcoming Gatherings</h2>
          <Link
            to="/events"
            className="font-label text-xs tracking-[0.2em] uppercase text-primary transition-all hover:tracking-[0.3em] hidden md:block"
          >
            View All Events →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.map((e) => {
            const d        = new Date(e.date);
            const day      = d.toLocaleDateString('en-US', { day: '2-digit' });
            const monthYr  = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const location = e.type === 'virtual'
              ? 'Virtual'
              : e.location?.city || e.location?.venue || 'TBC';

            return (
              <Link
                to={`/events/${e._id}`}
                key={e._id}
                className="group bg-surface-container-lowest p-8 border border-outline-variant/10 hover:border-primary/20 transition-all relative overflow-hidden block"
              >
                {/* Decorative circle */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform" />

                <span className={`inline-block px-4 py-1 font-label text-[9px] tracking-widest uppercase mb-8 ${TAG_COLORS[e.category] || 'bg-tertiary-container text-white'}`}>
                  {e.category}
                </span>

                <div className="mb-8">
                  <p className="font-serif-alt text-5xl text-primary mb-1">{day}</p>
                  <p className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant">
                    {monthYr}
                  </p>
                </div>

                <h4 className="font-serif-alt text-2xl mb-4 group-hover:text-primary transition-colors leading-tight">
                  {e.title}
                </h4>

                <div className="flex items-center gap-6 mb-8 text-on-surface-variant text-sm flex-wrap">
                  {e.host && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">person</span>
                      <span className="font-body text-sm">{e.host?.name || 'Host'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    <span className="font-body text-sm">{location}</span>
                  </div>
                </div>

                <span className="font-label text-[10px] tracking-widest uppercase text-primary flex items-center gap-2 group-inner">
                  Secure Spot{' '}
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </span>
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
