import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminRole } from '../../../generated/prisma/client';
import { AdminRoles } from '../../auth/admin-roles.decorator';
import { AdminRoleGuard } from '../../auth/admin-role.guard';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/** B 端：业务用户管理（路径 `/admin/user/*`，需管理员 JWT + AdminRole）。 */
@ApiTags('admin-user')
@ApiBearerAuth()
@Controller('user')
@UseGuards(AdminRoleGuard)
export class UserAdminController {
  constructor(private readonly service: UserService) {}

  @Post()
  @AdminRoles(AdminRole.OPERATOR)
  @ApiOperation({ summary: '创建业务用户' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() body: CreateUserDto) {
    return this.service.create(body);
  }

  @Get()
  @AdminRoles(AdminRole.VIEWER)
  @ApiOperation({ summary: '查询业务用户列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @AdminRoles(AdminRole.VIEWER)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '查询单个业务用户' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @AdminRoles(AdminRole.OPERATOR)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '更新业务用户' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @AdminRoles(AdminRole.OPERATOR)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '删除业务用户' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
