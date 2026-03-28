function formatNum(n) {
  if (n == null || Number.isNaN(Number(n))) return '0';
  return Number(n).toLocaleString();
}

/**
 * Compact dashboard stat row: white cards, label + gold icon, clear sans-serif metrics.
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
          className="bg-white border border-outline-variant/20 rounded-xl px-4 py-3 flex flex-col gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-outline font-sans-modern leading-tight">
              {card.label}
            </p>
            <span
              className="material-symbols-outlined text-gold-accent text-[20px] shrink-0 -mt-0.5"
              style={
                card.iconFill ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined
              }
              aria-hidden
            >
              {card.icon}
            </span>
          </div>
          <p className="text-[1.65rem] font-sans-modern font-bold text-on-surface tabular-nums leading-none tracking-tight">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
