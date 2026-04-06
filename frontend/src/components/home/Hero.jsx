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
    name: 'Margot Chen',
    role: 'Global Creative Lead',
    location: 'Paris, FR',
    image: 'https://images.unsplash.com/photo-1690444963408-9573a17a8058?w=700&h=900&fit=crop&q=80',
    rotate: '-rotate-6',
    pos: 'absolute top-20 left-10 w-64 z-20',
    h: 'h-72',
  },
  {
    name: 'Elena Vance',
    role: 'Chief Design Officer',
    location: 'London, UK',
    image:
      'https://images.unsplash.com/photo-1665065950598-3993c1331626?w=700&h=900&fit=crop&q=80',
    rotate: 'rotate-3',
    pos: 'absolute top-0 right-10 w-72 z-30',
    h: 'h-80',
  },
  {
    name: 'Sloane Harper',
    role: 'Founding Partner, Vesper',
    location: 'New York, NY',
    image:
      'https://images.unsplash.com/photo-1685541003882-7328ef51bac8?w=700&h=900&fit=crop&q=80',
    rotate: 'rotate-1',
    pos: 'absolute bottom-0 right-40 w-64 z-40',
    h: 'h-64',
  },
];

export default function Hero() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="relative min-h-screen flex items-center pt-24 overflow-hidden bg-gradient-to-br from-[#ffe6f0] via-[#ffd5e8] to-[#ffe4e9] dark:bg-gradient-to-br dark:from-[#140714] dark:via-[#1c0a1f] dark:to-[#0f0b1a]">
      {/* Hero gradient */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 74% 26%, rgba(235,67,147,0.22) 0%, rgba(225,29,72,0.10) 48%, rgba(255,255,255,0.25) 100%), radial-gradient(circle at 18% 78%, rgba(255,105,180,0.16) 0%, rgba(255,192,203,0.06) 45%, rgba(255,255,255,0) 70%)',
        }}
      />
      {/* Geometric line art */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="100" x2="100" y2="0"  stroke="#E11D48" strokeWidth="0.05" />
          <line x1="-20" y1="80" x2="80" y2="-20" stroke="#D4748F" strokeWidth="0.05" />
          <line x1="20" y1="120" x2="120" y2="20" stroke="#E11D48" strokeWidth="0.05" />
        </svg>
      </div>

      <div className="relative container mx-auto px-8 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10">
        {/* Left copy */}
        <div className="max-w-2xl">
          <h1 className="font-headline text-[72px] md:text-[96px] leading-[0.9] tracking-tighter mb-8 text-on-surface dark:text-rose-50">
            Where Women Lead.{' '}
            <br />
            <span className="italic text-tertiary-container dark:text-rose-300">
              Where Stories Ignite.
            </span>
          </h1>
          <p className="font-body text-xl text-[#475569] dark:text-rose-100/90 leading-relaxed mb-12 max-w-lg">
            A curated ecosystem for the modern female architect of change. Bridging ambition and legacy through editorial insight and shared wisdom.
          </p>

          <div className="flex flex-col sm:flex-row gap-6">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard/stories/new" className="btn-primary shadow-lg shadow-primary/10">
                  Write a Story
                </Link>
                <Link to="/mentors" className="btn-outline-white-rose">
                  Find a Mentor
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary shadow-lg shadow-primary/10">
                  Begin Your Journey
                </Link>
                <Link to="/stories" className="btn-explore-archives">
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
              className={`${p.pos} bg-surface-container-lowest dark:bg-[#3b1026] p-4 editorial-shadow border border-primary/10 dark:border-[#f43f5e]/45 transform ${p.rotate}`}
            >
              <div className="relative">
                <div className="absolute -top-2 -left-2 w-full h-full border border-gold-accent/40 dark:border-[#f43f5e]/45 pointer-events-none" />
                <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-gold-accent/80 dark:border-[#f43f5e]/80 z-10" />
                <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-gold-accent/80 dark:border-[#f43f5e]/80 z-10" />
              </div>
              <div
                className={`relative w-full ${p.h} mb-4 flex items-end p-3 overflow-hidden border border-gold-accent/50 dark:border-[#f43f5e]/55`}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                <span className="font-label text-[9px] tracking-widest uppercase bg-secondary-container/40 dark:bg-[#f43f5e]/25 text-on-surface dark:text-rose-100 px-2 py-1">
                  {p.location}
                </span>
              </div>
              <div className="space-y-0.5 pb-1">
                <h4 className="font-serif-alt text-lg dark:text-rose-50">{p.name}</h4>
                <p className="font-body text-xs text-on-surface-variant dark:text-rose-200/85">{p.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom marquee */}
      <div className="absolute bottom-0 w-full py-5 bg-white/70 dark:bg-[#220f2a]/80 border-y border-outline-variant/10 dark:border-rose-300/20 overflow-hidden">
        <div className="marquee">
          {[0, 1].map((i) => (
            <div key={i} className="marquee-content font-label text-xs tracking-[0.4em] uppercase text-on-surface-variant/70 dark:text-rose-100/70">
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
