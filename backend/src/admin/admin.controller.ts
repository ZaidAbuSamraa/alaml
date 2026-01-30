import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('admin')
export class AdminController {
  @Get('dashboard')
  getDashboard() {
    return {
      message: 'مرحباً في لوحة التحكم',
    };
  }
}
