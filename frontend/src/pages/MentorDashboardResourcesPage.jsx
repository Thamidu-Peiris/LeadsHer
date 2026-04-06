import { useEffect, useState, useCallback, useRef } from 'react';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { resourceApi } from '../api/resourceApi';
import Spinner from '../components/common/Spinner';
import ResourcePreviewModal from '../components/common/ResourcePreviewModal';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const TYPES    = ['article', 'ebook', 'video', 'podcast', 'tool', 'guide'];
const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'leadership-skills',  label: 'Leadership Skills' },
  { value: 'communication',      label: 'Communication' },
  { value: 'negotiation',        label: 'Negotiation' },
  { value: 'time-management',    label: 'Time Management' },
  { value: 'career-planning',    label: 'Career Planning' },
  { value: 'work-life-balance',  label: 'Work-Life Balance' },
  { value: 'networking',         label: 'Networking' },
];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const SORTS = [
  { value: '-createdAt',     label: 'Newest First' },
  { value: 'createdAt',      label: 'Oldest First' },
  { value: '-averageRating', label: 'Highest Rated' },
  { value: '-views',         label: 'Most Viewed' },
  { value: '-downloads',     label: 'Most Downloaded' },
];

/* Type visual config */
const TYPE_CFG = {
  article: {
    icon: 'article',
    label: 'Article',
    thumb: 'from-slate-700 to-slate-900',
    badge: 'bg-slate-800/80',
  },
  ebook: {
    icon: 'menu_book',
    label: 'Ebook',
    thumb: 'from-violet-700 to-purple-900',
    badge: 'bg-violet-800/80',
  },
  video: {
    icon: 'play_circle',
    label: 'Video',
    thumb: 'from-red-700 to-rose-900',
    badge: 'bg-red-800/80',
  },
  podcast: {
    icon: 'podcasts',
    label: 'Podcast',
    thumb: 'from-amber-600 to-orange-800',
    badge: 'bg-amber-700/80',
  },
  tool: {
    icon: 'build',
    label: 'Tool',
    thumb: 'from-emerald-700 to-teal-900',
    badge: 'bg-emerald-800/80',
  },
  guide: {
    icon: 'local_library',
    label: 'Guide',
    thumb: 'from-[#6242a3] to-[#3a1f7a]',
    badge: 'bg-[#6242a3]/80',
  },
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
  isPremium: false, fileMode: 'link', thumbnail: '',
};

/* ─── Resource Card ──────────────────────────────────────────────────────── */

