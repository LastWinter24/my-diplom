// backend/src/auth/auth.controller.ts
import { Body, Controller, Post, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard'; 
import { RolesGuard } from '../common/guards/roles.guard'; 
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ЗАКРЫВАЕМ РЕГИСТРАЦИЮ (Доступно только админам)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('register')
  register(@Body() dto: RegisterDto) { 
    return this.authService.register(dto);
  }

  // Логин остается открытым для всех
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ПАНЕЛЬ АДМИНИСТРАТОРА
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('users')
  getAllUsers() {
    return this.authService.getAllUsers();
  }

  // Обновить роль и должность
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() data: any) {
    return this.authService.updateUser(id, data);
  }

  // Уволить / Восстановить (Деактивация)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch('users/:id/status')
  toggleUserStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.authService.toggleUserStatus(id, isActive);
  }
}