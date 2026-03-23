import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CallToAction() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return null;

  return (
    <section className="py-32 bg-primary text-white text-center">
      <div className="container mx-auto px-8 md:px-12 max-w-3xl">
        <p className="font-label text-[10px] tracking-[0.4em] uppercase text-white/60 mb-6">
          Your story matters
        </p>
        <h2 className="font-headline text-5xl md:text-6xl italic mb-6 leading-tight">
          Ready to Share Your Voice?
        </h2>
        <p className="font-body text-white/70 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
          Join thousands of women sharing their leadership journeys and inspiring the next generation of change-makers.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link to="/register"
            className="bg-white text-primary px-10 py-4 font-label text-xs tracking-[0.2em] uppercase hover:bg-white/90 transition-all active:scale-[0.98]">
            Create Free Account
          </Link>
          <Link to="/stories"
            className="border border-white/30 text-white px-10 py-4 font-label text-xs tracking-[0.2em] uppercase hover:bg-white/10 transition-all">
            Explore Stories
          </Link>
        </div>
      </div>
    </section>
  );
}
