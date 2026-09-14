import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { BalancesService } from './balances.service';

@UseGuards(JwtAuthGuard)
@Controller('bank-accounts')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get(':id/balance')
  getBalance(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Req() req: Request) {
    return this.balancesService.getBalance(user.userId, id, req.ip);
  }
}
