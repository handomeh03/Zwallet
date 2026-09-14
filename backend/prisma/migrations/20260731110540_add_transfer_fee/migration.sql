-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "feeAmount" DECIMAL(18,2) NOT NULL DEFAULT 0;
