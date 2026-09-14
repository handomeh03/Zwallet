import { Module } from '@nestjs/common';
import { JopaccClientService } from './jopacc-client.service';
import { JwsSigningService } from './jws-signing.service';

@Module({
  providers: [JopaccClientService, JwsSigningService],
  exports: [JopaccClientService],
})
export class JopaccClientModule {}
