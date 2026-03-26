import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const TESTIMONIALS = [
  {
    quote: 'Found my first mentor through LeadsHer. The connection was instant and transformative.',
    name: 'Elena R.',
    title: 'CEO',
    initials: 'ER',
    borderColor: '#ffb0cb',
  },
  {
    quote: 'The insights I gained here saved me years of trial and error.',
    name: 'Sarah L.',
    title: 'Creative Director',
    initials: 'SL',
    borderColor: '#7b5bbe',
    indent: true,
  },
];

function strengthInfo(pw) {
  if (!pw)           return { label: '',          filled: 0, color: '' };
  if (pw.length < 6) return { label: 'Too short', filled: 1, color: 'bg-error' };
  if (pw.length < 8) return { label: 'Weak',      filled: 2, color: 'bg-tertiary' };
  if (!/[^a-zA-Z0-9]/.test(pw)) return { label: 'Moderate', filled: 3, color: 'bg-gold-accent' };
  return { label: 'Strong', filled: 4, color: 'bg-gold-accent' };
}

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [step, setStep]         = useState(1);
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [form, setForm]         = useState({
    name: '', email: '', password: '', confirm: '', role: 'mentee',
  });

  if (isAuthenticated) { navigate('/'); return null; }

  const strength = strengthInfo(form.password);

  const handleChange = (e) => {
    setError('');
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const goNext = () => {
    if (!form.name || !form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (form.password.length < 6)                   { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm)             { setError('Passwords do not match.'); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      toast.success('Welcome to LeadsHer! 🎉');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full bg-white dark:bg-surface min-h-[calc(100vh-4rem)]">

      {/* ─── LEFT PANEL ─────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-[42%] flex-shrink-0 relative overflow-hidden px-14 pt-24 pb-14 justify-between sticky top-16 self-start h-[calc(100vh-4rem)]"
        style={theme === 'dark' ? {
          background: 'rgb(43 41 59)',
          backgroundImage:
            'radial-gradient(circle at 15% 15%, rgba(208,188,255,0.08) 0%, transparent 45%),' +
            'radial-gradient(circle at 85% 60%, rgba(239,184,200,0.08) 0%, transparent 45%)',
        } : {
          background: '#FDF0F3',
          backgroundImage:
            'radial-gradient(circle at 15% 15%, rgba(212,175,55,0.10) 0%, transparent 45%),' +
            'radial-gradient(circle at 85% 60%, rgba(218,112,143,0.12) 0%, transparent 45%)',
        }}
      >

        {/* Quote + testimonials */}
        <div className="z-10 space-y-10 max-w-xs">
          <blockquote className="font-accent italic text-[2.2rem] leading-[1.15] text-tertiary-container">
            "Your story is the map for someone else's journey."
          </blockquote>

          <div className="space-y-7">
            {TESTIMONIALS.map(({ quote, name, title, indent }) => (
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
          <div className="inline-flex items-center gap-2.5 bg-white dark:bg-surface-container px-5 py-2.5 shadow-sm border border-outline-variant/20">
            <span className="w-2 h-2 rounded-full bg-gold-accent animate-pulse flex-shrink-0" />
            <p className="font-sans-modern text-sm font-medium text-on-surface">
              Join <span className="text-gold-accent font-bold">2,400+</span> women leaders
            </p>
          </div>
        </div>

        {/* Decorative rings */}
        <div className="absolute -bottom-24 -left-24 w-[26rem] h-[26rem] border border-gold-accent/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-[26rem] h-[26rem] border border-tertiary/8 rounded-full pointer-events-none" />
      </aside>

      {/* ─── RIGHT PANEL ────────────────────────────────── */}
      <section className="flex-1 flex flex-col">

        {/* Body */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 pt-24 pb-12">
          <div className="w-full max-w-lg mx-auto">


            {/* Page heading */}
            <h2 className="font-accent text-4xl text-on-surface mb-1">
              {step === 1 ? 'Create Your Account' : 'How will you contribute?'}
            </h2>
            <p className="font-sans-modern text-sm text-on-surface-variant mb-10">
              {step === 1
                ? 'Join the community shaping tomorrow\'s leaders'
                : 'Choose the role that best describes you'}
            </p>

            {/* Error */}
            {error && (
              <div className="mb-6 px-4 py-3 border-l-2 border-error bg-error-container/50 text-on-error-container font-sans-modern text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-0">

              {/* ─── STEP 1 ─── */}
              {step === 1 && (
                <div className="space-y-7">
                  {/* Full name */}
                  <div className="group">
                    <label className="block font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline mb-2 group-focus-within:text-primary transition-colors">
                      Full Name
                    </label>
                    <input
                      type="text" name="name" value={form.name} onChange={handleChange}
                      placeholder="Alexandra Sterling" autoComplete="name"
                      className="w-full bg-white dark:bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-0 py-2.5 font-sans-modern text-base text-on-surface placeholder:text-outline/40 transition-colors outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div className="group">
                    <label className="block font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline mb-2 group-focus-within:text-primary transition-colors">
                      Email Address
                    </label>
                    <input
                      type="email" name="email" value={form.email} onChange={handleChange}
                      placeholder="you@leadsher.com" autoComplete="email"
                      className="w-full bg-white dark:bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-0 py-2.5 font-sans-modern text-base text-on-surface placeholder:text-outline/40 transition-colors outline-none"
                    />
                  </div>

                  {/* Password */}
                  <div className="group">
                    <label className="block font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline mb-2 group-focus-within:text-primary transition-colors">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        name="password" value={form.password} onChange={handleChange}
                        placeholder="Min. 6 characters" autoComplete="new-password"
                        className="w-full bg-white border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-0 py-2.5 pr-9 font-sans-modern text-base text-on-surface placeholder:text-outline/40 transition-colors outline-none"
                      />
                      <button
                        type="button" onClick={() => setShowPw((v) => !v)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">{showPw ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                    {/* Strength bar */}
                    <div className="mt-2.5 flex gap-1">
                      {[1, 2, 3, 4].map((s) => (
                        <div
                          key={s}
                          className={`flex-1 h-0.5 transition-all duration-300 ${strength.filled >= s ? strength.color : 'bg-outline-variant/40'}`}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p className="text-[10px] mt-1.5 text-outline tracking-wider uppercase">
                        Strength: <span className="font-semibold">{strength.label}</span>
                      </p>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="group">
                    <label className="block font-sans-modern text-[10px] font-bold tracking-[0.18em] uppercase text-outline mb-2 group-focus-within:text-primary transition-colors">
                      Confirm Password
                    </label>
                    <input
                      type="password" name="confirm" value={form.confirm} onChange={handleChange}
                      placeholder="Repeat your password" autoComplete="new-password"
                      className="w-full bg-white dark:bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-0 py-2.5 font-sans-modern text-base text-on-surface placeholder:text-outline/40 transition-colors outline-none"
                    />
                    {form.confirm && form.confirm !== form.password && (
                      <p className="text-[10px] mt-1.5 text-error tracking-wider uppercase">Passwords do not match</p>
                    )}
                  </div>

                  {/* Continue */}
                  <div className="pt-4 space-y-4">
                    <button
                      type="button" onClick={goNext}
                      className="w-full bg-gold-accent text-white py-4 font-brand font-bold text-sm tracking-[0.2em] uppercase shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                      Continue
                      <span className="material-symbols-outlined text-base text-white">arrow_forward</span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-outline-variant/30" />
                      <span className="font-sans-modern text-[10px] text-outline uppercase tracking-widest whitespace-nowrap">
                        Or sign up with
                      </span>
                      <div className="flex-1 h-px bg-outline-variant/30" />
                    </div>

                    {/* OAuth */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2.5 border border-outline-variant py-3.5 font-sans-modern text-sm font-medium hover:border-primary hover:bg-white dark:hover:bg-surface-container transition-all"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Google
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2.5 border border-outline-variant py-3.5 font-sans-modern text-sm font-medium hover:border-primary hover:bg-white dark:hover:bg-surface-container transition-all"
                      >
                        <svg className="w-4 h-4 fill-[#0077b5] flex-shrink-0" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        LinkedIn
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── STEP 2: Role ─── */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    {[
                      { value: 'mentor', icon: 'auto_awesome', label: 'Mentor', desc: 'Guide the next generation of visionary women.', iconColor: 'text-gold-accent' },
                      { value: 'mentee', icon: 'psychology',   label: 'Mentee', desc: 'Accelerate your journey with expert wisdom.',   iconColor: 'text-tertiary' },
                    ].map(({ value, icon, label, desc, iconColor }) => {
                      const active = form.role === value;
                      return (
                        <label
                          key={value}
                          className={`cursor-pointer border-2 p-7 flex flex-col items-center text-center transition-all select-none ${
                            active
                              ? 'border-gold-accent shadow-[0_0_24px_rgba(212,175,55,0.25)] bg-white dark:bg-surface-container'
                              : 'border-outline-variant bg-white dark:bg-surface-container hover:border-gold-accent/60'
                          }`}
                        >
                          <input type="radio" name="role" value={value}
                            checked={active} onChange={handleChange} className="hidden" />
                          <span
                            className={`material-symbols-outlined text-5xl mb-4 ${iconColor}`}
                            style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
                          >
                            {icon}
                          </span>
                          <span className="font-brand font-bold text-sm tracking-widest uppercase mb-2 text-on-surface">
                            {label}
                          </span>
                          <p className="font-sans-modern text-xs text-on-surface-variant leading-relaxed">{desc}</p>
                          <div className={`mt-5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                            active ? 'border-gold-accent' : 'border-outline-variant'
                          }`}>
                            {active && <div className="w-2 h-2 rounded-full bg-gold-accent" />}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Review summary */}
                  <div className="bg-blue-50 dark:bg-surface-container border border-blue-200 dark:border-outline-variant/30 divide-y divide-blue-200/60 dark:divide-outline-variant/20">
                    {[
                      { label: 'Name',  value: form.name },
                      { label: 'Email', value: form.email },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center px-5 py-3">
                        <span className="font-sans-modern text-[10px] tracking-widest uppercase text-outline">{label}</span>
                        <span className="font-sans-modern text-sm text-on-surface font-medium">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Submit */}
                  <div className="pt-2 space-y-3">
                    <button
                      type="submit" disabled={loading}
                      className="w-full bg-gold-accent text-white py-4 font-brand font-bold text-sm tracking-[0.2em] uppercase shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
                    >
                      {loading
                        ? <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        : <><span>Join LeadsHer</span><span className="material-symbols-outlined text-base text-white">arrow_forward</span></>
                      }
                    </button>
                    <button
                      type="button" onClick={() => { setStep(1); setError(''); }}
                      className="w-full border border-outline-variant py-3.5 font-brand text-xs tracking-[0.18em] uppercase text-outline hover:border-primary hover:text-primary transition-all"
                    >
                      ← Back
                    </button>
                  </div>
                </div>
              )}

            </form>

            <p className="font-sans-modern text-sm text-outline text-center mt-8">
              Already a member?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Log In
              </Link>
            </p>
          </div>
        </div>

      </section>
    </div>
  );
}
