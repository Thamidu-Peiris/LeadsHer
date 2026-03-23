import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { storyApi } from '../../api/storyApi';
import Spinner from '../common/Spinner';

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
    <section className="py-32 bg-surface">
      <div className="container mx-auto px-8 md:px-12">
        <div className="flex justify-between items-end mb-20">
          <h2 className="font-headline text-6xl text-on-surface italic max-w-xl leading-tight">
            The Pulse of <br /> Modern Authority
          </h2>
          <Link
            to="/stories"
            className="font-label text-xs tracking-widest uppercase text-primary border-b border-primary/20 pb-1 hidden md:block"
          >
            View Editorial
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {stories.slice(0, 3).map((s, i) => (
            <Link to={`/stories/${s._id}`} key={s._id} className="group cursor-pointer">
              {/* Portrait image */}
              <div className="relative aspect-[3/4] overflow-hidden mb-8 bg-surface-container-low">
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

              <span className="font-label text-[10px] tracking-widest uppercase text-tertiary-container mb-4 block">
                {CATEGORY_LABEL[s.category] || s.category}
              </span>
              <h3 className="font-serif-alt text-2xl mb-4 group-hover:text-primary transition-colors leading-snug">
                {s.title}
              </h3>
              {s.excerpt && (
                <p className="font-body text-on-surface-variant text-sm leading-relaxed mb-6 line-clamp-2">
                  {s.excerpt}
                </p>
              )}

              <div className="flex items-center gap-4 border-t border-outline-variant/10 pt-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center font-bold text-white text-sm">
                  {s.author?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="font-label text-[10px] tracking-wider uppercase">{s.author?.name || 'Author'}</p>
                  <p className="text-[10px] text-on-surface-variant">{s.readingTime} min read</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link to="/stories" className="btn-outline">View Editorial</Link>
        </div>
      </div>
    </section>
  );
}
