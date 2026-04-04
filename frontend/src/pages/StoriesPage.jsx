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
  const [stories, setStories]     = useState([]);
  const [featuredStories, setFeaturedStories] = useState([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
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

  useEffect(() => {
    storyApi.getFeatured()
      .then((res) => setFeaturedStories(res.data?.stories || []))
      .catch(() => setFeaturedStories([]));
  }, []);

  useEffect(() => {
    if (featuredStories.length <= 1) return undefined;
    const timer = setInterval(() => {
      setFeaturedIndex((i) => (i + 1) % featuredStories.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [featuredStories]);

  useEffect(() => {
    if (!featuredStories.length) {
      setFeaturedIndex(0);
      return;
    }
    setFeaturedIndex((i) => (i >= featuredStories.length ? 0 : i));
  }, [featuredStories.length]);

  const activeFeatured = featuredStories[featuredIndex] || featuredStories[0];
  const sideFeatured = featuredStories.length <= 1
    ? []
    : Array.from(
      { length: Math.min(5, Math.max(0, featuredStories.length - 1)) },
      (_, idx) => featuredStories[(featuredIndex + idx + 1) % featuredStories.length]
    );

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
            {isAuthenticated && (user?.role === 'mentor' || user?.role === 'admin') && (
              <Link to="/dashboard/stories/new" className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-primary/25 bg-primary text-white text-xs font-bold uppercase tracking-[0.14em] shadow-sm shadow-primary/10 hover:bg-primary/90 transition-colors">
                <span className="material-symbols-outlined text-[16px]">edit_square</span>
                New
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

        {featuredStories.length > 0 && activeFeatured && (
          <section className="mb-10">
            <div className="relative overflow-hidden rounded-3xl border border-outline-variant/20 bg-gradient-to-br from-primary/[0.11] via-surface-container-low to-tertiary/[0.10] p-4 sm:p-5 lg:p-6 shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
              <div className="absolute -top-16 -left-10 w-44 h-44 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -right-8 w-52 h-52 rounded-full bg-tertiary/20 blur-3xl pointer-events-none" />
              <div className="relative flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-primary/90">Curated highlights</p>
                  <h2 className="font-serif-alt text-2xl sm:text-3xl font-bold text-on-surface mt-1">Featured Stories</h2>
                </div>
                <span className="hidden sm:inline-flex px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-[10px] uppercase tracking-[0.18em] font-bold">
                  Editor picks
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 lg:items-stretch gap-4 lg:gap-5">
                <article
                  className="lg:col-span-8 group flex flex-col h-full min-h-0 rounded-2xl overflow-hidden border border-white/35 bg-white/90 dark:bg-surface-container-lowest/95 backdrop-blur-sm shadow-[0_10px_24px_rgba(15,23,42,0.09)] lg:min-h-[min(640px,78vh)]"
                  key={activeFeatured._id}
                  style={{ animation: 'storySlideInRight 520ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
                >
                  <div className="relative flex-1 min-h-[280px] sm:min-h-[320px] lg:min-h-[min(480px,62vh)] bg-surface-container-low">
                    {activeFeatured.coverImage ? (
                      <img src={activeFeatured.coverImage} alt={activeFeatured.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-tertiary/25" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5">
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-white/90 text-[10px] font-bold uppercase tracking-widest text-on-surface">
                        Featured
                      </span>
                      <h3 className="mt-2 font-serif-alt text-2xl sm:text-3xl text-white leading-tight line-clamp-3">{activeFeatured.title}</h3>
                      <p className="mt-1 text-sm text-white/85 line-clamp-1">{activeFeatured.author?.name || 'Mentor'}</p>
                    </div>
                  </div>
                  <div className="shrink-0 p-4 sm:p-5 border-t border-outline-variant/10 bg-white/95 dark:bg-surface-container-lowest/90">
                    <p className="text-sm text-on-surface-variant line-clamp-3">
                      {stripHtmlToText(activeFeatured.excerpt || activeFeatured.content).slice(0, 200)}
                    </p>
                    <Link to={`/stories/${activeFeatured._id}`} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors">
                      Read featured
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </div>
                </article>

                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline mb-2 shrink-0 hidden lg:block">
                    More featured
                  </p>
                  <div className="flex flex-1 flex-col gap-2 min-h-0">
                    {sideFeatured.map((s, idx) => (
                      <Link
                        key={s._id}
                        to={`/stories/${s._id}`}
                        className="group flex lg:flex-1 lg:min-h-0 items-center gap-3 rounded-xl border border-white/35 bg-white/90 dark:bg-surface-container-lowest/95 backdrop-blur-sm px-3 py-2 sm:px-3.5 sm:py-2.5 hover:border-primary/35 transition-all hover:translate-x-0.5 overflow-hidden"
                        style={{ animation: `storySlideInRight ${420 + idx * 70}ms cubic-bezier(0.22, 1, 0.36, 1) both` }}
                      >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-surface-container-low shrink-0 self-center">
                          {s.coverImage ? (
                            <img src={s.coverImage} alt={s.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${CARD_BG[idx % CARD_BG.length]}`} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 self-center">
                          <p className="text-[9px] uppercase tracking-widest text-primary font-bold">Featured</p>
                          <p className="font-semibold text-xs sm:text-sm text-on-surface line-clamp-2 leading-snug">{s.title}</p>
                          <p className="text-[11px] text-outline line-clamp-1 mt-0.5">{s.author?.name || 'Mentor'}</p>
                        </div>
                        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors shrink-0 self-center text-[18px]">arrow_forward</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : stories.length === 0 ? (
          <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-12 text-center">
            <p className="text-on-surface-variant text-lg mb-5">No stories found.</p>
            {isAuthenticated && (user?.role === 'mentor' || user?.role === 'admin') && (
              <Link to="/dashboard/stories/new" className="btn-primary">Create a story</Link>
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
