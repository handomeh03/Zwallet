import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { TopupService } from './topup.service';
import { TopupDto } from './dto/topup.dto';

@UseGuards(JwtAuthGuard)
@Controller('topup')
export class TopupController {
  constructor(private readonly topupService: TopupService) {}

  @Post()
  topup(@CurrentUser() user: AuthenticatedUser, @Body() dto: TopupDto, @Req() req: Request) {
    return this.topupService.topup(user.userId, dto, req.ip);
  }
}
