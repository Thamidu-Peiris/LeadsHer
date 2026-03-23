import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Hero() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-accent-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="max-w-3xl">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-brand-600/50 text-brand-200 border border-brand-500/40 mb-6">
            🌸 Empowering Women Leaders
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Amplify Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-accent-400">
              Leadership
            </span>{' '}
            Story
          </h1>
          <p className="mt-6 text-lg text-brand-200 leading-relaxed max-w-2xl">
            LeadsHer connects women leaders through storytelling, mentorship, and community. Share your journey, find inspiration, and grow together.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/stories/new" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 text-base px-8 py-3">
                  Share Your Story
                </Link>
                <Link to="/mentors" className="btn-secondary border-white/30 text-white hover:bg-white/10 text-base px-8 py-3">
                  Find a Mentor
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 text-base px-8 py-3">
                  Join LeadsHer
                </Link>
                <Link to="/stories" className="btn-secondary border-white/30 text-white hover:bg-white/10 text-base px-8 py-3">
                  Read Stories
                </Link>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="mt-16 flex flex-wrap gap-8">
            {[
              { value: '500+', label: 'Stories Shared' },
              { value: '200+', label: 'Active Mentors' },
              { value: '50+', label: 'Events Hosted' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-display font-bold text-white">{value}</p>
                <p className="text-sm text-brand-300">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
