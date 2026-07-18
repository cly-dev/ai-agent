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
  ApiTags,
} from '@nestjs/swagger';
import { AdminRoles } from '../../auth/admin-roles.decorator';
import { AdminRole } from '../../../generated/prisma/client';
import {
  CreateFlowDto,
  MigrateFlowFromWorkflowDto,
  AllocateWorkflowIntentStateKeysDto,
  QueryFlowDto,
  QueryFlowPresetCatalogDto,
  QueryFlowRevisionsDto,
  UpdateFlowDto,
} from './dto/flow.dto';
import { FlowService } from './flow.service';

@ApiTags('flow')
@ApiBearerAuth()
@Controller('flow')
@AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
export class FlowController {
  constructor(private readonly service: FlowService) {}

  @Post()
  @ApiOperation({ summary: '创建 Flow（Intent SSOT → 编译 IR）' })
  create(@Body() body: CreateFlowDto) {
    return this.service.create(body);
  }

  @Post('intent/state-keys')
  @ApiOperation({
    summary: '分配 Intent state.key',
    description:
      '画布「当…」边：运营填状态名称，服务端按与 slugWorkflowIntentStateKey 相同算法生成不重复 key。',
  })
  allocateStateKeys(@Body() body: AllocateWorkflowIntentStateKeysDto) {
    return this.service.allocateIntentStateKeys(body.labels);
  }

  @Post('migrate-from-workflow/:workflowId')
  @ApiParam({ name: 'workflowId', type: Number })
  @ApiOperation({
    summary: 'Legacy Workflow → Flow',
    description:
      '从 Workflow.nodes 启发式推断 Intent，创建 Flow；可选改绑 Skill/PageAction 并停用源 Workflow。建议先调 preview。',
  })
  migrateFromWorkflow(
    @Param('workflowId', ParseIntPipe) workflowId: number,
    @Body() body: MigrateFlowFromWorkflowDto,
  ) {
    return this.service.migrateFromWorkflow(workflowId, body);
  }

  @Get('migrate-from-workflow/:workflowId/preview')
  @ApiParam({ name: 'workflowId', type: Number })
  @ApiOperation({
    summary: '迁移预览（不写库）',
    description:
      '返回推断 Intent、warnings、将改绑的 Skill/PageAction 数量、flowKey 是否可用。',
  })
  previewMigrateFromWorkflow(
    @Param('workflowId', ParseIntPipe) workflowId: number,
    @Query('flowKey') flowKey?: string,
  ) {
    return this.service.previewMigrateFromWorkflow(workflowId, flowKey);
  }

  @Get('migration-candidates')
  @ApiOperation({
    summary: '待迁移 legacy Workflow 列表',
    description:
      '返回仍被 Skill / PageAction 引用的 Workflow，供迁移页使用。',
  })
  listMigrationCandidates(
    @Query('appClientId', ParseIntPipe) appClientId: number,
  ) {
    return this.service.listMigrationCandidates({ appClientId });
  }

  @Get('presets/catalog')
  @ApiOperation({
    summary: 'Flow 场景 Preset 目录',
    description: '仅三张产品卡：页内回填 / 拉数作答 / 变更提交。',
  })
  listPresets(@Query() query: QueryFlowPresetCatalogDto) {
    return this.service.listPresets(query.profile);
  }

  @Get('by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({ summary: '分页查询 App 下 Flow' })
  findPage(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryFlowDto,
  ) {
    return this.service.findPage({ ...query, appClientId });
  }

  @Get(':id/revisions/:version')
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'version', type: Number })
  @ApiOperation({ summary: '查看 Flow 指定版本（intent + ir）' })
  findRevision(
    @Param('id', ParseIntPipe) id: number,
    @Param('version', ParseIntPipe) version: number,
  ) {
    return this.service.findRevision(id, version);
  }

  @Get(':id/revisions')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({
    summary: 'Flow revision 历史',
    description:
      '默认返回完整 intent/ir；summary=true 时仅版本元数据。',
  })
  listRevisions(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryFlowRevisionsDto,
  ) {
    return this.service.listRevisions(id, query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Flow 详情（含 intent + ir）' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '更新 Flow' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateFlowDto,
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '删除 Flow' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
