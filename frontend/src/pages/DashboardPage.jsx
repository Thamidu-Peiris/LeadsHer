import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import AdminDashboardTopBar from '../components/dashboard/AdminDashboardTopBar';
import { useAuth } from '../context/AuthContext';
import { storyApi } from '../api/storyApi';
import { eventApi } from '../api/eventApi';
import { mentorApi } from '../api/mentorApi';
import { authApi } from '../api/authApi';
import { mentorshipApi } from '../api/mentorshipApi';

function buildMenteeBio(main, goals, interests) {
  const parts = [main?.trim() || ''];
  if (goals?.trim()) parts.push(`\n\n[Goals]\n${goals.trim()}`);
  if (interests?.trim()) parts.push(`\n\n[Interests]\n${interests.trim()}`);
  return parts.join('').trim();
}
import StoryCard from '../components/stories/StoryCard';
import EventCard from '../components/events/EventCard';
import Spinner from '../components/common/Spinner';
import AdminMentorshipNexusPanel from '../components/admin/AdminMentorshipNexusPanel';
import AdminMentorshipStatCards from '../components/admin/AdminMentorshipStatCards';
import {
  buildAuthIndexes,
  enrichRequest,
  enrichMentorship,
  enrichFeedbackRow,
} from '../utils/mentorshipAdminMerge';
import { absolutePhotoUrl } from '../utils/absolutePhotoUrl';
import toast from 'react-hot-toast';

function menteeEventCoverUrl(e) {
  const raw =
    typeof e.coverImage === 'string'
      ? e.coverImage
      : typeof e.cover_image === 'string'
        ? e.cover_image
        : '';
  return raw?.trim() ? absolutePhotoUrl(raw.trim()) : '';
}

function menteeEventLocationLine(e) {
  if (e.type === 'virtual') return 'Virtual';
  return e.location?.city || e.location?.venue || 'Online';
}

