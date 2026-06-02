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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateRoleDto } from './dto/create-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleService } from './role.service';

@ApiTags('role')
@ApiBearerAuth()
@Controller('role')
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Post()
  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() body: CreateRoleDto) {
    return this.service.create(body);
  }

  @Get()
  @ApiOperation({ summary: '分页查询角色列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findPage(@Query() query: QueryRoleDto) {
    return this.service.findPage(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '按 ID 查询角色' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '按 ID 更新角色' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateRoleDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '按 ID 删除角色' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
