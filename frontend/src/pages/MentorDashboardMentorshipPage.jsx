import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import { mentorshipApi } from '../api/mentorshipApi';

function safeList(res) {
  const data = res?.data;
  return data?.data || data?.requests || data?.mentorships || data?.items || [];
}

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return '';
  }
}

export default function MentorDashboardMentorshipPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')?.[0] || 'Mentor';

  const [profileOpen, setProfileOpen] = useState(false);
  const [tab, setTab] = useState('requests'); // requests | active | history

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);

  const [respondingId, setRespondingId] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const [sessionFor, setSessionFor] = useState(null);
  const [sessionForm, setSessionForm] = useState({ date: '', duration: 30, notes: '', topics: '' });

  const [feedbackFor, setFeedbackFor] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });

  const counts = useMemo(() => ({
    requests: requests.length,
    active: active.length,
    history: history.length,
  }), [requests.length, active.length, history.length]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r, a, h] = await Promise.allSettled([
        mentorshipApi.getRequests({ status: 'pending', type: 'received' }),
        mentorshipApi.getActive(),
        mentorshipApi.getHistory(),
      ]);
      if (r.status === 'fulfilled') setRequests(safeList(r.value));
      if (a.status === 'fulfilled') setActive(safeList(a.value));
      if (h.status === 'fulfilled') setHistory(safeList(h.value));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const accept = async (id) => {
    setRespondingId(id);
    try {
      await mentorshipApi.acceptRequest(id, responseMessage ? { responseMessage } : undefined);
      toast.success('Request accepted');
      setResponseMessage('');
      await loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to accept');
    } finally {
      setRespondingId('');
    }
  };

  const reject = async (id) => {
    setRespondingId(id);
    try {
      await mentorshipApi.rejectRequest(id, responseMessage ? { responseMessage } : undefined);
      toast.success('Request rejected');
      setResponseMessage('');
      await loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to reject');
    } finally {
      setRespondingId('');
    }
  };

  const complete = async (id) => {
    try {
      await mentorshipApi.complete(id);
      toast.success('Mentorship marked complete');
      await loadAll();
      setFeedbackFor({ _id: id });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to complete mentorship');
    }
  };

  const submitSession = async () => {
    if (!sessionFor?._id) return;
    try {
      const payload = {
        date: sessionForm.date,
        duration: Number(sessionForm.duration),
        notes: sessionForm.notes || undefined,
        topics: sessionForm.topics
          ? sessionForm.topics.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
      };
      await mentorshipApi.logSession(sessionFor._id, payload);
      toast.success('Session logged');
      setSessionFor(null);
      setSessionForm({ date: '', duration: 30, notes: '', topics: '' });
      await loadAll();
    } catch (e) {
      const msg =
        e.response?.data?.errors?.[0] ||
        e.response?.data?.error ||
        e.response?.data?.message ||
        'Failed to log session';
      toast.error(msg);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackFor?._id) return;
    try {
      await mentorshipApi.submitFeedback(feedbackFor._id, feedbackForm);
      toast.success('Feedback submitted');
      setFeedbackFor(null);
      setFeedbackForm({ rating: 5, comment: '' });
      await loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit feedback');
    }
  };

  const SidebarNav = [
    { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/dashboard/stories', icon: 'auto_stories', label: 'Stories' },
    { to: '/dashboard/mentorship', icon: 'groups', label: 'Mentorship' },
    { to: '/events', icon: 'event', label: 'Events' },
    { to: '/resources', icon: 'library_books', label: 'Resources' },
    { to: '/forum', icon: 'forum', label: 'Forum' },
    { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen overflow-hidden bg-surface text-on-surface">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-outline-variant/20 flex flex-col z-40">
          <div className="p-6 flex flex-col items-center gap-3 border-b border-outline-variant/20">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-gold-accent p-0.5 overflow-hidden">
                <img
                  alt="User avatar"
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&q=80"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="text-center">
              <h3 className="text-on-surface font-bold text-lg">{firstName}</h3>
              <div className="mt-1 flex justify-center">
                <span className="bg-gold-accent/10 text-gold-accent text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-gold-accent/20">
                  Mentor
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {SidebarNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
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
                  <img
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face&q=80"
                  />
                </button>
                {profileOpen && (
                  <div role="menu" className="absolute right-0 mt-3 w-56 bg-white border border-outline-variant/20 editorial-shadow z-50">
                    <div className="px-5 py-4 border-b border-outline-variant/15">
                      <p className="font-sans-modern text-sm font-semibold text-on-surface line-clamp-1">
                        {user?.name || 'Mentor'}
                      </p>
                      <p className="font-sans-modern text-xs text-outline line-clamp-1">
                        {user?.email}
                      </p>
                    </div>
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
                  Receive requests, manage active mentees, and track mentorship history.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'requests', label: 'Requests', count: counts.requests },
                  { key: 'active', label: 'Active', count: counts.active },
                  { key: 'history', label: 'History', count: counts.history },
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
                {tab === 'requests' && (
                  <div className="bg-white border border-outline-variant/20 editorial-shadow rounded-xl p-8">
                    <div className="flex items-start justify-between gap-4 flex-col md:flex-row md:items-center mb-6">
                      <div>
                        <h2 className="font-serif-alt text-2xl font-bold text-on-surface">Mentorship Requests</h2>
                        <p className="text-on-surface-variant text-sm">Accept or reject incoming mentorship requests.</p>
                      </div>
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        placeholder="Optional response message…"
                        className="w-full md:w-[420px] bg-white border border-outline-variant/25 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-gold-accent/40"
                        rows={2}
                      />
                    </div>

                    {requests.length === 0 ? (
                      <p className="text-on-surface-variant">No pending requests.</p>
                    ) : (
                      <div className="space-y-4">
                        {requests.map((r) => {
                          const menteeName = r?.mentee?.name || r?.menteeName || 'Mentee';
                          const goals = r?.goals || [];
                          const status = r?.status || 'pending';
                          return (
                            <div key={r._id} className="border border-outline-variant/20 rounded-xl p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="text-xs uppercase tracking-widest text-outline font-bold">From</p>
                                  <h3 className="font-serif-alt text-xl font-bold text-on-surface line-clamp-1">
                                    {menteeName}
                                  </h3>
                                  {r?.message && <p className="text-on-surface-variant text-sm mt-2">{r.message}</p>}
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {goals.slice(0, 6).map((g) => (
                                      <span key={g} className="inline-flex px-3 py-1 text-xs bg-surface-container-lowest border border-outline-variant/15 rounded-lg">
                                        {g}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-xs text-outline mt-3">
                                    Preferred start: <span className="font-semibold text-on-surface">{formatDate(r?.preferredStartDate)}</span>
                                  </p>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-outline-variant/25 text-outline">
                                  {status}
                                </span>
                              </div>

                              <div className="mt-5 flex gap-2 flex-wrap">
                                <button
                                  type="button"
                                  disabled={respondingId === r._id}
                                  onClick={() => accept(r._id)}
                                  className="bg-gold-accent text-white px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase hover:opacity-90 disabled:opacity-60"
                                >
                                  {respondingId === r._id ? 'Working…' : 'Accept'}
                                </button>
                                <button
                                  type="button"
                                  disabled={respondingId === r._id}
                                  onClick={() => reject(r._id)}
                                  className="px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase border border-tertiary/30 text-tertiary hover:bg-tertiary/5 disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'active' && (
                  <div className="bg-white border border-outline-variant/20 editorial-shadow rounded-xl p-8">
                    <h2 className="font-serif-alt text-2xl font-bold text-on-surface mb-1">Active Mentees</h2>
                    <p className="text-on-surface-variant text-sm mb-6">Log sessions, mark complete, and submit feedback.</p>

                    {active.length === 0 ? (
                      <p className="text-on-surface-variant">No active mentorships.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {active.map((m) => {
                          const menteeName = m?.mentee?.name || 'Mentee';
                          const started = formatDate(m?.startDate);
                          const sessions = m?.sessions?.length || 0;
                          return (
                            <div key={m._id} className="border border-outline-variant/20 rounded-xl p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-serif-alt text-xl font-bold text-on-surface">{menteeName}</h3>
                                  <p className="text-xs text-outline mt-1">Started: {started || '—'} · Sessions: {sessions}</p>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-outline-variant/25 text-outline">
                                  {m?.status || 'active'}
                                </span>
                              </div>

                              <div className="mt-5 flex gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSessionFor(m);
                                    const today = new Date();
                                    const start = m?.startDate ? new Date(m.startDate) : null;
                                    const defaultDate = start && start > today ? start : today;
                                    setSessionForm({
                                      date: defaultDate.toISOString().slice(0, 10),
                                      duration: 30,
                                      notes: '',
                                      topics: '',
                                    });
                                  }}
                                  className="px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase border border-outline-variant/25 hover:border-gold-accent/40 transition-colors bg-white"
                                >
                                  Log session
                                </button>
                                <button
                                  type="button"
                                  onClick={() => complete(m._id)}
                                  className="bg-gold-accent text-white px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase hover:opacity-90"
                                >
                                  Mark complete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'history' && (
                  <div className="bg-white border border-outline-variant/20 editorial-shadow rounded-xl p-8">
                    <h2 className="font-serif-alt text-2xl font-bold text-on-surface mb-1">Mentorship History</h2>
                    <p className="text-on-surface-variant text-sm mb-6">Completed mentorships and feedback.</p>

                    {history.length === 0 ? (
                      <p className="text-on-surface-variant">No history yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {history.map((m) => (
                          <div key={m._id} className="border border-outline-variant/20 rounded-xl p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-serif-alt text-xl font-bold text-on-surface">
                                  {m?.mentee?.name || 'Mentee'}
                                </h3>
                                <p className="text-xs text-outline mt-1">
                                  Started: {formatDate(m?.startDate)} · Completed: {formatDate(m?.completedAt)}
                                </p>
                              </div>
                              <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-outline-variant/25 text-outline">
                                {m?.status || 'completed'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Session modal */}
            {sessionFor && (
              <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-6">
                <div className="w-full max-w-lg bg-white border border-outline-variant/20 editorial-shadow p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-serif-alt text-xl font-bold text-on-surface">Log Session</h3>
                      <p className="text-xs text-outline">Mentee: {sessionFor?.mentee?.name || 'Mentee'}</p>
                    </div>
                    <button type="button" onClick={() => setSessionFor(null)} className="text-outline hover:text-on-surface">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Date</label>
                      <input
                        type="date"
                        value={sessionForm.date}
                        onChange={(e) => setSessionForm((f) => ({ ...f, date: e.target.value }))}
                        className="w-full bg-white border border-outline-variant/25 rounded-lg px-4 py-2 text-sm"
                      />
                      {sessionFor?.startDate && (
                        <p className="mt-2 text-[11px] text-outline">
                          Must be on/after start date: <span className="font-semibold text-on-surface">{formatDate(sessionFor.startDate)}</span>
                        </p>
                      )}
                      {sessionFor?.startDate && new Date(sessionFor.startDate) > new Date() && (
                        <p className="mt-1 text-[11px] text-tertiary">
                          You can’t log sessions yet because this mentorship starts in the future.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Duration (min)</label>
                      <input
                        type="number"
                        min={15}
                        value={sessionForm.duration}
                        onChange={(e) => setSessionForm((f) => ({ ...f, duration: e.target.value }))}
                        className="w-full bg-white border border-outline-variant/25 rounded-lg px-4 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Topics (comma-separated)</label>
                    <input
                      value={sessionForm.topics}
                      onChange={(e) => setSessionForm((f) => ({ ...f, topics: e.target.value }))}
                      className="w-full bg-white border border-outline-variant/25 rounded-lg px-4 py-2 text-sm"
                      placeholder="Leadership, career, negotiation…"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Notes</label>
                    <textarea
                      value={sessionForm.notes}
                      onChange={(e) => setSessionForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full bg-white border border-outline-variant/25 rounded-lg px-4 py-2 text-sm"
                      rows={4}
                    />
                  </div>
                  <div className="mt-5 flex gap-2 justify-end">
                    <button type="button" onClick={() => setSessionFor(null)} className="px-4 py-2 text-xs font-bold tracking-wider uppercase border border-outline-variant/25">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitSession}
                      disabled={
                        new Date(sessionForm.date) > new Date() ||
                        Number(sessionForm.duration) < 15
                      }
                      className="bg-gold-accent text-white px-4 py-2 text-xs font-bold tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save session
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
                      <p className="text-xs text-outline">Rate your mentee’s progress.</p>
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
                      placeholder="Write a short feedback note…"
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
          </div>
        </main>
      </div>
    </div>
  );
}

