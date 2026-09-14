-- CreateEnum
CREATE TYPE "BankAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('TOPUP', 'TRANSFER_OUT', 'TRANSFER_IN');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('INTERNAL_USER', 'EXTERNAL_IBAN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "walletBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "heldBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedBankAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "customerId" TEXT,
    "accountStatus" "BankAccountStatus" NOT NULL,
    "accountType" TEXT,
    "currency" TEXT NOT NULL,
    "holderName" TEXT,
    "institutionName" TEXT,
    "branchName" TEXT,
    "lockedForCredit" BOOLEAN NOT NULL DEFAULT false,
    "lockedForDebit" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "label" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawAccountsPayload" JSONB,

    CONSTRAINT "LinkedBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JOD',
    "ownerId" TEXT NOT NULL,
    "recipientType" "RecipientType",
    "recipientUserId" TEXT,
    "recipientIban" TEXT,
    "recipientSnapshot" JSONB,
    "linkedBankAccountId" TEXT,
    "pendingExpiresAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "counterpartTransactionId" TEXT,
    "jopaccCallType" TEXT,
    "jopaccRequestPayload" JSONB,
    "jopaccResponsePayload" JSONB,
    "jopaccMessageId" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedBankAccount_accountId_key" ON "LinkedBankAccount"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedBankAccount_iban_key" ON "LinkedBankAccount"("iban");

-- CreateIndex
CREATE INDEX "LinkedBankAccount_userId_idx" ON "LinkedBankAccount"("userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_ownerId_idx" ON "WalletTransaction"("ownerId");

-- CreateIndex
CREATE INDEX "WalletTransaction_status_pendingExpiresAt_idx" ON "WalletTransaction"("status", "pendingExpiresAt");

-- AddForeignKey
ALTER TABLE "LinkedBankAccount" ADD CONSTRAINT "LinkedBankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_linkedBankAccountId_fkey" FOREIGN KEY ("linkedBankAccountId") REFERENCES "LinkedBankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_counterpartTransactionId_fkey" FOREIGN KEY ("counterpartTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
