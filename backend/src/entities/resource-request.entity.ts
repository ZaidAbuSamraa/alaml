import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Employee } from './employee.entity';

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('resource_requests')
export class ResourceRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  requestName: string;

  @Column('text')
  description: string;

  @Column({ type: 'date' })
  requestDate: string;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column({ nullable: true })
  adminNotes: string;

  @ManyToOne(() => Employee, { eager: true })
  employee: Employee;

  @Column()
  employeeId: number;

  @CreateDateColumn()
  createdAt: Date;
}
