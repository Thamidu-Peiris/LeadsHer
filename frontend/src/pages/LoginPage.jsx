import { useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/';

  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const leftPanelImages = [
    'images/image1.png',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&h=1200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&h=1200&fit=crop&q=80',
  ];
  const leftPanelImage = useMemo(
    () => leftPanelImages[Math.floor(Math.random() * leftPanelImages.length)],
    []
  );

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
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED' && form.email) {
        toast.error('Verify your email first. Use the code we sent you.');
        navigate(`/verify-email?email=${encodeURIComponent(form.email.trim())}`);
        setError('');
        return;
      }
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full bg-[#FFE6F5] dark:bg-[#120d1a] min-h-screen min-h-[100dvh]">

      {/* ─── LEFT PANEL ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-[42%] flex-shrink-0 relative overflow-hidden px-14 pt-24 pb-14 justify-end self-start min-h-screen min-h-[100dvh]">
        <img
          src={leftPanelImage}
          alt="Women leadership inspiration"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/45 to-black/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(244,63,94,0.26)_0%,transparent_44%),radial-gradient(circle_at_85%_60%,rgba(244,114,182,0.2)_0%,transparent_44%)]" />
        {/* Quote */}
        <div className="z-10 space-y-10 max-w-md mt-auto mb-8">
          <blockquote className="font-accent italic text-[2.2rem] leading-[1.15] text-rose-100">
            "Leadership begins the moment you decide to lift someone else."
          </blockquote>

          <div className="space-y-7">
            {[
              { quote: 'Every session with my mentor moves the needle. I keep coming back.', name: 'Dana K.', title: 'Product Lead' },
            ].map(({ quote, name, title, indent }) => (
              <div key={name} className={`flex flex-col gap-1 ${indent ? 'ml-6' : ''} border-l-2 border-rose-300/70 pl-4`}>
                <p className="font-sans-modern text-sm text-rose-100/90 italic leading-relaxed">
                  "{quote}"
                </p>
                <span className="text-[10px] font-brand font-semibold tracking-[0.15em] uppercase text-rose-200/85">
                  {name} · {title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stat badge */}
        <div className="z-10">
          <div className="inline-flex items-center gap-2.5 bg-black/35 backdrop-blur-sm px-5 py-2.5 shadow-sm border border-rose-200/35">
            <span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse flex-shrink-0" />
            <p className="font-sans-modern text-sm font-medium text-rose-100">
              <span className="text-rose-300 font-bold">2,400+</span> women leaders inside
            </p>
          </div>
        </div>

        {/* Decorative rings */}
        <div className="absolute -bottom-24 -left-24 w-[26rem] h-[26rem] border border-rose-200/25 rounded-full pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-[26rem] h-[26rem] border border-rose-300/20 rounded-full pointer-events-none" />
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
                  className="w-full bg-white dark:bg-transparent border-0 border-b-2 border-outline-variant focus:border-[#f43f5e] focus:ring-0 px-0 py-2.5 font-sans-modern text-base text-on-surface placeholder:text-outline/40 transition-colors outline-none"
                />
              </div>

              {/* Password */}
              <div className="group">
                <div className="flex justify-between items-center mb-2">
                  <label className="font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline group-focus-within:text-primary transition-colors">
                    Password
                  </label>
                  <Link to="/forgot-password" className="font-sans-modern text-[10px] text-[#f43f5e] tracking-wider hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    name="password" value={form.password} onChange={handleChange}
                    placeholder="••••••••••••" autoComplete="current-password"
                    className="w-full bg-white border-0 border-b-2 border-outline-variant focus:border-[#f43f5e] focus:ring-0 px-0 py-2.5 pr-9 font-sans-modern text-base text-on-surface placeholder:text-outline/40 transition-colors outline-none"
                  />
                  <button
                    type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-outline hover:text-[#f43f5e] transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">{showPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 space-y-4">
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-[#f43f5e] text-white py-4 font-brand font-bold text-sm tracking-[0.2em] uppercase shadow-md shadow-rose-500/25 hover:bg-[#e11d48] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
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
                <div className="grid grid-cols-1 gap-3">
                  <button type="button"
                    className="flex items-center justify-center gap-2.5 rounded-lg border border-[#f43f5e]/45 bg-rose-50 py-3.5 font-sans-modern text-sm font-semibold text-[#be185d] hover:border-[#f43f5e] hover:bg-rose-100 dark:bg-[#2a1734] dark:text-rose-200 dark:hover:bg-[#341d41] transition-all">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                </div>
              </div>
            </form>

            <p className="font-sans-modern text-sm text-outline text-center mt-8">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#f43f5e] font-bold hover:underline">
                Join LeadsHer
              </Link>
            </p>
          </div>
        </div>

      </section>
    </div>
  );
}
