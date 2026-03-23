import { Link } from 'react-router-dom';

const categoryColors = {
  leadership:      'bg-purple-100 text-purple-700',
  entrepreneurship:'bg-yellow-100 text-yellow-700',
  STEM:            'bg-blue-100 text-blue-700',
  corporate:       'bg-gray-100 text-gray-700',
  'social-impact': 'bg-green-100 text-green-700',
  'career-growth': 'bg-orange-100 text-orange-700',
};

export default function StoryCard({ story }) {
  const { _id, title, excerpt, category, author, readingTime, likeCount, publishedAt, coverImage } = story;

  return (
    <Link to={`/stories/${_id}`} className="card group flex flex-col hover:shadow-md transition-shadow">
      {/* Cover image */}
      <div className="relative h-44 bg-gradient-to-br from-brand-100 to-brand-200 overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            <svg className="w-12 h-12 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        <span className={`absolute top-3 left-3 badge ${categoryColors[category] || 'bg-gray-100 text-gray-600'}`}>
          {category}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-gray-900 text-lg leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
          {title}
        </h3>
        {excerpt && (
          <p className="text-gray-500 text-sm mt-2 line-clamp-2 flex-1">{excerpt}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
              {author?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="text-xs text-gray-500">{author?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{readingTime} min read</span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              {likeCount || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
