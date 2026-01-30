import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';

@Entity('time_logs')
export class TimeLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employeeId: number;

  @ManyToOne(() => Employee, { eager: true })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({ type: 'timestamp' })
  clockIn: Date;

  @Column({ type: 'timestamp', nullable: true })
  clockOut: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  hoursWorked: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  earnedSalary: number;

  @Column({ default: 'active' })
  status: string; // active, completed

  @CreateDateColumn()
  createdAt: Date;
}
