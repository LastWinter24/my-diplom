// backend/src/auth/auth.service.ts
import { ConflictException, Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
// nodemailer убран

@Injectable()
export class AuthService {

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService 
  ) {}

  // Метод sendVerificationCode удален

  async register(dto: RegisterDto) {
    // Убраны все проверки сохраненных кодов и сроков действия
    
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    
    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: hashedPassword,
          fullName: dto.fullName,
        },
      });

      const { passwordHash, ...result } = user;
      return result;
    } catch (error) {
      console.error('ОШИБКА ПРИ РЕГИСТРАЦИИ В БД:', error);
      throw new BadRequestException('Ошибка сохранения в базу данных');
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Ваш аккаунт был деактивирован. Обратитесь к руководству.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwt.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      }
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: { 
        id: true, email: true, fullName: true, role: true, 
        position: true, department: true, isActive: true, avatarUrl: true 
      },
      orderBy: { fullName: 'asc' }
    });
  }

  async updateUser(id: string, data: any) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { 
          role: data.role, 
          position: data.position, 
          department: data.department 
        }
      });
    } catch (error) {
      console.error('ОШИБКА ПРИ ОБНОВЛЕНИИ ПОЛЬЗОВАТЕЛЯ:', error);
      throw new BadRequestException('Не удалось обновить роль или данные');
    }
  }

  async toggleUserStatus(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive }
    });
  }
}