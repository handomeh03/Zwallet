import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { RefundsService } from './refunds.service';
import { CreateRefundRequestDto } from './dto/create-refund-request.dto';

@UseGuards(JwtAuthGuard)
@Controller('refund-requests')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRefundRequestDto) {
    return this.refundsService.create(user.userId, dto);
  }

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.refundsService.listMine(user.userId);
  }

  @Get(':id')
  getById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.refundsService.getById(user.userId, id);
  }

  @Post(':id/approve')
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Req() req: Request) {
    return this.refundsService.approve(user.userId, id, req.ip);
  }

  @Post(':id/reject')
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.refundsService.reject(user.userId, id);
  }
}
