import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/** Same rule as auth-service validation middleware */
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { applySession } = useAuth();

  const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid or missing reset link. Request a new one from Forgot password.');
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      toast.error('Use 8+ characters with letters, numbers, and a special character (@$!%*#?&).');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.resetPassword(token, password);
      const data = res.data;
      toast.success(data?.message || 'Password updated.');
      if (data?.token && data?.user) {
        applySession({ token: data.token, user: data.user });
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16 bg-surface-container-lowest">
      <div className="w-full max-w-md bg-white border border-outline-variant/20 editorial-shadow p-8">
        <h1 className="font-accent text-2xl text-on-surface mb-2">Set new password</h1>
        {!token ? (
          <>
            <p className="text-sm text-on-surface-variant mb-6">
              This link is missing a token. Open the link from your email, or request a new reset.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block w-full text-center bg-gold-accent text-white py-3 font-brand text-xs tracking-[0.2em] uppercase hover:opacity-90"
            >
              Request reset link
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-on-surface-variant mb-6">
              Choose a new password for your account. You will be signed in after saving.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-b-2 border-outline-variant focus:border-primary py-2 outline-none bg-transparent"
                  autoComplete="new-password"
                  placeholder="8+ chars, letter, number, symbol"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full border-b-2 border-outline-variant focus:border-primary py-2 outline-none bg-transparent"
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold-accent text-white py-3 font-brand text-xs tracking-[0.2em] uppercase hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Saving…' : 'Save new password'}
              </button>
            </form>
          </>
        )}
        <p className="mt-6 text-center text-sm text-outline">
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
