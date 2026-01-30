import { Controller, Get, Put, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread')
  getUnreadNotifications() {
    return this.notificationsService.getUnreadNotifications();
  }

  @Get('all')
  getAllNotifications() {
    return this.notificationsService.getAllNotifications();
  }

  @Get('count')
  getUnreadCount() {
    return this.notificationsService.getUnreadCount();
  }

  @Put('mark-read/:id')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(+id);
  }

  @Put('mark-all-read')
  markAllAsRead() {
    return this.notificationsService.markAllAsRead();
  }
}
