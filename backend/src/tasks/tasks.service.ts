// src/tasks/tasks.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { FeedbackStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  //Создать заявку/отзыв
  async create(dto: CreateTaskDto, userId: string) {
    return this.prisma.feedback.create({
      data: {
        type: dto.type,
        title: dto.title,
        content: dto.content,
        priority: dto.priority || 'MEDIUM', 
        isAnonymous: dto.isAnonymous || false,
        authorId: dto.isAnonymous ? null : userId, 
      },
    });
  }

  //Получить все заявки (для менеджера)
  async findAll() {
    return this.prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        author: { 
          select: { 
            fullName: true, 
            department: true,
            avatarUrl: true 
          } 
        } 
      },
    });
  }

  //Получить только свои заявки
  async findMy(userId: string) {
    return this.prisma.feedback.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: { 
        //Прикрепляем автора и его фото к личным задачам тоже
        author: { 
          select: { 
            fullName: true, 
            avatarUrl: true 
          } 
        } 
      },
    });
  }

  //Изменить статус заявки
  async updateStatus(id: string, status: FeedbackStatus) {
    return this.prisma.feedback.update({
      where: { id: id },
      data: { status: status },
    });
  }
}