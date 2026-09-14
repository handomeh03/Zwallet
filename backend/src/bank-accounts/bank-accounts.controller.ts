import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { BankAccountsService } from './bank-accounts.service';
import { LinkAccountDto } from './dto/link-account.dto';

@UseGuards(JwtAuthGuard)
@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Post('link')
  link(@CurrentUser() user: AuthenticatedUser, @Body() dto: LinkAccountDto, @Req() req: Request) {
    return this.bankAccountsService.link(user.userId, dto, req.ip);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.bankAccountsService.list(user.userId);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bankAccountsService.findOwned(user.userId, id);
  }

  @Post(':id/set-primary')
  setPrimary(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bankAccountsService.setPrimary(user.userId, id);
  }

  @Delete(':id')
  unlink(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bankAccountsService.unlink(user.userId, id);
  }
}
