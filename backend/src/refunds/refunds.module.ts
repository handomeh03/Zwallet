import { Module } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { RefundsController } from './refunds.controller';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';
import { TopupModule } from '../topup/topup.module';

@Module({
  imports: [BankAccountsModule, TopupModule],
  controllers: [RefundsController],
  providers: [RefundsService],
})
export class RefundsModule {}
