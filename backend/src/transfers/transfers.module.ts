import { Module } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { TransferExpiryProcessor } from './transfer-expiry.processor';
import { JopaccClientModule } from '../jopacc-client/jopacc-client.module';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';

@Module({
  imports: [JopaccClientModule, BankAccountsModule],
  controllers: [TransfersController],
  providers: [TransfersService, TransferExpiryProcessor],
})
export class TransfersModule {}
