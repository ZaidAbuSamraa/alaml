import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { RequestItem } from './request-item.entity';

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

  @Column('text', { nullable: true })
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

  @OneToMany(() => RequestItem, item => item.request, { cascade: true })
  items: RequestItem[];

  @CreateDateColumn()
  createdAt: Date;
}
