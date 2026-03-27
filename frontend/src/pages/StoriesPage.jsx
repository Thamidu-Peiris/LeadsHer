import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { storyApi } from '../api/storyApi';
import Pagination from '../components/common/Pagination';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['all', 'leadership', 'entrepreneurship', 'STEM', 'corporate', 'social-impact', 'career-growth'];
const CATEGORY_LABELS = {
  all: 'All',
  leadership: 'Leadership',
  entrepreneurship: 'Entrepreneurship',
  STEM: 'STEM',
  corporate: 'Corporate',
  'social-impact': 'Social Impact',
  'career-growth': 'Career Growth',
};
const SORTS = [
  { value: '-createdAt', label: 'Newest' },
  { value: '-views', label: 'Most viewed' },
  { value: '-likes', label: 'Most liked' },
];
const CARD_BG = [
  'from-primary/20 to-secondary/15',
  'from-tertiary/20 to-primary/15',
  'from-secondary/20 to-tertiary/15',
];

function stripHtmlToText(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function splitIntoChunks(text, maxLen = 130) {
  const cleaned = String(text || '').trim();
  if (!cleaned) return [];
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  const out = [];
  let cur = '';
  sentences.forEach((s) => {
    if ((cur + ' ' + s).trim().length <= maxLen) {
      cur = `${cur} ${s}`.trim();
    } else {
      if (cur) out.push(cur);
      cur = s;
    }
  });
  if (cur) out.push(cur);
  if (!out.length) out.push(cleaned.slice(0, maxLen));
  return out.slice(0, 5);
}

export default function StoriesPage() {
  const { isAuthenticated, user } = useAuth();
  const newStoryHref = user?.role === 'mentor' ? '/dashboard/stories/new' : '/stories/new';
  const [stories, setStories]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]     = useState(true);
  const [filters, setFilters]     = useState({ category: 'all', search: '', sort: '-createdAt', page: 1 });
  const [player, setPlayer] = useState({ open: false, index: 0, reveal: 1, motionKey: 0 });

  const fetchStories = useCallback((f) => {
    setLoading(true);
    const params = { page: f.page, limit: 9, sort: f.sort };
    if (f.category !== 'all') params.category = f.category;
    if (f.search) params.search = f.search;

    storyApi.getAll(params)
      .then((res) => {
        const data = res.data;
        setStories(data.stories || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStories(filters); }, [filters]);

  const setFilter = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value, page: key !== 'page' ? 1 : value }));

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStories(filters);
  };

  const webSlides = useMemo(
    () =>
      stories.map((s) => {
        const base = stripHtmlToText(s.excerpt || s.content);
        const chunks = splitIntoChunks(base, 130);
        return {
          _id: s._id,
          title: s.title || 'Untitled Story',
          author: s.author?.name || 'Mentor',
          coverImage: s.coverImage || '',
          chunks: chunks.length ? chunks : ['Tap to read this story.'],
          views: s.views || s.viewCount || 0,
          likes: s.likeCount || 0,
        };
      }),
    [stories]
  );

  const currentSlide = player.open ? webSlides[player.index] : null;

  const openPlayer = (idx) => {
    if (!webSlides.length) return;
    setPlayer({ open: true, index: idx, reveal: 1, motionKey: Date.now() });
  };

  const closePlayer = () => setPlayer((p) => ({ ...p, open: false }));

  const nextSlide = () => {
    setPlayer((p) => {
      const nextIndex = (p.index + 1) % webSlides.length;
      return { ...p, index: nextIndex, reveal: 1, motionKey: Date.now() };
    });
  };

  const prevSlide = () => {
    setPlayer((p) => {
      const nextIndex = p.index === 0 ? webSlides.length - 1 : p.index - 1;
      return { ...p, index: nextIndex, reveal: 1, motionKey: Date.now() };
    });
  };

  const revealMore = () => {
    if (!currentSlide) return;
    setPlayer((p) => {
      if (p.reveal < currentSlide.chunks.length) {
        return { ...p, reveal: p.reveal + 1, motionKey: Date.now() };
      }
      const nextIndex = (p.index + 1) % webSlides.length;
      return { ...p, index: nextIndex, reveal: 1, motionKey: Date.now() };
    });
  };

  useEffect(() => {
    if (!player.open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closePlayer();
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === ' ') {
        e.preventDefault();
        revealMore();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [player.open, currentSlide]);

  return (
    <div className="pt-20 pb-12 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="relative mt-3 overflow-hidden rounded-2xl border border-outline-variant/20 bg-gradient-to-br from-primary/[0.08] via-surface-container-low to-tertiary/[0.08] dark:from-primary/20 dark:via-surface-container-lowest dark:to-tertiary/15 shadow-sm p-4 sm:p-5 mb-8">
          <div className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-gold-accent/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-14 -left-10 w-44 h-44 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
          <div className="relative">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1">
              <span className="material-symbols-outlined text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                type="text"
                placeholder="Search by title, excerpt, or topic..."
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                className="w-full bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-gold-accent/25 focus:border-gold-accent/40 transition-all"
              />
            </div>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-on-surface text-inverse-on-surface text-xs font-bold uppercase tracking-[0.14em] hover:opacity-90 transition-opacity">
              Search
            </button>
            {isAuthenticated && (
              <Link to={newStoryHref} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-primary/25 bg-primary text-white text-xs font-bold uppercase tracking-[0.14em] shadow-sm shadow-primary/10 hover:bg-primary/90 transition-colors">
                <span className="material-symbols-outlined text-[16px]">edit_square</span>
                Share
              </Link>
            )}
            <select
              value={filters.sort}
              onChange={(e) => setFilter('sort', e.target.value)}
              className="w-full lg:w-auto bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/20 rounded-xl py-2.5 px-3 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-gold-accent/25 focus:border-gold-accent/40 transition-all"
            >
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilter('category', c)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.12em] border transition-colors ${
                  filters.category === c
                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                    : 'bg-surface-container-lowest dark:bg-surface-container border-outline-variant/25 text-outline hover:border-outline-variant/45 hover:text-on-surface'
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : stories.length === 0 ? (
          <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-12 text-center">
            <p className="text-on-surface-variant text-lg mb-5">No stories found.</p>
            {isAuthenticated && (
              <Link to={newStoryHref} className="btn-primary">Be the first to share</Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {stories.map((s, idx) => {
                const preview = stripHtmlToText(s.excerpt || s.content).slice(0, 160);
                return (
                  <article key={s._id} className="group bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative aspect-[4/5] overflow-hidden bg-surface-container-low">
                      {s.coverImage ? (
                        <img src={s.coverImage} alt={s.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${CARD_BG[idx % CARD_BG.length]} flex items-center justify-center`}>
                          <span className="font-serif-alt text-6xl text-white/35 italic">{s.title?.[0] || 'S'}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-white/90 text-[10px] font-bold uppercase tracking-widest text-on-surface">
                          {CATEGORY_LABELS[s.category] || s.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => openPlayer(idx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/65 text-white text-[10px] font-semibold uppercase tracking-wider hover:bg-black/80 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                          Play
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif-alt text-2xl text-on-surface leading-tight line-clamp-2">{s.title}</h3>
                      <p className="mt-2 text-sm text-on-surface-variant line-clamp-2">{preview}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-[11px] text-outline">{s.author?.name || 'Mentor'}</div>
                        <div className="text-[11px] text-outline">{s.readingTime || 1} min</div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <Link to={`/stories/${s._id}`} className="flex-1 inline-flex items-center justify-center px-3 min-h-10 rounded-lg border border-black/55 bg-white text-black text-xs font-semibold hover:bg-black/5 transition-colors">
                          Read
                        </Link>
                        <button
                          type="button"
                          onClick={() => openPlayer(idx)}
                          className="inline-flex items-center justify-center w-10 min-h-10 rounded-lg border border-black/60 bg-white text-black hover:bg-black/5 transition-colors"
                          aria-label="Play story"
                          title="Play story"
                        >
                          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="mt-8">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => setFilter('page', p)}
              />
            </div>
          </>
        )}
      </div>

      {player.open && currentSlide && (
        <div className="fixed inset-0 z-[90] bg-black text-white">
          <div className="absolute inset-0">
            {currentSlide.coverImage ? (
              <img src={currentSlide.coverImage} alt={currentSlide.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary via-secondary to-tertiary" />
            )}
            <div className="absolute inset-0 bg-black/55" />
          </div>

          <button type="button" onClick={closePlayer} className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center">
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="relative z-10 h-full max-w-2xl mx-auto px-5 py-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              {webSlides.map((s, i) => (
                <div key={s._id} className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
                  <div className="h-full bg-white transition-all duration-500" style={{ width: i < player.index ? '100%' : i === player.index ? `${Math.min(100, (player.reveal / s.chunks.length) * 100)}%` : '0%' }} />
                </div>
              ))}
            </div>

            <div className="mt-auto">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/80">Web Story</p>
              <h2 className="mt-2 font-serif-alt text-4xl sm:text-5xl leading-tight">{currentSlide.title}</h2>
              <p className="mt-2 text-sm text-white/80">{currentSlide.author} · {currentSlide.views} views · {currentSlide.likes} likes</p>

              <div
                key={player.motionKey}
                onClick={revealMore}
                className="mt-5 rounded-xl border border-white/20 bg-black/35 backdrop-blur-sm p-4 cursor-pointer select-none"
                style={{ animation: 'storySlideInRight 500ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
              >
                <div className="space-y-2 text-base leading-relaxed">
                  {currentSlide.chunks.slice(0, player.reveal).map((chunk, i) => (
                    <p
                      key={`${currentSlide._id}-chunk-${i}`}
                      className="text-white/95"
                      style={{
                        animation: 'storySlideInRight 380ms cubic-bezier(0.22, 1, 0.36, 1) both',
                        animationDelay: `${i * 70}ms`,
                      }}
                    >
                      {chunk}
                    </p>
                  ))}
                </div>
                <p className="mt-3 text-xs uppercase tracking-widest text-white/65">
                  Tap to {player.reveal < currentSlide.chunks.length ? 'reveal more' : 'next story'}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button type="button" onClick={prevSlide} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-sm">
                <span className="material-symbols-outlined text-[18px]">arrow_back_ios_new</span>
                Prev
              </button>
              <button type="button" onClick={nextSlide} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-sm">
                Next
                <span className="material-symbols-outlined text-[18px]">arrow_forward_ios</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
