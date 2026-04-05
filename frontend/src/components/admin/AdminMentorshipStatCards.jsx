function formatNum(n) {
  if (n == null || Number.isNaN(Number(n))) return '0';
  return Number(n).toLocaleString();
}

/**
 * Compact dashboard stat row: white cards, label + accent icon, clear sans-serif metrics.
 */
export default function AdminMentorshipStatCards({
  totalRequests,
  activeMentorships,
  completionRate,
  mentorRating,
}) {
  const rate = Number(completionRate) || 0;
  const rating = Number(mentorRating) || 0;
  const completionDisplay = `${rate.toFixed(1)}%`;
  const ratingDisplay = rating > 0 ? rating.toFixed(2) : '—';

  const cards = [
    {
      label: 'Total requests',
      value: formatNum(totalRequests),
      icon: 'report',
    },
    {
      label: 'Active mentorships',
      value: formatNum(activeMentorships),
      icon: 'groups',
    },
    {
      label: 'Completion rate',
      value: completionDisplay,
      icon: 'check_circle',
    },
    {
      label: 'Mentor rating',
      value: ratingDisplay,
      icon: 'star',
      iconFill: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex min-h-[6.5rem] flex-col justify-between gap-2 rounded-xl border border-outline-variant/20 bg-white px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] sm:min-h-[7rem]"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-sans-modern text-[11px] font-bold uppercase leading-tight tracking-widest text-outline">
              {card.label}
            </p>
            <span
              className="material-symbols-outlined -mt-0.5 shrink-0 text-[20px] text-[#f43f5e]"
              style={
                card.iconFill ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined
              }
              aria-hidden
            >
              {card.icon}
            </span>
          </div>
          <p className="font-sans-modern text-[1.65rem] font-bold tabular-nums leading-none tracking-tight text-on-surface sm:text-[1.7rem]">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
