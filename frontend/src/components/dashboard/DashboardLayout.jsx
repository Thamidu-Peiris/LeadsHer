import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mentorApi } from '../../api/mentorApi';
import { authApi } from '../../api/authApi';
import MentorSidebar from './MentorSidebar';
import MenteeSidebar from './MenteeSidebar';
import AdminSidebar from './AdminSidebar';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80';

/**
 * Shared layout for every dashboard page.
 * Renders the role-appropriate sidebar once (never remounts on page switch)
 * and renders the current page content via <Outlet />.
 */
export default function DashboardLayout() {
  const { user, isMentor, isMentee, isAdmin, updateUser } = useAuth();
  const [mentorProfile, setMentorProfile] = useState(null);

  const avatarSrc = user?.profilePicture || user?.avatar || FALLBACK_AVATAR;

  // Keep the profile picture fresh on every dashboard mount
  useEffect(() => {
    authApi.getProfile()
      .then(res => {
        const u = res.data?.user || res.data;
        if (u) updateUser(u);
      })
      .catch(() => {});
  }, []);

  // Fetch mentor availability dot once per session
  useEffect(() => {
    if (!isMentor) return;
    mentorApi.getMyProfile()
      .then(res => {
        const p = res.data?.data || res.data?.data?.data || res.data?.data || null;
        setMentorProfile(p);
      })
      .catch(() => setMentorProfile(null));
  }, [isMentor]);

  const sidebarWidth = isAdmin ? 'ml-[280px]' : 'ml-[260px]';

  const mainColumnClass = isMentee
    ? `${sidebarWidth} flex-1 flex min-h-screen flex-col bg-[#ffe6f5] dark:bg-rose-950 text-on-surface`
    : `${sidebarWidth} flex-1 flex min-h-screen flex-col bg-[#ffe6f5] dark:bg-surface text-on-surface`;

  return (
    <div className="relative flex min-h-screen bg-surface text-on-surface">
      {isMentor && (
        <MentorSidebar user={user} mentorProfile={mentorProfile} avatarSrc={avatarSrc} />
      )}
      {isMentee && (
        <MenteeSidebar user={user} avatarSrc={avatarSrc} />
      )}
      {isAdmin && (
        <AdminSidebar user={user} avatarSrc={avatarSrc} />
      )}

      {/* Page content — only this area re-renders on navigation */}
      <div className={mainColumnClass}>
        <Outlet />
      </div>
    </div>
  );
}
