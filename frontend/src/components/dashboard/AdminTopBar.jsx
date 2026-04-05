import { useState } from 'react';
import { AdminBreadcrumbTrail } from './AdminBreadcrumbBar';
import AdminUserMenu from './AdminUserMenu';
import { useTheme } from '../../context/ThemeContext';

/**
 * Admin sticky top bar: breadcrumbs (left) + optional actions + dark mode + profile.
 */
export default function AdminTopBar({
  crumbs = [],
  children,
  user,
  profileOpen: controlledOpen,
  setProfileOpen: setControlledOpen,
  avatarSrc,
}) {
  const { theme, toggleTheme } = useTheme();
  const [internalOpen, setInternalOpen] = useState(false);
  const profileOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setProfileOpen = setControlledOpen ?? setInternalOpen;

  return (
    <header className="h-16 min-h-[64px] shrink-0 border-b border-outline-variant/20 bg-white dark:bg-surface-container-lowest sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1 overflow-hidden">
        <AdminBreadcrumbTrail crumbs={crumbs} />
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {children}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center border border-[#f43f5e]/45 text-outline hover:text-[#f43f5e] hover:border-[#f43f5e] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/35"
        >
          <span className="material-symbols-outlined text-[20px]">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
        <AdminUserMenu
          user={user}
          open={profileOpen}
          onOpenChange={setProfileOpen}
          avatarSrc={avatarSrc}
        />
      </div>
    </header>
  );
}
