const STATS = [
  { value: '2,400+', label: 'Women Leaders' },
  { value: '180+',   label: 'Mentors' },
  { value: '950+',   label: 'Stories' },
  { value: '340+',   label: 'Events' },
];

export default function StatsBar() {
  return (
    <section className="py-16 border-b border-gold/10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 text-center">
          {STATS.map(({ value, label }, i) => (
            <div
              key={label}
              className={`px-4 ${i < STATS.length - 1 ? 'border-r border-gold/20' : ''}`}
            >
              <div className="font-playfair text-4xl text-gold mb-2">{value}</div>
              <div className="font-montserrat text-[10px] uppercase tracking-widest text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
