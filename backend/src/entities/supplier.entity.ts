import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Invoice } from './invoice.entity';
import { Payment } from './payment.entity';
import { SupplierCashflowNote } from './supplier-cashflow-note.entity';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  phone: string;

  @OneToMany(() => Invoice, invoice => invoice.supplier)
  invoices: Invoice[];

  @OneToMany(() => Payment, payment => payment.supplier)
  payments: Payment[];

  @OneToMany(() => SupplierCashflowNote, note => note.supplier)
  cashflowNotes: SupplierCashflowNote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
