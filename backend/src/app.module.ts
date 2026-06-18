// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule'; 
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NewsModule } from './news/news.module';
import { ShiftsModule } from './shifts/shifts.module';
import { TasksModule } from './tasks/tasks.module';
import { ProfileController } from './profile/profile.controller';
import { PagesModule } from './pages/pages.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ScheduleModule.forRoot(), 
    PrismaModule, 
    AuthModule, 
    NewsModule, 
    ShiftsModule, 
    TasksModule,
    PagesModule,
  ],
  controllers: [ProfileController],
  providers: [],
})
export class AppModule {}