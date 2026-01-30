import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourceRequestsController } from './resource-requests.controller';
import { ResourceRequestsService } from './resource-requests.service';
import { ResourceRequest } from '../entities/resource-request.entity';
import { Notification } from '../entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ResourceRequest, Notification])],
  controllers: [ResourceRequestsController],
  providers: [ResourceRequestsService],
})
export class ResourceRequestsModule {}
