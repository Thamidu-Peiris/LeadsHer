import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MARQUEE_WORDS = [
  { text: 'Leadership', dot: 'text-primary' },
  { text: 'Mentorship', dot: 'text-tertiary' },
  { text: 'Stories', dot: 'text-primary' },
  { text: 'Community', dot: 'text-tertiary' },
  { text: 'Growth', dot: 'text-primary' },
  { text: 'Resilience', dot: 'text-tertiary' },
  { text: 'Vision', dot: 'text-primary' },
];

const HERO_PROFILES = [
  {
    name: 'Elena Vance',
    role: 'Chief Design Officer',
    location: 'London, UK',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=700&h=900&fit=crop&crop=face&q=80',
    rotate: 'rotate-3',
    pos: 'absolute top-0 right-10 w-72 z-30',
    h: 'h-80',
  },
  {
    name: 'Margot Chen',
    role: 'Global Creative Lead',
    location: 'Paris, FR',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=700&h=900&fit=crop&crop=face&q=80',
    rotate: '-rotate-6',
    pos: 'absolute top-20 left-10 w-64 z-20',
    h: 'h-72',
  },
  {
    name: 'Sloane Harper',
    role: 'Founding Partner, Vesper',
    location: 'New York, NY',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=700&h=900&fit=crop&crop=face&q=80',
    rotate: 'rotate-1',
    pos: 'absolute bottom-0 right-20 w-64 z-40',
    h: 'h-64',
  },
];

export default function Hero() {
  const { isAuthenticated } = useAuth();

  return (
    <header
      className="relative min-h-screen flex items-center pt-24 overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #FFE6F0 0%, #FFD5E8 38%, #F8C6E2 72%, #F1CFF0 100%)',
      }}
    >
      {/* Hero gradient */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 74% 26%, rgba(235,67,147,0.22) 0%, rgba(198,88,188,0.10) 48%, rgba(255,255,255,0.25) 100%), radial-gradient(circle at 18% 78%, rgba(255,105,180,0.16) 0%, rgba(255,192,203,0.06) 45%, rgba(255,255,255,0) 70%)',
        }}
      />
      {/* Geometric line art */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="100" x2="100" y2="0"  stroke="#7B5BBE" strokeWidth="0.05" />
          <line x1="-20" y1="80" x2="80" y2="-20" stroke="#D4748F" strokeWidth="0.05" />
          <line x1="20" y1="120" x2="120" y2="20" stroke="#7B5BBE" strokeWidth="0.05" />
        </svg>
      </div>

      <div className="relative container mx-auto px-8 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10">
        {/* Left copy */}
        <div className="max-w-2xl">
          <h1 className="font-headline text-[72px] md:text-[96px] leading-[0.9] tracking-tighter mb-8 text-on-surface">
            Where Women Lead.{' '}
            <br />
            <span className="italic text-tertiary-container">
              Where Stories Ignite.
            </span>
          </h1>
          <p className="font-body text-xl text-on-surface-variant leading-relaxed mb-12 max-w-lg">
            A curated ecosystem for the modern female architect of change. Bridging ambition and legacy through editorial insight and shared wisdom.
          </p>

          <div className="flex flex-col sm:flex-row gap-6">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard/stories/new" className="btn-primary shadow-lg shadow-primary/10">
                  Write a Story
                </Link>
                <Link to="/mentors" className="btn-outline">
                  Find a Mentor
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary shadow-lg shadow-primary/10">
                  Begin Your Journey
                </Link>
                <Link to="/stories" className="btn-outline">
                  Explore Archives
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Floating collage */}
        <div className="relative h-[580px] hidden lg:block">
          {HERO_PROFILES.map((p) => (
            <div
              key={p.name}
              className={`${p.pos} bg-surface-container-lowest p-4 editorial-shadow border border-primary/10 transform ${p.rotate}`}
            >
              <div className="relative">
                <div className="absolute -top-2 -left-2 w-full h-full border border-gold-accent/40 pointer-events-none" />
                <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-gold-accent/80 z-10" />
                <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-gold-accent/80 z-10" />
              </div>
              <div
                className={`relative w-full ${p.h} mb-4 flex items-end p-3 overflow-hidden border border-gold-accent/50`}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                <span className="font-label text-[9px] tracking-widest uppercase bg-secondary-container/40 text-on-surface px-2 py-1">
                  {p.location}
                </span>
              </div>
              <div className="space-y-0.5 pb-1">
                <h4 className="font-serif-alt text-lg">{p.name}</h4>
                <p className="font-body text-xs text-on-surface-variant">{p.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom marquee */}
      <div className="absolute bottom-0 w-full py-5 bg-surface-container-low border-y border-outline-variant/10 overflow-hidden">
        <div className="marquee">
          {[0, 1].map((i) => (
            <div key={i} className="marquee-content font-label text-xs tracking-[0.4em] uppercase text-on-surface-variant/60">
              {MARQUEE_WORDS.map(({ text, dot }) => (
                <span key={text} className="flex items-center gap-3">
                  {text}
                  <span className={`${dot} text-base`}>•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
