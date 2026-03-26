import { useEffect, useState } from 'react';
import { mentorApi } from '../api/mentorApi';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import toast from 'react-hot-toast';

export default function MentorsPage() {
  const { isAuthenticated } = useAuth();
  const [mentors, setMentors]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);

  const fetchMentors = (p = 1) => {
    setLoading(true);
    mentorApi.getAll({ page: p, limit: 9, search: search || undefined })
      .then((res) => {
        const data = res.data;
        setMentors(data.mentors || data.data?.mentors || []);
        setPagination(data.pagination || { page: p, totalPages: 1 });
      })
      .catch(() => setMentors([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMentors(page); }, [page]);

  const handleRequest = async (mentorId) => {
    if (!isAuthenticated) { toast.error('Log in to send a request'); return; }
    try {
      await mentorApi.sendRequest(mentorId, { message: 'I would love to connect!' });
      toast.success('Mentorship request sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10">
      <div className="mb-8">
        <h1 className="section-title">Find a Mentor</h1>
        <p className="section-subtitle">Connect with experienced women leaders who can guide your journey</p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-surface-container-lowest rounded-2xl border border-gray-100 dark:border-outline-variant/20 shadow-sm p-4 mb-8 flex gap-2">
        <input
          type="text" placeholder="Search mentors by name or expertise…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchMentors(1)}
          className="input flex-1"
        />
        <button onClick={() => fetchMentors(1)} className="btn-primary px-6">Search</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : mentors.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 dark:text-on-surface-variant text-lg">No mentors found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((m) => (
              <div key={m._id} className="card p-6 flex flex-col">
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-xl">
                    {m.name?.[0]?.toUpperCase() || 'M'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-on-surface">{m.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-on-surface-variant">{m.title || 'Mentor'}</p>
                  </div>
                </div>

                {m.bio && (
                  <p className="text-sm text-gray-600 dark:text-on-surface-variant line-clamp-3 mb-4 flex-1">{m.bio}</p>
                )}

                {m.expertise?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {m.expertise.slice(0, 4).map((ex) => (
                      <span key={ex} className="badge bg-brand-50 text-brand-700 text-xs">{ex}</span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleRequest(m._id)}
                  className="btn-primary w-full mt-auto text-sm"
                >
                  Request Mentorship
                </button>
              </div>
            ))}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}
    </div>
  );
}
