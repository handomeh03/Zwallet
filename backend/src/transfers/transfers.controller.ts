import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { TransfersService } from './transfers.service';
import { ResolveRecipientDto } from './dto/resolve-recipient.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';

@UseGuards(JwtAuthGuard)
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post('resolve-recipient')
  resolveRecipient(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ResolveRecipientDto,
    @Req() req: Request,
  ) {
    return this.transfersService.resolveRecipient(user.userId, dto, req.ip);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTransferDto, @Req() req: Request) {
    return this.transfersService.createTransfer(user.userId, dto, req.ip);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.transfersService.cancel(user.userId, id);
  }

  @Post(':id/confirm-now')
  confirmNow(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.transfersService.confirmNow(user.userId, id);
  }

  @Get(':id')
  getById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.transfersService.getById(user.userId, id);
  }
}
