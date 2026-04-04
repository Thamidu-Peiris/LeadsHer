import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { storyApi } from '../api/storyApi';
import Pagination from '../components/common/Pagination';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import { MAX_FEATURED_STORIES } from '../constants/featuredStories';

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

/** Carousel: hero slides out (down / toward sidebar), then new hero + column slide in from above */
const FEATURED_SWAP_OUT_MS = 480;
const FEATURED_SWAP_IN_MS = 520;

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
  /** Rotates which story is in the large featured card (4s interval when 2+ stories). */
  const [featuredSlideIndex, setFeaturedSlideIndex] = useState(0);
  /** Displayed hero + sidebar index; updates mid-transition after exit animation. */
  const [featuredDisplayIndex, setFeaturedDisplayIndex] = useState(0);
  /** idle → exiting (hero down/side down) → swap index → entering (new hero/side from top) → idle */
  const [featuredSwapPhase, setFeaturedSwapPhase] = useState('idle');
  const featuredFirstSyncRef = useRef(true);
  const featuredDisplayRef = useRef(0);
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
    storyApi
      .getFeatured()
      .then((res) => {
        const raw = res.data?.stories ?? res.data;
        const list = Array.isArray(raw) ? raw.slice(0, MAX_FEATURED_STORIES) : [];
        setFeaturedStories(list);
      })
      .catch(() => setFeaturedStories([]));
  }, []);

  useEffect(() => {
    if (!featuredStories.length) {
      setFeaturedSlideIndex(0);
      return;
    }
    setFeaturedSlideIndex((i) => (i >= featuredStories.length ? 0 : i));
  }, [featuredStories.length]);

  useEffect(() => {
    if (featuredStories.length <= 1) return undefined;
    const id = window.setInterval(() => {
      setFeaturedSlideIndex((idx) => (idx + 1) % featuredStories.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [featuredStories]);

  useEffect(() => {
    featuredDisplayRef.current = featuredDisplayIndex;
  }, [featuredDisplayIndex]);

  /** When the list shrinks, keep display index in range without a flash. */
  useEffect(() => {
    if (!featuredStories.length) return;
    const max = featuredStories.length - 1;
    if (featuredDisplayRef.current > max) {
      const next = Math.min(featuredSlideIndex, max);
      setFeaturedDisplayIndex(next);
      featuredDisplayRef.current = next;
      setFeaturedSwapPhase('idle');
    }
  }, [featuredStories.length, featuredSlideIndex]);

  /** Directional swap: animate out → change story index → animate in (no blank white frame). */
  useEffect(() => {
    if (!featuredStories.length) {
      featuredFirstSyncRef.current = true;
      return;
    }
    if (featuredStories.length <= 1) {
      setFeaturedDisplayIndex(0);
      featuredDisplayRef.current = 0;
      setFeaturedSwapPhase('idle');
      return;
    }

    if (featuredFirstSyncRef.current) {
      featuredFirstSyncRef.current = false;
      setFeaturedDisplayIndex(featuredSlideIndex);
      featuredDisplayRef.current = featuredSlideIndex;
      setFeaturedSwapPhase('idle');
      return;
    }

    if (featuredSlideIndex === featuredDisplayRef.current) return;

    setFeaturedSwapPhase('exiting');
    const idOut = window.setTimeout(() => {
      setFeaturedDisplayIndex(featuredSlideIndex);
      featuredDisplayRef.current = featuredSlideIndex;
      setFeaturedSwapPhase('entering');
    }, FEATURED_SWAP_OUT_MS);
    const idIn = window.setTimeout(() => {
      setFeaturedSwapPhase('idle');
    }, FEATURED_SWAP_OUT_MS + FEATURED_SWAP_IN_MS);
    return () => {
      window.clearTimeout(idOut);
      window.clearTimeout(idIn);
    };
  }, [featuredSlideIndex, featuredStories.length]);

  /** Up to 7 from API; large card + sidebar rotate together (5s when 2+). */
  const activeFeatured = useMemo(() => {
    if (!featuredStories.length) return null;
    return featuredStories[featuredDisplayIndex] ?? featuredStories[0];
  }, [featuredStories, featuredDisplayIndex]);

  const sideFeatured = useMemo(() => {
    const len = featuredStories.length;
    if (len <= 1) return [];
    const maxSide = Math.min(MAX_FEATURED_STORIES - 1, len - 1);
    return Array.from({ length: maxSide }, (_, idx) =>
      featuredStories[(featuredDisplayIndex + idx + 1) % len]
    );
  }, [featuredStories, featuredDisplayIndex]);

  const heroFullWidth = featuredStories.length === 1;
  /** Spread cards only when the column is full-ish; otherwise stack from the top (avoids huge gaps). */
  const spreadSideCards = sideFeatured.length >= 5;

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
        <section className="mb-8 mt-3">
          <div className="rounded-2xl border border-pink-200/90 bg-gradient-to-br from-white via-pink-50/70 to-pink-100/25 p-4 sm:p-5 space-y-4 shadow-[0_8px_30px_-12px_rgba(219,39,119,0.12)] ring-1 ring-black/[0.04] dark:border-pink-500/30 dark:from-neutral-950 dark:via-pink-950/20 dark:to-neutral-950 dark:shadow-black/25 dark:ring-white/5">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[18px] text-pink-500 dark:text-pink-400">
                search
              </span>
              <input
                type="text"
                placeholder="Search by title, excerpt, or topic..."
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                className="w-full rounded-full border border-pink-200 bg-white py-2.5 pl-11 pr-5 text-sm text-black shadow-sm shadow-pink-500/5 placeholder:text-neutral-500 transition-all focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400/35 dark:border-pink-500/35 dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-400 dark:focus:border-pink-400"
              />
            </div>
            <div className="flex flex-wrap items-stretch gap-2 sm:gap-3">
              <button
                type="submit"
                className="min-h-[42px] shrink-0 rounded-xl border border-pink-600 bg-pink-500 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-sm shadow-pink-500/25 transition-all hover:bg-pink-600 active:scale-[0.98] dark:border-pink-400 dark:bg-pink-500 dark:hover:bg-pink-400"
              >
                Search
              </button>
              {isAuthenticated && (user?.role === 'mentor' || user?.role === 'admin') && (
                <Link
                  to="/dashboard/stories/new"
                  className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-pink-400 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-black shadow-sm transition-all hover:border-pink-500 hover:bg-pink-50 active:scale-[0.98] dark:border-pink-500/50 dark:bg-neutral-950 dark:text-white dark:hover:bg-pink-950/50"
                >
                  <span className="material-symbols-outlined text-[16px] text-pink-500 dark:text-pink-400">edit_square</span>
                  New
                </Link>
              )}
              <select
                value={filters.sort}
                onChange={(e) => setFilter('sort', e.target.value)}
                className="min-h-[42px] w-full min-w-[10rem] cursor-pointer rounded-xl border border-pink-200 bg-white py-2.5 pl-3 pr-4 text-xs font-semibold uppercase tracking-wide text-black shadow-sm shadow-pink-500/5 transition-all focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400/35 lg:w-auto dark:border-pink-500/35 dark:bg-neutral-950 dark:text-white dark:focus:border-pink-400"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilter('category', c)}
                className={`px-3.5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.14em] border transition-all duration-200 active:scale-[0.98] ${
                  filters.category === c
                    ? 'bg-pink-500 text-white border-pink-600 shadow-md shadow-pink-500/25 ring-1 ring-pink-400/40 dark:bg-pink-500 dark:text-white dark:border-pink-400'
                    : 'bg-pink-100 text-pink-800 border-pink-300/90 hover:bg-pink-200 hover:border-pink-400 hover:text-pink-950 dark:bg-pink-950/55 dark:text-pink-200 dark:border-pink-500/50 dark:hover:bg-pink-900/70 dark:hover:border-pink-400 dark:hover:text-pink-50'
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
            <div className="relative overflow-hidden rounded-3xl border border-pink-200/90 bg-gradient-to-br from-white via-pink-50/80 to-pink-100/35 p-4 sm:p-5 lg:p-6 shadow-[0_14px_36px_-8px_rgba(219,39,119,0.18)] ring-1 ring-black/[0.03] dark:border-pink-500/30 dark:from-neutral-950 dark:via-pink-950/25 dark:to-neutral-950 dark:shadow-black/40 dark:ring-white/5">
              <div className="absolute -top-16 -left-10 w-44 h-44 rounded-full bg-pink-300/35 blur-3xl pointer-events-none dark:bg-pink-500/15" />
              <div className="absolute -bottom-16 -right-8 w-52 h-52 rounded-full bg-pink-400/25 blur-3xl pointer-events-none dark:bg-pink-600/12" />
              <div className="relative flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-pink-600 dark:text-pink-400">Curated highlights</p>
                  <h2 className="font-serif-alt text-2xl sm:text-3xl font-bold text-pink-950 dark:text-pink-50 mt-1">Featured Stories</h2>
                </div>
                <span className="hidden sm:inline-flex px-3 py-1 rounded-full border border-pink-200/90 bg-pink-100/80 text-pink-800 text-[10px] uppercase tracking-[0.18em] font-bold dark:border-pink-500/40 dark:bg-pink-950/60 dark:text-pink-200">
                  Editor picks
                </span>
              </div>

              <div
                className={`grid grid-cols-1 lg:grid-cols-12 lg:items-stretch lg:content-stretch gap-4 lg:gap-5 ${
                  featuredStories.length > 1 && featuredSwapPhase !== 'idle' ? 'pointer-events-none' : ''
                }`}
              >
                <article
                  className={`group flex flex-col min-h-0 rounded-2xl overflow-hidden border border-pink-100/90 bg-white/92 dark:border-pink-500/20 dark:bg-neutral-950/95 backdrop-blur-sm shadow-[0_10px_24px_rgba(219,39,119,0.1)] lg:min-h-[min(640px,78vh)] ${heroFullWidth ? 'lg:col-span-12' : 'lg:col-span-8'}`}
                  key={activeFeatured._id}
                  style={
                    featuredStories.length <= 1
                      ? { animation: 'featuredHeroIn 0.85s cubic-bezier(0.4, 0, 0.2, 1) both' }
                      : featuredSwapPhase === 'exiting'
                        ? { animation: `featuredHeroSwapOut ${FEATURED_SWAP_OUT_MS}ms ease-in-out forwards` }
                        : featuredSwapPhase === 'entering'
                          ? { animation: `featuredHeroSwapIn ${FEATURED_SWAP_IN_MS}ms cubic-bezier(0.34, 1.02, 0.32, 1) both` }
                          : undefined
                  }
                >
                  <div className="relative flex-1 min-h-[280px] sm:min-h-[320px] lg:min-h-[min(480px,62vh)] bg-surface-container-low">
                    {activeFeatured.coverImage ? (
                      <img
                        src={activeFeatured.coverImage}
                        alt={activeFeatured.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        decoding="async"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-400/45 to-rose-500/30 dark:from-pink-600/35 dark:to-rose-900/40" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5">
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-pink-500/95 text-white text-[10px] font-bold uppercase tracking-widest shadow-sm shadow-pink-900/20">
                        Featured
                      </span>
                      <h3 className="mt-2 font-serif-alt text-2xl sm:text-3xl text-white leading-tight line-clamp-3">{activeFeatured.title}</h3>
                      <p className="mt-1 text-sm text-white/85 line-clamp-1">{activeFeatured.author?.name || 'Mentor'}</p>
                    </div>
                  </div>
                  <div className="shrink-0 p-4 sm:p-5 border-t border-pink-100/80 dark:border-pink-500/15 bg-white/95 dark:bg-neutral-950/90">
                    <p className="text-sm text-on-surface-variant line-clamp-3">
                      {stripHtmlToText(activeFeatured.excerpt || activeFeatured.content).slice(0, 200)}
                    </p>
                    <Link to={`/stories/${activeFeatured._id}`} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pink-600 bg-pink-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm shadow-pink-500/25 transition-colors hover:bg-pink-600 dark:border-pink-400 dark:bg-pink-500 dark:hover:bg-pink-400">
                      Read featured
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </div>
                </article>

                {sideFeatured.length > 0 && (
                <div
                  className="lg:col-span-4 flex min-h-0 flex-col lg:h-full lg:min-h-full"
                  style={
                    featuredStories.length > 1 && featuredSwapPhase === 'exiting'
                      ? { animation: `featuredSideColumnSwapOut ${FEATURED_SWAP_OUT_MS}ms ease-in-out forwards` }
                      : featuredStories.length > 1 && featuredSwapPhase === 'entering'
                        ? { animation: `featuredSideColumnSwapIn ${FEATURED_SWAP_IN_MS}ms cubic-bezier(0.34, 1.02, 0.32, 1) both` }
                        : undefined
                  }
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-pink-600 dark:text-pink-400 mb-1.5 shrink-0 hidden lg:block">
                    More featured
                  </p>
                  <div
                    key={featuredDisplayIndex}
                    className={
                      spreadSideCards
                        ? 'flex flex-col gap-2 lg:flex-1 lg:min-h-0 lg:justify-between lg:gap-0'
                        : 'flex flex-col gap-2 lg:flex-1 lg:min-h-0 lg:justify-start'
                    }
                  >
                    {sideFeatured.map((s, idx) => (
                      <Link
                        key={`${s._id}-${featuredDisplayIndex}-${idx}`}
                        to={`/stories/${s._id}`}
                        className="group flex items-center gap-3 rounded-xl border border-pink-100/90 bg-white/95 dark:border-pink-500/25 dark:bg-neutral-950/90 backdrop-blur-sm px-3 py-2 sm:px-3.5 sm:py-2 hover:border-pink-400/60 dark:hover:border-pink-400/50 transition-all hover:translate-x-0.5 overflow-hidden shrink-0"
                      >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-surface-container-low shrink-0">
                          {s.coverImage ? (
                            <img src={s.coverImage} alt={s.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${CARD_BG[idx % CARD_BG.length]}`} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 py-0.5">
                          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-pink-600 dark:text-pink-400 font-bold leading-tight">Featured</p>
                          <p className="font-semibold text-sm text-on-surface line-clamp-2 leading-snug mt-0.5">{s.title}</p>
                          <p className="text-xs text-outline line-clamp-1 mt-1 leading-snug">{s.author?.name || 'Mentor'}</p>
                        </div>
                        <span className="material-symbols-outlined text-pink-300/80 dark:text-pink-500/50 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors shrink-0 text-[18px] sm:text-[20px]">arrow_forward</span>
                      </Link>
                    ))}
                  </div>
                </div>
                )}
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
