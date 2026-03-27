import { useState, useEffect } from 'react';

/* ─── URL Detection ──────────────────────────────────────────────────────── */

export function resolvePreview(url) {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return {
    kind: 'iframe',
    src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
    label: 'YouTube',
    icon: 'smart_display',
    color: 'text-red-500',
  };

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return {
    kind: 'iframe',
    src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&title=0&byline=0&portrait=0`,
    label: 'Vimeo',
    icon: 'play_circle',
    color: 'text-sky-500',
  };

  // Google Drive
  const gDriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gDriveMatch) return {
    kind: 'iframe',
    src: `https://drive.google.com/file/d/${gDriveMatch[1]}/preview`,
    label: 'Google Drive',
    icon: 'folder_open',
    color: 'text-yellow-500',
  };

  // Google Docs
  const gDocsMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (gDocsMatch) return {
    kind: 'iframe',
    src: `https://docs.google.com/document/d/${gDocsMatch[1]}/preview`,
    label: 'Google Docs',
    icon: 'description',
    color: 'text-blue-500',
  };

  // Google Slides
  const gSlidesMatch = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (gSlidesMatch) return {
    kind: 'iframe',
    src: `https://docs.google.com/presentation/d/${gSlidesMatch[1]}/preview`,
    label: 'Google Slides',
    icon: 'slideshow',
    color: 'text-orange-500',
  };

  // Google Sheets
  const gSheetsMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (gSheetsMatch) return {
    kind: 'iframe',
    src: `https://docs.google.com/spreadsheets/d/${gSheetsMatch[1]}/preview`,
    label: 'Google Sheets',
    icon: 'table_chart',
    color: 'text-emerald-500',
  };

  // File-extension based detection
  const ext = url.split('?')[0].split('.').pop().toLowerCase();

  if (ext === 'pdf') return {
    kind: 'iframe',
    src: `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`,
    label: 'PDF Document',
    icon: 'picture_as_pdf',
    color: 'text-red-600',
  };

  if (ext === 'doc' || ext === 'docx') return {
    kind: 'iframe',
    src: `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`,
    label: 'Word Document',
    icon: 'description',
    color: 'text-blue-600',
  };

  if (ext === 'ppt' || ext === 'pptx') return {
    kind: 'iframe',
    src: `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`,
    label: 'Presentation',
    icon: 'slideshow',
    color: 'text-orange-500',
  };

  if (ext === 'mp4' || ext === 'webm' || ext === 'ogg') return {
    kind: 'video',
    src: url,
    label: 'Video',
    icon: 'videocam',
    color: 'text-violet-500',
  };

  if (ext === 'mp3' || ext === 'wav' || ext === 'aac' || ext === 'm4a') return {
    kind: 'audio',
    src: url,
    label: 'Audio',
    icon: 'headphones',
    color: 'text-amber-500',
  };

  if (ext === 'zip' || ext === 'rar' || ext === '7z') return {
    kind: 'download',
    src: url,
    label: 'Archive',
    icon: 'folder_zip',
    color: 'text-slate-500',
  };

  // Generic link — attempt iframe
  return {
    kind: 'iframe',
    src: url,
    label: 'Web Page',
    icon: 'language',
    color: 'text-slate-400',
  };
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmt     = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0));
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }); } catch { return ''; } };
const fmtCat  = (c) => (c || '').split('-').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ');

const DIFF_BADGE = {
  beginner:     { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Beginner' },
  intermediate: { color: 'bg-amber-100 text-amber-700 border-amber-200',       label: 'Intermediate' },
  advanced:     { color: 'bg-red-100 text-red-700 border-red-200',             label: 'Advanced' },
};

function StarRating({ rating = 0, count = 0 }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`material-symbols-outlined text-[16px] ${
              star <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'
            }`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
        ))}
      </div>
      <span className="text-sm font-semibold text-on-surface">{rating > 0 ? rating.toFixed(1) : '—'}</span>
      {count > 0 && <span className="text-xs text-slate-400">({fmt(count)} ratings)</span>}
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */

