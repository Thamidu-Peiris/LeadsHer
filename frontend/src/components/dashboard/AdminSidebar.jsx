import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard',                 icon: 'space_dashboard',  label: 'Admin Dashboard'   },
  { to: '/dashboard/manage-account',  icon: 'manage_accounts',  label: 'Manage Accounts'   },
  { to: '/dashboard/manage-stories',  icon: 'auto_stories',     label: 'Manage Stories'    },
  { to: '/dashboard/events',          icon: 'event',            label: 'Manage Events'     },
  { to: '/dashboard/manage-mentors',  icon: 'groups',           label: 'Manage Mentors'    },
  { to: '/dashboard/resources',       icon: 'library_books',    label: 'Manage Resources'  },
  { to: '/dashboard/forum',           icon: 'forum',            label: 'Manage Forum'      },
  { to: '/dashboard/settings',        icon: 'settings',         label: 'Settings'          },
];

/**
 * Shared left sidebar for all Admin dashboard pages.
 *
 * Props:
 *   user      – auth user object
 *   avatarSrc – resolved avatar URL string
 */
export default function AdminSidebar({ user, avatarSrc }) {
  const firstName = user?.name?.split(' ')?.[0] || 'Admin';

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-outline-variant/20 bg-white dark:bg-surface-container-lowest">
      {/* ── Profile ── */}
      <div className="flex flex-col items-center gap-3 border-b border-outline-variant/20 p-6">
        <div className="relative">
          <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-gold-accent p-0.5">
            <img alt="Admin avatar" className="h-full w-full rounded-full object-cover" src={avatarSrc} />
          </div>
          <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-lg text-on-surface">{firstName}</h3>
          <div className="mt-1 flex justify-center">
            <span className="rounded-full border border-gold-accent/25 bg-gold-accent/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold-accent">
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg border-l-2 px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'border-gold-accent bg-gold-accent/5 text-gold-accent'
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
