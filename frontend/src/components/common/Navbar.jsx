import { useState } from 'react';
import { Link, NavLink, useMatch, useNavigate, useResolvedPath } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/stories', label: 'Stories' },
  { to: '/events', label: 'Events' },
  { to: '/mentors', label: 'Mentors' },
  { to: '/resources', label: 'Resources' },
  { to: '/forum', label: 'Discussion' },
];

function AnimatedNavLink({ to, label, end, onClick, className = '' }) {
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end: !!end });
  const isActive = !!match;

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={[
        'group relative inline-block pb-1 font-sans-modern text-base font-bold tracking-normal transition-colors duration-200',
        isActive
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-neutral-950 dark:text-neutral-100',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
      <span
        aria-hidden
        className={[
          'pointer-events-none absolute bottom-0 left-0 h-[2px] w-full origin-left rounded-full',
          'transition-transform duration-300 ease-out motion-reduce:duration-150',
          isActive
            ? 'hidden'
            : 'scale-x-0 bg-rose-500 group-hover:scale-x-100 dark:bg-rose-400',
        ].join(' ')}
      />
    </NavLink>
  );
}

export default function Navbar() {
  const { isAuthenticated, user, logout, isMentee } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const avatarSrc = user?.profilePicture || user?.avatar || '';
  const canWriteStory = user?.role === 'mentor' || user?.role === 'admin';

  const handleLogout = async () => {
    await logout();
    toast.success('You have signed out.');
    navigate('/');
    setDropOpen(false);
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-outline-variant/10 bg-white shadow-none dark:bg-surface-container-lowest">
      <div className="flex justify-between items-center px-8 md:px-12 py-5">
        {/* Logo */}
        <Link to="/" className="font-headline text-3xl font-bold tracking-tighter text-on-surface">
          LEADSHER
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex gap-10 items-center">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <AnimatedNavLink to={to} label={label} end={to === '/'} />
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-on-surface-variant transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="material-symbols-outlined text-[22px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropOpen((v) => !v)}
                className="flex items-center gap-2 font-label text-xs tracking-widest uppercase text-on-surface-variant transition-colors"
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
                    className="block px-5 py-3 font-label text-[11px] tracking-widest uppercase text-on-surface-variant hover:bg-surface-container-low transition-colors">
                    Dashboard
                  </Link>
                  {isMentee && (
                    <Link to="/dashboard/profile" onClick={() => setDropOpen(false)}
                      className="block px-5 py-3 font-label text-[11px] tracking-widest uppercase text-on-surface-variant hover:bg-surface-container-low transition-colors">
                      Profile
                    </Link>
                  )}
                  {canWriteStory && (
                    <Link to="/dashboard/stories/new" onClick={() => setDropOpen(false)}
                      className="block px-5 py-3 font-label text-[11px] tracking-widest uppercase text-on-surface-variant hover:bg-surface-container-low transition-colors">
                      Write Story
                    </Link>
                  )}
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
                className="font-label text-xs font-bold tracking-widest uppercase text-on-surface-variant transition-colors">
                Sign In
              </Link>
              <Link to="/register"
                className="bg-rose-500 px-6 py-2 font-label text-xs font-bold tracking-widest uppercase text-white shadow-sm shadow-rose-500/25 transition-colors hover:bg-rose-600 active:scale-[0.98] dark:bg-rose-600 dark:hover:bg-rose-500">
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
        <div className="md:hidden border-t border-outline-variant/10 bg-surface-container-lowest px-8 py-6 space-y-1">
          {navLinks.map(({ to, label }) => (
            <div key={to} className="py-1">
              <AnimatedNavLink
                to={to}
                label={label}
                end={to === '/'}
                onClick={() => setMenuOpen(false)}
                className="py-1"
              />
            </div>
          ))}
          <hr className="border-outline-variant/20 my-4" />
          {/* Theme toggle (mobile) */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 font-label text-xs tracking-widest uppercase text-on-surface-variant transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
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
                className="flex-1 text-center border border-outline-variant py-3 font-label text-xs font-bold tracking-widest uppercase text-on-surface-variant">Sign In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center bg-rose-500 py-3 font-label text-xs font-bold tracking-widest uppercase text-white shadow-sm shadow-rose-500/25 transition-colors hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500">Join</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
