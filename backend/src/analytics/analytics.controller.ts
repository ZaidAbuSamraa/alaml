import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.analyticsService.getAnalytics(
      startDate,
      endDate,
      supplierId ? parseInt(supplierId) : undefined,
    );
  }

  @Get('recent')
  async getRecentTransactions(@Query('limit') limit?: string) {
    return this.analyticsService.getRecentTransactions(
      limit ? parseInt(limit) : 10,
    );
  }
}
