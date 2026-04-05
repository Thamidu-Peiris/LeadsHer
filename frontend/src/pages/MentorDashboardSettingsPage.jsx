import { useEffect, useMemo, useState } from 'react';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import { mentorApi } from '../api/mentorApi';
import { authApi } from '../api/authApi';

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
  const { user, updateUser, isAdmin } = useAuth();

  const [emailVerificationRequired, setEmailVerificationRequired] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pictureSaving, setPictureSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [pictureFile, setPictureFile] = useState(null);
  const [picturePreview, setPicturePreview] = useState('');
  const [resetEmail, setResetEmail] = useState(user?.email || '');

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    expertise: '',
    yearsOfExperience: 0,
    industries: '',
    mentoringAreas: '',
    bio: '',
    achievements: '',
    maxMentees: 3,
    preferredTime: '',
    timezone: 'UTC',
  });
  const avatarSrc =
    picturePreview ||
    user?.profilePicture ||
    user?.avatar ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80';

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
          achievements: (data.achievements || []).join(', '),
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

  useEffect(() => {
    if (!isAdmin) return;
    setSettingsLoading(true);
    authApi
      .getRegistrationConfig()
      .then((res) => setEmailVerificationRequired(!!res.data?.emailVerificationRequired))
      .catch(() => {})
      .finally(() => setSettingsLoading(false));
  }, [isAdmin]);

  const savePlatformSettings = async () => {
    setSettingsSaving(true);
    try {
      await authApi.adminUpdateAppSettings({ emailVerificationRequired });
      toast.success('Platform settings saved');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handlePictureFile = (e) => {
    const file = e.target.files?.[0] || null;
    setPictureFile(file);
    if (file) setPicturePreview(URL.createObjectURL(file));
    else setPicturePreview('');
  };

  const saveProfilePicture = async () => {
    if (!pictureFile) {
      toast.error('Choose a profile image first');
      return;
    }
    setPictureSaving(true);
    try {
      const fd = new FormData();
      fd.append('profilePicture', pictureFile);
      const res = await authApi.updateProfileMultipart(fd);
      const u = res.data?.user || res.data;
      if (u) updateUser(u);
      toast.success('Profile image updated');
      setPictureFile(null);
      setPicturePreview('');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update profile image');
    } finally {
      setPictureSaving(false);
    }
  };

  const sendPasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail?.trim()) {
      toast.error('Enter your email address');
      return;
    }
    setSendingReset(true);
    try {
      await authApi.forgotPassword(resetEmail.trim());
      toast.success('If an account exists, reset instructions were sent.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset email');
    } finally {
      setSendingReset(false);
    }
  };

  const save = async () => {
    const payload = {
      expertise: toList(form.expertise),
      yearsOfExperience: Number(form.yearsOfExperience),
      industries: toList(form.industries),
      mentoringAreas: toList(form.mentoringAreas),
      bio: form.bio,
      achievements: toList(form.achievements),
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
    <>
          <DashboardTopBar crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Settings' }]} />

          <div className="p-8 space-y-6 max-w-[1000px] mx-auto w-full">
            {isAdmin && (
              <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8 border-l-4 border-l-gold-accent">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="font-serif-alt text-xl font-bold text-on-surface">Platform: email verification</h2>
                    <p className="text-sm text-on-surface-variant mt-1 max-w-xl">
                      When enabled, new users must enter a 6-digit code sent by email (Brevo SMTP) before they can sign
                      in or use the dashboard. When disabled, accounts are activated immediately on registration.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Off</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={emailVerificationRequired}
                      disabled={settingsLoading || settingsSaving}
                      onClick={() => setEmailVerificationRequired((v) => !v)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full border transition-colors disabled:opacity-60 ${
                        emailVerificationRequired
                          ? 'bg-gold-accent/30 border-gold-accent/50'
                          : 'bg-outline-variant/25 border-outline-variant/40'
                      }`}
                    >
                      <span
                        className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition-transform ${
                          emailVerificationRequired ? 'translate-x-7' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Required</span>
                    <button
                      type="button"
                      disabled={settingsSaving || settingsLoading}
                      onClick={savePlatformSettings}
                      className="bg-gold-accent text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-60"
                    >
                      {settingsSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
                {settingsLoading && <p className="text-xs text-outline mt-3">Loading current setting…</p>}
              </section>
            )}

            <section className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-8">
              <div className="flex items-start justify-between gap-4 flex-col md:flex-row md:items-center">
                <div>
                  <h1 className="font-serif-alt text-3xl font-bold text-on-surface">Mentor Profile</h1>
                  <p className="text-on-surface-variant text-sm mt-1">
                    {complete ? 'Your profile is complete.' : 'Complete your profile to receive better mentorship matches.'}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border ${
                        profile?.isAvailable
                          ? 'bg-green-500/10 text-green-700 border-green-500/20'
                          : 'bg-outline-variant/20 text-outline border-outline-variant/30'
                      }`}
                    >
                      {profile?.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                    <label className="inline-flex items-center gap-2 select-none">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Off</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!profile?.isAvailable}
                        disabled={loading || saving}
                        onClick={async () => {
                          try {
                            await mentorApi.toggleAvailability();
                            await load();
                            toast.success(`Availability set to ${!profile?.isAvailable ? 'available' : 'unavailable'}`);
                          } catch (e) {
                            toast.error(e.response?.data?.message || 'Failed to toggle availability');
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors disabled:opacity-60 ${
                          profile?.isAvailable
                            ? 'bg-green-500/20 border-green-500/30'
                            : 'bg-outline-variant/25 border-outline-variant/40'
                        }`}
                        title={profile?.isAvailable ? 'Turn off availability' : 'Turn on availability'}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            profile?.isAvailable ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-outline">On</span>
                    </label>
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
              </div>

              {loading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
              ) : (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Profile picture</label>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-lowest">
                        <img alt="" className="w-full h-full object-cover rounded-full" src={avatarSrc} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center justify-center px-4 py-2 border border-outline-variant/40 text-sm font-medium text-on-surface hover:border-gold-accent hover:bg-gold-accent/5 transition-colors cursor-pointer">
                            Choose image
                            <input type="file" accept="image/*" onChange={handlePictureFile} className="hidden" />
                          </label>
                          <button
                            type="button"
                            disabled={pictureSaving}
                            onClick={saveProfilePicture}
                            className="bg-gold-accent text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-60 uppercase tracking-wider"
                          >
                            {pictureSaving ? 'Uploading…' : 'Upload'}
                          </button>
                          <span className="text-xs text-outline truncate">{pictureFile?.name || 'No file chosen'}</span>
                        </div>
                        <p className="text-[11px] text-outline mt-1">JPG/PNG/WebP, max 5MB. Uploaded to Cloudinary.</p>
                      </div>
                    </div>
                  </div>
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

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">
                      Achievements (comma-separated)
                    </label>
                    <input
                      className="w-full input"
                      value={form.achievements}
                      onChange={(e) => setForm((f) => ({ ...f, achievements: e.target.value }))}
                      placeholder="Awards, Certifications, Key milestones"
                    />
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

            <section className="bg-white border border-outline-variant/20 rounded-xl p-6 space-y-4 max-w-[900px]">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-gold-accent text-2xl">lock_reset</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-on-surface text-lg">Forgot / reset password</h2>
                    <p className="text-sm text-on-surface-variant mt-1">
                      We will email you a link to set a new password for this account.
                    </p>
                    <form onSubmit={sendPasswordReset} className="mt-4 space-y-3">
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
                  </div>
                </div>
            </section>
          </div>
    </>
  );
}

