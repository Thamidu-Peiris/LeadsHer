import { Link } from 'react-router-dom';

const TAG_COLORS = {
  webinar:           'bg-tertiary-container text-white',
  workshop:          'bg-primary-container text-white',
  networking:        'bg-secondary text-white',
  conference:        'bg-tertiary-container text-white',
  'panel-discussion':'bg-primary-container text-white',
};

export default function EventCard({ event }) {
  const { _id, title, description, category, type, date, startTime, endTime, capacity, registeredAttendees, status, location } = event;

  const d         = new Date(date);
  const day       = d.toLocaleDateString('en-US', { day: '2-digit' });
  const monthYr   = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const registered= registeredAttendees?.length || 0;
  const spotsLeft = (capacity || 0) - registered;
  const locStr    = type === 'virtual' ? 'Virtual' : location?.city || location?.venue || 'TBC';

  return (
    <Link
      to={`/events/${_id}`}
      className="group bg-surface-container-lowest p-8 border border-outline-variant/10 hover:border-primary/20 transition-all relative overflow-hidden block"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform" />

      <span className={`inline-block px-4 py-1 font-label text-[9px] tracking-widest uppercase mb-8 ${TAG_COLORS[category] || 'bg-tertiary-container text-white'}`}>
        {category}
      </span>

      <div className="mb-6">
        <p className="font-serif-alt text-5xl text-primary mb-1">{day}</p>
        <p className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant">{monthYr}</p>
      </div>

      <h4 className="font-serif-alt text-xl mb-4 group-hover:text-primary transition-colors leading-tight line-clamp-2">
        {title}
      </h4>

      {description && (
        <p className="font-body text-on-surface-variant text-sm line-clamp-2 mb-5 leading-relaxed">{description}</p>
      )}

      <div className="flex items-center gap-4 text-on-surface-variant text-sm mb-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base">location_on</span>
          <span className="font-body text-sm">{locStr}</span>
        </div>
        {startTime && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">schedule</span>
            <span className="font-body text-sm">{startTime}</span>
          </div>
        )}
      </div>

      {/* Capacity bar */}
      <div className="mb-4">
        <div className="w-full bg-surface-container h-0.5">
          <div
            className="bg-primary h-0.5 transition-all"
            style={{ width: `${Math.min((registered / (capacity || 1)) * 100, 100)}%` }}
          />
        </div>
        <p className="font-label text-[10px] tracking-wider uppercase text-on-surface-variant mt-1.5">
          {spotsLeft > 0 ? `${spotsLeft} spots remaining` : 'Fully booked'}
        </p>
      </div>

      <span className="font-label text-[10px] tracking-widest uppercase text-primary flex items-center gap-2">
        Secure Spot
        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
      </span>
    </Link>
  );
}
