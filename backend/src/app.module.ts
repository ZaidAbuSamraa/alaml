import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { EmployeesModule } from './employees/employees.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CashModule } from './cash/cash.module';
import { SalesModule } from './sales/sales.module';
import { TimeLogsModule } from './time-logs/time-logs.module';
import { ResourceRequestsModule } from './resource-requests/resource-requests.module';
import { NotificationsModule } from './notifications/notifications.module';
import { User } from './entities/user.entity';
import { Employee } from './entities/employee.entity';
import { Supplier } from './entities/supplier.entity';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { Transaction } from './entities/transaction.entity';
import { Cash } from './entities/cash.entity';
import { Sale } from './entities/sale.entity';
import { TimeLog } from './entities/time-log.entity';
import { Notification } from './entities/notification.entity';
import { ResourceRequest } from './entities/resource-request.entity';
import { CashFlowModule } from './cashflow/cashflow.module';
import { CashFlowDay } from './entities/cashflow-day.entity';
import { CashFlowPayment } from './entities/cashflow-payment.entity';
import { CashFlowSettings } from './entities/cashflow-settings.entity';
import { SupplierCashflowNote } from './entities/supplier-cashflow-note.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'alaml',
      entities: [User, Employee, Supplier, Invoice, Payment, Transaction, Cash, Sale, TimeLog, Notification, ResourceRequest, CashFlowDay, CashFlowPayment, CashFlowSettings, SupplierCashflowNote],
      synchronize: true,
    }),
    AuthModule,
    AdminModule,
    EmployeesModule,
    SuppliersModule,
    AnalyticsModule,
    CashModule,
    SalesModule,
    TimeLogsModule,
    ResourceRequestsModule,
    NotificationsModule,
    CashFlowModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
