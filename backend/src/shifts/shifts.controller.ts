// backend/src/shifts/shifts.controller.ts
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard) 
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPER_ADMIN)
  @Post('assign')
  assignShift(@Body() dto: CreateShiftDto, @Request() req: any) {
    return this.shiftsService.assignShift(dto, req.user.id); 
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPER_ADMIN)
  @Get('all')
  getAllShifts() {
    return this.shiftsService.getAllShifts();
  }

  @Get('my')
  getMyShifts(@Request() req: any) {
    return this.shiftsService.getMyShifts(req.user.id);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPER_ADMIN)
  @Get('employees')
  getEmployees() {
    return this.shiftsService.getEmployees();
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'IN_PROGRESS' | 'COMPLETED',
    @Request() req: any
  ) {
    return this.shiftsService.updateShiftStatus(id, status, req.user.id);
  }

  @Get('exchange')
  getAvailableSwaps() {
    return this.shiftsService.getAvailableSwaps();
  }

  @Patch(':id/swap-request')
  requestSwap(@Param('id') id: string, @Request() req: any) {
    return this.shiftsService.requestSwap(id, req.user.id);
  }

  @Patch(':id/take')
  takeSwap(@Param('id') id: string, @Request() req: any) {
    return this.shiftsService.takeSwap(id, req.user.id);
  }

  // Получить сводку по часам и ЗП за выбранный месяц
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPER_ADMIN)
  @Get('accounting')
  getAccountingData(@Query('year') year: string, @Query('month') month: string) {
    return this.shiftsService.getAccountingData(Number(year), Number(month));
  }

  // Изменить почасовую ставку сотрудника
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPER_ADMIN)
  @Patch('accounting/:userId/rate')
  updateHourlyRate(@Param('userId') userId: string, @Body('rate') rate: number) {
    return this.shiftsService.updateHourlyRate(userId, rate);
  }
}