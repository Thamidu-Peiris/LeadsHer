import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminTopBar from '../components/dashboard/AdminTopBar';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { resourceApi } from '../api/resourceApi';
import Spinner from '../components/common/Spinner';
import ResourcePreviewModal from '../components/common/ResourcePreviewModal';

/* ─── Constants (shared with mentor page) ───────────────────────────────── */

const TYPES      = ['article', 'ebook', 'video', 'podcast', 'tool', 'guide'];
const CATEGORIES = [
  { value: '',                   label: 'All Categories'     },
  { value: 'leadership-skills',  label: 'Leadership Skills'  },
  { value: 'communication',      label: 'Communication'      },
  { value: 'negotiation',        label: 'Negotiation'        },
  { value: 'time-management',    label: 'Time Management'    },
  { value: 'career-planning',    label: 'Career Planning'    },
  { value: 'work-life-balance',  label: 'Work-Life Balance'  },
  { value: 'networking',         label: 'Networking'         },
];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const SORTS = [
  { value: '-createdAt',     label: 'Newest First'    },
  { value: 'createdAt',      label: 'Oldest First'    },
  { value: '-averageRating', label: 'Highest Rated'   },
  { value: '-views',         label: 'Most Viewed'     },
  { value: '-downloads',     label: 'Most Downloaded' },
];

const TYPE_CFG = {
  article: { icon: 'article',        label: 'Article', thumb: 'from-slate-700 to-slate-900',    badge: 'bg-slate-800/80'    },
  ebook:   { icon: 'menu_book',      label: 'Ebook',   thumb: 'from-violet-700 to-purple-900',  badge: 'bg-violet-800/80'   },
  video:   { icon: 'play_circle',    label: 'Video',   thumb: 'from-red-700 to-rose-900',       badge: 'bg-red-800/80'      },
  podcast: { icon: 'podcasts',       label: 'Podcast', thumb: 'from-amber-600 to-orange-800',   badge: 'bg-amber-700/80'    },
  tool:    { icon: 'build',          label: 'Tool',    thumb: 'from-emerald-700 to-teal-900',   badge: 'bg-emerald-800/80'  },
  guide:   { icon: 'local_library',  label: 'Guide',   thumb: 'from-[#6242a3] to-[#3a1f7a]',   badge: 'bg-[#6242a3]/80'    },
};
/** Solid label chips below thumbnail (admin cards) — white uppercase text */
const TYPE_LABEL_SOLID = {
  article:  'bg-slate-800',
  ebook:    'bg-violet-800',
  video:    'bg-red-950',
  podcast:  'bg-amber-800',
  tool:     'bg-emerald-800',
  guide:    'bg-[#5b3d8a]',
};
const DIFF_LABEL_SOLID = {
  beginner:     'bg-emerald-600',
  intermediate: 'bg-amber-500',
  advanced:     'bg-rose-400',
};

const fmt     = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0));
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }); } catch { return ''; } };
const fmtCat  = (c) => (c || '').split('-').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ');

const EMPTY_FORM = {
  title: '', description: '', type: 'article', category: 'leadership-skills',
  tags: '', difficulty: 'beginner', externalLink: '', author: '',
  isPremium: false, fileMode: 'link',
};

/* ─── Resource Card (Admin) ──────────────────────────────────────────────── */

