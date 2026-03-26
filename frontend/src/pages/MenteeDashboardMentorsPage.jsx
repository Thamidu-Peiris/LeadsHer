import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import { mentorApi } from '../api/mentorApi';
import { mentorshipApi } from '../api/mentorshipApi';

function safeList(res) {
  const data = res?.data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.mentors)) return data.mentors;
  if (Array.isArray(data?.data?.mentors)) return data.data.mentors;
  if (Array.isArray(data?.requests)) return data.requests;
  if (Array.isArray(data?.data?.requests)) return data.data.requests;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return '';
  }
}

export default function MenteeDashboardMentorsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')?.[0] || 'Mentee';

  const [profileOpen, setProfileOpen] = useState(false);
  const [tab, setTab] = useState('directory'); // directory | requests | active

  const menteeAvatarSrc =
    user?.profilePicture || user?.avatar ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80';

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mentors, setMentors] = useState([]);

  const [requests, setRequests] = useState([]);
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);

  const [requestingMentor, setRequestingMentor] = useState(null);
  const [requestForm, setRequestForm] = useState({
    goals: 'Career growth, Leadership',
    preferredStartDate: '',
    message: 'I would love to learn from your experience.',
  });
  const [submitting, setSubmitting] = useState(false);

  const [goalsFor, setGoalsFor] = useState(null);
  const [goalsInput, setGoalsInput] = useState('');

  const [feedbackFor, setFeedbackFor] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });

  const counts = useMemo(() => ({
    directory: mentors.length,
    requests: requests.length,
    active: active.length,
  }), [mentors.length, requests.length, active.length]);

  const loadMentors = async () => {
    const res = await mentorApi.getAll({ limit: 24, search: search || undefined });
    setMentors(safeList(res));
  };

  const loadMyMentorship = async () => {
    const [r, a, h] = await Promise.allSettled([
      mentorshipApi.getRequests(),
      mentorshipApi.getActive(),
      mentorshipApi.getHistory(),
    ]);
    if (r.status === 'fulfilled') setRequests(safeList(r.value));
    if (a.status === 'fulfilled') setActive(safeList(a.value));
    if (h.status === 'fulfilled') setHistory(safeList(h.value));
  };

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([loadMentors(), loadMyMentorship()])
      .finally(() => setLoading(false));
  }, []);

  const actuallySendRequest = async () => {
    const goals = requestForm.goals.split(',').map((g) => g.trim()).filter(Boolean);
    setSubmitting(true);
    try {
      const mentorUserId = requestingMentor?.user?._id || requestingMentor?.user || requestingMentor?._id;
      await mentorApi.sendRequest(mentorUserId, {
        goals,
        preferredStartDate: requestForm.preferredStartDate,
        message: requestForm.message,
      });
      toast.success('Mentorship request sent!');
      setRequestingMentor(null);
      await loadMyMentorship();
      setTab('requests');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (id) => {
    try {
      await mentorshipApi.cancelRequest(id);
      toast.success('Request cancelled');
      await loadMyMentorship();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to cancel');
    }
  };

  const updateGoals = async () => {
    if (!goalsFor?._id) return;
    const goals = goalsInput.split(',').map((g) => g.trim()).filter(Boolean);
    if (goals.length === 0) { toast.error('Add at least one goal'); return; }
    try {
      await mentorshipApi.updateGoals(goalsFor._id, { goals });
      toast.success('Goals updated');
      setGoalsFor(null);
      setGoalsInput('');
      await loadMyMentorship();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update goals');
    }
  };

  const submitFeedback = async () => {
    if (!feedbackFor?._id) return;
    try {
      await mentorshipApi.submitFeedback(feedbackFor._id, feedbackForm);
      toast.success('Feedback submitted');
      setFeedbackFor(null);
      setFeedbackForm({ rating: 5, comment: '' });
      await loadMyMentorship();
      setTab('active');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit feedback');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen overflow-hidden bg-surface text-on-surface">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-outline-variant/20 flex flex-col z-40">
          <div className="p-4 border-b border-outline-variant/20">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-gold-accent p-0.5 overflow-hidden">
                  <img alt="" className="w-full h-full object-cover" src={menteeAvatarSrc} />
                </div>
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <p className="text-on-surface font-bold text-base text-center leading-tight px-1">{firstName}</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {[
              { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
              { to: '/dashboard/mentors', icon: 'groups', label: 'Mentorship' },
              { to: '/events', icon: 'event', label: 'Events' },
              { to: '/stories', icon: 'auto_stories', label: 'Stories' },
              { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 transition-all ${
                    isActive
                      ? 'text-gold-accent bg-gold-accent/5 border-gold-accent'
                      : 'text-outline hover:text-on-surface hover:bg-surface-container-low border-transparent'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-outline-variant/20">
            <Link
              to="/dashboard/mentors"
              className="w-full bg-gradient-to-r from-gold-accent to-primary text-white text-xs font-bold py-3 rounded-lg shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
              onClick={() => setTab('directory')}
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              FIND A MENTOR
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="ml-[260px] flex-1 flex flex-col min-h-screen">
          <header className="h-16 min-h-[64px] border-b border-outline-variant/20 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-outline">
              <Link className="hover:text-gold-accent transition-colors" to="/">Home</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <Link className="hover:text-gold-accent transition-colors" to="/dashboard">Dashboard</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface">Mentorship</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/25 hover:border-gold-accent transition-colors focus:outline-none focus:ring-2 focus:ring-gold-accent/40"
                >
                  <img alt="Avatar" className="w-full h-full object-cover" src={menteeAvatarSrc} />
                </button>
                {profileOpen && (
                  <div role="menu" className="absolute right-0 mt-3 w-56 bg-white border border-outline-variant/20 editorial-shadow z-50">
                    <div className="px-5 py-4 border-b border-outline-variant/15">
                      <p className="font-sans-modern text-sm font-semibold text-on-surface line-clamp-1">
                        {user?.name || 'Mentee'}
                      </p>
                      <p className="font-sans-modern text-xs text-outline line-clamp-1">
                        {user?.email}
                      </p>
                    </div>
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="block w-full text-left px-5 py-3 font-sans-modern text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      role="menuitem"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await logout();
                          toast.success('You have signed out.');
                        } finally {
                          setProfileOpen(false);
                          navigate('/');
                        }
                      }}
                      className="w-full text-left px-5 py-3 font-sans-modern text-sm text-tertiary hover:bg-tertiary/5 transition-colors flex items-center gap-2"
                      role="menuitem"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="p-8 space-y-6 max-w-[1400px] mx-auto w-full">
            <section className="bg-white border border-outline-variant/20 editorial-shadow rounded-xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-serif-alt text-3xl font-bold text-on-surface">Mentorship</h1>
                <p className="text-on-surface-variant text-sm mt-1">
                  Browse mentors, send requests, and manage your mentorship journey.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'directory', label: 'Directory', count: counts.directory },
                  { key: 'requests', label: 'My Requests', count: counts.requests },
                  { key: 'active', label: 'Active', count: counts.active },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                      tab === t.key
                        ? 'border-gold-accent bg-gold-accent/10 text-on-surface'
                        : 'border-outline-variant/25 bg-white hover:border-gold-accent/40'
                    }`}
                  >
                    {t.label} <span className="text-outline font-semibold">({t.count})</span>
                  </button>
                ))}
              </div>
            </section>

            {loading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : (
              <>
                {tab === 'directory' && (
                  <div className="bg-white border border-outline-variant/20 editorial-shadow rounded-xl p-8">
                    <div className="flex gap-2 mb-6">
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search mentors…"
                        className="flex-1 bg-white border border-outline-variant/25 rounded-lg px-4 py-3 text-sm"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          setLoading(true);
                          try { await loadMentors(); } finally { setLoading(false); }
                        }}
                        className="bg-gold-accent text-white px-5 rounded-lg text-sm font-bold"
                      >
                        Search
                      </button>
                    </div>

                    {mentors.length === 0 ? (
                      <p className="text-on-surface-variant">No mentors found.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mentors.map((m) => (
                          <div key={m._id} className="border border-outline-variant/20 rounded-xl p-6 flex flex-col">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center font-bold text-primary">
                                {(m?.user?.name || m?.name || 'M')?.[0]?.toUpperCase() || 'M'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-on-surface line-clamp-1">{m?.user?.name || m?.name || 'Mentor'}</p>
                                <p className="text-xs text-outline line-clamp-1">{m?.user?.email || m?.email || 'Mentor'}</p>
                              </div>
                            </div>
                            {m.bio && <p className="text-sm text-on-surface-variant line-clamp-3 mb-4">{m.bio}</p>}
                            <div className="mt-auto flex gap-2">
                              <Link to={`/mentors/${m._id}`} className="px-4 py-2 text-xs font-bold tracking-wider uppercase border border-outline-variant/25 hover:border-gold-accent/40 transition-colors">
                                View
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setRequestingMentor(m);
                                  setRequestForm((f) => ({ ...f, preferredStartDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) }));
                                }}
                                className="bg-gold-accent text-white px-4 py-2 text-xs font-bold tracking-wider uppercase hover:opacity-90"
                              >
                                Request
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'requests' && (
                  <div className="bg-white border border-outline-variant/20 editorial-shadow rounded-xl p-8">
                    <h2 className="font-serif-alt text-2xl font-bold text-on-surface mb-1">My Requests</h2>
                    <p className="text-on-surface-variant text-sm mb-6">Track and cancel pending requests.</p>
                    {requests.length === 0 ? (
                      <p className="text-on-surface-variant">No requests yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {requests.map((r) => (
                          <div key={r._id} className="border border-outline-variant/20 rounded-xl p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-widest text-outline font-bold">Mentor</p>
                                <p className="font-semibold text-on-surface">{r?.mentor?.name || 'Mentor'}</p>
                                <p className="text-xs text-outline mt-1">Preferred start: {formatDate(r?.preferredStartDate)}</p>
                              </div>
                              <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-outline-variant/25 text-outline">
                                {r?.status || 'pending'}
                              </span>
                            </div>
                            <div className="mt-4 flex gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => cancelRequest(r._id)}
                                className="px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase border border-tertiary/30 text-tertiary hover:bg-tertiary/5"
                              >
                                Cancel request
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'active' && (
                  <div className="bg-white border border-outline-variant/20 editorial-shadow rounded-xl p-8">
                    <h2 className="font-serif-alt text-2xl font-bold text-on-surface mb-1">Active Mentorship</h2>
                    <p className="text-on-surface-variant text-sm mb-6">View active mentorship and update goals.</p>

                    {active.length === 0 ? (
                      <p className="text-on-surface-variant">No active mentorships yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {active.map((m) => (
                          <div key={m._id} className="border border-outline-variant/20 rounded-xl p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-widest text-outline font-bold">Mentor</p>
                                <p className="font-semibold text-on-surface">{m?.mentor?.name || 'Mentor'}</p>
                                <p className="text-xs text-outline mt-1">Started: {formatDate(m?.startDate)}</p>
                              </div>
                              <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-outline-variant/25 text-outline">
                                {m?.status || 'active'}
                              </span>
                            </div>

                            <div className="mt-4">
                              <p className="text-xs uppercase tracking-widest text-outline font-bold mb-2">Goals</p>
                              <div className="flex flex-wrap gap-2">
                                {(m?.goals || []).slice(0, 8).map((g) => (
                                  <span key={g} className="inline-flex px-3 py-1 text-xs bg-surface-container-lowest border border-outline-variant/15 rounded-lg">
                                    {g}
                                  </span>
                                ))}
                                {(!m?.goals || m.goals.length === 0) && (
                                  <span className="text-sm text-on-surface-variant">No goals set yet.</span>
                                )}
                              </div>
                            </div>

                            <div className="mt-5 flex gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setGoalsFor(m);
                                  setGoalsInput((m?.goals || []).join(', '));
                                }}
                                className="px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase border border-outline-variant/25 hover:border-gold-accent/40 transition-colors"
                              >
                                Set goals
                              </button>
                              {m?.status === 'completed' && (
                                <button
                                  type="button"
                                  onClick={() => setFeedbackFor(m)}
                                  className="bg-gold-accent text-white px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase hover:opacity-90"
                                >
                                  Submit feedback
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Request modal */}
            {requestingMentor && (
              <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-6">
                <div className="w-full max-w-xl bg-white border border-outline-variant/20 editorial-shadow p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-serif-alt text-xl font-bold text-on-surface">Request Mentorship</h3>
                      <p className="text-xs text-outline">Mentor: {requestingMentor?.user?.name || requestingMentor?.name || 'Mentor'}</p>
                    </div>
                    <button type="button" onClick={() => setRequestingMentor(null)} className="text-outline hover:text-on-surface">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Preferred start date</label>
                      <input
                        type="date"
                        value={requestForm.preferredStartDate}
                        onChange={(e) => setRequestForm((f) => ({ ...f, preferredStartDate: e.target.value }))}
                        className="w-full bg-white border border-outline-variant/25 rounded-lg px-4 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Goals (comma-separated)</label>
                      <input
                        value={requestForm.goals}
                        onChange={(e) => setRequestForm((f) => ({ ...f, goals: e.target.value }))}
                        className="w-full bg-white border border-outline-variant/25 rounded-lg px-4 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Message</label>
                    <textarea
                      value={requestForm.message}
                      onChange={(e) => setRequestForm((f) => ({ ...f, message: e.target.value }))}
                      className="w-full bg-white border border-outline-variant/25 rounded-lg px-4 py-2 text-sm"
                      rows={4}
                    />
                  </div>

                  <div className="mt-5 flex gap-2 justify-end">
                    <button type="button" onClick={() => setRequestingMentor(null)} className="px-4 py-2 text-xs font-bold tracking-wider uppercase border border-outline-variant/25">
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={actuallySendRequest}
                      className="bg-gold-accent text-white px-4 py-2 text-xs font-bold tracking-wider uppercase disabled:opacity-60"
                    >
                      {submitting ? 'Sending…' : 'Send request'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Goals modal */}
            {goalsFor && (
              <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-6">
                <div className="w-full max-w-xl bg-white border border-outline-variant/20 editorial-shadow p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-serif-alt text-xl font-bold text-on-surface">Set Mentorship Goals</h3>
                      <p className="text-xs text-outline">Mentor: {goalsFor?.mentor?.name || 'Mentor'}</p>
                    </div>
                    <button type="button" onClick={() => setGoalsFor(null)} className="text-outline hover:text-on-surface">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Goals (comma-separated)</label>
                  <input
                    value={goalsInput}
                    onChange={(e) => setGoalsInput(e.target.value)}
                    className="w-full bg-white border border-outline-variant/25 rounded-lg px-4 py-3 text-sm"
                    placeholder="Leadership, confidence, career growth…"
                  />

                  <div className="mt-5 flex gap-2 justify-end">
                    <button type="button" onClick={() => setGoalsFor(null)} className="px-4 py-2 text-xs font-bold tracking-wider uppercase border border-outline-variant/25">
                      Cancel
                    </button>
                    <button type="button" onClick={updateGoals} className="bg-gold-accent text-white px-4 py-2 text-xs font-bold tracking-wider uppercase">
                      Save goals
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback modal */}
            {feedbackFor && (
              <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-6">
                <div className="w-full max-w-lg bg-white border border-outline-variant/20 editorial-shadow p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-serif-alt text-xl font-bold text-on-surface">Submit Feedback</h3>
                      <p className="text-xs text-outline">Mentor: {feedbackFor?.mentor?.name || 'Mentor'}</p>
                    </div>
                    <button type="button" onClick={() => setFeedbackFor(null)} className="text-outline hover:text-on-surface">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Rating (1-5)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={feedbackForm.rating}
                        onChange={(e) => setFeedbackForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                        className="w-full bg-white border border-outline-variant/25 rounded-lg px-4 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Comment</label>
                    <textarea
                      value={feedbackForm.comment}
                      onChange={(e) => setFeedbackForm((f) => ({ ...f, comment: e.target.value }))}
                      className="w-full bg-white border border-outline-variant/25 rounded-lg px-4 py-2 text-sm"
                      rows={4}
                    />
                  </div>

                  <div className="mt-5 flex gap-2 justify-end">
                    <button type="button" onClick={() => setFeedbackFor(null)} className="px-4 py-2 text-xs font-bold tracking-wider uppercase border border-outline-variant/25">
                      Cancel
                    </button>
                    <button type="button" onClick={submitFeedback} className="bg-gold-accent text-white px-4 py-2 text-xs font-bold tracking-wider uppercase">
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}

            <footer className="pt-6 border-t border-outline-variant/20 text-center">
              <p className="text-[10px] text-outline tracking-widest uppercase">
                © {new Date().getFullYear()} LeadsHer. Built for brilliance.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

