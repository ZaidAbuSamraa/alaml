import { Controller, Post, UseInterceptors, UploadedFile, Body, Get, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VoiceService } from './voice.service';

@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribeAudio(@UploadedFile() file: any) {
    console.log('Received transcribe request');
    console.log('File received:', file ? 'Yes' : 'No');
    
    if (!file) {
      throw new HttpException('No audio file uploaded', HttpStatus.BAD_REQUEST);
    }
    
    try {
      return await this.voiceService.transcribeAndAnalyze(file);
    } catch (error) {
      console.error('Controller error:', error);
      throw error;
    }
  }

  @Post('confirm-payment')
  async confirmPayment(@Body() paymentData: any) {
    return await this.voiceService.savePayment(paymentData);
  }

  @Get('suppliers/search')
  async searchSuppliers(@Body('name') name: string) {
    return await this.voiceService.searchSuppliers(name);
  }
}
