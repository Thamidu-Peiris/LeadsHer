import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { storyApi } from '../../api/storyApi';
import Spinner from '../common/Spinner';
import { absolutePhotoUrl } from '../../utils/absolutePhotoUrl';

const CATEGORY_LABEL = {
  leadership:       'Leadership Philosophy',
  entrepreneurship: 'Entrepreneurship',
  STEM:             'Future Tech',
  corporate:        'Corporate Life',
  'social-impact':  'Social Impact',
  'career-growth':  'Career Growth',
};

const BG_GRADIENTS = [
  'from-primary/20 via-secondary/10 to-tertiary/20',
  'from-tertiary/20 via-primary/10 to-secondary/20',
  'from-secondary/20 via-tertiary/10 to-primary/20',
];

export default function FeaturedStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storyApi.getFeatured()
      .then((res) => setStories(res.data?.stories || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="py-32 bg-surface flex justify-center items-center min-h-[300px]">
      <Spinner />
    </section>
  );
  if (!stories.length) return null;

  return (
    <section className="py-24 bg-[#FFE6F5]">
      <div className="container mx-auto px-8 md:px-12">
        <div className="mb-12 rounded-2xl border border-outline-variant/20 bg-white px-6 py-7 shadow-sm sm:px-8">
          <div className="flex justify-between items-end gap-4">
            <h2 className="font-headline text-4xl text-on-surface italic max-w-xl leading-tight sm:text-5xl md:text-6xl">
            The Pulse of <br /> Modern Authority
            </h2>
            <Link
              to="/stories"
              className="hidden md:inline-flex items-center gap-1 rounded-lg border-2 border-[#f43f5e]/60 bg-white px-4 py-2 font-label text-[10px] font-bold tracking-widest uppercase text-[#f43f5e] transition-colors hover:border-[#f43f5e] hover:bg-rose-50"
            >
              View Editorial
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {stories.slice(0, 3).map((s, i) => (
            <Link
              to={`/stories/${s._id}`}
              key={s._id}
              className="group cursor-pointer rounded-xl border border-outline-variant/20 bg-white p-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#f43f5e]/35 hover:shadow-md"
            >
              {(() => {
                const authorRaw = String(s?.author?.profilePicture || s?.author?.avatar || '').trim();
                const authorAvatar = authorRaw ? absolutePhotoUrl(authorRaw) : '';
                const authorInitial = s.author?.name?.[0]?.toUpperCase() || 'A';
                return (
                  <>
              {/* Portrait image */}
              <div className="relative mb-3.5 aspect-[1/1.25] overflow-hidden rounded-lg bg-surface-container-low">
                {s.coverImage ? (
                  <img
                    src={s.coverImage}
                    alt={s.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${BG_GRADIENTS[i % BG_GRADIENTS.length]} transition-transform duration-700 group-hover:scale-105 flex items-center justify-center`}>
                    <span className="font-headline text-6xl text-white/30 italic">
                      {s.title?.[0] || 'S'}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-secondary-container/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <span className="mb-2 block font-label text-[8px] tracking-widest uppercase text-[#f43f5e]">
                {CATEGORY_LABEL[s.category] || s.category}
              </span>
              <h3 className="mb-1.5 font-serif-alt text-[1.1rem] leading-snug text-on-surface transition-colors group-hover:text-[#f43f5e]">
                {s.title}
              </h3>
              {s.excerpt && (
                <p className="mb-2.5 line-clamp-2 font-body text-[12px] leading-relaxed text-on-surface-variant">
                  {s.excerpt}
                </p>
              )}

              <div className="flex items-center gap-2 border-t border-outline-variant/10 pt-2.5">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/40 to-secondary/30 font-bold text-[11px] text-white">
                  {authorAvatar ? (
                    <img
                      src={authorAvatar}
                      alt={s.author?.name || 'Author'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const fallbackName = encodeURIComponent(s.author?.name || 'Author');
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${fallbackName}&background=f43f5e&color=fff&bold=true`;
                      }}
                    />
                  ) : (
                    authorInitial
                  )}
                </div>
                <div>
                  <p className="font-label text-[9px] tracking-wider uppercase">{s.author?.name || 'Author'}</p>
                  <p className="text-[9px] text-on-surface-variant">{s.readingTime} min read</p>
                </div>
              </div>
                  </>
                );
              })()}
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            to="/stories"
            className="inline-flex items-center gap-1 rounded-lg border-2 border-[#f43f5e]/60 bg-white px-4 py-2 font-label text-[10px] font-bold tracking-widest uppercase text-[#f43f5e] transition-colors hover:border-[#f43f5e] hover:bg-rose-50"
          >
            View Editorial
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
