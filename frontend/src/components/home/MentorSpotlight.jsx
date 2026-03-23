import { useEffect, useRef, useState } from 'react';
import { mentorApi } from '../../api/mentorApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PLACEHOLDER_MENTORS = [
  { _id: 'pm1', name: 'Victoria Sterling',   title: 'Creative Director',   rating: 5, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbOKKtm_Y5j64PDIqDPXf1551oPdzqCjXgpDWZc1w_rGJReEpbWvDO9EfgE74wuVxh0od5w5tSDjWtodWJeSHrNIbcDGEoVNut1QYoNxoldGHisk8cfPJM7Hf7QwjK6pezhlOPiu-MauKYFNetScA9kYMMj2_SImvo7E2-1pC0B47dRgjYEH1KJpV9QmfldKVuV6bS44o0s6_B-hTVSeIhS7EPYNm7811lcM-_gvjT0hwNRMHmk3wPaVW6nE6nOEkGaVpkcwzyYg' },
  { _id: 'pm2', name: 'Maya Rodriguez',       title: 'FinTech Operations',  rating: 5, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaZIXaandbc6zTJtLRYhyoyR16R2v9-g8G9iTdIVfeDw4Q1or7FNNhH2AC2GjbLNf1QsOzxE0_gu8ySA2XoB1nnSIF2IzClPkbSHflnyPG8co-QfsMFlsCwmFOiUrdrGHuKOVzhXlDIMcYp5Q4LVa6jeW-ophoKRpkUy2gwOHohYrtZNl550DTosrWbs60oixZlv8AshBRz7XdVO7Y1Ci4kMFytMEfi4xA6onx6MTpHXa8m4byDDA8OBtD81YsLqDwNvS58RDB2A' },
  { _id: 'pm3', name: 'Dr. Isabella Thorne',  title: 'Executive Coaching',  rating: 4, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3dk0Ju-FCZsh4CNOSq1KVLwXGMuCRzBRwPH3_ugAdKpnCSGCl9_72AkbGGDdF5MtDxFBVbfcZk0sBj3ogKMJU4Hmo_jt-vHeVJyScgewd2qunbOi4gjU22zWP0zuiQV715Y_YBGf0YUYIVHdH5ZMDaV16GbdYXepN4o8Q7yaM7GkcPW90UyNhSfLCXGZ2FwcUrmUNk7Al22zUbOv4OImiue9Nu-62owwS03xQsSdfOd1KVg_wOwN90kW4bWnaUnk5ECIBpZs0bQ' },
  { _id: 'pm4', name: 'Cynthia Lane',          title: 'Product Management', rating: 5, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVPltQ3CfBfPJo63JjbimE7JDG-Q-k6XLaAT2j_-z-w6q-11IzSkZBH0edo7ykVojw1ZhlEkhPFAITYaEdaJIvZNKdMZHwKha--HtamWfcOlJpn2ibDUF25GztMoMxGWMJiF7bqbKR_OWxIoRiJZkq-6dlokJRad_vIa6OBcOIzx60GS9os7KAvexAs0ptvmOUZ9MN-JnVV6lJ_rRdrJAuEnVpBEZBw4iBv95ZAWb_qieF6CPBX9PM1Ht0r7tyu3mbvy9lVSEB0w' },
  { _id: 'pm5', name: 'Jasmine Kaur',          title: 'Venture Capital',    rating: 5, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5dwxDFxPQkIyCUQ7zsUCk8Q-2sCEbZXlALyeOxNvemQwRKYpBBn8Vr-gQchfWE504kztG3ne3VcyaEJiz-k6rpaKtVaNR9WCJFLV29sW0-oBCxXSJ0oV_2hGr2HGZpp9GXb0-joQNm0msut7Ipe5UllrnveFflSeo6GXG0p0w30Lj6WQQSEFy0rTz4jPEkkMzFwQwSfBY2hY4UJnJKpneqjriCmE85LXlrUfDcfC2mssUTrGZT61TSiUG1h8MzkQxE6ZDorwBw' },
];

function Stars({ count }) {
  return (
    <div className="flex gap-1 mb-6">
      {[1,2,3,4,5].map((n) => (
        <span key={n} className={n <= count ? 'text-gold' : 'text-gray-700'}>★</span>
      ))}
    </div>
  );
}

export default function MentorSpotlight() {
  const { isAuthenticated } = useAuth();
  const [mentors, setMentors] = useState(PLACEHOLDER_MENTORS);
  const scrollRef = useRef(null);

  useEffect(() => {
    mentorApi.getAll({ limit: 5 })
      .then((res) => {
        const data = res.data?.mentors || res.data?.data?.mentors || [];
        if (data.length >= 3) {
          setMentors(data.slice(0, 5).map((m) => ({
            _id: m._id,
            name: m.name,
            title: m.title || m.role || 'Mentor',
            rating: 5,
            avatar: m.profilePicture || m.avatar || null,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const handleRequest = async (mentorId) => {
    if (!isAuthenticated) { toast.error('Log in to send a mentorship request'); return; }
    try {
      await mentorApi.sendRequest(mentorId, { message: 'I would love to connect!' });
      toast.success('Mentorship request sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const scroll = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  return (
    <section className="py-24 bg-dark-card overflow-hidden">
      <div className="container mx-auto px-6 mb-12 flex justify-between items-end">
        <div>
          <h2 className="font-cormorant text-5xl mb-4">Elite Mentors</h2>
          <p className="text-gray-400 font-dm-sans max-w-md">
            Access direct guidance from women who have paved the way in Fortune 500 companies.
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => scroll(-1)}
            className="w-12 h-12 rounded-full border border-gold/30 flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={() => scroll(1)}
            className="w-12 h-12 rounded-full border border-gold/30 flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-auto pb-8 px-6 no-scrollbar snap-x cursor-grab"
      >
        {mentors.map((m) => (
          <div key={m._id}
            className="min-w-[320px] bg-dark-bg p-8 rounded-eight border border-gold/10 snap-center hover:border-gold/40 transition-all">
            <div className="flex flex-col items-center text-center">
              {m.avatar ? (
                <img src={m.avatar} alt={m.name}
                  className="w-24 h-24 rounded-full border-2 border-gold/30 p-1 mb-6 object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full border-2 border-gold/30 mb-6 flex items-center justify-center bg-dark-card text-gold font-cormorant text-3xl">
                  {m.name?.[0]?.toUpperCase()}
                </div>
              )}
              <h5 className="font-playfair text-xl mb-1">{m.name}</h5>
              <span className="text-[10px] uppercase tracking-widest text-gold/80 mb-4">{m.title}</span>
              <Stars count={m.rating} />
              <button
                onClick={() => handleRequest(m._id)}
                className="w-full py-3 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-black transition-all"
              >
                Request Mentorship
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
