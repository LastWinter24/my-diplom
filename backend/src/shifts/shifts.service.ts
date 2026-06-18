// backend/src/shifts/shifts.service.ts
import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { Cron, CronExpression } from '@nestjs/schedule'; 

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name); 

  constructor(private prisma: PrismaService) {}

  // РОБОТ: АВТОМАТИЧЕСКОЕ ЗАКРЫТИЕ СМЕН (СТРОГИЙ УЧЕТ)
  @Cron(CronExpression.EVERY_MINUTE) 
  async autoCloseExpiredShifts() {
    const activeShifts = await this.prisma.shift.findMany({
      where: { status: 'IN_PROGRESS' },
    });

    if (activeShifts.length === 0) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    let closedCount = 0;

    for (const shift of activeShifts) {
      // Парсим время конца смены (например "18:00")
      const [endH, endM] = shift.endTime.split(':').map(Number);
      const endTotalMinutes = endH * 60 + endM;

      // Если время вышло (без всяких буферов)
      if (currentTotalMinutes >= endTotalMinutes) {
        
        // ИДЕАЛЬНОЕ время закрытия (ровно 18:00:00), 
        // чтобы бухгалтерия посчитала зарплату секунда в секунду по графику
        const exactEndTime = new Date(now);
        exactEndTime.setHours(endH, endM, 0, 0);

        // Закрываем смену
        await this.prisma.shift.update({
          where: { id: shift.id },
          data: {
            status: 'COMPLETED',
            actualEndTime: exactEndTime, 
          }
        });
        
        closedCount++;
        this.logger.log(`Смена ${shift.id} закрыта роботом ровно в ${shift.endTime}.`);
      }
    }

    if (closedCount > 0) {
      this.logger.log(`Робот успешно завершил ${closedCount} смен по расписанию.`);
    }
  }

  async assignShift(dto: CreateShiftDto, managerId: string) {
    return this.prisma.shift.create({
      data: {
        employeeId: dto.employeeId,
        department: dto.department,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,    
        createdById: managerId,  
      },
    });
  }

  async getAllShifts() {
    return this.prisma.shift.findMany({
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: {
        employee: { select: { fullName: true, position: true, avatarUrl: true } }, 
        createdBy: { select: { fullName: true } } 
      },
    });
  }

  async getMyShifts(userId: string) {
    return this.prisma.shift.findMany({
      where: { employeeId: userId }, 
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async getEmployees() {
    return this.prisma.user.findMany({
      select: { id: true, fullName: true, role: true, position: true, avatarUrl: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async updateShiftStatus(shiftId: string, status: 'IN_PROGRESS' | 'COMPLETED', userId: string) {
    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('Смена не найдена');
    if (shift.employeeId !== userId) throw new ForbiddenException('Это не ваша смена!');

    const updateData: any = { status };
    if (status === 'IN_PROGRESS') updateData.actualStartTime = new Date();
    if (status === 'COMPLETED') updateData.actualEndTime = new Date();

    return this.prisma.shift.update({ where: { id: shiftId }, data: updateData });
  }

  async requestSwap(shiftId: string, userId: string) {
    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('Смена не найдена');
    if (shift.employeeId !== userId) throw new ForbiddenException('Вы не можете отдать чужую смену!');
    if (shift.status !== 'SCHEDULED') throw new ForbiddenException('Нельзя отдать начатую смену!');

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: { isLookingForSwap: true },
    });
  }

  async getAvailableSwaps() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.shift.findMany({
      where: { 
        isLookingForSwap: true, 
        date: { gte: today },
        status: 'SCHEDULED' 
      },
      include: { 
        employee: { select: { fullName: true, avatarUrl: true } } 
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async takeSwap(shiftId: string, newUserId: string) {
    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('Смена не найдена');
    if (!shift.isLookingForSwap) throw new ForbiddenException('Эта смена больше не доступна на бирже');

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: { 
        employeeId: newUserId,      
        isLookingForSwap: false    
      },
    });
  }

  // ДОБАВЛЕНО: ЛОГИКА УЧЕТА И ЗАРПЛАТ (ACCOUNTING)

  async getAccountingData(year: number, month: number) {
    // Определяем начало и конец выбранного месяца
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Достаем всех активных сотрудников с их завершенными сменами за этот месяц
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true, fullName: true, position: true, role: true, avatarUrl: true, hourlyRate: true,
        shifts: {
          where: {
            status: 'COMPLETED',
            date: { gte: startDate, lte: endDate }
          },
          select: { actualStartTime: true, actualEndTime: true, startTime: true, endTime: true }
        }
      },
      orderBy: { fullName: 'asc' }
    });

    // Считаем часы и зарплату для каждого
    return users.map(user => {
      let totalHours = 0;
      
      user.shifts.forEach(shift => {
        let startH, startM, endH, endM;
        if (shift.actualStartTime && shift.actualEndTime) {
          const actStart = new Date(shift.actualStartTime);
          const actEnd = new Date(shift.actualEndTime);
          startH = actStart.getHours(); startM = actStart.getMinutes();
          endH = actEnd.getHours(); endM = actEnd.getMinutes();
        } else {
          [startH, startM] = shift.startTime.split(':').map(Number);
          [endH, endM] = shift.endTime.split(':').map(Number);
        }
        let durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        if (durationMinutes < 0) durationMinutes += 24 * 60;
        
        totalHours += Math.round((durationMinutes / 60) * 10) / 10;
      });

      return {
        id: user.id,
        fullName: user.fullName,
        position: user.position,
        role: user.role,
        avatarUrl: user.avatarUrl,
        hourlyRate: user.hourlyRate,
        totalHours,
        totalSalary: Math.round(totalHours * user.hourlyRate)
      };
    });
  }

  async updateHourlyRate(userId: string, rate: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { hourlyRate: rate }
    });
  }
}