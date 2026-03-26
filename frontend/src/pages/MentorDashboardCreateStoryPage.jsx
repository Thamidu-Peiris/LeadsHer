import { useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { storyApi } from '../api/storyApi';
import Spinner from '../components/common/Spinner';

const CATEGORY_CHOICES = [
  { value: 'leadership', icon: 'diversity_3', label: 'Leadership' },
  { value: 'STEM', icon: 'science', label: 'STEM' },
  { value: 'entrepreneurship', icon: 'lightbulb', label: 'Innovation' },
  { value: 'career-growth', icon: 'spa', label: 'Wellness' },
  { value: 'social-impact', icon: 'campaign', label: 'Advocacy' },
  { value: 'corporate', icon: 'account_balance', label: 'Finance' },
];

export default function MentorDashboardCreateStoryPage() {
  const { user, logout, canManageEvents } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')?.[0] || 'Mentor';
  const [profileOpen, setProfileOpen] = useState(false);

  const [form, setForm] = useState({
    coverImage: '',
    title: '',
    excerpt: '',
    content: '',
    category: 'leadership',
    tags: '',
  });
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [status, setStatus] = useState('draft');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState('');

  const tagsList = useMemo(
    () => form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    [form.tags]
  );
  const wordCount = useMemo(
    () => form.content.trim().split(/\\s+/).filter(Boolean).length,
    [form.content]
  );
  const excerptWords = useMemo(
    () => form.excerpt.trim().split(/\\s+/).filter(Boolean).length,
    [form.excerpt]
  );
  const readingMins = Math.max(1, Math.ceil(wordCount / 200));

  const checklist = useMemo(() => ([
    { ok: !!form.title.trim(), text: 'Compelling story title' },
    { ok: !!form.coverImage.trim(), text: 'High-quality cover image' },
    { ok: excerptWords >= 8, text: 'Editorial excerpt (recommended)' },
    { ok: tagsList.length >= 3, text: 'Story tags (at least 3)' },
  ]), [excerptWords, form.coverImage, form.title, tagsList.length]);

  const setField = (key, value) => {
    setError('');
    setForm((f) => ({ ...f, [key]: value }));
  };

  const saveStory = async (nextStatus) => {
    setError('');
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.');
      return;
    }
    if (nextStatus === 'published' && wordCount < 100) {
      setError('Published stories must have at least 100 words.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        category: form.category,
        coverImage: form.coverImage || undefined,
        status: nextStatus,
        tags: tagsList.slice(0, 5),
      };
      const res = await storyApi.create(payload);
      setStatus(nextStatus);
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      toast.success(nextStatus === 'published' ? 'Story published!' : 'Draft saved!');
      navigate(`/stories/${res.data._id}`);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save story.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen overflow-hidden bg-surface text-on-surface">
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white dark:bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col z-40">
          <div className="p-6 flex flex-col items-center gap-3 border-b border-outline-variant/20">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-gold-accent p-0.5 overflow-hidden">
                <img
                  alt="User avatar"
                  className="w-full h-full object-cover rounded-full"
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
              { to: '/dashboard/resources', icon: 'library_books', label: 'Resources' },
              { to: '/forum', icon: 'forum', label: 'Forum' },
              { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
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
        </aside>

        <main className="ml-[260px] flex-1 flex flex-col min-h-screen">
          <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white/80 dark:bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-outline">
              <Link className="hover:text-gold-accent transition-colors" to="/">
                Home
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <Link className="hover:text-gold-accent transition-colors" to="/dashboard">
                Dashboard
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <Link className="hover:text-gold-accent transition-colors" to="/dashboard/stories">
                Stories
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface">New</span>
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
                    className="w-full h-full object-cover rounded-full"
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face&q=80"
                  />
                </button>

                {profileOpen && (
                  <div role="menu" className="absolute right-0 mt-3 w-56 bg-white dark:bg-surface-container border border-outline-variant/20 editorial-shadow z-50">
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

          {/* Luminary Editor */}
          <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Left: Editorial Canvas */}
            <section className="w-[65%] h-full overflow-y-auto bg-white dark:bg-surface-container-lowest border-r border-outline-variant/15">
              <div className="max-w-4xl mx-auto px-12 py-10">
                {/* Upload Zone */}
                <div className="mb-12">
                  <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-3">
                    Cover Image
                  </label>
                  <div className="group relative w-full h-[280px] border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center gap-4 bg-surface-container-lowest hover:border-gold-accent/40 transition-all overflow-hidden">
                    {coverPreviewUrl ? (
                      <>
                        <img
                          src={coverPreviewUrl}
                          alt="Cover preview"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/25" />
                        <div className="relative z-10 flex items-center gap-3">
                          <label className="cursor-pointer bg-white/90 hover:bg-white px-4 py-2 rounded-lg text-sm font-semibold text-on-surface transition-colors">
                            Change
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const preview = URL.createObjectURL(file);
                                setCoverPreviewUrl(preview);
                                const reader = new FileReader();
                                reader.onload = () => setForm((f) => ({ ...f, coverImage: String(reader.result || '') }));
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            className="bg-white/90 hover:bg-white px-4 py-2 rounded-lg text-sm font-semibold text-tertiary transition-colors"
                            onClick={() => {
                              if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
                              setCoverPreviewUrl('');
                              setForm((f) => ({ ...f, coverImage: '' }));
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 text-outline group-hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                        <p className="font-sans-modern font-medium">Upload Cover Image</p>
                        <p className="text-xs opacity-60">JPG/PNG/WebP • Recommended 16:9</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const preview = URL.createObjectURL(file);
                            setCoverPreviewUrl(preview);
                            const reader = new FileReader();
                            reader.onload = () => setForm((f) => ({ ...f, coverImage: String(reader.result || '') }));
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Editor Toolbar (visual) */}
                <div className="sticky top-4 z-40 mb-8 p-1 bg-white dark:bg-surface-container border border-outline-variant/25 rounded-xl shadow-xl shadow-black/5 flex items-center gap-1 w-fit mx-auto">
                  {[
                    'format_bold', 'format_italic', 'format_quote',
                    'DIV',
                    'format_h1', 'format_h2',
                    'DIV',
                    'link', 'image', 'code',
                    'DIV',
                    'format_list_bulleted',
                  ].map((x, i) => x === 'DIV' ? (
                    <div key={`d-${i}`} className="w-[1px] h-6 bg-outline-variant/30 mx-1" />
                  ) : (
                    <button key={x} type="button" className="p-2 hover:bg-surface-container-low rounded text-outline">
                      <span className="material-symbols-outlined">{x}</span>
                    </button>
                  ))}
                </div>

                {/* Title */}
                <textarea
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-[42px] font-bold leading-tight placeholder:text-outline/40 resize-none mb-6 p-0"
                  placeholder="Your story title..."
                  rows={1}
                />

                {/* Excerpt */}
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setField('excerpt', e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-lg text-outline italic placeholder:text-outline/40 resize-none mb-8 p-0"
                  placeholder="Write a brief editorial excerpt to hook your readers..."
                  rows={3}
                />

                {/* Body */}
                <textarea
                  value={form.content}
                  onChange={(e) => setField('content', e.target.value)}
                  className="w-full min-h-[520px] bg-transparent border-none focus:ring-0 text-xl leading-relaxed text-on-surface placeholder:text-outline/40 resize-none p-0"
                  placeholder="Start your narrative journey here..."
                />
              </div>
            </section>

            {/* Right: Settings Panel */}
            <aside className="w-[35%] h-full bg-surface-container-lowest p-6 overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight text-on-surface">Story Details</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {status === 'published' ? 'PUBLISHED' : 'DRAFT MODE'}
                </div>
              </div>

              {error && (
                <div className="mb-6 px-4 py-3 rounded-lg bg-error-container/50 border border-error/30 text-on-error-container text-sm">
                  {error}
                </div>
              )}

              {/* Categories */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-3">
                  Select Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_CHOICES.map((c) => {
                    const active = form.category === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setField('category', c.value)}
                        className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1.5 transition-all ${
                          active
                            ? 'border-primary bg-primary/10 text-on-surface'
                            : 'border-outline-variant/25 bg-white dark:bg-surface-container hover:border-primary/40'
                        }`}
                      >
                        <span className={`material-symbols-outlined ${active ? 'text-primary' : 'opacity-50'}`}>
                          {c.icon}
                        </span>
                        <span className={`text-xs font-semibold ${active ? '' : 'opacity-70'}`}>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-3">
                  Keywords &amp; Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tagsList.slice(0, 6).map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low text-xs font-medium rounded-lg">
                      {t}
                    </span>
                  ))}
                  {tagsList.length === 0 && (
                    <span className="text-xs text-outline">Add tags like: Leadership, Mentorship, Strategy…</span>
                  )}
                </div>
                <input
                  value={form.tags}
                  onChange={(e) => setField('tags', e.target.value)}
                  className="w-full bg-white dark:bg-surface-container border border-outline-variant/25 text-on-surface rounded-lg px-4 py-3 text-sm focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="Add tags (comma-separated)…"
                />
              </div>

              {/* Checklist */}
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-3">
                  Publishing Checklist
                </label>
                <ul className="space-y-3">
                  {checklist.map((c) => (
                    <li key={c.text} className={`flex items-start gap-3 text-sm ${c.ok ? '' : 'opacity-60'}`}>
                      <span className={`material-symbols-outlined text-[20px] ${c.ok ? 'text-green-600' : 'text-outline'}`}>
                        {c.ok ? 'check_circle' : 'circle'}
                      </span>
                      <span className="text-on-surface-variant">{c.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>

          {/* Editor top actions bar (inside main) */}
          <div className="fixed top-0 right-0 left-[260px] h-16 bg-white/80 dark:bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 z-40 flex items-center justify-between px-6">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard/stories')}
                className="flex items-center gap-2 text-outline hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                <span className="text-sm font-medium">Back to Dashboard</span>
              </button>
              <div className="h-4 w-[1px] bg-outline-variant/30" />
              <div className="flex items-center gap-2 text-outline text-xs">
                <span className="material-symbols-outlined text-[16px] text-green-600">cloud_done</span>
                <span>{lastSavedAt ? `Draft saved at ${lastSavedAt}` : 'Draft not saved yet'}</span>
              </div>
              <div className="h-4 w-[1px] bg-outline-variant/30 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-4 text-xs text-outline">
                <span>
                  Estimated Reading Time{' '}
                  <span className="font-bold text-primary italic">{readingMins} min read</span>
                </span>
                <span className="text-outline-variant/50">•</span>
                <span>
                  Word count <span className="font-bold text-on-surface">{wordCount}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => saveStory('draft')}
                className="px-4 py-2 text-sm font-medium text-outline hover:bg-surface-container-low rounded-lg transition-all disabled:opacity-60"
              >
                Save Draft
              </button>
              <button
                type="button"
                className="p-2 text-outline hover:bg-surface-container-low rounded-lg transition-all"
                onClick={() => toast('Preview coming soon')}
              >
                <span className="material-symbols-outlined">visibility</span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => saveStory('published')}
                className="bg-gradient-to-r from-primary to-tertiary px-6 py-2 text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? <Spinner size="sm" className="text-white" /> : 'Publish Story'}
                {!saving && <span className="material-symbols-outlined text-[18px]">send</span>}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

