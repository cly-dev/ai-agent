import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserJwtAuthGuard } from '../../auth/user-jwt-auth.guard';
import {
  AUTH_THROTTLE_LIMIT,
  AUTH_THROTTLE_TTL_SECONDS,
} from '../../auth/auth-throttle.constants';
import { UserService } from './user.service';
import { LoginUserDto } from './dto/login-user.dto';

/** C 端：登录与自助能力（`/user/login`、`/user/password-reminder` 无 `/admin` 前缀）。 */
@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post('login')
  @Throttle(AUTH_THROTTLE_LIMIT, AUTH_THROTTLE_TTL_SECONDS)
  @ApiOperation({ summary: '业务用户登录' })
  @ApiResponse({ status: 200, description: '登录成功并返回 JWT Token' })
  @ApiResponse({ status: 401, description: '邮箱或密码错误' })
  login(@Body() body: LoginUserDto) {
    return this.service.login(body);
  }

  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '检查是否需要首次修改密码（业务用户 Token）' })
  @ApiResponse({ status: 200, description: '返回密码提醒状态' })
  @Get('password-reminder')
  getPasswordReminder(@Req() req: Request & { user?: { userId?: number } }) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('invalid user token');
    }
    return this.service.getPasswordReminder(userId);
  }
}
