import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';

export default function MenteeSettingsPage() {
  const { user, updateUser } = useAuth();
  const firstName = user?.name?.split(' ')?.[0] || 'Mentee';
  const [resetEmail, setResetEmail] = useState(user?.email || '');
  const [sendingReset, setSendingReset] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: '',
    learningGoals: '',
    interests: '',
  });
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');

  const menteeAvatarSrc =
    user?.profilePicture || user?.avatar ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80';

  const currentProfilePicture = useMemo(
    () => user?.profilePicture || user?.avatar || '',
    [user?.profilePicture, user?.avatar]
  );

  useEffect(() => {
    let cancelled = false;
    setProfileLoading(true);
    authApi
      .getProfile()
      .then((res) => {
        const u = res.data?.user || res.data;
        if (cancelled || !u) return;
        const { main, goals, interests } = parseStoredBio(u.bio || '');
        setProfileForm({
          name: u.name || '',
          bio: main,
          learningGoals: goals,
          interests,
        });
        if (!resetEmail) setResetEmail(u.email || '');
      })
      .catch(() => toast.error('Could not load profile'))
      .finally(() => { if (!cancelled) setProfileLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail?.trim()) {
      toast.error('Enter your email address');
      return;
    }
    setSendingReset(true);
    try {
      await authApi.forgotPassword(resetEmail.trim());
      toast.success('If an account exists, you will receive reset instructions by email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset email');
    } finally {
      setSendingReset(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((f) => ({ ...f, [name]: value }));
  };

  const handleProfileFile = (e) => {
    const file = e.target.files?.[0] || null;
    setProfileFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setProfilePreview(url);
    } else {
      setProfilePreview('');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const combinedBio = buildCombinedBio(profileForm.bio, profileForm.learningGoals, profileForm.interests);
      let data;
      if (profileFile) {
        const fd = new FormData();
        fd.append('name', profileForm.name);
        fd.append('bio', combinedBio);
        fd.append('profilePicture', profileFile);
        const res = await authApi.updateProfileMultipart(fd);
        data = res.data;
      } else {
        const res = await authApi.updateProfile({
          name: profileForm.name,
          bio: combinedBio,
        });
        data = res.data;
      }
      const u = data?.user || data;
      if (u) updateUser(u);
      toast.success('Profile saved');
      setProfileFile(null);
      setProfilePreview('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen overflow-hidden bg-surface text-on-surface">
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-outline-variant/20 flex flex-col z-40">
          <div className="p-4 border-b border-outline-variant/20">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-gold-accent p-0.5 overflow-hidden">
                  <img alt="" className="w-full h-full object-cover" src={menteeAvatarSrc} />
                </div>
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <p className="text-on-surface font-bold text-base text-center leading-tight px-1">{firstName}</p>
            </div>
          </div>

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

          <div className="p-4 mt-auto border-t border-outline-variant/20">
            <Link
              to="/dashboard/mentors"
              className="w-full bg-gradient-to-r from-gold-accent to-primary text-white text-xs font-bold py-3 rounded-lg shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              FIND A MENTOR
            </Link>
          </div>
        </aside>

        <main className="ml-[260px] flex-1 flex flex-col min-h-screen">
          <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-outline">
              <Link className="hover:text-gold-accent transition-colors" to="/">Home</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <Link className="hover:text-gold-accent transition-colors" to="/dashboard">Dashboard</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface">Settings</span>
            </div>
          </header>

          <div className="p-8 max-w-5xl space-y-8">
            <div>
              <h1 className="font-serif-alt text-3xl font-bold text-on-surface">Settings</h1>
              <p className="text-on-surface-variant text-sm mt-1">Profile and account security</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <section className="bg-white border border-outline-variant/20 editorial-shadow rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-gold-accent text-2xl">manage_accounts</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-on-surface text-lg">Profile settings</h2>
                    <p className="text-sm text-on-surface-variant mt-1">
                      Update your name, bio, goals, interests, and avatar.
                    </p>
                    {profileLoading ? (
                      <div className="mt-4 flex items-center gap-3 text-sm text-outline">
                        <span className="w-5 h-5 rounded-full border-2 border-gold-accent border-t-transparent animate-spin" />
                        Loading profile…
                      </div>
                    ) : (
                      <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Profile picture</label>
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-lowest">
                              <img
                                alt=""
                                className="w-full h-full object-cover"
                                src={profilePreview || currentProfilePicture || menteeAvatarSrc}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <label className="inline-flex items-center justify-center px-4 py-2 border border-outline-variant/40 text-sm font-medium text-on-surface hover:border-gold-accent hover:bg-gold-accent/5 transition-colors cursor-pointer">
                                  Choose image
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfileFile}
                                    className="hidden"
                                  />
                                </label>
                                <span className="text-xs text-outline truncate">
                                  {profileFile?.name || 'No file chosen'}
                                </span>
                              </div>
                              <p className="text-[11px] text-outline mt-1">JPG/PNG/WebP, max 5MB.</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Name</label>
                          <input
                            name="name"
                            value={profileForm.name}
                            onChange={handleProfileChange}
                            className="w-full border border-outline-variant/40 rounded-lg px-4 py-2.5 text-sm focus:border-gold-accent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">About you</label>
                          <textarea
                            name="bio"
                            value={profileForm.bio}
                            onChange={handleProfileChange}
                            rows={3}
                            className="w-full border border-outline-variant/40 rounded-lg px-4 py-2.5 text-sm focus:border-gold-accent outline-none resize-y"
                            placeholder="Short introduction"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Learning goals</label>
                          <textarea
                            name="learningGoals"
                            value={profileForm.learningGoals}
                            onChange={handleProfileChange}
                            rows={2}
                            className="w-full border border-outline-variant/40 rounded-lg px-4 py-2.5 text-sm focus:border-gold-accent outline-none resize-y"
                            placeholder="What do you want to learn or achieve?"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Interests</label>
                          <input
                            name="interests"
                            value={profileForm.interests}
                            onChange={handleProfileChange}
                            className="w-full border border-outline-variant/40 rounded-lg px-4 py-2.5 text-sm focus:border-gold-accent outline-none"
                            placeholder="e.g. leadership, STEM, entrepreneurship"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="w-full sm:w-auto bg-gold-accent text-white text-xs font-bold px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-60 uppercase tracking-wider"
                        >
                          {profileSaving ? 'Saving…' : 'Save changes'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </section>

              <section className="bg-white border border-outline-variant/20 editorial-shadow rounded-xl p-6 space-y-4 lg:sticky lg:top-24">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-gold-accent text-2xl">lock_reset</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-on-surface text-lg">Forgot / reset password</h2>
                    <p className="text-sm text-on-surface-variant mt-1">
                      We will email you a link to set a new password. Use the email address for this account.
                    </p>
                    <form onSubmit={handleForgotPassword} className="mt-4 space-y-3">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-outline">Email</label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        autoComplete="email"
                        className="w-full border border-outline-variant/40 rounded-lg px-4 py-2.5 text-sm focus:border-gold-accent outline-none"
                        placeholder="you@example.com"
                      />
                      <button
                        type="submit"
                        disabled={sendingReset}
                        className="w-full sm:w-auto border border-outline-variant px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-on-surface hover:border-gold-accent hover:bg-gold-accent/5 disabled:opacity-50"
                      >
                        {sendingReset ? 'Sending…' : 'Send reset link'}
                      </button>
                    </form>
                    <p className="text-xs text-outline mt-3">
                      Not receiving mail? Check spam or try again in a few minutes.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function buildCombinedBio(main, goals, interests) {
  const parts = [main?.trim() || ''];
  if (goals?.trim()) parts.push(`\n\n[Goals]\n${goals.trim()}`);
  if (interests?.trim()) parts.push(`\n\n[Interests]\n${interests.trim()}`);
  return parts.join('').trim();
}

function parseStoredBio(bio) {
  if (!bio || typeof bio !== 'string') return { main: '', goals: '', interests: '' };
  const parts = bio.split(/\n\n\[Goals\]\n/);
  const mainPart = (parts[0] || '').trim();
  const afterGoals = parts[1];
  if (!afterGoals) return { main: mainPart, goals: '', interests: '' };
  const [goalsBlock, ...rest] = afterGoals.split(/\n\n\[Interests\]\n/);
  return {
    main: mainPart,
    goals: (goalsBlock || '').trim(),
    interests: (rest.join('\n\n[Interests]\n') || '').trim(),
  };
}
