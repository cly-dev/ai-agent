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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateUserModelConfigDto } from './dto/create-user-model-config.dto';
import { UpdateUserModelConfigDto } from './dto/update-user-model-config.dto';
import { UserModelConfigService } from './user-model-config.service';

@ApiTags('user-model-config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user-model-config')
export class UserModelConfigController {
  constructor(private readonly service: UserModelConfigService) {}

  @Post()
  @ApiOperation({ summary: '创建用户模型配置' })
  @ApiResponse({ status: 201, description: '配置创建成功' })
  create(@Body() body: CreateUserModelConfigDto) {
    return this.service.create(body);
  }

  @Get()
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiOperation({ summary: '查询模型配置列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.service.findByUser(Number(userId));
    }
    return this.service.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '查询单个模型配置' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '配置不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '更新模型配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '配置不存在' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserModelConfigDto,
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '删除模型配置' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '配置不存在' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
