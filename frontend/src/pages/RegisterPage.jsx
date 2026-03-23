import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

const ROLES = [
  { value: 'mentee', label: 'Mentee', desc: 'I want to learn and grow' },
  { value: 'mentor', label: 'Mentor', desc: 'I want to guide others' },
];

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'mentee' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  if (isAuthenticated) { navigate('/'); return null; }

  const handleChange = (e) => {
    setError('');
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Welcome to LeadsHer! 🎉');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 to-brand-700 items-center justify-center p-12">
        <div className="text-white max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-6">
            <span className="text-white font-bold text-xl">L</span>
          </div>
          <h2 className="font-display text-3xl font-bold mb-4">Join LeadsHer today</h2>
          <p className="text-brand-200 text-lg leading-relaxed">
            Share your story, find a mentor, and connect with women leaders across industries.
          </p>
          <ul className="mt-8 space-y-3 text-brand-200">
            {['Share and read leadership stories', 'Find and become a mentor', 'Join events & workshops', 'Build your professional network'].map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-brand-500/50 flex items-center justify-center text-xs">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="font-display text-2xl font-semibold text-gray-900 mb-1">Create your account</h1>
          <p className="text-gray-500 text-sm mb-8">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Log in</Link>
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                type="text" name="name" value={form.name} onChange={handleChange}
                className="input" placeholder="Jane Doe" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                className="input" placeholder="you@example.com" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password" name="password" value={form.password} onChange={handleChange}
                className="input" placeholder="Min. 6 characters" required
              />
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">I am joining as a…</label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`relative flex flex-col gap-1 p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${
                      form.role === value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-brand-200'
                    }`}
                  >
                    <input
                      type="radio" name="role" value={value}
                      checked={form.role === value} onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="font-semibold text-sm text-gray-900">{label}</span>
                    <span className="text-xs text-gray-500">{desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? <Spinner size="sm" className="mx-auto" /> : 'Create account'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              By creating an account you agree to our terms of service.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
