// src/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Указываем, что токен нужно брать из заголовка Authorization (как Bearer токен)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, 
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret', // Наш секретный ключ
    });
  }

  // Эта функция сработает автоматически, если токен прошел проверку!
  async validate(payload: any) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}