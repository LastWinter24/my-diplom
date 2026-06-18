// backend/src/pages/pages.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('pages')
export class PagesController {
  constructor(private prisma: PrismaService) {}

  // Получить контент страницы по имени (например, "home" или "feedback")
  @Get(':name')
  async getPage(@Param('name') name: string) {
    const page = await this.prisma.pageContent.findUnique({
      where: { pageName: name },
    });
    // Если страницы еще нет в базе, возвращаем пустую строку
    return page || { content: '' };
  }

  //Специальный роут для отправки отзывов (Доступен ВСЕМ авторизованным пользователям)
  @UseGuards(JwtAuthGuard)
  @Post('feedback')
  async updateFeedback(@Body() body: { content: string }) {
    return this.prisma.pageContent.upsert({
      where: { pageName: 'feedback' },
      update: { content: body.content },
      create: { pageName: 'feedback', content: body.content },
    });
  }

  // Обновить контент других страниц (только для ADMIN и MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.CHEF, Role.SUPER_ADMIN)
  @Post(':name')
  async updatePage(@Param('name') name: string, @Body() body: { content: string }) {
    return this.prisma.pageContent.upsert({
      where: { pageName: name },
      update: { content: body.content },
      create: { pageName: name, content: body.content },
    });
  }
}