import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TransfersService } from './transfers.service';
import { TransactionStatus } from '@prisma/client';

@Injectable()
export class TransferExpiryProcessor implements OnModuleInit {
  private readonly logger = new Logger(TransferExpiryProcessor.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly transfersService: TransfersService,
  ) {}

  async onModuleInit() {
    await this.scanExpiredTransfers();
  }

  @Interval(5000)
  async handleInterval() {
    await this.scanExpiredTransfers();
  }

  private async scanExpiredTransfers() {
    if (this.running) return;
    this.running = true;
    try {
      const expired = await this.prisma.walletTransaction.findMany({
        where: { status: TransactionStatus.PENDING, pendingExpiresAt: { lte: new Date() } },
        select: { id: true },
      });

      for (const { id } of expired) {
        try {
          await this.transfersService.resolveTransfer(id);
        } catch (error) {
          this.logger.error(`Failed to resolve expired transfer ${id}: ${(error as Error).message}`);
        }
      }
    } finally {
      this.running = false;
    }
  }
}
