// src/shifts/dto/create-shift.dto.ts
import { IsDateString, IsString } from 'class-validator';

export class CreateShiftDto {
  @IsString({ message: 'ID сотрудника должен быть строкой' })
  employeeId!: string; 

  @IsString()
  department!: string; 

  @IsDateString({}, { message: 'Некорректный формат даты' })
  date!: string; 

  @IsString()
  startTime!: string; 

  @IsString()
  endTime!: string; 
}