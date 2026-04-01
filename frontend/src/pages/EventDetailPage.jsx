import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

export default function EventDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated, canManageEvents } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    eventApi.getById(id)
      .then((res) => {
        const e = res.data?.data?.event || res.data;
        setEvent(e);
        const isReg = e.registeredAttendees?.some(
          (a) => (a._id || a) === user?._id
        );
        setRegistered(isReg);

        const isOwner = user?._id === (e.createdBy?._id || e.createdBy);
        if (canManageEvents || isOwner) {
          eventApi.getAttendees(id).then(r => setAttendees(r.data?.data?.attendees || []));
        }
      })
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false));
  }, [id, canManageEvents, user, navigate]);

  const handleRegister = async () => {
    if (!isAuthenticated) { toast.error('Log in to register'); return; }
    setRegistering(true);
    try {
      await eventApi.register(id);
      setRegistered(true);
      setEvent((e) => ({ ...e, registeredAttendees: [...(e.registeredAttendees || []), user._id] }));
      toast.success('Registered successfully! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setRegistering(false); }
  };

  const handleUnregister = async () => {
    if (!window.confirm('Unregister from this event?')) return;
    setRegistering(true);
    try {
      await eventApi.unregister(id);
      setRegistered(false);
      setEvent((e) => ({
        ...e,
        registeredAttendees: e.registeredAttendees.filter((a) => (a._id || a) !== user._id),
      }));
      toast.success('Unregistered');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unregister');
    } finally { setRegistering(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await eventApi.delete(id);
      toast.success('Event deleted');
      navigate('/events');
    } catch { toast.error('Failed to delete'); }
  };

  const handleCancelEvent = async () => {
    if (!window.confirm('Cancel this event? Participants will be notified.')) return;
    try {
      await eventApi.update(id, { status: 'cancelled' });
      setEvent(e => ({ ...e, status: 'cancelled' }));
      toast.success('Event cancelled');
    } catch { toast.error('Failed to cancel event'); }
  };

  const handleIssueCertificate = async (attendeeUserId) => {
    try {
      await eventApi.issueCertificate(id, attendeeUserId);
      setAttendees(prev => prev.map(a => (a.user?._id || a.user) === attendeeUserId ? { ...a, certificateIssued: true, status: 'attended' } : a));
      toast.success('Certificate issued');
    } catch { toast.error('Failed to issue certificate'); }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      await eventApi.submitFeedback(id, feedback);
      toast.success('Feedback submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  if (!event) return null;

  const isOwner = user?._id === (event.createdBy?._id || event.createdBy);
  const spotsLeft = (event.capacity || 0) - (event.registeredAttendees?.length || 0);
  const isFull = spotsLeft <= 0;
  const dateStr = new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/events" className="hover:text-brand-600">Events</Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-xs">{event.title}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <span className="badge bg-brand-100 text-brand-700">{event.category}</span>
        <span className={`badge ${event.status === 'upcoming' ? 'bg-green-100 text-green-700' :
            event.status === 'ongoing' ? 'bg-yellow-100 text-yellow-700' :
              event.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-500'
          }`}>{event.status}</span>
      </div>

      <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mt-3 mb-6">
        {event.title}
      </h1>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4 mb-8 p-5 bg-brand-50 rounded-2xl border border-brand-100">
        <div>
          <p className="text-xs text-gray-500 mb-1">Date</p>
          <p className="text-sm font-medium text-gray-900">{dateStr}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Time</p>
          <p className="text-sm font-medium text-gray-900">{event.startTime} – {event.endTime} ({event.timezone || 'UTC'})</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Format</p>
          <p className="text-sm font-medium text-gray-900 capitalize">{event.type}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Capacity</p>
          <p className="text-sm font-medium text-gray-900">
            {event.registeredAttendees?.length || 0}/{event.capacity}
            <span className={`ml-2 text-xs ${isFull ? 'text-red-500' : 'text-green-600'}`}>
              ({isFull ? 'Full' : `${spotsLeft} spots left`})
            </span>
          </p>
        </div>
        {event.speakers?.length > 0 && (
          <div className="col-span-2">
            <p className="text-xs text-gray-500 mb-1">Speakers</p>
            <div className="flex gap-2 flex-wrap mt-1">
              {event.speakers.map(s => (
                <span key={s._id || s} className="text-sm bg-white border border-brand-200 px-3 py-1 rounded-full text-brand-700">{s.name || 'Unknown Speaker'}</span>
              ))}
            </div>
          </div>
        )}
        {event.location?.virtualLink && (
          <div className="col-span-2">
            <p className="text-xs text-gray-500 mb-1">Link</p>
            <a href={event.location.virtualLink} target="_blank" rel="noreferrer"
              className="text-sm text-brand-600 hover:underline break-all">
              {event.location.virtualLink}
            </a>
          </div>
        )}
        {event.location?.venue && (
          <div className="col-span-2">
            <p className="text-xs text-gray-500 mb-1">Venue</p>
            <p className="text-sm text-gray-900">{event.location.venue}, {event.location.city}</p>
          </div>
        )}
      </div>

      {/* Description */}
      <h2 className="font-display text-xl font-semibold text-gray-900 mb-3">About this event</h2>
      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap mb-8">{event.description}</p>

      {/* Tags */}
      {event.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {event.tags.map((t) => <span key={t} className="badge bg-gray-100 text-gray-600">#{t}</span>)}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-100 mb-10">
        {event.status === 'upcoming' && (
          registered ? (
            <button onClick={handleUnregister} disabled={registering} className="btn-secondary border-red-200 text-red-500 hover:bg-red-50">
              {registering ? <Spinner size="sm" /> : 'Unregister'}
            </button>
          ) : (
            <button onClick={handleRegister} disabled={registering || isFull} className="btn-primary py-2.5 px-6">
              {registering ? <Spinner size="sm" className="mx-auto" /> : isFull ? 'Event Full' : 'Register Now'}
            </button>
          )
        )}

        {(isOwner || canManageEvents) && (
          <>
            <Link to={`/events/${id}/edit`} className="btn-secondary">Edit</Link>
            {event.status !== 'cancelled' && (
              <button onClick={handleCancelEvent} className="btn-secondary border-orange-200 text-orange-600 hover:bg-orange-50">Cancel Event</button>
            )}
            <button onClick={handleDelete} className="btn-ghost text-red-500 hover:bg-red-50">Delete</button>
          </>
        )}
      </div>

      {/* Feedback Section (if completed and registered) */}
      {event.status === 'completed' && registered && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-10">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Submit Feedback</h3>
          <form onSubmit={submitFeedback} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
              <input type="number" min="1" max="5" value={feedback.rating} onChange={e => setFeedback({ ...feedback, rating: Number(e.target.value) })} className="input max-w-[100px]" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
              <textarea value={feedback.comment} onChange={e => setFeedback({ ...feedback, comment: e.target.value })} className="input h-24" placeholder="What did you think?" />
            </div>
            <button type="submit" disabled={submittingFeedback} className="btn-primary">
              {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      )}

      {/* Attendees Section (for Admin/Host) */}
      {(isOwner || canManageEvents) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Attendees ({attendees.length})</h3>
          {attendees.length === 0 ? (
            <p className="text-gray-500 text-sm">No attendees yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    {canManageEvents && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendees.map(a => (
                    <tr key={a._id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{a.user?.name || 'Unknown User'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {a.certificateIssued ? <span className="text-green-600 font-medium">Certificate Issued</span> : a.status}
                      </td>
                      {canManageEvents && (
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                          {!a.certificateIssued && event.status === 'completed' && (
                            <button onClick={() => handleIssueCertificate(a.user?._id)} className="text-brand-600 hover:text-brand-800 font-medium text-sm">Issue Certificate</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
