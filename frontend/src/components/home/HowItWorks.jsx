const STEPS = [
  {
    icon: 'self_improvement',
    title: 'Cultivate Curiosity',
    desc: 'Engage with curated stories and live sessions designed to challenge existing paradigms.',
  },
  {
    icon: 'diversity_3',
    title: 'Connect Strategically',
    desc: 'Access our private mentor network and peer circles of verified global leaders.',
  },
  {
    icon: 'auto_awesome',
    title: 'Catalyze Impact',
    desc: 'Leverage the collective resource pool to launch initiatives and scale your legacy.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-32 bg-surface-container-low">
      <div className="container mx-auto px-8 md:px-12">
        <div className="text-center mb-24">
          <h2 className="font-headline text-5xl mb-6">The Path to Presence</h2>
          <div className="w-24 h-px bg-primary mx-auto" />
        </div>

        <div className="relative">
          {/* Dashed connector line */}
          <div className="absolute top-12 left-0 w-full h-px border-t border-dashed border-tertiary-fixed-dim hidden md:block z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
            {STEPS.map(({ icon, title, desc }) => (
              <div key={title} className="text-center group">
                <div className="w-24 h-24 bg-surface-container-lowest flex items-center justify-center mx-auto mb-8 border border-outline-variant/30 group-hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-primary text-4xl">{icon}</span>
                </div>
                <h4 className="font-serif-alt text-xl mb-4">{title}</h4>
                <p className="font-body text-sm text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
