import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminRole } from '../../generated/prisma/client';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: {
    sub: number;
    email: string;
    username: string;
    adminRole?: AdminRole;
  }) {
    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
      adminRole: payload.adminRole,
    };
  }
}
