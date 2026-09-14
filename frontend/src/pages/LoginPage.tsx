import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2, Lock, LogIn, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { extractErrorMessage } from '../api/client';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { TextField } from '../components/common/TextField';
import { AuthLayout } from '../components/layout/AuthLayout';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit}
        className="animate-fade-in-up w-full max-w-sm rounded-2xl border border-gray-200/70 bg-white p-8 shadow-xl shadow-gray-200/60 dark:border-white/10 dark:bg-[#12131c] dark:shadow-none"
      >
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mb-6 mt-1 text-sm text-gray-500 dark:text-gray-400">Log in to your wallet</p>

        <ErrorBanner message={error} />

        <TextField
          label="Email"
          type="email"
          icon={<Mail size={16} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <TextField
          label="Password"
          type="password"
          icon={<Lock size={16} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </button>

        <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
