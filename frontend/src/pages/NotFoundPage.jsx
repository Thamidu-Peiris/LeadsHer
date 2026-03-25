import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="text-8xl font-display font-bold text-brand-200">404</p>
      <h1 className="mt-4 text-2xl font-display font-semibold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-500 max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary mt-8">← Back to home</Link>
    </div>
  );
}