function AdminResourceCard({ resource, onDownload, onRate, onEdit, onDelete, onApprove, onReject, showApprovalActions, onPreview }) {
  const cfg          = TYPE_CFG[resource.type] || TYPE_CFG.article;
  const typeLabelBg  = TYPE_LABEL_SOLID[resource.type] || TYPE_LABEL_SOLID.article;
  const diffLabelBg  = DIFF_LABEL_SOLID[resource.difficulty] || DIFF_LABEL_SOLID.beginner;

  const handleAccess = () => {
    onDownload(resource._id);
    const rawUrl = resource.file?.url || resource.externalLink;
    if (!rawUrl) { toast('No link or file attached to this resource.', { icon: 'ℹ️' }); return; }
    onPreview(resource);
  };

  return (
    <div className="group bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/40 rounded-xl overflow-hidden hover:border-rose-500/50 transition-all duration-300 flex flex-col">

      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden flex-shrink-0">
        {resource.thumbnail ? (
          <img src={resource.thumbnail} alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${cfg.thumb} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}>
            <span className="material-symbols-outlined text-white/30 text-[64px]">{cfg.icon}</span>
          </div>
        )}

        {/* Status overlays (admin workflow) */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[calc(100%-1rem)]">
          {resource.isPremium && (
            <span className="px-2 py-1 bg-rose-600 text-white text-[10px] uppercase font-bold tracking-wider rounded-sm shadow-sm">
              Premium
            </span>
          )}
          <span className={`px-2 py-1 text-white text-[10px] uppercase font-bold tracking-wider rounded-sm shadow-sm ${
            resource.isApproved ? 'bg-emerald-700' : resource.isRejected ? 'bg-red-700' : 'bg-amber-600'
          }`}>
            {resource.isApproved ? 'Approved' : resource.isRejected ? 'Rejected' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Type + difficulty labels (below image, like public cards) */}
      <div className="px-4 pt-3 flex flex-wrap gap-2 bg-white dark:bg-surface-container-lowest">
        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white rounded-sm ${typeLabelBg}`}>
          {(cfg.label || '').toUpperCase()}
        </span>
        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white rounded-sm ${diffLabelBg}`}>
          {(resource.difficulty || '').replace(/-/g, ' ').toUpperCase()}
        </span>
      </div>

      {/* Card body */}
      <div className="px-5 pb-5 pt-3 flex flex-col flex-1 gap-3">
        <h3 className="text-base font-bold leading-snug text-on-surface line-clamp-2 group-hover:text-rose-500 transition-colors">
          {resource.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-on-surface-variant line-clamp-2 flex-1">
          {resource.description}
        </p>

        {/* Uploader */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-outline">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">person</span>
            {resource.uploadedBy?.name || resource.author || 'LeadsHer'}
          </span>
          <span>{fmtDate(resource.createdAt)}</span>
        </div>

        {/* Stats: downloads (blue), rating (amber) + review count */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-outline-variant/20">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums">
            <span className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300" title="Downloads">
              <span className="material-symbols-outlined text-[15px] text-blue-800 dark:text-blue-300">download</span>
              {fmt(resource.downloads ?? 0)}
            </span>
            <span className="flex items-center gap-1 font-bold text-amber-500 dark:text-amber-400" title="Average rating">
              <span className="material-symbols-outlined text-[15px] text-amber-500 dark:text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              {(Number(resource.averageRating) || 0).toFixed(1)}
              <span className="font-normal text-slate-400 dark:text-slate-500">({resource.ratingCount ?? 0})</span>
            </span>
          </div>
          <button
            onClick={() => onRate(resource)}
            className="text-[11px] text-slate-400 dark:text-outline hover:text-rose-500 transition-colors flex items-center gap-0.5"
          >
            <span className="material-symbols-outlined text-[13px]">star_border</span>
            Rate
          </button>
        </div>

        {/* Access */}
        <button
          onClick={handleAccess}
          className="w-full py-2 rounded-lg border border-rose-500/40 text-rose-500 text-sm font-bold hover:bg-rose-500 hover:text-white transition-all"
        >
          Access Resource
        </button>

        {/* Pending tab: Approve + Reject */}
        {showApprovalActions === 'pending' && !resource.isApproved && !resource.isRejected && (
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(resource._id)}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Approve
            </button>
            <button
              onClick={() => onReject(resource._id)}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold bg-red-500 text-white hover:bg-red-600 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">cancel</span>
              Reject
            </button>
          </div>
        )}
        {/* Rejected tab: Re-approve */}
        {showApprovalActions === 'rejected' && resource.isRejected && (
          <button
            onClick={() => onApprove(resource._id)}
            className="w-full flex items-center justify-center gap-1 py-2 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-[14px]">undo</span>
            Re-approve
          </button>
        )}

        {/* Admin edit/delete (all resources) */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(resource)}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold bg-black text-white hover:bg-neutral-800 rounded-lg transition-colors dark:bg-neutral-950 dark:hover:bg-neutral-800"
          >
            <span className="material-symbols-outlined text-[13px]">edit</span>
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(resource._id)}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors dark:bg-red-600 dark:hover:bg-red-500"
          >
            <span className="material-symbols-outlined text-[13px]">delete</span>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Resource Form Modal ────────────────────────────────────────────────── */

function ResourceFormModal({ mode, initial, onClose, onSave }) {
  const [form, setForm]               = useState(initial || EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [error, setError]             = useState('');
  const fileInputRef                  = useRef(null);
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
    if (!form.title.trim())       { setError('Title is required'); return; }
    if (!form.description.trim()) { setError('Description is required'); return; }
    if (tags.length < 2)          { setError('At least 2 tags required (comma-separated)'); return; }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      category: form.category,
      tags,
      difficulty: form.difficulty,
      externalLink: form.fileMode === 'link' ? form.externalLink.trim() : '',
      author: form.author.trim(),
      isPremium: form.isPremium,
      ...(form.fileMode === 'file' && uploadedFile ? { file: uploadedFile } : {}),
    };

    setSaving(true);
    try { await onSave(payload); }
    catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const lbl = 'block text-[10px] font-bold text-slate-500 dark:text-on-surface-variant uppercase tracking-widest mb-1.5';
  const inp = 'w-full border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 transition-all';

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-surface-container rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-outline-variant/20 flex items-center justify-between sticky top-0 bg-white dark:bg-surface-container z-10 rounded-t-2xl">
          <h2 className="font-serif-alt text-xl font-bold text-on-surface">
            {mode === 'edit' ? 'Edit Resource' : 'Upload New Resource'}
          </h2>
          <button onClick={onClose} className="text-slate-400 dark:text-outline hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 dark:bg-error-container/30 border border-red-100 dark:border-error/30 text-red-700 dark:text-on-error-container text-sm rounded-lg">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={lbl}>Title *</label>
              <input className={inp} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Resource title" />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Description *</label>
              <textarea className={`${inp} h-24 resize-y`} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Brief description..." />
            </div>
            <div>
              <label className={lbl}>Type *</label>
              <select className={inp} value={form.type} onChange={(e) => set('type', e.target.value)}>
                {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Category *</label>
              <select className={inp} value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.filter((c) => c.value).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Difficulty</label>
              <select className={inp} value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Author</label>
              <input className={inp} value={form.author} onChange={(e) => set('author', e.target.value)} placeholder="Author name (optional)" />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Tags * (comma-separated, min 2)</label>
              <input className={inp} value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="leadership, women, strategy" />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Content Source</label>
              <div className="flex gap-2 mb-3">
                {['link', 'file'].map((m) => (
                  <button key={m} type="button" onClick={() => set('fileMode', m)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${form.fileMode === m ? 'bg-rose-500 text-white border-rose-500' : 'border-slate-200 text-slate-500 hover:border-rose-500/40'}`}>
                    {m === 'link' ? 'External Link' : 'Upload File'}
                  </button>
                ))}
              </div>
              {form.fileMode === 'link' ? (
                <input className={inp} value={form.externalLink} onChange={(e) => set('externalLink', e.target.value)} placeholder="https://..." type="url" />
              ) : (
                <div className="border-2 border-dashed border-slate-200 dark:border-outline-variant/40 rounded-xl p-6 text-center hover:border-rose-500/40 transition-colors">
                  {uploading ? (
                    <div className="flex justify-center"><Spinner /></div>
                  ) : uploadedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-sm text-emerald-600 flex items-center justify-center gap-2 font-medium">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        File uploaded successfully
                      </div>
                      <button
                        type="button"
                        onClick={() => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[40px] text-slate-300 dark:text-outline">cloud_upload</span>
                      <p className="text-sm text-slate-400 dark:text-on-surface-variant mt-2">PDF, DOC, MP4, MP3, ZIP supported (max 100MB)</p>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="mt-3 px-4 py-2 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant hover:border-rose-500/40 hover:text-rose-500 rounded-lg transition-all">
                        Choose File
                      </button>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3,.zip" />
                </div>
              )}
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input id="isPremium" type="checkbox" checked={form.isPremium} onChange={(e) => set('isPremium', e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded" />
              <label htmlFor="isPremium" className="text-sm text-on-surface font-medium cursor-pointer">
                Mark as Premium resource
              </label>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-outline-variant/20 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-surface-container rounded-b-2xl">
          <button onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant hover:border-slate-300 rounded-lg transition-colors">
            Cancel
          </button>
          <button disabled={saving || uploading} onClick={handleSubmit}
            className="px-6 py-2.5 text-sm font-bold bg-rose-500 text-white hover:opacity-90 disabled:opacity-50 rounded-lg transition-all">
            {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Upload Resource'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Rate Modal ─────────────────────────────────────────────────────────── */

function RateModal({ resource, onClose, onSave }) {
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview]   = useState('');
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async () => {
    if (!rating) { toast.error('Please select a rating'); return; }
    setSaving(true);
    try { await onSave(resource._id, { rating, review }); onClose(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to submit rating'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-surface-container rounded-2xl shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-outline-variant/20 flex items-center justify-between">
          <h2 className="font-serif-alt text-lg font-bold text-on-surface">Rate this Resource</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm font-semibold text-on-surface line-clamp-1">{resource.title}</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button"
                onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)} className="hover:scale-110 transition-transform">
                <span className={`material-symbols-outlined text-[36px] ${star <= (hovered || rating) ? 'text-rose-500' : 'text-slate-200 dark:text-outline'}`}>
                  {star <= (hovered || rating) ? 'star' : 'star_border'}
                </span>
              </button>
            ))}
            <span className="ml-2 text-sm text-slate-500 dark:text-on-surface-variant font-medium">
              {rating ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating] : 'Select rating'}
            </span>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-on-surface-variant uppercase tracking-widest mb-1.5">Review (optional)</label>
            <textarea className="w-full border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg px-3 py-2 text-sm text-on-surface h-20 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              value={review} onChange={(e) => setReview(e.target.value)} placeholder="Share your thoughts..." maxLength={500} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-outline-variant/20 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant rounded-lg hover:border-slate-300 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || !rating}
            className="px-6 py-2.5 text-sm font-bold bg-rose-500 text-white hover:opacity-90 disabled:opacity-50 rounded-lg transition-all">
            {saving ? 'Submitting…' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Analytics Panel ────────────────────────────────────────────────────── */

function AnalyticsPanel({ analytics, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    );
  }
  if (!analytics) {
    return <p className="text-center text-slate-400 py-20">No analytics data available.</p>;
  }

  const { overview, byType, byCategory, topDownloads, topViewed } = analytics;

  const statCards = [
    { label: 'Total Resources',   value: overview.total,              icon: 'library_books',  color: 'text-primary'     },
    { label: 'Approved',          value: overview.approved,           icon: 'check_circle',   color: 'text-emerald-500' },
    { label: 'Pending Approval',  value: overview.pending,            icon: 'pending',        color: 'text-amber-500'   },
    { label: 'Rejected',          value: overview.rejected ?? 0,      icon: 'cancel',         color: 'text-red-500'     },
    { label: 'Total Downloads',   value: fmt(overview.totalDownloads), icon: 'download',      color: 'text-rose-500' },
    { label: 'Total Views',       value: fmt(overview.totalViews),     icon: 'visibility',    color: 'text-blue-500'    },
    { label: 'Avg Rating',        value: overview.avgRating ? overview.avgRating.toFixed(1) : '—', icon: 'star', color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Overview stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/40 rounded-xl p-5 flex flex-col gap-2">
            <span className={`material-symbols-outlined text-[28px] ${s.color}`}>{s.icon}</span>
            <p className="text-2xl font-bold text-on-surface">{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-outline">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* By Type */}
        <div className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/40 rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500 text-[18px]">donut_large</span>
            Resources by Type
          </h3>
          <div className="space-y-3">
            {(byType || []).map((item) => {
              const cfg  = TYPE_CFG[item._id] || TYPE_CFG.article;
              const pct  = overview.total > 0 ? Math.round((item.count / overview.total) * 100) : 0;
              return (
                <div key={item._id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">{cfg.icon}</span>
                      {cfg.label}
                    </span>
                    <span className="text-slate-500 dark:text-outline font-mono text-xs">{item.count} · {pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-outline-variant/20 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Category */}
        <div className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/40 rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500 text-[18px]">category</span>
            Resources by Category
          </h3>
          <div className="space-y-3">
            {(byCategory || []).map((item) => {
              const pct = overview.total > 0 ? Math.round((item.count / overview.total) * 100) : 0;
              return (
                <div key={item._id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-on-surface">{fmtCat(item._id)}</span>
                    <span className="text-slate-500 dark:text-outline font-mono text-xs">{item.count} · {pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-outline-variant/20 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Downloaded */}
        <div className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/40 rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500 text-[18px]">download</span>
            Top Downloaded
          </h3>
          <div className="space-y-3">
            {(topDownloads || []).map((r, i) => (
              <div key={r._id} className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-outline-variant/10 last:border-0">
                <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{r.title}</p>
                  <p className="text-[10px] text-slate-400 dark:text-outline uppercase font-bold">{r.type}</p>
                </div>
                <span className="text-xs font-bold text-rose-500">{fmt(r.downloads)}</span>
              </div>
            ))}
            {(!topDownloads || topDownloads.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-4">No data yet</p>
            )}
          </div>
        </div>

        {/* Top Viewed */}
        <div className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/40 rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500 text-[18px]">visibility</span>
            Top Viewed
          </h3>
          <div className="space-y-3">
            {(topViewed || []).map((r, i) => (
              <div key={r._id} className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-outline-variant/10 last:border-0">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{r.title}</p>
                  <p className="text-[10px] text-slate-400 dark:text-outline uppercase font-bold">{r.type}</p>
                </div>
                <span className="text-xs font-bold text-primary">{fmt(r.views)}</span>
              </div>
            ))}
            {(!topViewed || topViewed.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-4">No data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

const TABS = [
  { key: 'all',      label: 'All Resources',    icon: 'library_books' },
  { key: 'pending',  label: 'Pending Approval', icon: 'pending'       },
  { key: 'rejected', label: 'Rejected',          icon: 'cancel'        },
  { key: 'analytics',label: 'Analytics',        icon: 'analytics'     },
];

export default function AdminDashboardResourcesPage() {
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  /* ── Active tab ── */
  const [activeTab, setActiveTab] = useState('all');

  /* ── Resources state ── */
  const [resources, setResources]     = useState([]);
  const [pagination, setPagination]   = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]         = useState(true);
  const [pendingCount, setPendingCount]   = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  /* ── Filter state ── */
  const [searchInput, setSearchInput]       = useState('');
  const [search, setSearch]                 = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType]         = useState('');
  const [sort, setSort]                     = useState('-createdAt');
  const [page, setPage]                     = useState(1);

  /* ── Analytics ── */
  const [analytics, setAnalytics]         = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  /* ── Modals ── */
  const [uploadModal, setUploadModal] = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [rateTarget, setRateTarget]   = useState(null);
  const [previewResource, setPreviewResource] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, title: '' });
  const [deletePending, setDeletePending] = useState(false);

  /* ── Fetch resources ── */
  const fetchResources = useCallback(async () => {
    if (activeTab === 'analytics') return;
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        sort,
        ...(search ? { search } : {}),
        ...(filterCategory ? { category: filterCategory } : {}),
        ...(filterType ? { type: filterType } : {}),
        ...(activeTab === 'pending'  ? { status: 'pending'  } : {}),
        ...(activeTab === 'rejected' ? { status: 'rejected' } : {}),
      };
      const res = await resourceApi.adminGetAll(params);
      setResources(res.data?.resources || []);
      setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch {
      toast.error('Failed to load resources');
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, sort, search, filterCategory, filterType]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  /* ── Fetch pending + rejected counts for badges ── */
  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await resourceApi.adminGetAll({ status: 'pending', limit: 1, page: 1 });
      setPendingCount(res.data?.pagination?.total || 0);
    } catch { /* ignore */ }
  }, []);

  const fetchRejectedCount = useCallback(async () => {
    try {
      const res = await resourceApi.adminGetAll({ status: 'rejected', limit: 1, page: 1 });
      setRejectedCount(res.data?.pagination?.total || 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchPendingCount(); fetchRejectedCount(); }, [fetchPendingCount, fetchRejectedCount]);

  /* ── Fetch analytics when tab switches ── */
  useEffect(() => {
    if (activeTab !== 'analytics') return;
    setAnalyticsLoading(true);
    resourceApi.adminGetAnalytics()
      .then((res) => setAnalytics(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setAnalyticsLoading(false));
  }, [activeTab]);

  /* ── Handlers ── */
  const handleDownload = async (id) => {
    try { await resourceApi.trackDownload(id); } catch { /* ignore */ }
  };

  const handleRate = (resource) => setRateTarget(resource);

  const submitRating = async (id, data) => {
    const res = await resourceApi.rate(id, data);
    setResources((prev) =>
      prev.map((r) => r._id === id ? { ...r, averageRating: res.data.averageRating, ratingCount: res.data.ratingCount } : r)
    );
    toast.success('Rating submitted');
  };

  const handleApprove = async (id) => {
    try {
      await resourceApi.approve(id);
      setResources((prev) => prev.filter((r) => r._id !== id));
      if (activeTab === 'pending')  setPendingCount((c)  => Math.max(0, c - 1));
      if (activeTab === 'rejected') setRejectedCount((c) => Math.max(0, c - 1));
      toast.success('Resource approved and published');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await resourceApi.reject(id);
      setResources((prev) => prev.filter((r) => r._id !== id));
      setPendingCount((c) => Math.max(0, c - 1));
      setRejectedCount((c) => c + 1);
      toast.success('Resource rejected');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    }
  };

  const requestDeleteResource = (id) => {
    const r = resources.find((x) => x._id === id);
    setDeleteDialog({ open: true, id, title: (r?.title || '').trim() || 'this resource' });
  };

  const closeDeleteDialog = () => {
    if (deletePending) return;
    setDeleteDialog({ open: false, id: null, title: '' });
  };

  const confirmDeleteResource = async () => {
    if (!deleteDialog.id) return;
    setDeletePending(true);
    try {
      await resourceApi.delete(deleteDialog.id);
      setResources((prev) => prev.filter((r) => r._id !== deleteDialog.id));
      toast.success('Resource deleted');
      setDeleteDialog({ open: false, id: null, title: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeletePending(false);
    }
  };

  const handleCreate = async (payload) => {
    await resourceApi.create(payload);
    toast.success('Resource uploaded successfully');
    setUploadModal(false);
    fetchResources();
    fetchPendingCount();
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
    setResources((prev) => prev.map((r) => r._id === editTarget._id ? { ...r, ...res.data } : r));
    toast.success('Resource updated');
    setEditTarget(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearch('');
    setSearchInput('');
    setFilterCategory('');
    setFilterType('');
    setSort('-createdAt');
  };

  /* ─── RENDER ─────────────────────────────────────────────────────── */
  return (
    <>

          <AdminTopBar
            crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Manage Resources' }]}
            user={user}
            profileOpen={profileOpen}
            setProfileOpen={setProfileOpen}
          />

          <div className="px-4 sm:px-8 pt-4 pb-32 max-w-[1600px] mx-auto w-full">
            <div className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/20 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-outline-variant/20 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0 flex-1">
                  <h1 className="font-serif-alt text-3xl font-bold text-on-surface">Resource Management</h1>
                  <p className="text-sm text-slate-500 dark:text-on-surface-variant mt-1">
                    Approve uploads, manage all resources, and view platform-wide analytics.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadModal(true)}
                  className="inline-flex items-center justify-center gap-2 shrink-0 self-end sm:self-auto sm:ml-auto bg-rose-500 text-white text-sm font-bold px-4 py-2.5 sm:px-5 rounded-lg hover:opacity-90 active:scale-95 transition-all whitespace-nowrap dark:bg-rose-600 dark:hover:bg-rose-500"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span className="hidden sm:inline">Upload Resource</span>
                  <span className="sm:hidden">Upload</span>
                </button>
              </div>

              {/* ── Tabs ── */}
              <div className="flex flex-nowrap items-center gap-1 px-4 sm:px-6 border-b border-slate-200 dark:border-outline-variant/30 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all -mb-px relative ${
                    activeTab === tab.key
                      ? 'border-rose-500 text-rose-500'
                      : 'border-transparent text-slate-500 dark:text-outline hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                  {tab.label}
                  {tab.key === 'pending' && pendingCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                      {pendingCount}
                    </span>
                  )}
                  {tab.key === 'rejected' && rejectedCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">
                      {rejectedCount}
                    </span>
                  )}
                </button>
              ))}
              </div>

              {/* ── Tab content ── */}
              <div className="p-6 sm:p-8 space-y-6">

            {/* ── Analytics Tab ── */}
            {activeTab === 'analytics' && (
              <AnalyticsPanel analytics={analytics} loading={analyticsLoading} />
            )}

            {/* ── All Resources / Pending Tab ── */}
            {activeTab !== 'analytics' && (
              <>
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-sm relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">search</span>
                    <input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search resources…"
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/40 text-on-surface"
                    />
                  </form>

                  <select
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                    className="border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  >
                    <option value="">All Types</option>
                    {TYPES.map((t) => <option key={t} value={t}>{TYPE_CFG[t].label}</option>)}
                  </select>

                  <select
                    value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                    className="border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  >
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>

                  <select
                    value={sort}
                    onChange={(e) => { setSort(e.target.value); setPage(1); }}
                    className="border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  >
                    {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>

                  {(search || filterType || filterCategory) && (
                    <button
                      onClick={() => { setSearch(''); setSearchInput(''); setFilterType(''); setFilterCategory(''); setPage(1); }}
                      className="flex items-center gap-1 px-3 py-2.5 text-sm text-slate-500 dark:text-outline hover:text-red-500 border border-slate-200 dark:border-outline-variant/40 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      Clear
                    </button>
                  )}
                </div>

                {/* Results info */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500 dark:text-outline">
                    {loading ? 'Loading…' : `${pagination.total} resource${pagination.total !== 1 ? 's' : ''} found`}
                    {activeTab === 'pending' && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wide">
                        Awaiting Review
                      </span>
                    )}
                    {activeTab === 'rejected' && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-[10px] font-bold uppercase tracking-wide">
                        Rejected
                      </span>
                    )}
                  </p>
                </div>

                {/* Resource grid */}
                {loading ? (
                  <div className="flex justify-center py-20"><Spinner size="lg" /></div>
                ) : resources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <span className="material-symbols-outlined text-[64px] text-slate-200 dark:text-outline">
                      {activeTab === 'pending' ? 'check_circle' : activeTab === 'rejected' ? 'cancel' : 'library_books'}
                    </span>
                    <p className="text-lg font-bold text-on-surface">
                      {activeTab === 'pending' ? 'No pending resources' : activeTab === 'rejected' ? 'No rejected resources' : 'No resources found'}
                    </p>
                    <p className="text-sm text-slate-400 dark:text-outline">
                      {activeTab === 'pending'
                        ? 'All uploaded resources have been reviewed.'
                        : activeTab === 'rejected'
                        ? 'No resources have been rejected.'
                        : 'Try adjusting your filters or upload a new resource.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                    {resources.map((r) => (
                      <AdminResourceCard
                        key={r._id}
                        resource={r}
                        onDownload={handleDownload}
                        onRate={handleRate}
                        onEdit={handleEdit}
                        onDelete={requestDeleteResource}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        showApprovalActions={activeTab === 'pending' ? 'pending' : activeTab === 'rejected' ? 'rejected' : null}
                        onPreview={setPreviewResource}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-4 py-2 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 rounded-lg text-slate-500 dark:text-outline hover:border-rose-500/40 hover:text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-500 dark:text-outline font-medium px-3">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
                      className="px-4 py-2 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 rounded-lg text-slate-500 dark:text-outline hover:border-rose-500/40 hover:text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
              </div>
            </div>
          </div>
        {/* ── Modals ── */}
        {uploadModal && (
          <ResourceFormModal mode="create" onClose={() => setUploadModal(false)} onSave={handleCreate} />
        )}
        {editTarget && (
          <ResourceFormModal mode="edit" initial={editTarget} onClose={() => setEditTarget(null)} onSave={handleUpdate} />
        )}
        {rateTarget && (
          <RateModal resource={rateTarget} onClose={() => setRateTarget(null)} onSave={submitRating} />
        )}
        {previewResource && (
          <ResourcePreviewModal resource={previewResource} onClose={() => setPreviewResource(null)} />
        )}

        {deleteDialog.open && (
          <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close dialog"
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
              onClick={closeDeleteDialog}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-delete-resource-title"
              className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-outline-variant/25 bg-white dark:bg-surface-container-lowest shadow-[0_24px_60px_rgba(15,23,42,0.28)] p-6"
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-500 text-[32px] shrink-0" aria-hidden>delete_forever</span>
                <div className="min-w-0">
                  <h3 id="admin-delete-resource-title" className="font-serif-alt text-xl font-bold text-on-surface">
                    Delete resource?
                  </h3>
                  <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
                    This will permanently remove{' '}
                    <span className="font-semibold text-on-surface break-words">"{deleteDialog.title}"</span>.
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeDeleteDialog}
                  disabled={deletePending}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-outline-variant/40 text-sm font-bold text-on-surface-variant hover:bg-slate-50 dark:hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteResource}
                  disabled={deletePending}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
                >
                  {deletePending && <Spinner size="sm" className="text-white" />}
                  {deletePending ? 'Deleting…' : 'Delete resource'}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
