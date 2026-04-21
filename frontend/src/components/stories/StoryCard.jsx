import { Link } from 'react-router-dom';
import { userDisplayPhoto } from '../../utils/absolutePhotoUrl';

const CATEGORY_LABEL = {
  leadership:       'Leadership',
  entrepreneurship: 'Entrepreneurship',
  STEM:             'Future Tech',
  corporate:        'Corporate',
  'social-impact':  'Social Impact',
  'career-growth':  'Career Growth',
};

const BG = [
  'from-primary/20 to-secondary/10',
  'from-tertiary/20 to-primary/10',
  'from-secondary/20 to-tertiary/10',
];

export default function StoryCard({ story, idx = 0 }) {
  const { _id, title, excerpt, category, author, readingTime, likeCount, coverImage } = story;
  const authorAvatarSrc = userDisplayPhoto(author || { name: 'Unknown' }, { size: 72 });

  return (
    <Link to={`/stories/${_id}`} className="group cursor-pointer block">
      {/* Portrait image */}
      <div className="relative aspect-[3/4] overflow-hidden mb-6 bg-surface-container-low">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${BG[idx % BG.length]} flex items-center justify-center transition-transform duration-700 group-hover:scale-105`}>
            <span className="font-headline text-7xl text-white/30 italic">{title?.[0] || 'S'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-secondary-container/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <span className="font-label text-[10px] tracking-widest uppercase text-tertiary-container mb-3 block">
        {CATEGORY_LABEL[category] || category}
      </span>
      <h3 className="font-serif-alt text-xl mb-3 group-hover:text-primary transition-colors leading-snug line-clamp-2">
        {title}
      </h3>
      {excerpt && (
        <p className="font-body text-on-surface-variant text-sm leading-relaxed mb-5 line-clamp-2">{excerpt}</p>
      )}

      <div className="flex items-center gap-3 border-t border-outline-variant/10 pt-5">
        <img
          src={authorAvatarSrc}
          alt={author?.name || 'Author'}
          className="w-9 h-9 rounded-full object-cover border border-outline-variant/20"
        />
        <div className="flex-1">
          <p className="font-label text-[10px] tracking-wider uppercase">{author?.name || 'Unknown'}</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-on-surface-variant font-label tracking-wider">
          <span>{readingTime} min</span>
          <span className="flex items-center gap-0.5">
            <span className="material-symbols-outlined text-xs text-tertiary" style={{ fontVariationSettings: "'FILL' 1, 'wght' 300" }}>favorite</span>
            {likeCount || 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
