import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2, Mail, Phone, Sparkles, User, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { extractErrorMessage } from '../api/client';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { TextField } from '../components/common/TextField';
import { AuthLayout } from '../components/layout/AuthLayout';

export function SignupPage() {
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
      await signup({ email, password, fullName, phone: phone || undefined });
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
        <h1 className="text-2xl font-bold">Create your wallet</h1>
        <p className="mb-6 mt-1 text-sm text-gray-500 dark:text-gray-400">
          Takes less than a minute to get started
        </p>

        <ErrorBanner message={error} />

        <TextField
          label="Full name"
          type="text"
          icon={<User size={16} />}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jameel Handomeh"
          required
        />
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
          label="Phone (optional)"
          type="tel"
          icon={<Phone size={16} />}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="07XXXXXXXX"
        />
        <TextField
          label="Password"
          type="password"
          icon={<Lock size={16} />}
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {isSubmitting ? 'Creating account...' : 'Sign up'}
        </button>

        <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
