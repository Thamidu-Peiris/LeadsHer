import { useEffect, useRef, useState } from 'react';

const STATS = [
  { value: 24, label: 'Global Members', unit: 'K' },
  { value: 150, label: 'Expert Mentors', suffix: '+' },
  { value: 42, label: 'Cities Represented' },
  { value: 12, label: 'Annual Impact', unit: 'M' },
];

function formatStatValue(value, unit, suffix) {
  return `${value}${unit || ''}${suffix || ''}`;
}

export default function StatsSection() {
  const sectionRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [counts, setCounts] = useState(STATS.map(() => 0));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    const durationMs = 1700;
    const stepMs = 25;
    const totalSteps = Math.ceil(durationMs / stepMs);
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep += 1;
      const progress = Math.min(currentStep / totalSteps, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      setCounts(
        STATS.map((stat) => Math.round(stat.value * eased))
      );

      if (progress >= 1) clearInterval(timer);
    }, stepMs);

    return () => clearInterval(timer);
  }, [hasStarted]);

  return (
    <section ref={sectionRef} className="py-16 bg-white dark:bg-[#130f1c]">
      <div className="container mx-auto px-8 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center items-center">
          {STATS.map(({ label, unit, suffix }, i) => (
            <div key={label} className={`relative px-6 group rounded-xl py-4 ${i < STATS.length - 1 ? '' : ''}`}>
              <h3 className="font-serif-alt text-6xl text-primary-container dark:text-rose-300 mb-2 transition-all group-hover:scale-105">
                {formatStatValue(counts[i], unit, suffix)}
              </h3>
              <p className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant dark:text-rose-100/80">
                {label}
              </p>
              {i < STATS.length - 1 && (
                <div className="hidden md:block absolute right-0 top-1/4 h-1/2 w-px bg-outline-variant/30 dark:bg-rose-300/25" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
