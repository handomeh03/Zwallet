import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JopaccClientService } from '../jopacc-client/jopacc-client.service';
import { LinkAccountDto } from './dto/link-account.dto';
import { BankAccountStatus } from '@prisma/client';

const STATUS_MAP: Record<string, BankAccountStatus> = {
  active: BankAccountStatus.ACTIVE,
  suspended: BankAccountStatus.SUSPENDED,
  closed: BankAccountStatus.CLOSED,
};

@Injectable()
export class BankAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jopaccClient: JopaccClientService,
    private readonly configService: ConfigService,
  ) {}

  async link(userId: string, dto: LinkAccountDto, ipAddress?: string) {
    const account = await this.jopaccClient.getAccount(dto.accountAddress, {
      customerId: userId,
      ipAddress,
    });

    const status = STATUS_MAP[account.accountStatus];
    if (!status) {
      throw new BadRequestException(`Unrecognized account status: ${account.accountStatus}`);
    }

    if (status !== BankAccountStatus.ACTIVE) {
      throw new BadRequestException(
        `This bank account cannot be linked because it is ${account.accountStatus}. Only active accounts can be linked.`,
      );
    }

    const iban = account.mainRoute?.address ?? dto.accountAddress;

    const alreadyLinked = await this.prisma.linkedBankAccount.findFirst({
      where: { OR: [{ accountId: account.accountId }, { iban }] },
    });
    if (alreadyLinked) {
      throw new ConflictException(
        alreadyLinked.userId === userId
          ? 'You have already linked this bank account.'
          : 'This bank account is already linked to another wallet user.',
      );
    }

    try {
      return await this.prisma.linkedBankAccount.create({
        data: {
          userId,
          accountId: account.accountId,
          iban,
          customerId: account.customerId,
          accountStatus: status,
          accountType: account.accountType?.name,
          currency: account.accountCurrency,
          holderName:
            account.institutionBasicInfo?.name?.enName ?? account.accountHolderType ?? undefined,
          institutionName: account.institutionBasicInfo?.name?.enName,
          institutionBic: account.institutionBasicInfo?.institutionIdentification?.address,
          branchName: account.branchBasicInfo?.name?.enName,
          lockedForCredit: account.lockedForCredit ?? false,
          lockedForDebit: account.lockedForDebit ?? false,
          label: dto.label,
          rawAccountsPayload: account as object,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('This bank account is already linked.');
      }
      throw error;
    }
  }

  async list(userId: string) {
    return this.prisma.linkedBankAccount.findMany({ where: { userId } });
  }

  async findOwned(userId: string, id: string) {
    const account = await this.prisma.linkedBankAccount.findUnique({ where: { id } });
    if (!account || account.userId !== userId) {
      throw new NotFoundException('Linked bank account not found');
    }
    return account;
  }

  async unlink(userId: string, id: string) {
    const account = await this.findOwned(userId, id);

    const usageCount = await this.prisma.walletTransaction.count({
      where: { linkedBankAccountId: id },
    });
    if (usageCount > 0) {
      throw new ConflictException(
        'This account has transaction history and cannot be unlinked. It stays available for record-keeping.',
      );
    }

    await this.prisma.linkedBankAccount.delete({ where: { id } });

    if (account.isPrimary) {
      const next = await this.prisma.linkedBankAccount.findFirst({ where: { userId } });
      if (next) {
        await this.prisma.linkedBankAccount.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    }

    return this.list(userId);
  }

  async setPrimary(userId: string, id: string) {
    await this.findOwned(userId, id);

    await this.prisma.$transaction([
      this.prisma.linkedBankAccount.updateMany({
        where: { userId },
        data: { isPrimary: false },
      }),
      this.prisma.linkedBankAccount.update({
        where: { id },
        data: { isPrimary: true },
      }),
    ]);

    return this.list(userId);
  }

  /**
   * The app's own pooled bank account (the ADMIN user's linked account).
   * All top-ups land here, and all outgoing external transfers debit from
   * here — see `scripts/seed-admin.ts` for how this gets designated.
   *
   * Matched by the configured settlement IBAN specifically (not just "any
   * account owned by the ADMIN user") so this stays correct even if the
   * admin ends up with more than one linked account (e.g. after changing
   * `ADMIN_SETTLEMENT_IBAN` and re-running the seed script).
   */
  async getSettlementAccount() {
    const settlementIban = this.configService.get<string>('admin.settlementIban')!;
    const account = await this.prisma.linkedBankAccount.findFirst({
      where: { iban: settlementIban, user: { role: 'ADMIN' } },
      include: { user: true },
    });
    if (!account) {
      throw new NotFoundException(
        'No settlement account is configured. Run `npm run seed:admin` to designate one.',
      );
    }
    return account;
  }
}
