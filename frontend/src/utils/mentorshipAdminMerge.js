/** Normalize Mongo / API ids for Map keys */
export function normId(v) {
  if (v == null) return '';
  if (typeof v === 'object' && v !== null && '$oid' in v) return String(v.$oid);
  return String(v);
}

export function buildAuthIndexes(users = []) {
  const byId = new Map();
  const byEmail = new Map();
  users.forEach((u) => {
    const id = u?.id ?? u?._id;
    if (id) byId.set(normId(id), u);
    if (u?.email) byEmail.set(String(u.email).trim().toLowerCase(), u);
  });
  return { byId, byEmail };
}

function applyPhotoMerge(ref, a) {
  if (!a) return { ...ref };
  const fromA = (a.profilePicture || a.avatar || '').trim();
  const fromR = (ref.profilePicture || ref.avatar || '').trim();
  return {
    ...ref,
    name: ref.name || a.name,
    email: ref.email || a.email,
    profilePicture: fromR || fromA || '',
    avatar: ref.avatar || a.avatar || '',
  };
}

/**
 * Merge auth user (photo + name) onto a mentorship populated ref or raw id string.
 */
export function mergeAuthUser(ref, indexes) {
  if (ref == null) return ref;
  const { byId, byEmail } = indexes;

  if (typeof ref === 'string') {
    const id = normId(ref);
    const a = byId.get(id);
    if (!a) return { _id: ref, id: ref };
    return {
      _id: ref,
      id: ref,
      name: a.name,
      email: a.email,
      profilePicture: (a.profilePicture || a.avatar || '').trim(),
      avatar: (a.avatar || '').trim(),
    };
  }

  const id = normId(ref._id ?? ref.id);
  const em = (ref.email || '').trim().toLowerCase();
  const a = (id && byId.get(id)) || (em && byEmail.get(em));
  return applyPhotoMerge({ ...ref }, a);
}

export function enrichRequest(r, indexes) {
  return {
    ...r,
    mentor: mergeAuthUser(r.mentor, indexes),
    mentee: mergeAuthUser(r.mentee, indexes),
  };
}

export function enrichMentorship(m, indexes) {
  return {
    ...m,
    mentor: mergeAuthUser(m.mentor, indexes),
    mentee: mergeAuthUser(m.mentee, indexes),
  };
}

export function enrichFeedbackRow(f, indexes) {
  return {
    ...f,
    mentor: mergeAuthUser(f.mentor, indexes),
    mentee: mergeAuthUser(f.mentee, indexes),
  };
}
