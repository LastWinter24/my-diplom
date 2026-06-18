// backend/src/news/news.controller.ts
import { Controller, Get, Post, Body, UseGuards, Request, Delete, Param, Patch, ForbiddenException } from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private prisma: PrismaService 
  ) {}

  //Читать новости могут ВСЕ авторизованные сотрудники
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.prisma.news.findMany({
      orderBy: {
        createdAt: 'desc', 
      },
      include: {
        author: {
          select: {
            fullName: true,
            avatarUrl: true, 
          },
        },
      },
    });
  }

  //Создавать новости могут ТОЛЬКО админы и менеджеры
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPER_ADMIN) 
  @Post('create')
  create(@Body() dto: CreateNewsDto, @Request() req: any) {
    const authorId = req.user.id;
    return this.newsService.create(dto, authorId);
  }

  //Редактировать новость (PATCH)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPER_ADMIN) 
  @Patch(':id')
  async updateNews(@Param('id') id: string, @Body() body: { title: string; content: string }, @Request() req: any) {
    //Находим новость в базе
    const newsItem = await this.prisma.news.findUnique({ where: { id } });
    if (!newsItem) {
      throw new ForbiddenException('Новость не найдена');
    }

    //Тот ли это автор?
    if (newsItem.authorId !== req.user.id) {
      throw new ForbiddenException('Вы можете редактировать только свои новости!');
    }

    //Если всё ок, сохраняем новые данные
    return this.prisma.news.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content,
      },
    });
  }

  //Удалять новость (DELETE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPER_ADMIN) 
  @Delete(':id')
  async deleteNews(@Param('id') id: string, @Request() req: any) {
    // Находим новость
    const newsItem = await this.prisma.news.findUnique({ where: { id } });
    if (!newsItem) {
      throw new ForbiddenException('Новость не найдена');
    }

    //Тот ли это автор?
    if (newsItem.authorId !== req.user.id) {
      throw new ForbiddenException('Вы можете удалять только свои новости!');
    }

    // Если всё ок, удаляем
    return this.prisma.news.delete({
      where: { id },
    });
  }
}