import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { UserService } from './user.service';
import { UserAdminController } from './user-admin.controller';
import { UserController } from './user.controller';

@Module({
  imports: [AuthModule],
  providers: [UserService],
  controllers: [UserController, UserAdminController],
  exports: [UserService],
})
export class UserModule {}
