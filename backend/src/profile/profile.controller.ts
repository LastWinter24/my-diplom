// backend/src/profile/profile.controller.ts
import { Controller, Get, Patch, UseGuards, Req, Body, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as bcrypt from 'bcrypt';

import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { PrismaService } from '../prisma/prisma.service'; 

@Controller('profile')
export class ProfileController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getProfile(@Req() req: any) {
    const user: any = await this.prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    if (user) {
      delete user.passwordHash; 
    }
    
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `avatar-${uniqueSuffix}${extname(file.originalname)}`);
      }
    })
  }))
  async updateProfile(
    @Req() req: any,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const updateData: any = {};

    if (body.fullName) {
      updateData.fullName = body.fullName;
    }


    // ЛОГИКА БЕЗОПАСНОЙ СМЕНЫ ПАРОЛЯ

    if (body.newPassword) {
      if (!body.oldPassword) {
        throw new BadRequestException('Необходимо указать текущий пароль');
      }

      //Достаем текущего юзера из базы, чтобы проверить старый пароль
      const currentUser = await this.prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!currentUser) {
        throw new BadRequestException('Пользователь не найден');
      }

      //Сверяем введенный старый пароль с хешем из базы
      const isPasswordValid = await bcrypt.compare(body.oldPassword, currentUser.passwordHash);
      
      if (!isPasswordValid) {
        throw new BadRequestException('Неверный текущий пароль');
      }

      //Если всё ок, хешируем новый и записываем в объект для обновления
      updateData.passwordHash = await bcrypt.hash(body.newPassword, 10);
    }

    if (file) {
      updateData.avatarUrl = `/uploads/${file.filename}`;
    }

    // Сохраняем все изменения в базу
    const updatedUser: any = await this.prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    delete updatedUser.passwordHash; // Удаляем хеш перед отправкой на фронт
    return updatedUser; 
  }
}