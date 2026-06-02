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
import { ToolService } from './tool.service';
import { BatchSetToolsActiveDto } from './dto/batch-set-tools-active.dto';
import { CreateToolDto } from './dto/create-tool.dto';
import { DebugToolDto } from './dto/debug-tool.dto';
import { InitToolSchemasFromDebugDto } from './dto/init-tool-schemas-from-debug.dto';
import { ImportToolsFromSwaggerDto } from './dto/import-tools-from-swagger.dto';
import { QueryToolDto } from './dto/query-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';

@ApiTags('tool')
@ApiBearerAuth()
@Controller('tool')
export class ToolController {
  constructor(private readonly service: ToolService) {}

  @Post()
  @ApiOperation({ summary: '创建工具' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() body: CreateToolDto) {
    return this.service.create(body);
  }

  @Get()
  @ApiOperation({
    summary: '分页查询工具列表',
    description:
      '支持分页与字段筛选。每条记录返回完整关联：appClient、toolCategory（类目 label 同时出现在 tags 数组）、integration、agentTools/skillTools/roleTools 及嵌套实体。',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  findPage(@Query() query: QueryToolDto) {
    return this.service.findPage(query);
  }

  @Get('by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number, description: 'AppClient ID' })
  @ApiOperation({
    summary: '按 AppClient ID 分页查询工具列表',
    description:
      '返回指定 appClient 下的工具，支持分页、排序及 name/keyword/integrationId 等筛选。路径中的 appClientId 优先于 Query 中的同名参数。',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  findByAppClient(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryToolDto,
  ) {
    return this.service.findPageByAppClientId(appClientId, query);
  }

  @Post('by-app-client/:appClientId/:id/debug/init-schemas')
  @UseGuards(AdminRoleGuard)
  @AdminRoles(AdminRole.OPERATOR)
  @ApiParam({ name: 'appClientId', type: Number, description: 'AppClient ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Tool ID' })
  @ApiOperation({
    summary: '调试 Tool 并由大模型初始化 outputSchema / responseProfile',
    description:
      '先按工具配置发起真实 HTTP 调试请求；成功后调用大模型根据响应样本推断 outputSchema 与 responseProfile，并默认写回该 Tool（persist=true）。工具必须属于路径中的 appClientId。',
  })
  @ApiResponse({ status: 200, description: '推断并更新成功' })
  initSchemasFromDebug(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: InitToolSchemasFromDebugDto,
  ) {
    return this.service.initSchemasFromDebug(appClientId, id, body);
  }

  @Post('import/swagger')
  @UseGuards(AdminRoleGuard)
  @AdminRoles(AdminRole.OPERATOR)
  @ApiOperation({
    summary: '从 Swagger/OpenAPI URL 导入工具',
    description:
      '拉取 OpenAPI 文档并 upsert Tool、ToolCategory、RoleTool（与 swagger-tool-cli --apply 逻辑一致）。风险等级按 HTTP 方法自动设置：GET=L1，POST/PUT/PATCH=L2，DELETE=L3。未传 tags/ops/pathInclude 时导入 path 过滤后的全部接口（默认排除 public、buyer）。',
  })
  @ApiResponse({ status: 201, description: '导入完成' })
  importFromSwagger(@Body() body: ImportToolsFromSwaggerDto) {
    return this.service.importFromSwagger(body);
  }

  @Patch('batch/status')
  @UseGuards(AdminRoleGuard)
  @AdminRoles(AdminRole.OPERATOR)
  @ApiOperation({
    summary: '批量更新工具启用状态',
    description:
      '统一设置 isActive：true 批量启用，false 批量禁用。不存在的 ID 会出现在 notFoundIds 中。',
  })
  @ApiResponse({ status: 200, description: '批量更新完成' })
  batchSetActive(@Body() body: BatchSetToolsActiveDto) {
    return this.service.batchSetActive(body);
  }

  @Post(':id/debug')
  @UseGuards(AdminRoleGuard)
  @AdminRoles(AdminRole.OPERATOR)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({
    summary: '调试 Tool HTTP 调用',
    description:
      '按工具配置的 method/path/integration 发起真实请求。可传 parameters（path/query/body）、headers、apiKey、timeoutMs。返回请求与响应详情（敏感头已脱敏）。',
  })
  @ApiResponse({ status: 200, description: '调试完成（HTTP 非 2xx 时 ok 为 false，仍返回 200）' })
  debug(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: DebugToolDto,
  ) {
    return this.service.debug(id, body);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '按 ID 查询工具' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '按 ID 更新工具' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateToolDto,
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '按 ID 删除工具' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
