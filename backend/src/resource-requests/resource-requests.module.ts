import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourceRequestsController } from './resource-requests.controller';
import { ResourceRequestsService } from './resource-requests.service';
import { ResourceRequest } from '../entities/resource-request.entity';
import { RequestItem } from '../entities/request-item.entity';
import { Notification } from '../entities/notification.entity';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResourceRequest, RequestItem, Notification]),
    WhatsAppModule,
  ],
  controllers: [ResourceRequestsController],
  providers: [ResourceRequestsService],
})
export class ResourceRequestsModule {}
