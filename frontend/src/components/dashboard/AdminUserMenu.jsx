import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const FALLBACK =
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face&q=80';

/**
 * Avatar button + sign-out dropdown for admin pages (used below breadcrumb bar).
 */
export default function AdminUserMenu({
  user,
  open,
  onOpenChange,
  avatarSrc,
  buttonClassName = 'w-10 h-10 rounded-full overflow-hidden border border-[#f43f5e]/45 hover:border-[#f43f5e] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/35',
  menuClassName = 'absolute right-0 mt-3 w-56 bg-white dark:bg-surface-container border border-outline-variant/20 z-50 rounded-xl overflow-hidden',
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const src = avatarSrc || user?.profilePicture || user?.avatar || FALLBACK;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={buttonClassName}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <img alt="" className="w-full h-full object-cover rounded-full" src={src} />
      </button>
      {open && (
        <div role="menu" className={menuClassName}>
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
                onOpenChange(false);
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
  );
}
