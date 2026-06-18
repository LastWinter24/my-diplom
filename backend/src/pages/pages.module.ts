import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PagesController],
  providers: [PrismaService],
})
export class PagesModule {}