import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';
import { Payment } from '../entities/payment.entity';
import { CashFlowDay } from '../entities/cashflow-day.entity';
import { Supplier } from '../entities/supplier.entity';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, CashFlowDay, Supplier]),
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [VoiceController],
  providers: [VoiceService],
  exports: [VoiceService],
})
export class VoiceModule {}
