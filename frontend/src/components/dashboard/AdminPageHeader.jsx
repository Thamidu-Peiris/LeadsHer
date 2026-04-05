import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face&q=80';

/**
 * Rich admin page header: breadcrumbs, title, optional description, avatar menu.
 * Use under DashboardLayout (sidebar is provided by the layout).
 */
export default function AdminPageHeader({
  user,
  profileOpen,
  setProfileOpen,
  logout,
  navigate,
  breadcrumbCurrent,
  title,
  children,
  avatarSrc,
}) {
  const src = avatarSrc || user?.profilePicture || user?.avatar || FALLBACK_AVATAR;

  return (
    <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-outline mb-1">
          <Link className="hover:text-gold-accent transition-colors" to="/">
            Home
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link className="hover:text-gold-accent transition-colors" to="/dashboard">
            Dashboard
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface">{breadcrumbCurrent}</span>
        </div>
        <h1 className="font-serif-alt text-2xl font-bold text-on-surface">{title}</h1>
        {children != null && (
          <div className="text-sm text-outline mt-1 max-w-xl">
            {children}
          </div>
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/25 hover:border-gold-accent transition-colors"
        >
          <img alt="Avatar" className="w-full h-full object-cover" src={src} />
        </button>
        {profileOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white border border-outline-variant/20 editorial-shadow z-50">
            <div className="px-5 py-4 border-b border-outline-variant/15">
              <p className="text-sm font-semibold text-on-surface line-clamp-1">{user?.name || 'Admin'}</p>
              <p className="text-xs text-outline line-clamp-1">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await logout();
                  toast.success('You have signed out.');
                } finally {
                  setProfileOpen(false);
                  navigate('/');
                }
              }}
              className="w-full text-left px-5 py-3 text-sm text-tertiary hover:bg-tertiary/5 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
