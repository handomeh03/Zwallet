import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { TopupService } from '../topup/topup.service';
import { CreateRefundRequestDto } from './dto/create-refund-request.dto';
import { RecipientType, RefundRequestStatus, TransactionStatus, TransactionType } from '@prisma/client';

@Injectable()
export class RefundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bankAccountsService: BankAccountsService,
    private readonly topupService: TopupService,
  ) {}

  async create(requesterId: string, dto: CreateRefundRequestDto) {
    const target = await this.prisma.user.findFirst({
      where: {
        id: { not: requesterId },
        OR: [
          { email: dto.targetIdentifier },
          { phone: dto.targetIdentifier },
          { id: dto.targetIdentifier },
        ],
      },
    });
    if (!target) {
      throw new NotFoundException('No wallet user found with that email/phone');
    }

    if (dto.originalTransactionId) {
      const original = await this.prisma.walletTransaction.findUnique({
        where: { id: dto.originalTransactionId },
      });
      if (!original || original.ownerId !== requesterId || original.recipientUserId !== target.id) {
        throw new BadRequestException('The referenced transaction does not match this requester/target pair');
      }
    }

    return this.prisma.refundRequest.create({
      data: {
        requesterId,
        targetId: target.id,
        amount: dto.amount,
        reason: dto.reason,
        originalTransactionId: dto.originalTransactionId,
      },
    });
  }

  async listMine(userId: string) {
    const [sent, received] = await Promise.all([
      this.prisma.refundRequest.findMany({
        where: { requesterId: userId },
        include: { target: { select: { id: true, fullName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.refundRequest.findMany({
        where: { targetId: userId },
        include: { requester: { select: { id: true, fullName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { sent, received };
  }

  async getById(userId: string, id: string) {
    const request = await this.prisma.refundRequest.findUnique({ where: { id } });
    if (!request || (request.requesterId !== userId && request.targetId !== userId)) {
      throw new NotFoundException('Refund request not found');
    }
    return request;
  }

  async reject(userId: string, id: string) {
    const request = await this.prisma.refundRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException('Refund request not found');
    }
    if (request.targetId !== userId) {
      throw new ForbiddenException('Only the recipient of the refund request can reject it');
    }

    const claim = await this.prisma.refundRequest.updateMany({
      where: { id, targetId: userId, status: RefundRequestStatus.PENDING },
      data: { status: RefundRequestStatus.REJECTED, resolvedAt: new Date() },
    });
    if (claim.count === 0) {
      throw new BadRequestException('This refund request is no longer pending');
    }

    return this.prisma.refundRequest.findUniqueOrThrow({ where: { id } });
  }

  async approve(userId: string, id: string, ipAddress?: string) {
    const request = await this.prisma.refundRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException('Refund request not found');
    }
    if (request.targetId !== userId) {
      throw new ForbiddenException('Only the recipient of the refund request can approve it');
    }
    if (request.status !== RefundRequestStatus.PENDING) {
      throw new BadRequestException('This refund request is no longer pending');
    }

    const target = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const shortfall = Number(request.amount) - Number(target.walletBalance);

    if (shortfall > 0) {
      const accounts = await this.bankAccountsService.list(userId);
      const linkedAccount = accounts.find((a) => a.isPrimary) ?? accounts[0];
      if (!linkedAccount) {
        return this.markFailed(id, 'Insufficient wallet balance and no linked bank account to top up from');
      }

      const topupResult = await this.topupService.topup(
        userId,
        { linkedBankAccountId: linkedAccount.id, amount: shortfall },
        ipAddress,
      );
      if (topupResult.status !== TransactionStatus.COMPLETED) {
        return this.markFailed(
          id,
          topupResult.failureReason ?? 'Automatic top-up to cover the refund failed',
        );
      }
    }

    return this.payback(request.id, userId, request.requesterId, Number(request.amount));
  }

  private async markFailed(id: string, failureReason: string) {
    return this.prisma.refundRequest.update({
      where: { id },
      data: { status: RefundRequestStatus.FAILED, failureReason, resolvedAt: new Date() },
    });
  }

  private async payback(requestId: string, fromUserId: string, toUserId: string, amount: number) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const claim = await tx.user.updateMany({
          where: { id: fromUserId, walletBalance: { gte: amount } },
          data: { walletBalance: { decrement: amount } },
        });
        if (claim.count === 0) {
          throw new BadRequestException('Insufficient wallet balance to complete the refund');
        }

        const toUser = await tx.user.update({
          where: { id: toUserId },
          data: { walletBalance: { increment: amount } },
        });
        const fromUser = await tx.user.findUniqueOrThrow({ where: { id: fromUserId } });

        const outgoing = await tx.walletTransaction.create({
          data: {
            type: TransactionType.TRANSFER_OUT,
            status: TransactionStatus.COMPLETED,
            amount,
            currency: 'JOD',
            ownerId: fromUserId,
            recipientType: RecipientType.INTERNAL_USER,
            recipientUserId: toUserId,
            recipientSnapshot: { name: toUser.fullName, avatarUrl: toUser.avatarUrl },
            resolvedAt: new Date(),
          },
        });

        const incoming = await tx.walletTransaction.create({
          data: {
            type: TransactionType.TRANSFER_IN,
            status: TransactionStatus.COMPLETED,
            amount,
            currency: 'JOD',
            ownerId: toUserId,
            recipientType: RecipientType.INTERNAL_USER,
            recipientUserId: fromUserId,
            recipientSnapshot: { name: fromUser.fullName, avatarUrl: fromUser.avatarUrl },
            resolvedAt: new Date(),
            counterpartTransactionId: outgoing.id,
          },
        });

        await tx.walletTransaction.update({
          where: { id: outgoing.id },
          data: { counterpartTransactionId: incoming.id },
        });

        return tx.refundRequest.update({
          where: { id: requestId },
          data: {
            status: RefundRequestStatus.APPROVED,
            resultTransactionId: outgoing.id,
            resolvedAt: new Date(),
          },
        });
      });
    } catch (error) {
      return this.markFailed(requestId, (error as Error).message);
    }
  }
}
