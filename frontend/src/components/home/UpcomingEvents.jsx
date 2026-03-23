import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventApi } from '../../api/eventApi';
import EventCard from '../events/EventCard';
import Spinner from '../common/Spinner';

export default function UpcomingEvents() {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventApi.getAll({ status: 'upcoming', limit: 3 })
      .then((res) => setEvents(res.data?.data?.events || res.data?.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 flex justify-center"><Spinner /></div>
    </section>
  );

  if (!events.length) return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="section-title mb-2">Upcoming Events</h2>
        <p className="section-subtitle">No events scheduled yet. Check back soon!</p>
        <Link to="/events" className="btn-primary mt-6 inline-flex">Browse Events</Link>
      </div>
    </section>
  );

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title">Upcoming Events</h2>
            <p className="section-subtitle">Join webinars, workshops & networking sessions</p>
          </div>
          <Link to="/events" className="btn-secondary text-sm hidden sm:inline-flex">View all →</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((e) => <EventCard key={e._id} event={e} />)}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link to="/events" className="btn-secondary">View all events</Link>
        </div>
      </div>
    </section>
  );
}
