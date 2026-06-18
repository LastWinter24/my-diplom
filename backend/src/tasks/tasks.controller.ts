// backend/src/tasks/tasks.controller.ts
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Delete, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, FeedbackStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service'; 

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private prisma: PrismaService 
  ) {}

  // Создать может любой сотрудник
  @Post('create')
  create(@Body() dto: CreateTaskDto, @Request() req: any) {
    return this.tasksService.create(dto, req.user.id);
  }

  // Посмотреть свои может любой
  @Get('my')
  findMy(@Request() req: any) {
    return this.tasksService.findMy(req.user.id);
  }

  @Get('all')
  findAll() {
    return this.tasksService.findAll();
  }

  // Менять статус могут только менеджеры
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string, 
    @Body('status') status: FeedbackStatus
  ) {
    return this.tasksService.updateStatus(id, status);
  }

  //Редактировать заявку (Может автор)
  @Patch(':id')
  async updateTask(
    @Param('id') id: string, 
    @Body() body: { title: string; content: string }, 
    @Request() req: any
  ) {
    const task = await this.prisma.feedback.findUnique({ where: { id } });
    if (!task) throw new ForbiddenException('Заявка не найдена');

    //Тот ли это автор?
    if (task.authorId !== req.user.id) {
      throw new ForbiddenException('Вы можете редактировать только свои заявки!');
    }

    return this.prisma.feedback.update({
      where: { id },
      data: { title: body.title, content: body.content },
    });
  }

  //Удалять заявку (Может автор)
  @Delete(':id')
  async deleteTask(@Param('id') id: string, @Request() req: any) {
    const task = await this.prisma.feedback.findUnique({ where: { id } });
    if (!task) throw new ForbiddenException('Заявка не найдена');

    //Тот ли это автор?
    if (task.authorId !== req.user.id) {
      throw new ForbiddenException('Вы можете удалять только свои заявки!');
    }

    return this.prisma.feedback.delete({ where: { id } });
  }
}