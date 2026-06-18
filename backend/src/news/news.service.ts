// src/news/news.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsDto } from './dto/create-news.dto';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  // Создаем новость, привязывая ее к ID автора
  async create(dto: CreateNewsDto, authorId: string) {
    return this.prisma.news.create({
      data: {
        title: dto.title,
        content: dto.content,
        authorId: authorId,
      },
    });
  }

  // Получаем все новости
  async findAll() {
    return this.prisma.news.findMany({
      orderBy: { createdAt: 'desc' }, 
      include: {
        // Просим Призму сразу подтянуть данные автора (чтобы не делать второй запрос)
        author: {
          select: { fullName: true, position: true },
        },
      },
    });
  }
}