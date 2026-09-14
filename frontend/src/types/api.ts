export type BankAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
export type TransactionType = 'TOPUP' | 'TRANSFER_OUT' | 'TRANSFER_IN';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
export type RecipientType = 'INTERNAL_USER' | 'EXTERNAL_IBAN';

export type UserRole = 'ADMIN' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  walletBalance: string;
  heldBalance: string;
  createdAt: string;
}

export interface LinkedBankAccount {
  id: string;
  accountId: string;
  iban: string;
  accountStatus: BankAccountStatus;
  currency: string;
  holderName?: string | null;
  institutionName?: string | null;
  branchName?: string | null;
  lockedForCredit: boolean;
  lockedForDebit: boolean;
  isPrimary: boolean;
  label?: string | null;
  linkedAt: string;
}

export interface BankBalance {
  availableBalance: { balanceAmount: number; balancePosition: string };
  currentBalance: { balanceAmount: number; balancePosition: string };
  creditlimit?: number;
  balanceCurrency: string;
  lastModificationDate: string;
}

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  currency: string;
  feeAmount: string;
  ownerId: string;
  recipientType?: RecipientType | null;
  recipientUserId?: string | null;
  recipientIban?: string | null;
  recipientSnapshot?: { name?: string; avatarUrl?: string | null; institutionName?: string } | null;
  linkedBankAccountId?: string | null;
  pendingExpiresAt?: string | null;
  resolvedAt?: string | null;
  jopaccMessageId?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipientResolution {
  recipientType: RecipientType;
  recipientUserId?: string;
  recipientIban?: string;
  snapshot: { name: string; avatarUrl?: string | null; institutionName?: string };
}

export interface UserSearchResult {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  email: string;
}

export interface TransactionListResponse {
  items: WalletTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

export type RefundRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FAILED';

export interface RefundRequestUserSummary {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface RefundRequest {
  id: string;
  requesterId: string;
  targetId: string;
  requester?: RefundRequestUserSummary;
  target?: RefundRequestUserSummary;
  amount: string;
  currency: string;
  reason: string;
  originalTransactionId?: string | null;
  status: RefundRequestStatus;
  resultTransactionId?: string | null;
  failureReason?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface RefundRequestsResponse {
  sent: RefundRequest[];
  received: RefundRequest[];
}

export interface OwnerSummary {
  id: string;
  fullName: string;
  email: string;
}

export interface AdminOverview {
  userCount: number;
  totalWalletBalance: string;
  totalHeldBalance: string;
  linkedAccountCount: number;
  todaysTransactionCount: number;
  todaysCommission: string;
}

export type AdminBankAccount = LinkedBankAccount & { user: OwnerSummary };
export type AdminTransaction = WalletTransaction & { owner: OwnerSummary };

export interface AdminTransactionListResponse {
  items: AdminTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminCommissionsResponse {
  totalCommission: string;
  transactionCount: number;
  byDay: { date: string; commission: number; count: number }[];
}
