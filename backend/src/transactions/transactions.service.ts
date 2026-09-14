import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus, TransactionType } from '@prisma/client';

interface ListFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, filters: ListFilters) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.min(filters.pageSize, 100) : 20;

    const where = {
      ownerId: userId,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async getById(userId: string, id: string) {
    const transaction = await this.prisma.walletTransaction.findUnique({ where: { id } });
    if (!transaction || (transaction.ownerId !== userId && transaction.recipientUserId !== userId)) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }
}
