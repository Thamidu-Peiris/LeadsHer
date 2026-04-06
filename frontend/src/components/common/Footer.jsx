import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success('Thank you for subscribing!');
    setEmail('');
  };

  return (
    <footer className="w-full bg-pink-100 text-neutral-900">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-16 px-8 md:px-16 py-24 w-full">
        {/* Brand */}
        <div className="col-span-1 md:col-span-1">
          <div className="font-headline text-5xl font-bold text-neutral-900 mb-8">LEADSHER</div>
          <p className="text-neutral-800 font-body text-sm leading-relaxed max-w-xs">
            Curating a movement where every woman's leadership is a story of impact, and every impact is a legacy.
          </p>
        </div>

        {/* Archives */}
        <div className="space-y-6">
          <h5 className="text-neutral-900 font-body text-xs tracking-widest uppercase font-bold">The Archives</h5>
          <ul className="space-y-4 font-body text-sm tracking-widest uppercase">
            {[
              { to: '/stories', label: 'Collections' },
              { to: '/events',  label: 'Gatherings' },
              { to: '/mentors', label: 'Curators' },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-neutral-900 hover:text-black transition-opacity duration-200">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div className="space-y-6">
          <h5 className="text-neutral-900 font-body text-xs tracking-widest uppercase font-bold">Account</h5>
          <ul className="space-y-4 font-body text-sm tracking-widest uppercase">
            {[
              { to: '/login',     label: 'Sign In' },
              { to: '/register',  label: 'Join' },
              { to: '/dashboard', label: 'Dashboard' },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-neutral-900 hover:text-black transition-opacity duration-200">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="space-y-8">
          <h5 className="text-neutral-900 font-body text-xs tracking-widest uppercase font-bold">The Newsletter</h5>
          <p className="text-neutral-800 text-sm italic font-body">Weekly insights for the modern visionary.</p>
          <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="YOUR EMAIL ADDRESS"
              className="bg-transparent border-b border-neutral-400 text-neutral-900 placeholder:text-neutral-500 font-body text-xs py-2 focus:outline-none focus:border-neutral-900 transition-colors"
            />
            <button
              type="submit"
              className="bg-neutral-900 text-white py-4 font-label text-xs tracking-widest uppercase font-bold hover:bg-neutral-800 transition-all"
            >
              Subscribe
            </button>
          </form>
          <div className="flex gap-6 pt-4">
            <a href="#" className="text-neutral-900 hover:opacity-70 transition-opacity" aria-label="Share">
              <span className="material-symbols-outlined">share</span>
            </a>
            <a href="#" className="text-neutral-900 hover:opacity-70 transition-opacity" aria-label="Web">
              <span className="material-symbols-outlined">public</span>
            </a>
            <a href="#" className="text-neutral-900 hover:opacity-70 transition-opacity" aria-label="Email">
              <span className="material-symbols-outlined">mail</span>
            </a>
          </div>
        </div>
      </div>

      <div className="px-8 md:px-16 py-8 border-t border-neutral-900/10 text-center">
        <p className="text-neutral-900 font-body text-sm tracking-widest uppercase">
          © {new Date().getFullYear()} LEADSHER. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
