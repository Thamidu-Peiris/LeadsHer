/**
 * Turn relative API upload paths into absolute URLs for <img src>.
 */
export function absolutePhotoUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const t = url.trim();
  if (!t) return '';
  if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('data:') || t.startsWith('blob:')) {
    return t;
  }
  let origin = '';
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_API_ORIGIN) {
    origin = String(import.meta.env.VITE_PUBLIC_API_ORIGIN).replace(/\/$/, '');
  } else if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL?.startsWith('http')) {
    try {
      origin = new URL(import.meta.env.VITE_API_URL).origin;
    } catch {
      origin = '';
    }
  }
  if (!origin && typeof window !== 'undefined') origin = window.location.origin;
  if (!origin) return t;
  return t.startsWith('/') ? `${origin}${t}` : `${origin}/${t}`;
}
