import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CallToAction() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return null;

  return (
    <section className="py-20 bg-gradient-to-br from-brand-600 to-brand-800 text-white text-center">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
          Ready to share your story?
        </h2>
        <p className="text-brand-200 text-lg mb-8">
          Join thousands of women who are sharing their leadership journeys and inspiring the next generation.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/register" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 px-8 py-3 text-base">
            Create Free Account
          </Link>
          <Link to="/stories" className="btn-secondary border-white/30 text-white hover:bg-white/10 px-8 py-3 text-base">
            Explore Stories
          </Link>
        </div>
      </div>
    </section>
  );
}
