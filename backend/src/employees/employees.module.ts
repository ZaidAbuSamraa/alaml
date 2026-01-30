import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { Employee } from '../entities/employee.entity';
import { TimeLog } from '../entities/time-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, TimeLog])],
  controllers: [EmployeesController],
  providers: [EmployeesService],
})
export class EmployeesModule {}
