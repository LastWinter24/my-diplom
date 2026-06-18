// src/tasks/dto/create-task.dto.ts
import { IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { FeedbackType, FeedbackPriority } from '@prisma/client';

export class CreateTaskDto {
  @IsEnum(FeedbackType, { message: 'Неверный тип: нужно SUGGESTION, GRATITUDE или PROBLEM' })
  type!: FeedbackType;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsEnum(FeedbackPriority)
  priority?: FeedbackPriority; 

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean; 
}