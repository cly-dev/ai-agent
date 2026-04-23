import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminRoleGuard } from './admin-role.guard';
import { jwtConstants } from './constants';
import { JwtStrategy } from './jwt.strategy';
import { UserJwtAuthGuard } from './user-jwt-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn },
    }),
  ],
  providers: [JwtStrategy, AdminRoleGuard, UserJwtAuthGuard],
  exports: [JwtModule, PassportModule, AdminRoleGuard, UserJwtAuthGuard],
})
export class AuthModule {}
