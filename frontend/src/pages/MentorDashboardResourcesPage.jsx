import { useEffect, useState, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { resourceApi } from '../api/resourceApi';
import Spinner from '../components/common/Spinner';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const TYPES = ['article', 'ebook', 'video', 'podcast', 'tool', 'guide'];
const CATEGORIES = [
  'leadership-skills',
  'communication',
  'negotiation',
  'time-management',
  'career-planning',
  'work-life-balance',
  'networking',
];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const SORTS = [
  { value: '-createdAt', label: 'Newest' },
  { value: 'createdAt', label: 'Oldest' },
  { value: '-averageRating', label: 'Top Rated' },
  { value: '-views', label: 'Most Viewed' },
  { value: '-downloads', label: 'Most Downloaded' },
];

const TYPE_META = {
  article:  { icon: 'article',        color: 'bg-blue-50 text-blue-700 border-blue-100' },
  ebook:    { icon: 'menu_book',       color: 'bg-purple-50 text-purple-700 border-purple-100' },
  video:    { icon: 'play_circle',     color: 'bg-red-50 text-red-700 border-red-100' },
  podcast:  { icon: 'podcasts',        color: 'bg-orange-50 text-orange-700 border-orange-100' },
  tool:     { icon: 'build',           color: 'bg-green-50 text-green-700 border-green-100' },
  guide:    { icon: 'local_library',   color: 'bg-teal-50 text-teal-700 border-teal-100' },
};
const TYPE_BG = {
  article:  'bg-blue-100',
  ebook:    'bg-purple-100',
  video:    'bg-red-100',
  podcast:  'bg-orange-100',
  tool:     'bg-green-100',
  guide:    'bg-teal-100',
};
const DIFF_COLOR = {
  beginner:     'bg-green-50 text-green-700 border-green-100',
  intermediate: 'bg-amber-50 text-amber-700 border-amber-100',
  advanced:     'bg-red-50 text-red-700 border-red-100',
};

const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0));
const fmtCat = (c) => (c || '').split('-').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ');

const EMPTY_FORM = {
  title: '',
  description: '',
  type: 'article',
  category: 'leadership-skills',
  tags: '',
  difficulty: 'beginner',
  externalLink: '',
  author: '',
  isPremium: false,
  fileMode: 'link', // 'link' | 'file'
};

/* ─── Resource Card ──────────────────────────────────────────────────────── */

