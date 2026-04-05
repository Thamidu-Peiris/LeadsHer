import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { authApi } from '../api/authApi';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmailWithCode, verifyEmailWithToken, isAuthenticated, user } = useAuth();

  const tokenFromUrl = searchParams.get('token');
  const [linkLoading, setLinkLoading] = useState(() => Boolean(tokenFromUrl));

  const [email, setEmail] = useState(() => {
    const q = searchParams.get('email') || '';
    if (q) return q;
    try {
      return sessionStorage.getItem('leadsher_pending_email') || '';
    } catch {
      return '';
    }
  });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

  useEffect(() => {
    if (!tokenFromUrl) {
      setLinkLoading(false);
      return;
    }
    let cancelled = false;
    verifyEmailWithToken(tokenFromUrl)
      .then(() => {
        if (cancelled) return;
        toast.success('Email verified. Welcome!');
        navigate('/dashboard', { replace: true });
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.message || 'Invalid or expired link. Enter the code below.');
      })
      .finally(() => {
        if (!cancelled) setLinkLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tokenFromUrl, navigate, verifyEmailWithToken]);

  useEffect(() => {
    if (isAuthenticated && user?.isEmailVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Enter your email');
      return;
    }
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      toast.error('Enter the 6-digit code from your email');
      return;
    }
    setLoading(true);
    try {
      await verifyEmailWithCode(email.trim(), digits);
      toast.success('Email verified. Welcome!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email.trim()) {
      toast.error('Enter your email first');
      return;
    }
    setResendBusy(true);
    try {
      const res = await authApi.resendVerification(email.trim());
      toast.success(res.data?.message || 'If the account exists, we sent a new code.');
      if (import.meta.env.DEV && res.data?.verificationCode) {
        console.info('[dev] Verification code:', res.data.verificationCode);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend');
    } finally {
      setResendBusy(false);
    }
  };

  if (linkLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 bg-surface">
        <p className="text-on-surface-variant">Verifying your email…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16 bg-surface">
      <div className="w-full max-w-md border border-outline-variant/25 bg-white dark:bg-surface-container-lowest p-8 shadow-sm">
        <h1 className="font-accent text-2xl text-on-surface mb-2">Verify your email</h1>
        <p className="text-sm text-on-surface-variant mb-6">
          Enter the 6-digit code we sent to your inbox (check spam). You need to verify before using the dashboard when
          this option is enabled by the platform.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b-2 border-outline-variant focus:border-primary py-2 outline-none bg-transparent"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">
              6-digit code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full text-center text-2xl tracking-[0.4em] font-mono border-b-2 border-outline-variant focus:border-primary py-2 outline-none bg-transparent"
              autoComplete="one-time-code"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-accent text-white py-3 font-brand text-xs tracking-[0.2em] uppercase hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Verifying…' : 'Verify & continue'}
          </button>
        </form>
        <button
          type="button"
          onClick={resend}
          disabled={resendBusy}
          className="mt-4 w-full text-sm text-primary font-semibold hover:underline disabled:opacity-50"
        >
          {resendBusy ? 'Sending…' : 'Resend code'}
        </button>
        <p className="mt-6 text-center text-sm text-outline">
          <Link to="/login" className="text-primary font-semibold">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
