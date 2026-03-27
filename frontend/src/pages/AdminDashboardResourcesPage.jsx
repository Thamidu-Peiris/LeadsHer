import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { resourceApi } from '../api/resourceApi';
import Spinner from '../components/common/Spinner';

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
const DIFF_BADGE = {
  beginner:     'bg-emerald-500/80',
  intermediate: 'bg-amber-500/80',
  advanced:     'bg-red-500/80',
};

const fmt     = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0));
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }); } catch { return ''; } };
const fmtCat  = (c) => (c || '').split('-').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ');

const EMPTY_FORM = {
  title: '', description: '', type: 'article', category: 'leadership-skills',
  tags: '', difficulty: 'beginner', externalLink: '', author: '',
  isPremium: false, fileMode: 'link',
};

const SIDEBAR_W = 280;

/* ─── Admin Sidebar ──────────────────────────────────────────────────────── */

function AdminSidebar({ user, onLogout }) {
  const firstName = user?.name?.split(' ')?.[0] || 'Admin';
  const adminNav = [
    { to: '/dashboard',                   icon: 'space_dashboard',   label: 'Admin Dashboard'     },
    { to: '/dashboard/manage-account',    icon: 'manage_accounts',   label: 'Manage Accounts'     },
    { to: '/stories',                     icon: 'auto_stories',      label: 'Manage Stories'      },
    { to: '/events',                      icon: 'event',             label: 'Manage Events'       },
    { to: '/dashboard/manage-mentors',    icon: 'groups',            label: 'Manage Mentors'      },
    { to: '/dashboard/resources',         icon: 'library_books',     label: 'Manage Resources'    },
    { to: '/dashboard/generated-reports', icon: 'analytics',         label: 'Generated Reports'   },
    { to: '/dashboard/settings',          icon: 'settings',          label: 'Admin Settings'      },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-white dark:bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col z-40">
      <div className="p-6 border-b border-outline-variant/20">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-gold-accent p-0.5 overflow-hidden">
              <img alt="Admin avatar" className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face&q=80" />
            </div>
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <div className="text-center">
            <p className="text-on-surface font-bold text-lg leading-tight">{user?.name || 'Admin'}</p>
            <span className="inline-flex mt-2 px-3 py-1 rounded-full bg-gold-accent/15 text-gold-accent text-[10px] font-bold tracking-widest uppercase border border-gold-accent/25">
              Admin
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {adminNav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 transition-all ${
                isActive
                  ? 'text-gold-accent bg-gold-accent/5 border-gold-accent'
                  : 'text-outline hover:text-on-surface hover:bg-surface-container-low border-transparent'
              }`
            }>
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-outline-variant/20">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-500 dark:text-outline hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}

/* ─── Resource Card (Admin) ──────────────────────────────────────────────── */

function AdminResourceCard({ resource, bookmarkedIds, onBookmark, onDownload, onRate, onEdit, onDelete, onApprove, onReject, showApprovalActions }) {
  const cfg       = TYPE_CFG[resource.type] || TYPE_CFG.article;
  const diffBadge = DIFF_BADGE[resource.difficulty] || DIFF_BADGE.beginner;
  const isBookmarked = bookmarkedIds.has(resource._id);

  const handleAccess = () => {
    onDownload(resource._id);
    const url = resource.file?.url || resource.externalLink;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else toast('No link or file attached to this resource.', { icon: 'ℹ️' });
  };

  return (
    <div className="group bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/40 rounded-xl overflow-hidden hover:border-gold-accent/50 hover:shadow-lg transition-all duration-300 flex flex-col">

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

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className={`px-2 py-1 ${cfg.badge} backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider rounded`}>
            {cfg.label}
          </span>
          <span className={`px-2 py-1 ${diffBadge} backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider rounded`}>
            {resource.difficulty}
          </span>
          {resource.isPremium && (
            <span className="px-2 py-1 bg-gold-accent/80 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider rounded">
              Premium
            </span>
          )}
          <span className={`px-2 py-1 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider rounded ${resource.isApproved ? 'bg-emerald-600/80' : 'bg-amber-500/80'}`}>
            {resource.isApproved ? 'Approved' : 'Pending'}
          </span>
        </div>

        {/* Bookmark button */}
        <button
          onClick={() => onBookmark(resource._id)}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
            isBookmarked ? 'bg-gold-accent text-white' : 'bg-black/20 text-white hover:bg-gold-accent hover:text-white'
          }`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <span className="material-symbols-outlined text-[18px]">{isBookmarked ? 'bookmark' : 'bookmark_border'}</span>
        </button>
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="text-base font-bold leading-snug text-on-surface line-clamp-2 group-hover:text-gold-accent transition-colors">
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

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-outline-variant/20">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-gold-accent">
              <span className="material-symbols-outlined text-[14px]">download</span>
              {fmt(resource.downloads)}
            </span>
            <span className="flex items-center gap-1 font-semibold text-amber-500">
              <span className="material-symbols-outlined text-[14px]">visibility</span>
              {fmt(resource.views)}
            </span>
            <span className="flex items-center gap-1 font-semibold text-yellow-500">
              <span className="material-symbols-outlined text-[14px]">star</span>
              {resource.averageRating ? resource.averageRating.toFixed(1) : '—'}
            </span>
          </div>
          <button
            onClick={() => onRate(resource)}
            className="text-[11px] text-slate-400 dark:text-outline hover:text-gold-accent transition-colors flex items-center gap-0.5"
          >
            <span className="material-symbols-outlined text-[13px]">star_border</span>
            Rate
          </button>
        </div>

        {/* Access */}
        <button
          onClick={handleAccess}
          className="w-full py-2 rounded-lg border border-gold-accent/40 text-gold-accent text-sm font-bold hover:bg-gold-accent hover:text-white transition-all"
        >
          Access Resource
        </button>

        {/* Approval actions (shown on pending tab) */}
        {showApprovalActions && !resource.isApproved && (
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

        {/* Admin edit/delete (all resources) */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(resource)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant hover:border-primary/40 hover:text-primary rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-[13px]">edit</span>
            Edit
          </button>
          <button
            onClick={() => onDelete(resource._id)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant hover:border-red-400 hover:text-red-600 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-[13px]">delete</span>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Bookmarks Drawer ───────────────────────────────────────────────────── */

function BookmarksDrawer({ bookmarks, bookmarkCount, onRemove }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-0 z-50 transition-all" style={{ left: SIDEBAR_W, right: 0 }}>
      <div className="mx-6">
        <div className="bg-white dark:bg-surface-container border-x border-t border-slate-200 dark:border-outline-variant/40 rounded-t-2xl shadow-2xl overflow-hidden">
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold-accent/10 flex items-center justify-center text-gold-accent">
                <span className="material-symbols-outlined text-[18px]">bookmarks</span>
              </div>
              <span className="text-sm font-bold text-on-surface">Your Bookmarks</span>
              {bookmarkCount > 0 && (
                <span className="text-xs bg-gold-accent text-white px-2 py-0.5 rounded-full font-bold">{bookmarkCount}</span>
              )}
            </div>
            <span className={`material-symbols-outlined text-slate-400 dark:text-outline transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
              keyboard_arrow_up
            </span>
          </button>
          {open && (
            <div className="border-t border-slate-100 dark:border-outline-variant/20 p-5 pt-3">
              {bookmarks.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-outline text-center py-4">No bookmarks yet.</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                  {bookmarks.map((r) => {
                    const cfg = TYPE_CFG[r.type] || TYPE_CFG.article;
                    return (
                      <div key={r._id} className="flex-shrink-0 w-56 flex gap-3 p-3 bg-slate-50 dark:bg-surface-container rounded-xl border border-transparent hover:border-gold-accent/30 transition-all">
                        <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${cfg.thumb} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                          {r.thumbnail
                            ? <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover rounded-lg" />
                            : <span className="material-symbols-outlined text-white/50 text-[22px]">{cfg.icon}</span>}
                        </div>
                        <div className="flex flex-col justify-center overflow-hidden flex-1 min-w-0">
                          <h4 className="text-xs font-bold truncate text-on-surface">{r.title}</h4>
                          <span className="text-[10px] text-slate-400 dark:text-outline mt-1 uppercase font-bold tracking-widest">{cfg.label}</span>
                        </div>
                        <button onClick={() => onRemove(r._id)} className="self-start text-slate-300 dark:text-outline hover:text-red-500 transition-colors flex-shrink-0 mt-0.5" title="Remove bookmark">
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
  const inp = 'w-full border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-gold-accent/40 focus:border-gold-accent/50 transition-all';

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
                    className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${form.fileMode === m ? 'bg-gold-accent text-white border-gold-accent' : 'border-slate-200 text-slate-500 hover:border-gold-accent/40'}`}>
                    {m === 'link' ? 'External Link' : 'Upload File'}
                  </button>
                ))}
              </div>
              {form.fileMode === 'link' ? (
                <input className={inp} value={form.externalLink} onChange={(e) => set('externalLink', e.target.value)} placeholder="https://..." type="url" />
              ) : (
                <div className="border-2 border-dashed border-slate-200 dark:border-outline-variant/40 rounded-xl p-6 text-center hover:border-gold-accent/40 transition-colors">
                  {uploading ? (
                    <div className="flex justify-center"><Spinner /></div>
                  ) : uploadedFile ? (
                    <div className="text-sm text-emerald-600 flex items-center justify-center gap-2 font-medium">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      File uploaded successfully
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[40px] text-slate-300 dark:text-outline">cloud_upload</span>
                      <p className="text-sm text-slate-400 dark:text-on-surface-variant mt-2">PDF, DOC, MP4, MP3 supported (max 100MB)</p>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="mt-3 px-4 py-2 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant hover:border-gold-accent/40 hover:text-gold-accent rounded-lg transition-all">
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
                className="w-4 h-4 accent-gold-accent rounded" />
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
            className="px-6 py-2.5 text-sm font-bold bg-gold-accent text-white hover:opacity-90 disabled:opacity-50 rounded-lg transition-all">
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
                <span className={`material-symbols-outlined text-[36px] ${star <= (hovered || rating) ? 'text-gold-accent' : 'text-slate-200 dark:text-outline'}`}>
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
            <textarea className="w-full border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg px-3 py-2 text-sm text-on-surface h-20 resize-none focus:outline-none focus:ring-2 focus:ring-gold-accent/40"
              value={review} onChange={(e) => setReview(e.target.value)} placeholder="Share your thoughts..." maxLength={500} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-outline-variant/20 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant rounded-lg hover:border-slate-300 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || !rating}
            className="px-6 py-2.5 text-sm font-bold bg-gold-accent text-white hover:opacity-90 disabled:opacity-50 rounded-lg transition-all">
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
    { label: 'Total Resources',   value: overview.total,         icon: 'library_books',  color: 'text-primary'     },
    { label: 'Approved',          value: overview.approved,      icon: 'check_circle',   color: 'text-emerald-500' },
    { label: 'Pending Approval',  value: overview.pending,       icon: 'pending',        color: 'text-amber-500'   },
    { label: 'Total Downloads',   value: fmt(overview.totalDownloads), icon: 'download', color: 'text-gold-accent' },
    { label: 'Total Views',       value: fmt(overview.totalViews),     icon: 'visibility', color: 'text-blue-500'  },
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
            <span className="material-symbols-outlined text-gold-accent text-[18px]">donut_large</span>
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
                    <div className="h-full rounded-full bg-gradient-to-r from-gold-accent to-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Category */}
        <div className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/40 rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-gold-accent text-[18px]">category</span>
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
            <span className="material-symbols-outlined text-gold-accent text-[18px]">download</span>
            Top Downloaded
          </h3>
          <div className="space-y-3">
            {(topDownloads || []).map((r, i) => (
              <div key={r._id} className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-outline-variant/10 last:border-0">
                <span className="w-6 h-6 rounded-full bg-gold-accent/10 text-gold-accent text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{r.title}</p>
                  <p className="text-[10px] text-slate-400 dark:text-outline uppercase font-bold">{r.type}</p>
                </div>
                <span className="text-xs font-bold text-gold-accent">{fmt(r.downloads)}</span>
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
            <span className="material-symbols-outlined text-gold-accent text-[18px]">visibility</span>
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
  { key: 'analytics',label: 'Analytics',        icon: 'analytics'     },
];

export default function AdminDashboardResourcesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* ── Active tab ── */
  const [activeTab, setActiveTab] = useState('all');

  /* ── Resources state ── */
  const [resources, setResources]     = useState([]);
  const [pagination, setPagination]   = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]         = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  /* ── Filter state ── */
  const [searchInput, setSearchInput]       = useState('');
  const [search, setSearch]                 = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType]         = useState('');
  const [sort, setSort]                     = useState('-createdAt');
  const [page, setPage]                     = useState(1);

  /* ── Bookmarks ── */
  const [bookmarks, setBookmarks]       = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  /* ── Analytics ── */
  const [analytics, setAnalytics]         = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  /* ── Modals ── */
  const [uploadModal, setUploadModal] = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [rateTarget, setRateTarget]   = useState(null);

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
        ...(activeTab === 'pending' ? { status: 'pending' } : {}),
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

  /* ── Fetch pending count for badge ── */
  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await resourceApi.adminGetAll({ status: 'pending', limit: 1, page: 1 });
      setPendingCount(res.data?.pagination?.total || 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchPendingCount(); }, [fetchPendingCount]);

  /* ── Fetch analytics when tab switches ── */
  useEffect(() => {
    if (activeTab !== 'analytics') return;
    setAnalyticsLoading(true);
    resourceApi.adminGetAnalytics()
      .then((res) => setAnalytics(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setAnalyticsLoading(false));
  }, [activeTab]);

  /* ── Fetch bookmarks ── */
  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await resourceApi.getBookmarks({ limit: 50 });
      const bk  = res.data?.resources || [];
      setBookmarks(bk);
      setBookmarkedIds(new Set(bk.map((r) => r._id)));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  /* ── Handlers ── */
  const handleBookmark = async (id) => {
    try {
      const res = await resourceApi.toggleBookmark(id);
      if (res.data.bookmarked) {
        setBookmarkedIds((prev) => new Set([...prev, id]));
        const target = resources.find((r) => r._id === id);
        if (target) setBookmarks((prev) => [target, ...prev.filter((b) => b._id !== id)]);
      } else {
        setBookmarkedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
        setBookmarks((prev) => prev.filter((b) => b._id !== id));
      }
      toast.success(res.data.bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks');
    } catch {
      toast.error('Failed to update bookmark');
    }
  };

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
      setPendingCount((c) => Math.max(0, c - 1));
      toast.success('Resource approved and published');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this resource? It will remain unpublished.')) return;
    try {
      await resourceApi.reject(id);
      setResources((prev) => prev.filter((r) => r._id !== id));
      setPendingCount((c) => Math.max(0, c - 1));
      toast.success('Resource rejected');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this resource? This cannot be undone.')) return;
    try {
      await resourceApi.delete(id);
      setResources((prev) => prev.filter((r) => r._id !== id));
      toast.success('Resource deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
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

  const handleLogout = async () => {
    try { await logout(); toast.success('Signed out'); }
    finally { navigate('/'); }
  };

  /* ─── RENDER ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#f8f6f6] dark:bg-[#100f16]">
      <div className="relative flex min-h-screen overflow-hidden text-on-surface">

        {/* ── Sidebar ── */}
        <AdminSidebar user={user} onLogout={handleLogout} />

        {/* ── Main ── */}
        <main className="ml-[280px] flex-1 flex flex-col min-h-screen">

          {/* ── Header ── */}
          <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white/80 dark:bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-outline">
                <Link className="hover:text-gold-accent transition-colors" to="/">Home</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <Link className="hover:text-gold-accent transition-colors" to="/dashboard">Dashboard</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-on-surface">Manage Resources</span>
              </div>
            </div>
            <button
              onClick={() => setUploadModal(true)}
              className="bg-gold-accent text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-gold-accent/20"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Upload Resource
            </button>
          </header>

          {/* ── Content ── */}
          <div className="p-8 space-y-6 pb-32">

            {/* Page title */}
            <div>
              <h1 className="font-serif-alt text-3xl font-bold text-on-surface">Resource Management</h1>
              <p className="text-sm text-slate-500 dark:text-on-surface-variant mt-1">
                Approve uploads, manage all resources, and view platform-wide analytics.
              </p>
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-outline-variant/30">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all -mb-px relative ${
                    activeTab === tab.key
                      ? 'border-gold-accent text-gold-accent'
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
                </button>
              ))}
            </div>

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
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-accent/40 text-on-surface"
                    />
                  </form>

                  <select
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                    className="border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-gold-accent/40"
                  >
                    <option value="">All Types</option>
                    {TYPES.map((t) => <option key={t} value={t}>{TYPE_CFG[t].label}</option>)}
                  </select>

                  <select
                    value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                    className="border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-gold-accent/40"
                  >
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>

                  <select
                    value={sort}
                    onChange={(e) => { setSort(e.target.value); setPage(1); }}
                    className="border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container-low rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-gold-accent/40"
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
                  </p>
                </div>

                {/* Resource grid */}
                {loading ? (
                  <div className="flex justify-center py-20"><Spinner size="lg" /></div>
                ) : resources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <span className="material-symbols-outlined text-[64px] text-slate-200 dark:text-outline">
                      {activeTab === 'pending' ? 'check_circle' : 'library_books'}
                    </span>
                    <p className="text-lg font-bold text-on-surface">
                      {activeTab === 'pending' ? 'No pending resources' : 'No resources found'}
                    </p>
                    <p className="text-sm text-slate-400 dark:text-outline">
                      {activeTab === 'pending'
                        ? 'All uploaded resources have been reviewed.'
                        : 'Try adjusting your filters or upload a new resource.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                    {resources.map((r) => (
                      <AdminResourceCard
                        key={r._id}
                        resource={r}
                        bookmarkedIds={bookmarkedIds}
                        onBookmark={handleBookmark}
                        onDownload={handleDownload}
                        onRate={handleRate}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        showApprovalActions={activeTab === 'pending'}
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
                      className="px-4 py-2 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 rounded-lg text-slate-500 dark:text-outline hover:border-gold-accent/40 hover:text-gold-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-500 dark:text-outline font-medium px-3">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
                      className="px-4 py-2 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 rounded-lg text-slate-500 dark:text-outline hover:border-gold-accent/40 hover:text-gold-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

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

        {/* ── Bookmarks Drawer ── */}
        <BookmarksDrawer
          bookmarks={bookmarks}
          bookmarkCount={bookmarkedIds.size}
          onRemove={handleBookmark}
        />
      </div>
    </div>
  );
}
