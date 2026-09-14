import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JopaccClientService } from '../jopacc-client/jopacc-client.service';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { ResolveRecipientDto } from './dto/resolve-recipient.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { RecipientType, TransactionStatus, TransactionType, WalletTransaction } from '@prisma/client';
import { PisInitiationRequest } from '../jopacc-client/dto/jopacc.types';

const HOLD_DURATION_MS = 60_000;
const EXTERNAL_TRANSFER_FEE = 0.1;

interface RecipientSnapshot {
  name: string;
  address?: unknown;
  institutionName?: string;
  institutionBic?: string;
  countryCode?: string;
}

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jopaccClient: JopaccClientService,
    private readonly bankAccountsService: BankAccountsService,
  ) {}

  async resolveRecipient(userId: string, dto: ResolveRecipientDto, ipAddress?: string) {
    if (dto.type === 'INTERNAL') {
      return this.resolveInternalRecipient(userId, dto.identifierOrIban);
    }
    return this.resolveExternalRecipient(dto.identifierOrIban, { customerId: userId, ipAddress });
  }

  private async resolveInternalRecipient(userId: string, identifier: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: { not: userId },
        OR: [{ email: identifier }, { phone: identifier }, { id: identifier }],
      },
    });
    if (!user) {
      throw new NotFoundException('No wallet user found with that email/phone');
    }
    return {
      recipientType: RecipientType.INTERNAL_USER,
      recipientUserId: user.id,
      snapshot: { name: user.fullName, avatarUrl: user.avatarUrl } satisfies Record<string, unknown>,
    };
  }

  private async resolveExternalRecipient(
    iban: string,
    context: { customerId: string; ipAddress?: string },
  ) {
    const result = await this.jopaccClient.confirmIban(iban, context);
    if (!result.found) {
      throw new NotFoundException('No bank account found for that IBAN');
    }
    if (result.data.lockedForCredit) {
      throw new BadRequestException('This recipient account cannot currently receive funds');
    }

    const snapshot: RecipientSnapshot = {
      name: result.data.accountOwner?.name?.enName ?? 'Unknown',
      address: result.data.accountOwner?.address,
      institutionName: result.data.institutionBasicInfo?.name?.enName,
      institutionBic: result.data.institutionBasicInfo?.institutionIdentification,
    };

    return {
      recipientType: RecipientType.EXTERNAL_IBAN,
      recipientIban: iban,
      snapshot: snapshot as unknown as Record<string, unknown>,
      raw: result.data,
    };
  }

  async createTransfer(userId: string, dto: CreateTransferDto, ipAddress?: string) {
    let recipientUserId: string | undefined;
    let recipientIban: string | undefined;
    let recipientSnapshot: Record<string, unknown>;
    let jopaccResponsePayload: unknown;

    if (dto.recipientType === 'INTERNAL_USER') {
      if (!dto.recipientUserId) {
        throw new BadRequestException('recipientUserId is required for internal transfers');
      }
      const resolved = await this.resolveInternalRecipient(userId, dto.recipientUserId);
      recipientUserId = resolved.recipientUserId;
      recipientSnapshot = resolved.snapshot;
    } else {
      if (!dto.recipientIban) {
        throw new BadRequestException('recipientIban is required for external transfers');
      }
      const resolved = await this.resolveExternalRecipient(dto.recipientIban, {
        customerId: userId,
        ipAddress,
      });
      recipientIban = resolved.recipientIban;
      recipientSnapshot = resolved.snapshot;
      jopaccResponsePayload = resolved.raw;
    }

    const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);
    const feeAmount = dto.recipientType === 'EXTERNAL_IBAN' ? EXTERNAL_TRANSFER_FEE : 0;
    const holdAmount = dto.amount + feeAmount;

    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.user.updateMany({
        where: { id: userId, walletBalance: { gte: holdAmount } },
        data: {
          walletBalance: { decrement: holdAmount },
          heldBalance: { increment: holdAmount },
        },
      });
      if (claim.count === 0) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      return tx.walletTransaction.create({
        data: {
          type: TransactionType.TRANSFER_OUT,
          status: TransactionStatus.PENDING,
          amount: dto.amount,
          currency: 'JOD',
          feeAmount,
          ownerId: userId,
          recipientType:
            dto.recipientType === 'INTERNAL_USER'
              ? RecipientType.INTERNAL_USER
              : RecipientType.EXTERNAL_IBAN,
          recipientUserId,
          recipientIban,
          recipientSnapshot: recipientSnapshot as object,
          pendingExpiresAt: expiresAt,
          jopaccCallType: dto.recipientType === 'EXTERNAL_IBAN' ? 'IBAN_CONFIRMATION' : undefined,
          jopaccResponsePayload: jopaccResponsePayload as object | undefined,
        },
      });
    });
  }

  async getById(userId: string, id: string) {
    const transaction = await this.prisma.walletTransaction.findUnique({ where: { id } });
    if (!transaction || (transaction.ownerId !== userId && transaction.recipientUserId !== userId)) {
      throw new NotFoundException('Transfer not found');
    }
    return transaction;
  }

  async cancel(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.walletTransaction.findUnique({ where: { id } });
      if (!existing || existing.ownerId !== userId) {
        throw new NotFoundException('Transfer not found');
      }

      const claim = await tx.walletTransaction.updateMany({
        where: { id, ownerId: userId, status: TransactionStatus.PENDING },
        data: { status: TransactionStatus.CANCELLED, resolvedAt: new Date() },
      });
      if (claim.count === 0) {
        throw new BadRequestException(
          'This transfer can no longer be cancelled (it already completed, failed, or the hold expired)',
        );
      }

      const holdAmount = Number(existing.amount) + Number(existing.feeAmount);
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { increment: holdAmount },
          heldBalance: { decrement: holdAmount },
        },
      });

      return tx.walletTransaction.findUniqueOrThrow({ where: { id } });
    });
  }

  async confirmNow(userId: string, id: string) {
    const existing = await this.prisma.walletTransaction.findUnique({ where: { id } });
    if (!existing || existing.ownerId !== userId) {
      throw new NotFoundException('Transfer not found');
    }
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('This transfer is not pending');
    }

    const resolved = await this.resolveTransfer(id);
    if (!resolved) {
      throw new BadRequestException('This transfer was already resolved');
    }
    return resolved;
  }

  /**
   * Shared resolution path used by both "confirm now" and the expiry cron job.
   * A conditional PENDING -> COMPLETED claim guards against double-processing
   * if both fire concurrently.
   */
  async resolveTransfer(transactionId: string): Promise<WalletTransaction | null> {
    const claim = await this.prisma.walletTransaction.updateMany({
      where: { id: transactionId, status: TransactionStatus.PENDING },
      data: { status: TransactionStatus.COMPLETED, resolvedAt: new Date() },
    });
    if (claim.count === 0) {
      return null;
    }

    const transaction = await this.prisma.walletTransaction.findUniqueOrThrow({
      where: { id: transactionId },
    });

    if (transaction.recipientType === RecipientType.INTERNAL_USER) {
      return this.finalizeInternalTransfer(transaction);
    }
    return this.finalizeExternalTransfer(transaction);
  }

  private async finalizeInternalTransfer(transaction: WalletTransaction) {
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: transaction.recipientUserId! },
        data: { walletBalance: { increment: transaction.amount } },
      });
      await tx.user.update({
        where: { id: transaction.ownerId },
        data: { heldBalance: { decrement: transaction.amount } },
      });

      const owner = await tx.user.findUniqueOrThrow({ where: { id: transaction.ownerId } });

      const counterpart = await tx.walletTransaction.create({
        data: {
          type: TransactionType.TRANSFER_IN,
          status: TransactionStatus.COMPLETED,
          amount: transaction.amount,
          currency: transaction.currency,
          ownerId: transaction.recipientUserId!,
          recipientType: RecipientType.INTERNAL_USER,
          recipientUserId: transaction.ownerId,
          recipientSnapshot: { name: owner.fullName, avatarUrl: owner.avatarUrl },
          resolvedAt: new Date(),
          counterpartTransactionId: transaction.id,
        },
      });

      return tx.walletTransaction.update({
        where: { id: transaction.id },
        data: { counterpartTransactionId: counterpart.id },
      });
    });
  }

  private async finalizeExternalTransfer(transaction: WalletTransaction) {
    try {
      const [, sender] = await Promise.all([
        this.bankAccountsService.getSettlementAccount(),
        this.prisma.user.findUniqueOrThrow({ where: { id: transaction.ownerId } }),
      ]);
      const payload = this.buildPisPayload(transaction, sender.fullName);
      const result = await this.jopaccClient.initiatePayment(payload, {
        customerId: transaction.ownerId,
      });

      if (result.totalResult === 'Accepted') {
        return this.prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: transaction.ownerId },
            data: {
              heldBalance: { decrement: Number(transaction.amount) + Number(transaction.feeAmount) },
            },
          });
          return tx.walletTransaction.update({
            where: { id: transaction.id },
            data: {
              jopaccCallType: 'PIS',
              jopaccRequestPayload: payload as unknown as object,
              jopaccResponsePayload: result as unknown as object,
              jopaccMessageId: result.messageId,
            },
          });
        });
      }

      return this.refundAsFailed(transaction, payload, result, `PIS returned ${result.totalResult}`);
    } catch (error) {
      this.logger.error(`PIS initiation failed for transfer ${transaction.id}: ${(error as Error).message}`);
      return this.refundAsFailed(transaction, undefined, undefined, (error as Error).message);
    }
  }

  private async refundAsFailed(
    transaction: WalletTransaction,
    requestPayload: unknown,
    responsePayload: unknown,
    reason: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const holdAmount = Number(transaction.amount) + Number(transaction.feeAmount);
      await tx.user.update({
        where: { id: transaction.ownerId },
        data: {
          walletBalance: { increment: holdAmount },
          heldBalance: { decrement: holdAmount },
        },
      });
      return tx.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.FAILED,
          jopaccCallType: 'PIS',
          jopaccRequestPayload: requestPayload as object | undefined,
          jopaccResponsePayload: responsePayload as object | undefined,
          failureReason: reason,
        },
      });
    });
  }

  private buildPisPayload(transaction: WalletTransaction, senderFullName: string): PisInitiationRequest {
    const snapshot = (transaction.recipientSnapshot ?? {}) as unknown as RecipientSnapshot;
    const now = new Date();
    const endToEnd = `e2e-${transaction.id}`;

    return {
      groupHeader: {
        batchBooking: 'true',
        numberOfTrx: '1',
        paymentMethod: 'DOMESTIC.CLIQ',
        totalTrxAmount: { amount: Number(transaction.amount), currency: transaction.currency },
        batchPurpose: 'PIS.IPS.Initiation.ecom',
      },
      instructionsInfo: [
        {
          trxAmount: { amount: Number(transaction.amount), currency: transaction.currency },
          clearingChannel: 'RTGS',
          localInstrument: 'CLIQ',
          serviceLevel: 'EXPRESS',
          categoryPurpose: 'SALA',
          identifications: {
            endToEnd,
            quoteId: `quote-${transaction.id}`,
            SOSPId: `sosp-${transaction.id}`,
          },
          settlementDate: now.toISOString().slice(0, 10),
          // The sandbox's PIS endpoint only accepts creditor-side info — any
          // dbtr/dbtrAcct entry (even a well-formed one) makes it fail with a
          // generic 500 on every request, confirmed empirically. The real
          // bank account behind this leg is the app's pooled settlement
          // account, but that's only tracked on our side (not sent to
          // JoPACC) — the payment is attributed to the sending customer via
          // `remittanceInformation` below.
          involvedParties: [
            {
              involvedPartyType: 'cdtr',
              involvedParty: {
                enName: snapshot.name ?? 'Unknown',
                address: {
                  addresslines: Array.isArray((snapshot.address as any)?.addresslines)
                    ? (snapshot.address as any).addresslines
                    : [],
                  countryInfo: { countryCode: 'JO', countryName: 'Jordan' },
                },
              },
            },
          ],
          accounts: [
            {
              mainRoute: { schema: 'IBAN', address: transaction.recipientIban! },
              accountType: 'cdtrAcct',
            },
          ],
          // Sandbox only accepts agentType in [cdtrAgt, InstdAgt, InitgPty] — no dbtrAgt.
          agents: [
            {
              agentType: 'cdtrAgt',
              agent: {
                agentIdentification: { schema: 'BIC', address: snapshot.institutionBic ?? '' },
                enName: snapshot.institutionName ?? '',
              },
            },
          ],
          remittanceInformation: { unstructured: [`ZWallet transfer from ${senderFullName}`] },
          trxPresDateTime: now.toISOString(),
        },
      ],
    };
  }
}
