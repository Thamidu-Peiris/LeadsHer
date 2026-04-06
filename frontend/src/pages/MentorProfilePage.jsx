import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mentorApi } from '../api/mentorApi';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';
import { absolutePhotoUrl } from '../utils/absolutePhotoUrl';
import { getApiErrorMessage } from '../utils/apiErrorMessage';

const TABS = [
  { id: 'about', label: 'About' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'mentorships', label: 'Mentorships' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'availability', label: 'Availability' },
];

const EXPERTISE_ICONS = ['groups', 'strategy', 'trending_up'];

function StarMaterial({ rating, className = '' }) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <span className={`flex items-center text-rose-500 ${className}`} aria-hidden>
      {Array.from({ length: r }, (_, i) => (
        <span key={`f-${i}`} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>
          star
        </span>
      ))}
      {Array.from({ length: 5 - r }, (_, i) => (
        <span key={`e-${i}`} className="material-symbols-outlined text-[18px] text-neutral-200">
          star
        </span>
      ))}
    </span>
  );
}

function MenteeReviewAvatar({ name, profilePicture, avatar }) {
  const [imgErr, setImgErr] = useState(false);
  const raw = (profilePicture || avatar || '').trim();
  const src = absolutePhotoUrl(raw);
  const initial = (name || 'M').trim().charAt(0).toUpperCase() || 'M';
  useEffect(() => {
    setImgErr(false);
  }, [raw]);
  if (src && !imgErr) {
    return (
      <img
        src={src}
        alt=""
        className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-neutral-100"
        onError={() => setImgErr(true)}
      />
    );
  }
  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-base font-semibold text-neutral-600 ring-2 ring-neutral-100"
      aria-hidden
    >
      {initial}
    </div>
  );
}

/** Hot pink stars for mentee feedback section only */
function FeedbackStars({ rating, className = '', sizeClass = 'text-[20px]' }) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <span className={`flex items-center text-rose-500 ${className}`} aria-hidden>
      {Array.from({ length: r }, (_, i) => (
        <span
          key={`f-${i}`}
          className={`material-symbols-outlined ${sizeClass}`}
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          star
        </span>
      ))}
      {Array.from({ length: 5 - r }, (_, i) => (
        <span key={`e-${i}`} className={`material-symbols-outlined ${sizeClass} text-neutral-200`}>
          star
        </span>
      ))}
    </span>
  );
}

