import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus, TransactionType } from '@prisma/client';

interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

interface DateRangeFilters {
  from?: string;
  to?: string;
}

function buildCreatedAtFilter(filters: DateRangeFilters): { gte?: Date; lte?: Date } {
  const createdAt: { gte?: Date; lte?: Date } = {};
  if (filters.from) createdAt.gte = new Date(filters.from);
  if (filters.to) createdAt.lte = new Date(`${filters.to}T23:59:59.999Z`);
  return createdAt;
}

function todayRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

const OWNER_SELECT = { select: { id: true, fullName: true, email: true } };

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const { start, end } = todayRange();

    const [userCount, walletTotals, linkedAccountCount, todaysTransactionCount, todaysCommission] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.aggregate({
          _sum: { walletBalance: true, heldBalance: true },
        }),
        this.prisma.linkedBankAccount.count(),
        this.prisma.walletTransaction.count({
          where: { createdAt: { gte: start, lt: end } },
        }),
        this.prisma.walletTransaction.aggregate({
          where: { status: TransactionStatus.COMPLETED, createdAt: { gte: start, lt: end } },
          _sum: { feeAmount: true },
        }),
      ]);

    return {
      userCount,
      totalWalletBalance: walletTotals._sum.walletBalance ?? 0,
      totalHeldBalance: walletTotals._sum.heldBalance ?? 0,
      linkedAccountCount,
      todaysTransactionCount,
      todaysCommission: todaysCommission._sum.feeAmount ?? 0,
    };
  }

  async listAllAccounts() {
    return this.prisma.linkedBankAccount.findMany({
      include: { user: OWNER_SELECT },
      orderBy: { linkedAt: 'desc' },
    });
  }

  async listAllTransactions(filters: TransactionFilters) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.min(filters.pageSize, 100) : 20;

    const createdAt = buildCreatedAtFilter(filters);

    const where = {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where,
        include: { owner: OWNER_SELECT },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async getCommissions(filters: DateRangeFilters) {
    const createdAt = buildCreatedAtFilter(filters);
    const where = {
      status: TransactionStatus.COMPLETED,
      feeAmount: { gt: 0 },
      ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
    };

    const [totals, rows] = await Promise.all([
      this.prisma.walletTransaction.aggregate({
        where,
        _sum: { feeAmount: true },
        _count: true,
      }),
      this.prisma.walletTransaction.findMany({
        where,
        select: { feeAmount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const byDayMap = new Map<string, { commission: number; count: number }>();
    for (const row of rows) {
      const day = row.createdAt.toISOString().slice(0, 10);
      const bucket = byDayMap.get(day) ?? { commission: 0, count: 0 };
      bucket.commission += Number(row.feeAmount);
      bucket.count += 1;
      byDayMap.set(day, bucket);
    }
    const byDay = Array.from(byDayMap.entries())
      .map(([date, bucket]) => ({ date, ...bucket }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalCommission: totals._sum.feeAmount ?? 0,
      transactionCount: totals._count,
      byDay,
    };
  }
}
