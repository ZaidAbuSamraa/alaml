import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee } from '../entities/employee.entity';
import { TimeLog } from '../entities/time-log.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(TimeLog)
    private timeLogRepository: Repository<TimeLog>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    const existingEmployee = await this.employeeRepository.findOne({
      where: { username: createEmployeeDto.username },
    });

    if (existingEmployee) {
      throw new ConflictException('اسم المستخدم موجود بالفعل');
    }

    const hashedPassword = await bcrypt.hash(createEmployeeDto.password, 10);

    const employee = this.employeeRepository.create({
      ...createEmployeeDto,
      password: hashedPassword,
    });

    await this.employeeRepository.save(employee);

    const { password, ...result } = employee;
    return result;
  }

  async findAll() {
    const employees = await this.employeeRepository.find({
      select: ['id', 'name', 'username', 'hourlyWage', 'specialty', 'createdAt', 'updatedAt'],
    });
    return employees;
  }

  async update(id: number, updateData: Partial<Employee>) {
    await this.employeeRepository.update(id, updateData);
    return await this.employeeRepository.findOne({ 
      where: { id },
      select: ['id', 'name', 'username', 'hourlyWage', 'specialty', 'createdAt', 'updatedAt'],
    });
  }

  async findOne(id: number) {
    return await this.employeeRepository.findOne({ 
      where: { id },
      select: ['id', 'name', 'username', 'hourlyWage', 'specialty', 'createdAt', 'updatedAt'],
    });
  }

  async remove(id: number) {
    // Check if employee exists
    const employee = await this.employeeRepository.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException('الموظف غير موجود');
    }

    // Delete all time logs for this employee
    await this.timeLogRepository.delete({ employeeId: id });
    
    // Delete the employee
    await this.employeeRepository.delete(id);
    
    return { message: 'تم حذف الموظف بنجاح' };
  }
}
