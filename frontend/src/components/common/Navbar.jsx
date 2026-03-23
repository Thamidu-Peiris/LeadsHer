import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { to: '/stories', label: 'Stories' },
  { to: '/events',  label: 'Events' },
  { to: '/mentors', label: 'Mentors' },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
    setDropOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-dark-bg/95 backdrop-blur border-b border-gold/10">
      <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-cormorant text-2xl tracking-tight text-white hover:text-gold transition-colors">
          LeadsHer.
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `px-4 py-2 text-xs font-montserrat font-semibold uppercase tracking-widest transition-colors ${
                    isActive ? 'text-gold' : 'text-gray-400 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-eight border border-gold/20 hover:border-gold/50 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center text-black font-bold text-xs">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-montserrat text-gray-300">{user?.name?.split(' ')[0]}</span>
                <svg className="w-3 h-3 text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-dark-card border border-gold/20 rounded-eight py-1 z-50 shadow-xl">
                  <Link to="/dashboard" onClick={() => setDropOpen(false)}
                    className="block px-4 py-2.5 text-xs text-gray-300 hover:text-gold hover:bg-white/5 font-montserrat uppercase tracking-wider">
                    Dashboard
                  </Link>
                  <Link to="/profile" onClick={() => setDropOpen(false)}
                    className="block px-4 py-2.5 text-xs text-gray-300 hover:text-gold hover:bg-white/5 font-montserrat uppercase tracking-wider">
                    Profile
                  </Link>
                  <hr className="my-1 border-gold/10" />
                  <button onClick={handleLogout}
                    className="block w-full text-left px-4 py-2.5 text-xs text-dusty-rose hover:bg-white/5 font-montserrat uppercase tracking-wider">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login"
                className="text-xs font-montserrat font-semibold uppercase tracking-widest text-gray-400 hover:text-white transition-colors px-2 py-2">
                Log in
              </Link>
              <Link to="/register" className="btn-gold text-xs px-5 py-2.5">
                Join Now
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gold/10 bg-dark-bg px-6 py-4 space-y-1">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 text-xs font-montserrat font-semibold uppercase tracking-widest rounded-eight ${
                  isActive ? 'text-gold bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <hr className="border-gold/10 my-3" />
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-xs text-gray-300 font-montserrat uppercase tracking-widest hover:text-gold">
                Dashboard
              </Link>
              <button onClick={handleLogout}
                className="block w-full text-left px-3 py-2.5 text-xs text-dusty-rose font-montserrat uppercase tracking-widest">
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-3 pt-1">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary flex-1 text-center text-xs py-2.5">Log in</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-gold flex-1 text-center text-xs py-2.5">Join Now</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
