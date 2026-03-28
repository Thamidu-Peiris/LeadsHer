/**
 * Extract a user-facing error string from an axios error.
 * Backend often sends { message: generic, error: specific } — prefer `error` when present.
 */
export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  const d = err?.response?.data;
  if (d == null || d === '') return err?.message || fallback;
  if (typeof d === 'string') return d || fallback;
  if (typeof d === 'object') {
    const detail = typeof d.error === 'string' ? d.error.trim() : '';
    if (detail) return detail;
    const msg = typeof d.message === 'string' ? d.message.trim() : '';
    if (msg) return msg;
  }
  return fallback;
}
