import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16 bg-surface-container-lowest">
        <div className="w-full max-w-md bg-white border border-outline-variant/20 editorial-shadow p-8">
          <h1 className="font-accent text-2xl text-on-surface mb-2">Check your email</h1>
          <p className="text-sm text-on-surface-variant mb-4">
            If an account exists for <span className="font-medium text-on-surface">{email.trim()}</span>, we sent a message with a link to reset your password.
          </p>
          <p className="text-sm text-on-surface-variant mb-6">
            Open that email and <strong className="text-on-surface font-semibold">click the link</strong> — the page where you choose a new password only appears after you use that link (not from this screen).
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full bg-gold-accent text-white py-3 font-brand text-xs tracking-[0.2em] uppercase hover:opacity-90"
          >
            Back to sign in
          </button>
          <p className="mt-4 text-center text-sm text-outline">
            <button type="button" className="text-primary font-semibold hover:underline" onClick={() => setSent(false)}>
              Send another email
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16 bg-surface-container-lowest">
      <div className="w-full max-w-md bg-white border border-outline-variant/20 editorial-shadow p-8">
        <h1 className="font-accent text-2xl text-on-surface mb-2">Forgot password</h1>
        <p className="text-sm text-on-surface-variant mb-6">
          Enter your account email. If it’s registered, we’ll email you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b-2 border-outline-variant focus:border-primary py-2 outline-none bg-transparent"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-accent text-white py-3 font-brand text-xs tracking-[0.2em] uppercase hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-outline">
          <Link to="/login" className="text-primary font-semibold hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
