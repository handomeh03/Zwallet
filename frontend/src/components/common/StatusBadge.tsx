import type { TransactionStatus } from '../../types/api';

const CONFIG: Record<TransactionStatus, { label: string; classes: string }> = {
  PENDING: {
    label: 'Pending',
    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  COMPLETED: {
    label: 'Completed',
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  CANCELLED: {
    label: 'Cancelled',
    classes: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
  },
  FAILED: {
    label: 'Failed',
    classes: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const { label, classes } = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
