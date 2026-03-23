import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventApi } from '../../api/eventApi';

const PLACEHOLDER_EVENTS = [
  { _id: 'pe1', day: '14', tags: [{ label: 'Virtual', gold: true }],  title: 'Mastering the Boardroom Dynamic',      desc: 'Hosted by Margaret Howell, CEO of Howell & Co.' },
  { _id: 'pe2', day: '22', tags: [{ label: 'In-Person (London)', gold: false }], title: 'Women in AI: Global Summit 2026', desc: 'A full-day intensive on ethical scaling and future tech trends.' },
  { _id: 'pe3', day: '05', tags: [{ label: 'Virtual', gold: true }],  title: 'Financial Autonomy & Wealth Building',  desc: 'Interactive workshop with diversified portfolio specialists.' },
];

function mapEvent(e) {
  const d = new Date(e.date);
  return {
    _id: e._id,
    day: isNaN(d) ? '--' : String(d.getDate()).padStart(2, '0'),
    tags: [{ label: e.type === 'virtual' ? 'Virtual' : e.type === 'physical' ? 'In-Person' : 'Hybrid', gold: e.type === 'virtual' }],
    title: e.title,
    desc: e.description,
  };
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState(PLACEHOLDER_EVENTS);

  useEffect(() => {
    eventApi.getAll({ status: 'upcoming', limit: 3 })
      .then((res) => {
        const data = res.data?.data?.events || res.data?.events || [];
        if (data.length >= 1) setEvents(data.slice(0, 3).map(mapEvent));
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-24 bg-dark-bg">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 gap-4">
          <h2 className="font-cormorant text-5xl">Circle Gatherings</h2>
          <Link
            to="/events"
            className="text-gold font-bold uppercase tracking-widest text-xs border-b border-gold pb-1 hover:text-white hover:border-white transition-all"
          >
            View All Events
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {events.map((ev) => (
            <div key={ev._id} className="bg-dark-section p-8 border border-gold/10 rounded-eight flex flex-col h-full hover:border-gold/30 transition-colors">
              <div className="font-playfair text-5xl text-gold mb-6">{ev.day}</div>

              <div className="flex gap-2 mb-4">
                {ev.tags.map((t) => (
                  <span key={t.label}
                    className={`text-[10px] px-2 py-0.5 rounded border uppercase ${
                      t.gold
                        ? 'bg-gold/10 text-gold border-gold/20'
                        : 'bg-white/5 text-gray-400 border-white/10'
                    }`}>
                    {t.label}
                  </span>
                ))}
              </div>

              <h6 className="font-playfair text-2xl mb-4">{ev.title}</h6>
              <p className="text-gray-500 text-sm mb-8 flex-grow line-clamp-2">{ev.desc}</p>

              <Link
                to={`/events/${ev._id}`}
                className="text-gold text-xs font-bold uppercase tracking-widest text-left hover:translate-x-2 transition-transform inline-block"
              >
                Register Now ⟶
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
