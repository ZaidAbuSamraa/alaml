import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Employee } from '../entities/employee.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { username } });
    
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('بيانات الدخول غير صحيحة');
      }

      const payload = { sub: user.id, username: user.username, role: user.role, type: 'admin' };
      const token = this.jwtService.sign(payload);

      return {
        access_token: token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          type: 'admin',
        },
      };
    }

    const employee = await this.employeeRepository.findOne({ where: { username } });
    
    if (employee) {
      const isPasswordValid = await bcrypt.compare(password, employee.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('بيانات الدخول غير صحيحة');
      }

      const payload = { sub: employee.id, username: employee.username, role: 'employee', type: 'employee', name: employee.name };
      const token = this.jwtService.sign(payload);

      return {
        access_token: token,
        user: {
          id: employee.id,
          username: employee.username,
          name: employee.name,
          role: 'employee',
          type: 'employee',
        },
      };
    }

    throw new UnauthorizedException('بيانات الدخول غير صحيحة');
  }

  async validateUser(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      return user;
    }
    const employee = await this.employeeRepository.findOne({ where: { id: userId } });
    return employee;
  }
}
