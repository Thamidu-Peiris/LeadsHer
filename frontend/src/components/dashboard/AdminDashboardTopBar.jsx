import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * Sticky header for the main Admin dashboard shell (index, manage account, mentorship sub-routes).
 * Does not include the theme toggle — those routes use this bespoke bar instead of DashboardTopBar.
 */
export default function AdminDashboardTopBar({
  user,
  firstName,
  profileOpen,
  setProfileOpen,
  logout,
  navigate,
  isManageMentorsRoute,
  isManageAccountRoute,
  isViewAllMentorshipRequests,
  isViewAllActiveMentorship,
}) {
  if (isManageMentorsRoute) {
    return (
      <header className="relative w-full h-16 min-h-[64px] sticky top-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 border-b border-outline-variant/20">
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-outline shrink-0 min-w-0 font-sans-modern">
          <Link className="hover:text-primary transition-colors" to="/">
            Home
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link className="hover:text-primary transition-colors" to="/dashboard">
            Dashboard
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          {isViewAllMentorshipRequests ? (
            <>
              <Link
                className="hover:text-primary transition-colors"
                to="/dashboard/manage-mentors"
              >
                Mentorship
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface">All Requests</span>
            </>
          ) : isViewAllActiveMentorship ? (
            <>
              <Link
                className="hover:text-primary transition-colors"
                to="/dashboard/manage-mentors"
              >
                Mentorship
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface">All Active</span>
            </>
          ) : (
            <span className="text-on-surface">Mentorship</span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4 ml-auto shrink-0">
          <div className="flex items-center gap-3 pl-1 sm:pl-2">
            <div className="text-right hidden lg:block">
              <p className="text-xs font-bold text-on-surface font-sans-modern">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-on-surface-variant font-sans-modern">Global Admin</p>
            </div>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-gold-accent/30"
            >
              <img
                alt=""
                className="w-9 h-9 rounded-full object-cover ring-2 ring-gold-accent/20"
                src={
                  user?.profilePicture ||
                  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face&q=80'
                }
              />
            </button>
          </div>
        </div>
        {profileOpen && (
          <div className="absolute right-8 top-14 w-56 bg-white border border-outline-variant/20 z-[60] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant/15">
              <p className="text-sm font-semibold text-on-surface line-clamp-1 font-sans-modern">{user?.name || 'Admin'}</p>
              <p className="text-xs text-outline line-clamp-1 font-sans-modern">{user?.email}</p>
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
              className="w-full text-left px-5 py-3 text-sm text-tertiary hover:bg-tertiary/5 transition-colors flex items-center gap-2 font-sans-modern"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign out
            </button>
          </div>
        )}
      </header>
    );
  }

  return (
    <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white/80 dark:bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
      <div>
        <div
          className={`flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-outline ${
            isManageMentorsRoute ? '' : 'mb-1'
          }`}
        >
          <Link className="hover:text-gold-accent transition-colors" to="/">
            Home
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link className="hover:text-gold-accent transition-colors" to="/dashboard">
            Dashboard
          </Link>
          {isManageAccountRoute && (
            <>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface">Manage Account</span>
            </>
          )}
        </div>
        {isManageAccountRoute ? (
          <>
            <h1 className="font-serif-alt text-2xl font-bold text-on-surface">Manage User Account</h1>
            <p className="text-xs text-outline uppercase tracking-widest">Mentor & mentee profile management</p>
          </>
        ) : (
          <>
            <h1 className="font-serif-alt text-2xl font-bold text-on-surface">Welcome, {firstName}</h1>
            <p className="text-xs text-outline uppercase tracking-widest">Role: Admin · {user?.email}</p>
          </>
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/25 hover:border-gold-accent transition-colors"
        >
          <img
            alt="Avatar"
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face&q=80"
          />
        </button>
        {profileOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white border border-outline-variant/20 z-50">
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
