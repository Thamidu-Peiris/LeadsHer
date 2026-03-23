import { Link } from 'react-router-dom';

const typeIcon = {
  virtual:  '🌐',
  physical: '📍',
  hybrid:   '🔄',
};

const categoryColors = {
  webinar:           'bg-blue-100 text-blue-700',
  workshop:          'bg-yellow-100 text-yellow-700',
  networking:        'bg-green-100 text-green-700',
  conference:        'bg-purple-100 text-purple-700',
  'panel-discussion':'bg-orange-100 text-orange-700',
};

export default function EventCard({ event }) {
  const { _id, title, description, category, type, date, startTime, endTime, capacity, registeredAttendees, status } = event;

  const dateObj = new Date(date);
  const registered = registeredAttendees?.length || 0;
  const spotsLeft  = capacity - registered;

  return (
    <Link to={`/events/${_id}`} className="card group flex flex-col hover:shadow-md transition-shadow">
      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className={`badge ${categoryColors[category] || 'bg-gray-100 text-gray-600'}`}>
            {category}
          </span>
          <span className="text-xs text-gray-400">{typeIcon[type]} {type}</span>
        </div>

        <h3 className="font-display font-semibold text-gray-900 text-lg leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
          {title}
        </h3>
        <p className="text-gray-500 text-sm mt-2 line-clamp-2 flex-1">{description}</p>

        {/* Date / time */}
        <div className="mt-4 flex items-center gap-1.5 text-sm text-gray-600">
          <svg className="w-4 h-4 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {startTime && ` · ${startTime}`}{endTime && ` – ${endTime}`}
          </span>
        </div>

        {/* Capacity */}
        <div className="mt-3 flex items-center justify-between">
          <div className="w-full bg-gray-100 rounded-full h-1.5 mr-3">
            <div
              className="bg-brand-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min((registered / capacity) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className={`badge text-xs ${
            status === 'upcoming' ? 'bg-green-100 text-green-700' :
            status === 'ongoing'  ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            {status}
          </span>
          <span className="text-xs text-gray-400">{registered}/{capacity} registered</span>
        </div>
      </div>
    </Link>
  );
}
