// src/news/dto/create-news.dto.ts
import { IsString, MinLength } from 'class-validator';

export class CreateNewsDto {
  @IsString()
  @MinLength(3, { message: 'Заголовок должен быть не короче 3 символов' })
  title!: string;

  @IsString()
  @MinLength(10, { message: 'Текст новости должен быть не короче 10 символов' })
  content!: string;
}