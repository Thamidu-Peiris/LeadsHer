import { Link, NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard',            icon: 'dashboard',     label: 'Dashboard'   },
  { to: '/dashboard/mentors',    icon: 'groups',        label: 'Mentorship'  },
  { to: '/dashboard/events',     icon: 'event',         label: 'Events'      },
  { to: '/dashboard/stories',    icon: 'auto_stories',  label: 'Stories'     },
  { to: '/dashboard/resources',  icon: 'library_books', label: 'Resources'   },
  { to: '/dashboard/forum',      icon: 'forum',         label: 'Forum'       },
  { to: '/dashboard/settings',   icon: 'settings',      label: 'Settings'    },
];

/**
 * Shared left sidebar for all Mentee dashboard pages.
 *
 * Props:
 *   user       – auth user object
 *   avatarSrc  – resolved avatar URL string
 */
export default function MenteeSidebar({ user, avatarSrc }) {
  const firstName = user?.name?.split(' ')?.[0] || 'Mentee';

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-outline-variant/20 bg-white dark:bg-surface-container-lowest">
      {/* ── Profile ── */}
      <div className="flex flex-col items-center gap-3 border-b border-outline-variant/20 p-6">
        <div className="relative">
          <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-rose-400 p-0.5 dark:border-rose-400">
            <img
              alt="Mentee avatar"
              className="h-full w-full rounded-full object-cover"
              src={avatarSrc}
            />
          </div>
          <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-lg text-on-surface">{firstName}</h3>
          <div className="mt-1 flex justify-center">
            <span className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-300">
              Mentee
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
                  ? 'border-rose-500 bg-rose-50 text-rose-700 dark:border-rose-400 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'border-transparent text-outline hover:bg-surface-container-low hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom CTA ── */}
      <div className="mt-auto border-t border-outline-variant/20 p-4">
        <Link
          to="/dashboard/mentors"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-black py-3 text-xs font-bold uppercase text-white transition-colors hover:bg-neutral-900 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          FIND A MENTOR
        </Link>
      </div>
    </aside>
  );
}
