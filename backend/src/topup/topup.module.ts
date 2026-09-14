import { Module } from '@nestjs/common';
import { TopupService } from './topup.service';
import { TopupController } from './topup.controller';
import { JopaccClientModule } from '../jopacc-client/jopacc-client.module';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';

@Module({
  imports: [JopaccClientModule, BankAccountsModule],
  controllers: [TopupController],
  providers: [TopupService],
  exports: [TopupService],
})
export class TopupModule {}
