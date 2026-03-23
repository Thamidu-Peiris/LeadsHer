const STEPS = [
  {
    title: 'Share Your Story',
    desc: 'Contribute to our growing library of wisdom and influence the next wave of leaders.',
    icon: (
      <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    title: 'Find a Mentor',
    desc: 'Connect with seasoned experts who match your ambition and industry focus.',
    icon: (
      <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    title: 'Join the Community',
    desc: 'Attend exclusive events and gain access to high-impact networking circles.',
    icon: (
      <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-dark-section relative">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center relative">
          {/* Dashed connector (desktop) */}
          <div className="hidden md:block absolute top-1/3 left-1/4 right-1/4 h-[1px] border-t border-dashed border-gold/30 z-0" />

          {STEPS.map(({ title, desc, icon }) => (
            <div key={title} className="flex flex-col items-center text-center max-w-xs relative z-10 mb-12 md:mb-0">
              <div className="w-20 h-20 mb-8 border border-gold/50 rounded-full flex items-center justify-center bg-dark-bg">
                {icon}
              </div>
              <h4 className="font-playfair text-xl mb-3">{title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
