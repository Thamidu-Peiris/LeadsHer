import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CallToAction() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return null;

  return (
    <section className="py-32 bg-pink-100 text-center text-neutral-900 dark:bg-[#1a1324] dark:text-rose-50">
      <div className="container mx-auto px-8 md:px-12 max-w-3xl">
        <p className="font-label text-[10px] tracking-[0.4em] uppercase text-rose-600 mb-6 dark:text-rose-300">
          Your story matters
        </p>
        <h2 className="font-headline text-5xl md:text-6xl italic mb-6 leading-tight text-neutral-900 dark:text-rose-50">
          Ready to Share Your Voice?
        </h2>
        <p className="font-body text-neutral-700 text-lg mb-12 max-w-xl mx-auto leading-relaxed dark:text-rose-100/80">
          Join thousands of women sharing their leadership journeys and inspiring the next generation of change-makers.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link
            to="/register"
            className="rounded-lg bg-rose-600 px-10 py-4 font-label text-xs font-bold tracking-[0.2em] uppercase text-white shadow-sm shadow-rose-900/10 transition-all hover:bg-rose-700 active:scale-[0.98] dark:bg-rose-500 dark:hover:bg-rose-400"
          >
            Create Free Account
          </Link>
          <Link
            to="/stories"
            className="rounded-lg border-2 border-rose-500 bg-white px-10 py-4 font-label text-xs font-bold tracking-[0.2em] uppercase text-rose-600 shadow-sm shadow-rose-900/5 transition-all hover:bg-rose-50 hover:text-rose-700 active:scale-[0.98] dark:border-rose-400 dark:bg-surface-container-lowest dark:text-rose-200 dark:hover:bg-rose-950/50 dark:hover:text-rose-100"
          >
            Explore Stories
          </Link>
        </div>
      </div>
    </section>
  );
}
