import { Controller, Post, Put, Body, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Put('profile')
  async updateProfile(@Body() updateData: { userId: number; name?: string; currentPassword?: string; newPassword?: string }) {
    return this.authService.updateProfile(updateData.userId, updateData);
  }
}
