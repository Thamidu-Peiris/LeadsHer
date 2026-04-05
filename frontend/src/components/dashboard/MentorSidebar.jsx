import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard',            icon: 'dashboard',     label: 'Dashboard'   },
  { to: '/dashboard/stories',    icon: 'auto_stories',  label: 'Stories'     },
  { to: '/dashboard/mentorship', icon: 'groups',        label: 'Mentorship'  },
  { to: '/dashboard/events',     icon: 'event',         label: 'Events'      },
  { to: '/dashboard/resources',  icon: 'library_books', label: 'Resources'   },
  { to: '/dashboard/forum',      icon: 'forum',         label: 'Forum'       },
  { to: '/dashboard/settings',   icon: 'settings',      label: 'Settings'    },
];

/**
 * Shared left sidebar for all Mentor dashboard pages.
 *
 * Props:
 *   user          – auth user object
 *   mentorProfile – mentor profile doc (used for isAvailable dot colour)
 *   avatarSrc     – resolved avatar URL string
 */
export default function MentorSidebar({ user, mentorProfile, avatarSrc }) {
  const firstName = user?.name?.split(' ')?.[0] || 'Mentor';

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-outline-variant/20 bg-white dark:bg-surface-container-lowest">
      {/* ── Profile ── */}
      <div className="flex flex-col items-center gap-3 border-b border-outline-variant/20 p-6">
        <div className="relative">
          <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-rose-500 p-0.5 dark:border-rose-400">
            <img
              alt="User avatar"
              className="h-full w-full rounded-full object-cover"
              src={avatarSrc}
            />
          </div>
          <span
            className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
              mentorProfile?.isAvailable ? 'bg-green-500' : 'bg-red-500'
            }`}
            title={mentorProfile?.isAvailable ? 'Available' : 'Unavailable'}
          />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-lg text-on-surface">{firstName}</h3>
          <div className="mt-1 flex justify-center">
            <span className="rounded-full border border-rose-200 bg-rose-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:border-rose-800/50 dark:bg-rose-500/15 dark:text-rose-400">
              Mentor
            </span>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg border-l-2 px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'border-rose-500 bg-rose-500/5 text-rose-600 dark:border-rose-400 dark:bg-rose-500/10 dark:text-rose-400'
                  : 'border-transparent text-outline hover:bg-surface-container-low hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}
