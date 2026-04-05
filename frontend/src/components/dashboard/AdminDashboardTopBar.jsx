import AdminTopBar from './AdminTopBar';

function buildCrumbs({
  isManageMentorsRoute,
  isManageAccountRoute,
  isViewAllMentorshipRequests,
  isViewAllActiveMentorship,
}) {
  if (isManageMentorsRoute) {
    const base = [{ label: 'Dashboard', to: '/dashboard' }];
    if (isViewAllMentorshipRequests) {
      return [...base, { label: 'Mentorship', to: '/dashboard/manage-mentors' }, { label: 'All Requests' }];
    }
    if (isViewAllActiveMentorship) {
      return [...base, { label: 'Mentorship', to: '/dashboard/manage-mentors' }, { label: 'All Active' }];
    }
    return [...base, { label: 'Mentorship' }];
  }
  if (isManageAccountRoute) {
    return [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Manage Account' }];
  }
  return [{ label: 'Dashboard' }];
}

/**
 * Admin /dashboard shell: one top bar (breadcrumbs + theme + profile), then page heading row.
 */
export default function AdminDashboardTopBar({
  user,
  firstName,
  profileOpen,
  setProfileOpen,
  isManageMentorsRoute,
  isManageAccountRoute,
  isViewAllMentorshipRequests,
  isViewAllActiveMentorship,
}) {
  const crumbs = buildCrumbs({
    isManageMentorsRoute,
    isManageAccountRoute,
    isViewAllMentorshipRequests,
    isViewAllActiveMentorship,
  });

  return (
    <>
      <AdminTopBar
        crumbs={crumbs}
        user={user}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        avatarSrc={user?.profilePicture}
      />
      {isManageMentorsRoute ? (
        <div className="px-4 sm:px-8 pt-3 pb-2">
          <h1 className="font-serif-alt text-2xl font-bold text-on-surface">Mentorship</h1>
          <p className="text-xs text-outline uppercase tracking-widest mt-1">
            Requests, active mentorships, and mentor tools
          </p>
        </div>
      ) : isManageAccountRoute ? (
        <div className="px-4 sm:px-8 pt-3 pb-2">
          <h1 className="font-serif-alt text-2xl font-bold text-on-surface">Manage User Account</h1>
          <p className="text-xs text-outline uppercase tracking-widest mt-1">Mentor & mentee profile management</p>
        </div>
      ) : (
        <div className="px-4 sm:px-8 pt-3 pb-2">
          <h1 className="font-serif-alt text-2xl font-bold text-on-surface">Welcome, {firstName}</h1>
          <p className="text-sm text-on-surface-variant mt-1.5">· {user?.email}</p>
        </div>
      )}
    </>
  );
}
