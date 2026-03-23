import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/';

  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  if (isAuthenticated) { navigate(from, { replace: true }); return null; }

  const handleChange = (e) => {
    setError('');
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full bg-white min-h-[calc(100vh-4rem)]">

      {/* ─── LEFT PANEL ─────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-[42%] flex-shrink-0 relative overflow-hidden px-14 pt-24 pb-14 justify-between sticky top-16 self-start h-[calc(100vh-4rem)]"
        style={{
          background: '#FDF0F3',
          backgroundImage:
            'radial-gradient(circle at 15% 15%, rgba(212,175,55,0.10) 0%, transparent 45%),' +
            'radial-gradient(circle at 85% 60%, rgba(218,112,143,0.12) 0%, transparent 45%)',
        }}
      >
        {/* Quote */}
        <div className="z-10 space-y-10 max-w-xs">
          <blockquote className="font-accent italic text-[2.2rem] leading-[1.15] text-tertiary-container">
            "Leadership begins the moment you decide to lift someone else."
          </blockquote>

          <div className="space-y-7">
            {[
              { quote: 'Signing back in feels like coming home. This community never stops giving.', name: 'Priya M.', title: 'Founder' },
              { quote: 'Every session with my mentor moves the needle. I keep coming back.', name: 'Dana K.', title: 'Product Lead', indent: true },
            ].map(({ quote, name, title, indent }) => (
              <div key={name} className={`flex flex-col gap-1 ${indent ? 'ml-6' : ''} border-l-2 border-gold-accent/40 pl-4`}>
                <p className="font-sans-modern text-sm text-on-surface-variant italic leading-relaxed">
                  "{quote}"
                </p>
                <span className="text-[10px] font-brand font-semibold tracking-[0.15em] uppercase text-outline">
                  {name} · {title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stat badge */}
        <div className="z-10">
          <div className="inline-flex items-center gap-2.5 bg-white px-5 py-2.5 shadow-sm border border-outline-variant/20">
            <span className="w-2 h-2 rounded-full bg-gold-accent animate-pulse flex-shrink-0" />
            <p className="font-sans-modern text-sm font-medium text-on-surface">
              <span className="text-gold-accent font-bold">2,400+</span> women leaders inside
            </p>
          </div>
        </div>

        {/* Decorative rings */}
        <div className="absolute -bottom-24 -left-24 w-[26rem] h-[26rem] border border-gold-accent/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-[26rem] h-[26rem] border border-tertiary/8 rounded-full pointer-events-none" />
      </aside>

      {/* ─── RIGHT PANEL ────────────────────────────────── */}
      <section className="flex-1 flex flex-col">

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 pt-24 pb-12">
          <div className="w-full max-w-lg mx-auto">

            {/* Heading */}
            <h2 className="font-accent text-4xl text-on-surface mb-1">Welcome Back</h2>
            <p className="font-sans-modern text-sm text-on-surface-variant mb-10">
              Sign in to continue your leadership journey
            </p>

            {/* Error */}
            {error && (
              <div className="mb-6 px-4 py-3 border-l-2 border-error bg-error-container/50 text-on-error-container font-sans-modern text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Email */}
              <div className="group">
                <label className="block font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline mb-2 group-focus-within:text-primary transition-colors">
                  Email Address
                </label>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@leadsher.com" autoComplete="email"
                  className="w-full bg-white border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-0 py-2.5 font-sans-modern text-base text-on-surface placeholder:text-outline/40 transition-colors outline-none"
                />
              </div>

              {/* Password */}
              <div className="group">
                <div className="flex justify-between items-center mb-2">
                  <label className="font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline group-focus-within:text-primary transition-colors">
                    Password
                  </label>
                  <Link to="/forgot-password" className="font-sans-modern text-[10px] text-primary tracking-wider hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    name="password" value={form.password} onChange={handleChange}
                    placeholder="••••••••••••" autoComplete="current-password"
                    className="w-full bg-white border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-0 py-2.5 pr-9 font-sans-modern text-base text-on-surface placeholder:text-outline/40 transition-colors outline-none"
                  />
                  <button
                    type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">{showPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 space-y-4">
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-gold-accent text-white py-4 font-brand font-bold text-sm tracking-[0.2em] uppercase shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  {loading
                    ? <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    : <><span>Sign In</span><span className="material-symbols-outlined text-base text-white">arrow_forward</span></>
                  }
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-outline-variant/30" />
                  <span className="font-sans-modern text-[10px] text-outline uppercase tracking-widest whitespace-nowrap">
                    Or continue with
                  </span>
                  <div className="flex-1 h-px bg-outline-variant/30" />
                </div>

                {/* OAuth */}
                <div className="grid grid-cols-2 gap-3">
                  <button type="button"
                    className="flex items-center justify-center gap-2.5 border border-outline-variant py-3.5 font-sans-modern text-sm font-medium hover:border-primary hover:bg-white transition-all">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button type="button"
                    className="flex items-center justify-center gap-2.5 border border-outline-variant py-3.5 font-sans-modern text-sm font-medium hover:border-primary hover:bg-white transition-all">
                    <svg className="w-4 h-4 fill-[#0077b5] flex-shrink-0" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    LinkedIn
                  </button>
                </div>
              </div>
            </form>

            <p className="font-sans-modern text-sm text-outline text-center mt-8">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">
                Join LeadsHer
              </Link>
            </p>
          </div>
        </div>

      </section>
    </div>
  );
}
