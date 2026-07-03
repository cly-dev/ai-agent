import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AdminRole } from '../../../generated/prisma/client';
import { AdminRoles } from '../../auth/admin-roles.decorator';
import { AdminRoleGuard } from '../../auth/admin-role.guard';
import {
  AUTH_THROTTLE_LIMIT,
  AUTH_THROTTLE_TTL_SECONDS,
} from '../../auth/auth-throttle.constants';
import { AdminUserService } from './admin-user.service';
import { AdminUserProfileDto } from './dto/admin-user-profile.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { LoginAdminUserDto } from './dto/login-admin-user.dto';
import { QueryAdminUserDto } from './dto/query-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

type AdminAuthedRequest = Request & {
  user?: { userId?: number; adminRole?: AdminRole };
};

@ApiTags('admin-user')
@Controller('admin-user')
@UseGuards(AdminRoleGuard)
export class AdminUserController {
  constructor(private readonly service: AdminUserService) {}

  private actor(req: AdminAuthedRequest): {
    userId: number;
    adminRole: AdminRole | undefined;
  } {
    const userId = req.user?.userId;
    if (userId == null) {
      throw new UnauthorizedException('missing admin user context');
    }
    return { userId, adminRole: req.user?.adminRole };
  }

  @Post('login')
  @Throttle(AUTH_THROTTLE_LIMIT, AUTH_THROTTLE_TTL_SECONDS)
  @ApiOperation({ summary: '管理员登录' })
  @ApiResponse({ status: 200, description: '登录成功并返回 JWT Token' })
  @ApiResponse({ status: 401, description: '邮箱或密码错误' })
  login(@Body() body: LoginAdminUserDto) {
    return this.service.login(body);
  }

  @Get('me')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.VIEWER)
  @ApiOperation({
    summary: '获取当前登录管理员信息',
    description:
      '需 `Authorization: Bearer <管理员 JWT>`。AppClient `http_profile` 鉴权可将本接口作为 profilePath（见 app-client id=2 配置）。',
  })
  @ApiResponse({ status: 200, type: AdminUserProfileDto })
  @ApiResponse({ status: 401, description: 'Token 无效或管理员不可用' })
  getMe(@Req() req: AdminAuthedRequest) {
    return this.service.getProfileByUserId(this.actor(req).userId);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.VIEWER)
  @ApiOperation({ summary: '修改当前管理员密码' })
  @ApiResponse({ status: 200, description: '修改成功' })
  changePassword(
    @Req() req: AdminAuthedRequest,
    @Body() body: ChangeAdminPasswordDto,
  ) {
    return this.service.changePassword(this.actor(req).userId, body);
  }

  @Get()
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: '分页查询管理员列表（仅 SUPER_ADMIN）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findPage(@Req() req: AdminAuthedRequest, @Query() query: QueryAdminUserDto) {
    return this.service.findPage(query, this.actor(req).adminRole);
  }

  @Post()
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '创建管理员（仅 SUPER_ADMIN）',
    description: '返回一次性初始密码 generatedPassword，请私下发给同事。',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Req() req: AdminAuthedRequest, @Body() body: CreateAdminUserDto) {
    return this.service.create(body, this.actor(req).adminRole);
  }

  @Get(':id')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '查询管理员详情（仅 SUPER_ADMIN）' })
  findOne(@Req() req: AdminAuthedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, this.actor(req).adminRole);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '更新管理员（仅 SUPER_ADMIN）' })
  update(
    @Req() req: AdminAuthedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAdminUserDto,
  ) {
    const actor = this.actor(req);
    return this.service.update(id, body, actor);
  }

  @Post(':id/reset-password')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({
    summary: '重置管理员密码（仅 SUPER_ADMIN）',
    description: '返回一次性新密码 generatedPassword。',
  })
  resetPassword(
    @Req() req: AdminAuthedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.resetPassword(id, this.actor(req).adminRole);
  }
}
