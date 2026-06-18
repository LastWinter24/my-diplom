// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Ищем, какие роли требуются для этого маршрута
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // Если декоратора @Roles нет, значит доступ разрешен всем авторизованным
    if (!requiredRoles) {
      return true; 
    }
    
    // Достаем пользователя из запроса (его туда положил наш JwtStrategy)
    const { user } = context.switchToHttp().getRequest();
    
    // Проверяем, есть ли роль пользователя в списке разрешенных
    return requiredRoles.includes(user.role);
  }
}