function ResourceCard({ resource, userId, bookmarkedIds, onBookmark, onDownload, onRate, onEdit, onDelete, onPreview }) {
  const isOwner = resource.uploadedBy?._id === userId || resource.uploadedBy === userId;
  const cfg = TYPE_CFG[resource.type] || TYPE_CFG.article;
  const diffBadge = DIFF_BADGE[resource.difficulty] || DIFF_BADGE.beginner;
  const isBookmarked = bookmarkedIds.has(resource._id);

  const handleAccess = () => {
    onDownload(resource._id);
    const rawUrl = resource.file?.url || resource.externalLink;
    if (!rawUrl) { toast('No link or file attached to this resource.', { icon: 'ℹ️' }); return; }
    onPreview(resource);
  };

  return (
    <div className="group bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/40 rounded-lg overflow-hidden hover:border-rose-500/50 transition-all duration-300 flex flex-col">
      <div className="relative aspect-video overflow-hidden flex-shrink-0">
        {resource.thumbnail ? (
          <img
            src={resource.thumbnail}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${cfg.thumb} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}>
            <span className="material-symbols-outlined text-white/30 text-[48px]">{cfg.icon}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => onBookmark(resource._id)}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
            isBookmarked
              ? 'bg-black text-white'
              : 'bg-black/20 text-white hover:bg-black hover:text-white'
          }`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isBookmarked ? 'bookmark' : 'bookmark_border'}
          </span>
        </button>
      </div>

      <div className="p-3.5 sm:p-4 flex flex-col flex-1 gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <span className={`px-1.5 py-0.5 ${cfg.badge} text-white text-[9px] uppercase font-bold tracking-wider rounded`}>
            {cfg.label}
          </span>
          <span className={`px-1.5 py-0.5 ${diffBadge} text-white text-[9px] uppercase font-bold tracking-wider rounded`}>
            {resource.difficulty}
          </span>
          {resource.isPremium && (
            <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] uppercase font-bold tracking-wider rounded">
              Premium
            </span>
          )}
          {isOwner && resource.isApproved && (
            <span className="px-1.5 py-0.5 bg-emerald-500/80 text-white text-[9px] uppercase font-bold tracking-wider rounded">
              Approved
            </span>
          )}
          {isOwner && !resource.isApproved && resource.isRejected && (
            <span className="px-1.5 py-0.5 bg-red-500/80 text-white text-[9px] uppercase font-bold tracking-wider rounded">
              Rejected
            </span>
          )}
          {isOwner && !resource.isApproved && !resource.isRejected && (
            <span className="px-1.5 py-0.5 bg-amber-500/80 text-white text-[9px] uppercase font-bold tracking-wider rounded">
              Pending
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold leading-snug text-on-surface line-clamp-2 group-hover:text-rose-500 transition-colors">
          {resource.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-on-surface-variant line-clamp-2 flex-1 leading-relaxed">
          {resource.description}
        </p>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-outline-variant/20 min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
            <span className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-blue-800 dark:text-blue-300 tabular-nums" title="Downloads">
              <span className="material-symbols-outlined text-[17px] leading-none text-blue-800 dark:text-blue-300">download</span>
              {fmt(resource.downloads ?? 0)}
            </span>
            <span className="flex items-center gap-1 shrink-0 text-xs font-bold tabular-nums text-amber-500 dark:text-amber-400" title="Average rating">
              <span
                className="material-symbols-outlined text-[17px] leading-none text-amber-500 dark:text-amber-400"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              {(Number(resource.averageRating) || 0).toFixed(1)}
              <span className="font-normal text-slate-400 dark:text-slate-500">({resource.ratingCount ?? 0})</span>
            </span>
            <button
              type="button"
              onClick={() => onRate(resource)}
              className="text-[10px] text-slate-400 dark:text-outline hover:text-rose-500 transition-colors flex items-center gap-0.5 shrink-0"
            >
              <span className="material-symbols-outlined text-[12px]">star_border</span>
              Rate
            </button>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-outline shrink-0 tabular-nums">
            {fmtDate(resource.createdAt)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAccess}
          className="w-full py-1.5 rounded-md border border-rose-500/40 text-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all"
        >
          Access Resource
        </button>

        {isOwner && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(resource)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant hover:border-rose-500/40 hover:text-rose-600 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined text-[13px]">edit</span>
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(resource._id)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant hover:border-red-400 hover:text-red-600 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined text-[13px]">delete</span>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Bookmarks (same UX as mentee resources page) ───────────────────────── */

function BookmarksList({ bookmarks, onRemove }) {
  if (bookmarks.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-outline text-center py-6 px-2">
        No bookmarks yet. Save resources to find them here.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2 max-h-[min(60vh,28rem)] overflow-y-auto pr-1 -mr-1">
      {bookmarks.map((r) => {
        const cfg = TYPE_CFG[r.type] || TYPE_CFG.article;
        return (
          <li key={r._id}>
            <div className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-surface-container border border-transparent hover:border-rose-500/30 transition-all">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${cfg.thumb} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                {r.thumbnail ? (
                  <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="material-symbols-outlined text-white/50 text-[20px]">{cfg.icon}</span>
                )}
              </div>
              <div className="flex flex-col justify-center overflow-hidden flex-1 min-w-0">
                <h4 className="text-xs font-bold line-clamp-2 text-on-surface">{r.title}</h4>
                <span className="text-[10px] text-slate-400 dark:text-outline mt-0.5 uppercase font-bold tracking-widest">{cfg.label}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(r._id)}
                className="self-start text-slate-300 dark:text-outline hover:text-red-500 transition-colors flex-shrink-0 p-0.5"
                title="Remove bookmark"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function BookmarksPanelHeader({ bookmarkCount }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
        <span className="material-symbols-outlined text-[20px]">bookmarks</span>
      </div>
      <span className="text-sm font-bold text-on-surface truncate">Your Bookmarks</span>
      {bookmarkCount > 0 && (
        <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold tabular-nums shrink-0">
          {bookmarkCount}
        </span>
      )}
    </div>
  );
}

function BookmarksPanel({ bookmarks, bookmarkCount, onRemove, className = '', verticalCollapse = true }) {
  const [open, setOpen] = useState(false);

  if (!verticalCollapse) {
    return (
      <div
        className={`rounded-2xl border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container shadow-sm p-4 flex flex-col gap-3 min-w-0 ${className}`}
      >
        <BookmarksPanelHeader bookmarkCount={bookmarkCount} />
        <BookmarksList bookmarks={bookmarks} onRemove={onRemove} />
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-outline-variant/40 bg-white dark:bg-surface-container shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 p-4 text-left hover:bg-slate-50 dark:hover:bg-surface-container-high transition-colors shrink-0"
      >
        <BookmarksPanelHeader bookmarkCount={bookmarkCount} />
        <span
          className={`material-symbols-outlined text-slate-400 dark:text-outline shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          keyboard_arrow_up
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-outline-variant/20">
          <BookmarksList bookmarks={bookmarks} onRemove={onRemove} />
        </div>
      )}
    </div>
  );
}

