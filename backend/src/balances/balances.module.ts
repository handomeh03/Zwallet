import { Module } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { BalancesController } from './balances.controller';
import { JopaccClientModule } from '../jopacc-client/jopacc-client.module';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';

@Module({
  imports: [JopaccClientModule, BankAccountsModule],
  controllers: [BalancesController],
  providers: [BalancesService],
})
export class BalancesModule {}
