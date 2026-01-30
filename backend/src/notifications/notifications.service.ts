import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async getUnreadNotifications(): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { isRead: false },
      order: { createdAt: 'DESC' },
      relations: ['employee'],
    });
  }

  async getAllNotifications(): Promise<Notification[]> {
    return await this.notificationRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['employee'],
    });
  }

  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (notification) {
      notification.isRead = true;
      return await this.notificationRepository.save(notification);
    }
    return null;
  }

  async markAllAsRead(): Promise<void> {
    await this.notificationRepository.update({ isRead: false }, { isRead: true });
  }

  async getUnreadCount(): Promise<number> {
    return await this.notificationRepository.count({ where: { isRead: false } });
  }
}
