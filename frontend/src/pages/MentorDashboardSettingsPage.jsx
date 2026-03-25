import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import { mentorApi } from '../api/mentorApi';

function toList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).split(',').map((t) => t.trim()).filter(Boolean);
}

function isProfileComplete(p) {
  if (!p) return false;
  const expertise = p.expertise || [];
  const industries = p.industries || [];
  const mentoringAreas = p.mentoringAreas || [];
  const years = p.yearsOfExperience;
  const bio = p.bio;
  return (
    Array.isArray(expertise) && expertise.length > 0 &&
    Array.isArray(industries) && industries.length > 0 &&
    Array.isArray(mentoringAreas) && mentoringAreas.length > 0 &&
    typeof years === 'number' && years >= 0 &&
    typeof bio === 'string' && bio.trim().length > 0
  );
}

export default function MentorDashboardSettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')?.[0] || 'Mentor';

  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    expertise: '',
    yearsOfExperience: 0,
    industries: '',
    mentoringAreas: '',
    bio: '',
    maxMentees: 3,
    preferredTime: '',
    timezone: 'UTC',
  });

  const complete = useMemo(() => isProfileComplete(profile), [profile]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await mentorApi.getMyProfile();
      const data = res.data?.data || res.data?.data?.data || res.data?.data || null;
      setProfile(data);
      if (data) {
        setForm({
          expertise: (data.expertise || []).join(', '),
          yearsOfExperience: data.yearsOfExperience ?? 0,
          industries: (data.industries || []).join(', '),
          mentoringAreas: (data.mentoringAreas || []).join(', '),
          bio: data.bio || '',
          maxMentees: data.availability?.maxMentees ?? 3,
          preferredTime: (data.availability?.preferredTime || []).join(', '),
          timezone: data.availability?.timezone || 'UTC',
        });
      }
    } catch (e) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = {
      expertise: toList(form.expertise),
      yearsOfExperience: Number(form.yearsOfExperience),
      industries: toList(form.industries),
      mentoringAreas: toList(form.mentoringAreas),
      bio: form.bio,
      availability: {
        maxMentees: Number(form.maxMentees),
        preferredTime: toList(form.preferredTime),
        timezone: form.timezone,
      },
    };
    setSaving(true);
    try {
      await mentorApi.upsertProfile(payload);
      toast.success('Mentor profile saved');
      localStorage.setItem(`leadsher_onboarding_mentorprofile_${user?._id}`, '1');
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen overflow-hidden bg-surface text-on-surface">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-outline-variant/20 flex flex-col z-40">
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

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {[
              { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
              { to: '/dashboard/stories', icon: 'auto_stories', label: 'Stories' },
              { to: '/dashboard/mentorship', icon: 'groups', label: 'Mentorship' },
              { to: '/events', icon: 'event', label: 'Events' },
              { to: '/resources', icon: 'library_books', label: 'Resources' },
              { to: '/forum', icon: 'forum', label: 'Forum' },
              { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 transition-all ${
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
        </aside>

        {/* Main */}
        <main className="ml-[260px] flex-1 flex flex-col min-h-screen">
          <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-outline">
              <Link className="hover:text-gold-accent transition-colors" to="/">Home</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <Link className="hover:text-gold-accent transition-colors" to="/dashboard">Dashboard</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface">Settings</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/25 hover:border-gold-accent transition-colors focus:outline-none focus:ring-2 focus:ring-gold-accent/40"
                >
                  <img
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face&q=80"
                  />
                </button>
                {profileOpen && (
                  <div role="menu" className="absolute right-0 mt-3 w-56 bg-white border border-outline-variant/20 editorial-shadow z-50">
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

          <div className="p-8 space-y-6 max-w-[1000px] mx-auto w-full">
            <section className="bg-white border border-outline-variant/20 editorial-shadow rounded-xl p-8">
              <div className="flex items-start justify-between gap-4 flex-col md:flex-row md:items-center">
                <div>
                  <h1 className="font-serif-alt text-3xl font-bold text-on-surface">Mentor Profile</h1>
                  <p className="text-on-surface-variant text-sm mt-1">
                    {complete ? 'Your profile is complete.' : 'Complete your profile to receive better mentorship matches.'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={save}
                  className="bg-gold-accent text-white px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
              ) : (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Expertise *</label>
                    <input className="w-full input" value={form.expertise} onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))} placeholder="Leadership, Technology, Strategy" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Years of Experience *</label>
                    <input type="number" min={0} className="w-full input" value={form.yearsOfExperience} onChange={(e) => setForm((f) => ({ ...f, yearsOfExperience: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Industries *</label>
                    <input className="w-full input" value={form.industries} onChange={(e) => setForm((f) => ({ ...f, industries: e.target.value }))} placeholder="FinTech, Education, Health" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Mentoring Areas *</label>
                    <input className="w-full input" value={form.mentoringAreas} onChange={(e) => setForm((f) => ({ ...f, mentoringAreas: e.target.value }))} placeholder="Career growth, Negotiation, Confidence" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Bio *</label>
                    <textarea className="w-full input h-32 resize-y" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Max mentees</label>
                    <input type="number" min={1} max={10} className="w-full input" value={form.maxMentees} onChange={(e) => setForm((f) => ({ ...f, maxMentees: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Timezone</label>
                    <input className="w-full input" value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} placeholder="Asia/Colombo" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Preferred time (comma-separated)</label>
                    <input className="w-full input" value={form.preferredTime} onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))} placeholder="Weeknights, Weekends" />
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

