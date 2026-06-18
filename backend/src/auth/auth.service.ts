import { ConflictException, Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private verificationCodes = new Map<string, { code: string, expiresAt: number }>();
  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService 
  ) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.mail.ru',
      port: 465,
      secure: true,
      auth: {
        user: 'neretin-205@bk.ru', // ПОЧТА 
        pass: 'QgacmPeU08dze4BN8mHk' // ПАРОЛЬ ПРИЛОЖЕНИЯ
      },
    });
  }

  async sendVerificationCode(email: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    this.verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, 
    });

    const smtpUser = (this.transporter.options as any).auth?.user;

    // 4. ОТПРАВЛЯЕМ ПИСЬМО В ФОНОВОМ РЕЖИМЕ
    this.transporter.sendMail({
      from: `"Портал Две Березки" <${smtpUser}>`, 
      to: email,
      subject: 'Код подтверждения регистрации',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb; border-radius: 12px;">
          <h2 style="color: #064e3b;">Добро пожаловать в "Две Березки"! 🌳</h2>
          <p style="color: #374151; font-size: 16px;">Ваш код для подтверждения электронной почты:</p>
          <div style="background-color: #fff; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
            <h1 style="color: #10B981; font-size: 40px; margin: 0; letter-spacing: 8px;">${code}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Код действителен 10 минут. Если вы не запрашивали этот код, просто проигнорируйте письмо.</p>
        </div>
      `,
    })
    .then(() => {
      console.log(`Письмо успешно отправлено на ${email}`);
    })
    .catch((error) => {
      console.error('\n⚠️ ОШИБКА ОТПРАВКИ ПИСЬМА (Проверьте пароль приложения или порт 465)');
      console.log(`[ДЕБАГ] Чтобы вы могли продолжить тест, ваш код: ---> ${code} <--- \n`);
    });

    return { message: 'Код отправлен' };
  }

  async register(dto: any) {
    const savedData = this.verificationCodes.get(dto.email);
    
    if (!savedData) {
      throw new BadRequestException('Код подтверждения не запрашивался или устарел');
    }

    if (savedData.expiresAt < Date.now()) {
      this.verificationCodes.delete(dto.email); 
      throw new BadRequestException('Время действия кода истекло. Вернитесь назад и запросите новый.');
    }

    if (savedData.code !== dto.code) {
      throw new BadRequestException('Неверный код подтверждения');
    }

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

      this.verificationCodes.delete(dto.email);
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