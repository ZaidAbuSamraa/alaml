import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { CashService } from './cash.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Get()
  getCash() {
    return this.cashService.getCash();
  }

  @Put()
  updateCash(@Body() body: { amount: number; notes?: string }) {
    return this.cashService.updateCash(body.amount, body.notes);
  }
}
