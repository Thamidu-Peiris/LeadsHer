import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { storyApi } from '../api/storyApi';
import Spinner from '../components/common/Spinner';
import StoryRichTextEditor from '../components/stories/StoryRichTextEditor';

function stripHtmlForWords(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CATEGORY_CHOICES = [
  { value: 'leadership', icon: 'diversity_3', label: 'Leadership' },
  { value: 'STEM', icon: 'science', label: 'STEM' },
  { value: 'entrepreneurship', icon: 'lightbulb', label: 'Innovation' },
  { value: 'career-growth', icon: 'spa', label: 'Wellness' },
  { value: 'social-impact', icon: 'campaign', label: 'Advocacy' },
  { value: 'corporate', icon: 'account_balance', label: 'Finance' },
];

export default function MentorDashboardCreateStoryPage() {
  const { id: editStoryId } = useParams();
  const isEditMode = Boolean(editStoryId);

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
  const [coverFile, setCoverFile] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState('draft');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [storyLoading, setStoryLoading] = useState(isEditMode);

  const storiesListPath =
    user?.role === 'mentor' || user?.role === 'admin' ? '/dashboard/stories' : '/stories';

  useEffect(() => {
    if (!editStoryId) return;
    let cancelled = false;
    (async () => {
      setStoryLoading(true);
      setError('');
      try {
        const res = await storyApi.getById(editStoryId);
        const d = res.data;
        if (cancelled) return;
        setForm({
          coverImage: d.coverImage || '',
          title: d.title || '',
          excerpt: d.excerpt || '',
          content: d.content || '',
          category: d.category || 'leadership',
          tags: Array.isArray(d.tags) ? d.tags.join(', ') : '',
        });
        setStatus(d.status === 'published' ? 'published' : 'draft');
        setCoverPreviewUrl('');
        setCoverFile(null);
        setTagInput('');
      } catch (e) {
        if (!cancelled) {
          toast.error(e.response?.data?.message || 'Could not load story.');
          navigate(user?.role === 'mentor' || user?.role === 'admin' ? '/dashboard/stories' : '/stories');
        }
      } finally {
        if (!cancelled) setStoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editStoryId, navigate, user?.role]);

  const tagsList = useMemo(
    () => form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    [form.tags]
  );
  const wordCount = useMemo(
    () => stripHtmlForWords(form.content).split(/\s+/).filter(Boolean).length,
    [form.content]
  );
  const excerptWords = useMemo(
    () => form.excerpt.trim().split(/\s+/).filter(Boolean).length,
    [form.excerpt]
  );
  const readingMins = Math.max(1, Math.ceil(wordCount / 200));
  const publishWordTarget = 100;
  const publishWordProgress = Math.min(100, Math.round((wordCount / publishWordTarget) * 100));

  const checklist = useMemo(() => ([
    { ok: !!form.title.trim(), text: 'Compelling story title' },
    { ok: !!form.coverImage.trim(), text: 'High-quality cover image' },
    { ok: excerptWords >= 8, text: 'Editorial excerpt (recommended)' },
    { ok: tagsList.length >= 3, text: 'Story tags (at least 3)' },
    { ok: wordCount >= publishWordTarget, text: `Minimum ${publishWordTarget} words for publish` },
  ]), [excerptWords, form.coverImage, form.title, tagsList.length, wordCount]);

  const setField = (key, value) => {
    setError('');
    setForm((f) => ({ ...f, [key]: value }));
  };

  const syncTagsToForm = (nextTags) => {
    setField('tags', nextTags.slice(0, 5).join(', '));
  };

  const addTag = (raw) => {
    const cleaned = String(raw || '').trim().replace(/\s+/g, ' ');
    if (!cleaned) return;
    const exists = tagsList.some((t) => t.toLowerCase() === cleaned.toLowerCase());
    if (exists) {
      setTagInput('');
      return;
    }
    if (tagsList.length >= 5) {
      toast.error('You can add up to 5 tags.');
      return;
    }
    syncTagsToForm([...tagsList, cleaned]);
    setTagInput('');
  };

  const removeTag = (tag) => {
    syncTagsToForm(tagsList.filter((t) => t !== tag));
  };

  const coverDisplayUrl = coverPreviewUrl || form.coverImage || '';

  const handleCoverFileSelect = (file) => {
    if (!file) return;
    if (coverPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(coverPreviewUrl);
    const preview = URL.createObjectURL(file);
    setCoverPreviewUrl(preview);
    setCoverFile(file);
  };

  const saveStory = async (nextStatus) => {
    setError('');
    const title = form.title.trim();
    const contentPlain = stripHtmlForWords(form.content);

    if (nextStatus === 'draft' && !title && !contentPlain) {
      setError('Add at least a title or some content to save draft.');
      return;
    }
    if (nextStatus === 'published' && (!title || !contentPlain)) {
      setError('Title and content are required to publish.');
      return;
    }
    if (nextStatus === 'published' && wordCount < 100) {
      setError('Published stories must have at least 100 words.');
      return;
    }

    setSaving(true);
    try {
      let coverImageUrl = form.coverImage || '';
      if (coverFile) {
        const fd = new FormData();
        fd.append('media', coverFile);
        const uploadRes = await storyApi.uploadMedia(fd);
        coverImageUrl = uploadRes.data?.url || '';
      }

      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        category: form.category,
        status: nextStatus,
        tags: tagsList.slice(0, 5),
      };
      if (isEditMode && editStoryId) {
        payload.coverImage = coverImageUrl;
      } else {
        payload.coverImage = coverImageUrl || undefined;
      }

      if (isEditMode && editStoryId) {
        await storyApi.update(editStoryId, payload);
        setForm((f) => ({ ...f, coverImage: coverImageUrl }));
        if (coverPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(coverPreviewUrl);
        setCoverPreviewUrl('');
        setCoverFile(null);
        setStatus(nextStatus);
        setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        if (nextStatus === 'draft') {
          toast.success('Draft updated!');
          navigate(storiesListPath);
        } else {
          toast.success('Story published!');
          navigate(storiesListPath);
        }
      } else {
        await storyApi.create(payload);
        setStatus(nextStatus);
        setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        if (nextStatus === 'draft') {
          toast.success('Draft saved!');
          navigate(storiesListPath);
        } else {
          toast.success('Story published!');
          navigate(storiesListPath);
        }
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to save story.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (isEditMode && storyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
          <div className="sticky top-0 z-40 border-b border-outline-variant/15 bg-white/95 dark:bg-surface-container-lowest/95 backdrop-blur-md">
            <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-6">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => navigate(storiesListPath)}
                  className="flex shrink-0 items-center justify-center w-9 h-9 rounded-lg border border-outline-variant/20 text-outline hover:bg-surface-container-low hover:text-gold-accent transition-colors"
                  aria-label="Back to stories"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <div className="min-w-0">
                  <h1 className="font-serif-alt text-base sm:text-lg font-bold text-on-surface truncate leading-tight">
                    {isEditMode ? 'Edit story' : 'New story'}
                  </h1>
                  <p className="text-[10px] uppercase tracking-widest text-outline truncate">
                    <Link to="/dashboard/stories" className="hover:text-gold-accent transition-colors">
                      Stories
                    </Link>
                    <span className="mx-1.5 opacity-50">/</span>
                    <span className="text-on-surface-variant">Studio</span>
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 ml-1 pl-3 border-l border-outline-variant/20 text-[11px] text-on-surface-variant">
                  <span className="tabular-nums font-semibold text-on-surface">{wordCount}</span>
                  <span>words</span>
                  <span className="text-outline-variant/40">·</span>
                  <span className="italic text-outline">{readingMins} min</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((v) => !v)}
                    className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/25 hover:border-gold-accent transition-colors"
                    aria-haspopup="menu"
                    aria-expanded={profileOpen ? 'true' : 'false'}
                  >
                    <img
                      alt=""
                      className="w-full h-full object-cover"
                      src={user?.profilePicture || user?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face&q=80'}
                    />
                  </button>
                  {profileOpen && (
                    <div role="menu" className="absolute right-0 mt-2 w-52 bg-white dark:bg-surface-container border border-outline-variant/20 shadow-lg rounded-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-outline-variant/10">
                        <p className="text-sm font-semibold text-on-surface truncate">{user?.name || 'Mentor'}</p>
                        <p className="text-xs text-outline truncate">{user?.email}</p>
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
                        className="w-full text-left px-4 py-2.5 text-sm text-tertiary hover:bg-tertiary/5 flex items-center gap-2"
                        role="menuitem"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveStory('draft')}
                  className="px-3 py-2 text-xs font-semibold rounded-lg border border-outline-variant/25 text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveStory('published')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Spinner size="sm" className="text-white" /> : 'Publish'}
                  {!saving && <span className="material-symbols-outlined text-[16px]">send</span>}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            <section className="flex-1 min-w-0 overflow-y-auto bg-white dark:bg-surface-container-lowest border-r border-outline-variant/10">
              <div className="max-w-3xl mx-auto px-5 py-6 lg:px-8 lg:py-7">
                <div className="mb-7">
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">
                    Cover
                    {coverDisplayUrl && (
                      <span className="ml-2 font-normal normal-case text-[11px] text-on-surface-variant">
                        — replace anytime
                      </span>
                    )}
                  </label>
                  <div className="group relative w-full h-[168px] sm:h-[188px] border border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center gap-2 bg-surface-container-lowest/90 hover:border-gold-accent/35 transition-all overflow-hidden">
                    {coverDisplayUrl ? (
                      <>
                        <img
                          src={coverDisplayUrl}
                          alt="Cover preview"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/25" />
                        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
                          <label className="cursor-pointer bg-white/95 hover:bg-white px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface transition-colors shadow-sm">
                            Replace
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleCoverFileSelect(e.target.files?.[0])}
                            />
                          </label>
                          <button
                            type="button"
                            className="bg-white/95 hover:bg-white px-3 py-1.5 rounded-lg text-xs font-semibold text-tertiary transition-colors shadow-sm"
                            onClick={() => {
                              if (coverPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(coverPreviewUrl);
                              setCoverPreviewUrl('');
                              setCoverFile(null);
                              setForm((f) => ({ ...f, coverImage: '' }));
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-1 text-outline group-hover:text-gold-accent transition-colors cursor-pointer py-2">
                        <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                        <p className="font-sans-modern text-sm font-medium">Upload cover</p>
                        <p className="text-[10px] opacity-60">JPG / PNG · 16:9</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleCoverFileSelect(e.target.files?.[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-3xl sm:text-[2.1rem] font-bold font-serif-alt leading-tight placeholder:text-outline/35 mb-3 p-0"
                  placeholder="Story title"
                  maxLength={200}
                />

                <textarea
                  value={form.excerpt}
                  onChange={(e) => setField('excerpt', e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm text-on-surface-variant italic placeholder:text-outline/40 resize-none mb-5 p-0 leading-relaxed"
                  placeholder="Short excerpt — hook your readers (optional)"
                  rows={2}
                  maxLength={300}
                />

                <div className="mb-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-[10px] font-bold text-outline uppercase tracking-widest">
                      Story body
                    </label>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-outline-variant/20 bg-surface-container-low text-[10px]">
                      <span className="uppercase tracking-[0.14em] font-bold text-outline">Word Target</span>
                      <span className={`font-bold tabular-nums ${wordCount >= publishWordTarget ? 'text-green-600 dark:text-green-500' : 'text-on-surface'}`}>
                        {wordCount}/{publishWordTarget}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-outline-variant/20 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${wordCount >= publishWordTarget ? 'bg-green-500' : 'bg-gold-accent'}`}
                        style={{ width: `${publishWordProgress}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold tabular-nums ${wordCount >= publishWordTarget ? 'text-green-600 dark:text-green-500' : 'text-gold-accent'}`}>
                      {publishWordProgress}%
                    </span>
                  </div>
                </div>

                <StoryRichTextEditor
                  value={form.content}
                  onChange={(html) => setField('content', html)}
                  disabled={saving}
                />
              </div>
            </section>

            <aside className="w-[min(100%,380px)] shrink-0 flex flex-col bg-surface-container-lowest border-l border-outline-variant/10 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
              <div className="p-5 sm:p-6 space-y-6">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-serif-alt text-xl font-bold text-on-surface leading-tight">Details</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-gold-accent/35 text-gold-accent shrink-0">
                    {status === 'published' ? 'Live' : 'Draft'}
                  </span>
                </div>

                {error && (
                  <div className="px-3 py-2.5 rounded-lg bg-error-container/50 border border-error/25 text-on-error-container text-xs leading-snug">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-outline uppercase tracking-widest mb-3">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORY_CHOICES.map((c) => {
                      const active = form.category === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setField('category', c.value)}
                          className={`h-[86px] rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                            active
                              ? 'border-gold-accent/55 bg-gold-accent/10 text-on-surface shadow-sm'
                              : 'border-outline-variant/20 bg-white dark:bg-surface-container hover:border-outline-variant/40 hover:bg-surface-container-lowest'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-[20px] ${active ? 'text-gold-accent' : 'opacity-45'}`}>
                            {c.icon}
                          </span>
                          <span className={`text-[11px] font-semibold leading-tight text-center ${active ? '' : 'opacity-80'}`}>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-outline uppercase tracking-widest mb-3">
                    Tags
                  </label>
                <div className="rounded-xl border border-outline-variant/20 bg-white/90 dark:bg-surface-container p-3">
                  <div className="flex flex-wrap gap-2 min-h-8 mb-2">
                    {tagsList.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => removeTag(t)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-low text-xs font-medium text-on-surface-variant hover:bg-tertiary/10 transition-colors"
                        title="Remove tag"
                      >
                        <span>{t}</span>
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    ))}
                    {tagsList.length === 0 && (
                      <span className="text-xs text-outline">Type a tag and press Enter</span>
                    )}
                  </div>
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addTag(tagInput);
                      } else if (e.key === 'Backspace' && !tagInput && tagsList.length) {
                        removeTag(tagsList[tagsList.length - 1]);
                      }
                    }}
                    onBlur={() => addTag(tagInput)}
                    className="w-full bg-transparent border border-outline-variant/20 text-on-surface rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-gold-accent/40 focus:border-gold-accent/40 outline-none transition-all"
                    placeholder="Add tag and press Enter"
                  />
                  <p className="mt-2 text-[10px] text-outline">Up to 5 tags</p>
                </div>
                </div>

                <div>
                <label className="block text-[11px] font-bold text-outline uppercase tracking-widest mb-3">
                  Checklist
                </label>
                <ul className="space-y-2.5">
                  {checklist.map((c) => (
                    <li key={c.text} className={`flex items-start gap-2.5 text-[12px] leading-snug ${c.ok ? '' : 'opacity-65'}`}>
                      <span className={`material-symbols-outlined text-[18px] shrink-0 ${c.ok ? 'text-green-600' : 'text-outline'}`}>
                        {c.ok ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span className="text-on-surface-variant">{c.text}</span>
                    </li>
                  ))}
                </ul>
                </div>

                {lastSavedAt && (
                  <p className="text-[10px] text-outline pt-1 border-t border-outline-variant/10">
                    Last saved {lastSavedAt}
                  </p>
                )}
              </div>
            </aside>
          </div>
    </>
  );
}

