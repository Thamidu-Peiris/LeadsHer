import { Fragment } from 'react';
import { Link } from 'react-router-dom';

/**
 * Inline breadcrumb trail (Home + crumbs). Used inside {@link AdminTopBar}.
 */
export function AdminBreadcrumbTrail({ crumbs = [] }) {
  return (
    <nav
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-outline"
      aria-label="Breadcrumb"
    >
      <Link className="hover:text-gold-accent transition-colors shrink-0" to="/">
        Home
      </Link>
      {crumbs.map((crumb, i) => (
        <Fragment key={i}>
          <span className="material-symbols-outlined text-[14px] shrink-0 opacity-70">chevron_right</span>
          {crumb.to ? (
            <Link className="hover:text-gold-accent transition-colors shrink-0" to={crumb.to}>
              {crumb.label}
            </Link>
          ) : (
            <span className="text-on-surface shrink-0">{crumb.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
