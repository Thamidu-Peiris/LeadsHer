import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="font-display font-bold text-xl text-white">LeadsHer</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Amplifying women's leadership through storytelling, mentorship, and community.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/stories" className="hover:text-white transition-colors">Stories</Link></li>
              <li><Link to="/events" className="hover:text-white transition-colors">Events</Link></li>
              <li><Link to="/mentors" className="hover:text-white transition-colors">Mentors</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Log in</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <hr className="border-white/10 mt-10 mb-6" />
        <p className="text-center text-xs text-gray-500">
          © {new Date().getFullYear()} LeadsHer. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