export default function MentorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [bookmarked, setBookmarked] = useState(false);
  const [reviewPayload, setReviewPayload] = useState({
    reviews: [],
    distribution: [],
    total: 0,
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    goals: 'Career growth, Leadership',
    preferredStartDate: '',
    message: 'I would love to learn from your experience.',
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    mentorApi
      .getById(id)
      .then((res) => {
        const p = res.data?.data ?? res.data;
        setProfile(p);
      })
      .catch(() => navigate('/mentors'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    mentorApi
      .getReviews(id)
      .then((res) => {
        const d = res.data?.data ?? res.data;
        setReviewPayload({
          reviews: Array.isArray(d?.reviews) ? d.reviews : [],
          distribution: Array.isArray(d?.distribution) ? d.distribution : [],
          total: typeof d?.total === 'number' ? d.total : 0,
        });
      })
      .catch(() =>
        setReviewPayload({
          reviews: [],
          distribution: [],
          total: 0,
        })
      )
      .finally(() => setReviewsLoading(false));
  }, [id]);

  const openRequestModal = useCallback(() => {
    if (!isAuthenticated) {
      toast.error('Log in to send a request');
      return;
    }
    setRequestForm({
      goals: 'Career growth, Leadership',
      preferredStartDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      message: 'I would love to learn from your experience.',
    });
    setRequestModalOpen(true);
  }, [isAuthenticated]);

  const submitMentorshipRequest = useCallback(async () => {
    if (!profile) return;
    const mentorUserId = profile.user?._id || profile.user;
    if (!mentorUserId) {
      toast.error('Could not resolve mentor account');
      return;
    }
    const goals = requestForm.goals
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
    if (goals.length === 0) {
      toast.error('Add at least one goal');
      return;
    }
    if (!requestForm.preferredStartDate) {
      toast.error('Choose a preferred start date');
      return;
    }
    setSubmittingRequest(true);
    try {
      await mentorApi.sendRequest(mentorUserId, {
        goals,
        preferredStartDate: requestForm.preferredStartDate,
        message: requestForm.message.trim() || 'I would love to connect!',
      });
      toast.success('Mentorship request sent!');
      setRequestModalOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to send request'));
    } finally {
      setSubmittingRequest(false);
    }
  }, [profile, requestForm]);

  useEffect(() => {
    if (!profile) return;
    const name = profile.user?.name || 'Mentor';
    document.title = `${name} | Mentor Profile · LeadsHer`;
    return () => {
      document.title = 'LeadsHer';
    };
  }, [profile]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + 160;
      for (const { id: sectionId } of TABS) {
        const el = document.getElementById(sectionId);
        if (!el) continue;
        const { offsetTop, offsetHeight } = el;
        if (y >= offsetTop && y < offsetTop + offsetHeight) {
          setActiveTab(sectionId);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f6f6] flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!profile) return null;

  const displayName = profile.user?.name || 'Mentor';
  const avatarSrc = profile.user?.profilePicture || profile.user?.avatar;
  const initial = displayName[0]?.toUpperCase() || 'M';
  const industries = profile.industries || [];
  const areas = profile.mentoringAreas || [];
  const expertiseList = profile.expertise || [];
  const roleLine =
    areas[0] && industries[0]
      ? `${areas[0]} at ${industries[0]}`
      : areas[0] || industries[0] || 'Mentor';
  const ratingVal = Number(profile.rating) || 0;
  const totalReviews = profile.totalReviews ?? 0;
  const sessions = profile.totalMentorships ?? 0;
  const years = profile.yearsOfExperience ?? 0;
  const location =
    (typeof profile.user?.location === 'string' && profile.user.location.trim()) ||
    profile.availability?.timezone ||
    '';
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;
  const canShowAvailable =
    profile.isAvailable &&
    profile.isVerified &&
    (profile.availability?.currentMentees ?? 0) < (profile.availability?.maxMentees ?? 1);

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveTab(sectionId);
  };

  return (
    <div className="min-h-screen bg-[#f8f6f6] text-neutral-900">
      <div className="pt-20">
        {/* Hero header — white theme */}
        <header className="bg-white border-b border-neutral-200/90 pb-6 pt-4 px-4 md:px-10 lg:px-12">
          <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center lg:items-end gap-10">
            <div className="relative shrink-0">
              <div className="w-[120px] h-[120px] rounded-full p-1 ring-2 ring-rose-500">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full rounded-full bg-neutral-100 flex items-center justify-center text-3xl font-semibold text-neutral-600">
                    {initial}
                  </div>
                )}
              </div>
              {profile.isVerified ? (
                <div
                  className="absolute bottom-1 right-1 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#1d9bf0] text-white shadow-md ring-[3px] ring-white"
                  title="Verified mentor"
                >
                  <span
                    className="material-symbols-outlined text-[16px] leading-none"
                    style={{ fontVariationSettings: '"FILL" 1, "wght" 700' }}
                    aria-hidden
                  >
                    check
                  </span>
                  <span className="sr-only">Verified mentor</span>
                </div>
              ) : null}
            </div>

            <div className="flex-1 text-center lg:text-left min-w-0">
              <h1 className="font-serif-alt text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-2">
                {displayName}
              </h1>
              <div className="flex flex-col gap-1 text-neutral-500">
                <p className="text-lg text-rose-500 font-medium">{roleLine}</p>
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-3 text-sm text-neutral-500">
                  {location ? (
                    <>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-neutral-400">location_on</span>
                        {location}
                      </span>
                      {memberSince ? (
                        <span className="w-1 h-1 bg-neutral-300 rounded-full hidden sm:block" aria-hidden />
                      ) : null}
                    </>
                  ) : null}
                  {memberSince ? <span>Member since {memberSince}</span> : null}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-end gap-4 w-full lg:w-auto">
              <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <StarMaterial rating={ratingVal} />
                    {ratingVal > 0 ? (
                      <span className="ml-1 font-bold text-neutral-900 tabular-nums">{ratingVal.toFixed(1)}</span>
                    ) : (
                      <span className="ml-1 text-sm text-neutral-400">No rating yet</span>
                    )}
                  </div>
                  {totalReviews > 0 ? (
                    <span className="text-xs text-neutral-400 mt-0.5">{totalReviews} reviews</span>
                  ) : (
                    <span className="text-xs text-neutral-400 mt-0.5">New mentor</span>
                  )}
                </div>
                <div className="h-8 w-px bg-neutral-200 hidden sm:block" aria-hidden />
                {canShowAvailable ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold border border-emerald-500/25 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                    Available now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-bold border border-neutral-200 uppercase tracking-wider">
                    Limited availability
                  </span>
                )}
              </div>
              <div className="flex gap-3 w-full max-w-md lg:max-w-none justify-center lg:justify-end">
                <button
                  type="button"
                  onClick={openRequestModal}
                  className="flex-1 lg:flex-none px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold transition-all text-sm uppercase tracking-widest shadow-sm shadow-rose-500/25"
                >
                  Request mentorship
                </button>
                <button
                  type="button"
                  onClick={() => setBookmarked((b) => !b)}
                  className={`p-3 border rounded-lg transition-all ${
                    bookmarked
                      ? 'border-rose-500 bg-rose-50 text-rose-900'
                      : 'border-rose-200 text-rose-500 hover:bg-rose-50'
                  }`}
                  aria-pressed={bookmarked}
                  aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark mentor'}
                >
                  <span className="material-symbols-outlined">
                    {bookmarked ? 'bookmark' : 'bookmark_add'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Sticky tabs */}
        <nav
          className="sticky top-20 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/90 px-4 md:px-10 lg:px-12 shadow-sm shadow-neutral-900/5"
          aria-label="Profile sections"
        >
          <div className="max-w-[1200px] mx-auto flex gap-6 md:gap-8 overflow-x-auto pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map(({ id: tid, label }) => (
              <button
                key={tid}
                type="button"
                onClick={() => scrollToSection(tid)}
                className={`py-4 text-sm font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors shrink-0 ${
                  activeTab === tid
                    ? 'border-rose-500 text-rose-500'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

        <main className="max-w-[1200px] mx-auto px-4 md:px-10 lg:px-12 py-12 md:py-16 space-y-20 md:space-y-24">
          {/* About */}
          <section className="max-w-3xl scroll-mt-36 space-y-8" id="about">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">Biography</h2>
              <p className="text-neutral-600 leading-relaxed text-lg font-light whitespace-pre-wrap">{profile.bio}</p>
            </div>

            {profile.achievements?.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neutral-900">Key achievements</h3>
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {profile.achievements.map((a) => (
                    <li key={a} className="flex items-start gap-3 text-neutral-600">
                      <span className="text-rose-500 mt-0.5" aria-hidden>
                        ✦
                      </span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {/* Expertise */}
          <section className="space-y-10 scroll-mt-36" id="expertise">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">Mentoring expertise</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {areas.slice(0, 3).map((area, idx) => (
                <div
                  key={area}
                  className="p-6 md:p-8 border border-neutral-200 rounded-xl bg-white shadow-sm group hover:border-rose-200 transition-all"
                >
                  <span className="material-symbols-outlined text-rose-500 text-4xl mb-4 group-hover:scale-110 transition-transform block">
                    {EXPERTISE_ICONS[idx % EXPERTISE_ICONS.length]}
                  </span>
                  <h3 className="text-lg font-bold mb-2 text-neutral-900">{area}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">
                    Core mentoring focus aligned with your goals in this area.
                  </p>
                </div>
              ))}
              {areas.length === 0 ? (
                <p className="text-neutral-500 col-span-full">No mentoring areas listed yet.</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 pt-4">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neutral-900">Skills & focus</h3>
                <div className="space-y-5">
                  {expertiseList.length === 0 ? (
                    <p className="text-sm text-neutral-500">Expertise areas will appear here.</p>
                  ) : (
                    expertiseList.slice(0, 6).map((skill) => (
                      <div key={skill} className="space-y-2">
                        <div className="text-sm font-medium text-neutral-800">{skill}</div>
                        <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                          <div className="h-full w-full bg-rose-500 rounded-full" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center p-8 bg-rose-50/90 border border-rose-100 rounded-xl">
                <div className="text-center">
                  <p className="text-6xl md:text-7xl font-black text-rose-500 leading-none mb-2">{years || 0}+</p>
                  <p className="text-xl font-bold text-neutral-900 tracking-widest uppercase">Years of impact</p>
                  <p className="text-neutral-500 mt-4 max-w-[220px] mx-auto text-sm">
                    Deep experience across {industries.length ? industries.slice(0, 2).join(' & ') : 'multiple industries'}.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Mentorships */}
          <section className="space-y-6 scroll-mt-36" id="mentorships">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">Mentorships</h2>
            <div className="p-8 md:p-10 bg-white border border-neutral-200 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-8 items-center justify-between">
              <div>
                <p className="text-4xl font-black text-neutral-900">{sessions}</p>
                <p className="text-sm text-neutral-500 mt-1">Completed or ongoing mentorship sessions</p>
              </div>
              <p className="text-neutral-600 max-w-md text-sm leading-relaxed">
                This mentor has supported mentees through structured sessions. Request mentorship to start your journey.
              </p>
            </div>
          </section>

          {/* Reviews — white cards, hot pink accents */}
          <section className="space-y-10 scroll-mt-36" id="reviews">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">Mentee feedback</h2>

            <div className="rounded-2xl border border-neutral-200/90 bg-white p-8 shadow-sm md:p-10">
              {reviewsLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="md" />
                </div>
              ) : (
                <div className="flex flex-col gap-10 md:flex-row md:items-start md:gap-12">
                  <div className="shrink-0 text-center md:text-left">
                    {ratingVal > 0 ? (
                      <>
                        <p className="text-6xl font-black leading-none text-neutral-900 tabular-nums md:text-7xl">
                          {ratingVal.toFixed(1)}
                        </p>
                        <FeedbackStars
                          rating={ratingVal}
                          className="mt-3 justify-center md:justify-start"
                          sizeClass="text-[22px]"
                        />
                        <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
                          {(reviewPayload.total || totalReviews) > 0
                            ? `${reviewPayload.total || totalReviews} verified ${
                                (reviewPayload.total || totalReviews) === 1 ? 'review' : 'reviews'
                              }`
                            : 'Rating summary'}
                        </p>
                      </>
                    ) : (
                      <p className="text-neutral-500">No reviews yet — be among the first to connect.</p>
                    )}
                  </div>

                  {ratingVal > 0 && reviewPayload.total > 0 && reviewPayload.distribution.length > 0 ? (
                    <div className="min-w-0 flex-1 space-y-3">
                      {reviewPayload.distribution.map(({ star, pct }) => (
                        <div key={star} className="flex items-center gap-3">
                          <span className="w-4 text-right text-xs tabular-nums text-neutral-500">{star}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
                            <div
                              className="h-full rounded-full bg-rose-500 transition-all"
                              style={{ width: `${Math.min(100, Math.round(pct))}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs tabular-nums text-neutral-500">
                            {Number.isInteger(pct) ? pct : Math.round(pct)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : ratingVal > 0 && !reviewPayload.total ? (
                    <p className="flex-1 text-sm text-neutral-500">
                      Star breakdown will appear once mentees submit feedback on completed mentorships.
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            {!reviewsLoading && reviewPayload.reviews.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                {reviewPayload.reviews.map((rev) => {
                  const m =
                    rev.mentee && typeof rev.mentee === 'object' ? rev.mentee : null;
                  const name = m?.name || 'Mentee';
                  const when = rev.completedAt
                    ? new Date(rev.completedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : '';
                  return (
                    <article
                      key={rev._id}
                      className="rounded-xl border border-neutral-200/90 bg-white p-6 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-4">
                          <MenteeReviewAvatar
                            name={name}
                            profilePicture={m?.profilePicture}
                            avatar={m?.avatar}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-neutral-900">{name}</p>
                            {when ? (
                              <p className="text-[10px] uppercase tracking-widest text-neutral-500">{when}</p>
                            ) : null}
                          </div>
                        </div>
                        <FeedbackStars rating={rev.rating} sizeClass="text-[16px]" className="shrink-0 scale-90" />
                      </div>
                      {rev.comment ? (
                        <p className="mt-4 text-sm italic leading-relaxed text-neutral-600">&ldquo;{rev.comment}&rdquo;</p>
                      ) : (
                        <p className="mt-4 text-sm text-neutral-400">Rated {Number(rev.rating).toFixed(1)} / 5</p>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : !reviewsLoading && ratingVal > 0 && reviewPayload.total === 0 ? (
              <p className="text-center text-sm text-neutral-500">
                Individual testimonials will show here when mentees leave comments on completed sessions.
              </p>
            ) : null}
          </section>

          {/* Availability */}
          <section className="space-y-6 scroll-mt-36 pb-8" id="availability">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">Availability</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-white border border-neutral-200 rounded-xl shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Timezone</h3>
                <p className="text-lg font-semibold text-neutral-900">{profile.availability?.timezone || '—'}</p>
              </div>
              <div className="p-6 bg-white border border-neutral-200 rounded-xl shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Mentee slots</h3>
                <p className="text-lg font-semibold text-neutral-900">
                  {profile.availability?.currentMentees ?? 0} / {profile.availability?.maxMentees ?? '—'} active
                </p>
              </div>
              {profile.availability?.preferredTime?.length > 0 ? (
                <div className="p-6 bg-white border border-neutral-200 rounded-xl shadow-sm sm:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
                    Preferred times
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {profile.availability.preferredTime.map((t) => (
                      <li
                        key={t}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 text-sm text-neutral-800 border border-neutral-200"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>

          <div className="flex justify-center pt-4 border-t border-neutral-200">
            <Link
              to="/mentors"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-rose-300 text-rose-900 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-rose-50 transition-colors"
            >
              Back to all mentors
            </Link>
          </div>
        </main>
      </div>

      {requestModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mentor-request-modal-title"
        >
          <div className="w-full max-w-xl rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3
                  id="mentor-request-modal-title"
                  className="font-serif-alt text-xl font-bold text-neutral-900"
                >
                  Request mentorship
                </h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Mentor:{' '}
                  <span className="font-medium text-neutral-800">{displayName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequestModalOpen(false)}
                className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[22px] leading-none">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Preferred start date
                </label>
                <input
                  type="date"
                  value={requestForm.preferredStartDate}
                  onChange={(e) =>
                    setRequestForm((f) => ({ ...f, preferredStartDate: e.target.value }))
                  }
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30"
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Goals (comma-separated)
                </label>
                <input
                  type="text"
                  value={requestForm.goals}
                  onChange={(e) => setRequestForm((f) => ({ ...f, goals: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30"
                  placeholder="e.g. Career growth, Leadership"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Message
              </label>
              <textarea
                value={requestForm.message}
                onChange={(e) => setRequestForm((f) => ({ ...f, message: e.target.value }))}
                rows={4}
                className="w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRequestModalOpen(false)}
                className="rounded-lg border border-neutral-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingRequest}
                onClick={submitMentorshipRequest}
                className="rounded-lg bg-rose-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-rose-500/25 transition-all hover:bg-rose-600 disabled:opacity-60"
              >
                {submittingRequest ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
