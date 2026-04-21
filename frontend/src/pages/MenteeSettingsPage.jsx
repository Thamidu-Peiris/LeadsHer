import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
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
    <>
          <DashboardTopBar crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Settings' }]} showAvatar={false} />

          <div className="p-8 max-w-5xl space-y-8">
            <div className="rounded-xl border border-outline-variant/20 bg-white p-6 dark:bg-surface-container-lowest">
              <h1 className="font-serif-alt text-3xl font-bold text-on-surface">Settings</h1>
              <p className="text-on-surface-variant text-sm mt-1">Profile and account security</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <section className="bg-white border border-outline-variant/20 rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-2xl text-rose-500 dark:text-rose-400">manage_accounts</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-on-surface text-lg">Profile settings</h2>
                    <p className="text-sm text-on-surface-variant mt-1">
                      Update your name, bio, goals, interests, and avatar.
                    </p>
                    {profileLoading ? (
                      <div className="mt-4 flex items-center gap-3 text-sm text-outline">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent dark:border-rose-400" />
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
                                <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:border-rose-400 hover:bg-rose-50 dark:hover:border-rose-500/50 dark:hover:bg-rose-950/40">
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
                            className="w-full rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm outline-none focus:border-rose-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">About you</label>
                          <textarea
                            name="bio"
                            value={profileForm.bio}
                            onChange={handleProfileChange}
                            rows={3}
                            className="w-full resize-y rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm outline-none focus:border-rose-400"
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
                            className="w-full resize-y rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm outline-none focus:border-rose-400"
                            placeholder="What do you want to learn or achieve?"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Interests</label>
                          <input
                            name="interests"
                            value={profileForm.interests}
                            onChange={handleProfileChange}
                            className="w-full rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm outline-none focus:border-rose-400"
                            placeholder="e.g. leadership, STEM, entrepreneurship"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="w-full rounded-lg bg-rose-500 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:opacity-60 dark:hover:bg-rose-400 sm:w-auto"
                        >
                          {profileSaving ? 'Saving…' : 'Save changes'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </section>

              <section className="bg-white border border-outline-variant/20 rounded-xl p-6 space-y-4 lg:sticky lg:top-24">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-2xl text-rose-500 dark:text-rose-400">lock_reset</span>
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
                        className="w-full rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm outline-none focus:border-rose-400"
                        placeholder="you@example.com"
                      />
                      <button
                        type="submit"
                        disabled={sendingReset}
                        className="w-full rounded-lg bg-rose-500 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:opacity-50 dark:hover:bg-rose-400 sm:w-auto"
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
    </>
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
