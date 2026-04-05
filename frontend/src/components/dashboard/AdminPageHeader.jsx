import AdminTopBar from './AdminTopBar';

/**
 * Admin pages: full top bar (breadcrumbs + theme + profile), then title row below.
 *
 * @param crumbs — after Home (e.g. Dashboard link + current page).
 */
export default function AdminPageHeader({
  crumbs = [],
  title,
  children,
  user,
  profileOpen,
  setProfileOpen,
  avatarSrc,
  /** When true, only breadcrumbs + top bar render (use a page-level title card below). */
  hideTitleRow = false,
}) {
  return (
    <>
      <AdminTopBar
        crumbs={crumbs}
        user={user}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        avatarSrc={avatarSrc}
      />
      {!hideTitleRow && (
        <div className="px-4 sm:px-8 pt-3 pb-2">
          <h1 className="font-serif-alt text-2xl font-bold text-on-surface">{title}</h1>
          {children != null && <div className="text-sm text-outline mt-1 max-w-xl">{children}</div>}
        </div>
      )}
    </>
  );
}
