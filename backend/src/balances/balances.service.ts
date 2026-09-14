import { Injectable } from '@nestjs/common';
import { JopaccClientService } from '../jopacc-client/jopacc-client.service';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';

@Injectable()
export class BalancesService {
  constructor(
    private readonly jopaccClient: JopaccClientService,
    private readonly bankAccountsService: BankAccountsService,
  ) {}

  async getBalance(userId: string, linkedBankAccountId: string, ipAddress?: string) {
    const linkedAccount = await this.bankAccountsService.findOwned(userId, linkedBankAccountId);
    return this.jopaccClient.getBalances(linkedAccount.accountId, { customerId: userId, ipAddress });
  }
}
