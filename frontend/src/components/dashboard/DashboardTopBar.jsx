import { Fragment, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80';

/**
 * Shared sticky top bar for all dashboard pages.
 *
 * Props:
 *   crumbs      – Array of { label, to? }.
 *                 "Home" is always the first item, auto-prepended.
 *                 The last item is rendered as plain text (current page).
 *   children    – Optional action nodes rendered to the LEFT of the avatar.
 *   showAvatar  – boolean (default true). Set false for pages that only need breadcrumbs.
 */
export default function DashboardTopBar({ crumbs = [], children, showAvatar = true }) {
  const { user, isMentee, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const avatarSrc = user?.profilePicture || user?.avatar || FALLBACK_AVATAR;

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('You have signed out.');
    } finally {
      setOpen(false);
      navigate('/');
    }
  };

  return (
    <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white dark:bg-surface-container-lowest sticky top-0 z-30 px-8 flex items-center justify-between">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-outline">
        <Link className="hover:text-gold-accent transition-colors" to="/">
          Home
        </Link>
        {crumbs.map((crumb, i) => (
          <Fragment key={i}>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            {crumb.to ? (
              <Link className="hover:text-gold-accent transition-colors" to={crumb.to}>
                {crumb.label}
              </Link>
            ) : (
              <span className="text-on-surface">{crumb.label}</span>
            )}
          </Fragment>
        ))}
      </div>

      {/* Right side */}
      {(children || showAvatar) && (
        <div className="flex items-center gap-3">
          {children}

          {/* Dark mode toggle — shown on all dashboard top bars */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant/25 hover:border-gold-accent text-outline hover:text-gold-accent transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {showAvatar && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/25 hover:border-gold-accent transition-colors focus:outline-none focus:ring-2 focus:ring-gold-accent/40"
                aria-haspopup="menu"
                aria-expanded={open}
              >
                <img
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                  src={avatarSrc}
                />
              </button>

              {open && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-56 bg-white dark:bg-surface-container border border-outline-variant/20 z-50 rounded-xl overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-outline-variant/15">
                    <p className="font-sans-modern text-sm font-semibold text-on-surface line-clamp-1">
                      {user?.name || 'User'}
                    </p>
                    <p className="font-sans-modern text-xs text-outline line-clamp-1">
                      {user?.email}
                    </p>
                  </div>

                  {isMentee && (
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setOpen(false)}
                      className="block w-full text-left px-5 py-3 font-sans-modern text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      role="menuitem"
                    >
                      Profile
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left px-5 py-3 font-sans-modern text-sm text-tertiary hover:bg-tertiary/5 transition-colors flex items-center gap-2"
                    role="menuitem"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
