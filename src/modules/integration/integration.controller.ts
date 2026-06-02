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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminRole } from '../../../generated/prisma/client';
import { AdminRoles } from '../../auth/admin-roles.decorator';
import { AdminRoleGuard } from '../../auth/admin-role.guard';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { QueryIntegrationDto } from './dto/query-integration.dto';
import {
  TestIntegrationConnectionByUrlDto,
  TestIntegrationConnectionDto,
} from './dto/test-integration-connection.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { IntegrationService } from './integration.service';

@ApiTags('integration')
@ApiBearerAuth()
@Controller('integration')
@UseGuards(AdminRoleGuard)
export class IntegrationController {
  constructor(private readonly service: IntegrationService) {}

  @Post()
  @AdminRoles(AdminRole.OPERATOR)
  @ApiOperation({ summary: '创建 Integration' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() body: CreateIntegrationDto) {
    return this.service.create(body);
  }

  @Get()
  @AdminRoles(AdminRole.VIEWER)
  @ApiOperation({
    summary: '分页查询 Integration 列表',
    description:
      '支持分页与字段筛选。每条记录返回 appClient、tools 关联及 systemConfigured 字段。',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  findPage(@Query() query: QueryIntegrationDto) {
    return this.service.findPage(query);
  }

  @Get('by-app-client/:appClientId')
  @AdminRoles(AdminRole.VIEWER)
  @ApiParam({ name: 'appClientId', type: Number, description: 'AppClient ID' })
  @ApiOperation({
    summary: '按 AppClient ID 分页查询 Integration 列表',
    description:
      '返回指定 appClient 下的 Integration，支持分页、排序及 name/baseUrl/keyword 等筛选。',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  findByAppClient(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryIntegrationDto,
  ) {
    return this.service.findPageByAppClientId(appClientId, query);
  }

  @Post('test-connection')
  @AdminRoles(AdminRole.OPERATOR)
  @ApiOperation({
    summary: '探测 baseUrl 是否可访问（未保存配置）',
    description:
      '对请求体中的 baseUrl 发起 HTTP 探测，可选 apiKey 作为 Bearer。用于创建/编辑表单保存前校验。',
  })
  @ApiResponse({ status: 200, description: '探测完成（reachable 为 false 时仍为 200）' })
  testConnectionByUrl(@Body() body: TestIntegrationConnectionByUrlDto) {
    return this.service.testConnection({
      baseUrl: body.baseUrl,
      apiKey: body.apiKey,
    });
  }

  @Post(':id/test-connection')
  @AdminRoles(AdminRole.OPERATOR)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({
    summary: '探测已保存 Integration 的 baseUrl 是否可访问',
    description:
      '默认使用库中 baseUrl / apiKey；请求体可临时覆盖。返回是否可达、HTTP 状态与耗时。',
  })
  @ApiResponse({ status: 200, description: '探测完成' })
  testConnectionById(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: TestIntegrationConnectionDto,
  ) {
    return this.service.testConnection({ id, ...body });
  }

  @Get(':id')
  @AdminRoles(AdminRole.VIEWER)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '按 ID 查询 Integration' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @AdminRoles(AdminRole.OPERATOR)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '按 ID 更新 Integration' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateIntegrationDto,
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @AdminRoles(AdminRole.OPERATOR)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '按 ID 删除 Integration' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
