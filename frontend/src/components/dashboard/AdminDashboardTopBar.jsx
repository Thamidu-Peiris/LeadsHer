import { Link } from 'react-router-dom';
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
        <div className="mx-auto w-full max-w-[1280px] px-8 pb-2 pt-6">
          <section
            className="rounded-xl border border-outline-variant/20 bg-white p-6 shadow-sm ring-1 ring-[#f43f5e]/10 dark:border-outline-variant/20 dark:bg-white sm:p-8"
            aria-labelledby="mentorship-heading"
          >
            <div className="min-w-0 space-y-2">
              <h1
                id="mentorship-heading"
                className="font-serif-alt text-3xl font-bold tracking-tight text-on-surface sm:text-4xl"
              >
                Mentorship
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                Requests, active mentorships, and mentor tools
              </p>
            </div>
          </section>
        </div>
      ) : isManageAccountRoute ? (
        <div className="w-full max-w-[1280px] mx-auto px-8 pt-6 pb-2">
          <section className="rounded-xl border border-outline-variant/20 bg-white p-6 shadow-sm dark:border-outline-variant/20 dark:bg-white sm:p-8">
            <div className="min-w-0 space-y-2">
              <h1 className="font-serif-alt text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
                Manage User Account
              </h1>
              <p className="max-w-2xl text-sm text-on-surface-variant">
                Mentor & mentee profile management
              </p>
            </div>
          </section>
        </div>
      ) : (
        <div className="w-full max-w-[1280px] mx-auto px-8 pt-6 pb-2">
          <section className="relative overflow-hidden rounded-xl border border-outline-variant/20 bg-white p-6 shadow-sm dark:border-outline-variant/20 dark:bg-surface-container-lowest sm:p-8">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#f43f5e]/15 blur-3xl dark:bg-[#f43f5e]/10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl opacity-70 dark:opacity-50"
              aria-hidden
            />
            <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="min-w-0 space-y-2">
                <h1 className="font-serif-alt text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
                  Welcome back, {firstName}{' '}
                  <span aria-hidden="true">👋</span>
                </h1>
                <p className="max-w-md text-sm text-on-surface-variant">
                  Role:{' '}
                  <span className="font-bold text-[#f43f5e]">admin</span>
                  {' · '}
                  {user?.email}
                </p>
              </div>
              <div className="flex w-full shrink-0 flex-wrap gap-3 md:w-auto md:justify-end">
                <Link
                  to="/dashboard/manage-stories"
                  className="inline-flex items-center justify-center rounded-lg bg-[#f43f5e] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#e11d48] active:scale-[0.98]"
                >
                  Manage Stories
                </Link>
                <Link
                  to="/dashboard/events"
                  className="inline-flex items-center justify-center rounded-lg border border-outline-variant/25 bg-white px-6 py-3 text-sm font-bold text-on-surface transition-colors hover:border-[#f43f5e]/50 dark:border-outline-variant/40 dark:bg-surface-container-lowest"
                >
                  Manage Events
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
