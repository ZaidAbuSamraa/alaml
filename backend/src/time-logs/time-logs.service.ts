import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeLog } from '../entities/time-log.entity';
import { Employee } from '../entities/employee.entity';
import { Notification, NotificationType } from '../entities/notification.entity';

@Injectable()
export class TimeLogsService {
  constructor(
    @InjectRepository(TimeLog)
    private timeLogRepository: Repository<TimeLog>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async clockIn(employeeId: number): Promise<TimeLog> {
    try {
      const activeLog = await this.timeLogRepository.findOne({
        where: { employeeId, status: 'active' },
      });

      if (activeLog) {
        throw new HttpException('الموظف لديه جلسة نشطة بالفعل', HttpStatus.BAD_REQUEST);
      }

      const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
      
      if (!employee) {
        throw new HttpException('الموظف غير موجود', HttpStatus.NOT_FOUND);
      }
      
      const timeLog = this.timeLogRepository.create({
        employeeId,
        clockIn: new Date(),
        status: 'active',
      });

      const savedLog = await this.timeLogRepository.save(timeLog);

      const notification = this.notificationRepository.create({
        employeeId,
        type: NotificationType.CLOCK_IN,
        message: `${employee.name} قام بتسجيل الدخول`,
        isRead: false,
      });
      await this.notificationRepository.save(notification);

      return savedLog;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('فشل تسجيل الدخول', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async clockOut(employeeId: number): Promise<TimeLog> {
    try {
      const activeLog = await this.timeLogRepository.findOne({
        where: { employeeId, status: 'active' },
        relations: ['employee'],
      });

      if (!activeLog) {
        throw new HttpException('لا توجد جلسة نشطة للموظف', HttpStatus.BAD_REQUEST);
      }

      // Ensure employee data is loaded
      if (!activeLog.employee) {
        const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
        if (!employee) {
          throw new HttpException('الموظف غير موجود', HttpStatus.NOT_FOUND);
        }
        activeLog.employee = employee;
      }

      const clockOut = new Date();
      const hoursWorked = (clockOut.getTime() - activeLog.clockIn.getTime()) / (1000 * 60 * 60);
      const hourlyWage = Number(activeLog.employee.hourlyWage || 0);
      const earnedSalary = hoursWorked * hourlyWage;
      
      console.log('Clock out calculation:', {
        employeeId,
        hourlyWage,
        hoursWorked: hoursWorked.toFixed(2),
        earnedSalary: earnedSalary.toFixed(2)
      });

    activeLog.clockOut = clockOut;
    activeLog.hoursWorked = Number(hoursWorked.toFixed(2));
    activeLog.earnedSalary = Number(earnedSalary.toFixed(2));
    activeLog.status = 'completed';

      const savedLog = await this.timeLogRepository.save(activeLog);

      const notification = this.notificationRepository.create({
        employeeId,
        type: NotificationType.CLOCK_OUT,
        message: `${activeLog.employee.name} قام بتسجيل الخروج - ${hoursWorked.toFixed(2)} ساعة`,
        isRead: false,
      });
      await this.notificationRepository.save(notification);

      return savedLog;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('فشل تسجيل الخروج', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getActiveSession(employeeId: number): Promise<TimeLog | null> {
    return await this.timeLogRepository.findOne({
      where: { employeeId, status: 'active' },
      relations: ['employee'],
    });
  }

  async getEmployeeTimeLogs(employeeId: number): Promise<TimeLog[]> {
    return await this.timeLogRepository.find({
      where: { employeeId },
      order: { clockIn: 'DESC' },
      relations: ['employee'],
    });
  }

  async getAllTimeLogs(): Promise<TimeLog[]> {
    return await this.timeLogRepository.find({
      order: { clockIn: 'DESC' },
      relations: ['employee'],
    });
  }

  async getEmployeeTotalEarnings(employeeId: number): Promise<number> {
    const logs = await this.timeLogRepository.find({
      where: { employeeId, status: 'completed' },
    });
    return logs.reduce((sum, log) => sum + Number(log.earnedSalary || 0), 0);
  }

  async getEmployeeMonthlyEarnings(employeeId: number, year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const logs = await this.timeLogRepository
      .createQueryBuilder('timeLog')
      .where('timeLog.employeeId = :employeeId', { employeeId })
      .andWhere('timeLog.status = :status', { status: 'completed' })
      .andWhere('timeLog.clockIn >= :startDate', { startDate })
      .andWhere('timeLog.clockIn <= :endDate', { endDate })
      .getMany();

    return logs.reduce((sum, log) => sum + Number(log.earnedSalary || 0), 0);
  }
}