export default function ResourcePreviewModal({ resource, onClose }) {
  const [iframeError, setIframeError]   = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  const rawUrl  = resource?.file?.url || resource?.externalLink;
  const preview = resolvePreview(rawUrl);

  // Trap Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!resource) return null;

  const openExternal = () => window.open(rawUrl, '_blank', 'noopener,noreferrer');

  const diffCfg = DIFF_BADGE[resource.difficulty] || DIFF_BADGE.beginner;
  const uploaderName = resource.uploadedBy?.name || 'LeadsHer';
  const uploaderAvatar = resource.uploadedBy?.avatar;
  const ratingCount = resource.ratingCount ?? resource.ratings?.length ?? 0;
  const avgRating   = resource.averageRating ?? 0;

  /* ── Content renderer ── */
  const renderContent = () => {
    if (!preview || !rawUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
          <span className="material-symbols-outlined text-[64px] text-slate-200">link_off</span>
          <p className="text-slate-500 text-sm">No preview available for this resource.</p>
          {rawUrl && (
            <button onClick={openExternal} className="px-5 py-2.5 bg-gold-accent text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              Open Resource
            </button>
          )}
        </div>
      );
    }

    if (preview.kind === 'download') {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center">
            <span className={`material-symbols-outlined text-[40px] ${preview.color}`}>{preview.icon}</span>
          </div>
          <p className="text-on-surface font-semibold">{resource.title}</p>
          <p className="text-slate-400 text-sm">This file cannot be previewed in-browser. Click below to download.</p>
          <a
            href={rawUrl}
            download={resource.title || 'download'}
            onClick={onClose}
            className="px-6 py-3 bg-gold-accent text-white font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Download File
          </a>
        </div>
      );
    }

    if (preview.kind === 'video') {
      return (
        <div className="w-full bg-black rounded-xl overflow-hidden">
          <video
            controls
            autoPlay
            src={preview.src}
            className="w-full max-h-[420px]"
            onError={() => setIframeError(true)}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (preview.kind === 'audio') {
      return (
        <div className="flex flex-col items-center justify-center gap-6 py-10 px-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl">
            <span className="material-symbols-outlined text-white text-[48px]">headphones</span>
          </div>
          <p className="font-serif-alt text-lg font-bold text-on-surface text-center line-clamp-2">{resource.title}</p>
          <p className="text-slate-400 text-sm">{resource.author || uploaderName}</p>
          <audio controls autoPlay src={preview.src} className="w-full max-w-lg mt-2">
            Your browser does not support audio playback.
          </audio>
        </div>
      );
    }

    // iframe
    if (iframeError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
          <span className="material-symbols-outlined text-[64px] text-slate-200">block</span>
          <p className="text-slate-500 text-sm text-center max-w-xs">
            This page cannot be embedded. Open it in a new tab to view.
          </p>
          <button onClick={openExternal} className="px-5 py-2.5 bg-gold-accent text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            Open in New Tab
          </button>
        </div>
      );
    }

    return (
      <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
        {iframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 rounded-xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gold-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading preview…</p>
            </div>
          </div>
        )}
        <iframe
          src={preview.src}
          title={resource.title}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          style={{ border: 'none' }}
          onLoad={() => setIframeLoading(false)}
          onError={() => { setIframeLoading(false); setIframeError(true); }}
        />
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — two-column layout */}
      <div className="relative w-full max-w-5xl bg-white dark:bg-surface-container-lowest rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-100 dark:border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {preview && (
              <span className={`material-symbols-outlined text-[22px] flex-shrink-0 ${preview.color}`}
                style={{ fontVariationSettings: "'FILL' 1" }}>
                {preview.icon}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="font-serif-alt text-base font-bold text-on-surface leading-tight line-clamp-1">
                {resource.title}
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">
                {preview?.label || 'Resource'} · {resource.type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {rawUrl && (
              <button
                onClick={openExternal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 border border-slate-200 hover:border-gold-accent/50 hover:text-gold-accent rounded-lg transition-all"
                title="Open in new tab"
              >
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                New Tab
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-on-surface hover:bg-slate-100 dark:hover:bg-surface-container-low rounded-lg transition-all"
              title="Close (Esc)"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* ── Body: left content + right sidebar ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left — preview + description */}
          <div className="flex-1 flex flex-col overflow-y-auto p-5 gap-4 min-w-0">
            {/* Preview area */}
            <div className="w-full">
              {renderContent()}
            </div>

            {/* Description */}
            {resource.description && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {resource.description}
                </p>
              </div>
            )}
          </div>

          {/* Right — resource details sidebar */}
          <aside className="w-64 flex-shrink-0 border-l border-slate-100 dark:border-outline-variant/20 overflow-y-auto flex flex-col gap-0">

            {/* Uploader card */}
            <div className="p-4 border-b border-slate-100 dark:border-outline-variant/20">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Uploaded By</p>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                  {uploaderAvatar
                    ? <img src={uploaderAvatar} alt={uploaderName} className="w-full h-full object-cover" />
                    : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold-accent/30 to-gold-accent/10">
                        <span className="text-gold-accent font-bold text-sm">{uploaderName[0]?.toUpperCase()}</span>
                      </div>
                    )
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface leading-tight truncate">{uploaderName}</p>
                  {resource.publishedDate && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{fmtDate(resource.publishedDate)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 border-b border-slate-100 dark:border-outline-variant/20">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Stats</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-surface-container-low rounded-lg p-2.5 text-center">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 block mb-0.5">visibility</span>
                  <p className="text-sm font-bold text-on-surface">{fmt(resource.views)}</p>
                  <p className="text-[10px] text-slate-400">Views</p>
                </div>
                <div className="bg-slate-50 dark:bg-surface-container-low rounded-lg p-2.5 text-center">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 block mb-0.5">download</span>
                  <p className="text-sm font-bold text-on-surface">{fmt(resource.downloads)}</p>
                  <p className="text-[10px] text-slate-400">Downloads</p>
                </div>
                <div className="bg-slate-50 dark:bg-surface-container-low rounded-lg p-2.5 text-center">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 block mb-0.5">bookmark</span>
                  <p className="text-sm font-bold text-on-surface">{fmt(resource.bookmarkCount)}</p>
                  <p className="text-[10px] text-slate-400">Bookmarks</p>
                </div>
                <div className="bg-slate-50 dark:bg-surface-container-low rounded-lg p-2.5 text-center">
                  <span className="material-symbols-outlined text-[18px] text-amber-400 block mb-0.5"
                    style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <p className="text-sm font-bold text-on-surface">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</p>
                  <p className="text-[10px] text-slate-400">Rating</p>
                </div>
              </div>
            </div>

            {/* Rating breakdown */}
            <div className="p-4 border-b border-slate-100 dark:border-outline-variant/20">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rating</p>
              <StarRating rating={avgRating} count={ratingCount} />
            </div>

            {/* Details */}
            <div className="p-4 border-b border-slate-100 dark:border-outline-variant/20 flex flex-col gap-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details</p>

              {/* Category */}
              {resource.category && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">category</span>
                  <span className="text-xs text-on-surface">{fmtCat(resource.category)}</span>
                </div>
              )}

              {/* Difficulty */}
              {resource.difficulty && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">signal_cellular_alt</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${diffCfg.color}`}>
                    {diffCfg.label}
                  </span>
                </div>
              )}

              {/* Duration */}
              {resource.duration > 0 && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                  <span className="text-xs text-on-surface">{resource.duration} min</span>
                </div>
              )}

              {/* Author */}
              {resource.author && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                  <span className="text-xs text-on-surface truncate">{resource.author}</span>
                </div>
              )}

              {/* Premium */}
              {resource.isPremium && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-amber-500"
                    style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  <span className="text-xs font-bold text-amber-600">Premium Resource</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {resource.tags?.length > 0 && (
              <div className="p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {resource.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-surface-container-low text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-outline-variant/30">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </aside>
        </div>

        {/* ── Footer: open in new tab CTA ── */}
        {rawUrl && (
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 dark:border-outline-variant/20 bg-slate-50/60 dark:bg-surface-container-lowest flex-shrink-0">
            <p className="text-xs text-slate-400 truncate">
              {rawUrl.length > 60 ? rawUrl.slice(0, 57) + '…' : rawUrl}
            </p>
            <button
              onClick={openExternal}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-gold-accent text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
              Open in New Tab
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
