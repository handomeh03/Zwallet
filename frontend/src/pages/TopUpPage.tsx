import { TopUpForm } from '../components/topup/TopUpForm';

export function TopUpPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Top up wallet</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        We'll confirm the funds are available in your bank account first.
      </p>
      <TopUpForm />
    </div>
  );
}