function ResourceCard({ resource, userId, isMentor, onBookmark, onDownload, onRate, onEdit, onDelete }) {
  const isOwner = resource.uploadedBy?._id === userId || resource.uploadedBy === userId;
  const meta = TYPE_META[resource.type] || TYPE_META.article;
  const bg = TYPE_BG[resource.type] || 'bg-gray-100';
  const diffColor = DIFF_COLOR[resource.difficulty] || DIFF_COLOR.beginner;
  const bookmarked = resource._bookmarked;

  const handleDownload = () => {
    onDownload(resource._id);
    const url = resource.file?.url || resource.externalLink;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white border border-outline-variant/20 editorial-shadow flex flex-col group hover:border-gold-accent/30 transition-all duration-200">
      {/* Top color band */}
      <div className={`h-1.5 w-full ${bg}`} />

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Type + Difficulty badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 border ${meta.color}`}>
            <span className="material-symbols-outlined text-[13px]">{meta.icon}</span>
            {resource.type}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border ${diffColor}`}>
            {resource.difficulty}
          </span>
          {resource.isPremium && (
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-gold-accent/10 text-gold-accent border border-gold-accent/20">
              Premium
            </span>
          )}
          {isOwner && !resource.isApproved && (
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100">
              Pending
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-serif-alt text-base font-bold text-on-surface leading-snug line-clamp-2 group-hover:text-gold-accent transition-colors">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-outline leading-relaxed line-clamp-2 flex-1">
          {resource.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-2 text-[10px] text-outline flex-wrap">
          <span className="font-medium">{fmtCat(resource.category)}</span>
          {resource.author && (
            <>
              <span>·</span>
              <span>{resource.author}</span>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-[11px] text-outline">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-gold-accent">star</span>
            {resource.averageRating ? resource.averageRating.toFixed(1) : '—'}
            {resource.ratingCount > 0 && <span className="text-[10px]">({resource.ratingCount})</span>}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">visibility</span>
            {fmt(resource.views)}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">download</span>
            {fmt(resource.downloads)}
          </span>
        </div>

        {/* Tags */}
        {resource.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {resource.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 bg-surface text-outline border border-outline-variant/20 font-medium">
                {tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 text-outline">+{resource.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-outline-variant/10 flex-wrap">
          {/* Bookmark */}
          <button
            onClick={() => onBookmark(resource._id)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium border transition-all ${
              bookmarked
                ? 'bg-gold-accent/10 text-gold-accent border-gold-accent/30'
                : 'text-outline border-outline-variant/20 hover:border-gold-accent/30 hover:text-gold-accent'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {bookmarked ? 'bookmark' : 'bookmark_border'}
            </span>
            {bookmarked ? 'Saved' : 'Save'}
          </button>

          {/* Rate */}
          <button
            onClick={() => onRate(resource)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-outline-variant/20 text-outline hover:border-gold-accent/30 hover:text-gold-accent transition-all"
          >
            <span className="material-symbols-outlined text-[14px]">star_border</span>
            Rate
          </button>

          {/* Open / Download */}
          {(resource.file?.url || resource.externalLink) && (
            <button
              onClick={handleDownload}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-gold-accent text-white hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              Open
            </button>
          )}
        </div>

        {/* Owner controls */}
        {isOwner && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onEdit(resource)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-outline-variant/20 text-outline hover:border-primary/40 hover:text-primary transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              Edit
            </button>
            <button
              onClick={() => onDelete(resource._id)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-outline-variant/20 text-outline hover:border-red-400 hover:text-red-600 transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
              Delete
            </button>
            {isOwner && resource.isApproved && (
              <div className="ml-auto flex items-center gap-1 text-[10px] text-green-700">
                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                Approved
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Upload / Edit Modal ────────────────────────────────────────────────── */

function ResourceFormModal({ mode, initial, isMentor, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileRef, setFileRef] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await resourceApi.uploadFile(fd);
      setUploadedFile(res.data);
      toast.success('File uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.description.trim()) { setError('Description is required'); return; }
    if (tags.length < 2) { setError('At least 2 tags required (comma-separated)'); return; }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      category: form.category,
      tags,
      difficulty: form.difficulty,
      externalLink: form.fileMode === 'link' ? form.externalLink.trim() : '',
      author: form.author.trim(),
      isPremium: isMentor ? form.isPremium : false,
      ...(form.fileMode === 'file' && uploadedFile ? { file: uploadedFile } : {}),
    };

    setSaving(true);
    try {
      await onSave(payload);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const labelClass = 'block text-[10px] font-bold text-outline uppercase tracking-widest mb-1.5';

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white border border-outline-variant/20 editorial-shadow max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-outline-variant/15 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="font-serif-alt text-xl font-bold text-on-surface">
            {mode === 'edit' ? 'Edit Resource' : 'Upload Resource'}
          </h2>
          <button onClick={onClose} className="text-outline hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Title *</label>
              <input className="w-full input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Resource title" />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Description *</label>
              <textarea className="w-full input h-24 resize-y" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Brief description of this resource..." />
            </div>

            <div>
              <label className={labelClass}>Type *</label>
              <select className="w-full input" value={form.type} onChange={(e) => set('type', e.target.value)}>
                {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Category *</label>
              <select className="w-full input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{fmtCat(c)}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Difficulty</label>
              <select className="w-full input" value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Author</label>
              <input className="w-full input" value={form.author} onChange={(e) => set('author', e.target.value)} placeholder="Author name (optional)" />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Tags * (comma-separated, min 2)</label>
              <input className="w-full input" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="leadership, women, strategy, communication" />
            </div>

            {/* Content source toggle */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Content Source</label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => set('fileMode', 'link')}
                  className={`px-4 py-2 text-xs font-bold border transition-all ${form.fileMode === 'link' ? 'bg-gold-accent text-white border-gold-accent' : 'border-outline-variant/20 text-outline hover:border-gold-accent/30'}`}
                >
                  External Link
                </button>
                <button
                  type="button"
                  onClick={() => set('fileMode', 'file')}
                  className={`px-4 py-2 text-xs font-bold border transition-all ${form.fileMode === 'file' ? 'bg-gold-accent text-white border-gold-accent' : 'border-outline-variant/20 text-outline hover:border-gold-accent/30'}`}
                >
                  Upload File
                </button>
              </div>

              {form.fileMode === 'link' ? (
                <input
                  className="w-full input"
                  value={form.externalLink}
                  onChange={(e) => set('externalLink', e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
              ) : (
                <div className="border border-dashed border-outline-variant/30 p-4 text-center">
                  {uploading ? (
                    <div className="flex justify-center"><Spinner /></div>
                  ) : uploadedFile ? (
                    <div className="text-sm text-green-700 flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      File uploaded successfully
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[32px] text-outline">cloud_upload</span>
                      <p className="text-sm text-outline mt-1">Click to select file</p>
                    </>
                  )}
                  <input
                    ref={(r) => setFileRef(r)}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3,.zip"
                  />
                  {!uploading && !uploadedFile && (
                    <button
                      type="button"
                      onClick={() => fileRef?.click()}
                      className="mt-2 px-4 py-2 text-xs font-bold border border-outline-variant/20 text-outline hover:border-gold-accent/30 hover:text-gold-accent transition-all"
                    >
                      Choose File
                    </button>
                  )}
                </div>
              )}
            </div>

            {isMentor && (
              <div className="sm:col-span-2 flex items-center gap-3">
                <input
                  id="isPremium"
                  type="checkbox"
                  checked={form.isPremium}
                  onChange={(e) => set('isPremium', e.target.checked)}
                  className="w-4 h-4 accent-gold-accent"
                />
                <label htmlFor="isPremium" className="text-sm text-on-surface font-medium cursor-pointer">
                  Mark as Premium resource
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/15 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold border border-outline-variant/25 text-outline hover:border-outline/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || uploading}
            onClick={handleSubmit}
            className="px-6 py-2.5 text-sm font-bold bg-gold-accent text-white hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Upload Resource'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Rate Modal ─────────────────────────────────────────────────────────── */

function RateModal({ resource, onClose, onSave }) {
  const [rating, setRating] = useState(resource._userRating?.rating || 0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState(resource._userRating?.review || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!rating) { toast.error('Please select a rating'); return; }
    setSaving(true);
    try {
      await onSave(resource._id, { rating, review });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-outline-variant/20 editorial-shadow">
        <div className="p-5 border-b border-outline-variant/15 flex items-center justify-between">
          <h2 className="font-serif-alt text-lg font-bold text-on-surface">Rate this Resource</h2>
          <button onClick={onClose} className="text-outline hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm font-medium text-on-surface line-clamp-1">{resource.title}</p>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <span className={`material-symbols-outlined text-[32px] ${
                  star <= (hovered || rating) ? 'text-gold-accent' : 'text-outline/30'
                }`}>
                  {star <= (hovered || rating) ? 'star' : 'star_border'}
                </span>
              </button>
            ))}
            <span className="ml-2 text-sm text-outline font-medium">
              {rating ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating] : 'Select'}
            </span>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-1.5">
              Review (optional)
            </label>
            <textarea
              className="w-full input h-20 resize-none"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts about this resource..."
              maxLength={500}
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-outline-variant/15 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-bold border border-outline-variant/25 text-outline hover:border-outline/50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !rating}
            className="px-5 py-2.5 text-sm font-bold bg-gold-accent text-white hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {saving ? 'Submitting…' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function MentorDashboardResourcesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const firstName = user?.name?.split(' ')?.[0] || 'User';
  const isMentor = user?.role === 'mentor' || user?.role === 'admin';
  const [profileOpen, setProfileOpen] = useState(false);

  // Tabs: all | mine | bookmarks
  const [tab, setTab] = useState('all');

  // Resources list state
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);

  // Stats
  const [myStats, setMyStats] = useState({ uploads: 0, downloads: 0, bookmarks: 0 });

  // Modals
  const [uploadModal, setUploadModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [rateTarget, setRateTarget] = useState(null);

  /* ── Fetch resources ── */
  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'mine') {
        res = await resourceApi.getMyResources({ page, limit: 12 });
      } else if (tab === 'bookmarks') {
        res = await resourceApi.getBookmarks({ page, limit: 12 });
      } else {
        res = await resourceApi.getAll({
          page,
          limit: 12,
          sort,
          ...(search ? { search } : {}),
          ...(filterType ? { type: filterType } : {}),
          ...(filterCategory ? { category: filterCategory } : {}),
          ...(filterDifficulty ? { difficulty: filterDifficulty } : {}),
        });
      }
      setResources(res.data?.resources || []);
      setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch {
      toast.error('Failed to load resources');
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page, sort, search, filterType, filterCategory, filterDifficulty]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  /* ── Load my stats once ── */
  useEffect(() => {
    if (!user?._id) return;
    Promise.allSettled([
      resourceApi.getMyResources({ limit: 1 }),
      resourceApi.getBookmarks({ limit: 1 }),
    ]).then(([mine, bk]) => {
      setMyStats({
        uploads: mine.status === 'fulfilled' ? (mine.value.data?.pagination?.total ?? 0) : 0,
        bookmarks: bk.status === 'fulfilled' ? (bk.value.data?.pagination?.total ?? 0) : 0,
        downloads: 0,
      });
    });
  }, [user?._id]);

  /* ── Handlers ── */
  const handleBookmark = async (id) => {
    try {
      const res = await resourceApi.toggleBookmark(id);
      setResources((prev) =>
        prev.map((r) =>
          r._id === id
            ? { ...r, _bookmarked: res.data.bookmarked, bookmarkCount: res.data.bookmarkCount }
            : r
        )
      );
      toast.success(res.data.bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks');
    } catch {
      toast.error('Failed to update bookmark');
    }
  };

  const handleDownload = async (id) => {
    try {
      await resourceApi.trackDownload(id);
      setResources((prev) =>
        prev.map((r) => (r._id === id ? { ...r, downloads: (r.downloads || 0) + 1 } : r))
      );
    } catch {
      // silently ignore tracking failure
    }
  };

  const handleRate = (resource) => setRateTarget(resource);

  const submitRating = async (id, data) => {
    const res = await resourceApi.rate(id, data);
    setResources((prev) =>
      prev.map((r) =>
        r._id === id
          ? { ...r, averageRating: res.data.averageRating, ratingCount: res.data.ratingCount }
          : r
      )
    );
    toast.success('Rating submitted');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource? This cannot be undone.')) return;
    try {
      await resourceApi.delete(id);
      setResources((prev) => prev.filter((r) => r._id !== id));
      toast.success('Resource deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleCreate = async (payload) => {
    const res = await resourceApi.create(payload);
    toast.success('Resource uploaded — pending admin approval');
    setUploadModal(false);
    setMyStats((s) => ({ ...s, uploads: s.uploads + 1 }));
    if (tab === 'mine') {
      setResources((prev) => [res.data, ...prev]);
    }
  };

  const handleEdit = (resource) => {
    setEditTarget({
      ...resource,
      tags: (resource.tags || []).join(', '),
      fileMode: resource.externalLink ? 'link' : 'file',
    });
  };

  const handleUpdate = async (payload) => {
    const res = await resourceApi.update(editTarget._id, payload);
    setResources((prev) => prev.map((r) => (r._id === editTarget._id ? { ...r, ...res.data } : r)));
    toast.success('Resource updated');
    setEditTarget(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleTabChange = (t) => {
    setTab(t);
    setPage(1);
    setSearch('');
    setSearchInput('');
    setFilterType('');
    setFilterCategory('');
    setFilterDifficulty('');
    setSort('-createdAt');
  };

  /* ── Sidebar nav ── */
  const mentorNav = [
    { to: '/dashboard',            icon: 'dashboard',      label: 'Dashboard'   },
    { to: '/dashboard/stories',    icon: 'auto_stories',   label: 'Stories'     },
    { to: '/dashboard/mentorship', icon: 'groups',         label: 'Mentorship'  },
    { to: '/events',               icon: 'event',          label: 'Events'      },
    { to: '/resources',            icon: 'library_books',  label: 'Resources'   },
    { to: '/forum',                icon: 'forum',          label: 'Forum'       },
    { to: '/dashboard/settings',   icon: 'settings',       label: 'Settings'    },
  ];

  /* ─────────────────────────────── RENDER ─────────────────────────────── */
  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen overflow-hidden bg-surface text-on-surface">

        {/* ── Sidebar ────────────────────────────────────────────────── */}
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
                  {user?.role || 'Mentor'}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {mentorNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/resources'}
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

        {/* ── Main area ──────────────────────────────────────────────── */}
        <main className="ml-[260px] flex-1 flex flex-col min-h-screen">

          {/* Top header */}
          <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-outline">
              <Link className="hover:text-gold-accent transition-colors" to="/">Home</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <Link className="hover:text-gold-accent transition-colors" to="/dashboard">Dashboard</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface">Resources</span>
            </div>

            <div className="max-w-md w-full px-4 hidden md:block">
              <form onSubmit={handleSearch}>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-gold-accent transition-colors">
                    search
                  </span>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant/25 rounded-full py-2 pl-10 pr-4 text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-1 focus:ring-gold-accent transition-all"
                    placeholder="Search resources..."
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-full bg-white border border-outline-variant/25 flex items-center justify-center text-outline hover:text-gold-accent transition-colors">
                <span className="material-symbols-outlined">help_outline</span>
              </button>
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
                      <p className="font-sans-modern text-sm font-semibold text-on-surface line-clamp-1">{user?.name}</p>
                      <p className="font-sans-modern text-xs text-outline line-clamp-1">{user?.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try { await logout(); toast.success('You have signed out.'); }
                        finally { setProfileOpen(false); navigate('/'); }
                      }}
                      className="w-full text-left px-5 py-3 text-sm text-tertiary hover:bg-tertiary/5 transition-colors flex items-center gap-2"
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

          {/* Page content */}
          <div className="p-8 space-y-6 max-w-[1400px] mx-auto w-full">

            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-serif-alt text-3xl font-bold text-on-surface">Resources</h1>
                <p className="text-sm text-outline mt-1">
                  {tab === 'all' && 'Explore curated resources for women leaders'}
                  {tab === 'mine' && 'Manage your uploaded resources'}
                  {tab === 'bookmarks' && 'Your saved resources'}
                </p>
              </div>
              {isMentor && (
                <button
                  onClick={() => setUploadModal(true)}
                  className="flex items-center gap-2 bg-gold-accent text-white px-5 py-2.5 font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-gold-accent/10 self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  Upload Resource
                </button>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-outline-variant/20 editorial-shadow p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-accent/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gold-accent text-[20px]">upload_file</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-outline font-bold">My Uploads</p>
                  <p className="text-xl font-bold text-on-surface">{myStats.uploads}</p>
                </div>
              </div>
              <div className="bg-white border border-outline-variant/20 editorial-shadow p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">bookmark</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-outline font-bold">Bookmarks</p>
                  <p className="text-xl font-bold text-on-surface">{myStats.bookmarks}</p>
                </div>
              </div>
              <div className="bg-white border border-outline-variant/20 editorial-shadow p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
                <div className="w-10 h-10 bg-tertiary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">library_books</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-outline font-bold">Total Found</p>
                  <p className="text-xl font-bold text-on-surface">{pagination.total}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-outline-variant/20">
              {[
                { key: 'all',       label: 'All Resources', icon: 'library_books' },
                { key: 'mine',      label: 'My Uploads',    icon: 'upload_file',   show: isMentor },
                { key: 'bookmarks', label: 'Bookmarks',     icon: 'bookmark' },
              ].filter((t) => t.show !== false).map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleTabChange(t.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 -mb-px transition-all ${
                    tab === t.key
                      ? 'text-gold-accent border-gold-accent'
                      : 'text-outline border-transparent hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Filters (only for "all" tab) */}
            {tab === 'all' && (
              <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    className="input py-2 pl-3 pr-3 text-sm w-48"
                    placeholder="Search..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <button type="submit" className="px-4 py-2 bg-gold-accent/10 text-gold-accent border border-gold-accent/20 text-xs font-bold hover:bg-gold-accent/20 transition-all">
                    Go
                  </button>
                </form>

                <select
                  className="input py-2 text-sm"
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                >
                  <option value="">All Types</option>
                  {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>

                <select
                  className="input py-2 text-sm"
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{fmtCat(c)}</option>)}
                </select>

                <select
                  className="input py-2 text-sm"
                  value={filterDifficulty}
                  onChange={(e) => { setFilterDifficulty(e.target.value); setPage(1); }}
                >
                  <option value="">All Levels</option>
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>

                <select
                  className="input py-2 text-sm ml-auto"
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                >
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>

                {(search || filterType || filterCategory || filterDifficulty) && (
                  <button
                    onClick={() => { setSearch(''); setSearchInput(''); setFilterType(''); setFilterCategory(''); setFilterDifficulty(''); setPage(1); }}
                    className="flex items-center gap-1 text-xs text-outline hover:text-red-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Resource grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : resources.length === 0 ? (
              <div className="bg-white border border-outline-variant/20 editorial-shadow p-16 text-center">
                <span className="material-symbols-outlined text-[48px] text-outline/30">
                  {tab === 'bookmarks' ? 'bookmark_border' : tab === 'mine' ? 'upload_file' : 'library_books'}
                </span>
                <p className="text-outline mt-3 font-medium">
                  {tab === 'bookmarks' && "You haven't bookmarked any resources yet."}
                  {tab === 'mine' && "You haven't uploaded any resources yet."}
                  {tab === 'all' && (search || filterType || filterCategory || filterDifficulty)
                    ? 'No resources match your filters.'
                    : tab === 'all' && 'No approved resources yet.'}
                </p>
                {tab === 'mine' && isMentor && (
                  <button
                    onClick={() => setUploadModal(true)}
                    className="mt-4 inline-flex items-center gap-2 bg-gold-accent text-white px-5 py-2.5 font-bold text-sm hover:opacity-90 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">upload</span>
                    Upload Your First Resource
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {resources.map((resource) => (
                  <ResourceCard
                    key={resource._id}
                    resource={resource}
                    userId={user?._id}
                    isMentor={isMentor}
                    onBookmark={handleBookmark}
                    onDownload={handleDownload}
                    onRate={handleRate}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 text-sm font-medium border border-outline-variant/20 text-outline hover:border-gold-accent/30 hover:text-gold-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>
                <span className="px-4 py-2 text-sm text-outline">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 text-sm font-medium border border-outline-variant/20 text-outline hover:border-gold-accent/30 hover:text-gold-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Footer */}
            <footer className="text-center text-xs text-outline/50 pt-4 pb-2">
              © 2026 LEADSHER. BUILT FOR BRILLIANCE.
            </footer>
          </div>
        </main>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}
      {uploadModal && (
        <ResourceFormModal
          mode="create"
          isMentor={isMentor}
          onClose={() => setUploadModal(false)}
          onSave={handleCreate}
        />
      )}
      {editTarget && (
        <ResourceFormModal
          mode="edit"
          initial={editTarget}
          isMentor={isMentor}
          onClose={() => setEditTarget(null)}
          onSave={handleUpdate}
        />
      )}
      {rateTarget && (
        <RateModal
          resource={rateTarget}
          onClose={() => setRateTarget(null)}
          onSave={submitRating}
        />
      )}
    </div>
  );
}
