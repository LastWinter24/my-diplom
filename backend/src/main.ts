// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Разрешаем фронтенду делать запросы к нашему API
  app.enableCors(); 
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();