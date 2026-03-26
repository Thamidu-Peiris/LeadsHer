import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storyApi } from '../api/storyApi';
import { eventApi } from '../api/eventApi';
import { mentorApi } from '../api/mentorApi';
import { authApi } from '../api/authApi';

function buildMenteeBio(main, goals, interests) {
  const parts = [main?.trim() || ''];
  if (goals?.trim()) parts.push(`\n\n[Goals]\n${goals.trim()}`);
  if (interests?.trim()) parts.push(`\n\n[Interests]\n${interests.trim()}`);
  return parts.join('').trim();
}
import StoryCard from '../components/stories/StoryCard';
import EventCard from '../components/events/EventCard';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

function MentorDashboard({ user, myStories, myEvents, canManageEvents }) {
  const firstName = user?.name?.split(' ')?.[0] || 'Mentor';
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardSaving, setOnboardSaving] = useState(false);
  const [onboardError, setOnboardError] = useState('');
  const [onboardForm, setOnboardForm] = useState({
    expertise: '',
    yearsOfExperience: 0,
    industries: '',
    mentoringAreas: '',
    bio: '',
    maxMentees: 3,
    preferredTime: '',
    timezone: 'UTC',
  });

  const userId = user?.id ?? user?._id;
  const onboardingKey = userId ? `leadsher_onboarding_mentorprofile_${userId}` : '';

  const toList = (v) => String(v || '').split(',').map((t) => t.trim()).filter(Boolean);
  const isComplete = (p) => {
    if (!p) return false;
    return (
      Array.isArray(p.expertise) && p.expertise.length > 0 &&
      Array.isArray(p.industries) && p.industries.length > 0 &&
      Array.isArray(p.mentoringAreas) && p.mentoringAreas.length > 0 &&
      typeof p.yearsOfExperience === 'number' &&
      typeof p.bio === 'string' && p.bio.trim().length > 0
    );
  };

  useEffect(() => {
    const shouldTry = userId && onboardingKey && !localStorage.getItem(onboardingKey);
    if (!shouldTry) return;
    setOnboardLoading(true);
    mentorApi.getMyProfile()
      .then((res) => {
        const p = res.data?.data || res.data?.data?.data || res.data?.data || null;
        if (!isComplete(p)) {
          setOnboardOpen(true);
          if (p) {
            setOnboardForm({
              expertise: (p.expertise || []).join(', '),
              yearsOfExperience: p.yearsOfExperience ?? 0,
              industries: (p.industries || []).join(', '),
              mentoringAreas: (p.mentoringAreas || []).join(', '),
              bio: p.bio || '',
              maxMentees: p.availability?.maxMentees ?? 3,
              preferredTime: (p.availability?.preferredTime || []).join(', '),
              timezone: p.availability?.timezone || 'UTC',
            });
          }
        }
      })
      .catch(() => {
        // If profile missing, open onboarding
        setOnboardOpen(true);
      })
      .finally(() => setOnboardLoading(false));
  }, [userId, onboardingKey]);

  const saveOnboarding = async () => {
    setOnboardError('');
    const payload = {
      expertise: toList(onboardForm.expertise),
      yearsOfExperience: Number(onboardForm.yearsOfExperience),
      industries: toList(onboardForm.industries),
      mentoringAreas: toList(onboardForm.mentoringAreas),
      bio: onboardForm.bio,
      availability: {
        maxMentees: Number(onboardForm.maxMentees),
        preferredTime: toList(onboardForm.preferredTime),
        timezone: onboardForm.timezone,
      },
    };
    setOnboardSaving(true);
    try {
      await mentorApi.upsertProfile(payload);
      localStorage.setItem(onboardingKey, '1');
      toast.success('Mentor profile saved');
      setOnboardOpen(false);
    } catch (e) {
      setOnboardError(e.response?.data?.message || 'Failed to save profile');
    } finally {
      setOnboardSaving(false);
    }
  };

  const totalViews = useMemo(
    () => myStories.reduce((a, s) => a + (s.views || 0), 0),
    [myStories]
  );
  const totalLikes = useMemo(
    () => myStories.reduce((a, s) => a + (s.likeCount || 0), 0),
    [myStories]
  );

  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen overflow-hidden bg-surface text-on-surface">
        {/* Onboarding modal */}
        {onboardOpen && (
          <div className="fixed inset-0 z-[60] bg-black/35 flex items-center justify-center p-6">
            <div className="w-full max-w-3xl bg-white dark:bg-surface-container border border-outline-variant/20 editorial-shadow p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-serif-alt text-2xl font-bold text-on-surface">Complete your mentor profile</h2>
                  <p className="text-on-surface-variant text-sm mt-1">
                    This helps mentees find you and improves match quality. You can update it later in Settings.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-outline hover:text-on-surface"
                  onClick={() => setOnboardOpen(false)}
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {onboardLoading ? (
                <div className="flex justify-center py-10"><Spinner size="lg" /></div>
              ) : (
                <>
                  {onboardError && (
                    <div className="mb-5 px-4 py-3 rounded-lg bg-error-container/50 border border-error/30 text-on-error-container text-sm">
                      {onboardError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Expertise *</label>
                      <input className="w-full input" value={onboardForm.expertise} onChange={(e) => setOnboardForm((f) => ({ ...f, expertise: e.target.value }))} placeholder="Leadership, Technology, Strategy" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Years of Experience *</label>
                      <input type="number" min={0} className="w-full input" value={onboardForm.yearsOfExperience} onChange={(e) => setOnboardForm((f) => ({ ...f, yearsOfExperience: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Industries *</label>
                      <input className="w-full input" value={onboardForm.industries} onChange={(e) => setOnboardForm((f) => ({ ...f, industries: e.target.value }))} placeholder="FinTech, Education, Health" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Mentoring Areas *</label>
                      <input className="w-full input" value={onboardForm.mentoringAreas} onChange={(e) => setOnboardForm((f) => ({ ...f, mentoringAreas: e.target.value }))} placeholder="Career growth, Negotiation, Confidence" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Bio *</label>
                      <textarea className="w-full input h-28 resize-y" value={onboardForm.bio} onChange={(e) => setOnboardForm((f) => ({ ...f, bio: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Max mentees</label>
                      <input type="number" min={1} max={10} className="w-full input" value={onboardForm.maxMentees} onChange={(e) => setOnboardForm((f) => ({ ...f, maxMentees: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Timezone</label>
                      <input className="w-full input" value={onboardForm.timezone} onChange={(e) => setOnboardForm((f) => ({ ...f, timezone: e.target.value }))} placeholder="Asia/Colombo" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Preferred time (comma-separated)</label>
                      <input className="w-full input" value={onboardForm.preferredTime} onChange={(e) => setOnboardForm((f) => ({ ...f, preferredTime: e.target.value }))} placeholder="Weeknights, Weekends" />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
                    <button
                      type="button"
                      className="px-5 py-3 rounded-lg font-bold text-sm border border-outline-variant/25 hover:border-gold-accent/40 transition-colors bg-white dark:bg-surface-container"
                      onClick={() => navigate('/dashboard/settings')}
                    >
                      Open Settings
                    </button>
                    <button
                      type="button"
                      disabled={onboardSaving}
                      className="bg-gold-accent text-white px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-60"
                      onClick={saveOnboarding}
                    >
                      {onboardSaving ? 'Saving…' : 'Save profile'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {/* Fixed left sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white dark:bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col z-40">
          {/* Profile */}
          <div className="p-6 flex flex-col items-center gap-3 border-b border-outline-variant/20">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-gold-accent p-0.5 overflow-hidden">
                <img
                  alt="User avatar"
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="text-center">
              <h3 className="text-on-surface font-bold text-lg">{firstName}</h3>
              <div className="mt-1 flex justify-center">
                <span className="bg-gold-accent/10 text-gold-accent text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-gold-accent/20">
                  Mentor
                </span>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {[
              { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
              { to: '/dashboard/stories', icon: 'auto_stories', label: 'Stories' },
              { to: '/dashboard/mentorship', icon: 'groups', label: 'Mentorship' },
              { to: '/events', icon: 'event', label: 'Events' },
              { to: '/dashboard/resources', icon: 'library_books', label: 'Resources' },
              { to: '/forum', icon: 'forum', label: 'Forum' },
              { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 transition-all group ${
                    isActive
                      ? 'text-gold-accent bg-gold-accent/5 border-gold-accent'
                      : 'text-outline hover:text-on-surface hover:bg-surface-container-low border-transparent'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Bottom */}
          <div className="p-4 mt-auto border-t border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between px-4 py-2 text-outline hover:text-on-surface cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <span className="text-sm font-medium">Notifications</span>
              </div>
              <span className="w-2 h-2 bg-tertiary rounded-full" />
            </div>
            <button className="w-full bg-gradient-to-r from-gold-accent to-primary text-white text-xs font-bold py-3 rounded-lg shadow-lg shadow-primary/10 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
              UPGRADE TO PRO
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="ml-[260px] flex-1 flex flex-col min-h-screen">
          {/* Top navbar */}
          <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white/80 dark:bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-outline">
              <Link className="hover:text-gold-accent transition-colors" to="/">
                Home
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface">Dashboard</span>
            </div>

            <div className="max-w-md w-full px-4 hidden md:block">
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-gold-accent transition-colors">
                  search
                </span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant/25 rounded-full py-2 pl-10 pr-4 text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-1 focus:ring-gold-accent transition-all"
                  placeholder="Search experiences, mentors..."
                  type="text"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-container border border-outline-variant/25 flex items-center justify-center text-outline hover:text-gold-accent transition-colors">
                <span className="material-symbols-outlined">help_outline</span>
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/25 hover:border-gold-accent transition-colors focus:outline-none focus:ring-2 focus:ring-gold-accent/40"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen ? 'true' : 'false'}
                >
                  <img
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face&q=80"
                  />
                </button>

                {profileOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-3 w-56 bg-white dark:bg-surface-container border border-outline-variant/20 editorial-shadow z-50"
                  >
                    <div className="px-5 py-4 border-b border-outline-variant/15">
                      <p className="font-sans-modern text-sm font-semibold text-on-surface line-clamp-1">
                        {user?.name || 'Mentor'}
                      </p>
                      <p className="font-sans-modern text-xs text-outline line-clamp-1">
                        {user?.email}
                      </p>
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
                      className="w-full text-left px-5 py-3 font-sans-modern text-sm text-tertiary hover:bg-tertiary/5 transition-colors flex items-center gap-2"
                      role="menuitem"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">
            {/* Welcome banner */}
            <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gold-accent/10 rounded-full blur-3xl -ml-48 -mb-48" />

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="space-y-2">
                  <h1 className="font-serif-alt text-4xl font-bold text-on-surface">
                    Welcome back, {firstName} 👋
                  </h1>
                  <p className="text-on-surface-variant text-sm max-w-md">
                    Role: <span className="text-gold-accent font-bold">mentor</span> · {user?.email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/dashboard/stories/new"
                    className="bg-gold-accent text-white px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-gold-accent/10"
                  >
                    + New Story
                  </Link>
                  {canManageEvents && (
                    <Link
                      to="/events/new"
                      className="bg-gold-accent text-white px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-gold-accent/10"
                    >
                      + New Event
                    </Link>
                  )}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-12 gap-8">
              {/* Left column */}
              <div className="col-span-12 lg:col-span-8 space-y-8">
                {/* Activity grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow p-5 rounded-xl space-y-2">
                    <p className="text-xs uppercase tracking-widest text-outline font-bold">Stories Published</p>
                    <div className="flex items-end justify-between">
                      <h4 className="text-2xl font-bold text-on-surface">{myStories.length}</h4>
                      <div className="h-8 w-20 bg-primary/10 rounded-md" />
                    </div>
                    <p className="text-[10px] text-outline">Your published stories</p>
                  </div>
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow p-5 rounded-xl space-y-2">
                    <p className="text-xs uppercase tracking-widest text-outline font-bold">Registered Events</p>
                    <div className="flex items-end justify-between">
                      <h4 className="text-2xl font-bold text-on-surface">{myEvents.length}</h4>
                      <span className="text-[10px] bg-gold-accent/10 text-gold-accent px-2 py-1 rounded">My events</span>
                    </div>
                    <p className="text-[10px] text-outline">Events you joined</p>
                  </div>
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow p-5 rounded-xl space-y-2">
                    <p className="text-xs uppercase tracking-widest text-outline font-bold">Community Impact</p>
                    <div className="flex items-end justify-between">
                      <h4 className="text-2xl font-bold text-on-surface">{totalViews + totalLikes}</h4>
                      <div className="text-tertiary">
                        <span className="material-symbols-outlined">stars</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-tertiary">Views + likes combined</p>
                  </div>
                </div>

                {/* Recent stories (your stories) */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif-alt text-2xl font-bold text-on-surface">Your Latest Stories</h2>
                    <Link className="text-gold-accent text-xs font-bold hover:underline flex items-center gap-1 uppercase tracking-wider" to="/stories">
                      View all <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>

                  {myStories.length === 0 ? (
                    <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl p-8 text-on-surface-variant">
                      You haven&apos;t written any stories yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {myStories.slice(0, 4).map((s) => (
                        <div key={s._id} className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl p-5 hover:border-gold-accent/40 transition-colors">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-serif-alt text-lg font-bold text-on-surface line-clamp-1">{s.title}</h3>
                            <Link to={`/stories/${s._id}`} className="text-outline hover:text-gold-accent transition-colors">
                              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                            </Link>
                          </div>
                          {s.excerpt && <p className="text-on-surface-variant text-sm mt-2 line-clamp-2">{s.excerpt}</p>}
                          <div className="mt-4 flex items-center justify-between text-xs text-outline">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">visibility</span> {s.views || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">favorite</span> {s.likeCount || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Right column */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold-accent">calendar_today</span> Upcoming Events
                  </h3>
                  {myEvents.length === 0 ? (
                    <p className="text-outline text-sm">No registered events yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {myEvents.slice(0, 2).map((e) => (
                        <Link
                          key={e._id}
                          to={`/events/${e._id}`}
                          className="block p-3 bg-surface-container-lowest border border-outline-variant/20 hover:border-gold-accent/40 transition-colors rounded-lg"
                        >
                          <p className="text-on-surface font-bold text-sm line-clamp-1">{e.title}</p>
                          <p className="text-[10px] text-outline mt-1 line-clamp-1">{e.location || 'Online'}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/stories/new"
                      className="bg-surface-container-lowest border border-outline-variant/20 text-on-surface py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:border-gold-accent/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">auto_stories</span> New Story
                    </Link>
                    <Link
                      to="/mentors"
                      className="bg-surface-container-lowest border border-outline-variant/20 text-on-surface py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:border-gold-accent/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">groups</span> Mentorship
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <footer className="pt-6 border-t border-outline-variant/20 text-center">
              <p className="text-[10px] text-outline tracking-widest uppercase">
                © {new Date().getFullYear()} LeadsHer. Built for brilliance.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

function MenteeDashboard({ user, myStories, myEvents }) {
  const firstName = user?.name?.split(' ')?.[0] || 'Mentee';
  const navigate = useNavigate();
  const { logout, updateUser } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const menteeUserId = user?.id ?? user?._id;
  const menteePromptKey = menteeUserId ? `leadsher_mentee_dashboard_profile_${menteeUserId}` : '';
  const [menteeProfileOpen, setMenteeProfileOpen] = useState(false);
  const [menteeSaving, setMenteeSaving] = useState(false);
  const [menteeForm, setMenteeForm] = useState({
    bio: '',
    learningGoals: '',
    interests: '',
    avatar: '',
  });

  useEffect(() => {
    if (!menteePromptKey) return;
    if (localStorage.getItem(menteePromptKey)) return;
    if (user?.bio?.trim()) {
      localStorage.setItem(menteePromptKey, 'complete');
      return;
    }
    setMenteeProfileOpen(true);
  }, [menteePromptKey, user?.bio]);

  const handleMenteeFormChange = (e) => {
    const { name, value } = e.target;
    setMenteeForm((f) => ({ ...f, [name]: value }));
  };

  const dismissMenteeProfilePrompt = () => {
    if (menteePromptKey) localStorage.setItem(menteePromptKey, 'skipped');
    setMenteeProfileOpen(false);
  };

  const saveMenteeProfilePrompt = async () => {
    setMenteeSaving(true);
    try {
      const bio = buildMenteeBio(menteeForm.bio, menteeForm.learningGoals, menteeForm.interests);
      const { data } = await authApi.updateProfile({
        bio: bio || undefined,
        avatar: menteeForm.avatar?.trim() || undefined,
      });
      const u = data?.user || data;
      if (u) updateUser(u);
      if (menteePromptKey) localStorage.setItem(menteePromptKey, 'complete');
      toast.success('Profile saved');
      setMenteeProfileOpen(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save profile');
    } finally {
      setMenteeSaving(false);
    }
  };

  const totalViews = useMemo(
    () => myStories.reduce((a, s) => a + (s.views || 0), 0),
    [myStories]
  );

  const menteeAvatarSrc =
    user?.profilePicture || user?.avatar ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80';

  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen overflow-hidden bg-surface text-on-surface">
        {/* Fixed left sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white dark:bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col z-40">
          {/* Profile */}
          <div className="p-6 flex flex-col items-center gap-3 border-b border-outline-variant/20">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-gold-accent p-0.5 overflow-hidden">
                <img
                  alt="User avatar"
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80"
                />
        {/* First-time mentee profile modal */}
        {menteeProfileOpen && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mentee-dash-profile-title"
          >
            <div className="w-full max-w-lg bg-white border-2 border-outline-variant/30 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-outline-variant/20">
                <h2 id="mentee-dash-profile-title" className="font-accent text-2xl text-on-surface">
                  Complete your profile
                </h2>
                <p className="font-sans-modern text-sm text-on-surface-variant mt-2">
                  First time here? Tell mentors a bit about you — you can update this anytime from Profile.
                </p>
              </div>
              <div className="px-6 sm:px-8 py-6 space-y-5">
                <div>
                  <label className="block font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline mb-2">
                    About you
                  </label>
                  <textarea
                    name="bio"
                    value={menteeForm.bio}
                    onChange={handleMenteeFormChange}
                    rows={3}
                    placeholder="Short introduction"
                    className="w-full border border-outline-variant/40 focus:border-primary bg-surface-container-lowest px-4 py-3 font-sans-modern text-sm outline-none resize-y min-h-[80px]"
                  />
                </div>
                <div>
                  <label className="block font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline mb-2">
                    Learning goals
                  </label>
                  <textarea
                    name="learningGoals"
                    value={menteeForm.learningGoals}
                    onChange={handleMenteeFormChange}
                    rows={2}
                    placeholder="What do you want to learn or achieve?"
                    className="w-full border border-outline-variant/40 focus:border-primary bg-surface-container-lowest px-4 py-3 font-sans-modern text-sm outline-none resize-y"
                  />
                </div>
                <div>
                  <label className="block font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline mb-2">
                    Interests
                  </label>
                  <input
                    name="interests"
                    value={menteeForm.interests}
                    onChange={handleMenteeFormChange}
                    placeholder="e.g. leadership, STEM, entrepreneurship"
                    className="w-full border-b-2 border-outline-variant focus:border-primary bg-transparent py-2.5 font-sans-modern text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline mb-2">
                    Avatar URL (optional)
                  </label>
                  <input
                    name="avatar"
                    type="url"
                    value={menteeForm.avatar}
                    onChange={handleMenteeFormChange}
                    placeholder="https://..."
                    className="w-full border-b-2 border-outline-variant focus:border-primary bg-transparent py-2.5 font-sans-modern text-sm outline-none"
                  />
                </div>
              </div>
              <div className="px-6 sm:px-8 pb-8 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={dismissMenteeProfilePrompt}
                  className="flex-1 border border-outline-variant py-3.5 font-brand text-xs tracking-[0.18em] uppercase text-outline hover:border-primary"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={saveMenteeProfilePrompt}
                  disabled={menteeSaving}
                  className="flex-1 bg-gold-accent text-white py-3.5 font-brand text-xs tracking-[0.18em] uppercase hover:opacity-90 disabled:opacity-60"
                >
                  {menteeSaving ? 'Saving…' : 'Save & continue'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fixed left sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-outline-variant/20 flex flex-col z-40">
          {/* Profile — icon opens menu with Profile link */}
          <div className="p-4 border-b border-outline-variant/20">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-gold-accent p-0.5 overflow-hidden">
                  <img alt="" className="w-full h-full object-cover rounded-full" src={menteeAvatarSrc} />
                </div>
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <p className="text-on-surface font-bold text-base text-center leading-tight px-1">{firstName}</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {[
              { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
              { to: '/dashboard/mentors', icon: 'groups', label: 'Mentorship' },
              { to: '/events', icon: 'event', label: 'Events' },
              { to: '/stories', icon: 'auto_stories', label: 'Stories' },
              { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 transition-all group ${
                    isActive
                      ? 'text-gold-accent bg-gold-accent/5 border-gold-accent'
                      : 'text-outline hover:text-on-surface hover:bg-surface-container-low border-transparent'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-outline-variant/20 space-y-3">
            <Link
              to="/mentors"
              className="w-full bg-gradient-to-r from-gold-accent to-primary text-white text-xs font-bold py-3 rounded-lg shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              FIND A MENTOR
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="ml-[260px] flex-1 flex flex-col min-h-screen">
          {/* Top navbar */}
          <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white/80 dark:bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-outline">
              <Link className="hover:text-gold-accent transition-colors" to="/">
                Home
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface">Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/25 hover:border-gold-accent transition-colors focus:outline-none focus:ring-2 focus:ring-gold-accent/40"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen ? 'true' : 'false'}
                >
                  <img
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    src={menteeAvatarSrc}
                  />
                </button>

                {profileOpen && (
                  <div role="menu" className="absolute right-0 mt-3 w-56 bg-white dark:bg-surface-container border border-outline-variant/20 editorial-shadow z-50">
                    <div className="px-5 py-4 border-b border-outline-variant/15">
                      <p className="font-sans-modern text-sm font-semibold text-on-surface line-clamp-1">
                        {user?.name || 'Mentee'}
                      </p>
                      <p className="font-sans-modern text-xs text-outline line-clamp-1">
                        {user?.email}
                      </p>
                    </div>
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="block w-full text-left px-5 py-3 font-sans-modern text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      role="menuitem"
                    >
                      Profile
                    </Link>
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
                      className="w-full text-left px-5 py-3 font-sans-modern text-sm text-tertiary hover:bg-tertiary/5 transition-colors flex items-center gap-2"
                      role="menuitem"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">
            {/* Welcome banner */}
            <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/10 rounded-full blur-3xl -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gold-accent/10 rounded-full blur-3xl -ml-48 -mb-48" />
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="space-y-2">
                  <h1 className="font-serif-alt text-4xl font-bold text-on-surface">
                    Welcome back, {firstName} 👋
                  </h1>
                  <p className="text-on-surface-variant text-sm max-w-md">
                    Role: <span className="text-primary font-bold">mentee</span> · {user?.email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/dashboard/mentors"
                    className="bg-gold-accent text-white px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-gold-accent/10"
                  >
                    Find a Mentor
                  </Link>
                  <Link
                    to="/events"
                    className="px-6 py-3 rounded-lg font-bold text-sm border border-outline-variant/25 hover:border-gold-accent/40 transition-colors bg-white"
                  >
                    Browse Events
                  </Link>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-12 gap-8">
              {/* Left column */}
              <div className="col-span-12 lg:col-span-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow p-5 rounded-xl space-y-2">
                    <p className="text-xs uppercase tracking-widest text-outline font-bold">Registered Events</p>
                    <div className="flex items-end justify-between">
                      <h4 className="text-2xl font-bold text-on-surface">{myEvents.length}</h4>
                      <span className="text-[10px] bg-gold-accent/10 text-gold-accent px-2 py-1 rounded">My events</span>
                    </div>
                    <p className="text-[10px] text-outline">Events you joined</p>
                  </div>
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow p-5 rounded-xl space-y-2">
                    <p className="text-xs uppercase tracking-widest text-outline font-bold">Stories Saved</p>
                    <div className="flex items-end justify-between">
                      <h4 className="text-2xl font-bold text-on-surface">0</h4>
                      <div className="h-8 w-20 bg-tertiary/10 rounded-md" />
                    </div>
                    <p className="text-[10px] text-outline">Wishlist (coming soon)</p>
                  </div>
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow p-5 rounded-xl space-y-2">
                    <p className="text-xs uppercase tracking-widest text-outline font-bold">Reading Impact</p>
                    <div className="flex items-end justify-between">
                      <h4 className="text-2xl font-bold text-on-surface">{totalViews}</h4>
                      <div className="text-tertiary">
                        <span className="material-symbols-outlined">auto_stories</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-outline">Total views on your stories</p>
                  </div>
                </div>

                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif-alt text-2xl font-bold text-on-surface">Your Recent Activity</h2>
                    <Link className="text-gold-accent text-xs font-bold hover:underline flex items-center gap-1 uppercase tracking-wider" to="/events">
                      View events <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>

                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl p-6">
                    <p className="text-on-surface-variant text-sm">
                      Start by exploring mentors and joining an event. Your mentorship requests will appear here.
                    </p>
                    <div className="mt-4 flex gap-3 flex-wrap">
                      <Link to="/mentors" className="btn-primary">Explore mentors</Link>
                      <Link to="/stories" className="btn-outline">Read stories</Link>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right column */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold-accent">calendar_today</span> Upcoming Events
                  </h3>
                  {myEvents.length === 0 ? (
                    <p className="text-outline text-sm">No registered events yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {myEvents.slice(0, 3).map((e) => (
                        <Link
                          key={e._id}
                          to={`/events/${e._id}`}
                          className="block p-3 bg-surface-container-lowest border border-outline-variant/20 hover:border-gold-accent/40 transition-colors rounded-lg"
                        >
                          <p className="text-on-surface font-bold text-sm line-clamp-1">{e.title}</p>
                          <p className="text-[10px] text-outline mt-1 line-clamp-1">{e.location || 'Online'}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                  <Link to="/events" className="text-gold-accent text-xs font-bold hover:underline uppercase tracking-wider flex items-center gap-1">
                    Browse all <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>

                <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 editorial-shadow rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/mentors"
                      className="bg-surface-container-lowest border border-outline-variant/20 text-on-surface py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:border-gold-accent/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">groups</span> Find Mentors
                    </Link>
                    <Link
                      to="/events"
                      className="bg-surface-container-lowest border border-outline-variant/20 text-on-surface py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:border-gold-accent/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">event</span> Events
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <footer className="pt-6 border-t border-outline-variant/20 text-center">
              <p className="text-[10px] text-outline tracking-widest uppercase">
                © {new Date().getFullYear()} LeadsHer. Built for brilliance.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, canManageEvents } = useAuth();
  const [myStories, setMyStories]   = useState([]);
  const [myEvents, setMyEvents]     = useState([]);
  const [loading, setLoading]       = useState(true);

  const userId = user?.id ?? user?._id;

  useEffect(() => {
    if (!user || !userId) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [sRes, eRes] = await Promise.allSettled([
          storyApi.getByUser(userId, { limit: 6 }),
          eventApi.getMyEvents(),
        ]);
        if (sRes.status === 'fulfilled') {
          setMyStories(sRes.value.data?.stories || []);
        }
        if (eRes.status === 'fulfilled') {
          setMyEvents(eRes.value.data?.data?.events || eRes.value.data?.events || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user, userId]);

  const handleDeleteStory = async (id) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await storyApi.delete(id);
      setMyStories((s) => s.filter((x) => x._id !== id));
      toast.success('Story deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;

  const roleLc = (user?.role || '').toLowerCase();
  if (roleLc === 'mentor') {
    return (
      <MentorDashboard
        user={user}
        myStories={myStories}
        myEvents={myEvents}
        canManageEvents={canManageEvents}
      />
    );
  }
  if (roleLc === 'mentee') {
    return (
      <MenteeDashboard
        user={user}
        myStories={myStories}
        myEvents={myEvents}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10">
      {/* Welcome */}
      <div className="bg-white dark:bg-surface-container-lowest rounded-2xl border border-outline-variant/15 editorial-shadow px-8 py-8 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-on-surface-variant text-sm mt-1 capitalize">
            Role: {user?.role} · {user?.email}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/stories/new"
            className="px-5 py-2.5 border border-outline-variant/30 bg-white dark:bg-surface-container text-on-surface font-sans-modern text-sm font-medium tracking-wide hover:bg-surface-container-low transition-colors"
          >
            + New Story
          </Link>
          {canManageEvents && (
            <Link
              to="/events/new"
              className="px-5 py-2.5 border border-outline-variant/30 bg-white dark:bg-surface-container text-on-surface font-sans-modern text-sm font-medium tracking-wide hover:bg-surface-container-low transition-colors"
            >
              + New Event
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'My Stories',        value: myStories.length, link: '/stories' },
          { label: 'Registered Events', value: myEvents.length,  link: '/events' },
          { label: 'Total Views',       value: myStories.reduce((a, s) => a + (s.views || 0), 0) },
          { label: 'Total Likes',       value: myStories.reduce((a, s) => a + (s.likeCount || 0), 0) },
        ].map(({ label, value, link }) => (
          <div key={label} className="card p-5">
            <p className="text-2xl font-display font-bold text-brand-700">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
            {link && <Link to={link} className="text-xs text-brand-600 hover:underline mt-2 block">View all →</Link>}
          </div>
        ))}
      </div>

      {/* My Stories */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold text-gray-900">My Stories</h2>
          <Link to="/stories/new" className="btn-secondary text-sm">+ Add</Link>
        </div>

        {myStories.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-gray-400 mb-4">You haven't written any stories yet.</p>
            <Link to="/stories/new" className="btn-primary">Share your first story</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myStories.map((s) => (
              <div key={s._id} className="relative group">
                <StoryCard story={s} />
                <div className="absolute top-2 right-2 hidden group-hover:flex gap-1.5">
                  <Link to={`/stories/${s._id}/edit`}
                    className="bg-white shadow text-xs px-2.5 py-1 rounded-lg text-gray-700 hover:bg-gray-50 border">Edit</Link>
                  <button onClick={() => handleDeleteStory(s._id)}
                    className="bg-white shadow text-xs px-2.5 py-1 rounded-lg text-red-500 hover:bg-red-50 border">Del</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Events */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold text-gray-900">My Events</h2>
          <Link to="/events" className="btn-secondary text-sm">Browse events</Link>
        </div>

        {myEvents.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-gray-400 mb-4">You haven't registered for any events yet.</p>
            <Link to="/events" className="btn-primary">Browse events</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myEvents.map((e) => <EventCard key={e._id} event={e} />)}
          </div>
        )}
      </section>
    </div>
  );
}