function menteeFormatEventDate(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function menteeFormatEventTimeDisplay(startTime) {
  if (startTime == null || startTime === '') return '';
  const s = String(startTime).trim();
  if (!s) return '';
  const parts = s.split(':').map((p) => Number(p));
  if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    const dt = new Date();
    dt.setHours(parts[0], parts[1], parts[2] || 0, 0);
    return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return s;
}

function menteeEventDateTimeLine(e) {
  const dateStr = menteeFormatEventDate(e.date);
  const timeStr = menteeFormatEventTimeDisplay(e.startTime);
  if (dateStr && timeStr) return `${dateStr} · ${timeStr}`;
  if (dateStr) return dateStr;
  if (timeStr) return timeStr;
  return null;
}

function MentorDashboard({ user, myStories, myEvents, canManageEvents }) {
  const firstName = user?.name?.split(' ')?.[0] || 'Mentor';
  const navigate = useNavigate();
  const { logout } = useAuth();
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
  const [mentorProfile, setMentorProfile] = useState(null);

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
        setMentorProfile(p);
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

  useEffect(() => {
    if (!userId) return;
    mentorApi.getMyProfile()
      .then((res) => {
        const p = res.data?.data || res.data?.data?.data || res.data?.data || null;
        setMentorProfile(p);
      })
      .catch(() => setMentorProfile(null));
  }, [userId]);

  const avatarSrc =
    user?.profilePicture ||
    user?.avatar ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80';

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
    () => myStories.reduce((a, s) => a + Number(s?.views ?? s?.viewCount ?? 0), 0),
    [myStories]
  );
  const totalLikes = useMemo(
    () => myStories.reduce((a, s) => a + Number(s?.likeCount ?? s?.likes?.length ?? 0), 0),
    [myStories]
  );
  const monthStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);
  const monthLabel = useMemo(
    () => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    []
  );
  const storiesThisMonth = useMemo(
    () =>
      myStories.filter((s) => {
        const t = new Date(s?.publishedAt || s?.createdAt || 0).getTime();
        return Number.isFinite(t) && t >= monthStart.getTime();
      }).length,
    [myStories, monthStart]
  );
  const sessionsThisMonth = useMemo(
    () =>
      myEvents.filter((e) => {
        const t = new Date(e?.date || e?.startDate || e?.createdAt || 0).getTime();
        return Number.isFinite(t) && t >= monthStart.getTime();
      }).length,
    [myEvents, monthStart]
  );
  const repliesThisMonth = useMemo(
    () =>
      myStories
        .filter((s) => {
          const t = new Date(s?.publishedAt || s?.createdAt || 0).getTime();
          return Number.isFinite(t) && t >= monthStart.getTime();
        })
        .reduce((sum, s) => sum + Number(s?.commentCount ?? 0), 0),
    [myStories, monthStart]
  );
  const goals = useMemo(() => ([
    { key: 'stories', label: 'Stories', icon: 'auto_stories', value: storiesThisMonth, target: 4 },
    { key: 'sessions', label: 'Sessions', icon: 'event', value: sessionsThisMonth, target: 3 },
    { key: 'replies', label: 'Replies', icon: 'chat', value: repliesThisMonth, target: 20 },
  ]), [storiesThisMonth, sessionsThisMonth, repliesThisMonth]);
  const recentActivity = useMemo(() => {
    const items = [];
    const sortedStories = [...myStories].sort(
      (a, b) => new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0)
    );
    sortedStories.slice(0, 2).forEach((s) => {
      const likes = Number(s?.likeCount ?? s?.likes?.length ?? 0);
      const comments = Number(s?.commentCount ?? 0);
      items.push({
        icon: 'auto_stories',
        title: s?.title || 'Story update',
        meta: `${likes} likes · ${comments} comments`,
      });
    });
    const nextEvent = [...myEvents]
      .filter((e) => new Date(e?.date || e?.startDate || 0).getTime() >= Date.now())
      .sort((a, b) => new Date(a?.date || a?.startDate || 0) - new Date(b?.date || b?.startDate || 0))[0];
    if (nextEvent) {
      items.push({
        icon: 'event_upcoming',
        title: `Upcoming: ${nextEvent.title || 'Event'}`,
        meta: new Date(nextEvent?.date || nextEvent?.startDate || Date.now()).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      });
    }
    if (mentorProfile) {
      items.push({
        icon: mentorProfile?.isAvailable ? 'toggle_on' : 'toggle_off',
        title: `Mentorship ${mentorProfile?.isAvailable ? 'availability on' : 'availability off'}`,
        meta: 'From your mentor profile settings',
      });
    }
    if (items.length === 0) {
      items.push({
        icon: 'notifications',
        title: 'No new activity yet',
        meta: 'Your latest likes, comments, and updates will appear here',
      });
    }
    return items.slice(0, 4);
  }, [myStories, myEvents, mentorProfile]);
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        stories: 0,
        sessions: 0,
      };
    });
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    myStories.forEach((s) => {
      const t = new Date(s?.publishedAt || s?.createdAt || 0);
      const k = `${t.getFullYear()}-${t.getMonth()}`;
      const i = idx.get(k);
      if (i != null && Number.isFinite(t.getTime())) buckets[i].stories += 1;
    });
    myEvents.forEach((e) => {
      const t = new Date(e?.date || e?.startDate || e?.createdAt || 0);
      const k = `${t.getFullYear()}-${t.getMonth()}`;
      const i = idx.get(k);
      if (i != null && Number.isFinite(t.getTime())) buckets[i].sessions += 1;
    });
    const maxValue = Math.max(1, ...buckets.map((b) => Math.max(b.stories, b.sessions)));
    return { buckets, maxValue };
  }, [myStories, myEvents]);
  const engagement = useMemo(() => {
    const comments = myStories.reduce((sum, s) => sum + Number(s?.commentCount ?? 0), 0);
    const likes = totalLikes;
    const views = totalViews;
    const total = Math.max(1, likes + comments + views);
    const likesPct = Math.round((likes / total) * 100);
    const commentsPct = Math.round((comments / total) * 100);
    const viewsPct = 100 - likesPct - commentsPct;
    return { likes, comments, views, likesPct, commentsPct, viewsPct };
  }, [myStories, totalLikes, totalViews]);

  return (
    <>
      {/* Onboarding modal */}
        {onboardOpen && (
          <div className="fixed inset-0 z-[60] bg-black/35 flex items-center justify-center p-6">
            <div className="w-full max-w-3xl bg-white dark:bg-surface-container border border-outline-variant/20 p-8">
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
                      className="px-5 py-3 rounded-lg font-bold text-sm border border-outline-variant/25 hover:border-rose-500/40 transition-colors bg-white dark:bg-surface-container"
                      onClick={() => navigate('/dashboard/settings')}
                    >
                      Open Settings
                    </button>
                    <button
                      type="button"
                      disabled={onboardSaving}
                      className="bg-rose-500 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-rose-600 disabled:opacity-60 dark:bg-rose-600 dark:hover:bg-rose-500"
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
          <DashboardTopBar crumbs={[{ label: 'Dashboard' }]} />

          {/* Content */}
          <div className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">
            {/* Welcome banner */}
            <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl -ml-48 -mb-48" />

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="space-y-2">
                  <h1 className="font-serif-alt text-4xl font-bold text-on-surface">
                    Welcome back, {firstName} 👋
                  </h1>
                  <p className="text-on-surface-variant text-sm max-w-md">
                    Role: <span className="text-rose-600 font-bold dark:text-rose-400">mentor</span> · {user?.email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/dashboard/stories/new"
                    className="inline-flex items-center justify-center rounded-lg bg-[#f43f5e] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#e11d48] active:scale-[0.98]"
                  >
                    + New Story
                  </Link>
                  {canManageEvents && (
                    <Link
                      to="/events/new"
                      className="inline-flex min-h-[48px] items-center justify-center rounded-lg border-2 border-[#f43f5e]/35 bg-white px-6 py-3 text-sm font-bold text-on-surface shadow-sm transition-colors hover:border-[#f43f5e] hover:bg-rose-50"
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
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 p-5 rounded-xl space-y-2">
                    <p className="text-xs uppercase tracking-widest text-outline font-bold">Stories Published</p>
                    <div className="flex items-end justify-between">
                      <h4 className="text-2xl font-bold text-on-surface">{myStories.length}</h4>
                      <span className="material-symbols-outlined text-[#f43f5e] text-[24px]" aria-hidden>
                        auto_stories
                      </span>
                    </div>
                    <p className="text-[10px] text-outline">Your published stories</p>
                  </div>
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 p-5 rounded-xl space-y-2">
                    <p className="text-xs uppercase tracking-widest text-outline font-bold">Registered Events</p>
                    <div className="flex items-end justify-between">
                      <h4 className="text-2xl font-bold text-on-surface">{myEvents.length}</h4>
                      <span className="text-[10px] bg-rose-500/10 text-rose-600 px-2 py-1 rounded dark:bg-rose-500/15 dark:text-rose-400">My events</span>
                    </div>
                    <p className="text-[10px] text-outline">Events you joined</p>
                  </div>
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 p-5 rounded-xl space-y-2">
                    <p className="text-xs uppercase tracking-widest text-outline font-bold">Community Impact</p>
                    <div className="flex items-end justify-between">
                      <h4 className="text-2xl font-bold text-on-surface">{totalViews + totalLikes}</h4>
                      <span className="material-symbols-outlined text-[#f43f5e] text-[24px]" aria-hidden>
                        stars
                      </span>
                    </div>
                    <p className="text-[10px] text-tertiary">Views + likes combined</p>
                  </div>
                </div>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-serif-alt text-xl font-bold text-on-surface">Monthly Trend</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#f43f5e] bg-[#f43f5e]/10 px-2 py-1 rounded-full">
                        Last 6 months
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-2 items-end h-40">
                      {monthlyTrend.buckets.map((b) => {
                        const storiesH = Math.max(6, Math.round((b.stories / monthlyTrend.maxValue) * 92));
                        const sessionsH = Math.max(6, Math.round((b.sessions / monthlyTrend.maxValue) * 92));
                        return (
                          <div key={b.key} className="flex flex-col items-center gap-1">
                            <div className="flex items-end gap-1 h-28">
                              <span
                                className="w-3 rounded-md bg-[#f43f5e]"
                                style={{ height: `${storiesH}%` }}
                                title={`Stories: ${b.stories}`}
                              />
                              <span
                                className="w-3 rounded-md border border-[#f43f5e]/40 bg-rose-100"
                                style={{ height: `${sessionsH}%` }}
                                title={`Sessions: ${b.sessions}`}
                              />
                            </div>
                            <span className="text-[10px] font-semibold text-outline">{b.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-[11px] text-outline">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-sm bg-[#f43f5e]" /> Stories
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-sm border border-[#f43f5e]/50 bg-rose-100" /> Sessions
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-serif-alt text-xl font-bold text-on-surface">Engagement Mix</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#f43f5e] bg-[#f43f5e]/10 px-2 py-1 rounded-full">
                        Likes / Comments / Views
                      </span>
                    </div>
                    <div className="flex items-center gap-5">
                      <div
                        className="h-28 w-28 rounded-full border border-outline-variant/20"
                        style={{
                          background: `conic-gradient(#f43f5e 0% ${engagement.likesPct}%, #fb7185 ${engagement.likesPct}% ${engagement.likesPct + engagement.commentsPct}%, #ffd1e7 ${engagement.likesPct + engagement.commentsPct}% 100%)`,
                        }}
                      />
                      <div className="space-y-2 text-xs">
                        <p className="flex items-center gap-2 text-on-surface">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#f43f5e]" /> Likes: {engagement.likes}
                        </p>
                        <p className="flex items-center gap-2 text-on-surface">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#fb7185]" /> Comments: {engagement.comments}
                        </p>
                        <p className="flex items-center gap-2 text-on-surface">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#ffd1e7] border border-[#f43f5e]/20" /> Views: {engagement.views}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif-alt text-xl font-bold text-on-surface">Mini Goals / Progress</h3>
                      <span className="text-[10px] px-2 py-1 rounded-full border border-[#f43f5e]/30 bg-[#f43f5e]/10 text-[#f43f5e] font-bold uppercase tracking-wider">
                        {monthLabel}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {goals.map((g) => {
                        const pct = Math.min(100, Math.round((g.value / g.target) * 100));
                        return (
                          <div key={g.key} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <p className="font-semibold text-on-surface flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[15px] text-[#f43f5e]">{g.icon}</span>
                                {g.label}
                              </p>
                              <p className="text-outline tabular-nums">{g.value}/{g.target}</p>
                            </div>
                            <div className="h-2 rounded-full bg-outline-variant/20 overflow-hidden">
                              <div className="h-2 rounded-full bg-[#f43f5e]" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 space-y-4">
                    <h3 className="font-serif-alt text-xl font-bold text-on-surface">Recent Activity Feed</h3>
                    <div className="space-y-2.5">
                      {recentActivity.map((a, idx) => (
                        <div key={`${a.title}-${idx}`} className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest/70 px-3 py-2.5">
                          <p className="text-sm font-semibold text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-[#f43f5e]">{a.icon}</span>
                            <span className="line-clamp-1">{a.title}</span>
                          </p>
                          <p className="mt-1 text-[11px] text-outline pl-6">{a.meta}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

              </div>

              {/* Right column */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-black dark:text-neutral-100">calendar_today</span> Upcoming Events
                  </h3>
                  {myEvents.length === 0 ? (
                    <p className="text-outline text-sm">No registered events yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {myEvents.slice(0, 3).map((e) => {
                        const coverUrl = menteeEventCoverUrl(e);
                        const whenLine = menteeEventDateTimeLine(e);
                        return (
                          <Link
                            key={e._id}
                            to={`/events/${e._id}`}
                            className="flex items-center gap-3 p-3 bg-surface-container-lowest border border-outline-variant/20 hover:border-gold-accent/40 transition-colors rounded-lg"
                          >
                            <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-outline-variant/20 bg-slate-100 dark:bg-slate-800">
                              {coverUrl ? (
                                <img
                                  src={coverUrl}
                                  alt=""
                                  className="size-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <div
                                  className="flex size-full items-center justify-center bg-gradient-to-br from-rose-50 to-rose-100/60 dark:from-rose-950/35 dark:to-rose-950/15"
                                  aria-hidden
                                >
                                  <span className="material-symbols-outlined text-[26px] text-rose-200 dark:text-rose-800/70">
                                    event
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-on-surface font-bold text-sm line-clamp-1">{e.title}</p>
                              {whenLine && (
                                <p className="text-[10px] text-outline mt-1 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px] shrink-0 text-rose-600 dark:text-rose-400">
                                    schedule
                                  </span>
                                  <span className="min-w-0 line-clamp-1">{whenLine}</span>
                                </p>
                              )}
                              <p className={`text-[10px] text-outline flex items-center gap-1 ${whenLine ? 'mt-0.5' : 'mt-1'}`}>
                                <span className="material-symbols-outlined text-[12px] shrink-0 text-outline">
                                  {e.type === 'virtual' ? 'videocam' : 'location_on'}
                                </span>
                                <span className="min-w-0 line-clamp-1">{menteeEventLocationLine(e)}</span>
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                  <Link to="/dashboard/events" className="text-black dark:text-neutral-100 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    Browse all <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>

                <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/dashboard/stories/new"
                      className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-lg bg-[#f43f5e] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#e11d48]"
                    >
                      <span className="material-symbols-outlined text-[16px]">auto_stories</span> New Story
                    </Link>
                    <Link
                      to="/events/new"
                      className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-lg border-2 border-[#f43f5e]/35 bg-white px-3 py-2 text-xs font-bold text-on-surface transition-colors hover:border-[#f43f5e] hover:bg-rose-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">event</span> New Event
                    </Link>
                    <Link
                      to="/dashboard/mentorship"
                      className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-lg border-2 border-[#f43f5e]/35 bg-white px-3 py-2 text-xs font-bold text-on-surface transition-colors hover:border-[#f43f5e] hover:bg-rose-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">groups</span> Mentorship
                    </Link>
                    <Link
                      to="/dashboard/forum"
                      className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-lg border-2 border-[#f43f5e]/35 bg-white px-3 py-2 text-xs font-bold text-on-surface transition-colors hover:border-[#f43f5e] hover:bg-rose-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">forum</span> Forum
                    </Link>
                  </div>
                </div>

                <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Your Latest Stories</h3>
                    <Link
                      className="text-[11px] font-bold uppercase tracking-wider text-[#f43f5e] hover:text-[#e11d48] flex items-center gap-1"
                      to="/dashboard/stories"
                    >
                      View all <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </Link>
                  </div>
                  {myStories.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">You haven&apos;t written any stories yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {myStories.slice(0, 3).map((s) => (
                        <div key={s._id} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest/80 px-3 py-2.5 hover:border-rose-500/40 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="h-11 w-14 shrink-0 overflow-hidden rounded-md border border-outline-variant/20 bg-white">
                              <img
                                src={s.coverImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=180&h=140&fit=crop&q=80'}
                                alt={s.title || 'Story'}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-on-surface line-clamp-1">{s.title}</p>
                                <Link to={`/stories/${s._id}`} className="text-outline hover:text-rose-600 transition-colors">
                                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                </Link>
                              </div>
                              <div className="mt-1.5 flex items-center gap-4 text-[11px] text-outline">
                                <span className="inline-flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px] text-[#f43f5e]">visibility</span> {s.views ?? s.viewCount ?? 0}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <span
                                    className="material-symbols-outlined text-[14px] text-[#f43f5e]"
                                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                                  >
                                    favorite
                                  </span>
                                  {s.likeCount ?? 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>

            <footer className="pt-6 border-t border-outline-variant/20 text-center">
              <p className="text-[10px] text-outline tracking-widest uppercase">
                © {new Date().getFullYear()} LeadsHer. Built for brilliance.
              </p>
            </footer>
          </div>
    </>
  );
}

function MenteeDashboard({ user, myStories, myEvents }) {
  const firstName = user?.name?.split(' ')?.[0] || 'Mentee';
  const navigate = useNavigate();
  const { logout, updateUser } = useAuth();

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
    () => myStories.reduce((a, s) => a + Number(s?.views ?? s?.viewCount ?? 0), 0),
    [myStories]
  );

  const menteeAvatarSrc =
    user?.profilePicture || user?.avatar ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80';

  return (
    <>
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

          <DashboardTopBar crumbs={[{ label: 'Dashboard' }]} />

          {/* Content */}
          <div className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">
            {/* Welcome banner */}
            <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8 relative overflow-hidden">
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
                    className="bg-black text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-neutral-900 active:scale-95 transition-all"
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
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 p-5 rounded-xl space-y-2">
                    <p className="text-xs uppercase tracking-widest text-outline font-bold">Registered Events</p>
                    <div className="flex items-end justify-between">
                      <h4 className="text-2xl font-bold text-on-surface">{myEvents.length}</h4>
                      <span className="text-[10px] bg-gold-accent/10 text-gold-accent px-2 py-1 rounded">My events</span>
                    </div>
                    <p className="text-[10px] text-outline">Events you joined</p>
                  </div>
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 p-5 rounded-xl space-y-2">
                    <p className="text-xs uppercase tracking-widest text-outline font-bold">Stories Saved</p>
                    <div className="flex items-end justify-between">
                      <h4 className="text-2xl font-bold text-on-surface">0</h4>
                      <div className="h-8 w-20 bg-tertiary/10 rounded-md" />
                    </div>
                    <p className="text-[10px] text-outline">Wishlist (coming soon)</p>
                  </div>
                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 p-5 rounded-xl space-y-2">
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
                    <Link className="text-black dark:text-neutral-100 text-xs font-bold flex items-center gap-1 uppercase tracking-wider" to="/dashboard/events">
                      View events <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>

                  <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6">
                    <p className="text-on-surface-variant text-sm">
                      Start by exploring mentors and joining an event. Your mentorship requests will appear here.
                    </p>
                    <div className="mt-4 flex gap-3 flex-wrap">
                      <Link
                        to="/dashboard/mentors"
                        className="inline-flex items-center justify-center px-8 py-4 bg-black text-white font-label text-xs tracking-[0.2em] uppercase transition-transform hover:-translate-y-0.5 hover:bg-neutral-900 active:scale-[0.98]"
                      >
                        Explore mentors
                      </Link>
                      <Link to="/dashboard/stories" className="btn-outline">Read stories</Link>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right column */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-black dark:text-neutral-100">calendar_today</span> Upcoming Events
                  </h3>
                  {myEvents.length === 0 ? (
                    <p className="text-outline text-sm">No registered events yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {myEvents.slice(0, 3).map((e) => {
                        const coverUrl = menteeEventCoverUrl(e);
                        const whenLine = menteeEventDateTimeLine(e);
                        return (
                          <Link
                            key={e._id}
                            to={`/events/${e._id}`}
                            className="flex items-center gap-3 p-3 bg-surface-container-lowest border border-outline-variant/20 hover:border-gold-accent/40 transition-colors rounded-lg"
                          >
                            <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-outline-variant/20 bg-slate-100 dark:bg-slate-800">
                              {coverUrl ? (
                                <img
                                  src={coverUrl}
                                  alt=""
                                  className="size-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <div
                                  className="flex size-full items-center justify-center bg-gradient-to-br from-rose-50 to-rose-100/60 dark:from-rose-950/35 dark:to-rose-950/15"
                                  aria-hidden
                                >
                                  <span className="material-symbols-outlined text-[26px] text-rose-200 dark:text-rose-800/70">
                                    event
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-on-surface font-bold text-sm line-clamp-1">{e.title}</p>
                              {whenLine && (
                                <p className="text-[10px] text-outline mt-1 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px] shrink-0 text-rose-600 dark:text-rose-400">
                                    schedule
                                  </span>
                                  <span className="min-w-0 line-clamp-1">{whenLine}</span>
                                </p>
                              )}
                              <p
                                className={`text-[10px] text-outline flex items-center gap-1 ${whenLine ? 'mt-0.5' : 'mt-1'}`}
                              >
                                <span className="material-symbols-outlined text-[12px] shrink-0 text-outline">
                                  {e.type === 'virtual' ? 'videocam' : 'location_on'}
                                </span>
                                <span className="min-w-0 line-clamp-1">{menteeEventLocationLine(e)}</span>
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                  <Link to="/dashboard/events" className="text-black dark:text-neutral-100 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    Browse all <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>

                <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/dashboard/mentors"
                      className="bg-surface-container-lowest border border-outline-variant/20 text-on-surface py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:border-gold-accent/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">groups</span> Find Mentors
                    </Link>
                    <Link
                      to="/dashboard/events"
                      className="bg-surface-container-lowest border border-outline-variant/20 text-on-surface py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:border-gold-accent/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">event</span> Events
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <footer className="pt-6 border-t border-outline-variant/20 text-center">
              <p className="text-[10px] text-black dark:text-neutral-100 tracking-widest uppercase">
                © {new Date().getFullYear()} LeadsHer. Built for brilliance.
              </p>
            </footer>
          </div>
    </>
  );
}

const MANAGE_ACCOUNT_PAGE_SIZE = 20;

function getManageAccountPageItems(current, total) {
  if (total <= 1) return [1];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total]);
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('ellipsis');
    out.push(sorted[i]);
  }
  return out;
}

function ManageAccountPaginationBar({ page, totalPages, totalItems, onPageChange }) {
  if (totalPages <= 1 || totalItems === 0) return null;
  const items = getManageAccountPageItems(page, totalPages);
  const start = (page - 1) * MANAGE_ACCOUNT_PAGE_SIZE + 1;
  const end = Math.min(page * MANAGE_ACCOUNT_PAGE_SIZE, totalItems);
  const btnBase =
    'min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg border-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/35 focus-visible:ring-offset-1';
  const btnIdle = 'border-outline-variant/35 bg-white text-on-surface hover:border-[#f43f5e]/40 hover:bg-rose-50';
  const btnActive = 'border-[#f43f5e] bg-[#f43f5e] text-white shadow-sm';
  const navBtn = `${btnBase} px-3 ${btnIdle} disabled:opacity-40 disabled:pointer-events-none`;
  return (
    <div className="mt-6 border-t border-outline-variant/20 pt-4">
      <p className="mb-3 text-center text-xs text-on-surface-variant">
        Showing {start}–{end} of {totalItems} (page {page} of {totalPages})
      </p>
      <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
        <button type="button" className={navBtn} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        {items.map((item, idx) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-on-surface-variant select-none" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`${btnBase} ${page === item ? btnActive : btnIdle}`}
              onClick={() => onPageChange(item)}
              aria-current={page === item ? 'page' : undefined}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          className={navBtn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </nav>
    </div>
  );
}

function AdminDashboard({ user }) {
  const firstName = user?.name?.split(' ')?.[0] || 'Admin';
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [manageAccountTab, setManageAccountTab] = useState('mentors');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    profilePicture: '',
    avatar: '',
  });
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [users, setUsers] = useState([]);
  const [mentorProfiles, setMentorProfiles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeMentorships, setActiveMentorships] = useState([]);
  const [feedbackRows, setFeedbackRows] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [platformStoryTotal, setPlatformStoryTotal] = useState(0);
  const [platformEventTotal, setPlatformEventTotal] = useState(0);
  const [manageAccountSearch, setManageAccountSearch] = useState('');
  const [manageAccountFilterOpen, setManageAccountFilterOpen] = useState(false);
  const [mentorAccountPage, setMentorAccountPage] = useState(1);
  const [menteeAccountPage, setMenteeAccountPage] = useState(1);
  const [terminateDialog, setTerminateDialog] = useState({ open: false, id: null });
  const [terminateSubmitting, setTerminateSubmitting] = useState(false);

  const loadAdminData = async () => {
    setLoadingAdmin(true);
    try {
      const [u, mp, rq, ac, fb, rp, st, ev] = await Promise.allSettled([
        authApi.adminListUsers({ limit: 5000 }),
        mentorApi.getAll({ limit: 500 }),
        mentorshipApi.adminGetRequests(),
        mentorshipApi.adminGetActive(),
        mentorshipApi.adminGetFeedback(),
        mentorshipApi.adminGetReports(),
        storyApi.getAll({ limit: 1, page: 1 }),
        eventApi.getAll({ limit: 10000, page: 1 }),
      ]);
      let userList = [];
      if (u.status === 'fulfilled') {
        const body = u.value.data || {};
        userList = body.data || body.users || [];
        setUsers(userList);
      }
      const authIdx = buildAuthIndexes(userList);

      if (mp.status === 'fulfilled') setMentorProfiles(mp.value.data?.data || mp.value.data?.mentors || []);
      if (rq.status === 'fulfilled') {
        const body = rq.value.data || {};
        const raw = Array.isArray(body.data) ? body.data : [];
        setRequests(raw.map((r) => enrichRequest(r, authIdx)));
      }
      if (ac.status === 'fulfilled') {
        const body = ac.value.data || {};
        const raw = Array.isArray(body.data) ? body.data : [];
        setActiveMentorships(raw.map((m) => enrichMentorship(m, authIdx)));
      }
      if (fb.status === 'fulfilled') {
        const raw = fb.value.data?.data || [];
        setFeedbackRows(raw.map((f) => enrichFeedbackRow(f, authIdx)));
      }
      if (rp.status === 'fulfilled') setReportData(rp.value.data?.data || null);

      if (st.status === 'fulfilled') {
        const d = st.value.data || {};
        const total = d.pagination?.total;
        setPlatformStoryTotal(
          typeof total === 'number'
            ? total
            : (Array.isArray(d.stories) ? d.stories.length : 0)
        );
      } else {
        setPlatformStoryTotal(0);
      }

      if (ev.status === 'fulfilled') {
        const d = ev.value.data || {};
        const events = d.data?.events || d.events || [];
        setPlatformEventTotal(Array.isArray(events) ? events.length : 0);
      } else {
        setPlatformEventTotal(0);
      }
    } finally {
      setLoadingAdmin(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const setRole = async (id, role) => {
    try {
      await authApi.adminSetUserRole(id, role);
      toast.success('User role updated');
      await loadAdminData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update role');
    }
  };

  const setSuspended = async (id, suspended) => {
    try {
      await authApi.adminSetSuspension(id, suspended, suspended ? 'Suspended by admin' : '');
      toast.success(suspended ? 'User suspended' : 'User reactivated');
      await loadAdminData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update suspension');
    }
  };

  const editUserProfile = (u) => {
    setEditingUser(u);
    setEditForm({
      name: u?.name || '',
      bio: u?.bio || '',
      profilePicture: u?.profilePicture || '',
      avatar: u?.avatar || '',
    });
    setEditModalOpen(true);
  };

  const submitEditUserProfile = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditSaving(true);
    try {
      await authApi.adminUpdateUserProfile(editingUser.id || editingUser._id, {
        name: editForm.name?.trim(),
        bio: editForm.bio?.trim(),
        profilePicture: editForm.profilePicture?.trim(),
        avatar: editForm.avatar?.trim(),
      });
      toast.success('User profile updated');
      setEditModalOpen(false);
      setEditingUser(null);
      await loadAdminData();
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Failed to update profile');
    } finally {
      setEditSaving(false);
    }
  };

  const toggleVerifyMentor = async (mentorProfile) => {
    try {
      await mentorApi.adminSetVerification(mentorProfile._id, !mentorProfile.isVerified);
      toast.success(!mentorProfile.isVerified ? 'Mentor verified' : 'Mentor unverified');
      await loadAdminData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update mentor verification');
    }
  };

  const openTerminateDialog = (id) => {
    setTerminateDialog({ open: true, id });
  };

  const closeTerminateDialog = () => {
    if (terminateSubmitting) return;
    setTerminateDialog({ open: false, id: null });
  };

  const confirmTerminateMentorship = async () => {
    if (!terminateDialog.id) return;
    setTerminateSubmitting(true);
    try {
      await mentorshipApi.adminTerminate(terminateDialog.id, 'Terminated by admin');
      toast.success('Mentorship terminated');
      setTerminateDialog({ open: false, id: null });
      await loadAdminData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to terminate mentorship');
    } finally {
      setTerminateSubmitting(false);
    }
  };

  const mentorProfileByUser = useMemo(() => {
    const map = new Map();
    mentorProfiles.forEach((p) => {
      const id = p?.user?._id || p?.user;
      if (id) map.set(String(id), p);
    });
    return map;
  }, [mentorProfiles]);

  const isManageAccountRoute = location.pathname.startsWith('/dashboard/manage-account');
  const isManageMentorsRoute = location.pathname.startsWith('/dashboard/manage-mentors');
  const isViewAllMentorshipRequests =
    location.pathname === '/dashboard/manage-mentors/view-all-mentorship';
  const isViewAllActiveMentorship =
    location.pathname === '/dashboard/manage-mentors/view-all-active-mentorship';
  const mentorMenteeUsers = useMemo(
    () => users.filter((u) => ['mentor', 'mentee'].includes((u?.role || '').toLowerCase())),
    [users]
  );
  const mentorUsers = useMemo(
    () => mentorMenteeUsers.filter((u) => (u?.role || '').toLowerCase() === 'mentor'),
    [mentorMenteeUsers]
  );
  const menteeUsers = useMemo(
    () => mentorMenteeUsers.filter((u) => (u?.role || '').toLowerCase() === 'mentee'),
    [mentorMenteeUsers]
  );

  const filteredMentorUsers = useMemo(() => {
    const q = manageAccountSearch.trim().toLowerCase();
    if (!q) return mentorUsers;
    return mentorUsers.filter((u) => {
      const name = String(u?.name || '').toLowerCase();
      const email = String(u?.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [mentorUsers, manageAccountSearch]);

  const filteredMenteeUsers = useMemo(() => {
    const q = manageAccountSearch.trim().toLowerCase();
    if (!q) return menteeUsers;
    return menteeUsers.filter((u) => {
      const name = String(u?.name || '').toLowerCase();
      const email = String(u?.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [menteeUsers, manageAccountSearch]);

  useEffect(() => {
    setMentorAccountPage(1);
    setMenteeAccountPage(1);
  }, [manageAccountSearch]);

  const mentorTotalPages = Math.max(1, Math.ceil(filteredMentorUsers.length / MANAGE_ACCOUNT_PAGE_SIZE));
  const menteeTotalPages = Math.max(1, Math.ceil(filteredMenteeUsers.length / MANAGE_ACCOUNT_PAGE_SIZE));

  useEffect(() => {
    setMentorAccountPage((p) => Math.min(p, mentorTotalPages));
  }, [mentorTotalPages]);

  useEffect(() => {
    setMenteeAccountPage((p) => Math.min(p, menteeTotalPages));
  }, [menteeTotalPages]);

  const mentorPageSafe = Math.min(Math.max(1, mentorAccountPage), mentorTotalPages);
  const menteePageSafe = Math.min(Math.max(1, menteeAccountPage), menteeTotalPages);

  const paginatedMentorUsers = useMemo(() => {
    const start = (mentorPageSafe - 1) * MANAGE_ACCOUNT_PAGE_SIZE;
    return filteredMentorUsers.slice(start, start + MANAGE_ACCOUNT_PAGE_SIZE);
  }, [filteredMentorUsers, mentorPageSafe]);

  const paginatedMenteeUsers = useMemo(() => {
    const start = (menteePageSafe - 1) * MANAGE_ACCOUNT_PAGE_SIZE;
    return filteredMenteeUsers.slice(start, start + MANAGE_ACCOUNT_PAGE_SIZE);
  }, [filteredMenteeUsers, menteePageSafe]);

  const exportManageAccountCsv = () => {
    const escape = (val) => {
      const s = String(val ?? '');
      if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    let headers;
    const lines = [];
    if (manageAccountTab === 'mentors') {
      headers = ['Name', 'Email', 'Verified', 'Suspended', 'Has mentor profile'];
      filteredMentorUsers.forEach((u) => {
        const mp = mentorProfileByUser.get(String(u.id || u._id));
        lines.push(
          [
            escape(u.name),
            escape(u.email),
            mp?.isVerified ? 'Yes' : 'No',
            u.isSuspended ? 'Yes' : 'No',
            mp ? 'Yes' : 'No',
          ].join(',')
        );
      });
    } else {
      headers = ['Name', 'Email', 'Suspended'];
      filteredMenteeUsers.forEach((u) => {
        lines.push([escape(u.name), escape(u.email), u.isSuspended ? 'Yes' : 'No'].join(','));
      });
    }
    const csv = [headers.join(','), ...lines].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leadsher-manage-account-${manageAccountTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const newestUnverifiedMentors = useMemo(() => (
    mentorProfiles
      .filter((p) => !p?.isVerified)
      .sort((a, b) => {
        const ta = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
        const tb = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
        return tb - ta;
      })
      .slice(0, 5)
  ), [mentorProfiles]);

  const mentorshipOverviewStats = useMemo(() => {
    const ms = reportData?.stats?.mentorships;
    const mr = reportData?.stats?.mentorshipRequests;
    const totalRequests = mr?.total ?? requests.length;
    const active = activeMentorships.length;
    const mActive = ms?.active ?? active;
    const mCompleted = ms?.completed ?? 0;
    const mPaused = ms?.paused ?? 0;
    const mTerminated = ms?.terminated ?? 0;
    const mTotal =
      ms?.total ?? Math.max(0, mActive + mCompleted + mPaused + mTerminated);
    const completionRate = mTotal > 0 ? (mCompleted / mTotal) * 100 : 0;

    const avgFromReport = reportData?.stats?.averageMentorRating;
    const ratings = feedbackRows
      .map((f) => f?.feedback?.mentorRating)
      .filter((n) => n != null && !Number.isNaN(Number(n)));
    const mentorRating =
      typeof avgFromReport === 'number' && avgFromReport > 0
        ? avgFromReport
        : ratings.length > 0
          ? ratings.reduce((a, b) => a + Number(b), 0) / ratings.length
          : 0;

    return {
      totalRequests,
      activeMentorships: active,
      completionRate,
      mentorRating,
    };
  }, [reportData, requests, activeMentorships, feedbackRows]);

  return (
    <>
          <AdminDashboardTopBar
            user={user}
            firstName={firstName}
            profileOpen={profileOpen}
            setProfileOpen={setProfileOpen}
            isManageMentorsRoute={isManageMentorsRoute}
            isManageAccountRoute={isManageAccountRoute}
            isViewAllMentorshipRequests={isViewAllMentorshipRequests}
            isViewAllActiveMentorship={isViewAllActiveMentorship}
          />

          <div
            className="p-8 space-y-6 w-full flex-1 max-w-[1280px] mx-auto"
          >

            {!isManageAccountRoute && !isManageMentorsRoute && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Total Stories', value: platformStoryTotal, icon: 'auto_stories' },
                { label: 'Total Events', value: platformEventTotal, icon: 'event' },
                { label: 'Active Mentorships', value: activeMentorships.length, icon: 'groups' },
                { label: 'Requests', value: requests.length, icon: 'report' },
              ].map((card) => (
                <div key={card.label} className="bg-white border border-outline-variant/20 rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <p className="text-xs uppercase tracking-widest text-outline font-bold">{card.label}</p>
                    <span className="material-symbols-outlined text-[#f43f5e]">{card.icon}</span>
                  </div>
                  <p className="mt-4 text-3xl font-serif-alt font-bold text-on-surface">{card.value}</p>
                </div>
              ))}
            </div>
            )}

            {loadingAdmin ? (
              <div className="py-12 flex justify-center"><Spinner size="lg" /></div>
            ) : (
              <>
                {isManageMentorsRoute &&
                  !isViewAllMentorshipRequests &&
                  !isViewAllActiveMentorship && (
                  <AdminMentorshipStatCards
                    totalRequests={mentorshipOverviewStats.totalRequests}
                    activeMentorships={mentorshipOverviewStats.activeMentorships}
                    completionRate={mentorshipOverviewStats.completionRate}
                    mentorRating={mentorshipOverviewStats.mentorRating}
                  />
                )}
                {isManageAccountRoute ? (
                  <div className="bg-white border border-outline-variant/20 rounded-xl p-8">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                      <div
                        className="flex items-center gap-1 rounded-xl border-2 border-outline-variant/30 bg-slate-50/80 p-1 shadow-inner"
                        role="tablist"
                        aria-label="Account type"
                      >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={manageAccountTab === 'mentors'}
                        onClick={() => setManageAccountTab('mentors')}
                        className={`min-h-[42px] px-5 rounded-lg text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/45 focus-visible:ring-offset-2 ${
                          manageAccountTab === 'mentors'
                            ? 'bg-[#f43f5e] text-white shadow-md ring-1 ring-black/10'
                            : 'border border-transparent bg-white text-on-surface shadow-sm hover:border-outline-variant/40 hover:bg-slate-50'
                        }`}
                      >
                        Mentors
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={manageAccountTab === 'mentees'}
                        onClick={() => setManageAccountTab('mentees')}
                        className={`min-h-[42px] px-5 rounded-lg text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/45 focus-visible:ring-offset-2 ${
                          manageAccountTab === 'mentees'
                            ? 'bg-[#f43f5e] text-white shadow-md ring-1 ring-black/10'
                            : 'border border-transparent bg-white text-on-surface shadow-sm hover:border-outline-variant/40 hover:bg-slate-50'
                        }`}
                      >
                        Mentees
                      </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setManageAccountFilterOpen((v) => !v)}
                          className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-bold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/40 focus-visible:ring-offset-2 ${
                            manageAccountFilterOpen || manageAccountSearch.trim()
                              ? 'border-[#f43f5e] bg-rose-50 text-[#f43f5e] ring-1 ring-[#f43f5e]/20'
                              : 'border-outline-variant/40 bg-white text-on-surface hover:border-outline-variant/60 hover:bg-slate-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px] leading-none" aria-hidden="true">filter_list</span>
                          Filter
                        </button>
                        <button
                          type="button"
                          onClick={exportManageAccountCsv}
                          className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border-2 border-slate-300 bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]"
                        >
                          <span className="material-symbols-outlined text-[20px] leading-none" aria-hidden="true">download</span>
                          Export
                        </button>
                      </div>
                    </div>

                    {(manageAccountFilterOpen || manageAccountSearch.trim()) && (
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <input
                          type="search"
                          value={manageAccountSearch}
                          onChange={(e) => setManageAccountSearch(e.target.value)}
                          placeholder="Search by name or email…"
                          className="min-w-[200px] flex-1 max-w-md rounded-lg border border-outline-variant/25 bg-white px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:border-[#f43f5e]/50 focus:outline-none focus:ring-1 focus:ring-[#f43f5e]/30"
                          autoFocus={manageAccountFilterOpen}
                        />
                        {manageAccountSearch.trim() && (
                          <button
                            type="button"
                            onClick={() => setManageAccountSearch('')}
                            className="inline-flex min-h-[40px] items-center rounded-lg border-2 border-outline-variant/35 bg-white px-4 text-sm font-bold text-on-surface shadow-sm transition-colors hover:border-[#f43f5e]/40 hover:bg-rose-50 hover:text-[#f43f5e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/35 focus-visible:ring-offset-2"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    )}

                    <div className="h-1" />

                    {mentorMenteeUsers.length === 0 ? (
                      <p className="text-on-surface-variant">No mentor/mentee profiles found.</p>
                    ) : (
                      <div className="space-y-10">
                        {manageAccountTab === 'mentors' && (
                        <section>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-serif-alt text-xl font-bold text-on-surface">Mentors</h3>
                            <span className="text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-[#f43f5e]/30 bg-[#f43f5e]/10 text-[#f43f5e] font-bold">
                              {manageAccountSearch.trim()
                                ? `${filteredMentorUsers.length} of ${mentorUsers.length} mentors`
                                : `${mentorUsers.length} mentors`}
                            </span>
                          </div>
                          {mentorUsers.length === 0 ? (
                            <p className="text-sm text-on-surface-variant">No mentor accounts found.</p>
                          ) : filteredMentorUsers.length === 0 ? (
                            <p className="text-sm text-on-surface-variant">No mentors match your search.</p>
                          ) : (
                            <>
                            <div className="space-y-3">
                              {paginatedMentorUsers.map((u) => {
                                const mentorProfile = mentorProfileByUser.get(String(u.id || u._id));
                                return (
                                  <div key={u.id || u._id} className="border border-outline-variant/15 rounded-xl px-4 py-3 bg-white">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded-md overflow-hidden border border-outline-variant/25 shrink-0">
                                          <img
                                            src={u.profilePicture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80'}
                                            alt={u.name || 'Profile'}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-semibold text-xl leading-5 text-on-surface line-clamp-1">{u.name}</p>
                                          <p className="text-xs text-outline line-clamp-1 mt-0.5">{u.email}</p>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-[#f43f5e]/20 bg-[#f43f5e]/10 text-[#f43f5e] font-bold">Mentor</span>
                                        <span className={`text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-md border font-bold ${
                                          mentorProfile?.isVerified
                                            ? 'border-green-300 bg-green-50 text-green-700'
                                            : 'border-amber-500/70 bg-amber-100 text-amber-900'
                                        }`}>
                                          {mentorProfile?.isVerified ? 'Verified' : 'Pending Verify'}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2 lg:w-[380px]">
                                        <button
                                          type="button"
                                          onClick={() => editUserProfile(u)}
                                          className="inline-flex min-h-[42px] items-center justify-center rounded-lg border-2 border-outline-variant/35 bg-white text-on-surface shadow-sm transition-colors hover:border-[#f43f5e]/45 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/35 focus-visible:ring-offset-1"
                                          title="Edit profile"
                                        >
                                          <span className="material-symbols-outlined text-[22px] leading-none">edit_square</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setSuspended(u.id || u._id, !u.isSuspended)}
                                          className={`min-h-[42px] rounded-lg border-2 px-2 text-xs font-bold uppercase tracking-wide shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                                            u.isSuspended
                                              ? 'border-green-500 bg-green-50 text-green-800 hover:bg-green-100 focus-visible:ring-green-400'
                                              : 'border-red-400 bg-white text-red-600 hover:bg-red-50 focus-visible:ring-red-400'
                                          }`}
                                        >
                                          {u.isSuspended ? 'Reactivate' : 'Suspend'}
                                        </button>
                                        <button
                                          type="button"
                                          disabled={!mentorProfile}
                                          onClick={() => mentorProfile && toggleVerifyMentor(mentorProfile)}
                                          className={`min-h-[42px] rounded-lg border-2 px-2 text-xs font-bold uppercase tracking-wide shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                                            mentorProfile?.isVerified
                                              ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-400'
                                              : 'border-[#f43f5e] bg-[#f43f5e] text-white hover:bg-[#e11d48] focus-visible:ring-[#f43f5e]'
                                          } ${!mentorProfile ? 'cursor-not-allowed opacity-50' : ''}`}
                                        >
                                          {!mentorProfile ? 'No profile' : mentorProfile.isVerified ? 'Unverify' : 'Verify'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <ManageAccountPaginationBar
                              page={mentorPageSafe}
                              totalPages={mentorTotalPages}
                              totalItems={filteredMentorUsers.length}
                              onPageChange={setMentorAccountPage}
                            />
                            </>
                          )}
                        </section>
                        )}

                        {manageAccountTab === 'mentees' && (
                        <section>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-serif-alt text-xl font-bold text-on-surface">Mentees</h3>
                            <span className="text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-[#f43f5e]/30 bg-[#f43f5e]/10 text-[#f43f5e] font-bold">
                              {manageAccountSearch.trim()
                                ? `${filteredMenteeUsers.length} of ${menteeUsers.length} mentees`
                                : `${menteeUsers.length} mentees`}
                            </span>
                          </div>
                          {menteeUsers.length === 0 ? (
                            <p className="text-sm text-on-surface-variant">No mentee accounts found.</p>
                          ) : filteredMenteeUsers.length === 0 ? (
                            <p className="text-sm text-on-surface-variant">No mentees match your search.</p>
                          ) : (
                            <>
                            <div className="space-y-3">
                              {paginatedMenteeUsers.map((u) => (
                                <div key={u.id || u._id} className="border border-outline-variant/15 rounded-xl px-4 py-3 bg-white">
                                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div className="w-10 h-10 rounded-md overflow-hidden border border-outline-variant/25 shrink-0">
                                        <img
                                          src={u.profilePicture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80'}
                                          alt={u.name || 'Profile'}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-xl leading-5 text-on-surface line-clamp-1">{u.name}</p>
                                        <p className="text-xs text-outline line-clamp-1 mt-0.5">{u.email}</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-[#f43f5e]/20 bg-[#f43f5e]/10 text-[#f43f5e] font-bold">Mentee</span>
                                      <span className={`text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-md border font-bold ${
                                        u.isSuspended ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-300 bg-green-50 text-green-700'
                                      }`}>
                                        {u.isSuspended ? 'Suspended' : 'Active'}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 lg:w-[260px]">
                                      <button
                                        type="button"
                                        onClick={() => editUserProfile(u)}
                                        className="inline-flex min-h-[42px] items-center justify-center rounded-lg border-2 border-outline-variant/35 bg-white text-on-surface shadow-sm transition-colors hover:border-[#f43f5e]/45 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]/35 focus-visible:ring-offset-1"
                                        title="Edit profile"
                                      >
                                        <span className="material-symbols-outlined text-[22px] leading-none">edit_square</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSuspended(u.id || u._id, !u.isSuspended)}
                                        className={`min-h-[42px] rounded-lg border-2 px-2 text-xs font-bold uppercase tracking-wide shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                                          u.isSuspended
                                            ? 'border-green-500 bg-green-50 text-green-800 hover:bg-green-100 focus-visible:ring-green-400'
                                            : 'border-red-400 bg-white text-red-600 hover:bg-red-50 focus-visible:ring-red-400'
                                        }`}
                                      >
                                        {u.isSuspended ? 'Reactivate' : 'Suspend'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <ManageAccountPaginationBar
                              page={menteePageSafe}
                              totalPages={menteeTotalPages}
                              totalItems={filteredMenteeUsers.length}
                              onPageChange={setMenteeAccountPage}
                            />
                            </>
                          )}
                        </section>
                        )}
                      </div>
                    )}
                  </div>
                ) : isManageMentorsRoute ? (
                  <AdminMentorshipNexusPanel
                    user={user}
                    authUsers={users}
                    mentorProfiles={mentorProfiles}
                    requests={requests}
                    activeMentorships={activeMentorships}
                    feedbackRows={feedbackRows}
                    onTerminate={openTerminateDialog}
                    variant={
                      isViewAllMentorshipRequests
                        ? 'all-requests'
                        : isViewAllActiveMentorship
                          ? 'all-active'
                          : 'overview'
                    }
                  />
                ) : (
                <>
                </>
                )}
              </>
            )}

            {!isManageAccountRoute && !isManageMentorsRoute && (
            <div className="bg-white border border-outline-variant/20 rounded-xl p-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif-alt text-2xl font-bold text-on-surface">Newest Pending Verify Mentors</h2>
                <Link
                  to="/dashboard/manage-account"
                  className="text-xs uppercase tracking-widest font-bold text-[#f43f5e] hover:text-[#e11d48] hover:underline"
                >
                  Manage verifications
                </Link>
              </div>
              {newestUnverifiedMentors.length === 0 ? (
                <p className="text-on-surface-variant text-sm">No pending mentors right now.</p>
              ) : (
                <div className="space-y-3">
                  {newestUnverifiedMentors.map((m) => {
                    const mentorUser = m?.user || {};
                    const avatar = mentorUser?.profilePicture || mentorUser?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80';
                    return (
                      <div key={m._id} className="border border-outline-variant/15 rounded-xl px-4 py-3 bg-surface-container-lowest/60">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-md overflow-hidden border border-outline-variant/25 shrink-0">
                              <img src={avatar} alt={mentorUser?.name || 'Mentor'} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-on-surface line-clamp-1">{mentorUser?.name || 'Mentor'}</p>
                              <p className="text-xs text-outline line-clamp-1">{mentorUser?.email || ''}</p>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-amber-500/70 bg-amber-100 text-amber-900 font-bold">
                            Pending Verify
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            {!isManageAccountRoute && !isManageMentorsRoute && (
            <div className="bg-white border border-outline-variant/20 rounded-xl p-8">
              <h2 className="font-serif-alt text-2xl font-bold text-on-surface">Admin Control Center</h2>
              <p className="text-on-surface-variant text-sm mt-2 mb-6">
                Use quick links to manage platform entities and moderation workflows.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <Link to="/stories" className="px-4 py-3 rounded-lg border border-outline-variant/25 hover:border-gold-accent/40 bg-white text-sm font-semibold text-on-surface">Review Stories</Link>
                <Link to="/events" className="px-4 py-3 rounded-lg border border-outline-variant/25 hover:border-gold-accent/40 bg-white text-sm font-semibold text-on-surface">Review Events</Link>
                <Link to="/dashboard/manage-account" className="px-4 py-3 rounded-lg border border-outline-variant/25 hover:border-gold-accent/40 bg-white text-sm font-semibold text-on-surface">Verify Mentor Status</Link>
                <Link to="/dashboard/settings" className="px-4 py-3 rounded-lg border border-outline-variant/25 hover:border-gold-accent/40 bg-white text-sm font-semibold text-on-surface">Platform Settings</Link>
              </div>
            </div>
            )}
          </div>

      {terminateDialog.open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close terminate dialog"
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            onClick={closeTerminateDialog}
            disabled={terminateSubmitting}
          />
          <div
            className="relative w-full max-w-md rounded-xl border border-outline-variant/20 bg-white dark:bg-surface-container-lowest shadow-2xl p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terminate-mentorship-title"
          >
            <h3
              id="terminate-mentorship-title"
              className="font-serif-alt text-xl font-bold text-on-surface"
            >
              Terminate mentorship?
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
              This ends the active mentorship for the mentor and mentee. They can start a new mentorship later if
              they choose.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeTerminateDialog}
                disabled={terminateSubmitting}
                className="px-4 py-2.5 rounded-lg border border-outline-variant/25 bg-white dark:bg-surface-container text-sm font-semibold text-on-surface hover:border-outline-variant/40 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTerminateMentorship}
                disabled={terminateSubmitting}
                className="inline-flex min-w-[10rem] items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 dark:bg-red-600 dark:hover:bg-red-500"
              >
                {terminateSubmitting ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    Terminating…
                  </>
                ) : (
                  'Yes, terminate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[1px] p-4 flex items-center justify-center">
          <div className="w-full max-w-xl bg-white border border-outline-variant/20 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between">
              <div>
                <h3 className="font-serif-alt text-xl font-bold text-on-surface">Update Profile Details</h3>
                <p className="text-xs text-outline mt-1">{editingUser?.email || ''}</p>
              </div>
              <button
                type="button"
                onClick={() => { setEditModalOpen(false); setEditingUser(null); }}
                className="w-8 h-8 rounded-md border border-outline-variant/20 text-outline hover:text-on-surface hover:bg-surface-container-lowest flex items-center justify-center"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={submitEditUserProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-outline font-bold mb-1.5">Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/25 bg-white text-sm text-on-surface"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-outline font-bold mb-1.5">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/25 bg-white text-sm text-on-surface min-h-[96px]"
                  placeholder="Short bio"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-outline font-bold mb-1.5">Profile Picture URL</label>
                  <input
                    value={editForm.profilePicture}
                    onChange={(e) => setEditForm((f) => ({ ...f, profilePicture: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/25 bg-white text-sm text-on-surface"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-outline font-bold mb-1.5">Avatar URL</label>
                  <input
                    value={editForm.avatar}
                    onChange={(e) => setEditForm((f) => ({ ...f, avatar: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/25 bg-white text-sm text-on-surface"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setEditModalOpen(false); setEditingUser(null); }}
                  className="px-4 py-2 rounded-lg border border-outline-variant/25 bg-white text-sm font-semibold text-on-surface hover:border-gold-accent/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2 rounded-lg bg-[#f43f5e] text-white text-sm font-semibold hover:bg-[#e11d48] disabled:opacity-60"
                >
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
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
  if (roleLc === 'admin') {
    return (
      <AdminDashboard user={user} />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10">
      {/* Welcome */}
      <div className="bg-white dark:bg-surface-container-lowest rounded-2xl border border-outline-variant/15 px-8 py-8 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            to="/dashboard/stories/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#f43f5e] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#e11d48] active:scale-[0.98]"
          >
            + New Story
          </Link>
          {canManageEvents && (
            <Link
              to="/events/new"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg border-2 border-[#f43f5e]/35 bg-white px-6 py-3 text-sm font-bold text-on-surface shadow-sm transition-colors hover:border-[#f43f5e] hover:bg-rose-50"
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
          { label: 'Total Views',       value: myStories.reduce((a, s) => a + Number(s?.views ?? s?.viewCount ?? 0), 0) },
          { label: 'Total Likes',       value: myStories.reduce((a, s) => a + Number(s?.likeCount ?? s?.likes?.length ?? 0), 0) },
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
          <Link to="/dashboard/stories/new" className="btn-secondary text-sm">+ Add</Link>
        </div>

        {myStories.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-gray-400 mb-4">You haven't written any stories yet.</p>
            <Link to="/dashboard/stories/new" className="btn-primary">Write your first story</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myStories.map((s) => (
              <div key={s._id} className="relative group">
                <StoryCard story={s} />
                <div className="absolute top-2 right-2 hidden group-hover:flex gap-1.5">
                  <Link to={`/dashboard/stories/${s._id}/edit`}
                    className="bg-white text-xs px-2.5 py-1 rounded-lg text-gray-700 hover:bg-gray-50 border">Edit</Link>
                  <button onClick={() => handleDeleteStory(s._id)}
                    className="bg-white text-xs px-2.5 py-1 rounded-lg text-red-500 hover:bg-red-50 border">Del</button>
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
