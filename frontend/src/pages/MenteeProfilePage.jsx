import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

export default function MenteeProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    bio: '',
    learningGoals: '',
    interests: '',
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');

  const currentProfilePicture = useMemo(
    () => user?.profilePicture || user?.avatar || '',
    [user?.profilePicture, user?.avatar]
  );

  useEffect(() => {
    let cancelled = false;
    authApi
      .getProfile()
      .then((res) => {
        const u = res.data?.user || res.data;
        if (cancelled || !u) return;
        const { main, goals, interests } = parseStoredBio(u.bio || '');
        setForm({
          name: u.name || '',
          bio: main,
          learningGoals: goals,
          interests: interests,
        });
      })
      .catch(() => toast.error('Could not load profile'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const combinedBio = buildCombinedBio(form.bio, form.learningGoals, form.interests);
      let data;
      if (file) {
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('bio', combinedBio);
        fd.append('profilePicture', file);
        const res = await authApi.updateProfileMultipart(fd);
        data = res.data;
      } else {
        const res = await authApi.updateProfile({
          name: form.name,
          bio: combinedBio,
        });
        data = res.data;
      }
      updateUser(data?.user || data);
      toast.success('Profile saved');
      setFile(null);
      setPreview('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
        <span className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-12 max-w-2xl mx-auto">
      <p className="font-label text-[10px] tracking-[0.25em] uppercase text-outline mb-2">Mentee</p>
      <h1 className="font-accent text-3xl md:text-4xl text-on-surface mb-2">Your profile</h1>
      <p className="font-sans-modern text-sm text-on-surface-variant mb-10">
        Help mentors understand your goals and interests.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline mb-2">Profile picture</label>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-lowest">
              <img
                alt=""
                className="w-full h-full object-cover"
                src={preview || currentProfilePicture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face&q=80'}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center justify-center px-4 py-2 border border-outline-variant/40 text-sm font-medium text-on-surface hover:border-gold-accent hover:bg-gold-accent/5 transition-colors cursor-pointer">
                  Choose image
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                </label>
                <span className="text-xs text-outline truncate">{file?.name || 'No file chosen'}</span>
              </div>
              <p className="text-[11px] text-outline mt-1">JPG/PNG/WebP, max 5MB.</p>
            </div>
          </div>
          <p className="text-[10px] mt-2 text-outline tracking-wider uppercase">Uploaded to Cloudinary</p>
        </div>
        <div>
          <label className="block font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline mb-2">Display name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border-b-2 border-outline-variant focus:border-primary bg-transparent py-2.5 outline-none"
          />
        </div>
        <div>
          <label className="block font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline mb-2">About you</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={4}
            placeholder="A short introduction about yourself"
            className="w-full border border-outline-variant/40 focus:border-primary bg-surface-container-lowest px-4 py-3 font-sans-modern text-sm outline-none resize-y min-h-[100px]"
          />
        </div>
        <div>
          <label className="block font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline mb-2">Learning goals</label>
          <textarea
            name="learningGoals"
            value={form.learningGoals}
            onChange={handleChange}
            rows={3}
            placeholder="What do you want to learn or achieve with mentorship?"
            className="w-full border border-outline-variant/40 focus:border-primary bg-surface-container-lowest px-4 py-3 font-sans-modern text-sm outline-none resize-y"
          />
        </div>
        <div>
          <label className="block font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline mb-2">Interests</label>
          <input
            name="interests"
            value={form.interests}
            onChange={handleChange}
            placeholder="e.g. leadership, STEM, entrepreneurship"
            className="w-full border-b-2 border-outline-variant focus:border-primary bg-transparent py-2.5 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-gold-accent text-white px-8 py-3 font-brand text-xs tracking-[0.2em] uppercase hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
          <Link to="/dashboard/mentors" className="inline-flex items-center border border-outline-variant px-8 py-3 font-brand text-xs tracking-[0.2em] uppercase text-outline hover:border-primary">
            Back to mentorship
          </Link>
        </div>
      </form>
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
