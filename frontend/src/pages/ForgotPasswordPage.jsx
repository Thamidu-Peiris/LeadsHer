import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

const shellClass =
  'min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16 ' +
  'bg-gradient-to-br from-pink-50 via-rose-50/90 to-fuchsia-50/70 ' +
  'dark:from-surface-container-lowest dark:via-surface dark:to-surface-container-low';

const cardClass =
  'relative w-full max-w-md overflow-hidden border-2 border-pink-200/90 ' +
  'bg-white/95 shadow-[0_20px_50px_-12px_rgba(219,39,119,0.18)] backdrop-blur-sm ' +
  'dark:border-pink-900/35 dark:bg-surface-container-highest/95 dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)]';

const accentBarClass = 'h-1.5 w-full bg-pink-600 dark:bg-pink-500';

const primaryBtnClass =
  'w-full bg-pink-600 py-3.5 font-brand text-xs tracking-[0.2em] uppercase text-white ' +
  'shadow-md shadow-pink-600/25 transition-colors hover:bg-pink-700 active:bg-pink-800 ' +
  'disabled:opacity-60 dark:shadow-pink-900/40';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  /** After submit: stay on this screen with instructions — "Set new password" only opens from the email link. */
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Enter your email');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      const data = res.data;
      setSent(true);
      toast.success(
        data?.message || 'If that email is registered, we sent a reset link.'
      );
      if (import.meta.env.DEV && data?.resetToken) {
        console.info(
          '[dev] No SMTP? Open reset page manually:\n',
          `${window.location.origin}/reset-password?token=${encodeURIComponent(data.resetToken)}`
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className={shellClass}>
        <div className={cardClass}>
          <div className={accentBarClass} aria-hidden />
          <div className="p-8 pt-7">
            <p className="mb-1 text-center font-brand text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-600 dark:text-pink-400">
              LeadsHer
            </p>
            <h1 className="font-accent mb-3 text-center text-2xl text-pink-950 dark:text-pink-100">
              Check your email
            </h1>
            <p className="mb-4 text-sm text-on-surface-variant">
              If an account exists for{' '}
              <span className="font-medium text-pink-900 dark:text-pink-200">{email.trim()}</span>, we sent a message
              with a link to reset your password.
            </p>
            <p className="mb-6 border border-pink-100 bg-pink-50/80 px-4 py-3 text-sm text-on-surface-variant dark:border-pink-900/40 dark:bg-pink-950/30">
              Open that email and{' '}
              <strong className="font-semibold text-pink-900 dark:text-pink-200">click the link</strong> — the page
              where you choose a new password only appears after you use that link (not from this screen).
            </p>
            <button type="button" onClick={() => navigate('/login')} className={primaryBtnClass}>
              Back to sign in
            </button>
            <p className="mt-4 text-center text-sm text-outline">
              <button
                type="button"
                className="font-semibold text-pink-700 hover:underline dark:text-pink-400"
                onClick={() => setSent(false)}
              >
                Send another email
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className={cardClass}>
        <div className={accentBarClass} aria-hidden />
        <div className="p-8 pt-7">
          <p className="mb-1 text-center font-brand text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-600 dark:text-pink-400">
            LeadsHer
          </p>
          <h1 className="font-accent mb-1 text-center text-3xl tracking-tight text-pink-950 dark:text-pink-100">
            Forgot password
          </h1>
          <p className="mb-8 text-center text-sm text-on-surface-variant">
            Enter your account email. If it’s registered, we’ll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-pink-900/70 dark:text-pink-300/80">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-pink-100 bg-white/80 px-3 py-2.5 text-on-surface outline-none transition-colors placeholder:text-outline/60 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 dark:border-pink-900/50 dark:bg-surface-container-low/80 dark:focus:border-pink-400"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" disabled={loading} className={primaryBtnClass}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-outline">
            <Link to="/login" className="font-semibold text-pink-700 hover:underline dark:text-pink-400">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
