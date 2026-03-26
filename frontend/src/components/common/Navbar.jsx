import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navLinks = [
  { to: '/',         label: 'Home' },
  { to: '/stories',  label: 'Stories' },
  { to: '/events',   label: 'Events' },
  { to: '/mentors',  label: 'Mentors' },
];

export default function Navbar() {
  const { isAuthenticated, user, logout, isMentee } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const avatarSrc = user?.profilePicture || user?.avatar || '';

  const handleLogout = async () => {
    await logout();
    toast.success('You have signed out.');
    navigate('/');
    setDropOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-nav border-b border-outline-variant/10 shadow-none">
      <div className="flex justify-between items-center px-8 md:px-12 py-5">
        {/* Logo */}
        <Link to="/" className="font-headline text-3xl font-bold tracking-tighter text-on-surface">
          LEADSHER
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex gap-10">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `font-sans-modern text-base font-normal tracking-wide transition-colors duration-200 ${
                    isActive
                      ? 'text-primary border-b border-primary/30'
                      : 'text-on-surface-variant hover:text-primary'
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
                className="flex items-center gap-2 font-label text-xs tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-container flex items-center justify-center text-white font-bold text-sm">
                  {avatarSrc ? (
                    <img alt="" src={avatarSrc} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                {user?.name?.split(' ')[0]}
              </button>
              {dropOpen && (
                <div className="absolute right-0 mt-3 w-44 bg-surface-container-lowest border border-outline-variant/20 editorial-shadow z-50">
                  <Link to="/dashboard" onClick={() => setDropOpen(false)}
                    className="block px-5 py-3 font-label text-[11px] tracking-widest uppercase text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors">
                    Dashboard
                  </Link>
                  {isMentee && (
                    <Link to="/dashboard/profile" onClick={() => setDropOpen(false)}
                      className="block px-5 py-3 font-label text-[11px] tracking-widest uppercase text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors">
                      Profile
                    </Link>
                  )}
                  <Link to="/dashboard/stories/new" onClick={() => setDropOpen(false)}
                    className="block px-5 py-3 font-label text-[11px] tracking-widest uppercase text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors">
                    Write Story
                  </Link>
                  <hr className="border-outline-variant/20" />
                  <button onClick={handleLogout}
                    className="block w-full text-left px-5 py-3 font-label text-[11px] tracking-widest uppercase text-tertiary hover:bg-tertiary/5 transition-colors">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login"
                className="font-label text-xs tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors">
                Sign In
              </Link>
              <Link to="/register"
                className="bg-primary text-white px-6 py-2 font-label text-xs tracking-widest uppercase hover:opacity-90 transition-opacity active:scale-[0.98]">
                Join
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 text-on-surface-variant" onClick={() => setMenuOpen((v) => !v)}>
          <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-outline-variant/10 bg-surface-container-lowest px-8 py-6 space-y-4">
          {navLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block font-sans-modern text-base font-medium tracking-wide ${isActive ? 'text-primary' : 'text-on-surface-variant'}`
              }
            >{label}</NavLink>
          ))}
          <hr className="border-outline-variant/20 my-4" />
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}
                className="block font-label text-xs tracking-widest uppercase text-on-surface-variant">Dashboard</Link>
              {isMentee && (
                <Link to="/dashboard/profile" onClick={() => setMenuOpen(false)}
                  className="block font-label text-xs tracking-widest uppercase text-on-surface-variant">Profile</Link>
              )}
              <button onClick={handleLogout}
                className="block font-label text-xs tracking-widest uppercase text-tertiary">Sign Out</button>
            </>
          ) : (
            <div className="flex gap-3 pt-2">
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center border border-outline-variant py-3 font-label text-xs tracking-widest uppercase text-on-surface-variant">Sign In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center bg-primary text-white py-3 font-label text-xs tracking-widest uppercase">Join</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
