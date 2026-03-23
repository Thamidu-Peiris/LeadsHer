import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mentorApi } from '../../api/mentorApi';
import toast from 'react-hot-toast';

const FALLBACK_MENTORS = [
  { _id: '1', name: 'Dr. Seraphina Hall',  specialty: 'Organizational Psychology', tags: ['Conflict Res', 'Team Culture'],   initials: 'SH' },
  { _id: '2', name: 'Isabella Ross',        specialty: 'Venture Capital & Growth',   tags: ['Fundraising', 'Scale Ups'],      initials: 'IR' },
  { _id: '3', name: 'Naomi Wattson',        specialty: 'Sustainable Innovation',      tags: ['Eco-Strategy', 'Brand Vision'],  initials: 'NW' },
  { _id: '4', name: 'Camille Durand',       specialty: 'Executive Leadership',         tags: ['Strategy', 'Negotiation'],       initials: 'CD' },
];

const BG_PALETTE = [
  'from-primary/30 to-secondary/20',
  'from-tertiary/30 to-primary/20',
  'from-secondary/30 to-tertiary/20',
  'from-primary/20 to-tertiary/30',
];

const MENTOR_IMAGES = [
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=700&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=700&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=700&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=500&h=700&fit=crop&crop=face&q=80',
];

export default function MentorSpotlight() {
  const { isAuthenticated } = useAuth();
  const [mentors, setMentors] = useState(FALLBACK_MENTORS);

  useEffect(() => {
    mentorApi.getAll({ limit: 4 })
      .then((res) => {
        const list = res.data?.mentors || res.data?.data?.mentors || [];
        if (list.length > 0) setMentors(list.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  const handleRequest = async (mentorId) => {
    if (!isAuthenticated) { toast.error('Sign in to request mentorship'); return; }
    try {
      await mentorApi.sendRequest(mentorId, { message: 'I would love to connect!' });
      toast.success('Mentorship request sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  return (
    <section className="py-32 bg-[#F1EFEA]">
      <div className="container mx-auto px-8 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-16">
          <div>
            <h2 className="font-headline text-5xl mb-2">Mentor Spotlight</h2>
            <p className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant/70">
              The Women Shaping Tomorrow
            </p>
          </div>
          <div className="flex gap-4 mt-8 md:mt-0">
            <button className="w-12 h-12 border border-outline-variant flex items-center justify-center hover:bg-white transition-colors">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-12 h-12 border border-outline-variant flex items-center justify-center hover:bg-white transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-8 pb-12 no-scrollbar">
          {mentors.map((m, i) => {
            const tags = m.tags || (m.expertise ? m.expertise.slice(0, 2) : ['Leadership', 'Mentoring']);
            const specialty = m.specialty || m.title || 'Expert Mentor';

            return (
              <div
                key={m._id}
                className="min-w-[300px] md:min-w-[340px] bg-surface-container-lowest p-8 editorial-shadow border border-outline-variant/10 flex-shrink-0"
              >
                {/* Framed portrait */}
                <div className="relative w-36 mx-auto mb-8">
                  <div className="absolute -top-2 -left-2 w-full h-full border border-gold-accent/35 pointer-events-none" style={{ aspectRatio: '3/4' }} />
                  <div className="relative border border-gold-accent/60 overflow-hidden shadow-sm" style={{ aspectRatio: '3/4' }}>
                    <img
                      src={MENTOR_IMAGES[i % MENTOR_IMAGES.length]}
                      alt={m.name}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${BG_PALETTE[i % BG_PALETTE.length]} opacity-15`} />
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-tertiary rounded-full flex items-center justify-center border-2 border-white">
                    <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h4 className="font-serif-alt text-2xl mb-1">{m.name}</h4>
                  <p className="font-label text-[10px] tracking-widest uppercase text-primary mb-4">{specialty}</p>
                  <div className="flex justify-center gap-1 text-[#D4AF37]">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-center mb-8">
                  {tags.map((tag, ti) => (
                    <span
                      key={tag}
                      className={`font-label text-[10px] tracking-wider uppercase px-3 py-1 ${
                        ti % 2 === 0
                          ? 'bg-secondary-container/20 text-secondary'
                          : 'bg-primary-container/10 text-primary'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleRequest(m._id)}
                  className="w-full border border-primary text-primary py-4 font-label text-xs tracking-widest uppercase hover:bg-secondary-container/20 transition-all"
                >
                  Request Guidance
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
