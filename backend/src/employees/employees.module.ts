import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { Employee } from '../entities/employee.entity';
import { TimeLog } from '../entities/time-log.entity';
import { ResourceRequest } from '../entities/resource-request.entity';
import { Notification } from '../entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, TimeLog, ResourceRequest, Notification])],
  controllers: [EmployeesController],
  providers: [EmployeesService],
})
export class EmployeesModule {}
