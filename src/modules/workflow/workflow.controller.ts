import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  QueryWorkflowDto,
  QueryWorkflowRevisionsDto,
} from './dto/workflow.dto';
import { WorkflowService } from './workflow.service';
import type { WorkflowProfile } from '../../core/workflow/workflow.types';
import { AdminRoles } from '../../auth/admin-roles.decorator';
import { AdminRole } from '../../../generated/prisma/client';

/**
 * Legacy Workflow **归档** API（只读 + 删除）。
 * 配置真源已迁 `/admin/flow`；禁止新建/更新 Workflow。
 */
@ApiTags('workflow')
@ApiBearerAuth()
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  @Get('presets/catalog')
  @ApiOperation({
    summary: '【归档】Preset 目录（请改用 GET /flow/presets/catalog）',
    deprecated: true,
  })
  listPresets(@Query('profile') profile?: WorkflowProfile) {
    return this.service.listPresets(profile);
  }

  @Get('by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({
    summary: '【归档】分页查询仍存库的 legacy Workflow',
    description: '用于迁移候选对照；新配置勿依赖本列表。',
  })
  findPage(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryWorkflowDto,
  ) {
    return this.service.findPage({ ...query, appClientId });
  }

  @Get(':id/revisions/:version')
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'version', type: Number, description: 'revision 版本号' })
  @ApiOperation({ summary: '查看 Workflow 指定版本快照' })
  findRevision(
    @Param('id', ParseIntPipe) id: number,
    @Param('version', ParseIntPipe) version: number,
  ) {
    return this.service.findRevision(id, version);
  }

  @Get(':id/revisions')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({
    summary: 'Workflow revision 历史',
    description:
      '默认返回完整快照；summary=true 时仅返回版本元数据，适合版本下拉。',
  })
  listRevisions(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryWorkflowRevisionsDto,
  ) {
    return this.service.listRevisions(id, query);
  }

  @Delete(':id')
  @AdminRoles(AdminRole.OPERATOR)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '删除 legacy Workflow' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Workflow 详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
