import { Link } from 'react-router-dom';
import { absolutePhotoUrl } from '../../utils/absolutePhotoUrl';

const CATEGORY_STYLES = {
  webinar:            { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  workshop:           { bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-300',   dot: 'bg-blue-500' },
  networking:         { bg: 'bg-teal-100 dark:bg-teal-900/30',   text: 'text-teal-700 dark:text-teal-300',   dot: 'bg-teal-500' },
  conference:         { bg: 'bg-purple-100 dark:bg-purple-900/30',text: 'text-purple-700 dark:text-purple-300',dot: 'bg-purple-500' },
  'panel-discussion': { bg: 'bg-rose-100 dark:bg-rose-900/30',   text: 'text-rose-700 dark:text-rose-300',   dot: 'bg-rose-500' },
};

const STATUS_STYLES = {
  upcoming:  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  ongoing:   { bg: 'bg-amber-100 dark:bg-amber-900/30',    text: 'text-amber-700 dark:text-amber-300' },
  completed: { bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-500 dark:text-slate-400' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30',        text: 'text-red-600 dark:text-red-400' },
};

const TYPE_ICON = {
  virtual:  'videocam',
  physical: 'location_on',
  hybrid:   'devices',
};

function fmtCategory(cat) {
  return cat.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function EventCard({ event }) {
  const {
    _id,
    title,
    description,
    category,
    type,
    date,
    startTime,
    capacity,
    registeredAttendees,
    status,
    location,
    coverImage,
    cover_image,
  } = event;
  const coverRaw = typeof coverImage === 'string' ? coverImage : typeof cover_image === 'string' ? cover_image : '';
  const coverUrl = coverRaw?.trim() ? absolutePhotoUrl(coverRaw.trim()) : '';

  const d         = new Date(date);
  const day       = d.toLocaleDateString('en-US', { day: '2-digit' });
  const month     = d.toLocaleDateString('en-US', { month: 'short' });
  const year      = d.getFullYear();
  const registered = registeredAttendees?.length || 0;
  const spotsLeft  = Math.max(0, (capacity || 0) - registered);
  const fillPct    = Math.min((registered / (capacity || 1)) * 100, 100);
  const isFull     = spotsLeft === 0;
  const locStr     = type === 'virtual' ? 'Virtual' : location?.city || location?.venue || 'TBC';
  const catStyle   = CATEGORY_STYLES[category] || CATEGORY_STYLES.webinar;
  const stStyle    = STATUS_STYLES[status]   || STATUS_STYLES.upcoming;

  return (
    <Link
      to={`/events/${_id}`}
      className="group flex flex-col bg-white dark:bg-surface-container-lowest rounded-2xl border border-slate-100 dark:border-outline-variant/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Date → cover thumbnail → details */}
      <div className="flex min-h-[96px] items-stretch sm:min-h-[104px]">
        <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center border-r border-slate-100 bg-rose-100/70 py-3 dark:border-outline-variant/20 dark:bg-rose-950/25 sm:w-20 sm:py-4">
          <span className="text-2xl font-bold leading-none text-rose-600 dark:text-rose-400 sm:text-3xl">{day}</span>
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-rose-600/85 dark:text-rose-400/90">{month}</span>
          <span className="text-[10px] text-slate-400 dark:text-on-surface-variant">{year}</span>
        </div>

        {/* Small cover image (left, after date) */}
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

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-3 py-3 sm:px-4">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${catStyle.bg} ${catStyle.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${catStyle.dot}`} />
              {fmtCategory(category)}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${stStyle.bg} ${stStyle.text}`}>
              {status}
            </span>
          </div>

          {/* Title */}
          <h4 className="font-serif-alt line-clamp-2 text-base font-bold leading-snug text-on-surface transition-colors group-hover:text-rose-600 dark:group-hover:text-rose-400">
            {title}
          </h4>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-4 pb-4 pt-3 gap-3">
        {description && (
          <p className="text-sm text-slate-500 dark:text-on-surface-variant line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-rose-600 dark:text-rose-400">{TYPE_ICON[type] || 'location_on'}</span>
            {locStr}
          </span>
          {startTime && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-rose-600 dark:text-rose-400">schedule</span>
              {startTime}
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-rose-600 dark:text-rose-400">group</span>
            {registered}/{capacity}
          </span>
        </div>

        {/* Capacity bar */}
        <div>
          <div className="h-1 w-full bg-slate-100 dark:bg-outline-variant/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : 'bg-rose-500'}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-on-surface-variant mt-1">
            {isFull ? 'Fully booked' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} remaining`}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-auto flex items-center gap-1 pt-1 text-xs font-bold text-rose-600 transition-all group-hover:gap-2 group-hover:text-rose-700 dark:text-rose-400 dark:group-hover:text-rose-300">
          {status === 'upcoming' ? (isFull ? 'Join Waitlist' : 'Register Now') : 'View Details'}
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </div>
      </div>
    </Link>
  );
}