function BookmarksRightRail({ bookmarks, bookmarkCount, onRemove }) {
  const [railOpen, setRailOpen] = useState(true);

  return (
    <aside
      className={`hidden xl:flex shrink-0 flex-col border-l border-slate-200/70 dark:border-outline-variant/30 bg-white/25 dark:bg-surface-container-low/20 transition-[width,min-width,padding] duration-300 ease-out overflow-hidden ${
        railOpen
          ? 'w-[300px] min-w-[300px] pl-4 pr-5 py-8 justify-center'
          : 'w-[52px] min-w-[52px] px-0 py-8 items-center justify-center'
      }`}
    >
      {!railOpen ? (
        <button
          type="button"
          onClick={() => setRailOpen(true)}
          className="group flex flex-col items-center justify-center gap-2 min-h-[140px] w-full rounded-l-xl border border-r-0 border-slate-200/80 dark:border-outline-variant/40 bg-white/90 dark:bg-surface-container shadow-sm hover:bg-rose-50/80 dark:hover:bg-surface-container-high transition-colors"
          title="Show bookmarks"
          aria-expanded={false}
          aria-label="Expand bookmarks sidebar"
        >
          <span className="material-symbols-outlined text-rose-500 text-[22px]">bookmarks</span>
          <span className="material-symbols-outlined text-slate-500 dark:text-outline text-[22px] transition-transform group-hover:-translate-x-0.5">
            chevron_left
          </span>
          {bookmarkCount > 0 && (
            <span className="text-[10px] font-bold tabular-nums bg-rose-500 text-white min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center">
              {bookmarkCount > 99 ? '99+' : bookmarkCount}
            </span>
          )}
        </button>
      ) : (
        <div className="flex flex-col gap-2 w-full min-w-0 justify-center flex-1">
          <div className="flex items-center justify-end shrink-0 -mt-1 -mr-1">
            <button
              type="button"
              onClick={() => setRailOpen(false)}
              className="p-2 rounded-lg text-slate-500 dark:text-outline hover:bg-slate-100 dark:hover:bg-surface-container-high transition-colors"
              title="Hide bookmarks panel"
              aria-expanded
              aria-label="Collapse bookmarks sidebar"
            >
              <span className="material-symbols-outlined text-[22px] block transition-transform">chevron_right</span>
            </button>
          </div>
          <BookmarksPanel
            bookmarks={bookmarks}
            bookmarkCount={bookmarkCount}
            onRemove={onRemove}
            verticalCollapse={false}
            className="w-full"
          />
        </div>
      )}
    </aside>
  );
}

/* ─── Book Card (Google Books result) ───────────────────────────────────── */

