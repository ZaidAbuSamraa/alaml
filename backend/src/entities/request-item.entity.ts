import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ResourceRequest } from './resource-request.entity';

export enum ItemStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('request_items')
export class RequestItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: ItemStatus,
    default: ItemStatus.PENDING,
  })
  status: ItemStatus;

  @Column({ nullable: true })
  adminNotes: string;

  @ManyToOne(() => ResourceRequest, request => request.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request: ResourceRequest;

  @Column()
  requestId: number;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;
}
