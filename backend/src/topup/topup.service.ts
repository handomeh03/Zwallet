import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JopaccClientService } from '../jopacc-client/jopacc-client.service';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { TopupDto } from './dto/topup.dto';
import { LinkedBankAccount, TransactionStatus, TransactionType, User } from '@prisma/client';
import { PisInitiationRequest } from '../jopacc-client/dto/jopacc.types';

@Injectable()
export class TopupService {
  private readonly logger = new Logger(TopupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jopaccClient: JopaccClientService,
    private readonly bankAccountsService: BankAccountsService,
  ) {}

  async topup(userId: string, dto: TopupDto, ipAddress?: string) {
    const linkedAccount = await this.bankAccountsService.findOwned(userId, dto.linkedBankAccountId);
    const customer = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const cafResult = await this.jopaccClient.confirmAvailability(
      linkedAccount.accountId,
      dto.amount,
      linkedAccount.currency,
      { customerId: userId, ipAddress },
    );

    if (!cafResult.fundsAvailable) {
      return this.createFailedTopup(userId, linkedAccount.id, dto.amount, linkedAccount.currency, {
        jopaccCallType: 'CAF',
        jopaccResponsePayload: cafResult as object,
        failureReason: 'Insufficient funds in linked bank account',
      });
    }

    // Real bank movement: customer's own linked account (debtor) -> the
    // app's pooled settlement account (creditor). Only on PIS "Accepted"
    // does the customer's wallet balance actually go up.
    const settlementAccount = await this.bankAccountsService.getSettlementAccount();
    const payload = this.buildTopupPisPayload(
      linkedAccount,
      settlementAccount,
      customer,
      settlementAccount.user,
      dto.amount,
    );

    try {
      const result = await this.jopaccClient.initiatePayment(payload, { customerId: userId, ipAddress });

      if (result.totalResult !== 'Accepted') {
        return this.createFailedTopup(userId, linkedAccount.id, dto.amount, linkedAccount.currency, {
          jopaccCallType: 'PIS',
          jopaccRequestPayload: payload as unknown as object,
          jopaccResponsePayload: result as unknown as object,
          failureReason: `PIS returned ${result.totalResult}`,
        });
      }

      const [, transaction] = await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: dto.amount } },
        }),
        this.prisma.walletTransaction.create({
          data: {
            type: TransactionType.TOPUP,
            status: TransactionStatus.COMPLETED,
            amount: dto.amount,
            currency: linkedAccount.currency,
            ownerId: userId,
            linkedBankAccountId: linkedAccount.id,
            resolvedAt: new Date(),
            jopaccCallType: 'PIS',
            jopaccRequestPayload: payload as unknown as object,
            jopaccResponsePayload: result as unknown as object,
            jopaccMessageId: result.messageId,
          },
        }),
      ]);

      return transaction;
    } catch (error) {
      this.logger.error(`Top-up PIS initiation failed for user ${userId}: ${(error as Error).message}`);
      return this.createFailedTopup(userId, linkedAccount.id, dto.amount, linkedAccount.currency, {
        jopaccCallType: 'PIS',
        jopaccRequestPayload: payload as unknown as object,
        failureReason: (error as Error).message,
      });
    }
  }

  private async createFailedTopup(
    userId: string,
    linkedBankAccountId: string,
    amount: number,
    currency: string,
    extra: {
      jopaccCallType: string;
      jopaccRequestPayload?: object;
      jopaccResponsePayload?: object;
      failureReason: string;
    },
  ) {
    return this.prisma.walletTransaction.create({
      data: {
        type: TransactionType.TOPUP,
        status: TransactionStatus.FAILED,
        amount,
        currency,
        ownerId: userId,
        linkedBankAccountId,
        resolvedAt: new Date(),
        ...extra,
      },
    });
  }

  private buildTopupPisPayload(
    customerAccount: LinkedBankAccount,
    settlementAccount: LinkedBankAccount,
    customer: User,
    admin: User,
    amount: number,
  ): PisInitiationRequest {
    const now = new Date();
    const endToEnd = `topup-${customer.id}-${now.getTime()}`;

    return {
      groupHeader: {
        batchBooking: 'true',
        numberOfTrx: '1',
        paymentMethod: 'DOMESTIC.CLIQ',
        totalTrxAmount: { amount, currency: customerAccount.currency },
        batchPurpose: 'PIS.IPS.Initiation.ecom',
      },
      instructionsInfo: [
        {
          trxAmount: { amount, currency: customerAccount.currency },
          clearingChannel: 'RTGS',
          localInstrument: 'CLIQ',
          serviceLevel: 'EXPRESS',
          categoryPurpose: 'SALA',
          identifications: {
            endToEnd,
            quoteId: `quote-${endToEnd}`,
            SOSPId: `sosp-${endToEnd}`,
          },
          settlementDate: now.toISOString().slice(0, 10),
          // The sandbox's PIS endpoint only accepts creditor-side info — any
          // dbtr/dbtrAcct entry (even a well-formed one) makes it fail with a
          // generic 500 on every request, confirmed empirically. The debtor
          // is the authenticated customer initiating the payment, implicit.
          involvedParties: [
            {
              involvedPartyType: 'cdtr',
              involvedParty: {
                enName: admin.fullName,
                address: { addresslines: [], countryInfo: { countryCode: 'JO', countryName: 'Jordan' } },
              },
            },
          ],
          accounts: [
            { mainRoute: { schema: 'IBAN', address: settlementAccount.iban }, accountType: 'cdtrAcct' },
          ],
          agents: [
            {
              agentType: 'cdtrAgt',
              agent: {
                agentIdentification: { schema: 'BIC', address: settlementAccount.institutionBic ?? '' },
                enName: settlementAccount.institutionName ?? '',
              },
            },
          ],
          remittanceInformation: { unstructured: [`ZWallet top-up for ${customer.fullName}`] },
          trxPresDateTime: now.toISOString(),
        },
      ],
    };
  }
}