function BookCard({ book, onSelect }) {
  return (
    <div className="flex gap-2.5 p-2.5 bg-slate-50 dark:bg-surface-container rounded-lg border border-transparent hover:border-violet-300 dark:hover:border-violet-700 transition-all">
      <div className="w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
        {book.thumbnail ? (
          <img
            src={book.thumbnail.replace('http://', 'https://')}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="material-symbols-outlined text-violet-400 text-[22px]">menu_book</span>
        )}
      </div>
      <div className="flex flex-col flex-1 min-w-0 justify-between">
        <div>
          <h4 className="text-[11px] font-bold text-on-surface leading-tight line-clamp-2">{book.title}</h4>
          {book.authors?.length > 0 && (
            <p className="text-[10px] text-slate-400 dark:text-outline mt-0.5 truncate">{book.authors.join(', ')}</p>
          )}
          {book.publishedDate && (
            <p className="text-[10px] text-slate-300 dark:text-outline/60 mt-0.5">{book.publishedDate.slice(0, 4)}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onSelect(book)}
          className="mt-1.5 text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 flex items-center gap-0.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[12px]">add_circle</span>
          Use this Book
        </button>
      </div>
    </div>
  );
}

/* ─── Upload / Edit Modal ────────────────────────────────────────────────── */

function ResourceFormModal({ mode, initial, isMentor, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [saving, setSaving]               = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [error, setError]                 = useState('');
  const fileInputRef                      = useRef(null);
  const thumbInputRef                     = useRef(null);
  const [uploadedFile, setUploadedFile]   = useState(null);

  /* Google Books state */
  const [booksTab, setBooksTab]         = useState('search');
  const [bookQuery, setBookQuery]       = useState('');
  const [bookResults, setBookResults]   = useState([]);
  const [bookLoading, setBookLoading]   = useState(false);
  const [recBooks, setRecBooks]         = useState([]);
  const [recLoading, setRecLoading]     = useState(false);

  /* YouTube state */
  const [ytQuery, setYtQuery]               = useState('');
  const [ytResults, setYtResults]           = useState([]);
  const [ytSearching, setYtSearching]       = useState(false);
  const [selectedYtVideo, setSelectedYtVideo] = useState(null);

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

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    try {
      const fd = new FormData();
      fd.append('thumbnail', file);
      const res = await resourceApi.uploadThumbnail(fd);
      set('thumbnail', res.data.url);
      toast.success('Cover image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleBookSearch = async () => {
    if (!bookQuery.trim()) return;
    setBookLoading(true);
    try {
      const res = await resourceApi.searchBooks({ q: bookQuery.trim(), maxResults: 8 });
      setBookResults(res.data?.books || []);
      if ((res.data?.books || []).length === 0) toast('No books found. Try a different search.', { icon: 'ℹ️' });
    } catch {
      toast.error('Book search failed');
    } finally {
      setBookLoading(false);
    }
  };

  const handleLoadRecommended = async () => {
    setRecLoading(true);
    try {
      const res = await resourceApi.getBookRecommendations({ category: form.category, maxResults: 6 });
      setRecBooks(res.data?.books || []);
    } catch {
      toast.error('Failed to load recommendations');
    } finally {
      setRecLoading(false);
    }
  };

  const handleSelectBook = (book) => {
    if (book.title) set('title', book.title);
    if (book.description) set('description', book.description.slice(0, 600));
    if (book.authors?.length) set('author', book.authors[0]);
    if (book.thumbnail) set('thumbnail', book.thumbnail.replace('http://', 'https://'));
    const link = book.infoLink || book.previewLink;
    if (link) {
      set('externalLink', link.replace('http://', 'https://'));
      set('fileMode', 'link');
    }
    if (book.categories?.length) {
      const existing = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const fromBook = book.categories[0].split(/[/&,]/).map((t) => t.toLowerCase().trim()).filter(Boolean).slice(0, 3);
      const merged = [...new Set([...existing, ...fromBook])];
      if (merged.length >= 2) set('tags', merged.join(', '));
    }
    toast.success('Book details applied to the form');
  };

  const handleYouTubeSearch = async () => {
    if (!ytQuery.trim()) return;
    setYtSearching(true);
    try {
      const res = await resourceApi.searchYouTube({ q: ytQuery.trim(), maxResults: 9 });
      setYtResults(res.data?.videos || []);
      if ((res.data?.videos || []).length === 0) toast('No videos found. Try a different search.', { icon: 'ℹ️' });
    } catch {
      toast.error('YouTube search failed');
    } finally {
      setYtSearching(false);
    }
  };

  const handleSelectYtVideo = (video) => {
    setSelectedYtVideo(video);
    set('externalLink', video.watchUrl);
    if (!form.title.trim()) set('title', video.title);
    if (!form.thumbnail) set('thumbnail', video.thumbnail);
    toast.success('Video selected');
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
      externalLink: (form.fileMode === 'link' || form.fileMode === 'youtube') ? form.externalLink.trim() : '',
      author: form.author.trim(),
      isPremium: isMentor ? form.isPremium : false,
      thumbnail: form.thumbnail || '',
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
              <select className={inp} value={form.type} onChange={(e) => {
                const newType = e.target.value;
                set('type', newType);
                if (newType === 'video') {
                  set('fileMode', 'youtube');
                } else if (form.fileMode === 'youtube') {
                  set('fileMode', 'link');
                  setYtResults([]);
                  setSelectedYtVideo(null);
                  setYtQuery('');
                }
              }}>
                {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Category *</label>
              <select className={inp} value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.filter((c) => c.value).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* ── Google Books Panel (Ebook type only) ── */}
            {form.type === 'ebook' && (
              <div className="sm:col-span-2 border border-violet-200 dark:border-violet-800/40 rounded-xl overflow-hidden">
                {/* Header + tabs */}
                <div className="bg-violet-50 dark:bg-violet-900/20 px-4 py-3 flex items-center justify-between border-b border-violet-200 dark:border-violet-800/40">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-violet-600 dark:text-violet-400 text-[18px]">auto_stories</span>
                    <span className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-widest">Google Books</span>
                  </div>
                  <div className="flex gap-1">
                    {[
                      { key: 'search', label: 'Search' },
                      { key: 'recommend', label: 'Recommended' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setBooksTab(key);
                          if (key === 'recommend' && recBooks.length === 0) handleLoadRecommended();
                        }}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider transition-all ${
                          booksTab === key
                            ? 'bg-violet-600 text-white'
                            : 'text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4">
                  {booksTab === 'search' ? (
                    <>
                      {/* Search input */}
                      <div className="flex gap-2 mb-3">
                        <input
                          className={`${inp} flex-1`}
                          value={bookQuery}
                          onChange={(e) => setBookQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleBookSearch()}
                          placeholder="Search by title, author, or topic…"
                        />
                        <button
                          type="button"
                          onClick={handleBookSearch}
                          disabled={bookLoading || !bookQuery.trim()}
                          className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 flex-shrink-0"
                        >
                          {bookLoading ? (
                            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-[16px]">search</span>
                          )}
                          Search
                        </button>
                      </div>
                      {/* Results */}
                      {bookResults.length > 0 && (
                        <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                          {bookResults.map((book) => (
                            <BookCard key={book.id} book={book} onSelect={handleSelectBook} />
                          ))}
                        </div>
                      )}
                      {bookResults.length === 0 && !bookLoading && (
                        <p className="text-xs text-slate-400 dark:text-outline text-center py-3">
                          Search for books to auto-fill the form with book details.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      {recLoading && (
                        <div className="flex justify-center py-4"><Spinner /></div>
                      )}
                      {!recLoading && recBooks.length > 0 && (
                        <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                          {recBooks.map((book) => (
                            <BookCard key={book.id} book={book} onSelect={handleSelectBook} />
                          ))}
                        </div>
                      )}
                      {!recLoading && recBooks.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-xs text-slate-400 dark:text-outline mb-2">
                            Discover learning materials for the selected category.
                          </p>
                          <button
                            type="button"
                            onClick={handleLoadRecommended}
                            className="px-4 py-2 text-xs font-bold border border-violet-200 dark:border-violet-800/40 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                          >
                            Load Recommendations
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── YouTube Search Panel (Video type only) ── */}
            {form.type === 'video' && (
              <div className="sm:col-span-2 border border-red-200 dark:border-red-800/40 rounded-xl overflow-hidden">
                <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 flex items-center gap-2 border-b border-red-200 dark:border-red-800/40">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[18px]">smart_display</span>
                  <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-widest">YouTube Search</span>
                  <span className="ml-auto text-[10px] text-red-400 dark:text-red-500">Search and select a video to embed</span>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 mb-3">
                    <input
                      className={`${inp} flex-1`}
                      value={ytQuery}
                      onChange={(e) => setYtQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleYouTubeSearch()}
                      placeholder="Search: time management, leadership, women in tech…"
                    />
                    <button
                      type="button"
                      onClick={handleYouTubeSearch}
                      disabled={ytSearching || !ytQuery.trim()}
                      className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 flex-shrink-0"
                    >
                      {ytSearching ? (
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">search</span>
                      )}
                      Search
                    </button>
                  </div>

                  {/* Selected video preview */}
                  {selectedYtVideo && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-red-200 dark:border-red-800/40">
                      <div className="aspect-video w-full bg-black">
                        <iframe
                          src={selectedYtVideo.embedUrl}
                          title={selectedYtVideo.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-on-surface line-clamp-1">{selectedYtVideo.title}</p>
                          <p className="text-[10px] text-slate-400 dark:text-on-surface-variant">{selectedYtVideo.channelTitle}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSelectedYtVideo(null); set('externalLink', ''); }}
                          className="text-[10px] text-red-500 hover:text-red-700 font-medium flex-shrink-0 flex items-center gap-0.5"
                        >
                          <span className="material-symbols-outlined text-[13px]">close</span>
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Search results grid */}
                  {ytResults.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                      {ytResults.map((video) => (
                        <button
                          key={video.id}
                          type="button"
                          onClick={() => handleSelectYtVideo(video)}
                          className={`text-left rounded-lg overflow-hidden border transition-all hover:border-red-400 ${
                            selectedYtVideo?.id === video.id
                              ? 'border-red-500 ring-2 ring-red-400/40'
                              : 'border-slate-200 dark:border-outline-variant/40'
                          }`}
                        >
                          <div className="relative aspect-video bg-slate-100 dark:bg-surface-container-low">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                              <span className="material-symbols-outlined text-white text-[28px]">play_circle</span>
                            </div>
                            {selectedYtVideo?.id === video.id && (
                              <div className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5">
                                <span className="material-symbols-outlined text-white text-[12px]">check</span>
                              </div>
                            )}
                          </div>
                          <div className="p-1.5">
                            <p className="text-[10px] font-semibold text-on-surface line-clamp-2 leading-tight">{video.title}</p>
                            <p className="text-[9px] text-slate-400 dark:text-on-surface-variant mt-0.5 line-clamp-1">{video.channelTitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {ytResults.length === 0 && !ytSearching && (
                    <p className="text-xs text-slate-400 dark:text-outline text-center py-3">
                      Search for YouTube videos to embed them as resources.
                    </p>
                  )}
                </div>
              </div>
            )}

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

            {/* Cover image / thumbnail */}
            <div className="sm:col-span-2">
              <label className={lbl}>Cover Image (optional)</label>
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="w-28 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 dark:border-outline-variant/40 bg-slate-100 dark:bg-surface-container-low flex items-center justify-center">
                  {form.thumbnail ? (
                    <img src={form.thumbnail} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[28px] text-slate-300 dark:text-outline">image</span>
                  )}
                </div>
                {/* Upload controls */}
                <div className="flex flex-col gap-2 justify-center">
                  <button
                    type="button"
                    disabled={uploadingThumb}
                    onClick={() => thumbInputRef.current?.click()}
                    className="px-4 py-2 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant hover:border-rose-500/50 hover:text-rose-500 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {uploadingThumb ? (
                      <><span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>Uploading…</>
                    ) : (
                      <><span className="material-symbols-outlined text-[14px]">cloud_upload</span>{form.thumbnail ? 'Change Image' : 'Upload Image'}</>
                    )}
                  </button>
                  {form.thumbnail && (
                    <button
                      type="button"
                      onClick={() => set('thumbnail', '')}
                      className="px-4 py-1.5 text-xs font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-400 hover:border-red-300 hover:text-red-500 rounded-lg transition-all"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-[10px] text-slate-400 dark:text-outline">JPG, PNG, WebP · Max 5 MB</p>
                </div>
              </div>
              <input
                ref={thumbInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleThumbnailUpload}
              />
            </div>

            {/* Content source */}
            <div className="sm:col-span-2">
              <label className={lbl}>Content Source</label>
              <div className="flex gap-2 mb-3">
                {(form.type === 'video'
                  ? ['youtube', 'link', 'file']
                  : ['link', 'file']
                ).map((m) => (
                  <button key={m} type="button" onClick={() => set('fileMode', m)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${form.fileMode === m ? 'bg-rose-500 text-white border-rose-500' : 'border-slate-200 text-slate-500 hover:border-rose-500/40'}`}>
                    {m === 'youtube' ? 'YouTube Search' : m === 'link' ? 'External Link' : 'Upload File'}
                  </button>
                ))}
              </div>
              {form.fileMode === 'youtube' ? (
                <div className="text-xs text-slate-400 dark:text-on-surface-variant text-center py-2 border border-dashed border-slate-200 dark:border-outline-variant/40 rounded-xl">
                  {selectedYtVideo
                    ? <span className="text-emerald-600 font-medium flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-[14px]">check_circle</span>Video selected from YouTube panel above</span>
                    : 'Use the YouTube Search panel above to find and select a video.'}
                </div>
              ) : form.fileMode === 'link' ? (
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
                      <p className="text-sm text-slate-400 dark:text-on-surface-variant mt-2">PDF, DOC, MP4, MP3, ZIP supported</p>
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

            {isMentor && (
              <div className="sm:col-span-2 flex items-center gap-3">
                <input id="isPremium" type="checkbox" checked={form.isPremium} onChange={(e) => set('isPremium', e.target.checked)}
                  className="w-4 h-4 accent-rose-500 rounded" />
                <label htmlFor="isPremium" className="text-sm text-on-surface font-medium cursor-pointer">
                  Mark as Premium resource
                </label>
              </div>
            )}
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
          <button onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant rounded-lg hover:border-slate-300 transition-colors">
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

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function MentorDashboardResourcesPage() {
  const { user } = useAuth();

  const isMentor  = user?.role === 'mentor' || user?.role === 'admin';

  /* ── Resources state ── */
  const [resources, setResources]   = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]       = useState(true);

  /* ── Filter state ── */
  const [searchInput, setSearchInput]         = useState('');
  const [search, setSearch]                   = useState('');
  const [activeType, setActiveType]           = useState('all');   // 'all' | type | 'mine'
  const [filterCategory, setFilterCategory]   = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [sort, setSort]                       = useState('-createdAt');
  const [page, setPage]                       = useState(1);

  /* ── Bookmarks state ── */
  const [bookmarks, setBookmarks]     = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  /* ── Modals ── */
  const [uploadModal, setUploadModal] = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [rateTarget, setRateTarget]   = useState(null);
  const [previewResource, setPreviewResource] = useState(null);

  /* ── Fetch resources ── */
  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeType === 'mine') {
        res = await resourceApi.getMyResources({ page, limit: 12 });
      } else {
        res = await resourceApi.getAll({
          page, limit: 12, sort,
          ...(search ? { search } : {}),
          ...(activeType !== 'all' ? { type: activeType } : {}),
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
  }, [activeType, page, sort, search, filterCategory, filterDifficulty]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  /* ── Fetch bookmarks on mount ── */
  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await resourceApi.getBookmarks({ limit: 50 });
      const bk  = res.data?.resources || [];
      setBookmarks(bk);
      setBookmarkedIds(new Set(bk.map((r) => r._id)));
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  /* ── Handlers ── */
  const handleBookmark = async (id) => {
    try {
      const res = await resourceApi.toggleBookmark(id);
      if (res.data.bookmarked) {
        setBookmarkedIds((prev) => new Set([...prev, id]));
        // Add to bookmarks drawer
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

  const handleRemoveBookmark = (id) => handleBookmark(id);

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
    await resourceApi.create(payload);
    toast.success('Resource uploaded — pending admin approval');
    setUploadModal(false);
    if (activeType === 'mine') fetchResources();
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

  const handleTypeChange = (type) => {
    setActiveType(type);
    setPage(1);
    setSearch('');
    setSearchInput('');
    setFilterDifficulty('');
    setFilterCategory('');
    setSort('-createdAt');
  };

  /* ─── Type pill buttons ─── */
  const typePills = [
    { key: 'all',  label: 'All Resources' },
    ...TYPES.map((t) => ({ key: t, label: TYPE_CFG[t].label + 's' })),
    ...(isMentor ? [{ key: 'mine', label: 'My Uploads' }] : []),
  ];

  /* ──────────────────────── RENDER ──────────────────────────────── */
  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <DashboardTopBar crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Resources' }]} />

      <div className="flex flex-1 min-h-0 items-stretch w-full">
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <div className="w-full max-w-2xl mx-auto px-6 sm:px-8 pt-6 pb-4">
            <form onSubmit={handleSearch}>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-rose-500 transition-colors text-[20px]">
                  search
                </span>
                <input
                  className="w-full bg-slate-50 dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 text-on-surface rounded-full py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 dark:placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-all"
                  placeholder="Search resources..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </form>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 dark:border-outline-variant/40 pt-2 pb-6 px-6">
            {typePills.map((pill) => (
              <button
                type="button"
                key={pill.key}
                onClick={() => handleTypeChange(pill.key)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeType === pill.key
                    ? 'bg-rose-500 text-white'
                    : 'bg-white border border-slate-200 dark:border-outline-variant/40 text-slate-600 dark:text-on-surface-variant hover:border-rose-500/50 hover:text-rose-500'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-8 py-5">
            <div className="flex flex-wrap items-center gap-3 w-full">
              <div className="relative min-w-[180px]">
                <select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                  className="w-full bg-white dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 text-on-surface rounded-lg px-4 py-2 text-sm appearance-none focus:ring-2 focus:ring-rose-500/40 focus:outline-none cursor-pointer"
                >
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-outline text-[18px]">
                  expand_more
                </span>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap bg-white dark:bg-surface-container-lowest p-1 rounded-lg border border-slate-200 dark:border-outline-variant/40 shadow-sm">
                <button
                  type="button"
                  onClick={() => { setFilterDifficulty(''); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    !filterDifficulty
                      ? 'bg-rose-500 text-white shadow-sm dark:bg-rose-600'
                      : 'text-slate-600 dark:text-on-surface-variant hover:bg-slate-100 dark:hover:bg-surface-container'
                  }`}
                >
                  All
                </button>
                {DIFFICULTIES.map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => { setFilterDifficulty(d); setPage(1); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${
                      filterDifficulty === d
                        ? 'bg-rose-500 text-white shadow-sm dark:bg-rose-600'
                        : 'text-slate-600 dark:text-on-surface-variant hover:bg-slate-100 dark:hover:bg-surface-container'
                    }`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[150px]">
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="w-full bg-white dark:bg-surface-container border border-slate-200 dark:border-outline-variant/40 text-on-surface rounded-lg px-4 py-2 text-sm appearance-none focus:ring-2 focus:ring-rose-500/40 focus:outline-none cursor-pointer"
                >
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-outline text-[18px]">
                  sort
                </span>
              </div>

              {(search || filterCategory || filterDifficulty) && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setSearchInput(''); setFilterCategory(''); setFilterDifficulty(''); setPage(1); }}
                  className="flex items-center gap-1 text-xs text-slate-400 dark:text-outline hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                  Clear
                </button>
              )}
            </div>

            {isMentor && (
              <button
                type="button"
                onClick={() => setUploadModal(true)}
                className="w-full lg:w-auto shrink-0 flex items-center justify-center gap-2 bg-rose-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-rose-600 active:scale-95 transition-all dark:bg-rose-600 dark:hover:bg-rose-500"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Upload Resource
              </button>
            )}
          </div>

          <div className="px-8 pb-8 pt-2">
              {loading ? (
                <div className="flex justify-center py-24">
                  <Spinner size="lg" />
                </div>
              ) : resources.length === 0 ? (
                <div className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant/40 rounded-2xl p-16 text-center">
                  <span className="material-symbols-outlined text-[56px] text-slate-200 dark:text-outline">library_books</span>
                  <p className="text-slate-400 dark:text-on-surface-variant mt-3 font-medium">
                    {activeType === 'mine'
                      ? "You haven't uploaded any resources yet."
                      : search || filterCategory || filterDifficulty
                        ? 'No resources match your filters.'
                        : 'No approved resources available yet.'}
                  </p>
                  {activeType === 'mine' && isMentor && (
                    <button
                      type="button"
                      onClick={() => setUploadModal(true)}
                      className="mt-5 inline-flex items-center gap-2 bg-rose-500 text-white px-5 py-2.5 font-bold text-sm rounded-lg hover:bg-rose-600 transition-all dark:bg-rose-600 dark:hover:bg-rose-500"
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
                      userId={user?.id || user?._id}
                      bookmarkedIds={bookmarkedIds}
                      onBookmark={handleBookmark}
                      onDownload={handleDownload}
                      onRate={handleRate}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onPreview={setPreviewResource}
                    />
                  ))}
                </div>
              )}

              {!loading && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-5 py-2 text-sm font-semibold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant rounded-lg hover:border-rose-500/40 hover:text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-slate-500 dark:text-on-surface-variant">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-5 py-2 text-sm font-semibold border border-slate-200 dark:border-outline-variant/40 text-slate-500 dark:text-on-surface-variant rounded-lg hover:border-rose-500/40 hover:text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
          </div>

          <div className="xl:hidden px-8 pb-6">
            <BookmarksPanel
              bookmarks={bookmarks}
              bookmarkCount={bookmarkedIds.size}
              onRemove={handleRemoveBookmark}
            />
          </div>

          <div className="text-center text-xs text-black dark:text-neutral-100 py-4">
            © 2026 LEADSHER. BUILT FOR BRILLIANCE.
          </div>
        </div>

        <BookmarksRightRail
          bookmarks={bookmarks}
          bookmarkCount={bookmarkedIds.size}
          onRemove={handleRemoveBookmark}
        />
      </div>

      {uploadModal && (
        <ResourceFormModal mode="create" isMentor={isMentor}
          onClose={() => setUploadModal(false)} onSave={handleCreate} />
      )}
      {editTarget && (
        <ResourceFormModal mode="edit" initial={editTarget} isMentor={isMentor}
          onClose={() => setEditTarget(null)} onSave={handleUpdate} />
      )}
      {rateTarget && (
        <RateModal resource={rateTarget}
          onClose={() => setRateTarget(null)} onSave={submitRating} />
      )}
      {previewResource && (
        <ResourcePreviewModal resource={previewResource} onClose={() => setPreviewResource(null)} />
      )}
    </div>
  );
}
