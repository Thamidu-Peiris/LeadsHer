import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const NAV_ITEMS = ['Our Ethos', 'Success Stories', 'Mentor Registry', 'Impact Reports', 'Careers'];

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleDigest = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success('You\'re subscribed to the editorial digest!');
    setEmail('');
  };

  return (
    <footer className="pt-24 pb-12 bg-dark-bg border-t border-gold/20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          {/* Brand */}
          <div className="md:col-span-5">
            <div className="font-cormorant text-4xl mb-6 tracking-tight">LeadsHer.</div>
            <p className="text-gray-500 text-sm max-w-sm mb-8 font-dm-sans leading-relaxed">
              An architectural space dedicated to the amplification of feminine leadership through narrative and network.
            </p>
            <div className="flex gap-6">
              {/* Facebook */}
              <a href="#" className="text-gold hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* Twitter/X */}
              <a href="#" className="text-gold hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" className="text-gold hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.166.054 1.8.249 2.223.414.56.217.96.477 1.38.896.419.42.679.819.896 1.38.164.422.36 1.057.413 2.223.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.166-.249 1.8-.414 2.223-.217.56-.477.96-.896 1.38-.42.419-.819.679-1.38.896-.422.164-1.057.36-2.223.413-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.166-.054-1.8-.249-2.223-.414-.56-.217-.96-.477-1.38-.896-.419-.42-.679-.819-.896-1.38-.164-.422-.36-1.057-.413-2.223-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.054-1.166.249-1.8.414-2.223.217-.56.477-.96.896-1.38.42-.419.819-.679 1.38-.896.422-.164 1.057-.36 2.223-.413 1.266-.058 1.646-.07 4.85-.07zM12 0C8.741 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.132 5.775.072 7.053.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.058-1.28.072-1.689.072-4.948s-.014-3.668-.072-4.948c-.06-1.277-.262-2.148-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.668.014 15.259 0 12 0z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="md:col-span-3">
            <h6 className="font-montserrat text-xs uppercase tracking-widest font-bold mb-8">Navigation</h6>
            <ul className="space-y-4 text-sm text-gray-500 font-dm-sans">
              <li><Link to="/"        className="hover:text-gold transition-colors">Home</Link></li>
              <li><Link to="/stories" className="hover:text-gold transition-colors">Stories</Link></li>
              <li><Link to="/mentors" className="hover:text-gold transition-colors">Mentors</Link></li>
              <li><Link to="/events"  className="hover:text-gold transition-colors">Events</Link></li>
              <li><Link to="/register" className="hover:text-gold transition-colors">Join LeadsHer</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4">
            <h6 className="font-montserrat text-xs uppercase tracking-widest font-bold mb-8">Editorial Digest</h6>
            <p className="text-sm text-gray-500 mb-6 font-dm-sans">
              Receive curated insights and community updates directly.
            </p>
            <form onSubmit={handleDigest} className="flex">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email address"
                className="bg-transparent border border-gold/30 rounded-l-eight px-4 py-3 text-sm focus:border-gold focus:ring-0 w-full outline-none text-white placeholder-gray-600"
              />
              <button type="submit"
                className="bg-gold text-black font-bold px-6 py-3 rounded-r-eight hover:bg-white transition-colors text-sm whitespace-nowrap">
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-[0.2em] text-gray-600 font-montserrat">
          <p>© {new Date().getFullYear()} LeadsHer Platform. All Rights Reserved.</p>
          <div className="flex gap-8 mt-4 md:mt-0">
            <a href="#" className="hover:text-gold transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gold transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
