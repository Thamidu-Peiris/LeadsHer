import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

export default function EventDetailPage() {
  const { id }            = useParams();
  const { user, isAuthenticated, canManageEvents } = useAuth();
  const navigate          = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    eventApi.getById(id)
      .then((res) => {
        const e = res.data?.data?.event || res.data;
        setEvent(e);
        const isReg = e.registeredAttendees?.some(
          (a) => (a._id || a) === user?._id
        );
        setRegistered(isReg);
      })
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false));
  }, [id]);

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

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  if (!event)  return null;

  const isOwner    = user?._id === (event.createdBy?._id || event.createdBy);
  const spotsLeft  = (event.capacity || 0) - (event.registeredAttendees?.length || 0);
  const isFull     = spotsLeft <= 0;
  const dateStr    = new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/events" className="hover:text-brand-600">Events</Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-xs">{event.title}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <span className="badge bg-brand-100 text-brand-700">{event.category}</span>
        <span className={`badge ${
          event.status === 'upcoming' ? 'bg-green-100 text-green-700' :
          event.status === 'ongoing'  ? 'bg-yellow-100 text-yellow-700' :
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
      <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-100">
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
            <Link to={`/events/${id}/edit`} className="btn-secondary">Edit Event</Link>
            <button onClick={handleDelete} className="btn-ghost text-red-500 hover:bg-red-50">Delete</button>
          </>
        )}
      </div>
    </div>
  );
}
