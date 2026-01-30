import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { TimeLogsService } from './time-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('time-logs')
export class TimeLogsController {
  constructor(private readonly timeLogsService: TimeLogsService) {}

  @Post('clock-in/:employeeId')
  clockIn(@Param('employeeId') employeeId: string) {
    return this.timeLogsService.clockIn(+employeeId);
  }

  @Post('clock-out/:employeeId')
  clockOut(@Param('employeeId') employeeId: string) {
    return this.timeLogsService.clockOut(+employeeId);
  }

  @Get('active/:employeeId')
  getActiveSession(@Param('employeeId') employeeId: string) {
    return this.timeLogsService.getActiveSession(+employeeId);
  }

  @Get('employee/:employeeId')
  getEmployeeTimeLogs(@Param('employeeId') employeeId: string) {
    return this.timeLogsService.getEmployeeTimeLogs(+employeeId);
  }

  @Get('all')
  getAllTimeLogs() {
    return this.timeLogsService.getAllTimeLogs();
  }

  @Get('earnings/:employeeId')
  getEmployeeTotalEarnings(@Param('employeeId') employeeId: string) {
    return this.timeLogsService.getEmployeeTotalEarnings(+employeeId);
  }

  @Get('earnings/:employeeId/:year/:month')
  getEmployeeMonthlyEarnings(
    @Param('employeeId') employeeId: string,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.timeLogsService.getEmployeeMonthlyEarnings(+employeeId, +year, +month);
  }
}
